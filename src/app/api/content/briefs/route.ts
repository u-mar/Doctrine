import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get("includeHidden") === "true";
    const rows = await prisma.journalEntry.findMany({
      where: includeHidden ? {} : { hidden: false },
      orderBy: { slug: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.legacyId ?? 0,
        slug: r.slug,
        title: r.title,
        date: r.dateLabel,
        topic: r.topic,
        excerpt: r.excerpt,
        content: r.content,
        hidden: r.hidden,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load journal" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureContentSeeded();
    const body = (await request.json()) as {
      id?: number;
      slug: string;
      title: string;
      date: string;
      topic: string;
      excerpt: string;
      content: string;
    };
    const slug = body.slug?.trim();
    if (!slug || !body.title?.trim()) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }
    const maxLegacy = await prisma.journalEntry.aggregate({ _max: { legacyId: true } });
    const nextLegacyId =
      typeof body.id === "number" && body.id > 0
        ? body.id
        : (maxLegacy._max.legacyId ?? 0) + 1;
    const created = await prisma.journalEntry.create({
      data: {
        slug,
        legacyId: nextLegacyId,
        title: body.title.trim(),
        dateLabel: body.date?.trim() ?? "",
        topic: body.topic?.trim() ?? "",
        excerpt: body.excerpt?.trim() ?? "",
        content: body.content?.trim() ?? "",
        hidden: false,
      },
    });
    return NextResponse.json({
      id: created.legacyId ?? 0,
      slug: created.slug,
      title: created.title,
      date: created.dateLabel,
      topic: created.topic,
      excerpt: created.excerpt,
      content: created.content,
      hidden: created.hidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create journal entry" },
      { status: 500 }
    );
  }
}

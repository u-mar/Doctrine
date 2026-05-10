import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function GET(request: Request) {
  try {
    await ensureContentSeeded();
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get("includeHidden") === "true";
    const rows = await prisma.ideaEntry.findMany({
      where: includeHidden ? {} : { hidden: false },
      orderBy: { slug: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        readingTime: r.readingTime,
        date: r.dateLabel,
        topic: r.topic,
        content: r.content,
        hidden: r.hidden,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureContentSeeded();
    const body = (await request.json()) as {
      slug: string;
      title: string;
      summary: string;
      readingTime: string;
      date: string;
      topic: string;
      content: string;
    };
    const slug = body.slug?.trim();
    if (!slug || !body.title?.trim()) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }
    const created = await prisma.ideaEntry.create({
      data: {
        slug,
        title: body.title.trim(),
        summary: body.summary?.trim() ?? "",
        readingTime: body.readingTime?.trim() ?? "",
        dateLabel: body.date?.trim() ?? "",
        topic: body.topic?.trim() ?? "",
        content: body.content?.trim() ?? "",
        hidden: false,
      },
    });
    return NextResponse.json({
      slug: created.slug,
      title: created.title,
      summary: created.summary,
      readingTime: created.readingTime,
      date: created.dateLabel,
      topic: created.topic,
      content: created.content,
      hidden: created.hidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create idea" },
      { status: 500 }
    );
  }
}

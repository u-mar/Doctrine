import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitContentPages } from "@/lib/content/page-break";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureContentSeeded();
    const { slug } = await context.params;
    const row = await prisma.journalEntry.findFirst({
      where: { slug, hidden: false },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pages = splitContentPages(row.content);

    return NextResponse.json({
      id: row.legacyId ?? 0,
      slug: row.slug,
      title: row.title,
      date: row.dateLabel,
      topic: row.topic,
      excerpt: row.excerpt,
      content: pages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load journal entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureContentSeeded();
    const { slug } = await context.params;
    await prisma.journalEntry.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete brief" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureContentSeeded();
    const { slug } = await context.params;
    const body = (await request.json()) as Partial<{
      title: string;
      date: string;
      topic: string;
      excerpt: string;
      content: string;
      hidden: boolean;
    }>;

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.date !== undefined) data.dateLabel = body.date;
    if (body.topic !== undefined) data.topic = body.topic;
    if (body.excerpt !== undefined) data.excerpt = body.excerpt;
    if (body.content !== undefined) data.content = body.content;
    if (body.hidden !== undefined) data.hidden = body.hidden;

    const updated = await prisma.journalEntry.update({
      where: { slug },
      data,
    });

    const updatedPages = splitContentPages(updated.content);

    return NextResponse.json({
      id: updated.legacyId ?? 0,
      slug: updated.slug,
      title: updated.title,
      date: updated.dateLabel,
      topic: updated.topic,
      excerpt: updated.excerpt,
      content: updatedPages,
      hidden: updated.hidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update journal entry" },
      { status: 500 }
    );
  }
}

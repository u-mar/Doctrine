import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureContentSeeded();
    const { slug } = await context.params;
    const row = await prisma.ideaEntry.findFirst({
      where: { slug, hidden: false },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pages = row.content.split("\n---\n");

    return NextResponse.json({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      readingTime: row.readingTime,
      date: row.dateLabel,
      topic: row.topic,
      content: pages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load idea" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureContentSeeded();
    const { slug } = await context.params;
    await prisma.ideaEntry.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete idea" },
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
      summary: string;
      readingTime: string;
      date: string;
      topic: string;
      content: string;
      hidden: boolean;
    }>;

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.readingTime !== undefined) data.readingTime = body.readingTime;
    if (body.date !== undefined) data.dateLabel = body.date;
    if (body.topic !== undefined) data.topic = body.topic;
    if (body.content !== undefined) data.content = body.content;
    if (body.hidden !== undefined) data.hidden = body.hidden;

    const updated = await prisma.ideaEntry.update({
      where: { slug },
      data,
    });

    const updatedPages = updated.content.split("\n---\n");

    return NextResponse.json({
      slug: updated.slug,
      title: updated.title,
      summary: updated.summary,
      readingTime: updated.readingTime,
      date: updated.dateLabel,
      topic: updated.topic,
      content: updatedPages,
      hidden: updated.hidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update idea" },
      { status: 500 }
    );
  }
}

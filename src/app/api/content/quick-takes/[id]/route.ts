import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureContentSeeded();
    const { id } = await context.params;
    const legacyId = Number.parseInt(id, 10);
    if (Number.isNaN(legacyId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<{
      content: string;
      date: string;
      topic: string;
      hidden: boolean;
    }>;

    const data: Record<string, unknown> = {};
    if (body.content !== undefined) data.content = body.content;
    if (body.date !== undefined) data.dateLabel = body.date;
    if (body.topic !== undefined) data.topic = body.topic;
    if (body.hidden !== undefined) data.hidden = body.hidden;

    const updated = await prisma.quickTakeEntry.update({
      where: { legacyId },
      data,
    });

    return NextResponse.json({
      id: updated.legacyId ?? 0,
      content: updated.content,
      date: updated.dateLabel,
      topic: updated.topic,
      hidden: updated.hidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update quick take" },
      { status: 500 }
    );
  }
}

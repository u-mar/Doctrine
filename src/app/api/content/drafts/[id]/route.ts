import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";
import {
  clientDraftKindToPrisma,
  clientDraftStatusToPrisma,
  prismaDraftKindToClient,
  prismaDraftStatusToClient,
} from "@/lib/content/draft-map";

function mapDraft(d: {
  id: string;
  kind: import("@prisma/client").DraftKind;
  title: string;
  topic: string;
  note: string;
  status: import("@prisma/client").DraftStatus;
  visibility: string;
  scheduledFor: Date | null;
  createdAt: Date;
}) {
  return {
    id: d.id,
    kind: prismaDraftKindToClient(d.kind),
    title: d.title,
    topic: d.topic,
    note: d.note,
    status: prismaDraftStatusToClient(d.status),
    visibility: d.visibility,
    scheduledFor: d.scheduledFor ? d.scheduledFor.toISOString().slice(0, 16) : "",
    createdAt: d.createdAt.toLocaleString(),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureContentSeeded();
    const { id } = await context.params;
    const draft = await prisma.draft.findFirst({
      where: { id },
    });
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json(mapDraft(draft));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureContentSeeded();
    const { id } = await context.params;
    const body = (await request.json()) as Partial<{
      kind: string;
      title: string;
      topic: string;
      note: string;
      status: string;
      visibility: string;
      scheduledFor: string;
    }>;

    const data: Record<string, unknown> = {};
    if (body.kind !== undefined) data.kind = clientDraftKindToPrisma(body.kind as "idea" | "journal" | "quick-take");
    if (body.title !== undefined) data.title = body.title;
    if (body.topic !== undefined) data.topic = body.topic;
    if (body.note !== undefined) data.note = body.note;
    if (body.status !== undefined) {
      data.status = clientDraftStatusToPrisma(body.status as "draft" | "review" | "scheduled" | "published");
    }
    if (body.visibility !== undefined) data.visibility = body.visibility;
    if (body.scheduledFor !== undefined) {
      data.scheduledFor =
        body.scheduledFor && body.scheduledFor.trim() !== "" ? new Date(body.scheduledFor) : null;
    }

    const updated = await prisma.draft.update({
      where: { id },
      data,
    });
    return NextResponse.json(mapDraft(updated));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureContentSeeded();
    const { id } = await context.params;
    await prisma.draft.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete draft" },
      { status: 500 }
    );
  }
}

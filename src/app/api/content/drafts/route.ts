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

export async function GET() {
  try {
    await ensureContentSeeded();
    const rows = await prisma.draft.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map(mapDraft));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load drafts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureContentSeeded();
    const body = (await request.json()) as {
      kind: string;
      title: string;
      topic: string;
      note: string;
      status: string;
      visibility: string;
      scheduledFor?: string;
    };
    const scheduled =
      body.scheduledFor && body.scheduledFor.trim() !== ""
        ? new Date(body.scheduledFor)
        : null;
    const created = await prisma.draft.create({
      data: {
        kind: clientDraftKindToPrisma(body.kind as "idea" | "journal" | "quick-take"),
        title: body.title.trim(),
        topic: body.topic.trim(),
        note: body.note.trim(),
        status: clientDraftStatusToPrisma(body.status as "draft" | "review" | "scheduled" | "published"),
        visibility: body.visibility,
        scheduledFor: scheduled,
      },
    });
    return NextResponse.json(mapDraft(created));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create draft" },
      { status: 500 }
    );
  }
}

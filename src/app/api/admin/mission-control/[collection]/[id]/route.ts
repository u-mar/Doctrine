import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDelegate, type CollectionKey } from "@/lib/mission-control/registry";

export const dynamic = "force-dynamic";

const VALID: CollectionKey[] = [
  "goals",
  "reading",
  "writing",
  "ministries",
  "countries",
  "policy",
  "speaking",
  "networking",
  "career",
  "habits",
  "habit-logs",
  "journal",
  "monthly",
  "yearly",
  "tasks",
  "meta",
];

function coerceDates(data: Record<string, unknown>) {
  const dateFields = [
    "deadline",
    "completedAt",
    "publishedAt",
    "practicedAt",
    "lastMeeting",
    "followUp",
    "targetDate",
    "dueDate",
  ];
  for (const key of dateFields) {
    if (key in data) {
      const v = data[key];
      if (v === null || v === "" || v === undefined) {
        data[key] = null;
      } else if (typeof v === "string") {
        const d = new Date(v);
        data[key] = Number.isNaN(d.getTime()) ? null : d;
      }
    }
  }
  const nums = ["progress", "pages", "wordCount", "durationMin", "confidence", "relationshipStrength", "score", "rating"];
  for (const key of nums) {
    if (key in data && typeof data[key] === "string") {
      const n = Number(data[key]);
      data[key] = key === "rating" && data[key] === "" ? null : Number.isFinite(n) ? n : 0;
    }
  }
  if ("tags" in data && typeof data.tags === "string") {
    data.tags = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return data;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: raw, id } = await ctx.params;
    if (!VALID.includes(raw as CollectionKey)) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const delegate = getDelegate(prisma, raw as CollectionKey);
    if (!delegate) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const row = await delegate.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: raw, id } = await ctx.params;
    if (!VALID.includes(raw as CollectionKey)) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const delegate = getDelegate(prisma, raw as CollectionKey);
    if (!delegate) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;
    coerceDates(body);
    const updated = await delegate.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: raw, id } = await ctx.params;
    if (!VALID.includes(raw as CollectionKey)) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const delegate = getDelegate(prisma, raw as CollectionKey);
    if (!delegate) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    await delegate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 }
    );
  }
}

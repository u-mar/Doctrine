import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDelegate, SEARCHABLE, type CollectionKey } from "@/lib/mission-control/registry";

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

function parseCollection(raw: string): CollectionKey | null {
  return VALID.includes(raw as CollectionKey) ? (raw as CollectionKey) : null;
}

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
  if ("progress" in data && typeof data.progress === "string") {
    data.progress = Number(data.progress) || 0;
  }
  if ("pages" in data && typeof data.pages === "string") {
    data.pages = Number(data.pages) || 0;
  }
  if ("wordCount" in data && typeof data.wordCount === "string") {
    data.wordCount = Number(data.wordCount) || 0;
  }
  if ("rating" in data && typeof data.rating === "string") {
    data.rating = data.rating === "" ? null : Number(data.rating);
  }
  if ("durationMin" in data && typeof data.durationMin === "string") {
    data.durationMin = Number(data.durationMin) || 0;
  }
  if ("confidence" in data && typeof data.confidence === "string") {
    data.confidence = Number(data.confidence) || 0;
  }
  if ("relationshipStrength" in data && typeof data.relationshipStrength === "string") {
    data.relationshipStrength = Number(data.relationshipStrength) || 0;
  }
  if ("score" in data && typeof data.score === "string") {
    data.score = Number(data.score) || 0;
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
  request: Request,
  ctx: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: raw } = await ctx.params;
    const collection = parseCollection(raw);
    if (!collection) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const delegate = getDelegate(prisma, collection);
    if (!delegate) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const tag = searchParams.get("tag")?.trim() ?? "";

    if (collection === "meta") {
      let meta = await prisma.mcMeta.findFirst();
      if (!meta) meta = await prisma.mcMeta.create({ data: {} });
      return NextResponse.json(meta);
    }

    const orderBy =
      collection === "habit-logs"
        ? { createdAt: "desc" as const }
        : { updatedAt: "desc" as const };
    let rows = await delegate.findMany({ orderBy });

    if (tag) {
      rows = rows.filter((r) => Array.isArray((r as { tags?: string[] }).tags) && (r as { tags: string[] }).tags.includes(tag));
    }

    if (q) {
      const fields = SEARCHABLE[collection] ?? [];
      rows = rows.filter((row) => {
        const r = row as Record<string, unknown>;
        return fields.some((f) => String(r[f] ?? "").toLowerCase().includes(q));
      });
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: raw } = await ctx.params;
    const collection = parseCollection(raw);
    if (!collection) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    const delegate = getDelegate(prisma, collection);
    if (!delegate) {
      return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;
    coerceDates(body);

    if (collection === "meta") {
      let meta = await prisma.mcMeta.findFirst();
      if (!meta) {
        meta = await prisma.mcMeta.create({ data: body });
      } else {
        meta = await prisma.mcMeta.update({ where: { id: meta.id }, data: body });
      }
      return NextResponse.json(meta);
    }

    if (collection === "habit-logs") {
      const habitId = String(body.habitId ?? "");
      const dateKey = String(body.dateKey ?? new Date().toISOString().slice(0, 10));
      if (!habitId) {
        return NextResponse.json({ error: "habitId required" }, { status: 400 });
      }
      const existing = await prisma.mcHabitLog.findFirst({ where: { habitId, dateKey } });
      if (existing) {
        const updated = await prisma.mcHabitLog.update({
          where: { id: existing.id },
          data: { done: body.done !== false, note: String(body.note ?? existing.note) },
        });
        return NextResponse.json(updated);
      }
      const created = await prisma.mcHabitLog.create({
        data: {
          habitId,
          dateKey,
          done: body.done !== false,
          note: String(body.note ?? ""),
        },
      });
      return NextResponse.json(created);
    }

    const created = await delegate.create({ data: body });
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 }
    );
  }
}

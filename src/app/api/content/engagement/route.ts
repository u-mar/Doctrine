import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";
import type { EngagementVote } from "@prisma/client";

function voteToClient(vote: EngagementVote | null): "agree" | "disagree" | null {
  if (vote === "AGREE") return "agree";
  if (vote === "DISAGREE") return "disagree";
  return null;
}

function voteToPrisma(vote: "agree" | "disagree" | null): EngagementVote | null {
  if (vote === "agree") return "AGREE";
  if (vote === "disagree") return "DISAGREE";
  return null;
}

function parseComments(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    await ensureContentSeeded();
    const { searchParams } = new URL(request.url);
    const singleKey = searchParams.get("itemKey")?.trim();
    if (singleKey) {
      const row = await prisma.engagement.findUnique({ where: { itemKey: singleKey } });
      if (!row) {
        return NextResponse.json({
          itemKey: singleKey,
          key: `engagement:${singleKey}`,
          vote: null,
          comments: [],
        });
      }
      return NextResponse.json({
        itemKey: row.itemKey,
        key: `engagement:${row.itemKey}`,
        vote: voteToClient(row.vote),
        comments: parseComments(row.commentsJson),
      });
    }

    const rows = await prisma.engagement.findMany({ orderBy: { itemKey: "asc" } });
    return NextResponse.json(
      rows.map((r) => ({
        itemKey: r.itemKey,
        key: `engagement:${r.itemKey}`,
        vote: voteToClient(r.vote),
        comments: parseComments(r.commentsJson),
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load engagement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureContentSeeded();
    const body = (await request.json()) as {
      itemKey: string;
      vote?: "agree" | "disagree" | null;
      comments?: string[];
    };
    const itemKey = body.itemKey?.trim();
    if (!itemKey) {
      return NextResponse.json({ error: "itemKey is required" }, { status: 400 });
    }
    const existing = await prisma.engagement.findUnique({ where: { itemKey } });
    const nextVote =
      body.vote === undefined ? existing?.vote ?? null : voteToPrisma(body.vote);
    const nextCommentsJson =
      body.comments === undefined
        ? (existing?.commentsJson ?? "[]")
        : JSON.stringify(body.comments.filter((c) => typeof c === "string"));

    const saved = await prisma.engagement.upsert({
      where: { itemKey },
      create: {
        itemKey,
        vote: nextVote,
        commentsJson: nextCommentsJson,
      },
      update: {
        vote: nextVote,
        commentsJson: nextCommentsJson,
      },
    });
    return NextResponse.json({
      itemKey: saved.itemKey,
      key: `engagement:${saved.itemKey}`,
      vote: voteToClient(saved.vote),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save engagement" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureContentSeeded();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";
    if (all) {
      await prisma.engagement.deleteMany({});
      return NextResponse.json({ ok: true });
    }
    const itemKey = searchParams.get("itemKey")?.trim();
    if (!itemKey) {
      return NextResponse.json({ error: "itemKey or all=1 required" }, { status: 400 });
    }
    await prisma.engagement.deleteMany({ where: { itemKey } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete engagement" },
      { status: 500 }
    );
  }
}

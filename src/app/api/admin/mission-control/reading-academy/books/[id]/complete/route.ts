import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callClaudeJSON } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const book = await prisma.mcReading.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const updated = await prisma.mcReading.update({
      where: { id },
      data: { status: "completed", completedAt: new Date(), progress: 100 },
    });

    const siblings = await prisma.mcReading.findMany({ where: { topic: book.topic } });
    const candidates = siblings.filter((b) => b.id !== id && b.status !== "completed");

    let message = `Great work finishing "${book.title}". Keep building momentum in ${book.topic}.`;
    let nextBookId: string | null = null;
    let nextBookTitle: string | null = null;

    if (candidates.length > 0) {
      try {
        const result = await callClaudeJSON<{ nextBookId: string; reason: string }>({
          system:
            "You are a personal mentor guiding a future national leader's reading curriculum. A book was just completed. Recommend the single best next book from the given candidates in this topic, respecting learning progression (don't jump to expert before intermediate/advanced is covered unless the candidates force it). Explain briefly why.",
          user: JSON.stringify({
            justCompleted: { title: book.title, level: book.level, keyLessons: book.keyLessons },
            candidates: candidates.map((c) => ({ id: c.id, title: c.title, level: c.level })),
          }) + `\n\nRespond with JSON: { "nextBookId": string (must be one of the candidate ids), "reason": string (2-3 sentences) }.`,
          maxTokens: 500,
        });
        const match = candidates.find((c) => c.id === result.nextBookId);
        if (match) {
          nextBookId = match.id;
          nextBookTitle = match.title;
          message = result.reason;
        }
      } catch {
        const fallback = [...candidates].sort(
          (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9) || a.order - b.order
        )[0];
        if (fallback) {
          nextBookId = fallback.id;
          nextBookTitle = fallback.title;
          message = `Next up: "${fallback.title}" (${fallback.level}) continues your progression in ${book.topic}.`;
        }
      }
    }

    return NextResponse.json({ book: updated, message, nextBookId, nextBookTitle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete book" },
      { status: 500 }
    );
  }
}

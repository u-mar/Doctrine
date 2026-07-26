import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMentorContext, dateKey } from "@/lib/mission-control/mentor-context";
import { callClaudeJSON, ClaudeConfigError } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

type MissionItem = { id: string; text: string; category: string; done: boolean };

const MISSION_SYSTEM_PROMPT = `You are an elite, no-nonsense personal mentor for someone spending the next 10+ years preparing to become an exceptional public servant, policy advisor, minister, and potentially a national leader. You know their full progress record — goals, reading, writing, speaking practice, habits, and open tasks. Generate a short, concrete "Today's Mission": 5 to 7 items mixing reading, writing, public speaking practice, policy study, habits, and reflection. Be specific — reference actual book titles, actual weak knowledge areas, actual streaks, and actual open tasks when relevant instead of generic advice. Each item is one line, achievable today.`;

async function generateMission() {
  const ctx = await buildMentorContext();

  const user = JSON.stringify({
    strengths: ctx.meta?.strengths ?? "",
    weaknesses: ctx.meta?.weaknesses ?? "",
    governmentExperience: ctx.meta?.governmentExperience ?? "",
    activeGoals: ctx.goals.map((g) => g.title),
    readingStreakDays: ctx.readingStreak,
    writingStreakDays: ctx.writingStreak,
    booksInProgress: ctx.booksInProgress.map((b) => ({ title: b.title, topic: b.topic, level: b.level })),
    booksCompletedTotal: ctx.booksCompletedCount,
    weakestKnowledgeTopics: ctx.weakestTopics,
    recentWritingTitles: ctx.recentWriting.map((w) => w.title),
    recentSpeakingTopics: ctx.recentSpeaking.map((s) => s.title),
    openTasks: ctx.openTasks.map((t) => t.title),
    journalDoneToday: ctx.journalDoneToday,
  });

  const result = await callClaudeJSON<{
    items: { text: string; category: string }[];
    reasoning: string;
  }>({
    system: MISSION_SYSTEM_PROMPT,
    user: `Here is today's context:\n${user}\n\nRespond with JSON: { "items": [{ "text": string, "category": "reading"|"writing"|"speaking"|"policy"|"habit"|"reflection" }], "reasoning": string }. 5 to 7 items. "reasoning" is 1-2 sentences explaining today's overall focus.`,
    maxTokens: 1200,
  });

  const items: MissionItem[] = result.items.map((it, i) => ({
    id: `${dateKey()}-${i}`,
    text: it.text,
    category: it.category,
    done: false,
  }));

  return prisma.mcMentorDaily.upsert({
    where: { dateKey: dateKey() },
    create: { dateKey: dateKey(), itemsJson: JSON.stringify(items), reasoning: result.reasoning },
    update: { itemsJson: JSON.stringify(items), reasoning: result.reasoning },
  });
}

function serialize(row: { dateKey: string; itemsJson: string; reasoning: string }) {
  return {
    dateKey: row.dateKey,
    reasoning: row.reasoning,
    items: JSON.parse(row.itemsJson) as MissionItem[],
  };
}

export async function GET() {
  try {
    const existing = await prisma.mcMentorDaily.findUnique({ where: { dateKey: dateKey() } });
    if (existing) {
      return NextResponse.json(serialize(existing));
    }
    const saved = await generateMission();
    return NextResponse.json(serialize(saved));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load mission" },
      { status }
    );
  }
}

export async function POST() {
  try {
    const saved = await generateMission();
    return NextResponse.json(serialize(saved));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate mission" },
      { status }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id: string; done: boolean };
    const existing = await prisma.mcMentorDaily.findUnique({ where: { dateKey: dateKey() } });
    if (!existing) {
      return NextResponse.json({ error: "No mission for today" }, { status: 404 });
    }
    const items = (JSON.parse(existing.itemsJson) as MissionItem[]).map((it) =>
      it.id === body.id ? { ...it, done: body.done } : it
    );
    const saved = await prisma.mcMentorDaily.update({
      where: { dateKey: dateKey() },
      data: { itemsJson: JSON.stringify(items) },
    });
    return NextResponse.json(serialize(saved));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update mission" },
      { status: 500 }
    );
  }
}

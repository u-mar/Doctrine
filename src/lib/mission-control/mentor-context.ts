import { prisma } from "@/lib/prisma";
import { KNOWLEDGE_LEVEL_WEIGHT, READING_TOPICS, type ReadingTopic } from "./academy";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function habitStreak(logs: { dateKey: string; done: boolean }[]): number {
  const done = new Set(logs.filter((l) => l.done).map((l) => l.dateKey));
  let streak = 0;
  const cursor = new Date();
  if (!done.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = dateKey(cursor);
    if (!done.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type KnowledgeEntry = { topic: ReadingTopic; score: number };

export function computeKnowledgeMap(
  books: { topic: string; level: string; status: string }[]
): KnowledgeEntry[] {
  return READING_TOPICS.map((topic) => {
    const completed = books.filter((b) => b.topic === topic && b.status === "completed");
    const raw = completed.reduce(
      (sum, b) => sum + (KNOWLEDGE_LEVEL_WEIGHT[b.level as keyof typeof KNOWLEDGE_LEVEL_WEIGHT] ?? 10),
      0
    );
    return { topic, score: Math.min(100, raw) };
  });
}

export async function buildMentorContext() {
  const sixtyDaysAgo = dateKey(new Date(Date.now() - 60 * 86400000));

  const [meta, goals, habits, habitLogs, books, writing, speaking, policies, tasks, journalToday] =
    await Promise.all([
      prisma.mcMeta.findFirst(),
      prisma.mcGoal.findMany({ where: { status: "active" }, orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.mcHabit.findMany({ where: { active: true } }),
      prisma.mcHabitLog.findMany({ where: { dateKey: { gte: sixtyDaysAgo } } }),
      prisma.mcReading.findMany({ where: { topic: { in: [...READING_TOPICS] } } }),
      prisma.mcWriting.findMany({ orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.mcSpeaking.findMany({ orderBy: { practicedAt: "desc" }, take: 10 }),
      prisma.mcPolicyIdea.findMany({ orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.mcTask.findMany({ where: { status: { not: "done" } }, orderBy: { dueDate: "asc" }, take: 10 }),
      prisma.mcJournal.findFirst({ where: { dateKey: dateKey() } }),
    ]);

  const readingHabit = habits.find((h) => /read/i.test(h.name));
  const writingHabit = habits.find((h) => /writ/i.test(h.name));
  const readingStreak = readingHabit
    ? habitStreak(habitLogs.filter((l) => l.habitId === readingHabit.id))
    : 0;
  const writingStreak = writingHabit
    ? habitStreak(habitLogs.filter((l) => l.habitId === writingHabit.id))
    : 0;

  const booksInProgress = books.filter((b) => b.status === "reading");
  const booksCompleted = books.filter((b) => b.status === "completed");

  const knowledgeMap = computeKnowledgeMap(books);
  const weakestTopics = [...knowledgeMap].sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    meta,
    goals,
    habits,
    readingStreak,
    writingStreak,
    booksInProgress,
    booksCompletedCount: booksCompleted.length,
    recentWriting: writing,
    recentSpeaking: speaking,
    recentPolicies: policies,
    openTasks: tasks,
    journalDoneToday: Boolean(journalToday),
    knowledgeMap,
    weakestTopics,
  };
}

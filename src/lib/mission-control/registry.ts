import type { PrismaClient } from "@prisma/client";

export type CollectionKey =
  | "goals"
  | "reading"
  | "writing"
  | "ministries"
  | "countries"
  | "policy"
  | "speaking"
  | "networking"
  | "career"
  | "habits"
  | "habit-logs"
  | "journal"
  | "monthly"
  | "yearly"
  | "tasks"
  | "meta";

type Delegate = {
  findMany: (args?: object) => Promise<object[]>;
  findUnique: (args: object) => Promise<object | null>;
  findFirst: (args?: object) => Promise<object | null>;
  create: (args: { data: object }) => Promise<object>;
  update: (args: { where: object; data: object }) => Promise<object>;
  delete: (args: { where: object }) => Promise<object>;
  count: (args?: object) => Promise<number>;
};

export function getDelegate(prisma: PrismaClient, collection: CollectionKey): Delegate | null {
  const map: Record<CollectionKey, Delegate> = {
    goals: prisma.mcGoal as unknown as Delegate,
    reading: prisma.mcReading as unknown as Delegate,
    writing: prisma.mcWriting as unknown as Delegate,
    ministries: prisma.mcMinistry as unknown as Delegate,
    countries: prisma.mcCountry as unknown as Delegate,
    policy: prisma.mcPolicyIdea as unknown as Delegate,
    speaking: prisma.mcSpeaking as unknown as Delegate,
    networking: prisma.mcContact as unknown as Delegate,
    career: prisma.mcCareer as unknown as Delegate,
    habits: prisma.mcHabit as unknown as Delegate,
    "habit-logs": prisma.mcHabitLog as unknown as Delegate,
    journal: prisma.mcJournal as unknown as Delegate,
    monthly: prisma.mcMonthlyReview as unknown as Delegate,
    yearly: prisma.mcYearlyReview as unknown as Delegate,
    tasks: prisma.mcTask as unknown as Delegate,
    meta: prisma.mcMeta as unknown as Delegate,
  };
  return map[collection] ?? null;
}

export const SEARCHABLE: Partial<Record<CollectionKey, string[]>> = {
  goals: ["title", "description", "category", "notes", "status", "horizon"],
  reading: ["title", "author", "category", "summary", "notes", "keyLessons"],
  writing: ["title", "type", "category", "notes", "body", "status"],
  ministries: ["name", "overview", "challenges", "recommendations", "currentMinister"],
  countries: ["country", "governmentModel", "lessonsSomalia", "ideasAdapt", "notes"],
  policy: ["title", "problem", "recommended", "expectedImpact", "status"],
  speaking: ["title", "topic", "mistakes", "improvements", "notes"],
  networking: ["name", "organization", "position", "location", "notes", "topicsDiscussed"],
  career: ["title", "requirements", "notes", "status"],
  habits: ["name", "category"],
  journal: ["mood", "lessons", "wins", "failures", "learned", "tomorrow", "body"],
  monthly: ["monthKey", "accomplished", "failed", "learned", "mistake", "priorities"],
  yearly: ["yearKey", "completed", "lessons", "achievements", "failures"],
  tasks: ["title", "description", "category", "status"],
};

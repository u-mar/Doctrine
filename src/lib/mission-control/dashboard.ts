import { prisma } from "@/lib/prisma";
import { DEFAULT_HABITS } from "@/lib/mission-control/types";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(d = new Date()) {
  return dateKey(d).slice(0, 7);
}

function yearKey(d = new Date()) {
  return String(d.getFullYear());
}

function daysInMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function parseDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return startOfDay(new Date(y, m - 1, d));
}

function inRange(date: Date | null | undefined, from: Date, toEnd: Date) {
  if (!date) return false;
  const t = date.getTime();
  return t >= from.getTime() && t <= toEnd.getTime();
}

function keyInRange(key: string, fromKey: string, toKey: string) {
  return key >= fromKey && key <= toKey;
}

function computeStreak(workDates: string[]): number {
  if (!workDates.length) return 0;
  const set = new Set(workDates);
  let streak = 0;
  const cursor = startOfDay();
  if (!set.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(dateKey(cursor))) return 0;
  }
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function habitStreak(logs: { dateKey: string; done: boolean }[]): number {
  const done = new Set(logs.filter((l) => l.done).map((l) => l.dateKey));
  let streak = 0;
  const cursor = startOfDay();
  if (!done.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!done.has(dateKey(cursor))) return 0;
  }
  while (done.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function ensureMeta() {
  let meta = await prisma.mcMeta.findFirst();
  if (!meta) {
    meta = await prisma.mcMeta.create({ data: {} });
  }
  return meta;
}

async function ensureDefaultHabits() {
  const count = await prisma.mcHabit.count();
  if (count === 0) {
    for (const name of DEFAULT_HABITS) {
      await prisma.mcHabit.create({ data: { name, category: "daily" } });
    }
  }
}

export type DashboardQuery = {
  from?: string;
  to?: string;
};

function resolveRange(query?: DashboardQuery) {
  const now = startOfDay();
  const fromParsed = query?.from ? parseDateInput(query.from) : null;
  const toParsed = query?.to ? parseDateInput(query.to) : null;

  let from = fromParsed ?? new Date(now.getFullYear(), now.getMonth(), 1);
  let to = toParsed ?? now;

  if (from.getTime() > to.getTime()) {
    const swap = from;
    from = to;
    to = swap;
  }

  const toEnd = endOfDay(to);
  const fromKey = dateKey(from);
  const toKey = dateKey(to);

  return { from, to, toEnd, fromKey, toKey };
}

export async function getMissionDashboard(query?: DashboardQuery) {
  await ensureMeta();
  await ensureDefaultHabits();

  const now = new Date();
  const mk = monthKey(now);
  const yk = yearKey(now);
  const { from, to, toEnd, fromKey, toKey } = resolveRange(query);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    meta,
    goals,
    tasks,
    reading,
    writing,
    ministries,
    countries,
    speaking,
    contacts,
    habits,
    habitLogs,
    journals,
  ] = await Promise.all([
    prisma.mcMeta.findFirst(),
    prisma.mcGoal.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.mcTask.findMany({
      where: { status: { not: "done" } },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    prisma.mcReading.findMany(),
    prisma.mcWriting.findMany(),
    prisma.mcMinistry.findMany(),
    prisma.mcCountry.findMany(),
    prisma.mcSpeaking.findMany(),
    prisma.mcContact.findMany(),
    prisma.mcHabit.findMany({ where: { active: true } }),
    prisma.mcHabitLog.findMany({
      where: { dateKey: { gte: dateKey(new Date(Date.now() - 120 * 86400000)) } },
    }),
    prisma.mcJournal.findMany({ orderBy: { dateKey: "desc" }, take: 30 }),
  ]);

  const booksInRange = reading.filter(
    (r) => r.status === "completed" && inRange(r.completedAt, from, toEnd)
  ).length;
  const booksThisYear = reading.filter(
    (r) => r.status === "completed" && r.completedAt && r.completedAt >= yearStart
  ).length;

  const briefsInRange = writing.filter(
    (w) => w.type === "brief" && w.status === "published" && inRange(w.publishedAt, from, toEnd)
  ).length;
  const papersInRange = writing.filter(
    (w) => w.type === "policy" && inRange(w.updatedAt ?? w.createdAt, from, toEnd)
  ).length;
  const publishedInRange = writing.filter(
    (w) => w.status === "published" && inRange(w.publishedAt, from, toEnd)
  ).length;

  const speakingInRange = speaking.filter((s) => inRange(s.practicedAt, from, toEnd));
  const speakingSessions = speakingInRange.length;
  const speakingHours = speakingInRange.reduce((sum, s) => sum + (s.durationMin || 0), 0) / 60;
  const videosRecorded = speakingInRange.filter((s) => Boolean(s.videoUrl?.trim())).length;

  const ministriesDone = ministries.filter(
    (m) => m.status === "completed" && inRange(m.updatedAt ?? m.createdAt, from, toEnd)
  ).length;
  const countriesDone = countries.filter(
    (c) => c.status === "completed" && inRange(c.updatedAt ?? c.createdAt, from, toEnd)
  ).length;
  const careerDone = await prisma.mcCareer.count({
    where: {
      status: "completed",
      updatedAt: { gte: from, lte: toEnd },
    },
  });
  const meetings = contacts.filter((c) => inRange(c.lastMeeting, from, toEnd)).length;

  const exerciseHabit = habits.find((h) => /exercise|workout/i.test(h.name));
  const exerciseLogs = exerciseHabit
    ? habitLogs.filter((l) => l.habitId === exerciseHabit.id)
    : [];
  const workoutStreak = habitStreak(exerciseLogs);

  const weeklyGoals = goals.filter((g) => g.horizon === "weekly");
  const weeklyCompleted = weeklyGoals.filter((g) => g.status === "completed" || g.progress >= 100).length;

  const categoryProgress: { category: string; progress: number; count: number }[] = [];
  const byCat = new Map<string, { sum: number; n: number }>();
  for (const g of goals) {
    const cat = g.category?.trim() || "General";
    const cur = byCat.get(cat) ?? { sum: 0, n: 0 };
    cur.sum += g.progress;
    cur.n += 1;
    byCat.set(cat, cur);
  }
  for (const [category, { sum, n }] of byCat) {
    categoryProgress.push({ category, progress: Math.round(sum / n), count: n });
  }
  categoryProgress.sort((a, b) => b.progress - a.progress);

  const day = now.getDate();
  const dim = daysInMonth(now);
  const doy = dayOfYear(now);
  const diy = now.getFullYear() % 4 === 0 ? 366 : 365;

  const workDates = meta?.workDates ?? [];
  const streak = computeStreak(workDates);
  const workDaysInRange = workDates.filter((d) => keyInRange(d, fromKey, toKey)).length;

  const wordsWritten = writing
    .filter((w) => inRange(w.updatedAt ?? w.createdAt, from, toEnd))
    .reduce((s, w) => s + (w.wordCount || 0), 0);

  const habitStreaks = habits.map((h) => ({
    id: h.id,
    name: h.name,
    streak: habitStreak(habitLogs.filter((l) => l.habitId === h.id)),
  }));

  const consistencyScore = Math.min(
    100,
    Math.round(
      ((streak / 30) * 40 +
        (weeklyGoals.length ? (weeklyCompleted / weeklyGoals.length) * 30 : 15) +
        (day / dim) * 15 +
        Math.min(booksInRange, 4) * 3.75) *
        1
    )
  );

  return {
    welcome: "Welcome back, Commander.",
    today: now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    dateKey: dateKey(now),
    dailyQuote: meta?.dailyQuote ?? "Discipline is destiny.",
    streak,
    monthlyProgress: Math.round((day / dim) * 100),
    yearlyProgress: Math.round((doy / diy) * 100),
    weeklyGoalsCompleted: weeklyCompleted,
    weeklyGoalsTotal: weeklyGoals.length,
    categoryProgress,
    upcomingTasks: tasks,
    range: {
      from: fromKey,
      to: toKey,
      workDays: workDaysInRange,
    },
    widgets: {
      booksThisMonth: booksInRange,
      booksThisYear,
      policyPapersWritten: papersInRange,
      politicalBriefsPublished: briefsInRange,
      videosRecorded,
      ministriesCompleted: ministriesDone,
      countriesCompleted: countriesDone,
      governmentProjectsCompleted: careerDone,
      meetingsNetworking: meetings,
      publicSpeakingSessions: speakingSessions,
      workoutStreak,
      speakingHours: Math.round(speakingHours * 10) / 10,
      wordsWritten,
      writingTotal: writing.length,
      publishedThisMonth: publishedInRange,
      workDaysInRange,
    },
    habitStreaks,
    consistencyScore,
    recentJournals: journals.slice(0, 5),
    calendar: {
      monthKey: mk,
      yearKey: yk,
      workDates: workDates.filter((d) => d.startsWith(mk)),
      journalDates: journals.map((j) => j.dateKey).filter((d) => d.startsWith(mk)),
    },
  };
}

export async function markWorkedToday() {
  const meta = await ensureMeta();
  const today = dateKey();
  if (meta.workDates.includes(today)) return meta;
  return prisma.mcMeta.update({
    where: { id: meta.id },
    data: { workDates: [...meta.workDates, today] },
  });
}

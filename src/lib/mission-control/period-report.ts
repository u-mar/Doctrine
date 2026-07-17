import { prisma } from "@/lib/prisma";

function parseMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end, year: y, month: m };
}

function inRange(d: Date | null | undefined, start: Date, end: Date) {
  if (!d) return false;
  const t = d.getTime();
  return t >= start.getTime() && t < end.getTime();
}

export async function getMonthReport(monthKey: string) {
  const { start, end } = parseMonth(monthKey);
  const prefix = monthKey;

  const [reading, writing, ministries, countries, speaking, goals, tasks, habitLogs, habits, meta, review] =
    await Promise.all([
      prisma.mcReading.findMany(),
      prisma.mcWriting.findMany(),
      prisma.mcMinistry.findMany(),
      prisma.mcCountry.findMany(),
      prisma.mcSpeaking.findMany(),
      prisma.mcGoal.findMany(),
      prisma.mcTask.findMany(),
      prisma.mcHabitLog.findMany({ where: { dateKey: { startsWith: prefix } } }),
      prisma.mcHabit.findMany({ where: { active: true } }),
      prisma.mcMeta.findFirst(),
      prisma.mcMonthlyReview.findFirst({ where: { monthKey } }),
    ]);

  const booksCompleted = reading.filter(
    (r) => r.status === "completed" && inRange(r.completedAt, start, end)
  );
  const booksStarted = reading.filter(
    (r) => r.createdAt >= start && r.createdAt < end
  );
  const writingsCreated = writing.filter((w) => w.createdAt >= start && w.createdAt < end);
  const published = writing.filter(
    (w) => w.status === "published" && inRange(w.publishedAt ?? w.updatedAt, start, end)
  );
  const ministriesDone = ministries.filter(
    (m) => m.status === "completed" && m.updatedAt >= start && m.updatedAt < end
  );
  const countriesDone = countries.filter(
    (c) => c.status === "completed" && c.updatedAt >= start && c.updatedAt < end
  );
  const speakingSessions = speaking.filter(
    (s) => inRange(s.practicedAt ?? s.createdAt, start, end)
  );
  const speakingHours =
    Math.round((speakingSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0) / 60) * 10) / 10;

  const goalsCompleted = goals.filter(
    (g) =>
      (g.status === "completed" || g.progress >= 100) &&
      g.updatedAt >= start &&
      g.updatedAt < end
  );
  const goalsActive = goals.filter((g) => g.status === "active");
  const tasksDone = tasks.filter(
    (t) => t.status === "done" && t.updatedAt >= start && t.updatedAt < end
  );

  const workDays = (meta?.workDates ?? []).filter((d) => d.startsWith(prefix)).length;
  const dim = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const habitDoneDays = new Set(habitLogs.filter((l) => l.done).map((l) => l.dateKey)).size;

  const habitBreakdown = habits.map((h) => {
    const days = habitLogs.filter((l) => l.habitId === h.id && l.done).length;
    return { id: h.id, name: h.name, daysDone: days, rate: Math.round((days / dim) * 100) };
  });

  // Success %: blend of self score (if review), work days, goals completion, habit consistency
  const selfScore = review?.score ?? null;
  const workRate = Math.round((workDays / dim) * 100);
  const goalRate =
    goalsActive.length + goalsCompleted.length > 0
      ? Math.round((goalsCompleted.length / Math.max(goalsActive.length + goalsCompleted.length, 1)) * 100)
      : workRate;
  const habitRate =
    habitBreakdown.length > 0
      ? Math.round(habitBreakdown.reduce((s, h) => s + h.rate, 0) / habitBreakdown.length)
      : 0;

  const successPercentage = Math.round(
    (selfScore != null ? selfScore * 10 * 0.35 : 0) +
      workRate * 0.25 +
      goalRate * 0.2 +
      habitRate * 0.2 +
      (selfScore == null ? 0.35 * ((workRate + goalRate + habitRate) / 3) : 0)
  );

  return {
    period: monthKey,
    kind: "month" as const,
    label: start.toLocaleString(undefined, { month: "long", year: "numeric" }),
    successPercentage: Math.max(0, Math.min(100, successPercentage)),
    selfScore,
    stats: {
      workDays,
      daysInPeriod: dim,
      booksCompleted: booksCompleted.length,
      booksStarted: booksStarted.length,
      writingsCreated: writingsCreated.length,
      published: published.length,
      ministriesCompleted: ministriesDone.length,
      countriesCompleted: countriesDone.length,
      speakingSessions: speakingSessions.length,
      speakingHours,
      goalsCompleted: goalsCompleted.length,
      tasksDone: tasksDone.length,
      habitDoneDays,
    },
    lists: {
      books: booksCompleted.map((b) => ({ id: b.id, title: b.title, author: b.author, category: b.category })),
      writings: published.map((w) => ({ id: w.id, title: w.title, type: w.type, status: w.status })),
      ministries: ministriesDone.map((m) => ({ id: m.id, name: m.name })),
      countries: countriesDone.map((c) => ({ id: c.id, country: c.country })),
      speaking: speakingSessions.map((s) => ({
        id: s.id,
        title: s.title,
        topic: s.topic,
        durationMin: s.durationMin,
      })),
      goals: goalsCompleted.map((g) => ({ id: g.id, title: g.title, category: g.category, progress: g.progress })),
    },
    habitBreakdown,
    review,
  };
}

export async function getYearReport(yearKey: string) {
  const year = Number(yearKey);
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const prefix = yearKey;

  const [reading, writing, ministries, countries, speaking, goals, tasks, meta, review, monthlyReviews] =
    await Promise.all([
      prisma.mcReading.findMany(),
      prisma.mcWriting.findMany(),
      prisma.mcMinistry.findMany(),
      prisma.mcCountry.findMany(),
      prisma.mcSpeaking.findMany(),
      prisma.mcGoal.findMany(),
      prisma.mcTask.findMany(),
      prisma.mcMeta.findFirst(),
      prisma.mcYearlyReview.findFirst({ where: { yearKey } }),
      prisma.mcMonthlyReview.findMany({
        where: { monthKey: { startsWith: prefix } },
        orderBy: { monthKey: "asc" },
      }),
    ]);

  const booksCompleted = reading.filter(
    (r) => r.status === "completed" && inRange(r.completedAt, start, end)
  );
  const published = writing.filter(
    (w) => w.status === "published" && inRange(w.publishedAt ?? w.updatedAt, start, end)
  );
  const ministriesDone = ministries.filter(
    (m) => m.status === "completed" && m.updatedAt >= start && m.updatedAt < end
  );
  const countriesDone = countries.filter(
    (c) => c.status === "completed" && c.updatedAt >= start && c.updatedAt < end
  );
  const speakingSessions = speaking.filter((s) => inRange(s.practicedAt ?? s.createdAt, start, end));
  const speakingHours =
    Math.round((speakingSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0) / 60) * 10) / 10;
  const goalsCompleted = goals.filter(
    (g) =>
      (g.status === "completed" || g.progress >= 100) &&
      g.updatedAt >= start &&
      g.updatedAt < end
  );
  const tasksDone = tasks.filter((t) => t.status === "done" && t.updatedAt >= start && t.updatedAt < end);
  const workDays = (meta?.workDates ?? []).filter((d) => d.startsWith(prefix)).length;

  const avgMonthlyScore =
    monthlyReviews.length > 0
      ? Math.round((monthlyReviews.reduce((s, r) => s + r.score, 0) / monthlyReviews.length) * 10) / 10
      : null;

  const successPercentage = Math.min(
    100,
    Math.round(
      (avgMonthlyScore != null ? avgMonthlyScore * 10 * 0.4 : 30) +
        Math.min(workDays, 200) / 2 +
        Math.min(booksCompleted.length * 4, 20) +
        Math.min(goalsCompleted.length * 3, 15)
    )
  );

  return {
    period: yearKey,
    kind: "year" as const,
    label: yearKey,
    successPercentage,
    selfScore: avgMonthlyScore,
    stats: {
      workDays,
      daysInPeriod: year % 4 === 0 ? 366 : 365,
      booksCompleted: booksCompleted.length,
      booksStarted: 0,
      writingsCreated: writing.filter((w) => w.createdAt >= start && w.createdAt < end).length,
      published: published.length,
      ministriesCompleted: ministriesDone.length,
      countriesCompleted: countriesDone.length,
      speakingSessions: speakingSessions.length,
      speakingHours,
      goalsCompleted: goalsCompleted.length,
      tasksDone: tasksDone.length,
      habitDoneDays: 0,
      monthlyReviews: monthlyReviews.length,
    },
    lists: {
      books: booksCompleted.map((b) => ({ id: b.id, title: b.title, author: b.author, category: b.category })),
      writings: published.map((w) => ({ id: w.id, title: w.title, type: w.type, status: w.status })),
      ministries: ministriesDone.map((m) => ({ id: m.id, name: m.name })),
      countries: countriesDone.map((c) => ({ id: c.id, country: c.country })),
      speaking: speakingSessions.slice(0, 20).map((s) => ({
        id: s.id,
        title: s.title,
        topic: s.topic,
        durationMin: s.durationMin,
      })),
      goals: goalsCompleted.map((g) => ({ id: g.id, title: g.title, category: g.category, progress: g.progress })),
      monthlyReviews: monthlyReviews.map((r) => ({
        id: r.id,
        monthKey: r.monthKey,
        score: r.score,
        accomplished: r.accomplished,
      })),
    },
    habitBreakdown: [],
    review,
  };
}

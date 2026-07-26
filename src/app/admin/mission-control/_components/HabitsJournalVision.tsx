"use client";

import { useEffect, useMemo, useState } from "react";
import { Newsreader } from "next/font/google";
import {
  btnGhost,
  btnPrimary,
  EmptyState,
  Field,
  inputClass,
  listCardTone,
  mcFetch,
  Modal,
  ProgressBar,
  SectionHeader,
  StatCard,
  useCollection,
} from "./shared";

const visionSerif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

type Habit = { id: string; name: string; category: string; active: boolean };
type HabitLog = { id: string; habitId: string; dateKey: string; done: boolean };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function lastNDays(n: number) {
  const days: { key: string; label: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({
      key: toDateKey(d),
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      isToday: i === 0,
    });
  }
  return days;
}

function computeStreak(doneKeys: Set<string>, today: string) {
  let streak = 0;
  const cursor = new Date();
  const todayDone = doneKeys.has(today);
  if (!todayDone) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = toDateKey(cursor);
    if (!doneKeys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function HabitsSection() {
  const { items: habits, create, remove } = useCollection<Habit>("habits");
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const week = useMemo(() => lastNDays(7), []);
  const today = week[week.length - 1].key;

  const loadLogs = async () => {
    const rows = await mcFetch<HabitLog[]>("/api/admin/mission-control/habit-logs");
    setLogs(rows);
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!l.done) continue;
      if (!map.has(l.habitId)) map.set(l.habitId, new Set());
      map.get(l.habitId)!.add(l.dateKey);
    }
    return map;
  }, [logs]);

  const visibleHabits = useMemo(
    () => habits.filter((h) => showInactive || h.active !== false),
    [habits, showInactive]
  );

  const toggleDay = async (habitId: string, dateKey: string, currentlyDone: boolean) => {
    await mcFetch("/api/admin/mission-control/habit-logs", {
      method: "POST",
      body: JSON.stringify({ habitId, dateKey, done: !currentlyDone }),
    });
    await loadLogs();
  };

  const removeHabit = async (h: Habit) => {
    if (!window.confirm(`Remove "${h.name}"? This deletes the habit (its history stays logged but hidden).`)) return;
    await remove(h.id);
  };

  return (
    <div>
      <SectionHeader
        title="Habit Tracker"
        subtitle="Daily discipline compounds into leadership."
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#3B8FD9] focus:ring-[#3B8FD9]/30"
              />
              Show inactive
            </label>
            <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
              Add habit
            </button>
          </div>
        }
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Add habit">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await create({ name: name.trim(), category: category.trim() || "daily", active: true });
            setName("");
            setCategory("");
            setOpen(false);
          }}
        >
          <Field label="Habit name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <Field label="Category (optional)">
            <input
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="daily, faith, fitness…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Add habit
            </button>
          </div>
        </form>
      </Modal>

      {visibleHabits.length === 0 ? (
        <EmptyState title="No habits" body="Defaults load on first dashboard visit — or add your own." />
      ) : (
        <div className="space-y-2.5">
          <div className="hidden items-center gap-1 pl-4 pr-3 sm:flex">
            <span className="flex-1" />
            {week.map((d) => (
              <span
                key={d.key}
                className={`w-8 text-center text-[10px] font-semibold uppercase tracking-wide ${
                  d.isToday ? "text-[#1d6aa8]" : "text-slate-400"
                }`}
              >
                {d.label}
              </span>
            ))}
            <span className="w-14 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Streak
            </span>
            <span className="w-8" />
          </div>
          <ul className="space-y-2">
            {visibleHabits.map((h) => {
              const doneKeys = logsByHabit.get(h.id) ?? new Set<string>();
              const streak = computeStreak(doneKeys, today);
              const inactive = h.active === false;
              return (
                <li
                  key={h.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-nowrap ${
                    inactive
                      ? "border-slate-200 bg-slate-50/70 opacity-60"
                      : "border-sky-100 bg-gradient-to-r from-white to-sky-50/40"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{h.name}</p>
                    {h.category ? (
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{h.category}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    {week.map((d) => {
                      const on = doneKeys.has(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          title={`${d.key}${on ? " · done" : ""}`}
                          onClick={() => void toggleDay(h.id, d.key, on)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                            on
                              ? "bg-gradient-to-b from-[#4B9CD3] to-[#3B8FD9] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-300 hover:border-sky-200 hover:text-sky-400"
                          } ${d.isToday ? "ring-2 ring-[#3B8FD9]/30" : ""}`}
                        >
                          {on ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div className="w-14 text-center">
                    <span className={`text-sm font-semibold ${streak > 0 ? "text-[#1d6aa8]" : "text-slate-300"}`}>
                      {streak}
                    </span>
                    <span className="ml-0.5 text-[10px] text-slate-400">d</span>
                  </div>
                  <button
                    type="button"
                    title="Remove habit"
                    onClick={() => void removeHabit(h)}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

type Journal = {
  id: string;
  dateKey: string;
  mood: string;
  lessons: string;
  wins: string;
  failures: string;
  learned: string;
  tomorrow: string;
  body: string;
  tags: string[];
  attachments: string;
};

export function JournalSection() {
  const { items, create, update, remove, loading } = useCollection<Journal>("journal");
  const today = new Date().toISOString().slice(0, 10);
  const existing = items.find((j) => j.dateKey === today);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    mood: "",
    lessons: "",
    wins: "",
    failures: "",
    learned: "",
    tomorrow: "",
    body: "",
    tags: "",
    attachments: "[]",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        mood: existing.mood,
        lessons: existing.lessons,
        wins: existing.wins,
        failures: existing.failures,
        learned: existing.learned,
        tomorrow: existing.tomorrow,
        body: existing.body,
        tags: (existing.tags ?? []).join(", "),
        attachments: existing.attachments || "[]",
      });
    }
  }, [existing]);

  return (
    <div>
      <SectionHeader
        title="Journal"
        subtitle={`Daily reflection · ${today}`}
        action={
          <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
            {existing ? "Edit today's entry" : "Write today's entry"}
          </button>
        }
      />

      <Modal open={open} onClose={() => setOpen(false)} title={existing ? "Edit journal entry" : "Write journal entry"}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = { ...form, dateKey: today, tags: form.tags };
            if (existing) await update(existing.id, payload);
            else await create(payload);
            setOpen(false);
          }}
        >
          <Field label="Mood">
            <input className={inputClass} value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} />
          </Field>
          <Field label="Tags">
            <input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </Field>
          {(
            [
              ["wins", "Wins"],
              ["failures", "Failures"],
              ["lessons", "Lessons"],
              ["learned", "What I learned"],
              ["tomorrow", "Tomorrow's priorities"],
              ["body", "Free journal (Markdown)"],
              ["attachments", "Attachments (URLs / JSON)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="sm:col-span-2">
              <Field label={label}>
                <textarea
                  className={inputClass}
                  rows={key === "body" ? 5 : 2}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            </div>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Save entry
            </button>
          </div>
        </form>
      </Modal>

      {loading ? null : items.length === 0 ? (
        <EmptyState title="No journal entries" body="Click the button above to write today's reflection." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 12).map((j) => (
            <li
              key={j.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
            >
              <span className="text-slate-700">
                {j.dateKey} {j.mood ? `· ${j.mood}` : ""}
              </span>
              <button type="button" className={btnGhost} onClick={() => void remove(j.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Meta = {
  id: string;
  dailyQuote: string;
  missionStmt: string;
  values: string;
  philosophy: string;
  futureOffice: string;
  somalia2050: string;
  quotes: string;
  principles: string;
};

type VisionKey = keyof Omit<Meta, "id" | "dailyQuote">;

const VISION_FIELDS: {
  key: VisionKey;
  title: string;
  hint: string;
  accent: string;
}[] = [
  { key: "futureOffice", title: "Future office", hint: "The seat you prepare for", accent: "bg-teal-600" },
  { key: "values", title: "Values", hint: "Non-negotiables", accent: "bg-amber-500" },
  { key: "philosophy", title: "Life philosophy", hint: "How you decide", accent: "bg-slate-700" },
  { key: "principles", title: "Principles", hint: "Rules of conduct", accent: "bg-[#3B8FD9]" },
  { key: "quotes", title: "Favorite quotes", hint: "Words that keep you sharp", accent: "bg-rose-500" },
];

function VisionPanel({
  title,
  hint,
  body,
  empty,
  accent,
  onEdit,
  className = "",
  large,
}: {
  title: string;
  hint: string;
  body: string;
  empty: string;
  accent: string;
  onEdit: () => void;
  className?: string;
  large?: boolean;
}) {
  const filled = Boolean(body.trim());
  return (
    <button
      type="button"
      onClick={onEdit}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] transition duration-300 hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${className}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <div className={`pl-5 pr-5 ${large ? "py-6 sm:py-8 sm:pl-7 sm:pr-8" : "py-5"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
          </div>
          <span className="translate-y-0.5 text-[11px] font-medium text-slate-300 opacity-0 transition group-hover:opacity-100">
            Edit
          </span>
        </div>
        <p
          className={`mt-4 whitespace-pre-wrap leading-relaxed ${
            large
              ? `${visionSerif.className} text-xl text-slate-900 sm:text-2xl sm:leading-snug ${filled ? "" : "text-slate-300"}`
              : `text-sm ${filled ? "text-slate-700" : "text-slate-300"}`
          }`}
        >
          {filled ? body : empty}
        </p>
      </div>
    </button>
  );
}

export function VisionSection() {
  const [form, setForm] = useState({
    missionStmt: "",
    values: "",
    philosophy: "",
    futureOffice: "",
    somalia2050: "",
    quotes: "",
    principles: "",
  });
  const [editing, setEditing] = useState<VisionKey | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const m = await mcFetch<Meta>("/api/admin/mission-control/meta");
    setForm({
      missionStmt: m.missionStmt,
      values: m.values,
      philosophy: m.philosophy,
      futureOffice: m.futureOffice,
      somalia2050: m.somalia2050,
      quotes: m.quotes,
      principles: m.principles,
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const open = (key: VisionKey) => {
    setEditing(key);
    setDraft(form[key] ?? "");
  };

  const activeTitle =
    editing === "missionStmt"
      ? "Mission"
      : editing === "somalia2050"
        ? "Somalia 2050"
        : (VISION_FIELDS.find((f) => f.key === editing)?.title ?? "Vision");

  const activeHint =
    editing === "missionStmt"
      ? "Why you exist in public life"
      : editing === "somalia2050"
        ? "The nation you are building toward"
        : (VISION_FIELDS.find((f) => f.key === editing)?.hint ?? "Content");

  const mission = form.missionStmt.trim();
  const somalia = form.somalia2050.trim();

  return (
    <div>
      <SectionHeader
        title="Vision Board"
        subtitle="Your private charter — click any section to edit."
      />

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-[#f7f8fa] shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        {/* Mission hero — one composition */}
        <button
          type="button"
          onClick={() => open("missionStmt")}
          className="group relative block w-full overflow-hidden border-b border-white/10 bg-[linear-gradient(145deg,#0c1220_0%,#152238_48%,#1a3352_100%)] px-6 py-10 text-left sm:px-10 sm:py-14"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#3B8FD9]/20 blur-3xl transition duration-700 group-hover:bg-[#3B8FD9]/30" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7eb8e8]">Mission</p>
            <p
              className={`mt-5 ${visionSerif.className} text-3xl leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem] ${
                mission ? "" : "text-white/35"
              }`}
            >
              {mission || "Write the sentence that outlives the day."}
            </p>
            <p className="mt-4 max-w-md text-sm text-slate-400">
              Why you exist in public life
              <span className="ml-3 text-[#7eb8e8] opacity-0 transition group-hover:opacity-100">· Edit</span>
            </p>
          </div>
        </button>

        {/* Somalia 2050 */}
        <button
          type="button"
          onClick={() => open("somalia2050")}
          className="group relative block w-full overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(90deg,#e8f1f9_0%,#f4f7fb_55%,#eef6f4_100%)] px-6 py-8 text-left sm:px-10"
        >
          <div className="relative max-w-3xl">
            <div className="flex items-baseline gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1d6aa8]">Somalia 2050</p>
              <span className="h-px flex-1 bg-[#3B8FD9]/25" />
            </div>
            <p
              className={`mt-4 ${visionSerif.className} text-xl leading-snug text-slate-800 sm:text-2xl ${
                somalia ? "" : "text-slate-300"
              }`}
            >
              {somalia || "Describe the nation you are building toward."}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Long horizon
              <span className="ml-2 text-[#1d6aa8] opacity-0 transition group-hover:opacity-100">· Edit</span>
            </p>
          </div>
        </button>

        {/* Supporting pillars */}
        <div className="space-y-3 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {VISION_FIELDS.filter((f) => f.key !== "quotes").map((field) => (
              <VisionPanel
                key={field.key}
                title={field.title}
                hint={field.hint}
                body={form[field.key]}
                empty="Empty — click to write."
                accent={field.accent}
                onEdit={() => open(field.key)}
              />
            ))}
          </div>
          <VisionPanel
            title="Favorite quotes"
            hint="Words that keep you sharp"
            body={form.quotes}
            empty="Pin the lines you return to."
            accent="bg-rose-500"
            onEdit={() => open("quotes")}
            large
          />
        </div>

        <p className="border-t border-slate-200/80 px-6 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Private charter · admin only
        </p>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit · ${activeTitle}`}
        wide
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!editing) return;
            setSaving(true);
            try {
              const next = { ...form, [editing]: draft };
              await mcFetch("/api/admin/mission-control/meta", { method: "POST", body: JSON.stringify(next) });
              setForm(next);
              setEditing(null);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label={activeHint}>
            <textarea className={inputClass} rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

type MonthReview = {
  id: string;
  monthKey: string;
  accomplished: string;
  failed: string;
  learned: string;
  mistake: string;
  priorities: string;
  score: number;
};

type YearReview = {
  id: string;
  yearKey: string;
  completed: string;
  statistics: string;
  lessons: string;
  achievements: string;
  failures: string;
  goalsReached: string;
  goalsMissed: string;
};

type PeriodReport = {
  period: string;
  kind: "month" | "year";
  label: string;
  successPercentage: number;
  selfScore: number | null;
  stats: Record<string, number>;
  lists: {
    books: { id: string; title: string; author?: string; category?: string }[];
    writings: { id: string; title: string; type?: string }[];
    ministries: { id: string; name: string }[];
    countries: { id: string; country: string }[];
    speaking: { id: string; title: string; topic?: string; durationMin?: number }[];
    goals: { id: string; title: string; category?: string; progress?: number }[];
    monthlyReviews?: { id: string; monthKey: string; score: number; accomplished: string }[];
  };
  habitBreakdown: { id: string; name: string; daysDone: number; rate: number }[];
  review: MonthReview | YearReview | null;
};

export function ReviewsSection() {
  const [tab, setTab] = useState<"monthly" | "yearly">("monthly");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = String(new Date().getFullYear());

  const monthly = useCollection<MonthReview>("monthly");
  const yearly = useCollection<YearReview>("yearly");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{ kind: "month" | "year"; key: string } | null>(null);
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [monthForm, setMonthForm] = useState({
    monthKey: currentMonth,
    accomplished: "",
    failed: "",
    learned: "",
    mistake: "",
    priorities: "",
    score: 7,
  });
  const [yearForm, setYearForm] = useState({
    yearKey: currentYear,
    completed: "",
    statistics: "",
    lessons: "",
    achievements: "",
    failures: "",
    goalsReached: "",
    goalsMissed: "",
  });

  const openPeriod = async (kind: "month" | "year", key: string) => {
    setSelectedPeriod({ kind, key });
    setReportLoading(true);
    setEditing(false);
    try {
      const q = kind === "month" ? `month=${key}` : `year=${key}`;
      const data = await mcFetch<PeriodReport>(`/api/admin/mission-control/period?${q}`);
      setReport(data);
      if (kind === "month") {
        const r = monthly.items.find((i) => i.monthKey === key);
        if (r) {
          setMonthForm({
            monthKey: r.monthKey,
            accomplished: r.accomplished,
            failed: r.failed,
            learned: r.learned,
            mistake: r.mistake,
            priorities: r.priorities,
            score: r.score,
          });
        } else {
          setMonthForm({
            monthKey: key,
            accomplished: "",
            failed: "",
            learned: "",
            mistake: "",
            priorities: "",
            score: 7,
          });
        }
      } else {
        const r = yearly.items.find((i) => i.yearKey === key);
        if (r) {
          setYearForm({
            yearKey: r.yearKey,
            completed: r.completed,
            statistics: r.statistics,
            lessons: r.lessons,
            achievements: r.achievements,
            failures: r.failures,
            goalsReached: r.goalsReached,
            goalsMissed: r.goalsMissed,
          });
        }
      }
    } finally {
      setReportLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedPeriod(null);
    setReport(null);
    setEditing(false);
  };

  if (selectedPeriod) {
    const monthReview = monthly.items.find((i) => i.monthKey === selectedPeriod.key);
    const yearReview = yearly.items.find((i) => i.yearKey === selectedPeriod.key);

    return (
      <div>
        <button type="button" className={`${btnGhost} mb-4`} onClick={closeDetail}>
          ← Back to Reviews
        </button>

        {reportLoading || !report ? (
          <p className="text-sm text-slate-400">Loading period report…</p>
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white shadow-[0_16px_40px_rgba(59,143,217,0.08)]">
              <div className="grid gap-6 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40 p-6 lg:grid-cols-[1.3fr_auto] lg:p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B8FD9]">
                    {report.kind === "month" ? "Monthly review" : "Yearly review"}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{report.label}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Everything you built, learned, and missed in this period — plus auto stats from Mission Control.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className={btnPrimary} onClick={() => setEditing(true)}>
                      Edit reflection
                    </button>
                    <span className="inline-flex items-center rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                      Self score{" "}
                      <strong className="ml-1.5 text-slate-900">
                        {report.selfScore != null ? `${report.selfScore}/10` : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-3xl border border-sky-100 bg-white px-8 py-6 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700/55">Success</p>
                  <p className="mt-1 text-5xl font-semibold tracking-tight text-[#1d6aa8]">{report.successPercentage}%</p>
                  <div className="mt-3 w-40">
                    <ProgressBar value={report.successPercentage} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Work days" value={report.stats.workDays} tone={0} />
              <StatCard label="Books completed" value={report.stats.booksCompleted} tone={1} />
              <StatCard label="Published" value={report.stats.published} tone={2} />
              <StatCard label="Goals completed" value={report.stats.goalsCompleted} tone={3} />
              <StatCard label="Ministries done" value={report.stats.ministriesCompleted} tone={4} />
              <StatCard label="Countries done" value={report.stats.countriesCompleted} tone={0} />
              <StatCard
                label="Speaking"
                value={report.stats.speakingSessions}
                hint={`${report.stats.speakingHours}h`}
                tone={1}
              />
              <StatCard label="Tasks done" value={report.stats.tasksDone} tone={2} />
            </div>

            {selectedPeriod.kind === "month" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {(
                  [
                    ["accomplished", "What I accomplished", monthReview?.accomplished ?? monthForm.accomplished, "from-emerald-50 to-white border-emerald-200"],
                    ["learned", "What I learned", monthReview?.learned ?? monthForm.learned, "from-sky-50 to-white border-sky-200"],
                    ["mistake", "Biggest mistakes", monthReview?.mistake ?? monthForm.mistake, "from-rose-50 to-white border-rose-200"],
                    ["failed", "What failed", monthReview?.failed ?? monthForm.failed, "from-orange-50 to-white border-orange-200"],
                    ["priorities", "Next priorities", monthReview?.priorities ?? monthForm.priorities, "from-violet-50 to-white border-violet-200"],
                  ] as const
                ).map(([key, title, body, tone]) => (
                  <div
                    key={key}
                    className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${tone} ${
                      key === "accomplished" || key === "learned" ? "lg:col-span-2" : ""
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {body?.trim() || "Not written yet — edit reflection to fill this in."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {(
                  [
                    ["completed", "Everything completed", yearReview?.completed ?? yearForm.completed, "from-emerald-50 to-white border-emerald-200"],
                    ["achievements", "Achievements", yearReview?.achievements ?? yearForm.achievements, "from-amber-50 to-white border-amber-200"],
                    ["lessons", "Lessons", yearReview?.lessons ?? yearForm.lessons, "from-sky-50 to-white border-sky-200"],
                    ["failures", "Failures", yearReview?.failures ?? yearForm.failures, "from-rose-50 to-white border-rose-200"],
                    ["goalsReached", "Goals reached", yearReview?.goalsReached ?? yearForm.goalsReached, "from-violet-50 to-white border-violet-200"],
                    ["goalsMissed", "Goals missed", yearReview?.goalsMissed ?? yearForm.goalsMissed, "from-orange-50 to-white border-orange-200"],
                  ] as const
                ).map(([key, title, body, tone]) => (
                  <div key={key} className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${tone}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {body?.trim() || "Not written yet — edit reflection to fill this in."}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Books completed</h3>
                {report.lists.books.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">No books marked completed in this period.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {report.lists.books.map((b) => (
                      <li key={b.id} className="rounded-xl bg-emerald-50/80 px-3 py-2 text-sm text-slate-700">
                        {b.title}
                        {b.author ? <span className="text-slate-400"> · {b.author}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Published writing</h3>
                {report.lists.writings.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Nothing published in this period.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {report.lists.writings.map((w) => (
                      <li key={w.id} className="rounded-xl bg-amber-50/80 px-3 py-2 text-sm text-slate-700">
                        {w.title}
                        {w.type ? <span className="text-slate-400"> · {w.type}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Goals completed</h3>
                {report.lists.goals.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">No goals completed in this period.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {report.lists.goals.map((g) => (
                      <li key={g.id} className="rounded-xl bg-violet-50/80 px-3 py-2 text-sm text-slate-700">
                        {g.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Studies & speaking</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {report.lists.ministries.map((m) => (
                    <li key={m.id} className="rounded-xl bg-rose-50/80 px-3 py-2">
                      Ministry · {m.name}
                    </li>
                  ))}
                  {report.lists.countries.map((c) => (
                    <li key={c.id} className="rounded-xl bg-teal-50/80 px-3 py-2">
                      Country · {c.country}
                    </li>
                  ))}
                  {report.lists.speaking.map((s) => (
                    <li key={s.id} className="rounded-xl bg-orange-50/80 px-3 py-2">
                      Speaking · {s.title}
                      {s.durationMin ? ` (${s.durationMin}m)` : ""}
                    </li>
                  ))}
                  {report.lists.ministries.length + report.lists.countries.length + report.lists.speaking.length === 0 ? (
                    <li className="text-slate-400">No study/speaking completions logged.</li>
                  ) : null}
                </ul>
              </div>
            </div>

            {report.habitBreakdown.length > 0 ? (
              <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Habit consistency this month</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {report.habitBreakdown.map((h, i) => (
                    <div key={h.id} className={`rounded-xl border bg-gradient-to-br p-3 ${listCardTone(i)}`}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-700">{h.name}</span>
                        <span className="text-slate-600">{h.rate}%</span>
                      </div>
                      <ProgressBar value={h.rate} tone={i} />
                      <p className="mt-1 text-[11px] text-slate-400">{h.daysDone} days</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <Modal
          open={editing}
          onClose={() => setEditing(false)}
          title={selectedPeriod.kind === "month" ? `Edit · ${selectedPeriod.key}` : `Edit · ${selectedPeriod.key}`}
          wide
        >
          {selectedPeriod.kind === "month" ? (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const existing = monthly.items.find((i) => i.monthKey === monthForm.monthKey);
                if (existing) await monthly.update(existing.id, monthForm);
                else await monthly.create(monthForm);
                setEditing(false);
                await openPeriod("month", monthForm.monthKey);
              }}
            >
              {(
                [
                  ["accomplished", "What did I accomplish?"],
                  ["failed", "What failed?"],
                  ["learned", "What did I learn?"],
                  ["mistake", "Biggest mistakes?"],
                  ["priorities", "Next month's priorities?"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={monthForm[key]}
                    onChange={(e) => setMonthForm({ ...monthForm, [key]: e.target.value })}
                  />
                </Field>
              ))}
              <Field label="Score out of 10">
                <input
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={monthForm.score}
                  onChange={(e) => setMonthForm({ ...monthForm, score: Number(e.target.value) })}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <button type="button" className={btnGhost} onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Save reflection
                </button>
              </div>
            </form>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const existing = yearly.items.find((i) => i.yearKey === yearForm.yearKey);
                if (existing) await yearly.update(existing.id, yearForm);
                else await yearly.create(yearForm);
                setEditing(false);
                await openPeriod("year", yearForm.yearKey);
              }}
            >
              {(
                [
                  ["completed", "Everything completed"],
                  ["statistics", "Statistics notes"],
                  ["lessons", "Lessons"],
                  ["achievements", "Achievements"],
                  ["failures", "Failures"],
                  ["goalsReached", "Goals reached"],
                  ["goalsMissed", "Goals missed"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={yearForm[key]}
                    onChange={(e) => setYearForm({ ...yearForm, [key]: e.target.value })}
                  />
                </Field>
              ))}
              <div className="flex justify-end gap-2">
                <button type="button" className={btnGhost} onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Save reflection
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Reviews"
        subtitle="Click any month or year to open the full report — stats, books, lessons, mistakes, success %."
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              if (tab === "monthly") {
                setMonthForm({
                  monthKey: currentMonth,
                  accomplished: "",
                  failed: "",
                  learned: "",
                  mistake: "",
                  priorities: "",
                  score: 7,
                });
              } else {
                setYearForm({
                  yearKey: currentYear,
                  completed: "",
                  statistics: "",
                  lessons: "",
                  achievements: "",
                  failures: "",
                  goalsReached: "",
                  goalsMissed: "",
                });
              }
              setCreateOpen(true);
            }}
          >
            {tab === "monthly" ? "Create monthly review" : "Create yearly review"}
          </button>
        }
      />

      <div className="mb-5 flex gap-1.5">
        {(
          [
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-gradient-to-b from-[#4B9CD3] to-[#3B8FD9] text-white shadow-sm"
                : "border border-sky-100 bg-white text-slate-500 hover:bg-sky-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={tab === "monthly" ? "Create monthly review" : "Create yearly review"}
        wide
      >
        {tab === "monthly" ? (
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const existing = monthly.items.find((i) => i.monthKey === monthForm.monthKey);
              if (existing) await monthly.update(existing.id, monthForm);
              else await monthly.create(monthForm);
              setCreateOpen(false);
              await openPeriod("month", monthForm.monthKey);
            }}
          >
            <Field label="Month">
              <input
                type="month"
                className={inputClass}
                value={monthForm.monthKey}
                onChange={(e) => setMonthForm({ ...monthForm, monthKey: e.target.value })}
                required
              />
            </Field>
            {(
              [
                ["accomplished", "What did I accomplish?"],
                ["failed", "What failed?"],
                ["learned", "What did I learn?"],
                ["mistake", "Biggest mistakes?"],
                ["priorities", "Next month's priorities?"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={monthForm[key]}
                  onChange={(e) => setMonthForm({ ...monthForm, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Score out of 10">
              <input
                type="number"
                min={0}
                max={10}
                className={inputClass}
                value={monthForm.score}
                onChange={(e) => setMonthForm({ ...monthForm, score: Number(e.target.value) })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary}>
                Create & open
              </button>
            </div>
          </form>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const existing = yearly.items.find((i) => i.yearKey === yearForm.yearKey);
              if (existing) await yearly.update(existing.id, yearForm);
              else await yearly.create(yearForm);
              setCreateOpen(false);
              await openPeriod("year", yearForm.yearKey);
            }}
          >
            <Field label="Year">
              <input
                className={inputClass}
                value={yearForm.yearKey}
                onChange={(e) => setYearForm({ ...yearForm, yearKey: e.target.value })}
                placeholder="2026"
                required
              />
            </Field>
            {(
              [
                ["completed", "Everything completed"],
                ["lessons", "Lessons"],
                ["achievements", "Achievements"],
                ["failures", "Failures"],
                ["goalsReached", "Goals reached"],
                ["goalsMissed", "Goals missed"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={yearForm[key]}
                  onChange={(e) => setYearForm({ ...yearForm, [key]: e.target.value })}
                />
              </Field>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary}>
                Create & open
              </button>
            </div>
          </form>
        )}
      </Modal>

      {tab === "monthly" ? (
        monthly.loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : monthly.items.length === 0 ? (
          <EmptyState title="No monthly reviews yet" body="Create a review for a month, then click it to see the full report." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[...monthly.items]
              .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
              .map((r, index) => {
                const tones = [
                  "from-emerald-50 to-white border-emerald-200",
                  "from-amber-50 to-white border-amber-200",
                  "from-rose-50 to-white border-rose-200",
                  "from-violet-50 to-white border-violet-200",
                  "from-teal-50 to-white border-teal-200",
                  "from-orange-50 to-white border-orange-200",
                ];
                const badges = [
                  "bg-emerald-100 text-emerald-800",
                  "bg-amber-100 text-amber-800",
                  "bg-rose-100 text-rose-800",
                  "bg-violet-100 text-violet-800",
                  "bg-teal-100 text-teal-800",
                  "bg-orange-100 text-orange-800",
                ];
                return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => void openPeriod("month", r.monthKey)}
                    className={`group w-full rounded-2xl border bg-gradient-to-br p-5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] ${tones[index % tones.length]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Month</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {new Date(`${r.monthKey}-01`).toLocaleString(undefined, { month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badges[index % badges.length]}`}>
                        {r.score}/10
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {r.accomplished || r.learned || "Open to see full month report."}
                    </p>
                    <p className="mt-3 text-xs font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
                      Open report →
                    </p>
                  </button>
                </li>
              );
              })}
          </ul>
        )
      ) : yearly.loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : yearly.items.length === 0 ? (
        <EmptyState title="No yearly reviews yet" body="Create an annual review, then click it to open the full year report." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...yearly.items]
            .sort((a, b) => b.yearKey.localeCompare(a.yearKey))
            .map((r, index) => {
              const tones = [
                "from-violet-50 to-white border-violet-200",
                "from-teal-50 to-white border-teal-200",
                "from-amber-50 to-white border-amber-200",
                "from-rose-50 to-white border-rose-200",
              ];
              return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => void openPeriod("year", r.yearKey)}
                  className={`group w-full rounded-2xl border bg-gradient-to-br p-5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] ${tones[index % tones.length]}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Year</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{r.yearKey}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                    {r.completed || r.achievements || "Open to see full year report."}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
                    Open report →
                  </p>
                </button>
              </li>
            );
            })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  btnGhost,
  btnPrimary,
  cardInteractive,
  ConsistencyRing,
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
import { GOAL_HORIZONS } from "@/lib/mission-control/types";

type Dash = {
  welcome: string;
  today: string;
  dailyQuote: string;
  streak: number;
  monthlyProgress: number;
  yearlyProgress: number;
  weeklyGoalsCompleted: number;
  weeklyGoalsTotal: number;
  categoryProgress: { category: string; progress: number; count: number }[];
  upcomingTasks: { id: string; title: string; dueDate?: string | null; priority: string; status: string }[];
  widgets: Record<string, number>;
  habitStreaks: { id: string; name: string; streak: number }[];
  consistencyScore: number;
  calendar: { monthKey: string; workDates: string[]; journalDates: string[] };
  range: { from: string; to: string; workDays: number };
};

type RangePreset = "today" | "last7" | "thisWeek" | "thisMonth" | "thisYear" | "custom";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function rangeForPreset(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const today = toKey(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "last7") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: toKey(from), to: today };
  }
  if (preset === "thisWeek") {
    return { from: toKey(startOfWeek(now)), to: today };
  }
  if (preset === "thisYear") {
    return { from: `${now.getFullYear()}-01-01`, to: today };
  }
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today };
}

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 days" },
  { key: "thisWeek", label: "This week" },
  { key: "thisMonth", label: "This month" },
  { key: "thisYear", label: "This year" },
  { key: "custom", label: "Custom" },
];

export function DashboardSection() {
  const [data, setData] = useState<Dash | null>(null);
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState<RangePreset>("thisMonth");
  const initial = useMemo(() => rangeForPreset("thisMonth"), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const load = async (range = { from, to }) => {
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to }).toString();
      const d = await mcFetch<Dash>(`/api/admin/mission-control/dashboard?${qs}`);
      setData(d);
      setQuote(d.dailyQuote);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  };

  useEffect(() => {
    void load({ from, to });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (next: RangePreset) => {
    setPreset(next);
    if (next === "custom") return;
    const range = rangeForPreset(next);
    setFrom(range.from);
    setTo(range.to);
    void load(range);
  };

  const applyCustom = () => {
    setPreset("custom");
    void load({ from, to });
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading command center…</p>;

  const w = data.widgets;
  const weekPct =
    data.weeklyGoalsTotal > 0 ? Math.round((data.weeklyGoalsCompleted / data.weeklyGoalsTotal) * 100) : 0;
  const daysInCalMonth = new Date(
    Number(data.calendar.monthKey.slice(0, 4)),
    Number(data.calendar.monthKey.slice(5, 7)),
    0
  ).getDate();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Date filter</p>
            <p className="mt-1 text-sm text-slate-600">
              Showing <strong className="text-slate-900">{data.range.from}</strong> →{" "}
              <strong className="text-slate-900">{data.range.to}</strong>
              <span className="text-slate-400"> · {data.range.workDays} check-ins</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  preset === p.key
                    ? "bg-[#1d6aa8] text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {preset === "custom" ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="From">
              <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <button type="button" className={btnPrimary} onClick={applyCustom}>
              Apply
            </button>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-sky-100/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(59,143,217,0.08)]">
        <div className="relative grid gap-6 overflow-hidden p-6 lg:grid-cols-[1.45fr_auto] lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3B8FD9]/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B8FD9]">Mission Control</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{data.welcome}</h2>
            <p className="mt-2 text-sm text-slate-500">{data.today}</p>
            <div className="mt-5 max-w-xl rounded-2xl border border-sky-100/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700/50">Today&apos;s line</p>
              <p className="mt-1 text-base leading-relaxed text-slate-700">“{data.dailyQuote}”</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnPrimary}
                disabled={checkingIn}
                onClick={async () => {
                  setCheckingIn(true);
                  try {
                    await mcFetch("/api/admin/mission-control/dashboard", {
                      method: "POST",
                      body: JSON.stringify({ action: "checkin", from, to }),
                    });
                    await load({ from, to });
                  } finally {
                    setCheckingIn(false);
                  }
                }}
              >
                {checkingIn ? "Checking in…" : "Check in today"}
              </button>
              <span className="inline-flex items-center rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                Streak <strong className="ml-1.5 text-[#1d6aa8]">{data.streak}d</strong>
              </span>
              <span className="inline-flex items-center rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                Consistency <strong className="ml-1.5 text-slate-900">{data.consistencyScore}</strong>
              </span>
            </div>
          </div>
          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/90 px-6 py-5 shadow-sm">
            <ConsistencyRing score={data.consistencyScore} />
            <p className="mt-2 text-center text-xs text-slate-500">Overall consistency</p>
          </div>
        </div>

        <div className="grid gap-px border-t border-slate-200/80 bg-slate-200/60 sm:grid-cols-3">
          <div className="bg-gradient-to-br from-emerald-50/80 to-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700/60">Month</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.monthlyProgress}%</p>
            <ProgressBar value={data.monthlyProgress} className="mt-3" tone={0} />
          </div>
          <div className="bg-gradient-to-br from-amber-50/80 to-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700/60">Year</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.yearlyProgress}%</p>
            <ProgressBar value={data.yearlyProgress} className="mt-3" tone={1} />
          </div>
          <div className="bg-gradient-to-br from-violet-50/80 to-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700/60">Weekly goals</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {data.weeklyGoalsCompleted}/{data.weeklyGoalsTotal}
            </p>
            <ProgressBar value={weekPct} className="mt-3" tone={3} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-[0_8px_24px_rgba(59,143,217,0.06)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Daily quote</h3>
          <button
            type="button"
            disabled={saving}
            className={btnGhost}
            onClick={async () => {
              setSaving(true);
              try {
                await mcFetch("/api/admin/mission-control/meta", {
                  method: "POST",
                  body: JSON.stringify({ dailyQuote: quote }),
                });
                await load({ from, to });
              } finally {
                setSaving(false);
              }
            }}
          >
            Save quote
          </button>
        </div>
        <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} className={`${inputClass} resize-y`} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">At a glance · selected range</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Books completed" value={w.booksThisMonth} hint={`${w.booksThisYear} this year`} tone={0} />
          <StatCard label="Briefs published" value={w.politicalBriefsPublished} tone={1} />
          <StatCard label="Policy papers" value={w.policyPapersWritten} tone={2} />
          <StatCard label="Ministries completed" value={w.ministriesCompleted} tone={3} />
          <StatCard label="Countries completed" value={w.countriesCompleted} tone={4} />
          <StatCard
            label="Speaking sessions"
            value={w.publicSpeakingSessions}
            hint={`${w.speakingHours}h practiced`}
            tone={5}
          />
          <StatCard label="Check-ins" value={w.workDaysInRange} tone={6} />
          <StatCard label="Videos recorded" value={w.videosRecorded} tone={7} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Focus · upcoming tasks</h3>
          {data.upcomingTasks.length === 0 ? (
            <EmptyState title="No open tasks" body="Create tasks to fill your focus list." />
          ) : (
            <ul className="space-y-2">
              {data.upcomingTasks.map((t, i) => {
                const badges = [
                  "from-emerald-500 to-teal-400",
                  "from-amber-500 to-orange-400",
                  "from-rose-500 to-pink-400",
                  "from-violet-500 to-fuchsia-400",
                  "from-sky-500 to-cyan-400",
                  "from-lime-500 to-emerald-400",
                ];
                return (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-4 py-3 shadow-sm ${listCardTone(i)}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm ${badges[i % badges.length]}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-400">
                        {t.priority}
                        {t.dueDate ? ` · due ${String(t.dueDate).slice(0, 10)}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-700">Category progress</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.categoryProgress.length === 0 ? (
              <p className="text-sm text-slate-400">Add goals with categories to track progress here.</p>
            ) : (
              data.categoryProgress.slice(0, 6).map((c, i) => (
                <div key={c.category} className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${listCardTone(i)}`}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{c.category}</span>
                    <span className="text-slate-600">{c.progress}%</span>
                  </div>
                  <ProgressBar value={c.progress} tone={i} />
                  <p className="mt-2 text-[11px] text-slate-400">{c.count} goals</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Calendar · {data.calendar.monthKey}</h3>
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm">
              <div className="mb-3 flex gap-4 text-xs text-slate-500">
                <span>
                  Check-ins <strong className="text-slate-800">{data.calendar.workDates.length}</strong>
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: daysInCalMonth }, (_, i) => {
                  const day = String(i + 1).padStart(2, "0");
                  const key = `${data.calendar.monthKey}-${day}`;
                  const worked = data.calendar.workDates.includes(key);
                  return (
                    <div
                      key={day}
                      title={worked ? `Checked in · ${key}` : key}
                      className={`flex h-9 items-center justify-center rounded-lg text-[11px] font-medium ${
                        worked
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      {worked ? (
                        <span className="flex flex-col items-center leading-none">
                          <span className="text-base font-bold text-emerald-600">✓</span>
                          <span className="mt-0.5 text-[9px] text-emerald-700/80">{i + 1}</span>
                        </span>
                      ) : (
                        i + 1
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-3 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="font-bold text-emerald-600">✓</span> Checked in
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Habit streaks</h3>
            <div className="space-y-2">
              {data.habitStreaks.slice(0, 8).map((h, i) => {
                const accents = [
                  "text-emerald-600",
                  "text-amber-600",
                  "text-rose-600",
                  "text-violet-600",
                  "text-teal-600",
                  "text-orange-600",
                  "text-sky-600",
                  "text-fuchsia-600",
                ];
                return (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between rounded-xl border bg-gradient-to-r px-3 py-2.5 text-sm shadow-sm ${listCardTone(i)}`}
                  >
                    <span className="text-slate-700">{h.name}</span>
                    <span className={`font-semibold ${accents[i % accents.length]}`}>{h.streak}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type Goal = {
  id: string;
  horizon: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline?: string | null;
  status: string;
  progress: number;
  notes: string;
  tags: string[];
};

const emptyGoal = {
  title: "",
  description: "",
  priority: "medium",
  category: "",
  deadline: "",
  status: "active",
  progress: 0,
  notes: "",
  tags: "",
};

function GoalFormFields({
  form,
  setForm,
}: {
  form: typeof emptyGoal;
  setForm: (f: typeof emptyGoal) => void;
}) {
  return (
    <>
      <Field label="Title">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </Field>
      <Field label="Category">
        <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      </Field>
      <Field label="Priority">
        <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </Field>
      <Field label="Status">
        <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </Field>
      <Field label="Deadline">
        <input type="date" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
      </Field>
      <Field label="Progress %">
        <input
          type="number"
          min={0}
          max={100}
          className={inputClass}
          value={form.progress}
          onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description (Markdown)">
          <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Notes">
          <textarea className={inputClass} rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
      <Field label="Tags (comma-separated)">
        <input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      </Field>
    </>
  );
}

export function GoalsSection() {
  const { items, loading, q, setQ, create, update, remove, reload } = useCollection<Goal>("goals");
  const [horizon, setHorizon] = useState("1-year");
  const [form, setForm] = useState(emptyGoal);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((g) => g.horizon === horizon);
  const selected = items.find((g) => g.id === selectedId) ?? null;

  const openDetail = (g: Goal) => {
    setSelectedId(g.id);
    setForm({
      title: g.title,
      description: g.description,
      priority: g.priority,
      category: g.category,
      deadline: g.deadline ? String(g.deadline).slice(0, 10) : "",
      status: g.status,
      progress: g.progress,
      notes: g.notes,
      tags: (g.tags ?? []).join(", "),
    });
  };

  if (selected) {
    return (
      <div>
        <button type="button" onClick={() => setSelectedId(null)} className={`${btnGhost} mb-3`}>
          ← Back to Goals
        </button>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{form.title || selected.title}</h2>
            <p className="mt-1 text-sm text-slate-500 capitalize">
              {selected.horizon} · {form.category || "General"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={async () => {
                if (!window.confirm(`Delete “${selected.title}”?`)) return;
                await remove(selected.id);
                setSelectedId(null);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await update(selected.id, {
                    ...form,
                    horizon: selected.horizon,
                    progress: Number(form.progress) || 0,
                    deadline: form.deadline || null,
                    tags: form.tags,
                  });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 p-5 shadow-[0_8px_24px_rgba(59,143,217,0.06)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <GoalFormFields form={form} setForm={setForm} />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{form.progress}%</span>
            </div>
            <ProgressBar value={form.progress} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Goals"
        subtitle="Lifetime through daily. Click a goal to open it."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void reload()}
              placeholder="Search goals…"
              className={`${inputClass} w-44`}
            />
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                setForm(emptyGoal);
                setCreateOpen(true);
              }}
            >
              Create goal
            </button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {GOAL_HORIZONS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHorizon(h)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              horizon === h
                ? "bg-gradient-to-b from-[#4B9CD3] to-[#3B8FD9] text-white shadow-sm"
                : "border border-sky-100 bg-white text-slate-500 hover:bg-sky-50"
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create goal" wide>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            setSaving(true);
            try {
              const created = await create({
                ...form,
                horizon,
                progress: Number(form.progress) || 0,
                deadline: form.deadline || null,
                tags: form.tags,
              });
              setCreateOpen(false);
              setForm(emptyGoal);
              openDetail(created);
            } finally {
              setSaving(false);
            }
          }}
        >
          <GoalFormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={btnGhost} onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Creating…" : "Create goal"}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${horizon} goals`} body='Click “Create goal” to add your first target.' />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((g, index) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => openDetail(g)}
                className={`${cardInteractive} ${listCardTone(index)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{g.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {g.category || "General"} · {g.priority} · {g.status}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
                    Open →
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={g.progress} tone={index} />
                </div>
                {g.description ? <p className="mt-3 line-clamp-2 text-sm text-slate-600">{g.description}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

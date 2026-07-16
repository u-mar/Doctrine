"use client";

import { useEffect, useState } from "react";
import {
  btnGhost,
  btnPrimary,
  EmptyState,
  Field,
  inputClass,
  mcFetch,
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
};

export function DashboardSection() {
  const [data, setData] = useState<Dash | null>(null);
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const d = await mcFetch<Dash>("/api/admin/mission-control/dashboard");
      setData(d);
      setQuote(d.dailyQuote);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-white/40">Loading command center…</p>;
  }

  const w = data.widgets;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4B9CD3]">Mission Control</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{data.welcome}</h2>
          <p className="mt-1 text-sm text-white/45">{data.today}</p>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={async () => {
            await mcFetch("/api/admin/mission-control/dashboard", {
              method: "POST",
              body: JSON.stringify({ action: "checkin" }),
            });
            await load();
          }}
        >
          Check in today
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#4B9CD3]/15 via-white/[0.03] to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Daily quote</p>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={2}
              className={`${inputClass} mt-2 resize-y`}
            />
          </div>
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
                await load();
              } finally {
                setSaving(false);
              }
            }}
          >
            Save quote
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current streak" value={`${data.streak}d`} hint="Consecutive work days" />
        <StatCard label="Monthly progress" value={`${data.monthlyProgress}%`} />
        <StatCard label="Yearly progress" value={`${data.yearlyProgress}%`} />
        <StatCard
          label="Weekly goals"
          value={`${data.weeklyGoalsCompleted}/${data.weeklyGoalsTotal}`}
          hint={`Consistency ${data.consistencyScore}`}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-white/70">Category progress</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.categoryProgress.length === 0 ? (
            <p className="text-sm text-white/40">Add goals with categories to see progress here.</p>
          ) : (
            data.categoryProgress.map((c) => (
              <div key={c.category} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-white/80">{c.category}</span>
                  <span className="text-white/45">{c.progress}%</span>
                </div>
                <ProgressBar value={c.progress} />
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-white/70">Widgets</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Books this month" value={w.booksThisMonth} />
          <StatCard label="Policy papers" value={w.policyPapersWritten} />
          <StatCard label="Briefs published" value={w.politicalBriefsPublished} />
          <StatCard label="Videos recorded" value={w.videosRecorded} />
          <StatCard label="Ministries done" value={w.ministriesCompleted} />
          <StatCard label="Countries done" value={w.countriesCompleted} />
          <StatCard label="Gov projects" value={w.governmentProjectsCompleted} />
          <StatCard label="Meetings (month)" value={w.meetingsNetworking} />
          <StatCard label="Speaking sessions" value={w.publicSpeakingSessions} />
          <StatCard label="Workout streak" value={`${w.workoutStreak}d`} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium text-white/70">Upcoming tasks</h3>
          {data.upcomingTasks.length === 0 ? (
            <EmptyState title="No open tasks" body="Add tasks to plan your week." />
          ) : (
            <ul className="space-y-2">
              {data.upcomingTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-sm text-white/90">{t.title}</span>
                  <span className="text-[11px] uppercase tracking-wider text-white/40">{t.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium text-white/70">Calendar · {data.calendar.monthKey}</h3>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-white/45">
              Work days: <span className="text-white/80">{data.calendar.workDates.length}</span>
            </p>
            <p className="mt-1 text-xs text-white/45">
              Journal days: <span className="text-white/80">{data.calendar.journalDates.length}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {data.calendar.workDates.map((d) => (
                <span key={d} className="rounded-md bg-[#4B9CD3]/20 px-1.5 py-0.5 text-[10px] text-[#9FD0EE]">
                  {d.slice(8)}
                </span>
              ))}
            </div>
          </div>
          <h3 className="mb-3 mt-6 text-sm font-medium text-white/70">Habit streaks</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.habitStreaks.slice(0, 6).map((h) => (
              <div key={h.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                <span className="text-white/70">{h.name}</span>
                <span className="float-right text-[#4B9CD3]">{h.streak}d</span>
              </div>
            ))}
          </div>
        </div>
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

export function GoalsSection() {
  const { items, loading, q, setQ, create, update, remove, reload } = useCollection<Goal>("goals");
  const [horizon, setHorizon] = useState("1-year");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    deadline: "",
    status: "active",
    progress: 0,
    notes: "",
    tags: "",
  });
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = items.filter((g) => g.horizon === horizon);

  return (
    <div>
      <SectionHeader
        title="Goals"
        subtitle="Lifetime through daily — every horizon in one vault."
        action={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void reload()}
            placeholder="Search goals…"
            className={`${inputClass} w-48`}
          />
        }
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {GOAL_HORIZONS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHorizon(h)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              horizon === h ? "bg-[#4B9CD3] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      <form
        className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          const payload = {
            ...form,
            horizon,
            progress: Number(form.progress) || 0,
            deadline: form.deadline || null,
            tags: form.tags,
          };
          if (editing) {
            await update(editing, payload);
            setEditing(null);
          } else {
            await create(payload);
          }
          setForm({
            title: "",
            description: "",
            priority: "medium",
            category: "",
            deadline: "",
            status: "active",
            progress: 0,
            notes: "",
            tags: "",
          });
        }}
      >
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
          <input type="number" min={0} max={100} className={inputClass} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description (Markdown)">
            <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <Field label="Tags (comma-separated)">
          <input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </Field>
        <div className="flex items-end gap-2">
          <button type="submit" className={btnPrimary}>
            {editing ? "Update goal" : "Add goal"}
          </button>
          {editing ? (
            <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${horizon} goals`} body="Create your first target in this horizon." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((g) => (
            <li key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{g.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {g.category || "General"} · {g.priority} · {g.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditing(g.id);
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
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={btnGhost} onClick={() => void remove(g.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-white/45">
                  <span>Progress</span>
                  <span>{g.progress}%</span>
                </div>
                <ProgressBar value={g.progress} />
              </div>
              {g.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-white/55">{g.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
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

type Habit = { id: string; name: string; category: string; active: boolean };
type HabitLog = { id: string; habitId: string; dateKey: string; done: boolean };

export function HabitsSection() {
  const { items: habits, create, reload } = useCollection<Habit>("habits");
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [name, setName] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const loadLogs = async () => {
    const rows = await mcFetch<HabitLog[]>("/api/admin/mission-control/habit-logs");
    setLogs(rows);
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const doneToday = useMemo(() => {
    const set = new Set(logs.filter((l) => l.dateKey === today && l.done).map((l) => l.habitId));
    return set;
  }, [logs, today]);

  return (
    <div>
      <SectionHeader title="Habit Tracker" subtitle="Daily discipline compounds into leadership." />
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await create({ name, category: "daily", active: true });
          setName("");
        }}
      >
        <input className={`${inputClass} max-w-xs`} placeholder="New habit" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className={btnPrimary}>
          Add habit
        </button>
      </form>

      {habits.length === 0 ? (
        <EmptyState title="No habits" body="Defaults load on first dashboard visit — or add your own." />
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const on = doneToday.has(h.id);
            return (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-sm text-white/90">{h.name}</span>
                <button
                  type="button"
                  className={on ? btnPrimary : btnGhost}
                  onClick={async () => {
                    await mcFetch("/api/admin/mission-control/habit-logs", {
                      method: "POST",
                      body: JSON.stringify({ habitId: h.id, dateKey: today, done: !on }),
                    });
                    await loadLogs();
                    await reload();
                  }}
                >
                  {on ? "Done today" : "Mark done"}
                </button>
              </li>
            );
          })}
        </ul>
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
      <SectionHeader title="Journal" subtitle={`Daily reflection · ${today}`} />
      <form
        className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const payload = { ...form, dateKey: today, tags: form.tags };
          if (existing) await update(existing.id, payload);
          else await create(payload);
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
        <button type="submit" className={btnPrimary}>
          {existing ? "Update today's entry" : "Save today's entry"}
        </button>
      </form>

      {loading ? null : items.length <= 1 ? null : (
        <div>
          <h3 className="mb-3 text-sm text-white/60">Recent entries</h3>
          <ul className="space-y-2">
            {items
              .filter((j) => j.dateKey !== today)
              .slice(0, 10)
              .map((j) => (
                <li key={j.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                  <span className="text-white/80">
                    {j.dateKey} {j.mood ? `· ${j.mood}` : ""}
                  </span>
                  <button type="button" className={btnGhost} onClick={() => void remove(j.id)}>
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        </div>
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

export function VisionSection() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [form, setForm] = useState({
    missionStmt: "",
    values: "",
    philosophy: "",
    futureOffice: "",
    somalia2050: "",
    quotes: "",
    principles: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const m = await mcFetch<Meta>("/api/admin/mission-control/meta");
      setMeta(m);
      setForm({
        missionStmt: m.missionStmt,
        values: m.values,
        philosophy: m.philosophy,
        futureOffice: m.futureOffice,
        somalia2050: m.somalia2050,
        quotes: m.quotes,
        principles: m.principles,
      });
    })();
  }, []);

  return (
    <div>
      <SectionHeader title="Vision Board" subtitle="Mission, values, and the Somalia you will help build." />
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await mcFetch("/api/admin/mission-control/meta", { method: "POST", body: JSON.stringify(form) });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        {(
          [
            ["missionStmt", "Mission statement"],
            ["values", "Personal values"],
            ["philosophy", "Life philosophy"],
            ["futureOffice", "Future office"],
            ["somalia2050", "Somalia 2050 vision"],
            ["quotes", "Favorite quotes"],
            ["principles", "Personal principles"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea
              className={inputClass}
              rows={4}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Field>
        ))}
        <div className="flex items-center gap-3">
          <button type="submit" className={btnPrimary}>
            Save vision
          </button>
          {saved ? <span className="text-sm text-[#4B9CD3]">Saved.</span> : null}
          {meta ? <span className="text-xs text-white/30">Private · admin only</span> : null}
        </div>
      </form>
    </div>
  );
}

export function AnalyticsSection() {
  const [data, setData] = useState<{
    widgets: Record<string, number>;
    streak: number;
    consistencyScore: number;
    habitStreaks: { name: string; streak: number }[];
    categoryProgress: { category: string; progress: number }[];
  } | null>(null);

  useEffect(() => {
    void mcFetch<NonNullable<typeof data>>("/api/admin/mission-control/dashboard").then(setData);
  }, []);

  if (!data) return <p className="text-sm text-white/40">Loading analytics…</p>;

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Consistency, output, and trajectory." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consistency score" value={data.consistencyScore} />
        <StatCard label="Work streak" value={`${data.streak}d`} />
        <StatCard label="Books this year" value={data.widgets.booksThisYear} />
        <StatCard label="Speaking hours" value={data.widgets.speakingHours} />
        <StatCard label="Words written" value={data.widgets.wordsWritten} />
        <StatCard label="Writing total" value={data.widgets.writingTotal} />
        <StatCard label="Published this month" value={data.widgets.publishedThisMonth} />
        <StatCard label="Networking (month)" value={data.widgets.meetingsNetworking} />
      </div>
      <h3 className="mb-3 text-sm text-white/60">Category progress</h3>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {data.categoryProgress.map((c) => (
          <div key={c.category} className="rounded-xl border border-white/10 p-3">
            <div className="mb-2 flex justify-between text-sm text-white/70">
              <span>{c.category}</span>
              <span>{c.progress}%</span>
            </div>
            <ProgressBar value={c.progress} />
          </div>
        ))}
      </div>
      <h3 className="mb-3 text-sm text-white/60">Habit streaks</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.habitStreaks.map((h) => (
          <div key={h.name} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80">
            {h.name}
            <span className="float-right text-[#4B9CD3]">{h.streak}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyReviewSection() {
  const monthKey = new Date().toISOString().slice(0, 7);
  const { items, create, update } = useCollection<{
    id: string;
    monthKey: string;
    accomplished: string;
    failed: string;
    learned: string;
    mistake: string;
    priorities: string;
    score: number;
  }>("monthly");
  const existing = items.find((i) => i.monthKey === monthKey);
  const [form, setForm] = useState({
    accomplished: "",
    failed: "",
    learned: "",
    mistake: "",
    priorities: "",
    score: 5,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        accomplished: existing.accomplished,
        failed: existing.failed,
        learned: existing.learned,
        mistake: existing.mistake,
        priorities: existing.priorities,
        score: existing.score,
      });
    }
  }, [existing]);

  return (
    <div>
      <SectionHeader title="Monthly Review" subtitle={`Debrief · ${monthKey}`} />
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const payload = { ...form, monthKey };
          if (existing) await update(existing.id, payload);
          else await create(payload);
        }}
      >
        {(
          [
            ["accomplished", "What did I accomplish?"],
            ["failed", "What failed?"],
            ["learned", "What did I learn?"],
            ["mistake", "Biggest mistake?"],
            ["priorities", "Next month's priorities?"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea className={inputClass} rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </Field>
        ))}
        <Field label="Score out of 10">
          <input
            type="number"
            min={0}
            max={10}
            className={inputClass}
            value={form.score}
            onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
          />
        </Field>
        <button type="submit" className={btnPrimary}>
          Save monthly review
        </button>
      </form>
    </div>
  );
}

export function YearlyReviewSection() {
  const yearKey = String(new Date().getFullYear());
  const { items, create, update } = useCollection<{
    id: string;
    yearKey: string;
    completed: string;
    statistics: string;
    lessons: string;
    achievements: string;
    failures: string;
    goalsReached: string;
    goalsMissed: string;
  }>("yearly");
  const existing = items.find((i) => i.yearKey === yearKey);
  const [form, setForm] = useState({
    completed: "",
    statistics: "",
    lessons: "",
    achievements: "",
    failures: "",
    goalsReached: "",
    goalsMissed: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        completed: existing.completed,
        statistics: existing.statistics,
        lessons: existing.lessons,
        achievements: existing.achievements,
        failures: existing.failures,
        goalsReached: existing.goalsReached,
        goalsMissed: existing.goalsMissed,
      });
    }
  }, [existing]);

  return (
    <div>
      <SectionHeader title="Yearly Review" subtitle={`Annual report · ${yearKey}`} />
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const payload = { ...form, yearKey };
          if (existing) await update(existing.id, payload);
          else await create(payload);
        }}
      >
        {(
          [
            ["completed", "Everything completed"],
            ["statistics", "Statistics"],
            ["lessons", "Lessons"],
            ["achievements", "Achievements"],
            ["failures", "Failures"],
            ["goalsReached", "Goals reached"],
            ["goalsMissed", "Goals missed"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea className={inputClass} rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </Field>
        ))}
        <button type="submit" className={btnPrimary}>
          Save yearly review
        </button>
      </form>
    </div>
  );
}

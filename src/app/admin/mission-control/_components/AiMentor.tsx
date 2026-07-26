"use client";

import { useEffect, useMemo, useState } from "react";
import {
  btnGhost,
  btnPrimary,
  EmptyState,
  Field,
  inputClass,
  mcFetch,
  Modal,
  ProgressBar,
  SectionHeader,
} from "./shared";

type MissionItem = { id: string; text: string; category: string; done: boolean };
type MentorDaily = { dateKey: string; items: MissionItem[]; reasoning: string };
type KnowledgeEntry = { topic: string; score: number };
type MentorProfile = { strengths: string; weaknesses: string; governmentExperience: string };
type ApiFailure = { status: number; message: string };

const CATEGORY_LABEL: Record<string, string> = {
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  policy: "Policy",
  habit: "Habit",
  reflection: "Reflection",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ data: T | null; error: ApiFailure | null }> {
  try {
    const res = await fetch(url, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: { status: res.status, message: (body as { error?: string }).error ?? "Request failed" } };
    }
    return { data: body as T, error: null };
  } catch (e) {
    return { data: null, error: { status: 500, message: e instanceof Error ? e.message : "Request failed" } };
  }
}

function NeedsApiKey({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
      <p className="font-medium">This needs an Anthropic API key.</p>
      <p className="mt-1 text-amber-800/80">
        Add <code className="rounded bg-white/70 px-1.5 py-0.5">ANTHROPIC_API_KEY</code> to your{" "}
        <code className="rounded bg-white/70 px-1.5 py-0.5">.env</code> file and restart the server to unlock the AI
        Mentor.
      </p>
      <button type="button" className={`${btnGhost} mt-3`} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function MentorSection() {
  const [mission, setMission] = useState<MentorDaily | null>(null);
  const [missionError, setMissionError] = useState<ApiFailure | null>(null);
  const [missionLoading, setMissionLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const [knowledge, setKnowledge] = useState<KnowledgeEntry[] | null>(null);

  const [profile, setProfile] = useState<MentorProfile>({ strengths: "", weaknesses: "", governmentExperience: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<MentorProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadMission = async () => {
    setMissionLoading(true);
    const { data, error } = await fetchJson<MentorDaily>("/api/admin/mission-control/mentor/today");
    if (error) setMissionError(error);
    else {
      setMissionError(null);
      setMission(data);
    }
    setMissionLoading(false);
  };

  const loadKnowledge = async () => {
    const { data } = await fetchJson<KnowledgeEntry[]>("/api/admin/mission-control/mentor/knowledge-map");
    setKnowledge(data ?? []);
  };

  const loadProfile = async () => {
    const m = await mcFetch<Partial<MentorProfile>>("/api/admin/mission-control/meta");
    const next = {
      strengths: m.strengths ?? "",
      weaknesses: m.weaknesses ?? "",
      governmentExperience: m.governmentExperience ?? "",
    };
    setProfile(next);
  };

  useEffect(() => {
    void loadMission();
    void loadKnowledge();
    void loadProfile();
  }, []);

  const toggleItem = async (item: MissionItem) => {
    if (!mission) return;
    const nextItems = mission.items.map((it) => (it.id === item.id ? { ...it, done: !it.done } : it));
    setMission({ ...mission, items: nextItems });
    await fetchJson("/api/admin/mission-control/mentor/today", {
      method: "PATCH",
      body: JSON.stringify({ id: item.id, done: !item.done }),
    });
  };

  const regenerate = async () => {
    setRegenerating(true);
    const { data, error } = await fetchJson<MentorDaily>("/api/admin/mission-control/mentor/today", {
      method: "POST",
    });
    if (error) setMissionError(error);
    else {
      setMissionError(null);
      setMission(data);
      await loadKnowledge();
    }
    setRegenerating(false);
  };

  const doneCount = mission ? mission.items.filter((i) => i.done).length : 0;
  const totalCount = mission ? mission.items.length : 0;

  const sortedKnowledge = useMemo(
    () => (knowledge ? [...knowledge].sort((a, b) => a.score - b.score) : []),
    [knowledge]
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Mentor" subtitle="Your continuously-adapting guide toward exceptional public service." />

      <section className="overflow-hidden rounded-[1.75rem] border border-sky-100/90 bg-white shadow-[0_16px_40px_rgba(59,143,217,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sky-50 bg-gradient-to-r from-sky-50/70 to-white px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B8FD9]">Today&apos;s Mission</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              {totalCount > 0 ? `${doneCount} / ${totalCount} complete` : "Building your mission…"}
            </h2>
            {mission?.reasoning ? <p className="mt-2 max-w-xl text-sm text-slate-500">{mission.reasoning}</p> : null}
          </div>
          <button type="button" className={btnGhost} onClick={() => void regenerate()} disabled={regenerating}>
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
        <div className="p-6">
          {missionLoading ? (
            <p className="text-sm text-slate-400">Consulting your mentor…</p>
          ) : missionError ? (
            missionError.status === 412 ? (
              <NeedsApiKey onRetry={() => void loadMission()} />
            ) : (
              <p className="text-sm text-red-600">{missionError.message}</p>
            )
          ) : mission && mission.items.length > 0 ? (
            <ul className="space-y-2">
              {mission.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition ${
                    item.done ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void toggleItem(item)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                      item.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-transparent hover:border-sky-400"
                    }`}
                  >
                    ✓
                  </button>
                  <span className={`flex-1 text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {item.text}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No mission yet" body="Click Regenerate to have your mentor build today's mission." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Knowledge Map</h3>
            <p className="mt-1 text-sm text-slate-500">Auto-updates as you complete books in the Reading Academy.</p>
          </div>
        </div>
        {knowledge === null ? (
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sortedKnowledge.map((k, i) => (
              <div key={k.topic}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-slate-700">{k.topic}</span>
                  <span className="font-medium text-slate-900">{k.score}%</span>
                </div>
                <ProgressBar value={k.score} tone={i} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Mentor Profile</h3>
            <p className="mt-1 text-sm text-slate-500">What your mentor knows about you — feeds every recommendation.</p>
          </div>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setProfileDraft(profile);
              setEditingProfile(true);
            }}
          >
            Edit
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["strengths", "Strengths"],
              ["weaknesses", "Weaknesses"],
              ["governmentExperience", "Government experience"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                {profile[key].trim() || "Not set — click Edit to add."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Modal open={editingProfile} onClose={() => setEditingProfile(false)} title="Edit mentor profile" wide>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSavingProfile(true);
            try {
              await mcFetch("/api/admin/mission-control/meta", { method: "POST", body: JSON.stringify(profileDraft) });
              setProfile(profileDraft);
              setEditingProfile(false);
            } finally {
              setSavingProfile(false);
            }
          }}
        >
          <Field label="Strengths">
            <textarea
              className={inputClass}
              rows={3}
              value={profileDraft.strengths}
              onChange={(e) => setProfileDraft({ ...profileDraft, strengths: e.target.value })}
            />
          </Field>
          <Field label="Weaknesses">
            <textarea
              className={inputClass}
              rows={3}
              value={profileDraft.weaknesses}
              onChange={(e) => setProfileDraft({ ...profileDraft, weaknesses: e.target.value })}
            />
          </Field>
          <Field label="Government experience">
            <textarea
              className={inputClass}
              rows={3}
              value={profileDraft.governmentExperience}
              onChange={(e) => setProfileDraft({ ...profileDraft, governmentExperience: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setEditingProfile(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

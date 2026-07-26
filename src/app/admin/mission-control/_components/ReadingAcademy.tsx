"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOK_LEVELS } from "@/lib/mission-control/academy";
import { btnGhost, btnPrimary, EmptyState, mcFetch, Modal, ProgressBar, SectionHeader } from "./shared";

type Book = {
  id: string;
  title: string;
  author: string;
  topic: string;
  level: string;
  year: number | null;
  pages: number;
  estimatedHours: number;
  description: string;
  whyItMatters: string;
  keyLessons: string;
  prerequisites: string;
  readNext: string;
  relatedBooks: string[];
  status: string;
};

type TopicSummary = {
  topic: string;
  total: number;
  counts: Record<string, number>;
  completed: number;
  hasCurriculum: boolean;
};

type ApiFailure = { status: number; message: string };

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
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

function NeedsApiKey({ action }: { action: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
      <p className="font-medium">{action} needs an Anthropic API key.</p>
      <p className="mt-1 text-amber-800/80">
        Add <code className="rounded bg-white/70 px-1.5 py-0.5">ANTHROPIC_API_KEY</code> to your .env and restart the
        server.
      </p>
    </div>
  );
}

function TopicGrid({ onOpen }: { onOpen: (topic: string) => void }) {
  const [summaries, setSummaries] = useState<TopicSummary[] | null>(null);

  useEffect(() => {
    void (async () => {
      const rows = await mcFetch<TopicSummary[]>("/api/admin/mission-control/reading-academy/topics");
      setSummaries(rows);
    })();
  }, []);

  if (!summaries) return <p className="text-sm text-slate-400">Loading curriculum map…</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map((s, i) => {
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <button
            key={s.topic}
            type="button"
            onClick={() => onOpen(s.topic)}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="font-medium text-slate-800">{s.topic}</p>
            <p className="mt-1 text-xs text-slate-400">
              {s.hasCurriculum ? `${s.completed}/${s.total} completed` : "Not generated yet"}
            </p>
            <div className="mt-3">
              <ProgressBar value={pct} tone={i} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  const done = book.status === "completed";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-slate-800">{book.title}</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {book.author}
        {book.year ? ` · ${book.year}` : ""}
      </p>
      {done ? (
        <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
          Completed
        </span>
      ) : (
        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
          {book.status === "reading" ? "Reading" : "To read"}
        </span>
      )}
    </button>
  );
}

function TopicView({ topic, onBack }: { topic: string; onBack: () => void }) {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [recommendation, setRecommendation] = useState<{ message: string; nextBookTitle: string | null } | null>(
    null
  );
  const [completing, setCompleting] = useState(false);

  const load = async () => {
    setError(null);
    const { data, error: err } = await fetchJson<Book[]>(
      `/api/admin/mission-control/reading-academy/books?topic=${encodeURIComponent(topic)}`
    );
    if (err) {
      setError(err);
      setBooks([]);
    } else {
      setBooks(data ?? []);
    }
  };

  useEffect(() => {
    setBooks(null);
    setRecommendation(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const regenerate = async () => {
    setGenerating(true);
    setError(null);
    const { data, error: err } = await fetchJson<Book[]>("/api/admin/mission-control/reading-academy/books", {
      method: "POST",
      body: JSON.stringify({ topic, regenerate: true }),
    });
    if (err) setError(err);
    else setBooks(data ?? []);
    setGenerating(false);
  };

  const complete = async (book: Book) => {
    setCompleting(true);
    const { data } = await fetchJson<{ message: string; nextBookTitle: string | null }>(
      `/api/admin/mission-control/reading-academy/books/${book.id}/complete`,
      { method: "POST" }
    );
    if (data) {
      setRecommendation({ message: data.message, nextBookTitle: data.nextBookTitle });
      setSelected(null);
      await load();
    }
    setCompleting(false);
  };

  const byLevel = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const level of BOOK_LEVELS) map.set(level, []);
    for (const b of books ?? []) {
      if (!map.has(b.level)) map.set(b.level, []);
      map.get(b.level)!.push(b);
    }
    return map;
  }, [books]);

  return (
    <div>
      <button type="button" className={`${btnGhost} mb-4`} onClick={onBack}>
        ← All topics
      </button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">{topic}</h3>
        <button type="button" className={btnGhost} onClick={() => void regenerate()} disabled={generating}>
          {generating ? "Generating…" : books && books.length > 0 ? "Regenerate curriculum" : "Generate curriculum"}
        </button>
      </div>

      {recommendation ? (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Mentor recommendation</p>
          <p className="mt-1.5">{recommendation.message}</p>
          {recommendation.nextBookTitle ? (
            <p className="mt-1.5 font-medium text-slate-900">Next up: {recommendation.nextBookTitle}</p>
          ) : null}
        </div>
      ) : null}

      {books === null ? (
        <p className="text-sm text-slate-400">Loading curriculum…</p>
      ) : error ? (
        error.status === 412 ? (
          <NeedsApiKey action="Generating this curriculum" />
        ) : (
          <p className="text-sm text-red-600">{error.message}</p>
        )
      ) : books.length === 0 ? (
        <EmptyState
          title="No curriculum yet"
          body="Click Generate curriculum to have your mentor build a reading path for this topic."
        />
      ) : (
        <div className="space-y-6">
          {BOOK_LEVELS.map((level) => {
            const levelBooks = byLevel.get(level) ?? [];
            if (levelBooks.length === 0) return null;
            return (
              <div key={level}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {LEVEL_LABEL[level]}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {levelBooks.map((book) => (
                    <BookCard key={book.id} book={book} onOpen={() => setSelected(book)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? ""} wide>
        {selected ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-500">
              {selected.author}
              {selected.year ? ` · ${selected.year}` : ""}
              {selected.pages ? ` · ${selected.pages}p` : ""}
              {selected.estimatedHours ? ` · ~${selected.estimatedHours}h` : ""}
              {" · "}
              <span className="font-medium text-slate-700">{LEVEL_LABEL[selected.level] ?? selected.level}</span>
            </p>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.description}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Why this book matters</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.whyItMatters}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Key lessons</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.keyLessons}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Prerequisites</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.prerequisites || "None"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Read next</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.readNext || "—"}</p>
              </div>
            </div>
            {selected.relatedBooks.length > 0 ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Related books</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-700">
                  {selected.relatedBooks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" className={btnGhost} onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.status !== "completed" ? (
                <button type="button" className={btnPrimary} disabled={completing} onClick={() => void complete(selected)}>
                  {completing ? "Saving…" : "Completed"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function ReadingAcademySection() {
  const [topic, setTopic] = useState<string | null>(null);

  return (
    <div>
      <SectionHeader
        title="Reading Academy"
        subtitle="An AI-curated curriculum across governance, economics, leadership, and more — no manual book hunting."
      />
      {topic ? <TopicView topic={topic} onBack={() => setTopic(null)} /> : <TopicGrid onOpen={setTopic} />}
    </div>
  );
}

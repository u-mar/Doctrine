"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { JournalEntry } from "@/lib/journal-entries";
import { stripMarkdownForPreview } from "@/lib/utils";

type SortMode = "newest" | "top";

export default function BriefsPageClient({ initialEntries }: { initialEntries: JournalEntry[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>(initialEntries);
  /** Community average stars per brief slug (from `/api/content/rating` batch). */
  const [avgRatingBySlug, setAvgRatingBySlug] = useState<Record<string, number>>({});

  useEffect(() => {
    setDisplayEntries(initialEntries);
  }, [initialEntries]);

  const journalCardStyles = [
    "border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 via-card to-card dark:border-indigo-800/60 dark:from-indigo-950/30",
    "border-cyan-200/70 bg-gradient-to-br from-cyan-50/70 via-card to-card dark:border-cyan-800/60 dark:from-cyan-950/30",
    "border-lime-200/70 bg-gradient-to-br from-lime-50/70 via-card to-card dark:border-lime-800/60 dark:from-lime-950/30",
    "border-orange-200/70 bg-gradient-to-br from-orange-50/70 via-card to-card dark:border-orange-800/60 dark:from-orange-950/30",
  ];

  const availableTopics = useMemo(
    () => ["All", ...new Set(displayEntries.map((entry) => entry.topic))],
    [displayEntries]
  );

  const filteredEntries = displayEntries.filter(
    (entry) =>
      (selectedTopic === "All" || entry.topic === selectedTopic) &&
      (entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSlugKey = useMemo(() => filteredEntries.map((e) => e.slug).join("\0"), [filteredEntries]);

  useEffect(() => {
    if (sortMode !== "top") {
      return;
    }
    const slugs = filteredSlugKey.split("\0").filter(Boolean);
    const keys = slugs.map((slug) => `brief:${slug}`);
    if (keys.length === 0) {
      setAvgRatingBySlug({});
      return;
    }
    const ac = new AbortController();
    const params = new URLSearchParams({ itemKeys: keys.join(",") });
    fetch(`/api/content/rating?${params}`, { credentials: "same-origin", signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("ratings"))))
      .then((data: { items?: Record<string, { average: number | null }> }) => {
        const items = data.items ?? {};
        const next: Record<string, number> = {};
        for (const slug of slugs) {
          const k = `brief:${slug}`;
          const avg = items[k]?.average;
          next[slug] = avg != null ? avg : 0;
        }
        setAvgRatingBySlug(next);
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setAvgRatingBySlug({});
        }
      });
    return () => ac.abort();
  }, [sortMode, filteredSlugKey]);

  const visibleEntries = useMemo(() => {
    const entries = [...filteredEntries];

    if (sortMode === "top") {
      entries.sort((a, b) => {
        const scoreDiff = (avgRatingBySlug[b.slug] ?? 0) - (avgRatingBySlug[a.slug] ?? 0);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      return entries;
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [filteredEntries, sortMode, avgRatingBySlug]);

  const emptyFiltered = visibleEntries.length === 0 && displayEntries.length > 0;
  const emptySite = displayEntries.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Briefs</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Short briefings on what is happening and what it means.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-4xl">
          <input
            type="text"
            placeholder="Search entries by title, content, or topic..."
            className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sort by</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Latest</option>
              <option value="top">Top</option>
            </select>
          </label>
        </div>

        <div className="mx-auto mb-10 flex max-w-4xl flex-wrap gap-2">
          {availableTopics.map((topic) => {
            const isActive = selectedTopic === topic;

            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-4xl gap-5">
          {visibleEntries.map((entry, index) => (
            <motion.div
              key={entry.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link
                href={`/briefs/${entry.slug}`}
                className={`block rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${journalCardStyles[index % journalCardStyles.length]}`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-teal-300/70 bg-teal-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-900 dark:border-teal-700/70 dark:bg-teal-900/40 dark:text-teal-200">
                    {entry.topic}
                  </span>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>

                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{entry.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {stripMarkdownForPreview(entry.excerpt)}
                </p>
                <p className="mt-4 text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                  Read brief {"->"}
                </p>
              </Link>
            </motion.div>
          ))}

          {emptyFiltered && (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
              No entries match this filter yet.
            </div>
          )}

          {emptySite && (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
              No briefs published yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

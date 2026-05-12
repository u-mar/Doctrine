"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/ideas";
import { stripMarkdownForPreview, truncatePlainText } from "@/lib/utils";

const IDEA_CARD_PREVIEW_CHARS = 160;

function isDraftIdea(idea: Idea): boolean {
  return idea.status === "Draft" || idea.slug.startsWith("/drafts/");
}

export default function IdeasPageClient({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [displayIdeas, setDisplayIdeas] = useState<Idea[]>(initialIdeas);

  useEffect(() => {
    setDisplayIdeas(initialIdeas);
  }, [initialIdeas]);

  const ideaCardStyles = [
    "border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-card to-card dark:border-sky-800/60 dark:from-sky-950/30",
    "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-card to-card dark:border-emerald-800/60 dark:from-emerald-950/30",
    "border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-card to-card dark:border-amber-800/60 dark:from-amber-950/30",
    "border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-card to-card dark:border-rose-800/60 dark:from-rose-950/30",
  ];

  const availableTopics = useMemo(
    () => ["All", ...new Set(displayIdeas.map((idea) => idea.topic))],
    [displayIdeas]
  );

  const filteredIdeas = displayIdeas.filter(
    (idea) =>
      (selectedTopic === "All" || idea.topic === selectedTopic) &&
      (idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const emptyFiltered = filteredIdeas.length === 0 && displayIdeas.length > 0;
  const emptySite = displayIdeas.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas via-canvas to-muted/30 text-foreground">
      <div className="container mx-auto px-4 pt-[calc(4rem+env(safe-area-inset-top,0px)+0.75rem)] pb-12 sm:px-6 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Ideas</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Proposed Approaches for Governance and State-Building
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-5xl">
          <input
            type="text"
            placeholder="Search ideas by title, summary, or topic..."
            className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="mx-auto mb-10 flex max-w-5xl flex-wrap gap-2">
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredIdeas.map((idea, index) => {
            const draft = isDraftIdea(idea);
            const plainSummary = stripMarkdownForPreview(idea.summary);
            const preview =
              plainSummary.length > IDEA_CARD_PREVIEW_CHARS
                ? truncatePlainText(plainSummary, IDEA_CARD_PREVIEW_CHARS)
                : plainSummary;

            return (
              <motion.div
                key={idea.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link
                  href={idea.slug.startsWith("/drafts/") ? idea.slug : `/ideas/${idea.slug}`}
                  className={`group relative block min-h-[200px] overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md sm:min-h-[220px] ${draft ? "ring-2 ring-amber-400/45 ring-offset-2 ring-offset-background dark:ring-amber-500/35 dark:ring-offset-background" : ""}`}
                >
                  {draft && (
                    <>
                      <span className="sr-only">Draft piece</span>
                      <div
                        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-2xl"
                        aria-hidden
                      >
                        <span className="-rotate-[14deg] select-none whitespace-nowrap rounded-lg border-[4px] border-double border-amber-600/65 bg-amber-400/20 px-6 py-3 text-[clamp(1.35rem,5vw,2.25rem)] font-black uppercase tracking-[0.32em] text-amber-800/45 shadow-sm dark:border-amber-400/60 dark:bg-amber-500/15 dark:text-amber-200/40">
                          Draft
                        </span>
                      </div>
                    </>
                  )}

                  <div
                    className={`relative z-[2] flex min-h-[200px] flex-col rounded-2xl border p-4 shadow-sm sm:min-h-[220px] sm:p-6 ${ideaCardStyles[index % ideaCardStyles.length]} ${draft ? "border-amber-500/50 dark:border-amber-500/45" : ""}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 font-medium uppercase tracking-wide text-indigo-900 dark:border-indigo-700/70 dark:bg-indigo-900/40 dark:text-indigo-200">
                        {idea.topic}
                      </span>
                      {draft && (
                        <span className="shrink-0 rounded-md border border-amber-600/70 bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:border-amber-500 dark:bg-amber-600">
                          Draft
                        </span>
                      )}
                    </div>
                    <h2 className="mb-2 line-clamp-3 text-xl font-semibold leading-snug">{idea.title}</h2>
                    {preview ? (
                      <p className="mb-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{preview}</p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                      <div className="text-xs text-muted-foreground">
                        {[idea.readingTime, idea.date].filter(Boolean).join(" · ") || "\u00a0"}
                      </div>
                      <span className="text-sm font-semibold text-primary group-hover:underline">Read more →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {emptyFiltered && (
          <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
            No ideas match this filter yet.
          </div>
        )}

        {emptySite && (
          <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
            No ideas published yet.
          </div>
        )}
      </div>
    </div>
  );
}

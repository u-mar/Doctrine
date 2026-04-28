"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JournalRating from "@/components/JournalRating";
import { JournalEntry } from "@/lib/journal-entries";
import { applyJournalOverrides, getJournalOverridesFromStorage } from "@/lib/published-content";

export default function JournalEntryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [allEntries, setAllEntries] = useState<JournalEntry[]>(() => applyJournalOverrides({}));

  useEffect(() => {
    setAllEntries(applyJournalOverrides(getJournalOverridesFromStorage()));
  }, []);

  const entry = allEntries.find((item) => item.slug === slug);

  const contentBlocks = entry?.content
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean) ?? [];

  if (!entry) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <Link
            href="/journal"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="ml-2">Back to briefs</span>
          </Link>
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground shadow-sm">
            This brief could not be found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <Link
          href="/journal"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Back to briefs</span>
        </Link>

        <article className="mt-8 rounded-2xl border border-border bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-teal-300/70 bg-teal-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-900 dark:border-teal-700/70 dark:bg-teal-900/40 dark:text-teal-200">
              {entry.topic}
            </span>
            <span className="text-sm text-muted-foreground">{entry.date}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{entry.title}</h1>

          <div className="mt-8 space-y-5 text-lg leading-8 text-foreground/90">
            {contentBlocks.map((block) => {
              const isHeading =
                block.length <= 60 &&
                !block.endsWith(".") &&
                !block.endsWith("?") &&
                !block.endsWith("!") &&
                !block.endsWith(":");

              if (isHeading) {
                return (
                  <h2 key={block} className="pt-2 text-xl font-semibold tracking-tight text-foreground">
                    {block}
                  </h2>
                );
              }

              return <p key={block}>{block}</p>;
            })}
          </div>

          <JournalRating entrySlug={entry.slug} />
        </article>
      </div>
    </div>
  );
}

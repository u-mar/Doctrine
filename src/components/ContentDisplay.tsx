"use client";

import { useState } from "react";
import JournalRating from "@/components/JournalRating";

export default function ContentDisplay({
  renderedPages,
  ratingKey,
  title,
  date,
  topic,
  draftWatermark = false,
}: {
  renderedPages: React.ReactNode[];
  ratingKey: string;
  title: string;
  date: string;
  topic: string;
  /** When true, shows a prominent draft stamp across the article body (public drafts). */
  draftWatermark?: boolean;
}) {
  const [activePage, setActivePage] = useState(0);

  const totalPages = Math.max(1, renderedPages.length);
  const safePage = Math.min(activePage, totalPages - 1);
  const readingProgress = Math.round(((safePage + 1) / totalPages) * 100);

  return (
    <>
      <div className="fixed left-0 right-0 top-16 z-40">
        <div className="h-1 w-full bg-border/60">
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${readingProgress}%` }} />
        </div>
      </div>

      <article
        className={`relative mt-6 rounded-2xl border bg-card/85 p-4 shadow-sm sm:mt-8 sm:rounded-3xl sm:p-6 md:p-8 ${
          draftWatermark
            ? "overflow-visible border-amber-500/70 ring-2 ring-amber-400/40 dark:border-amber-500/50 dark:ring-amber-500/25"
            : "overflow-hidden border-border"
        }`}
      >
        {draftWatermark && <span className="sr-only">This piece is marked as a draft and may change.</span>}

        <div className="relative z-10">
          {draftWatermark && (
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
              <span className="inline-flex rounded-md border-2 border-amber-600 bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm dark:border-amber-400 dark:bg-amber-600 sm:px-3 sm:text-xs">
                Draft
              </span>
              <span className="text-xs font-medium text-amber-900 dark:text-amber-100 sm:text-sm">
                Unpublished preview — content may change.
              </span>
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-teal-300/70 bg-teal-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-900 dark:border-teal-700/70 dark:bg-teal-900/40 dark:text-teal-200">
              {topic}
            </span>
            <span className="text-sm text-muted-foreground">{date}</span>
          </div>

          <h1 className="mb-4 break-words text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h1>

          {/* Outer wrapper: large stamp sits outside the dashed body frame (overlaps top edge). */}
          <div className={draftWatermark ? "relative mt-1 sm:mt-2" : "relative"}>
            {draftWatermark && (
              <div
                className="pointer-events-none absolute -top-4 left-1/2 z-[25] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 justify-center sm:-top-7 md:left-auto md:right-0 md:max-w-none md:translate-x-3 lg:right-1 lg:translate-x-1/4"
                aria-hidden
              >
                <span className="-rotate-[14deg] select-none whitespace-nowrap rounded-md border-[5px] border-double border-amber-700/90 bg-amber-400/35 px-5 py-3 text-[clamp(1.35rem,9.5vw,2.75rem)] font-black uppercase leading-none tracking-[0.22em] text-amber-950/80 shadow-xl ring-2 ring-amber-600/35 dark:border-amber-300/90 dark:bg-amber-600/25 dark:text-amber-50/90 dark:ring-amber-400/40 sm:border-[6px] sm:px-9 sm:py-4 sm:text-[clamp(1.85rem,7vw,3.5rem)] sm:tracking-[0.28em] md:tracking-[0.32em]">
                  Draft
                </span>
              </div>
            )}
            <div
              className={
                draftWatermark
                  ? "rounded-xl border border-dashed border-amber-500/45 bg-background/30 px-3 pb-6 pt-11 dark:border-amber-500/35 dark:bg-background/20 sm:rounded-2xl sm:px-6 sm:pb-8 sm:pt-14 md:pt-16"
                  : "relative"
              }
            >
              <div
                className={`prose prose-sm prose-zinc max-w-none dark:prose-invert sm:prose-base ${
                  draftWatermark ? "relative z-10" : ""
                }`}
              >
                {renderedPages[safePage]}
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className="mt-6 sm:mt-8">
        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-background/60 px-3 py-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Page {safePage + 1} of {totalPages}
          </p>
          <div className="flex items-center justify-center gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
              disabled={safePage === 0}
              className="min-h-11 min-w-[5.5rem] rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setActivePage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={safePage >= totalPages - 1}
              className="min-h-11 min-w-[5.5rem] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <JournalRating entrySlug={ratingKey} />
    </>
  );
}

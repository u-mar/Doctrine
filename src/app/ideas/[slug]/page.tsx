"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EngagementPanel from "@/components/EngagementPanel";
import JournalRating from "@/components/JournalRating";
import { Idea } from "@/lib/ideas";
import { applyIdeaOverrides, getIdeaOverridesFromStorage } from "@/lib/published-content";

export default function IdeaEntryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [allIdeas, setAllIdeas] = useState<Idea[]>(() => applyIdeaOverrides({}));

  useEffect(() => {
    setAllIdeas(applyIdeaOverrides(getIdeaOverridesFromStorage()));
  }, []);

  const idea = allIdeas.find((item) => item.slug === slug);

  if (!idea) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <Link
            href="/ideas"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="ml-2">Back to ideas</span>
          </Link>
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground shadow-sm">
            This idea could not be found.
          </div>
        </div>
      </div>
    );
  }

  const paragraphs = idea.content.split("\n\n");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Back to ideas</span>
        </Link>

        <article className="mt-8 rounded-2xl border border-border bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-900 dark:border-indigo-700/70 dark:bg-indigo-900/40 dark:text-indigo-200">
              {idea.topic}
            </span>
            <span className="text-sm text-muted-foreground">{idea.date}</span>
            <span className="text-sm text-muted-foreground">{idea.readingTime}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{idea.title}</h1>

          <div className="mt-8 space-y-6 text-lg leading-8 text-foreground/90">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <JournalRating entrySlug={`idea:${idea.slug}`} />
          <EngagementPanel itemKey={`idea:${idea.slug}`} title="React to this idea" />
        </article>
      </div>
    </div>
  );
}

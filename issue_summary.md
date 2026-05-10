# Next.js MDX Pagination Issue Summary

## Goal

The goal is to render MDX content that is split into pages. The content is fetched on the server, and the pagination (switching between pages) is handled on the client.

## Architecture

1.  **`src/app/briefs/[slug]/page.tsx`**: This is an async Server Component that fetches the brief's content from the database. It splits the content into pages and maps each page to an `MDXRenderer` component. It then passes the array of rendered pages to the `ContentDisplay` client component.
2.  **`src/components/ContentDisplay.tsx`**: This is a Client Component (`"use client"`) that manages the pagination state (`activePage`). It receives the pre-rendered MDX pages as a prop and displays the current page based on the `activePage` state.
3.  **`src/components/MDXRenderer.tsx`**: This is a simple Server Component that uses `next-mdx-remote/rsc` to render a single MDX string.

## The Problem

The content is not being displayed, and the following error appears in the terminal when navigating to a brief's page (e.g., `/briefs/some-slug`):

```
Error: Route "/briefs/[slug]" used `params.slug`. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

This error points to the usage of `params.slug` inside the `JournalEntryPage` component.

## Relevant Code

Here is the current state of the relevant files:

### `src/app/briefs/[slug]/page.tsx`

```tsx
import ContentDisplay from "@/components/ContentDisplay";
import MDXRenderer from "@/components/MDXRenderer";
import { ensureContentSeeded } from "@/lib/content/seed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getBrief(slug: string) {
  await ensureContentSeeded();
  const row = await prisma.journalEntry.findFirst({
    where: { slug, hidden: false },
  });
  if (!row) {
    return null;
  }
  return {
    title: row.title,
    date: row.dateLabel,
    topic: row.topic,
    pages: row.content.split("\n---\n"),
  };
}

export default async function JournalEntryPage({ params }: { params: { slug: string } }) {
  const brief = await getBrief(params.slug);

  const renderedPages =
    brief?.pages.map((page, index) => <MDXRenderer key={`${params.slug}-${index}`} source={page} />) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <Link
          href="/briefs"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Back to briefs</span>
        </Link>
        {brief && renderedPages.length > 0 ? (
          <ContentDisplay
            renderedPages={renderedPages}
            itemKey={`brief:${params.slug}`}
            ratingKey={`brief:${params.slug}`}
            title={brief.title}
            date={brief.date}
            topic={brief.topic}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground shadow-sm">
            This brief could not be found or has no content.
          </div>
        )}
      </div>
    </div>
  );
}
```

### `src/components/ContentDisplay.tsx`

```tsx
"use client";

import { useState } from "react";
import EngagementPanel from "@/components/EngagementPanel";
import JournalRating from "@/components/JournalRating";

export default function ContentDisplay({
  renderedPages,
  itemKey,
  ratingKey,
  title,
  date,
  topic,
}: {
  renderedPages: React.ReactNode[];
  itemKey: string;
  ratingKey: string;
  title: string;
  date: string;
  topic: string;
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
      <article className="mt-8 rounded-3xl border border-border bg-card/85 p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-teal-300/70 bg-teal-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-900 dark:border-teal-700/70 dark:bg-teal-900/40 dark:text-teal-200">
            {topic}
          </span>
          <span className="text-sm text-muted-foreground">{date}</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <div className="prose prose-zinc max-w-none dark:prose-invert">{renderedPages[safePage]}</div>
      </article>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
          <button
            type="button"
            onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm text-muted-foreground">
            Page {safePage + 1} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setActivePage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <JournalRating entrySlug={ratingKey} />
      <EngagementPanel itemKey={itemKey} title="React to this" />
    </>
  );
}
```

### `src/components/MDXRenderer.tsx`

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";

export default function MDXRenderer({ source }: { source: string }) {
  if (!source) return null;
  return <MDXRemote source={source} />;
}
```

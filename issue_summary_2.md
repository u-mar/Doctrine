# Next.js MDX Styling Issue Summary

This document outlines an issue with MDX component styling in a Next.js application.

## Initial Problema

The page at `/briefs/[slug]` was not rendering content and was throwing an error related to `params` being a Promise:

```
Error: Route "/briefs/[slug]" used `params.slug`. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties.
```

This was resolved by updating `src/app/briefs/[slug]/page.tsx` to `await` the params.

## Current Problem

After fixing the initial error, the MDX content is now visible, but it is not being styled correctly. Markdown syntax like `##` for headings is not being rendered as styled HTML. The content appears as plain, unformatted text.

An attempt was made to fix this by updating `src/components/MDXRenderer.tsx` to use the `useMDXComponents` hook from `mdx-components.tsx`, but this did not solve the problem.

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

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await params first
  const { slug } = await params;

  const brief = await getBrief(slug);

  const renderedPages =
    brief?.pages.map((page, index) => (
      <MDXRenderer
        key={`${slug}-${index}`}
        source={page}
      />
    )) ?? [];

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
            itemKey={`brief:${slug}`}
            ratingKey={`brief:${slug}`}
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

### `src/components/MDXRenderer.tsx`

```tsx
import { useMDXComponents } from "@/mdx-components";
import { MDXRemote } from "next-mdx-remote/rsc";

export default function MDXRenderer({ source }: { source: string }) {
  const components = useMDXComponents({});
  return <MDXRemote source={source} components={components} />;
}
```

### `mdx-components.tsx`

```tsx
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 style={{ fontSize: "2.25rem", fontWeight: "bold" }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{children}</h3>,
    h4: ({ children }) => <h4 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{children}</h4>,
    h5: ({ children }) => <h5 style={{ fontSize: "1.125rem", fontWeight: "bold" }}>{children}</h5>,
    h6: ({ children }) => <h6 style={{ fontSize: "1rem", fontWeight: "bold" }}>{children}</h6>,
    p: (props) => <p style={{ marginBottom: "1rem" }} {...props} />,
    ...components,
  };
}
```

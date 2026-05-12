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
    <div className="min-h-screen bg-canvas text-foreground">
      <div className="container mx-auto max-w-3xl px-3 pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)] pb-16 sm:px-4 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)]">
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

import ContentDisplay from "@/components/ContentDisplay";
import MDXRenderer from "@/components/MDXRenderer";
import { ensureContentSeeded } from "@/lib/content/seed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getIdea(slug: string) {
  await ensureContentSeeded();
  const row = await prisma.ideaEntry.findFirst({
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
    showAsDraft: row.showAsDraft === true,
  };
}

export default async function IdeaEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idea = await getIdea(slug);

  const renderedPages = idea?.pages.map((page) => <MDXRenderer key={page.slice(0, 20)} source={page} />);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <div className="container mx-auto max-w-3xl px-3 pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)] pb-16 sm:px-4 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)]">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Back to ideas</span>
        </Link>
        {idea && renderedPages ? (
          <ContentDisplay
            renderedPages={renderedPages}
            ratingKey={`idea:${slug}`}
            title={idea.title}
            date={idea.date}
            topic={idea.topic}
            draftWatermark={idea.showAsDraft}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground shadow-sm">
            This idea could not be found.
          </div>
        )}
      </div>
    </div>
  );
}

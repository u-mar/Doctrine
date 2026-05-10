import ContentDisplay from "@/components/ContentDisplay";
import MDXRenderer from "@/components/MDXRenderer";
import { ensureContentSeeded } from "@/lib/content/seed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getDraft(id: string) {
  await ensureContentSeeded();
  const row = await prisma.draft.findFirst({
    where: { id, visibility: "public" },
  });
  if (!row) {
    return null;
  }
  return {
    title: row.title,
    date: row.createdAt.toLocaleString(),
    topic: row.topic,
    pages: row.note.split("\n---\n"),
  };
}

export default async function DraftPage({ params }: { params: { id: string } }) {
  const draft = await getDraft(params.id);

  const renderedPages = draft?.pages.map((page) => <MDXRenderer key={page.slice(0, 20)} source={page} />);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-3 pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)] pb-16 sm:px-4 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)]">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Back to ideas</span>
        </Link>
        {draft && renderedPages ? (
          <ContentDisplay
            renderedPages={renderedPages}
            ratingKey={`draft:${params.id}`}
            title={draft.title}
            date={draft.date}
            topic={draft.topic}
            draftWatermark
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 text-muted-foreground shadow-sm">
            This draft could not be found.
          </div>
        )}
      </div>
    </div>
  );
}

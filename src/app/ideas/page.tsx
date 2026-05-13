import { ensureContentSeeded } from "@/lib/content/seed";
import type { Idea } from "@/lib/ideas";
import { prisma } from "@/lib/prisma";
import IdeasPageClient from "./IdeasPageClient";

/** Same DB on local + Vercel: always read fresh list so links match current publish/draft state. */
export const dynamic = "force-dynamic";

async function getIdeasList(): Promise<Idea[]> {
  await ensureContentSeeded();

  const [rows, publicDrafts] = await Promise.all([
    prisma.ideaEntry.findMany({
      where: { hidden: false },
      orderBy: { slug: "asc" },
    }),
    prisma.draft.findMany({
      where: { visibility: "public" },
    }),
  ]);

  const ideas: Idea[] = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    readingTime: r.readingTime,
    date: r.dateLabel,
    topic: r.topic,
    content: r.content,
    showAsDraft: r.showAsDraft === true,
  }));

  const draftsAsIdeas: Idea[] = publicDrafts.map((d) => ({
    slug: `/drafts/${d.id}`,
    title: d.title,
    summary: d.note,
    readingTime: "",
    date: d.createdAt.toLocaleString(),
    topic: d.topic,
    content: d.note,
    status: "Draft",
  }));

  return [...ideas, ...draftsAsIdeas];
}

export default async function IdeasPage() {
  const ideas = await getIdeasList();
  return <IdeasPageClient initialIdeas={ideas} />;
}

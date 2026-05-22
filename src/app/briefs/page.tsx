import { ensureContentSeeded } from "@/lib/content/seed";
import type { JournalEntry } from "@/lib/journal-entries";
import { prisma } from "@/lib/prisma";
import BriefsPageClient from "./BriefsPageClient";

/** Same DB on local + Vercel: always read fresh list so new publishes show on /briefs (not build-time cache). */
export const dynamic = "force-dynamic";

async function getPublicBriefs(): Promise<JournalEntry[]> {
  await ensureContentSeeded();
  const rows = await prisma.journalEntry.findMany({
    where: { hidden: false },
    orderBy: { slug: "asc" },
  });
  return rows.map((r) => ({
    id: r.legacyId ?? 0,
    slug: r.slug,
    title: r.title,
    date: r.dateLabel,
    topic: r.topic,
    excerpt: r.excerpt,
    content: r.content,
  }));
}

export default async function BriefsPage() {
  const entries = await getPublicBriefs();
  return <BriefsPageClient initialEntries={entries} />;
}

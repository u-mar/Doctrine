import type { DraftKind } from "@prisma/client";
import { ensureContentSeeded } from "@/lib/content/seed";
import { prisma } from "@/lib/prisma";
import { stripMarkdownForPreview } from "@/lib/utils";

export type HomeLatestEntry = {
  id: string;
  title: string;
  category: "Briefs" | "Ideas" | "Quick Takes";
  date: string;
  excerpt: string;
  href: string;
  /** Public drafts surfaced from the draft queue (`/drafts/[id]`). */
  isDraft?: boolean;
};

function draftKindToCategory(kind: DraftKind): HomeLatestEntry["category"] {
  switch (kind) {
    case "JOURNAL":
      return "Briefs";
    case "QUICK_TAKE":
      return "Quick Takes";
    case "IDEA":
      return "Ideas";
  }
}

const QUICK_TITLE_LEN = 88;
const EXCERPT_LEN = 220;

export async function getLatestHomeEntries(limit = 3): Promise<HomeLatestEntry[]> {
  await ensureContentSeeded();

  const [ideas, journals, takes, publicDrafts] = await Promise.all([
    prisma.ideaEntry.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 15),
    }),
    prisma.journalEntry.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 15),
    }),
    prisma.quickTakeEntry.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 15),
    }),
    prisma.draft.findMany({
      where: { visibility: "public" },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 15),
    }),
  ]);

  type Row = HomeLatestEntry & { sortTime: number };

  const merged: Row[] = [];

  for (const row of ideas) {
    merged.push({
      id: `idea:${row.slug}`,
      title: row.title,
      category: "Ideas",
      date: row.dateLabel,
      excerpt: truncateExcerpt(stripMarkdownForPreview(row.summary)),
      href: `/ideas/${row.slug}`,
      sortTime: row.createdAt.getTime(),
      isDraft: row.showAsDraft === true,
    });
  }

  for (const row of journals) {
    merged.push({
      id: `brief:${row.slug}`,
      title: row.title,
      category: "Briefs",
      date: row.dateLabel,
      excerpt: truncateExcerpt(stripMarkdownForPreview(row.excerpt)),
      href: `/briefs/${row.slug}`,
      sortTime: row.createdAt.getTime(),
    });
  }

  for (const row of takes) {
    const plain = stripMarkdownForPreview(row.content);
    const title =
      plain.length <= QUICK_TITLE_LEN ? plain : `${plain.slice(0, QUICK_TITLE_LEN).trimEnd()}…`;
    const legacyId = row.legacyId;
    const href =
      legacyId != null && legacyId > 0
        ? `/quick-takes#quick-take-${legacyId}`
        : `/quick-takes`;
    merged.push({
      id: `take:${row.id}`,
      title,
      category: "Quick Takes",
      date: row.dateLabel,
      excerpt: truncateExcerpt(plain),
      href,
      sortTime: row.createdAt.getTime(),
    });
  }

  for (const row of publicDrafts) {
    merged.push({
      id: `draft:${row.id}`,
      title: row.title,
      category: draftKindToCategory(row.kind),
      date: row.createdAt.toLocaleString(),
      excerpt: truncateExcerpt(stripMarkdownForPreview(row.note)),
      href: `/drafts/${row.id}`,
      sortTime: row.createdAt.getTime(),
      isDraft: true,
    });
  }

  merged.sort((a, b) => b.sortTime - a.sortTime);

  return merged.slice(0, limit).map(({ sortTime: _t, ...rest }) => rest);
}

function truncateExcerpt(text: string): string {
  const t = text.trim();
  if (t.length <= EXCERPT_LEN) {
    return t;
  }
  return `${t.slice(0, EXCERPT_LEN).trimEnd()}…`;
}

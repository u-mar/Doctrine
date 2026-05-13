import { prisma } from "@/lib/prisma";
import { ideas } from "@/lib/ideas";
import { journalEntries } from "@/lib/journal-entries";
import { quickTakes } from "@/lib/quick-takes";

let seedPromise: Promise<void> | null = null;

export function ensureContentSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed();
  }
  return seedPromise;
}

async function runSeed() {
  const [ideaCount, journalCount, takeCount] = await Promise.all([
    prisma.ideaEntry.count(),
    prisma.journalEntry.count(),
    prisma.quickTakeEntry.count(),
  ]);

  if (ideaCount === 0) {
    for (const idea of ideas) {
      await prisma.ideaEntry.create({
        data: {
          slug: idea.slug,
          title: idea.title,
          summary: idea.summary,
          readingTime: idea.readingTime,
          dateLabel: idea.date,
          topic: idea.topic,
          content: idea.content,
          hidden: false,
          showAsDraft: false,
        },
      });
    }
  }

  if (journalCount === 0) {
    for (const entry of journalEntries) {
      await prisma.journalEntry.create({
        data: {
          slug: entry.slug,
          legacyId: entry.id,
          title: entry.title,
          dateLabel: entry.date,
          topic: entry.topic,
          excerpt: entry.excerpt,
          content: entry.content,
          hidden: false,
        },
      });
    }
  }

  if (takeCount === 0) {
    for (const take of quickTakes) {
      await prisma.quickTakeEntry.create({
        data: {
          legacyId: take.id,
          content: take.content,
          dateLabel: take.date,
          topic: take.topic,
          hidden: false,
        },
      });
    }
  }

  const settingsCount = await prisma.adminSettings.count();
  if (settingsCount === 0) {
    await prisma.adminSettings.create({
      data: {
        moderationEnabled: true,
        homeNoticeBubbleEnabled: false,
        homeNoticeBubbleMessage: "",
      },
    });
  }
}

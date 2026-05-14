import { prisma } from "@/lib/prisma";

let seedPromise: Promise<void> | null = null;

/**
 * Ensures minimal site config exists. Published ideas, briefs, and quick takes come only from
 * the database (admin / API) — nothing is re-inserted from TypeScript when a table is empty.
 */
export function ensureContentSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed();
  }
  return seedPromise;
}

async function runSeed() {
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

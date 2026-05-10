import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export type HomeNoticeBubble = {
  enabled: boolean;
  message: string;
};

export async function getHomeNoticeBubble(): Promise<HomeNoticeBubble> {
  await ensureContentSeeded();
  const row = await prisma.adminSettings.findFirst({ orderBy: { createdAt: "asc" } });
  const raw =
    row && typeof row.homeNoticeBubbleMessage === "string" ? row.homeNoticeBubbleMessage : "";
  return {
    enabled: row?.homeNoticeBubbleEnabled === true,
    message: raw.trim(),
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

export async function GET(request: Request) {
  try {
    await ensureContentSeeded();
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get("includeHidden") === "true";
    const rows = await prisma.quickTakeEntry.findMany({
      where: includeHidden ? {} : { hidden: false },
      orderBy: { legacyId: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.legacyId ?? 0,
        content: r.content,
        date: r.dateLabel,
        topic: r.topic,
        hidden: r.hidden,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load quick takes" },
      { status: 500 }
    );
  }
}

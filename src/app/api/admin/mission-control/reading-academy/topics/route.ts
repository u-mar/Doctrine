import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOK_LEVELS, READING_TOPICS } from "@/lib/mission-control/academy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const books = await prisma.mcReading.findMany({
      where: { topic: { in: [...READING_TOPICS] } },
      select: { topic: true, level: true, status: true },
    });

    const result = READING_TOPICS.map((topic) => {
      const topicBooks = books.filter((b) => b.topic === topic);
      const counts: Record<string, number> = {};
      for (const level of BOOK_LEVELS) {
        counts[level] = topicBooks.filter((b) => b.level === level).length;
      }
      return {
        topic,
        total: topicBooks.length,
        counts,
        completed: topicBooks.filter((b) => b.status === "completed").length,
        hasCurriculum: topicBooks.length > 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load topics" },
      { status: 500 }
    );
  }
}

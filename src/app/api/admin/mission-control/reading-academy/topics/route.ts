import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOK_LEVELS, READING_TOPICS } from "@/lib/mission-control/academy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.mcReading.findMany({
      where: { topic: { in: [...READING_TOPICS] } },
      select: { topic: true, level: true, category: true, status: true },
    });

    const result = READING_TOPICS.map((topic) => {
      const topicRows = rows.filter((b) => b.topic === topic);
      const books = topicRows.filter((b) => b.category === "book");
      const papers = topicRows.filter((b) => b.category === "policy_paper");

      const counts: Record<string, number> = {};
      for (const level of BOOK_LEVELS) {
        counts[level] = books.filter((b) => b.level === level).length;
      }

      return {
        topic,
        total: topicRows.length,
        counts,
        books: books.length,
        booksCompleted: books.filter((b) => b.status === "completed").length,
        policyPapers: papers.length,
        policyPapersCompleted: papers.filter((b) => b.status === "completed").length,
        completed: topicRows.filter((b) => b.status === "completed").length,
        hasCurriculum: topicRows.length > 0,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOK_LEVELS, isReadingTopic, type BookLevel } from "@/lib/mission-control/academy";
import { callClaudeJSON, ClaudeConfigError } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

const CURRICULUM_SYSTEM_PROMPT = `You are curating a rigorous, world-class personal reading curriculum for someone spending the next decade preparing to become an exceptional public servant, policy advisor, minister, and potentially a national leader — with special relevance to Somalia and Africa where applicable. For the given topic, select REAL, well-known, highly-regarded books. Never invent a fictional book or author. Cover four levels — beginner, intermediate, advanced, expert — with 2 books per level (8 total), ordered from most foundational to most specialized within each level.`;

type GeneratedBook = {
  title: string;
  author: string;
  year?: number;
  pages?: number;
  estimatedHours?: number;
  level: BookLevel;
  description: string;
  whyItMatters: string;
  keyLessons: string;
  prerequisites: string;
  readNext: string;
  relatedBooks?: string[];
};

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function sortBooks<T extends { level: string; order: number }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9) || a.order - b.order
  );
}

async function generateCurriculum(topic: string) {
  const user = `Topic: "${topic}"\n\nRespond with JSON: { "books": [ { "title": string, "author": string, "year": number, "pages": number, "estimatedHours": number, "level": "beginner"|"intermediate"|"advanced"|"expert", "description": string (2-3 sentences), "whyItMatters": string (1-2 sentences on relevance to a future minister/leader), "keyLessons": string (3-5 bullet points, one per line), "prerequisites": string (what to know beforehand, or "None"), "readNext": string (what topic or skill to pursue after finishing), "relatedBooks": string[] (2-3 related titles) } ] }. Exactly 8 books total, 2 per level.`;

  const result = await callClaudeJSON<{ books: GeneratedBook[] }>({
    system: CURRICULUM_SYSTEM_PROMPT,
    user,
    maxTokens: 4000,
  });

  const validBooks = result.books.filter((b) => BOOK_LEVELS.includes(b.level));

  await Promise.all(
    validBooks.map((b, i) =>
      prisma.mcReading.create({
        data: {
          title: b.title,
          author: b.author ?? "",
          category: "book",
          topic,
          level: b.level,
          year: b.year ?? null,
          pages: b.pages ?? 0,
          estimatedHours: b.estimatedHours ?? 0,
          description: b.description ?? "",
          whyItMatters: b.whyItMatters ?? "",
          keyLessons: b.keyLessons ?? "",
          prerequisites: b.prerequisites ?? "",
          readNext: b.readNext ?? "",
          relatedBooks: b.relatedBooks ?? [],
          status: "to-read",
          source: "ai",
          order: i,
        },
      })
    )
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") ?? "";
    if (!isReadingTopic(topic)) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 404 });
    }

    let rows = await prisma.mcReading.findMany({ where: { topic } });
    if (rows.length === 0) {
      await generateCurriculum(topic);
      rows = await prisma.mcReading.findMany({ where: { topic } });
    }

    return NextResponse.json(sortBooks(rows));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load books" },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic: string; regenerate?: boolean };
    if (!isReadingTopic(body.topic)) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 404 });
    }

    if (body.regenerate) {
      await prisma.mcReading.deleteMany({
        where: { topic: body.topic, source: "ai", status: { not: "completed" } },
      });
    }

    const existing = await prisma.mcReading.count({ where: { topic: body.topic } });
    if (existing === 0) {
      await generateCurriculum(body.topic);
    }

    const rows = await prisma.mcReading.findMany({ where: { topic: body.topic } });
    return NextResponse.json(sortBooks(rows));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate curriculum" },
      { status }
    );
  }
}

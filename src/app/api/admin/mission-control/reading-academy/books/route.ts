import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOK_LEVELS, isReadingTopic, type BookLevel } from "@/lib/mission-control/academy";
import { callClaudeJSON, ClaudeConfigError } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

const CURRICULUM_SYSTEM_PROMPT = `You are curating a rigorous, world-class personal reading curriculum for someone spending the next decade preparing to become an exceptional public servant, policy advisor, minister, and potentially a national leader — with special relevance to Somalia and Africa where applicable. For the given topic, select REAL, well-known, highly-regarded books. Never invent a fictional book or author. Cover four levels — beginner, intermediate, advanced, expert — with 2 books per level (8 total), ordered from most foundational to most specialized within each level.`;

const POLICY_PAPER_SYSTEM_PROMPT = `You are curating real, high-quality policy papers and reports for someone spending the next decade preparing to become an exceptional public servant, policy advisor, minister, and potentially a national leader — with special relevance to Somalia and Africa where applicable. For the given topic, select REAL papers/reports published by well-known institutions such as the World Bank, IMF, OECD, Brookings, UNDP, African Development Bank, African Union, Harvard Kennedy School, Center for Global Development, Chatham House, Carnegie Endowment, or RAND. Never invent a fictional paper. Prefer papers you are confident actually exist; if uncertain of the exact title, choose a well-known flagship report series from that institution on the topic (e.g. "World Bank World Development Report" on the relevant year/theme) rather than fabricating a precise but uncertain title.`;

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

type GeneratedPaper = {
  title: string;
  publisher: string;
  year?: number;
  pages?: number;
  estimatedHours?: number;
  description: string;
  whyItMatters: string;
  keyLessons: string;
  readNext: string;
  relatedBooks?: string[];
};

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function sortBooks<T extends { category: string; level: string; order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.category !== b.category) return a.category === "book" ? -1 : 1;
    return (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9) || a.order - b.order;
  });
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

async function generatePolicyPapers(topic: string) {
  const user = `Topic: "${topic}"\n\nRespond with JSON: { "papers": [ { "title": string, "publisher": string (the institution), "year": number, "pages": number, "estimatedHours": number, "description": string (2-3 sentences), "whyItMatters": string (1-2 sentences on relevance to a future minister/leader), "keyLessons": string (3-5 key findings/recommendations, one per line), "readNext": string (what to study next), "relatedBooks": string[] (2-3 related papers or reports) } ] }. Exactly 5 papers, from a mix of different institutions where possible.`;

  const result = await callClaudeJSON<{ papers: GeneratedPaper[] }>({
    system: POLICY_PAPER_SYSTEM_PROMPT,
    user,
    maxTokens: 3000,
  });

  await Promise.all(
    result.papers.map((p, i) =>
      prisma.mcReading.create({
        data: {
          title: p.title,
          publisher: p.publisher ?? "",
          category: "policy_paper",
          topic,
          level: "paper",
          year: p.year ?? null,
          pages: p.pages ?? 0,
          estimatedHours: p.estimatedHours ?? 0,
          description: p.description ?? "",
          whyItMatters: p.whyItMatters ?? "",
          keyLessons: p.keyLessons ?? "",
          readNext: p.readNext ?? "",
          relatedBooks: p.relatedBooks ?? [],
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

    const [bookCount, paperCount] = await Promise.all([
      prisma.mcReading.count({ where: { topic, category: "book" } }),
      prisma.mcReading.count({ where: { topic, category: "policy_paper" } }),
    ]);

    await Promise.all([
      bookCount === 0 ? generateCurriculum(topic) : Promise.resolve(),
      paperCount === 0 ? generatePolicyPapers(topic) : Promise.resolve(),
    ]);

    const rows = await prisma.mcReading.findMany({ where: { topic } });
    return NextResponse.json(sortBooks(rows));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content" },
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

    const [bookCount, paperCount] = await Promise.all([
      prisma.mcReading.count({ where: { topic: body.topic, category: "book" } }),
      prisma.mcReading.count({ where: { topic: body.topic, category: "policy_paper" } }),
    ]);

    await Promise.all([
      bookCount === 0 ? generateCurriculum(body.topic) : Promise.resolve(),
      paperCount === 0 ? generatePolicyPapers(body.topic) : Promise.resolve(),
    ]);

    const rows = await prisma.mcReading.findMany({ where: { topic: body.topic } });
    return NextResponse.json(sortBooks(rows));
  } catch (error) {
    const status = error instanceof ClaudeConfigError ? 412 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status }
    );
  }
}

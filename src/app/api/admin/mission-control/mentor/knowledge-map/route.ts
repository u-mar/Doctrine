import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { READING_TOPICS } from "@/lib/mission-control/academy";
import { computeKnowledgeMap } from "@/lib/mission-control/mentor-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const books = await prisma.mcReading.findMany({
      where: { topic: { in: [...READING_TOPICS] } },
      select: { topic: true, level: true, status: true },
    });
    return NextResponse.json(computeKnowledgeMap(books));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load knowledge map" },
      { status: 500 }
    );
  }
}

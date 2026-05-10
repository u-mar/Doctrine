import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return NextResponse.json({ ok: true, message: "MongoDB connection is healthy." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "MongoDB connection failed.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

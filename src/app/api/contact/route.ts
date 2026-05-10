import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_NAME = 120;
const MAX_CONTACT = 254;
const MAX_BODY = 8000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
      company?: string;
    };

    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = body.name?.trim().slice(0, MAX_NAME) ?? "";
    const contact = body.email?.trim().slice(0, MAX_CONTACT) ?? "";
    const message = body.message?.trim().slice(0, MAX_BODY) ?? "";

    if (!name || !contact || !message) {
      return NextResponse.json({ error: "Name, how to reach you, and message are required." }, { status: 400 });
    }

    await prisma.readerMessage.create({
      data: { name, email: contact, body: message },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send message." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripMarkdownForPreview } from "@/lib/utils";
import { JSDOM } from "jsdom";

function previewFromNote(note: string, maxLen: number): string {
  const plain = stripMarkdownForPreview(note);
  if (plain.length <= maxLen) {
    return plain;
  }
  return `${plain.slice(0, maxLen).trimEnd()}…`;
}

function generateSlug(title: string) {
  const dom = new JSDOM();
  const doc = dom.window.document;
  const slug = doc.createElement("div");
  slug.innerHTML = title;
  return (slug.textContent ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { draftId: string };
    const draftId = body.draftId;

    if (!draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }

    const draft = await prisma.draft.findUnique({ where: { id: draftId } });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const baseSlug = generateSlug(draft.title);
    let slug = baseSlug;
    let counter = 1;
    const dateLabel = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (draft.kind === "IDEA") {
      while (await prisma.ideaEntry.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      await prisma.ideaEntry.create({
        data: {
          slug,
          title: draft.title,
          summary: previewFromNote(draft.note, 150),
          readingTime: `${Math.max(1, Math.ceil(draft.note.split(/\s+/).length / 200))} min read`,
          dateLabel,
          topic: draft.topic,
          content: draft.note,
        },
      });
    } else if (draft.kind === "JOURNAL") {
      while (await prisma.journalEntry.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      await prisma.journalEntry.create({
        data: {
          slug,
          title: draft.title,
          dateLabel,
          topic: draft.topic,
          excerpt: previewFromNote(draft.note, 150),
          content: draft.note,
        },
      });
    } else if (draft.kind === "QUICK_TAKE") {
      await prisma.quickTakeEntry.create({
        data: {
          content: draft.note,
          dateLabel,
          topic: draft.topic,
        },
      });
    }

    await prisma.draft.delete({ where: { id: draftId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish draft" },
      { status: 500 }
    );
  }
}

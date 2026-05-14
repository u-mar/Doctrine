import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripMarkdownForPreview } from "@/lib/utils";
import { stripAuthoringEscapes } from "@/lib/markdown-normalize";

function previewFromNote(note: string, maxLen: number): string {
  const plain = stripMarkdownForPreview(note);
  if (plain.length <= maxLen) {
    return plain;
  }
  return `${plain.slice(0, maxLen).trimEnd()}…`;
}

/** Strip tags / decode entities for slugging (avoids jsdom, which breaks on serverless ESM/CJS). */
function htmlToPlainText(html: string): string {
  let s = html.replace(/<[^>]*>/g, " ");
  for (let pass = 0; pass < 8; pass++) {
    const before = s;
    s = s
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (full, dec) => {
        const n = parseInt(dec, 10);
        if (!Number.isFinite(n) || n < 0) return full;
        try {
          return String.fromCodePoint(n);
        } catch {
          return full;
        }
      })
      .replace(/&#x([0-9a-f]+);/gi, (full, hex) => {
        const n = parseInt(hex, 16);
        if (!Number.isFinite(n) || n < 0) return full;
        try {
          return String.fromCodePoint(n);
        } catch {
          return full;
        }
      })
      .replace(/&amp;/gi, "&");
    if (s === before) break;
  }
  return s.replace(/\s+/g, " ").trim();
}

function generateSlug(title: string) {
  return htmlToPlainText(title)
    .toLowerCase()
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

    const note = stripAuthoringEscapes(draft.note);

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
          summary: previewFromNote(note, 150),
          readingTime: `${Math.max(1, Math.ceil(note.split(/\s+/).length / 200))} min read`,
          dateLabel,
          topic: draft.topic,
          content: note,
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
          excerpt: previewFromNote(note, 150),
          content: note,
        },
      });
    } else if (draft.kind === "QUICK_TAKE") {
      await prisma.quickTakeEntry.create({
        data: {
          content: note,
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

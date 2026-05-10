import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureContentSeeded } from "@/lib/content/seed";

const MAX_HOME_NOTICE = 2000;

function normalizeSettings(row: {
  moderationEnabled: boolean;
  homeNoticeBubbleEnabled?: boolean | null;
  homeNoticeBubbleMessage?: string | null;
}) {
  return {
    moderationEnabled: row.moderationEnabled,
    homeNoticeBubbleEnabled: row.homeNoticeBubbleEnabled === true,
    homeNoticeBubbleMessage:
      typeof row.homeNoticeBubbleMessage === "string" ? row.homeNoticeBubbleMessage : "",
  };
}

export async function GET() {
  try {
    await ensureContentSeeded();
    let row = await prisma.adminSettings.findFirst({ orderBy: { createdAt: "asc" } });
    if (!row) {
      row = await prisma.adminSettings.create({
        data: {
          moderationEnabled: true,
          homeNoticeBubbleEnabled: false,
          homeNoticeBubbleMessage: "",
        },
      });
    }
    return NextResponse.json(normalizeSettings(row));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureContentSeeded();
    const body = (await request.json()) as {
      moderationEnabled?: boolean;
      homeNoticeBubbleEnabled?: boolean;
      homeNoticeBubbleMessage?: string;
    };

    const data: {
      moderationEnabled?: boolean;
      homeNoticeBubbleEnabled?: boolean;
      homeNoticeBubbleMessage?: string;
    } = {};

    if (typeof body.moderationEnabled === "boolean") {
      data.moderationEnabled = body.moderationEnabled;
    }
    if (typeof body.homeNoticeBubbleEnabled === "boolean") {
      data.homeNoticeBubbleEnabled = body.homeNoticeBubbleEnabled;
    }
    if (typeof body.homeNoticeBubbleMessage === "string") {
      data.homeNoticeBubbleMessage = body.homeNoticeBubbleMessage.slice(0, MAX_HOME_NOTICE);
    }

    let row = await prisma.adminSettings.findFirst({ orderBy: { createdAt: "asc" } });

    if (!row) {
      row = await prisma.adminSettings.create({
        data: {
          moderationEnabled: data.moderationEnabled ?? true,
          homeNoticeBubbleEnabled: data.homeNoticeBubbleEnabled ?? false,
          homeNoticeBubbleMessage: data.homeNoticeBubbleMessage ?? "",
        },
      });
    } else if (Object.keys(data).length > 0) {
      row = await prisma.adminSettings.update({
        where: { id: row.id },
        data,
      });
    }

    return NextResponse.json(normalizeSettings(row));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}

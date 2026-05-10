import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RATING_VISITOR_COOKIE, isValidRatingItemKey, parseRatingItemKeysParam } from "@/lib/content-rating-keys";

export const dynamic = "force-dynamic";

const MAX_RATING = 5;
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365 * 2;

async function resolveRaterKey(): Promise<{ raterKey: string; newVisitorId?: string }> {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Missing NEXTAUTH_SECRET or adapter errors must not break anonymous ratings.
  }
  const userId = session?.user && "id" in session.user ? String((session.user as { id?: string }).id ?? "") : "";
  if (userId) {
    return { raterKey: `user:${userId}` };
  }

  const jar = await cookies();
  const raw = jar.get(RATING_VISITOR_COOKIE)?.value?.trim();
  if (raw && /^[0-9a-f-]{36}$/i.test(raw)) {
    return { raterKey: `anon:${raw}` };
  }
  const uuid = randomUUID();
  return { raterKey: `anon:${uuid}`, newVisitorId: uuid };
}

function attachVisitorCookie(res: NextResponse, visitorId: string) {
  res.cookies.set(RATING_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

async function aggregatesForKeys(keys: string[]) {
  if (keys.length === 0) {
    return new Map<string, { average: number | null; count: number }>();
  }
  const rows = await prisma.contentRating.findMany({
    where: { itemKey: { in: keys } },
    select: { itemKey: true, value: true },
  });
  const sums = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const cur = sums.get(row.itemKey) ?? { sum: 0, count: 0 };
    cur.sum += row.value;
    cur.count += 1;
    sums.set(row.itemKey, cur);
  }
  const out = new Map<string, { average: number | null; count: number }>();
  for (const key of keys) {
    const agg = sums.get(key);
    if (!agg || agg.count === 0) {
      out.set(key, { average: null, count: 0 });
    } else {
      out.set(key, { average: Math.round((agg.sum / agg.count) * 10) / 10, count: agg.count });
    }
  }
  return out;
}

async function myRatingsForKeys(keys: string[], raterKey: string): Promise<Map<string, number>> {
  if (keys.length === 0) {
    return new Map();
  }
  const rows = await prisma.contentRating.findMany({
    where: { itemKey: { in: keys }, raterKey },
    select: { itemKey: true, value: true },
  });
  return new Map(rows.map((r) => [r.itemKey, r.value]));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const multiRaw = searchParams.get("itemKeys");
    const singleKey = searchParams.get("itemKey")?.trim();

    const { raterKey, newVisitorId } = await resolveRaterKey();

    if (multiRaw !== null) {
      const keys = parseRatingItemKeysParam(multiRaw);
      const [aggMap, myMap] = await Promise.all([
        aggregatesForKeys(keys),
        myRatingsForKeys(keys, raterKey),
      ]);
      const items: Record<string, { average: number | null; count: number; myRating: number | null }> = {};
      for (const key of keys) {
        const agg = aggMap.get(key) ?? { average: null, count: 0 };
        items[key] = {
          average: agg.average,
          count: agg.count,
          myRating: myMap.get(key) ?? null,
        };
      }
      const res = NextResponse.json({ items });
      if (newVisitorId) {
        attachVisitorCookie(res, newVisitorId);
      }
      return res;
    }

    if (!singleKey || !isValidRatingItemKey(singleKey)) {
      return NextResponse.json({ error: "itemKey or itemKeys is required" }, { status: 400 });
    }

    const [aggMap, myMap] = await Promise.all([
      aggregatesForKeys([singleKey]),
      myRatingsForKeys([singleKey], raterKey),
    ]);
    const agg = aggMap.get(singleKey) ?? { average: null, count: 0 };
    const res = NextResponse.json({
      itemKey: singleKey,
      average: agg.average,
      count: agg.count,
      myRating: myMap.get(singleKey) ?? null,
    });
    if (newVisitorId) {
      attachVisitorCookie(res, newVisitorId);
    }
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ratings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { itemKey?: string; value?: number };
    const itemKey = body.itemKey?.trim();
    const value = body.value;

    if (!itemKey || !isValidRatingItemKey(itemKey)) {
      return NextResponse.json({ error: "Invalid itemKey" }, { status: 400 });
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_RATING) {
      return NextResponse.json({ error: `value must be integer 1–${MAX_RATING}` }, { status: 400 });
    }

    const { raterKey, newVisitorId } = await resolveRaterKey();

    await prisma.contentRating.upsert({
      where: {
        itemKey_raterKey: {
          itemKey,
          raterKey,
        },
      },
      create: {
        itemKey,
        raterKey,
        value,
      },
      update: {
        value,
      },
    });

    const aggMap = await aggregatesForKeys([itemKey]);
    const agg = aggMap.get(itemKey) ?? { average: null, count: 0 };

    const res = NextResponse.json({
      itemKey,
      average: agg.average,
      count: agg.count,
      myRating: value,
    });
    if (newVisitorId) {
      attachVisitorCookie(res, newVisitorId);
    }
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save rating" },
      { status: 500 }
    );
  }
}

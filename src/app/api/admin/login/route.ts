import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function hashPassword(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

export async function POST(request: Request) {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (!configured) {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD in your environment to enable admin login." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const password = body.password ?? "";

  const a = hashPassword(password);
  const b = hashPassword(configured);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Set ADMIN_SESSION_SECRET or NEXTAUTH_SECRET so signed admin sessions can be issued.",
      },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, adminSessionCookieOptions());
  return res;
}

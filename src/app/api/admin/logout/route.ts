import { NextResponse } from "next/server";
import { COOKIE_NAME, adminSessionCookieOptions } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opts = adminSessionCookieOptions();
  res.cookies.set(COOKIE_NAME, "", { ...opts, maxAge: 0 });
  return res;
}

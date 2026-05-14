import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_session")?.value;
  const ok = token ? await verifyAdminSessionToken(token) : false;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    if (ok) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!ok) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (pathname === "/api/admin/login" || pathname.startsWith("/api/admin/login/")) {
    return NextResponse.next();
  }
  if (pathname === "/api/admin/logout" || pathname.startsWith("/api/admin/logout/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

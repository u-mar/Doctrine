
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { href: "/briefs", label: "Briefs" },
    { href: "/ideas", label: "Ideas" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ] as const;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] border-b border-border bg-background pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-lg font-bold tracking-tight sm:text-xl md:text-2xl">THE DOCTRINE</span>
            <span className="truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px] sm:tracking-[0.16em]">
              Politics, Public Affairs, and Ideas
            </span>
          </Link>

          <div className="hidden items-center gap-3 sm:gap-4 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-nav"
              onClick={() => setMobileOpen((o) => !o)}
              className="min-h-11 min-w-[4.75rem] rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80 active:bg-muted"
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-[110] bg-foreground/35 backdrop-blur-sm md:hidden dark:bg-background/60"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="mobile-site-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed left-3 right-3 top-[calc(4rem+env(safe-area-inset-top)+12px)] z-[120] flex max-h-[min(78vh,calc(100dvh-5rem-env(safe-area-inset-bottom)))] flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl ring-1 ring-black/10 md:hidden dark:border-border/60 dark:bg-popover dark:ring-white/15"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3.5 text-base transition-colors ${
                    isActive ? "bg-primary/12 font-semibold text-foreground" : "text-foreground/90 hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </nav>
  );
}

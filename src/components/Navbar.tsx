
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/briefs", label: "Briefs" },
    { href: "/ideas", label: "Ideas" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ] as const;

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
            <DropdownMenu>
              <DropdownMenuTrigger className="min-h-10 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
                Menu
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/briefs">Briefs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ideas">Ideas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact">Contact</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

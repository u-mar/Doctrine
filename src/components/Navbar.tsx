
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

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold sm:text-2xl">
            THE DOCTRINE
          </Link>

          <div className="hidden items-center gap-3 sm:gap-4 md:flex">
            <Link href="/journal" className="hover:text-gold-500">
              Briefs
            </Link>
            <Link href="/ideas" className="hover:text-gold-500">
              Ideas
            </Link>
            <Link href="/retrospective" className="hover:text-gold-500">
              Retrospective
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                More
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href="/quick-takes">Quick Takes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about">About</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
                Menu
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/journal">Briefs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ideas">Ideas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/retrospective">Retrospective</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quick-takes">Quick Takes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about">About</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

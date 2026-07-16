"use client";

import Link from "next/link";
import { useState } from "react";
import { MC_SECTIONS, type McSection } from "@/lib/mission-control/types";
import { DashboardSection, GoalsSection } from "./_components/DashboardAndGoals";
import {
  CareerSection,
  CountriesSection,
  MinistriesSection,
  NetworkingSection,
  PolicySection,
  ReadingSection,
  SpeakingSection,
  TasksSection,
  WritingSection,
} from "./_components/Trackers";
import {
  AnalyticsSection,
  HabitsSection,
  JournalSection,
  MonthlyReviewSection,
  VisionSection,
  YearlyReviewSection,
} from "./_components/HabitsJournalVision";

export default function MissionControlPage() {
  const [section, setSection] = useState<McSection>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(75,156,211,0.12),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#0c0d10]/95 p-4 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            mobileNav ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4B9CD3]">Private</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">Mission Control</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">
              Personal OS for statesmanship & public service.
            </p>
          </div>
          <nav className="flex max-h-[calc(100vh-11rem)] flex-col gap-0.5 overflow-y-auto pr-1" aria-label="Mission Control">
            {MC_SECTIONS.map((s) => {
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  title={s.hint}
                  onClick={() => {
                    setSection(s.key);
                    setMobileNav(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-[#4B9CD3]/15 font-medium text-[#9FD0EE] ring-1 ring-[#4B9CD3]/30"
                      : "text-white/55 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <Link
              href="/admin"
              className="block rounded-xl px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white/80"
            >
              ← Back to Studio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/40 transition hover:bg-white/5 hover:text-white/70"
            >
              Log out
            </button>
          </div>
        </aside>

        {mobileNav ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0a0b0d]/80 px-4 py-3 backdrop-blur-md lg:px-8">
            <button
              type="button"
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 lg:hidden"
              onClick={() => setMobileNav(true)}
            >
              Menu
            </button>
            <p className="hidden text-sm text-white/40 lg:block">
              {MC_SECTIONS.find((s) => s.key === section)?.hint}
            </p>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Admin only
            </span>
          </header>

          <main className="flex-1 px-4 py-8 lg:px-8">
            {section === "dashboard" && <DashboardSection />}
            {section === "goals" && <GoalsSection />}
            {section === "tasks" && <TasksSection />}
            {section === "reading" && <ReadingSection />}
            {section === "writing" && <WritingSection />}
            {section === "ministries" && <MinistriesSection />}
            {section === "countries" && <CountriesSection />}
            {section === "policy" && <PolicySection />}
            {section === "speaking" && <SpeakingSection />}
            {section === "networking" && <NetworkingSection />}
            {section === "career" && <CareerSection />}
            {section === "habits" && <HabitsSection />}
            {section === "journal" && <JournalSection />}
            {section === "vision" && <VisionSection />}
            {section === "analytics" && <AnalyticsSection />}
            {section === "monthly" && <MonthlyReviewSection />}
            {section === "yearly" && <YearlyReviewSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

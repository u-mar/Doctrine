"use client";

import Link from "next/link";
import { useState } from "react";
import { MC_NAV_GROUPS, MC_SECTIONS, type McSection } from "@/lib/mission-control/types";
import { DashboardSection, GoalsSection } from "./_components/DashboardAndGoals";
import {
  CountriesSection,
  MinistriesSection,
  PolicySection,
  ReadingSection,
  SpeakingSection,
  TasksSection,
  WritingSection,
} from "./_components/Trackers";
import {
  HabitsSection,
  ReviewsSection,
  VisionSection,
} from "./_components/HabitsJournalVision";
import { MentorSection } from "./_components/AiMentor";
import { ReadingAcademySection } from "./_components/ReadingAcademy";

export default function MissionControlPage() {
  const [section, setSection] = useState<McSection>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f7fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(59,143,217,0.16),transparent),radial-gradient(ellipse_60%_40%_at_90%_10%,rgba(125,211,252,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[17rem] border-r border-sky-100/80 bg-white/85 p-4 shadow-[4px_0_24px_rgba(59,143,217,0.06)] backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            mobileNav ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3B8FD9]">Private</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Mission Control</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Personal OS for statesmanship & public service.
            </p>
          </div>
          <nav className="flex max-h-[calc(100vh-14rem)] flex-col gap-4 overflow-y-auto pr-1" aria-label="Mission Control">
            {MC_NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((s) => {
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
                            ? "bg-gradient-to-r from-[#3B8FD9]/15 to-sky-50 font-medium text-[#1d6aa8] shadow-sm ring-1 ring-[#3B8FD9]/20"
                            : "text-slate-600 hover:bg-sky-50/80 hover:text-slate-900"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 space-y-1 border-t border-sky-100 pt-4">
            <Link
              href="/admin"
              className="block rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-sky-50 hover:text-slate-800"
            >
              ← Back to Studio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-sky-50 hover:text-slate-700"
            >
              Log out
            </button>
          </div>
        </aside>

        {mobileNav ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-slate-900/25 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sky-100/80 bg-[#f3f7fb]/80 px-4 py-3 backdrop-blur-md lg:px-8">
            <button
              type="button"
              className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm lg:hidden"
              onClick={() => setMobileNav(true)}
            >
              Menu
            </button>
            <p className="hidden text-sm text-slate-500 lg:block">
              {MC_SECTIONS.find((s) => s.key === section)?.hint}
            </p>
            <span className="rounded-full border border-sky-100 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700/70 shadow-sm">
              Admin only
            </span>
          </header>

          <main className="flex-1 px-4 py-8 lg:px-8">
            {section === "dashboard" && <DashboardSection />}
            {section === "mentor" && <MentorSection />}
            {section === "reading-academy" && <ReadingAcademySection />}
            {section === "goals" && <GoalsSection />}
            {section === "tasks" && <TasksSection />}
            {section === "reading" && <ReadingSection />}
            {section === "writing" && <WritingSection />}
            {section === "ministries" && <MinistriesSection />}
            {section === "countries" && <CountriesSection />}
            {section === "policy" && <PolicySection />}
            {section === "speaking" && <SpeakingSection />}
            {section === "habits" && <HabitsSection />}
            {section === "vision" && <VisionSection />}
            {section === "reviews" && <ReviewsSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

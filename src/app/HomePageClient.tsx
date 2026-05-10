"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import type { HomeLatestEntry } from "@/lib/home-latest";
import type { HomeNoticeBubble } from "@/lib/home-notice-bubble";
import HomeFloatingNotice from "@/components/HomeFloatingNotice";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
});

const latestPostVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } },
};

const categoryCards = [
  {
    title: "Briefs",
    description: "What happened, why it matters, what might come next.",
    href: "/briefs",
  },
  {
    title: "Ideas",
    description: "Longer notes on systems, governance, and strategy.",
    href: "/ideas",
  },
];

export default function HomePageClient({
  latestEntries,
  homeNoticeBubble,
}: {
  latestEntries: HomeLatestEntry[];
  homeNoticeBubble: HomeNoticeBubble;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-16 flex min-h-[82dvh] flex-col items-center justify-center px-2 py-10 sm:mb-24 sm:min-h-screen sm:py-14"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/20" />
          <div className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/20" />

          <div className="relative mx-auto max-w-5xl text-center">
            <h1
              className={`mx-auto mt-5 max-w-4xl px-1 text-[1.65rem] font-bold italic leading-snug tracking-tight sm:text-5xl sm:leading-tight md:text-6xl ${playfairDisplay.className}`}
            >
              <span className="block">The price of apathy toward public affairs</span>
              <span className="block">is to be ruled by evil men.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl px-1 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-lg">
              A space dedicated to my thoughts and opinions on politics, public affairs, and current events in Somalia,
              from local developments to national direction.
            </p>

            <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-3 px-1">
              <Link
                href="/briefs"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5"
              >
                Read Briefs
              </Link>
              <Link
                href="/ideas"
                className="rounded-full border border-border bg-background/70 px-6 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-muted sm:px-5 sm:py-2.5"
              >
                Explore Ideas
              </Link>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mb-20 max-w-6xl"
        >
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Explore</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Choose Your Reading Path
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {categoryCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col rounded-2xl border border-border/80 bg-card/50 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card/90 hover:shadow-md dark:bg-card/35 dark:hover:bg-card/55 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                <p className="mt-5 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  Open {card.title}
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </p>
              </Link>
            ))}
          </div>
        </motion.section>

        <motion.section initial="hidden" animate="visible" variants={latestPostVariants}>
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:mb-12 sm:text-4xl">Latest Entries</h2>
          <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
            {latestEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
                No entries yet. Publish briefs, ideas, or quick takes—or set a draft to public—from the admin workspace.
              </div>
            ) : (
              latestEntries.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-2xl border bg-card/75 p-4 shadow-sm sm:p-5 ${
                    post.isDraft ? "border-amber-500/40 ring-1 ring-amber-400/25 dark:border-amber-500/35" : "border-border"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          post.category === "Briefs"
                            ? "text-sky-600 dark:text-sky-300"
                            : post.category === "Ideas"
                              ? "text-indigo-600 dark:text-indigo-300"
                              : "text-amber-600 dark:text-amber-300"
                        }`}
                      >
                        {post.category}
                      </span>
                      {post.isDraft ? (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 dark:bg-yellow-900/45 dark:text-yellow-100">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm text-muted-foreground">{post.date}</span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold transition-colors hover:text-primary sm:text-2xl">
                    <Link href={post.href}>{post.title}</Link>
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-4">
                    <Link
                      href={post.href}
                      className="text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      Read more
                    </Link>
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </main>

      <HomeFloatingNotice enabled={homeNoticeBubble.enabled} message={homeNoticeBubble.message} />
    </div>
  );
}

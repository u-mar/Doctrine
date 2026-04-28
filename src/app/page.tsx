"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
});

const latestPostVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } },
};

export default function HomePage() {
  const latestPosts = [
    {
      title: "Brief: U.S.-Iran Escalation (Overview)",
      category: "Briefs",
      date: "April 27, 2026",
      excerpt: "A concise overview of the latest U.S.-Iran escalation, its drivers, and regional risk pathways.",
      slug: "us-iran-escalation-overview",
    },
    {
      title: "The Illusion of Control in Complex Systems",
      category: "Ideas",
      date: "April 20, 2026",
      excerpt: "After some reflection, I believe we overestimate our ability to influence large-scale systems.",
      slug: "illusion-of-control",
    },
    {
      title: "A Quick Take on the recent policy change.",
      category: "Quick Takes",
      date: "April 19, 2026",
      excerpt: "This is a step in the wrong direction.",
      slug: "policy-change-take",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-24 px-2 py-6 sm:py-10"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/20" />
          <div className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/20" />

          <div className="relative mx-auto max-w-5xl text-center">
            <h1 className={`mx-auto mt-5 max-w-4xl text-3xl font-bold italic leading-tight tracking-tight sm:text-5xl md:text-6xl ${playfairDisplay.className}`}>
              <span className="block">The price of apathy toward public affairs</span>
              <span className="block">is to be ruled by evil men.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A space dedicated to my thoughts and opinions on politics, public affairs, and current events,
              from local matters to the state of the Ummah.
            </p>

            <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-3">
              <Link
                href="/journal"
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Read Briefs
              </Link>
              <Link
                href="/ideas"
                className="rounded-full border border-border bg-background/70 px-5 py-2.5 text-sm font-medium backdrop-blur transition-colors hover:bg-muted"
              >
                Explore Ideas
              </Link>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={latestPostVariants}
        >
          <h2 className="mb-12 text-center text-4xl font-bold">
            Latest Entries
          </h2>
          <div className="mx-auto max-w-3xl space-y-5">
            {latestPosts.map((post) => (
              <div key={post.slug} className="rounded-2xl border border-border bg-card/70 p-5">
                <div className="flex items-center justify-between mb-2">
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
                  <span className="text-sm text-muted-foreground">
                    {post.date}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2 hover:text-primary transition-colors">
                  <Link href={`/${post.category === "Briefs" ? "journal" : post.category.toLowerCase()}/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}



"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyIdeaOverrides, getIdeaOverridesFromStorage } from "@/lib/published-content";

export default function IdeasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [displayIdeas, setDisplayIdeas] = useState(() => applyIdeaOverrides({}));

  const ideaCardStyles = [
    "border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-card to-card dark:border-sky-800/60 dark:from-sky-950/30",
    "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-card to-card dark:border-emerald-800/60 dark:from-emerald-950/30",
    "border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-card to-card dark:border-amber-800/60 dark:from-amber-950/30",
    "border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-card to-card dark:border-rose-800/60 dark:from-rose-950/30",
  ];

  useEffect(() => {
    setDisplayIdeas(applyIdeaOverrides(getIdeaOverridesFromStorage()));
  }, []);

  const availableTopics = useMemo(
    () => ["All", ...new Set(displayIdeas.map((idea) => idea.topic))],
    [displayIdeas]
  );

  const filteredIdeas = displayIdeas.filter(
    (idea) =>
      (selectedTopic === "All" || idea.topic === selectedTopic) &&
      (idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Ideas</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Proposed ideas and approaches for addressing key issues and challenges.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-5xl">
          <input
            type="text"
            placeholder="Search ideas by title, summary, or topic..."
            className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="mx-auto mb-10 flex max-w-5xl flex-wrap gap-2">
          {availableTopics.map((topic) => {
            const isActive = selectedTopic === topic;

            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredIdeas.map((idea, index) => (
            <motion.div
              key={idea.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link
                href={`/ideas/${idea.slug}`}
                className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${ideaCardStyles[index % ideaCardStyles.length]}`}
              >
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 font-medium uppercase tracking-wide text-indigo-900 dark:border-indigo-700/70 dark:bg-indigo-900/40 dark:text-indigo-200">
                    {idea.topic}
                  </span>
                  <span className="text-muted-foreground">{idea.date}</span>
                </div>

                <h2 className="mb-3 text-2xl font-bold tracking-tight">{idea.title}</h2>
                <p className="mb-4 flex-grow text-muted-foreground">
                    {idea.summary}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{idea.readingTime}</span>
                  <span className="text-primary transition-transform group-hover:translate-x-1">
                    Read idea {"->"}
                  </span>
                  </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
            No ideas match this filter yet.
          </div>
        )}
      </div>
    </div>
  );
}

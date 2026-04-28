"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import EngagementPanel from "@/components/EngagementPanel";
import { quickTakes, quickTakeTopics } from "@/lib/quick-takes";

type SortMode = "newest" | "top";

export default function QuickTakesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<(typeof quickTakeTopics)[number]>("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [engagementScores, setEngagementScores] = useState<Record<number, number>>({});

  useEffect(() => {
    const refreshEngagementScores = () => {
      const nextScores: Record<number, number> = {};

      for (const take of quickTakes) {
        const raw = window.localStorage.getItem(`engagement:quick-take:${take.id}`);

        if (!raw) {
          nextScores[take.id] = 0;
          continue;
        }

        try {
          const parsed = JSON.parse(raw) as { vote?: string };
          const voteBonus = parsed.vote === "agree" ? 2 : parsed.vote === "disagree" ? 1 : 0;
          nextScores[take.id] = voteBonus;
        } catch {
          nextScores[take.id] = 0;
        }
      }

      setEngagementScores(nextScores);
    };

    refreshEngagementScores();
    window.addEventListener("focus", refreshEngagementScores);

    return () => {
      window.removeEventListener("focus", refreshEngagementScores);
    };
  }, []);

  const filteredTakes = quickTakes.filter(
    (take) =>
      (selectedTopic === "All" || take.topic === selectedTopic) &&
      (take.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        take.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const visibleTakes = useMemo(() => {
    const takes = [...filteredTakes];

    if (sortMode === "top") {
      takes.sort((a, b) => {
        const scoreDiff = (engagementScores[b.id] ?? 0) - (engagementScores[a.id] ?? 0);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      return takes;
    }

    takes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return takes;
  }, [filteredTakes, sortMode, engagementScores]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Quick Takes</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Short opinions built for response. Agree or disagree to register your stance.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-4xl">
          <input
            type="text"
            placeholder="Search quick takes by content or topic..."
            className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sort by</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="top">Top</option>
            </select>
          </label>
        </div>

        <div className="mx-auto mb-8 flex max-w-4xl flex-wrap gap-2">
          {quickTakeTopics.map((topic) => {
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

        <div className="mx-auto max-w-4xl space-y-5">
          {visibleTakes.map((take, index) => (
            <motion.div
              key={take.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm"
            >
              <p className="text-xl leading-relaxed">{take.content}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {take.topic}
                </span>
                <span className="mt-4">{take.date}</span>
              </div>

              <EngagementPanel
                itemKey={`quick-take:${take.id}`}
                title=""
                commentsEnabled={false}
                voteStyle="polarity"
                showStatusText={false}
              />
            </motion.div>
          ))}
        </div>

        {visibleTakes.length === 0 && (
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
            No quick takes match this filter yet.
          </div>
        )}
      </div>
    </div>
  );
}

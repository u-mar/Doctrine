"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { QuickTake } from "@/lib/quick-takes";

type SortMode = "newest" | "top";

export default function QuickTakesPage() {
  const [takes, setTakes] = useState<QuickTake[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [engagementScores, setEngagementScores] = useState<Record<number, number>>({});

  const topicOptions = useMemo(() => {
    const unique = new Set(takes.map((take) => take.topic));
    return ["All", ...Array.from(unique).sort()];
  }, [takes]);

  const activeTopic = topicOptions.includes(selectedTopic) ? selectedTopic : "All";

  useEffect(() => {
    const load = async () => {
      const [takesResponse, engagementResponse] = await Promise.all([
        fetch("/api/content/quick-takes"),
        fetch("/api/content/engagement"),
      ]);
      if (!takesResponse.ok) {
        return;
      }
      const nextTakes = (await takesResponse.json()) as QuickTake[];
      setTakes(nextTakes);

      let engagementRows: { itemKey: string; vote: "agree" | "disagree" | null }[] = [];
      if (engagementResponse.ok) {
        engagementRows = (await engagementResponse.json()) as {
          itemKey: string;
          vote: "agree" | "disagree" | null;
        }[];
      }

      const nextScores: Record<number, number> = {};
      for (const take of nextTakes) {
        const row = engagementRows.find((item) => item.itemKey === `quick-take:${take.id}`);
        const vote = row?.vote;
        nextScores[take.id] = vote === "agree" ? 2 : vote === "disagree" ? 1 : 0;
      }
      setEngagementScores(nextScores);
    };

    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filteredTakes = takes.filter(
    (take) =>
      (activeTopic === "All" || take.topic === activeTopic) &&
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
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Quick Takes</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
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
          {topicOptions.map((topic) => {
            const isActive = activeTopic === topic;

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
              id={`quick-take-${take.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="scroll-mt-24 rounded-2xl border border-border bg-card/85 p-5 shadow-sm"
            >
              <p className="text-xl leading-relaxed">{take.content}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {take.topic}
                </span>
                <span className="mt-4">{take.date}</span>
              </div>

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

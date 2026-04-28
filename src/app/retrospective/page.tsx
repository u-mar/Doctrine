"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type RetrospectiveEntry = {
  id: number;
  title: string;
  period: string;
  focus: string;
  summary: string;
  whatWorked: string[];
  whatDidNotWork: string[];
  nextMove: string;
};

const retrospectiveEntries: RetrospectiveEntry[] = [
  {
    id: 1,
    title: "Policy Commentary Cycle",
    period: "Q2 2026",
    focus: "Geopolitical Analysis",
    summary:
      "This cycle focused on speed and clarity during fast-moving events while maintaining analytical depth.",
    whatWorked: [
      "Publishing concise context sections improved reader retention.",
      "Using structured headings made long briefs easier to scan.",
      "Topic labeling improved discoverability across entries.",
    ],
    whatDidNotWork: [
      "Some briefs were too dense before formatting improvements.",
      "Cross-linking between related posts was inconsistent.",
    ],
    nextMove:
      "Standardize a brief template with fixed section order and add related-entry links for continuity.",
  },
  {
    id: 2,
    title: "Audience Interaction Pass",
    period: "Q2 2026",
    focus: "Engagement Design",
    summary:
      "The goal was to simplify reaction mechanics and remove friction in public interaction pathways.",
    whatWorked: [
      "Agree/Disagree controls raised interaction clarity.",
      "Removing unused comment patterns reduced visual noise.",
    ],
    whatDidNotWork: [
      "Signals from reactions are still shallow without context.",
      "Engagement metrics need clearer interpretation guidance.",
    ],
    nextMove:
      "Introduce lightweight trend summaries so reaction data supports better editorial decisions.",
  },
  {
    id: 3,
    title: "Editorial Positioning Review",
    period: "Q2 2026",
    focus: "Voice and Direction",
    summary:
      "Positioning was refined toward sharper framing of power, governance, and long-range consequences.",
    whatWorked: [
      "Direct framing improved thematic consistency.",
      "Clearer distinction between Briefs, Ideas, and Quick Takes reduced overlap.",
    ],
    whatDidNotWork: [
      "Some entries repeated context that could be centralized.",
      "Update cadence varied too much across sections.",
    ],
    nextMove:
      "Maintain an internal context index and set a weekly publishing rhythm by content type.",
  },
];

export default function RetrospectivePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFocus, setSelectedFocus] = useState("All");

  const retrospectiveCardStyles = [
    "border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-card to-card dark:border-sky-800/60 dark:from-sky-950/30",
    "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-card to-card dark:border-emerald-800/60 dark:from-emerald-950/30",
    "border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-card to-card dark:border-amber-800/60 dark:from-amber-950/30",
    "border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-card to-card dark:border-rose-800/60 dark:from-rose-950/30",
  ];

  const availableFocuses = useMemo(
    () => ["All", ...new Set(retrospectiveEntries.map((entry) => entry.focus))],
    []
  );

  const filteredEntries = retrospectiveEntries.filter(
    (entry) =>
      (selectedFocus === "All" || entry.focus === selectedFocus) &&
      (
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.period.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Retrospective</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Commentary on past events, their impact, and what could have been done differently.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-5xl">
          <input
            type="text"
            placeholder="Search retrospectives by title, focus, or period..."
            className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="mx-auto mb-10 flex max-w-5xl flex-wrap gap-2">
          {availableFocuses.map((focus) => {
            const isActive = selectedFocus === focus;

            return (
              <button
                key={focus}
                type="button"
                onClick={() => setSelectedFocus(focus)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {focus}
              </button>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry, index) => (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${retrospectiveCardStyles[index % retrospectiveCardStyles.length]}`}
            >
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 font-medium uppercase tracking-wide text-indigo-900 dark:border-indigo-700/70 dark:bg-indigo-900/40 dark:text-indigo-200">
                  {entry.focus}
                </span>
                <span className="text-muted-foreground">{entry.period}</span>
              </div>

              <h2 className="mb-3 text-2xl font-bold tracking-tight">{entry.title}</h2>
              <p className="mb-4 flex-grow text-muted-foreground">{entry.summary}</p>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Worked: {entry.whatWorked.length} points</p>
                <p>Did not work: {entry.whatDidNotWork.length} points</p>
              </div>

              <div className="mt-4 border-t border-border/50 pt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Next Move:</span> {entry.nextMove}
              </div>

              <p className="mt-4 text-sm font-medium text-primary">Retrospective summary</p>
            </motion.article>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
            No retrospective entries match this filter yet.
          </div>
        )}
      </div>
    </div>
  );
}

export type McSection =
  | "dashboard"
  | "mentor"
  | "reading-academy"
  | "goals"
  | "reading"
  | "writing"
  | "ministries"
  | "countries"
  | "policy"
  | "speaking"
  | "habits"
  | "vision"
  | "reviews"
  | "tasks";

export type McNavGroup = {
  label: string;
  items: { key: McSection; label: string; hint: string }[];
};

export const MC_NAV_GROUPS: McNavGroup[] = [
  {
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", hint: "Command overview" }],
  },
  {
    label: "AI Mentor",
    items: [
      { key: "mentor", label: "Mentor", hint: "Today's mission & knowledge map" },
      { key: "reading-academy", label: "Reading Academy", hint: "AI-curated reading curriculum" },
    ],
  },
  {
    label: "Planning",
    items: [
      { key: "goals", label: "Goals", hint: "Horizons & targets" },
      { key: "tasks", label: "Tasks", hint: "Upcoming work" },
    ],
  },
  {
    label: "Learning",
    items: [
      { key: "reading", label: "Reading", hint: "Books & papers" },
      { key: "ministries", label: "Ministries", hint: "Ministry studies" },
      { key: "countries", label: "Countries", hint: "Country case studies" },
    ],
  },
  {
    label: "Output",
    items: [
      { key: "writing", label: "Writing", hint: "Briefs & essays" },
      { key: "policy", label: "Policy Ideas", hint: "Private vault" },
      { key: "speaking", label: "Speaking", hint: "Practice log" },
    ],
  },
  {
    label: "Discipline",
    items: [{ key: "habits", label: "Habits", hint: "Daily discipline" }],
  },
  {
    label: "Reflection",
    items: [
      { key: "vision", label: "Vision Board", hint: "Mission & values" },
      { key: "reviews", label: "Reviews", hint: "Monthly & yearly reviews" },
    ],
  },
];

export const MC_SECTIONS = MC_NAV_GROUPS.flatMap((g) => g.items);

export const GOAL_HORIZONS = [
  "lifetime",
  "10-year",
  "5-year",
  "1-year",
  "quarterly",
  "monthly",
  "weekly",
  "daily",
] as const;

export const DEFAULT_HABITS = [
  "Reading",
  "Writing",
  "Exercise",
  "Prayer",
  "Study",
  "Research",
  "Language",
  "Public speaking",
  "News review",
] as const;

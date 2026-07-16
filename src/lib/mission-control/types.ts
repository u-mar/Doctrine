export type McSection =
  | "dashboard"
  | "goals"
  | "reading"
  | "writing"
  | "ministries"
  | "countries"
  | "policy"
  | "speaking"
  | "networking"
  | "career"
  | "habits"
  | "journal"
  | "vision"
  | "analytics"
  | "monthly"
  | "yearly"
  | "tasks";

export const MC_SECTIONS: { key: McSection; label: string; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", hint: "Command overview" },
  { key: "goals", label: "Goals", hint: "Horizons & targets" },
  { key: "tasks", label: "Tasks", hint: "Upcoming work" },
  { key: "reading", label: "Reading", hint: "Books & papers" },
  { key: "writing", label: "Writing", hint: "Briefs & essays" },
  { key: "ministries", label: "Ministries", hint: "Ministry studies" },
  { key: "countries", label: "Countries", hint: "Country case studies" },
  { key: "policy", label: "Policy Ideas", hint: "Private vault" },
  { key: "speaking", label: "Speaking", hint: "Practice log" },
  { key: "networking", label: "Networking", hint: "People CRM" },
  { key: "career", label: "Career", hint: "Government path" },
  { key: "habits", label: "Habits", hint: "Daily discipline" },
  { key: "journal", label: "Journal", hint: "Daily reflection" },
  { key: "vision", label: "Vision Board", hint: "Mission & values" },
  { key: "analytics", label: "Analytics", hint: "Progress charts" },
  { key: "monthly", label: "Monthly Review", hint: "Month debrief" },
  { key: "yearly", label: "Yearly Review", hint: "Annual report" },
];

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
  "Journal",
] as const;

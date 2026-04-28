export interface QuickTake {
  id: number;
  content: string;
  date: string;
  topic: string;
}

export const quickTakes: QuickTake[] = [
  {
    id: 1,
    content: "Clarity is the ultimate weapon in a world of noise.",
    date: "April 21, 2026",
    topic: "Communication",
  },
  {
    id: 2,
    content:
      "Most political arguments are not about solutions, but about signaling allegiance to a tribe.",
    date: "April 20, 2026",
    topic: "Politics",
  },
  {
    id: 3,
    content: "A system that cannot be criticized cannot be improved.",
    date: "April 19, 2026",
    topic: "Systems",
  },
  {
    id: 4,
    content: "Patience is a form of strategic advantage.",
    date: "April 18, 2026",
    topic: "Strategy",
  },
];

export const quickTakeTopics = [
  "All",
  ...new Set(quickTakes.map((item) => item.topic)),
] as const;

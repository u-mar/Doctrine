export const READING_TOPICS = [
  "Governance",
  "Public Administration",
  "Economics",
  "Public Finance",
  "Leadership",
  "Diplomacy",
  "Negotiation",
  "Political Philosophy",
  "History",
  "African Politics",
  "Somali Politics",
  "Federalism",
  "Constitutional Law",
  "Public Policy",
  "State Building",
  "Development Economics",
  "Military Strategy",
  "National Security",
  "Psychology",
  "Communication",
  "Biography",
  "Decision Making",
  "Technology",
  "Artificial Intelligence",
  "Digital Government",
  "Health Systems",
  "Education Reform",
  "Infrastructure",
  "Anti-Corruption",
  "Institution Building",
] as const;

export type ReadingTopic = (typeof READING_TOPICS)[number];

export const BOOK_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

export type BookLevel = (typeof BOOK_LEVELS)[number];

export function isReadingTopic(value: string): value is ReadingTopic {
  return (READING_TOPICS as readonly string[]).includes(value);
}

export const KNOWLEDGE_LEVEL_WEIGHT: Record<BookLevel, number> = {
  beginner: 10,
  intermediate: 15,
  advanced: 20,
  expert: 25,
};

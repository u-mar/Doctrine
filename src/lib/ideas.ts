export interface Idea {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  date: string;
  topic: string;
  content: string;
  status?: string;
  /** Published idea shown with draft styling until cleared in admin. */
  showAsDraft?: boolean;
}

/** Demo rows are not auto-seeded; ideas live in the database after you publish from Studio. */
export const ideas: Idea[] = [];

export const ideaTopics = ["All", ...new Set(ideas.map((item) => item.topic))] as const;

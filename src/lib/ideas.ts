export interface Idea {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
  date: string;
  topic: string;
  content: string;
}

export const ideas: Idea[] = [
  {
    slug: "the-gravity-of-incentives",
    title: "The Gravity of Incentives",
    summary:
      "An exploration of how incentive structures dictate outcomes more than any other single factor.",
    readingTime: "8 min read",
    date: "April 18, 2026",
    topic: "Policy",
    content:
      "Incentives are the hidden architecture of every decision-making environment. Whether in public institutions or private organizations, behavior almost always follows what gets rewarded.\n\nWhen leaders focus on messaging without auditing incentives, they get cosmetic change and strategic drift. Designing better outcomes requires making the desired behavior the easiest and most rewarding choice.",
  },
  {
    slug: "second-order-thinking-in-policy",
    title: "Second-Order Thinking in Policy",
    summary:
      "Why considering the long-term consequences of decisions is the most critical and overlooked skill in governance.",
    readingTime: "12 min read",
    date: "April 15, 2026",
    topic: "Governance",
    content:
      "First-order effects are obvious and immediate. Second-order effects are slower and often politically inconvenient, which is exactly why they are ignored.\n\nPolicy quality improves when teams ask what this decision changes in six months, two years, and one election cycle. Better policy is often less about new tools and more about longer time horizons.",
  },
  {
    slug: "the-difference-between-complicated-and-complex",
    title: "The Difference Between Complicated and Complex",
    summary:
      "A fundamental distinction that changes how we approach problem-solving in systems.",
    readingTime: "6 min read",
    date: "April 10, 2026",
    topic: "Systems",
    content:
      "Complicated systems can be decoded. Complex systems adapt in response to intervention. Treating complexity like machinery leads to brittle plans and surprise failures.\n\nThe practical shift is to design for feedback loops, experimentation, and iteration. In complex domains, progress is less about perfect prediction and more about resilient adjustment.",
  },
];

export const ideaTopics = ["All", ...new Set(ideas.map((item) => item.topic))] as const;

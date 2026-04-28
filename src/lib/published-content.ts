import { Idea, ideas } from "@/lib/ideas";
import { JournalEntry, journalEntries } from "@/lib/journal-entries";

export const IDEA_OVERRIDES_STORAGE_KEY = "content:idea-overrides";
export const JOURNAL_OVERRIDES_STORAGE_KEY = "content:journal-overrides";
export const IDEA_ADDITIONS_STORAGE_KEY = "content:idea-additions";
export const JOURNAL_ADDITIONS_STORAGE_KEY = "content:journal-additions";
export const IDEA_HIDDEN_SLUGS_STORAGE_KEY = "content:idea-hidden-slugs";
export const JOURNAL_HIDDEN_SLUGS_STORAGE_KEY = "content:journal-hidden-slugs";

type IdeaOverride = Partial<
  Pick<Idea, "title" | "summary" | "readingTime" | "date" | "topic" | "content">
>;

type JournalOverride = Partial<
  Pick<JournalEntry, "title" | "date" | "topic" | "excerpt" | "content">
>;

export type IdeaOverrideMap = Record<string, IdeaOverride>;
export type JournalOverrideMap = Record<string, JournalOverride>;

export function getIdeaOverridesFromStorage(): IdeaOverrideMap {
  return getMapFromStorage<IdeaOverrideMap>(IDEA_OVERRIDES_STORAGE_KEY);
}

export function getJournalOverridesFromStorage(): JournalOverrideMap {
  return getMapFromStorage<JournalOverrideMap>(JOURNAL_OVERRIDES_STORAGE_KEY);
}

export function getIdeaAdditionsFromStorage(): Idea[] {
  return getArrayFromStorage<Idea>(IDEA_ADDITIONS_STORAGE_KEY);
}

export function getJournalAdditionsFromStorage(): JournalEntry[] {
  return getArrayFromStorage<JournalEntry>(JOURNAL_ADDITIONS_STORAGE_KEY);
}

export function getHiddenIdeaSlugsFromStorage(): string[] {
  return getArrayFromStorage<string>(IDEA_HIDDEN_SLUGS_STORAGE_KEY);
}

export function getHiddenJournalSlugsFromStorage(): string[] {
  return getArrayFromStorage<string>(JOURNAL_HIDDEN_SLUGS_STORAGE_KEY);
}

export function applyIdeaOverrides(overrides: IdeaOverrideMap): Idea[] {
  const mergedIdeas = ideas.map((idea) => ({
    ...idea,
    ...(overrides[idea.slug] ?? {}),
  }));

  const additions = getIdeaAdditionsFromStorage().filter(
    (item) => !mergedIdeas.some((idea) => idea.slug === item.slug)
  );
  const hiddenSlugs = new Set(getHiddenIdeaSlugsFromStorage());

  return [...mergedIdeas, ...additions].filter((item) => !hiddenSlugs.has(item.slug));
}

export function applyJournalOverrides(overrides: JournalOverrideMap): JournalEntry[] {
  const mergedEntries = journalEntries.map((entry) => ({
    ...entry,
    ...(overrides[entry.slug] ?? {}),
  }));

  const additions = getJournalAdditionsFromStorage().filter(
    (item) => !mergedEntries.some((entry) => entry.slug === item.slug)
  );
  const hiddenSlugs = new Set(getHiddenJournalSlugsFromStorage());

  return [...mergedEntries, ...additions].filter((item) => !hiddenSlugs.has(item.slug));
}

function getMapFromStorage<T>(storageKey: string): T {
  if (typeof window === "undefined") {
    return {} as T;
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(storageKey);
    return {} as T;
  }
}

function getArrayFromStorage<T>(storageKey: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

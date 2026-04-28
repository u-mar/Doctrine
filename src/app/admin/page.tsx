
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Idea, ideas } from "@/lib/ideas";
import { JournalEntry, journalEntries } from "@/lib/journal-entries";
import { quickTakes } from "@/lib/quick-takes";
import {
  IDEA_ADDITIONS_STORAGE_KEY,
  IDEA_HIDDEN_SLUGS_STORAGE_KEY,
  IDEA_OVERRIDES_STORAGE_KEY,
  JOURNAL_ADDITIONS_STORAGE_KEY,
  JOURNAL_HIDDEN_SLUGS_STORAGE_KEY,
  JOURNAL_OVERRIDES_STORAGE_KEY,
  IdeaOverrideMap,
  JournalOverrideMap,
  applyIdeaOverrides,
  applyJournalOverrides,
  getHiddenIdeaSlugsFromStorage,
  getHiddenJournalSlugsFromStorage,
  getIdeaAdditionsFromStorage,
  getIdeaOverridesFromStorage,
  getJournalAdditionsFromStorage,
  getJournalOverridesFromStorage,
} from "@/lib/published-content";

type AdminTab = "overview" | "planner" | "moderation" | "content" | "settings";
type DraftKind = "idea" | "journal" | "quick-take";
type DraftStatus = "draft" | "review" | "scheduled" | "published";
type Vote = "agree" | "disagree" | null;

interface Draft {
  id: number;
  kind: DraftKind;
  title: string;
  topic: string;
  note: string;
  status: DraftStatus;
  scheduledFor: string;
  createdAt: string;
}

interface EngagementSnapshot {
  key: string;
  vote: Vote;
}

interface AdminSettings {
  moderationEnabled: boolean;
}

type ContentActionMode = "view" | "edit";
type ContentFilter = "all" | "idea" | "journal";

const DRAFT_STORAGE_KEY = "admin:drafts";
const SETTINGS_STORAGE_KEY = "admin:settings";
const defaultSettings: AdminSettings = {
  moderationEnabled: true,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [kind, setKind] = useState<DraftKind>("idea");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<DraftStatus>("draft");
  const [scheduledFor, setScheduledFor] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [engagement, setEngagement] = useState<EngagementSnapshot[]>([]);
  const [ideaOverrides, setIdeaOverrides] = useState<IdeaOverrideMap>({});
  const [journalOverrides, setJournalOverrides] = useState<JournalOverrideMap>({});
  const [ideaAdditions, setIdeaAdditions] = useState<Idea[]>([]);
  const [journalAdditions, setJournalAdditions] = useState<JournalEntry[]>([]);
  const [hiddenIdeaSlugs, setHiddenIdeaSlugs] = useState<string[]>([]);
  const [hiddenJournalSlugs, setHiddenJournalSlugs] = useState<string[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [contentFeedback, setContentFeedback] = useState("");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [selectedIdea, setSelectedIdea] = useState<{ slug: string; mode: ContentActionMode } | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<{ slug: string; mode: ContentActionMode } | null>(null);

  useEffect(() => {
    const rawDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (rawDrafts) {
      try {
        const parsed = JSON.parse(rawDrafts) as Draft[];
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }

    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings) as Partial<AdminSettings>;
        setSettings((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
    }

    refreshEngagement();
    setIdeaOverrides(getIdeaOverridesFromStorage());
    setJournalOverrides(getJournalOverridesFromStorage());
    setIdeaAdditions(getIdeaAdditionsFromStorage());
    setJournalAdditions(getJournalAdditionsFromStorage());
    setHiddenIdeaSlugs(getHiddenIdeaSlugsFromStorage());
    setHiddenJournalSlugs(getHiddenJournalSlugsFromStorage());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(IDEA_OVERRIDES_STORAGE_KEY, JSON.stringify(ideaOverrides));
  }, [ideaOverrides]);

  useEffect(() => {
    window.localStorage.setItem(JOURNAL_OVERRIDES_STORAGE_KEY, JSON.stringify(journalOverrides));
  }, [journalOverrides]);

  useEffect(() => {
    window.localStorage.setItem(IDEA_ADDITIONS_STORAGE_KEY, JSON.stringify(ideaAdditions));
  }, [ideaAdditions]);

  useEffect(() => {
    window.localStorage.setItem(JOURNAL_ADDITIONS_STORAGE_KEY, JSON.stringify(journalAdditions));
  }, [journalAdditions]);

  useEffect(() => {
    window.localStorage.setItem(IDEA_HIDDEN_SLUGS_STORAGE_KEY, JSON.stringify(hiddenIdeaSlugs));
  }, [hiddenIdeaSlugs]);

  useEffect(() => {
    window.localStorage.setItem(JOURNAL_HIDDEN_SLUGS_STORAGE_KEY, JSON.stringify(hiddenJournalSlugs));
  }, [hiddenJournalSlugs]);

  const publishedIdeas = useMemo(() => applyIdeaOverrides(ideaOverrides), [ideaOverrides]);
  const publishedJournalEntries = useMemo(
    () => applyJournalOverrides(journalOverrides),
    [journalOverrides]
  );

  const refreshEngagement = () => {
    const snapshots: EngagementSnapshot[] = [];

    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith("engagement:")) {
        continue;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as {
          vote?: Vote;
        };

        const vote = parsed.vote === "agree" || parsed.vote === "disagree" ? parsed.vote : null;

        snapshots.push({ key, vote });
      } catch {
        continue;
      }
    }

    snapshots.sort((a, b) => a.key.localeCompare(b.key));
    setEngagement(snapshots);
  };

  const metrics = useMemo(() => {
    const uniqueTopics = new Set([
      ...publishedIdeas.map((item) => item.topic),
      ...publishedJournalEntries.map((item) => item.topic),
      ...quickTakes.map((item) => item.topic),
    ]);

    return {
      ideas: publishedIdeas.length,
      journals: publishedJournalEntries.length,
      quickTakes: quickTakes.length,
      topics: uniqueTopics.size,
      drafts: drafts.length,
      agreeVotes: engagement.filter((item) => item.vote === "agree").length,
      disagreeVotes: engagement.filter((item) => item.vote === "disagree").length,
    };
  }, [publishedIdeas, publishedJournalEntries, drafts.length, engagement]);

  const draftStatusCount = useMemo(() => {
    return {
      draft: drafts.filter((item) => item.status === "draft").length,
      review: drafts.filter((item) => item.status === "review").length,
      scheduled: drafts.filter((item) => item.status === "scheduled").length,
      published: drafts.filter((item) => item.status === "published").length,
    };
  }, [drafts]);

  const handleCreateDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedTopic = topic.trim();
    const cleanedNote = note.trim();

    if (!cleanedTitle || !cleanedTopic || !cleanedNote) {
      return;
    }

    setDrafts((prev) => [
      {
        id: Date.now(),
        kind,
        title: cleanedTitle,
        topic: cleanedTopic,
        note: cleanedNote,
        status,
        scheduledFor: status === "scheduled" ? scheduledFor : "",
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);

    setTitle("");
    setTopic("");
    setNote("");
    setStatus("draft");
    setScheduledFor("");
  };

  const handleChangeDraftStatus = (id: number, nextStatus: DraftStatus) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              status: nextStatus,
              scheduledFor: nextStatus === "scheduled" ? draft.scheduledFor : "",
            }
          : draft
      )
    );
  };

  const handleDeleteDraft = (id: number) => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== id));
  };

  const clearEngagementItem = (key: string) => {
    window.localStorage.removeItem(key);
    refreshEngagement();
  };

  const clearAllEngagement = () => {
    for (const item of engagement) {
      window.localStorage.removeItem(item.key);
    }
    refreshEngagement();
  };

  const copyDraftsAsJson = async () => {
    const payload = JSON.stringify(drafts, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopyFeedback("Draft JSON copied.");
    window.setTimeout(() => setCopyFeedback(""), 1400);
  };

  const updateIdeaOverride = <K extends keyof Omit<Idea, "slug">>(
    slug: string,
    field: K,
    value: Idea[K]
  ) => {
    setIdeaOverrides((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] ?? {}),
        [field]: value,
      },
    }));
  };

  const updateJournalOverride = <K extends keyof Omit<JournalEntry, "id" | "slug">>(
    slug: string,
    field: K,
    value: JournalEntry[K]
  ) => {
    setJournalOverrides((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] ?? {}),
        [field]: value,
      },
    }));
  };

  const resetIdeaOverride = (slug: string) => {
    setIdeaOverrides((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setContentFeedback("Idea changes reset.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const resetJournalOverride = (slug: string) => {
    setJournalOverrides((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setContentFeedback("Journal changes reset.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const deleteIdeaEntry = (slug: string) => {
    setHiddenIdeaSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    setIdeaAdditions((prev) => prev.filter((item) => item.slug !== slug));
    setIdeaOverrides((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setContentFeedback("Idea deleted.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const deleteJournalEntry = (slug: string) => {
    setHiddenJournalSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    setJournalAdditions((prev) => prev.filter((item) => item.slug !== slug));
    setJournalOverrides((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setContentFeedback("Brief deleted.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const restoreIdeaEntry = (slug: string) => {
    setHiddenIdeaSlugs((prev) => prev.filter((item) => item !== slug));
    setContentFeedback("Idea restored.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const restoreJournalEntry = (slug: string) => {
    setHiddenJournalSlugs((prev) => prev.filter((item) => item !== slug));
    setContentFeedback("Brief restored.");
    window.setTimeout(() => setContentFeedback(""), 1400);
  };

  const sidebarTabs: { key: AdminTab; label: string; hint: string }[] = [
    { key: "overview", label: "Dashboard", hint: "Metrics and pipeline health" },
    { key: "planner", label: "Planner", hint: "Draft queue and scheduling" },
    { key: "moderation", label: "Moderation", hint: "Vote records review" },
    { key: "content", label: "Content", hint: "Edit published entries" },
    { key: "settings", label: "Settings", hint: "Admin preferences" },
  ];

  const addedIdeaSlugs = useMemo(() => new Set(ideaAdditions.map((item) => item.slug)), [ideaAdditions]);
  const addedJournalSlugs = useMemo(
    () => new Set(journalAdditions.map((item) => item.slug)),
    [journalAdditions]
  );
  const selectedIdeaEntry = useMemo(
    () => publishedIdeas.find((item) => item.slug === selectedIdea?.slug),
    [publishedIdeas, selectedIdea]
  );
  const selectedJournalEntry = useMemo(
    () => publishedJournalEntries.find((item) => item.slug === selectedJournal?.slug),
    [publishedJournalEntries, selectedJournal]
  );
  const filteredContentItems = useMemo(() => {
    const items = [
      ...publishedIdeas.map((item) => ({
        type: "idea" as const,
        slug: item.slug,
        title: item.title,
      })),
      ...publishedJournalEntries.map((item) => ({
        type: "journal" as const,
        slug: item.slug,
        title: item.title,
      })),
    ];

    if (contentFilter === "all") {
      return items;
    }

    return items.filter((item) => item.type === contentFilter);
  }, [publishedIdeas, publishedJournalEntries, contentFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      <div className="mx-auto w-full px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Admin Console</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Manage your editorial flow, audience engagement, and publishing pipeline from one place.
          </p>
        </motion.div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card/85 p-4 shadow-sm lg:sticky lg:top-24">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Panel</p>
            <nav className="mt-3 space-y-2">
              {sidebarTabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted/60"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {tab.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tab.hint}</p>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 rounded-xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Draft Queue</p>
              <p className="mt-1 text-2xl font-semibold">{drafts.length}</p>
            </div>
          </aside>

          <main className="min-w-0">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Ideas" value={metrics.ideas} />
              <MetricCard label="Brief Entries" value={metrics.journals} />
              <MetricCard label="Quick Takes" value={metrics.quickTakes} />
              <MetricCard label="Topics" value={metrics.topics} />
              <MetricCard label="Drafts" value={metrics.drafts} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard label="Agree Votes" value={metrics.agreeVotes} />
              <MetricCard label="Disagree Votes" value={metrics.disagreeVotes} />
              <MetricCard label="Engagement Records" value={engagement.length} />
            </div>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Pipeline Health</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatusPill label="Draft" value={draftStatusCount.draft} />
                <StatusPill label="Review" value={draftStatusCount.review} />
                <StatusPill label="Scheduled" value={draftStatusCount.scheduled} />
                <StatusPill label="Published" value={draftStatusCount.published} />
              </div>
            </section>
          </div>
        )}

        {activeTab === "planner" && (
          <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-semibold">New Draft</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Build and stage content. Drafts persist in local storage.
            </p>

            <form onSubmit={handleCreateDraft} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Type</span>
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value as DraftKind)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="idea">Idea</option>
                    <option value="journal">Brief</option>
                    <option value="quick-take">Quick Take</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as DraftStatus)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter draft title"
                    maxLength={90}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-sm font-medium">Topic</span>
                <input
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Policy, Systems, Strategy..."
                  maxLength={40}
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm font-medium">Draft Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Write your draft outline or first paragraph"
                  maxLength={1000}
                />
              </label>

              {status === "scheduled" && (
                <label className="space-y-1 block">
                  <span className="text-sm font-medium">Scheduled For</span>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(event) => setScheduledFor(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              )}

              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save Draft
              </button>
            </form>

            <div className="mt-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Draft Queue</h3>
                <button
                  type="button"
                  onClick={copyDraftsAsJson}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Export Drafts JSON
                </button>
              </div>
              {copyFeedback && <p className="text-xs text-primary">{copyFeedback}</p>}

              {drafts.length === 0 && (
                <p className="text-sm text-muted-foreground">No drafts yet. Create your first one above.</p>
              )}
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium uppercase tracking-wide text-primary">
                      {draft.kind}
                    </span>
                    <span className="text-muted-foreground">{draft.topic}</span>
                    <span className="text-muted-foreground">{draft.status}</span>
                    {draft.scheduledFor && <span className="text-muted-foreground">{draft.scheduledFor}</span>}
                    <span className="text-muted-foreground">{draft.createdAt}</span>
                  </div>
                  <p className="font-semibold">{draft.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{draft.note}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["draft", "review", "scheduled", "published"] as DraftStatus[]).map((draftStatus) => (
                      <button
                        key={draftStatus}
                        type="button"
                        onClick={() => handleChangeDraftStatus(draft.id, draftStatus)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          draft.status === draftStatus
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {draftStatus}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="rounded-full border border-destructive/30 px-2.5 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "moderation" && (
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold">Engagement Moderation</h2>
                <p className="text-sm text-muted-foreground">
                  Review audience votes captured from Ideas and Quick Takes.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={refreshEngagement}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={clearAllEngagement}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {engagement.length === 0 && (
                <p className="text-sm text-muted-foreground">No engagement records found in local storage.</p>
              )}

              {engagement.map((record) => (
                <div key={record.key} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{record.key.replace("engagement:", "")}</p>
                    <span className="text-xs text-muted-foreground">Vote: {record.vote ?? "none"}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => clearEngagementItem(record.key)}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Remove Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "content" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <h2 className="text-2xl font-semibold">Published Content Editor</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View, edit, and delete content from one list. Use filters to narrow by Opinions or Briefs.
              </p>
              {contentFeedback && <p className="mt-2 text-xs text-primary">{contentFeedback}</p>}
            </section>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Content Titles</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setContentFilter("all")}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      contentFilter === "all"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentFilter("idea")}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      contentFilter === "idea"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Opinions
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentFilter("journal")}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      contentFilter === "journal"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Briefs
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {filteredContentItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No content matches this filter.</p>
                )}

                {filteredContentItems.map((item) => {
                  const isIdea = item.type === "idea";
                  const isCreated = isIdea ? addedIdeaSlugs.has(item.slug) : addedJournalSlugs.has(item.slug);

                  return (
                    <div key={`${item.type}-${item.slug}`} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            {isIdea ? "Opinion" : "Brief"}
                          </span>
                          {isCreated && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              admin created
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isIdea) {
                              setSelectedJournal(null);
                              setSelectedIdea({ slug: item.slug, mode: "view" });
                            } else {
                              setSelectedIdea(null);
                              setSelectedJournal({ slug: item.slug, mode: "view" });
                            }
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isIdea) {
                              setSelectedJournal(null);
                              setSelectedIdea({ slug: item.slug, mode: "edit" });
                            } else {
                              setSelectedIdea(null);
                              setSelectedJournal({ slug: item.slug, mode: "edit" });
                            }
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => (isIdea ? deleteIdeaEntry(item.slug) : deleteJournalEntry(item.slug))}
                          className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedIdeaEntry && (
                <div className="mt-5 rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {selectedIdea?.mode === "edit" ? "Edit Idea" : "View Idea"}: {selectedIdeaEntry.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedIdea(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>

                  {selectedIdea?.mode === "view" ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Slug:</span> /{selectedIdeaEntry.slug}</p>
                      <p><span className="text-muted-foreground">Topic:</span> {selectedIdeaEntry.topic}</p>
                      <p><span className="text-muted-foreground">Date:</span> {selectedIdeaEntry.date}</p>
                      <p><span className="text-muted-foreground">Reading Time:</span> {selectedIdeaEntry.readingTime}</p>
                      <p className="text-muted-foreground">Summary:</p>
                      <p className="rounded-lg bg-muted/40 p-3 text-sm">{selectedIdeaEntry.summary}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
                        <input
                          type="text"
                          value={selectedIdeaEntry.title}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "title", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Topic</span>
                        <input
                          type="text"
                          value={selectedIdeaEntry.topic}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "topic", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</span>
                        <input
                          type="text"
                          value={selectedIdeaEntry.date}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "date", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reading Time</span>
                        <input
                          type="text"
                          value={selectedIdeaEntry.readingTime}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "readingTime", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</span>
                        <textarea
                          value={selectedIdeaEntry.summary}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "summary", event.target.value)}
                          className="min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full Content</span>
                        <textarea
                          value={selectedIdeaEntry.content}
                          onChange={(event) => updateIdeaOverride(selectedIdeaEntry.slug, "content", event.target.value)}
                          className="min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => resetIdeaOverride(selectedIdeaEntry.slug)}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Reset Idea
                    </button>
                  </div>
                </div>
              )}

              {selectedJournalEntry && (
                <div className="mt-5 rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {selectedJournal?.mode === "edit" ? "Edit Brief" : "View Brief"}: {selectedJournalEntry.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedJournal(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>

                  {selectedJournal?.mode === "view" ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Slug:</span> /{selectedJournalEntry.slug}</p>
                      <p><span className="text-muted-foreground">Topic:</span> {selectedJournalEntry.topic}</p>
                      <p><span className="text-muted-foreground">Date:</span> {selectedJournalEntry.date}</p>
                      <p className="text-muted-foreground">Excerpt:</p>
                      <p className="rounded-lg bg-muted/40 p-3 text-sm">{selectedJournalEntry.excerpt}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
                        <input
                          type="text"
                          value={selectedJournalEntry.title}
                          onChange={(event) =>
                            updateJournalOverride(selectedJournalEntry.slug, "title", event.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Topic</span>
                        <input
                          type="text"
                          value={selectedJournalEntry.topic}
                          onChange={(event) =>
                            updateJournalOverride(selectedJournalEntry.slug, "topic", event.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</span>
                        <input
                          type="text"
                          value={selectedJournalEntry.date}
                          onChange={(event) =>
                            updateJournalOverride(selectedJournalEntry.slug, "date", event.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Excerpt</span>
                        <textarea
                          value={selectedJournalEntry.excerpt}
                          onChange={(event) =>
                            updateJournalOverride(selectedJournalEntry.slug, "excerpt", event.target.value)
                          }
                          className="min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full Content</span>
                        <textarea
                          value={selectedJournalEntry.content}
                          onChange={(event) =>
                            updateJournalOverride(selectedJournalEntry.slug, "content", event.target.value)
                          }
                          className="min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => resetJournalOverride(selectedJournalEntry.slug)}
                      className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Reset Brief Entry
                    </button>
                  </div>
                </div>
              )}
            </section>

            {(hiddenIdeaSlugs.length > 0 || hiddenJournalSlugs.length > 0) && (
              <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Restore Deleted Items</h3>
                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Ideas</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hiddenIdeaSlugs.length === 0 && (
                        <p className="text-xs text-muted-foreground">No deleted ideas.</p>
                      )}
                      {hiddenIdeaSlugs.map((slug) => (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => restoreIdeaEntry(slug)}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Restore {slug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Briefs</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hiddenJournalSlugs.length === 0 && (
                        <p className="text-xs text-muted-foreground">No deleted briefs.</p>
                      )}
                      {hiddenJournalSlugs.map((slug) => (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => restoreJournalEntry(slug)}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Restore {slug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Latest Quick Takes</h3>
              <div className="mt-4 space-y-3">
                {quickTakes.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg bg-background p-3">
                    <p className="line-clamp-2 font-medium">{item.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.topic} · {item.date}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "settings" && (
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Admin Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control moderation behavior defaults.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={settings.moderationEnabled}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      moderationEnabled: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Enable Moderation</p>
                  <p className="text-sm text-muted-foreground">Keep moderation controls active in admin.</p>
                </div>
              </label>
            </div>
          </section>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ContentList({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string; detail: string }[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-background p-3">
            <p className="line-clamp-2 font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

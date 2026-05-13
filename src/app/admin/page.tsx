"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownSource } from "@/lib/markdown-normalize";
import { Idea, ideas } from "@/lib/ideas";
import { JournalEntry, journalEntries } from "@/lib/journal-entries";
import type { QuickTake } from "@/lib/quick-takes";
import { looksLikeEmail, toTelHref } from "@/lib/contact-validation";

type AdminTab = "overview" | "planner" | "moderation" | "messages" | "notice" | "content" | "settings";
type DraftKind = "idea" | "journal" | "quick-take";
type DraftStatus = "draft" | "review" | "scheduled" | "published";
type Vote = "agree" | "disagree" | null;

interface Draft {
  id: string;
  kind: DraftKind;
  title: string;
  topic: string;
  note: string;
  status: DraftStatus;
  visibility: string;
  scheduledFor: string;
  createdAt: string;
}

interface EngagementSnapshot {
  key: string;
  vote: Vote;
}

interface AdminSettings {
  moderationEnabled: boolean;
  homeNoticeBubbleEnabled: boolean;
  homeNoticeBubbleMessage: string;
}

interface ReaderMessageRow {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
}

type ContentActionMode = "view" | "edit";
type ContentFilter = "all" | "idea" | "journal";
type NoteViewMode = "write" | "preview";
type NoteFontSize = "sm" | "base" | "lg";
type NoteDensity = "relaxed" | "normal";

type IdeaRow = Idea & { hidden: boolean };
type JournalRow = JournalEntry & { hidden: boolean };
type QuickTakeRow = QuickTake & { hidden: boolean };

const defaultSettings: AdminSettings = {
  moderationEnabled: true,
  homeNoticeBubbleEnabled: false,
  homeNoticeBubbleMessage: "",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [kind, setKind] = useState<DraftKind>("idea");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<DraftStatus>("draft");
  const [visibility, setVisibility] = useState("private");
  const [scheduledFor, setScheduledFor] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [engagement, setEngagement] = useState<EngagementSnapshot[]>([]);
  const [ideaRows, setIdeaRows] = useState<IdeaRow[]>([]);
  const [journalRows, setJournalRows] = useState<JournalRow[]>([]);
  const [quickTakeRows, setQuickTakeRows] = useState<QuickTakeRow[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [readerMessages, setReaderMessages] = useState<ReaderMessageRow[]>([]);
  const [readerMessagesLoading, setReaderMessagesLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [contentFeedback, setContentFeedback] = useState("");
  const [draftFeedback, setDraftFeedback] = useState("");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [selectedIdea, setSelectedIdea] = useState<{ slug: string; mode: ContentActionMode } | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<{ slug: string; mode: ContentActionMode } | null>(null);
  const [noteViewMode, setNoteViewMode] = useState<NoteViewMode>("write");
  const [noteFontSize, setNoteFontSize] = useState<NoteFontSize>("base");
  const [noteDensity, setNoteDensity] = useState<NoteDensity>("normal");
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editDraftTitle, setEditDraftTitle] = useState("");
  const [editDraftTopic, setEditDraftTopic] = useState("");
  const [editDraftNote, setEditDraftNote] = useState("");
  const [editDraftKind, setEditDraftKind] = useState<DraftKind>("idea");
  const [editingQuickTakeId, setEditingQuickTakeId] = useState<number | null>(null);
  const [qtEditContent, setQtEditContent] = useState("");
  const [qtEditTopic, setQtEditTopic] = useState("");
  const [qtEditDate, setQtEditDate] = useState("");

  const adminFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showDraftNotice = (message: string, durationMs = 3200) => {
    setContentFeedback("");
    if (adminFeedbackTimerRef.current) {
      clearTimeout(adminFeedbackTimerRef.current);
    }
    setDraftFeedback(message);
    adminFeedbackTimerRef.current = setTimeout(() => setDraftFeedback(""), durationMs);
  };

  const showContentNotice = (message: string, durationMs = 3200) => {
    setDraftFeedback("");
    if (adminFeedbackTimerRef.current) {
      clearTimeout(adminFeedbackTimerRef.current);
    }
    setContentFeedback(message);
    adminFeedbackTimerRef.current = setTimeout(() => setContentFeedback(""), durationMs);
  };

  const reloadContent = async () => {
    const [ideasResponse, journalResponse, takesResponse] = await Promise.all([
      fetch("/api/content/ideas?includeHidden=true"),
      fetch("/api/content/briefs?includeHidden=true"),
      fetch("/api/content/quick-takes?includeHidden=true"),
    ]);
    if (ideasResponse.ok) {
      setIdeaRows((await ideasResponse.json()) as IdeaRow[]);
    }
    if (journalResponse.ok) {
      setJournalRows((await journalResponse.json()) as JournalRow[]);
    }
    if (takesResponse.ok) {
      setQuickTakeRows((await takesResponse.json()) as QuickTakeRow[]);
    }
  };

  const reloadDrafts = async () => {
    const response = await fetch("/api/content/drafts");
    if (response.ok) {
      setDrafts((await response.json()) as Draft[]);
    }
  };

  const reloadSettings = async () => {
    const response = await fetch("/api/admin/settings");
    if (response.ok) {
      const raw = (await response.json()) as Partial<AdminSettings>;
      setSettings({
        moderationEnabled: raw.moderationEnabled ?? defaultSettings.moderationEnabled,
        homeNoticeBubbleEnabled: raw.homeNoticeBubbleEnabled ?? defaultSettings.homeNoticeBubbleEnabled,
        homeNoticeBubbleMessage: raw.homeNoticeBubbleMessage ?? defaultSettings.homeNoticeBubbleMessage,
      });
    }
  };

  const reloadReaderMessages = useCallback(async () => {
    setReaderMessagesLoading(true);
    try {
      const response = await fetch("/api/admin/reader-messages");
      if (response.ok) {
        const data = (await response.json()) as { messages?: ReaderMessageRow[] };
        setReaderMessages(data.messages ?? []);
      }
    } finally {
      setReaderMessagesLoading(false);
    }
  }, []);

  const deleteReaderMessage = async (id: string) => {
    const response = await fetch(`/api/admin/reader-messages?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await reloadReaderMessages();
      showContentNotice("Message removed.", 2800);
    } else {
      showContentNotice("Could not remove message.", 3500);
    }
  };

  const refreshEngagement = async () => {
    const response = await fetch("/api/content/engagement");
    if (!response.ok) {
      return;
    }
    const rows = (await response.json()) as { key: string; vote: Vote }[];
    const snapshots = rows
      .map((row) => ({ key: row.key, vote: row.vote }))
      .sort((a, b) => a.key.localeCompare(b.key));
    setEngagement(snapshots);
  };

  useEffect(() => {
    // Parallel bootstrap fetch for admin panel (loads persisted server state once on mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState occurs inside fetch helpers after await
    void Promise.all([reloadContent(), reloadDrafts(), refreshEngagement(), reloadSettings()]);
  }, []);

  useEffect(() => {
    if (activeTab !== "messages") {
      return;
    }
    void reloadReaderMessages();
  }, [activeTab, reloadReaderMessages]);

  const publishedIdeas = useMemo(() => ideaRows.filter((item) => !item.hidden), [ideaRows]);
  const publishedJournalEntries = useMemo(
    () => journalRows.filter((item) => !item.hidden),
    [journalRows]
  );

  const metrics = useMemo(() => {
    const visibleQuickTakes = quickTakeRows.filter((item) => !item.hidden);
    const uniqueTopics = new Set([
      ...publishedIdeas.map((item) => item.topic),
      ...publishedJournalEntries.map((item) => item.topic),
      ...visibleQuickTakes.map((item) => item.topic),
    ]);

    return {
      ideas: publishedIdeas.length,
      journals: publishedJournalEntries.length,
      quickTakes: visibleQuickTakes.length,
      topics: uniqueTopics.size,
      drafts: drafts.length,
      agreeVotes: engagement.filter((item) => item.vote === "agree").length,
      disagreeVotes: engagement.filter((item) => item.vote === "disagree").length,
    };
  }, [publishedIdeas, publishedJournalEntries, quickTakeRows, drafts.length, engagement]);

  const draftStatusCount = useMemo(() => {
    return {
      draft: drafts.filter((item) => item.status === "draft").length,
      review: drafts.filter((item) => item.status === "review").length,
      scheduled: drafts.filter((item) => item.status === "scheduled").length,
      published: drafts.filter((item) => item.status === "published").length,
    };
  }, [drafts]);
  const approvalRate = useMemo(() => {
    const totalVotes = metrics.agreeVotes + metrics.disagreeVotes;
    if (totalVotes === 0) {
      return 0;
    }
    return Math.round((metrics.agreeVotes / totalVotes) * 100);
  }, [metrics.agreeVotes, metrics.disagreeVotes]);
  const noteWordCount = useMemo(() => {
    return note.trim() ? note.trim().split(/\s+/).length : 0;
  }, [note]);
  const noteReadingMinutes = useMemo(() => {
    if (!noteWordCount) {
      return 0;
    }
    return Math.max(1, Math.ceil(noteWordCount / 200));
  }, [noteWordCount]);

  const handleCreateDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedTopic = topic.trim();
    const cleanedNote = note.trim();

    if (!cleanedTitle || !cleanedTopic || !cleanedNote) {
      return;
    }

    const response = await fetch("/api/content/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        title: cleanedTitle,
        topic: cleanedTopic,
        note: cleanedNote,
        status,
        visibility,
        scheduledFor: status === "scheduled" ? scheduledFor : "",
      }),
    });
    if (response.ok) {
      await reloadDrafts();
      showDraftNotice("Draft created successfully.", 2800);
    } else {
      console.error("Failed to create draft:", await response.text());
      showDraftNotice("Failed to create draft.", 3200);
    }

    setTitle("");
    setTopic("");
    setNote("");
    setStatus("draft");
    setScheduledFor("");
  };

  const handleChangeDraftStatus = async (id: string, nextStatus: DraftStatus) => {
    const draft = drafts.find((item) => item.id === id);
    const response = await fetch(`/api/content/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        scheduledFor: nextStatus === "scheduled" ? draft?.scheduledFor ?? "" : "",
      }),
    });
    if (response.ok) {
      await reloadDrafts();
      showDraftNotice(`Draft status set to ${nextStatus}.`, 2800);
    } else {
      showDraftNotice("Could not update draft status.", 3200);
    }
  };

  const handlePublishDraft = async (id: string) => {
    const response = await fetch(`/api/content/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: id }),
    });
    if (response.ok) {
      await reloadDrafts();
      await reloadContent();
      showDraftNotice("Draft published successfully.", 3800);
    } else {
      const err = await response.text().catch(() => "");
      console.error("Failed to publish draft:", err);
      showDraftNotice("Failed to publish draft. Check the console or try again.", 4500);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    const response = await fetch(`/api/content/drafts/${id}`, { method: "DELETE" });
    if (response.ok) {
      await reloadDrafts();
      if (editingDraftId === id) {
        setEditingDraftId(null);
      }
      showDraftNotice("Draft removed.", 2800);
    } else {
      showDraftNotice("Could not remove draft.", 3200);
    }
  };

  const toggleDraftVisibility = async (id: string, current: string) => {
    const nextVis = current === "public" ? "private" : "public";
    const response = await fetch(`/api/content/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: nextVis }),
    });
    if (response.ok) {
      await reloadDrafts();
      showDraftNotice(
        nextVis === "public"
          ? "Draft is public — it appears on Ideas with a draft stamp."
          : "Draft is private — link-only via admin.",
        3200
      );
    } else {
      showDraftNotice("Could not update draft visibility.", 3500);
    }
  };

  const openDraftEditor = (draft: Draft) => {
    setEditingDraftId(draft.id);
    setEditDraftTitle(draft.title);
    setEditDraftTopic(draft.topic);
    setEditDraftNote(draft.note);
    setEditDraftKind(draft.kind);
  };

  const cancelDraftEditor = () => {
    setEditingDraftId(null);
  };

  const saveEditedDraft = async () => {
    if (!editingDraftId) {
      return;
    }
    const response = await fetch(`/api/content/drafts/${editingDraftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editDraftTitle.trim(),
        topic: editDraftTopic.trim(),
        note: editDraftNote.trim(),
        kind: editDraftKind,
      }),
    });
    if (response.ok) {
      await reloadDrafts();
      showDraftNotice("Draft updated successfully.", 3200);
      setEditingDraftId(null);
    } else {
      showDraftNotice("Could not update draft.", 3500);
    }
  };

  const openQuickTakeEditor = (item: QuickTakeRow) => {
    setEditingQuickTakeId(item.id);
    setQtEditContent(item.content);
    setQtEditTopic(item.topic);
    setQtEditDate(item.date);
  };

  const cancelQuickTakeEditor = () => {
    setEditingQuickTakeId(null);
  };

  const saveQuickTakeEdits = async () => {
    if (editingQuickTakeId === null) {
      return;
    }
    const response = await fetch(`/api/content/quick-takes/${editingQuickTakeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: qtEditContent.trim(),
        topic: qtEditTopic.trim(),
        date: qtEditDate.trim(),
      }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Quick take saved successfully.", 3200);
      setEditingQuickTakeId(null);
    } else {
      showContentNotice("Could not save quick take.", 3500);
    }
  };

  const clearEngagementItem = async (key: string) => {
    const itemKey = key.replace(/^engagement:/, "");
    await fetch(`/api/content/engagement?itemKey=${encodeURIComponent(itemKey)}`, { method: "DELETE" });
    await refreshEngagement();
  };

  const clearAllEngagement = async () => {
    await fetch("/api/content/engagement?all=1", { method: "DELETE" });
    await refreshEngagement();
  };

  const copyDraftsAsJson = async () => {
    const payload = JSON.stringify(drafts, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopyFeedback("Draft JSON copied.");
    window.setTimeout(() => setCopyFeedback(""), 1400);
  };
  const applyNoteFormat = (
    mode: "wrap" | "prefix" | "template",
    payload: { before?: string; after?: string; prefix?: string; template?: string }
  ) => {
    const textarea = noteInputRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = note.slice(start, end);
    let nextNote = note;
    let nextCursor = end;

    if (mode === "wrap") {
      const before = payload.before ?? "";
      const after = payload.after ?? "";
      nextNote = `${note.slice(0, start)}${before}${selected}${after}${note.slice(end)}`;
      nextCursor = start + before.length + selected.length + after.length;
    }

    if (mode === "prefix") {
      const prefix = payload.prefix ?? "";
      const fallback = " ";
      nextNote = `${note.slice(0, start)}${prefix}${selected || fallback}${note.slice(end)}`;
      nextCursor = start + prefix.length + (selected || fallback).length;
    }

    if (mode === "template") {
      const template = payload.template ?? "";
      nextNote = `${note}${note ? "\n\n" : ""}${template}`;
      nextCursor = nextNote.length;
    }

    setNote(nextNote);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const updateIdeaOverride = <K extends keyof Omit<Idea, "slug">>(
    slug: string,
    field: K,
    value: Idea[K]
  ) => {
    setIdeaRows((prev) =>
      prev.map((row) => (row.slug === slug ? { ...row, [field]: value } : row))
    );
    const payload: Record<string, unknown> = {};
    if (field === "date") {
      payload.date = String(value);
    } else if (field === "showAsDraft") {
      payload.showAsDraft = Boolean(value);
    } else {
      payload[field as string] = String(value);
    }
    void fetch(`/api/content/ideas/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (!response.ok) {
        void reloadContent();
      }
    });
  };

  const updateJournalOverride = <K extends keyof Omit<JournalEntry, "id" | "slug">>(
    slug: string,
    field: K,
    value: JournalEntry[K]
  ) => {
    setJournalRows((prev) =>
      prev.map((row) => (row.slug === slug ? { ...row, [field]: value } : row))
    );
    const payload: Record<string, string> = {};
    if (field === "date") {
      payload.date = String(value);
    } else {
      payload[field as string] = String(value);
    }
    void fetch(`/api/content/briefs/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (!response.ok) {
        void reloadContent();
      }
    });
  };

  const deleteIdeaEntry = async (slug: string) => {
    const response = await fetch(`/api/content/ideas/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: true }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Idea is now private — hidden from the public site.", 3200);
    } else {
      showContentNotice("Could not make idea private.", 3500);
    }
  };

  const deleteJournalEntry = async (slug: string) => {
    const response = await fetch(`/api/content/briefs/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: true }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Brief is now private — hidden from the public site.", 3200);
    } else {
      showContentNotice("Could not make brief private.", 3500);
    }
  };

  const restoreIdeaEntry = async (slug: string) => {
    const response = await fetch(`/api/content/ideas/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: false }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Idea is now public on the site.", 3200);
    } else {
      showContentNotice("Could not make idea public.", 3500);
    }
  };

  const restoreJournalEntry = async (slug: string) => {
    const response = await fetch(`/api/content/briefs/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: false }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Brief is now public on the site.", 3200);
    } else {
      showContentNotice("Could not make brief public.", 3500);
    }
  };

  const permanentlyDeleteIdea = async (slug: string) => {
    if (!window.confirm(`Permanently delete this idea? This cannot be undone.`)) return;
    const response = await fetch(`/api/content/ideas/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Idea permanently deleted.", 3200);
    } else {
      showContentNotice("Could not delete idea.", 3500);
    }
  };

  const permanentlyDeleteJournal = async (slug: string) => {
    if (!window.confirm(`Permanently delete this brief? This cannot be undone.`)) return;
    const response = await fetch(`/api/content/briefs/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Brief permanently deleted.", 3200);
    } else {
      showContentNotice("Could not delete brief.", 3500);
    }
  };

  const permanentlyDeleteQuickTake = async (id: number) => {
    if (!window.confirm(`Permanently delete this quick take? This cannot be undone.`)) return;
    const response = await fetch(`/api/content/quick-takes/${id}`, { method: "DELETE" });
    if (response.ok) {
      await reloadContent();
      showContentNotice("Quick take permanently deleted.", 3200);
    } else {
      showContentNotice("Could not delete quick take.", 3500);
    }
  };

  const toggleQuickTakeVisibility = async (id: number, makeHidden: boolean) => {
    const response = await fetch(`/api/content/quick-takes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: makeHidden }),
    });
    if (response.ok) {
      await reloadContent();
      showContentNotice(
        makeHidden ? "Quick take is now private." : "Quick take is now public on the site.",
        3200
      );
    } else {
      showContentNotice("Could not update quick take visibility.", 3500);
    }
  };

  const sidebarTabs: { key: AdminTab; label: string; hint: string }[] = [
    { key: "overview", label: "Dashboard", hint: "Metrics and pipeline health" },
    { key: "planner", label: "Planner", hint: "Create and schedule drafts" },
    { key: "moderation", label: "Moderation", hint: "Vote records review" },
    { key: "messages", label: "Messages", hint: "Reader contact form inbox" },
    {
      key: "notice",
      label: "Home notice",
      hint: "Floating circle + global message on the home page only",
    },
    { key: "content", label: "Content", hint: "Edit published entries" },
    { key: "settings", label: "Settings", hint: "Admin preferences and defaults" },
  ];

  const seedIdeaSlugs = useMemo(() => new Set(ideas.map((item) => item.slug)), []);
  const seedJournalSlugs = useMemo(() => new Set(journalEntries.map((item) => item.slug)), []);
  const addedIdeaSlugs = useMemo(
    () => new Set(ideaRows.filter((item) => !seedIdeaSlugs.has(item.slug)).map((item) => item.slug)),
    [ideaRows, seedIdeaSlugs]
  );
  const addedJournalSlugs = useMemo(
    () => new Set(journalRows.filter((item) => !seedJournalSlugs.has(item.slug)).map((item) => item.slug)),
    [journalRows, seedJournalSlugs]
  );
  const selectedIdeaEntry = useMemo(
    () => ideaRows.find((item) => item.slug === selectedIdea?.slug),
    [ideaRows, selectedIdea]
  );
  const selectedJournalEntry = useMemo(
    () => journalRows.find((item) => item.slug === selectedJournal?.slug),
    [journalRows, selectedJournal]
  );
  const filteredContentItems = useMemo(() => {
    const items = [
      ...ideaRows.map((item) => ({
        type: "idea" as const,
        slug: item.slug,
        title: item.title,
        hidden: item.hidden,
        showAsDraft: item.showAsDraft === true,
      })),
      ...journalRows.map((item) => ({
        type: "journal" as const,
        slug: item.slug,
        title: item.title,
        hidden: item.hidden,
      })),
    ];

    if (contentFilter === "all") {
      return items;
    }

    return items.filter((item) => item.type === contentFilter);
  }, [ideaRows, journalRows, contentFilter]);

  const currentTab = sidebarTabs.find((tab) => tab.key === activeTab);
  const adminNoticeText = contentFeedback || draftFeedback;
  const adminNoticeIsError = /^(Failed|Could not)/i.test(adminNoticeText.trim());

  return (
    <div className="min-h-screen bg-muted/35 text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-w-0"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">The Doctrine</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Studio</h1>
            <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
              Drafts, publishing, and edits. Use <strong className="font-medium text-foreground">Home notice</strong> for the
              floating circle on the home page. Set ideas &amp; briefs <strong className="font-medium text-foreground">Public</strong>{" "}
              or <strong className="font-medium text-foreground">Private</strong> under Content.
            </p>
          </motion.div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Admin sections">
            {sidebarTabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  title={tab.hint}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-foreground text-background shadow-md"
                      : "bg-background text-muted-foreground shadow-sm ring-1 ring-border hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        {adminNoticeText ? (
          <div
            role="status"
            aria-live="polite"
            className={`border-t px-4 py-2.5 text-center text-sm font-medium lg:px-6 ${
              adminNoticeIsError
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-emerald-600/25 bg-emerald-500/10 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-50"
            }`}
          >
            {adminNoticeText}
          </div>
        ) : null}
        <div className="border-t border-border bg-muted/40 px-4 py-2.5 lg:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>
              Active: <strong className="font-semibold text-foreground">{currentTab?.label ?? "—"}</strong>
            </span>
            <span className="hidden text-border sm:inline">|</span>
            <span>
              Queue <strong className="text-foreground">{drafts.length}</strong>
            </span>
            <span>
              Ideas <strong className="text-foreground">{metrics.ideas}</strong>
            </span>
            <span>
              Briefs <strong className="text-foreground">{metrics.journals}</strong>
            </span>
            <span>
              Quick takes <strong className="text-foreground">{metrics.quickTakes}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <main className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-md sm:p-8">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-background to-background p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Executive Snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold">Publishing Performance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have {drafts.length} drafts in queue and an approval rate of {approvalRate}% across recorded votes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("planner")}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Create Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Manage Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("notice")}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Home notice
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Ideas" value={metrics.ideas} />
              <MetricCard label="Brief Entries" value={metrics.journals} />
              <MetricCard label="Quick Takes" value={metrics.quickTakes} />
              <MetricCard label="Topics" value={metrics.topics} />
            </div>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">Floating circle on home</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Global message readers see when they tap the round icon —{" "}
                    <strong className="font-medium text-foreground">only on the home page</strong>. Configure under the{" "}
                    <strong className="font-medium text-foreground">Home notice</strong> tab.
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Current status:</span>{" "}
                    <span className="font-medium text-foreground">
                      {settings.homeNoticeBubbleEnabled && settings.homeNoticeBubbleMessage.trim().length > 0
                        ? "On (shown when Home loads)"
                        : "Off — enable the toggle and save a message to show it"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("notice")}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Open Home notice
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard label="Agree Votes" value={metrics.agreeVotes} />
              <MetricCard label="Disagree Votes" value={metrics.disagreeVotes} />
              <MetricCard label="Engagement Records" value={engagement.length} />
            </div>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Content Overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">A snapshot of all published and tracked content.</p>
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,300px]">
              <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm sm:p-6">
                <h2 className="text-2xl font-semibold">Create New Draft</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stage ideas, briefs, and quick takes before publishing. Drafts are stored in your database; set visibility
                  to public when you want them listed on Ideas with a clear draft stamp.
                </p>

                <form onSubmit={(event) => void handleCreateDraft(event)} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <label className="space-y-1">
                      <span className="text-sm font-medium">Type</span>
                      <select
                        value={kind}
                        onChange={(event) => setKind(event.target.value as DraftKind)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-medium">Visibility</span>
                      <button
                        type="button"
                        onClick={() => setVisibility(visibility === "private" ? "public" : "private")}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {visibility === "private" ? "Private" : "Public"}
                      </button>
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-medium">Title</span>
                      <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Policy, Systems, Strategy..."
                      maxLength={40}
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">Draft Note</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setNoteViewMode("write")}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            noteViewMode === "write"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteViewMode("preview")}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            noteViewMode === "preview"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applyNoteFormat("wrap", { before: "**", after: "**" })}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => applyNoteFormat("wrap", { before: "_", after: "_" })}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Italic
                        </button>
                        <button
                          type="button"
                          onClick={() => applyNoteFormat("prefix", { prefix: "## " })}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Heading
                        </button>
                        <button
                          type="button"
                          onClick={() => applyNoteFormat("prefix", { prefix: "> " })}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => applyNoteFormat("prefix", { prefix: "- " })}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Bullet
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            applyNoteFormat("template", {
                              template:
                                "### Agenda\n\n- **Personality politics**\n- **Long-term development**\n- **Clan issues**",
                            })
                          }
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Insert agenda
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            applyNoteFormat("template", {
                              template: "### Key points\n- Insight\n- Risk\n- Action",
                            })
                          }
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Insert Outline
                        </button>
                      </div>

                      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="text-xs text-muted-foreground">
                          Font Size
                          <select
                            value={noteFontSize}
                            onChange={(event) => setNoteFontSize(event.target.value as NoteFontSize)}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="sm">Compact</option>
                            <option value="base">Comfort</option>
                            <option value="lg">Large</option>
                          </select>
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Line Spacing
                          <select
                            value={noteDensity}
                            onChange={(event) => setNoteDensity(event.target.value as NoteDensity)}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="normal">Normal</option>
                            <option value="relaxed">Relaxed</option>
                          </select>
                        </label>
                      </div>

                      <p className="mb-2 text-xs text-muted-foreground">
                        Lists: put the heading on its own line, then a blank line, then each point on its own line
                        starting with <code className="rounded bg-muted px-1">- </code> (dash and space). Use{" "}
                        <span className="font-medium text-foreground">Insert agenda</span> for a ready-made block.
                        Preview uses the same cleanup as the live site (line endings from Word/email are fixed).
                      </p>
                      {noteViewMode === "write" ? (
                        <textarea
                          ref={noteInputRef}
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          className={`min-h-40 w-full rounded-xl border border-border bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                            noteFontSize === "sm"
                              ? "text-sm"
                              : noteFontSize === "lg"
                                ? "text-lg"
                                : "text-base"
                          } ${noteDensity === "relaxed" ? "leading-relaxed" : "leading-normal"}`}
                          placeholder="Write your draft outline, argument flow, and supporting points..."
                          maxLength={20000}
                        />
                      ) : (
                        <div
                          className={`min-h-40 rounded-xl border border-border bg-muted/30 px-4 py-3 ${
                            noteFontSize === "sm"
                              ? "text-sm"
                              : noteFontSize === "lg"
                                ? "text-lg"
                                : "text-base"
                          } ${noteDensity === "relaxed" ? "leading-relaxed" : "leading-normal"} prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {note.trim() ? normalizeMarkdownSource(note) : "*Preview will appear here as you write your note.*"}
                          </ReactMarkdown>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <p>
                          {noteWordCount} words · {note.length}/20000 chars
                        </p>
                        <p>Estimated reading time: {noteReadingMinutes} min</p>
                      </div>
                    </div>
                  </div>

                  {status === "scheduled" && (
                    <label className="space-y-1 block">
                      <span className="text-sm font-medium">Scheduled For</span>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(event) => setScheduledFor(event.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  )}

                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Save Draft
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Editorial checklist</h3>
                <p className="mt-1 text-sm text-muted-foreground">Ship clearer drafts with less rework.</p>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Open with the tension: what changed, who it affects, and why it matters now.</li>
                  <li>Split MDX pages with a line that contains only three hyphens (---) when the narrative shifts.</li>
                  <li>Toggle Preview to catch headings and lists before going public.</li>
                  <li>Keep titles under ~80 characters; promote to Review when the thesis is stable.</li>
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatusPill label="Draft" value={draftStatusCount.draft} />
                  <StatusPill label="Review" value={draftStatusCount.review} />
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">Draft queue</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Grouped by workflow stage. Public drafts appear on Ideas; readers see a draft stamp on the full page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyDraftsAsJson}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Export Drafts JSON
                </button>
              </div>
              {copyFeedback && <p className="text-xs text-primary">{copyFeedback}</p>}

              {editingDraftId && (
                <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Edit draft</p>
                    <button
                      type="button"
                      onClick={cancelDraftEditor}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground">Title</span>
                      <input
                        type="text"
                        value={editDraftTitle}
                        onChange={(e) => setEditDraftTitle(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        maxLength={90}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Topic</span>
                      <input
                        type="text"
                        value={editDraftTopic}
                        onChange={(e) => setEditDraftTopic(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        maxLength={40}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Type</span>
                      <select
                        value={editDraftKind}
                        onChange={(e) => setEditDraftKind(e.target.value as DraftKind)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="idea">Idea</option>
                        <option value="journal">Brief</option>
                        <option value="quick-take">Quick Take</option>
                      </select>
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground">Body (MDX-friendly)</span>
                      <textarea
                        value={editDraftNote}
                        onChange={(e) => setEditDraftNote(e.target.value)}
                        className="min-h-36 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        maxLength={20000}
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void saveEditedDraft()}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}

              {drafts.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No drafts yet. Create your first one above.</p>
              )}

              <div className="mt-5 space-y-8">
                {(["draft", "review", "scheduled", "published"] as DraftStatus[]).map((stage) => {
                  const bucket = drafts.filter((d) => d.status === stage);
                  if (bucket.length === 0) {
                    return null;
                  }
                  return (
                    <div key={stage}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{bucket.length}</span>
                      </div>
                      <div className="space-y-3">
                        {bucket.map((draft) => (
                          <div
                            key={draft.id}
                            className="rounded-xl border border-border bg-gradient-to-b from-background to-background/70 p-4 shadow-sm"
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium uppercase tracking-wide text-primary">
                                {draft.kind}
                              </span>
                              <span className="text-muted-foreground">{draft.topic}</span>
                              <button
                                type="button"
                                onClick={() => void toggleDraftVisibility(draft.id, draft.visibility)}
                                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                                  draft.visibility === "public"
                                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {draft.visibility === "public" ? "Public" : "Private"}
                              </button>
                              {draft.scheduledFor && (
                                <span className="text-muted-foreground">{draft.scheduledFor}</span>
                              )}
                              <span className="text-muted-foreground">{draft.createdAt}</span>
                            </div>
                            <p className="font-semibold">{draft.title}</p>
                            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{draft.note}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openDraftEditor(draft)}
                                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Edit content
                              </button>
                              {(["draft", "review", "scheduled", "published"] as DraftStatus[]).map((draftStatus) => (
                                <button
                                  key={draftStatus}
                                  type="button"
                                  onClick={() => void handleChangeDraftStatus(draft.id, draftStatus)}
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
                                onClick={() => void handleDeleteDraft(draft.id)}
                                className="rounded-full border border-destructive/30 px-2.5 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => void handlePublishDraft(draft.id)}
                                className="rounded-full border border-green-500/30 px-2.5 py-1 text-xs text-green-500 transition-colors hover:bg-green-500/10"
                              >
                                Publish
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
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
                  onClick={() => void refreshEngagement()}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void clearAllEngagement()}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {engagement.length === 0 && (
                <p className="text-sm text-muted-foreground">No engagement records found in the database.</p>
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
                      onClick={() => void clearEngagementItem(record.key)}
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
                Every idea and brief is listed below — including <strong className="font-medium text-foreground">private</strong>{" "}
                ones. Use <strong className="font-medium text-foreground">Make private</strong> to hide from the public site, or{" "}
                <strong className="font-medium text-foreground">Make public</strong> to show again anytime. Edits sync as you type;
                use Save changes for the full document.
              </p>
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
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.hidden
                                ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                                : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                            }`}
                          >
                            {item.hidden ? "Private" : "Public"}
                          </span>
                          {isCreated && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              admin created
                            </span>
                          )}
                          {isIdea && item.showAsDraft ? (
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                              draft on site
                            </span>
                          ) : null}
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
                        {item.hidden ? (
                          <button
                            type="button"
                            onClick={() =>
                              void (isIdea ? restoreIdeaEntry(item.slug) : restoreJournalEntry(item.slug))
                            }
                            className="rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
                          >
                            Make public
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void (isIdea ? deleteIdeaEntry(item.slug) : deleteJournalEntry(item.slug))
                            }
                            className="rounded-lg border border-amber-600/40 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-500/10 dark:text-amber-200"
                          >
                            Make private
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            void (isIdea
                              ? permanentlyDeleteIdea(item.slug)
                              : permanentlyDeleteJournal(item.slug))
                          }
                          className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
                      <p>
                        <span className="text-muted-foreground">Draft stamp on public site:</span>{" "}
                        {selectedIdeaEntry.showAsDraft ? (
                          <span className="font-medium text-amber-700 dark:text-amber-300">On — use Edit to turn off</span>
                        ) : (
                          <span className="text-muted-foreground">Off</span>
                        )}
                      </p>
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
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 md:col-span-2 dark:border-amber-500/25 dark:bg-amber-500/10">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-border"
                          checked={selectedIdeaEntry.showAsDraft === true}
                          onChange={(event) =>
                            updateIdeaOverride(selectedIdeaEntry.slug, "showAsDraft", event.target.checked)
                          }
                        />
                        <span className="text-sm leading-snug">
                          <span className="font-medium text-foreground">Show as draft on the public site</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Puts the draft stamp on the Ideas grid, Latest on home, and the watermark on the idea page
                            until you uncheck this.
                          </span>
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    {selectedIdea?.mode === "edit" && selectedIdeaEntry && (
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        onClick={async () => {
                          const row = selectedIdeaEntry;
                          const response = await fetch(`/api/content/ideas/${encodeURIComponent(selectedIdea.slug)}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: row.title,
                              summary: row.summary,
                              readingTime: row.readingTime,
                              date: row.date,
                              topic: row.topic,
                              content: row.content,
                              showAsDraft: row.showAsDraft === true,
                            }),
                          });
                          if (response.ok) {
                            showContentNotice("Opinion saved successfully.", 3500);
                            setSelectedIdea(null);
                            await reloadContent();
                          } else {
                            showContentNotice("Could not save opinion.", 4000);
                          }
                        }}
                      >
                        Save changes
                      </button>
                    )}
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

                  <div className="mt-3 flex justify-end gap-2">
                    {selectedJournal?.mode === "edit" && selectedJournalEntry && (
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        onClick={async () => {
                          const row = selectedJournalEntry;
                          const response = await fetch(`/api/content/briefs/${encodeURIComponent(selectedJournal.slug)}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: row.title,
                              date: row.date,
                              topic: row.topic,
                              excerpt: row.excerpt,
                              content: row.content,
                            }),
                          });
                          if (response.ok) {
                            showContentNotice("Brief saved successfully.", 3500);
                            setSelectedJournal(null);
                            await reloadContent();
                          } else {
                            showContentNotice("Could not save brief.", 4000);
                          }
                        }}
                      >
                        Save changes
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Quick takes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Listed below whether public or private. Use <strong className="font-medium text-foreground">Make private</strong>{" "}
                / <strong className="font-medium text-foreground">Make public</strong> anytime. Edit copy, topic, or date from{" "}
                <strong className="font-medium text-foreground">Edit</strong>.
              </p>

              {editingQuickTakeId !== null && (
                <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Edit quick take #{editingQuickTakeId}</p>
                    <button
                      type="button"
                      onClick={cancelQuickTakeEditor}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Content</span>
                    <textarea
                      value={qtEditContent}
                      onChange={(e) => setQtEditContent(e.target.value)}
                      className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Topic</span>
                      <input
                        type="text"
                        value={qtEditTopic}
                        onChange={(e) => setQtEditTopic(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Date label</span>
                      <input
                        type="text"
                        value={qtEditDate}
                        onChange={(e) => setQtEditDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void saveQuickTakeEdits()}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Save quick take
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {quickTakeRows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No quick takes yet.</p>
                )}
                {quickTakeRows.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            item.hidden
                              ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                              : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                          }`}
                        >
                          {item.hidden ? "Private" : "Public"}
                        </span>
                      </div>
                      <p className="mt-1 font-medium">{item.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.topic} · {item.date}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openQuickTakeEditor(item)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </button>
                      {item.hidden ? (
                        <button
                          type="button"
                          onClick={() => void toggleQuickTakeVisibility(item.id, false)}
                          className="rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          Make public
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleQuickTakeVisibility(item.id, true)}
                          className="rounded-lg border border-amber-600/40 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                        >
                          Make private
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void permanentlyDeleteQuickTake(item.id)}
                        className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "messages" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Reader messages</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submissions from the public <strong className="font-medium text-foreground">/contact</strong> form (latest 200).
                </p>
              </div>
              <button
                type="button"
                onClick={() => void reloadReaderMessages()}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Refresh
              </button>
            </div>

            {readerMessagesLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : readerMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-4">
                {readerMessages.map((m) => (
                  <article key={m.id} className="rounded-xl border border-border bg-card/85 p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{m.name}</p>
                        {looksLikeEmail(m.email) ? (
                          <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline">
                            {m.email}
                          </a>
                        ) : toTelHref(m.email) ? (
                          <a href={`tel:${toTelHref(m.email)}`} className="text-sm text-primary hover:underline">
                            {m.email}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">{m.email}</span>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <time className="text-xs text-muted-foreground" dateTime={m.createdAt}>
                          {new Date(m.createdAt).toLocaleString()}
                        </time>
                        <button
                          type="button"
                          onClick={() => void deleteReaderMessage(m.id)}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "notice" && (
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">Home notice — floating circle</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This controls the <strong className="font-medium text-foreground">round message button</strong> on the{" "}
              <strong className="font-medium text-foreground">home page only</strong> (not Briefs/Ideas). Turn it off anytime;
              readers can dismiss it for their tab with “Don&apos;t show again this visit”.
            </p>

            <label className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-background p-4">
              <input
                type="checkbox"
                checked={settings.homeNoticeBubbleEnabled}
                onChange={(event) => {
                  const next = event.target.checked;
                  setSettings((prev) => ({
                    ...prev,
                    homeNoticeBubbleEnabled: next,
                  }));
                  void fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ homeNoticeBubbleEnabled: next }),
                  }).then(async (res) => {
                    if (res.ok) {
                      const raw = (await res.json()) as Partial<AdminSettings>;
                      setSettings((prev) => ({
                        ...prev,
                        moderationEnabled: raw.moderationEnabled ?? prev.moderationEnabled,
                        homeNoticeBubbleEnabled: raw.homeNoticeBubbleEnabled ?? prev.homeNoticeBubbleEnabled,
                        homeNoticeBubbleMessage: raw.homeNoticeBubbleMessage ?? prev.homeNoticeBubbleMessage,
                      }));
                      showContentNotice("Home notice preference saved.", 3200);
                    } else {
                      showContentNotice("Could not save home notice preference.", 3500);
                    }
                  });
                }}
                className="mt-1"
              />
              <div>
                <p className="font-medium">Show floating notice on home</p>
                <p className="text-sm text-muted-foreground">
                  Requires a non-empty message below. Uncheck to hide the bubble completely.
                </p>
              </div>
            </label>

            <div className="mt-5 space-y-2">
              <label htmlFor="home-notice-message" className="text-sm font-medium">
                Message to readers
              </label>
              <textarea
                id="home-notice-message"
                value={settings.homeNoticeBubbleMessage}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    homeNoticeBubbleMessage: event.target.value,
                  }))
                }
                rows={6}
                maxLength={2000}
                placeholder="Write what you want visitors to see when they tap the circle…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const msg = settings.homeNoticeBubbleMessage;
                    void fetch("/api/admin/settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ homeNoticeBubbleMessage: msg }),
                    }).then(async (res) => {
                      if (res.ok) {
                        const raw = (await res.json()) as Partial<AdminSettings>;
                        setSettings((prev) => ({
                          ...prev,
                          moderationEnabled: raw.moderationEnabled ?? prev.moderationEnabled,
                          homeNoticeBubbleEnabled: raw.homeNoticeBubbleEnabled ?? prev.homeNoticeBubbleEnabled,
                          homeNoticeBubbleMessage: raw.homeNoticeBubbleMessage ?? prev.homeNoticeBubbleMessage,
                        }));
                        showContentNotice("Home notice message saved successfully.", 3200);
                      } else {
                        showContentNotice("Could not save home notice message.", 3500);
                      }
                    });
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Save message
                </button>
                <span className="text-xs text-muted-foreground">{settings.homeNoticeBubbleMessage.length}/2000</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Admin Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">Control moderation behavior defaults.</p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <input
                  type="checkbox"
                  checked={settings.moderationEnabled}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setSettings((prev) => ({
                      ...prev,
                      moderationEnabled: next,
                    }));
                    void fetch("/api/admin/settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ moderationEnabled: next }),
                    }).then(async (res) => {
                      if (res.ok) {
                        const raw = (await res.json()) as Partial<AdminSettings>;
                        setSettings((prev) => ({
                          ...prev,
                          moderationEnabled: raw.moderationEnabled ?? prev.moderationEnabled,
                          homeNoticeBubbleEnabled: raw.homeNoticeBubbleEnabled ?? prev.homeNoticeBubbleEnabled,
                          homeNoticeBubbleMessage: raw.homeNoticeBubbleMessage ?? prev.homeNoticeBubbleMessage,
                        }));
                        showContentNotice("Moderation setting saved successfully.", 3200);
                      } else {
                        showContentNotice("Could not save moderation setting.", 3500);
                      }
                    });
                  }}
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
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-sm ring-1 ring-border/50">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 tabular-nums text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 tabular-nums text-2xl font-bold">{value}</p>
    </div>
  );
}

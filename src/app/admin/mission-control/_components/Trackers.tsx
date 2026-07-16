"use client";

import { useMemo, useState } from "react";
import {
  btnGhost,
  btnPrimary,
  EmptyState,
  Field,
  inputClass,
  ProgressBar,
  SectionHeader,
  StatCard,
  useCollection,
} from "./shared";

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  span?: 1 | 2;
};

function CrudSection({
  collection,
  title,
  subtitle,
  fields,
  titleKey = "title",
  stats,
}: {
  collection: string;
  title: string;
  subtitle: string;
  fields: FieldDef[];
  titleKey?: string;
  stats?: (items: Record<string, unknown>[]) => { label: string; value: string | number }[];
}) {
  const { items, loading, q, setQ, create, update, remove, reload } = useCollection<Record<string, unknown> & { id: string }>(collection);
  const empty = useMemo(() => {
    const o: Record<string, string | number> = {};
    for (const f of fields) o[f.key] = f.type === "number" ? 0 : "";
    return o;
  }, [fields]);
  const [form, setForm] = useState<Record<string, string | number>>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const derivedStats = stats?.(items) ?? [];

  return (
    <div>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void reload()}
            placeholder="Search…"
            className={`${inputClass} w-48`}
          />
        }
      />

      {derivedStats.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {derivedStats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      <form
        className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const titleVal = String(form[titleKey] ?? "").trim();
          if (!titleVal && titleKey) return;
          if (editing) {
            await update(editing, form);
            setEditing(null);
          } else {
            await create(form);
          }
          setForm(empty);
        }}
      >
        {fields.map((f) => (
          <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : undefined}>
            <Field label={f.label}>
              {f.type === "textarea" ? (
                <textarea
                  className={inputClass}
                  rows={3}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select className={inputClass} value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)}>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  className={inputClass}
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  required={f.key === titleKey}
                />
              )}
            </Field>
          </div>
        ))}
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className={btnPrimary}>
            {editing ? "Update" : "Add"}
          </button>
          {editing ? (
            <button type="button" className={btnGhost} onClick={() => { setEditing(null); setForm(empty); }}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} body="Add your first entry above." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white">{String(item[titleKey] ?? item.name ?? item.country ?? "Untitled")}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {String(item.status ?? item.category ?? item.type ?? "")}
                    {typeof item.progress === "number" ? ` · ${item.progress}%` : ""}
                    {typeof item.wordCount === "number" ? ` · ${item.wordCount} words` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditing(item.id);
                      const next: Record<string, string | number> = { ...empty };
                      for (const f of fields) {
                        const v = item[f.key];
                        if (f.type === "date" && v) next[f.key] = String(v).slice(0, 10);
                        else if (f.key === "tags" && Array.isArray(v)) next[f.key] = v.join(", ");
                        else if (v != null) next[f.key] = v as string | number;
                      }
                      setForm(next);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={btnGhost} onClick={() => void remove(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {typeof item.progress === "number" ? (
                <div className="mt-3">
                  <ProgressBar value={item.progress as number} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReadingSection() {
  return (
    <CrudSection
      collection="reading"
      title="Reading Tracker"
      subtitle="Books, constitutions, reports, and research."
      titleKey="title"
      stats={(items) => {
        const month = new Date().toISOString().slice(0, 7);
        const year = String(new Date().getFullYear());
        const completed = items.filter((i) => i.status === "completed");
        const thisMonth = completed.filter((i) => String(i.completedAt ?? "").startsWith(month)).length;
        const thisYear = completed.filter((i) => String(i.completedAt ?? "").startsWith(year)).length;
        return [
          { label: "Completed this month", value: thisMonth },
          { label: "Completed this year", value: thisYear },
          { label: "In progress", value: items.filter((i) => i.status === "reading").length },
        ];
      }}
      fields={[
        { key: "title", label: "Title" },
        { key: "author", label: "Author" },
        {
          key: "category",
          label: "Category",
          type: "select",
          options: ["book", "government-report", "constitution", "research-paper", "policy-paper"],
        },
        { key: "pages", label: "Pages", type: "number" },
        { key: "progress", label: "Progress %", type: "number" },
        { key: "rating", label: "Rating (1–5)", type: "number" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["reading", "paused", "completed"],
        },
        { key: "completedAt", label: "Completed date", type: "date" },
        { key: "summary", label: "Summary (Markdown)", type: "textarea", span: 2 },
        { key: "keyLessons", label: "Key lessons", type: "textarea", span: 2 },
        { key: "quotes", label: "Quotes", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
        { key: "attachments", label: "Attachments (JSON / URLs)", type: "textarea", span: 2 },
      ]}
    />
  );
}

export function WritingSection() {
  return (
    <CrudSection
      collection="writing"
      title="Writing Tracker"
      subtitle="Briefs, papers, speeches, and essays."
      stats={(items) => [
        { label: "Total written", value: items.length },
        { label: "Words written", value: items.reduce((s, i) => s + (Number(i.wordCount) || 0), 0) },
        {
          label: "Published this month",
          value: items.filter((i) => {
            const m = new Date().toISOString().slice(0, 7);
            return i.status === "published" && String(i.publishedAt ?? "").startsWith(m);
          }).length,
        },
      ]}
      fields={[
        { key: "title", label: "Title" },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: ["brief", "policy", "idea", "essay", "speech", "article"],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["draft", "review", "published"],
        },
        { key: "wordCount", label: "Word count", type: "number" },
        { key: "category", label: "Category" },
        { key: "dateLabel", label: "Date label" },
        { key: "publishedAt", label: "Published date", type: "date" },
        { key: "body", label: "Draft (Markdown)", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
        { key: "attachments", label: "Attachments", type: "textarea", span: 2 },
      ]}
    />
  );
}

export function MinistriesSection() {
  return (
    <CrudSection
      collection="ministries"
      title="Ministry Studies"
      subtitle="Study one ministry at a time."
      titleKey="name"
      fields={[
        { key: "name", label: "Ministry name" },
        { key: "currentMinister", label: "Current minister" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["studying", "paused", "completed"],
        },
        { key: "overview", label: "Overview", type: "textarea", span: 2 },
        { key: "responsibilities", label: "Responsibilities", type: "textarea", span: 2 },
        { key: "budget", label: "Budget", type: "textarea", span: 2 },
        { key: "structure", label: "Structure", type: "textarea", span: 2 },
        { key: "challenges", label: "Challenges", type: "textarea", span: 2 },
        { key: "recommendations", label: "My recommendations", type: "textarea", span: 2 },
        { key: "research", label: "Research", type: "textarea", span: 2 },
        { key: "tags", label: "Tags" },
        { key: "attachments", label: "Files / attachments", type: "textarea" },
      ]}
    />
  );
}

export function CountriesSection() {
  return (
    <CrudSection
      collection="countries"
      title="Country Studies"
      subtitle="Lessons for Somalia from the world."
      titleKey="country"
      fields={[
        { key: "country", label: "Country" },
        { key: "governmentModel", label: "Government model" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["studying", "paused", "completed"],
        },
        { key: "economy", label: "Economy", type: "textarea", span: 2 },
        { key: "education", label: "Education", type: "textarea", span: 2 },
        { key: "healthcare", label: "Healthcare", type: "textarea", span: 2 },
        { key: "military", label: "Military", type: "textarea", span: 2 },
        { key: "infrastructure", label: "Infrastructure", type: "textarea", span: 2 },
        { key: "technology", label: "Technology", type: "textarea", span: 2 },
        { key: "lessonsSomalia", label: "Lessons for Somalia", type: "textarea", span: 2 },
        { key: "ideasAdapt", label: "Ideas worth adapting", type: "textarea", span: 2 },
        { key: "notes", label: "Personal notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

export function PolicySection() {
  return (
    <CrudSection
      collection="policy"
      title="Policy Ideas"
      subtitle="Private vault for national solutions."
      fields={[
        { key: "title", label: "Title" },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          options: ["low", "medium", "high", "critical"],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["idea", "researching", "drafted", "archived"],
        },
        { key: "problem", label: "Problem", type: "textarea", span: 2 },
        { key: "whyExists", label: "Why it exists", type: "textarea", span: 2 },
        { key: "possibleSolutions", label: "Possible solutions", type: "textarea", span: 2 },
        { key: "recommended", label: "Recommended solution", type: "textarea", span: 2 },
        { key: "expectedImpact", label: "Expected impact", type: "textarea", span: 2 },
        { key: "research", label: "Research attached", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

export function SpeakingSection() {
  return (
    <CrudSection
      collection="speaking"
      title="Public Speaking"
      subtitle="Practice sessions and growth log."
      stats={(items) => [
        {
          label: "Hours practiced",
          value: Math.round((items.reduce((s, i) => s + (Number(i.durationMin) || 0), 0) / 60) * 10) / 10,
        },
        { label: "Sessions", value: items.length },
        {
          label: "Avg confidence",
          value:
            items.length === 0
              ? "—"
              : Math.round(items.reduce((s, i) => s + (Number(i.confidence) || 0), 0) / items.length),
        },
      ]}
      fields={[
        { key: "title", label: "Session title" },
        { key: "topic", label: "Speech topic" },
        { key: "durationMin", label: "Duration (min)", type: "number" },
        { key: "confidence", label: "Confidence (1–10)", type: "number" },
        { key: "practicedAt", label: "Date", type: "date" },
        { key: "videoUrl", label: "Video URL" },
        { key: "mistakes", label: "Mistakes", type: "textarea", span: 2 },
        { key: "improvements", label: "Improvements", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

export function NetworkingSection() {
  return (
    <CrudSection
      collection="networking"
      title="Networking"
      subtitle="CRM for people who shape the path."
      titleKey="name"
      fields={[
        { key: "name", label: "Name" },
        { key: "organization", label: "Organization" },
        { key: "position", label: "Position" },
        { key: "location", label: "Location" },
        { key: "lastMeeting", label: "Last meeting", type: "date" },
        { key: "followUp", label: "Follow-up reminder", type: "date" },
        { key: "relationshipStrength", label: "Relationship (1–5)", type: "number" },
        { key: "topicsDiscussed", label: "Topics discussed", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

export function CareerSection() {
  return (
    <CrudSection
      collection="career"
      title="Government Career"
      subtitle="Milestones toward public service."
      fields={[
        { key: "title", label: "Milestone" },
        { key: "targetDate", label: "Target date", type: "date" },
        { key: "progress", label: "Progress %", type: "number" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["planned", "in-progress", "completed"],
        },
        { key: "requirements", label: "Requirements", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

export function TasksSection() {
  return (
    <CrudSection
      collection="tasks"
      title="Tasks"
      subtitle="Daily and upcoming work."
      fields={[
        { key: "title", label: "Title" },
        { key: "dueDate", label: "Due date", type: "date" },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          options: ["low", "medium", "high"],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["todo", "doing", "done"],
        },
        { key: "category", label: "Category" },
        { key: "description", label: "Description", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

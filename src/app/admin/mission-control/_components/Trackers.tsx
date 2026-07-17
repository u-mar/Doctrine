"use client";

import { useMemo, useState } from "react";
import {
  btnGhost,
  btnPrimary,
  cardInteractive,
  EmptyState,
  Field,
  inputClass,
  itemToForm,
  listCardTone,
  Modal,
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

type DetailSection = {
  title: string;
  keys: string[];
  tone: string;
  span?: "full" | "half";
};

function FieldInputs({
  fields,
  form,
  set,
  titleKey,
}: {
  fields: FieldDef[];
  form: Record<string, string | number>;
  set: (key: string, value: string | number) => void;
  titleKey: string;
}) {
  return (
    <>
      {fields.map((f) => (
        <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : undefined}>
          <Field label={f.label}>
            {f.type === "textarea" ? (
              <textarea
                className={inputClass}
                rows={f.key === "overview" || f.key === "body" || f.key === "research" ? 6 : 4}
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
    </>
  );
}

function CrudSection({
  collection,
  title,
  subtitle,
  fields,
  titleKey = "title",
  createLabel,
  stats,
  previewKeys,
  detailSections,
  heroKeys,
  dossierLabel,
}: {
  collection: string;
  title: string;
  subtitle: string;
  fields: FieldDef[];
  titleKey?: string;
  createLabel: string;
  stats?: (items: Record<string, unknown>[]) => { label: string; value: string | number }[];
  previewKeys?: string[];
  detailSections?: DetailSection[];
  heroKeys?: string[];
  dossierLabel?: string;
}) {
  const { items, loading, q, setQ, create, update, remove, reload } =
    useCollection<Record<string, unknown> & { id: string }>(collection);
  const empty = useMemo(() => {
    const o: Record<string, string | number> = {};
    for (const f of fields) {
      if (f.type === "number") o[f.key] = 0;
      else if (f.type === "select" && f.options?.[0]) o[f.key] = f.options[0];
      else o[f.key] = "";
    }
    return o;
  }, [fields]);
  const [form, setForm] = useState<Record<string, string | number>>(empty);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));
  const derivedStats = stats?.(items) ?? [];
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const fieldByKey = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, f])), [fields]);
  const useDossier = Boolean(detailSections?.length);

  const openCreate = () => {
    setForm(empty);
    setCreateOpen(true);
  };

  const openDetail = (item: Record<string, unknown> & { id: string }) => {
    setSelectedId(item.id);
    setForm(itemToForm(item, fields, empty));
    setEditing(false);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setForm(empty);
    setEditing(false);
  };

  if (selected && useDossier && detailSections) {
    const displayTitle = String(form[titleKey] || selected[titleKey] || selected.name || selected.country || "Untitled");
    const status = String(form.status ?? selected.status ?? "");
    const filledCount = detailSections.reduce(
      (n, sec) => n + sec.keys.filter((k) => String(form[k] ?? "").trim()).length,
      0
    );
    const totalFields = detailSections.reduce((n, sec) => n + sec.keys.length, 0);
    const coverage = totalFields ? Math.round((filledCount / totalFields) * 100) : 0;

    return (
      <div>
        <button type="button" onClick={closeDetail} className={`${btnGhost} mb-4`}>
          ← Back to {title}
        </button>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="grid gap-6 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 p-6 lg:grid-cols-[1.35fr_auto] lg:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B8FD9]">
                  {dossierLabel ?? "Study dossier"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{displayTitle}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Everything captured in this study — open Edit to update any section.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className={btnPrimary} onClick={() => setEditing(true)}>
                    Edit study
                  </button>
                  {status ? (
                    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize text-slate-600 shadow-sm">
                      Status <strong className="ml-1.5 text-slate-900">{status}</strong>
                    </span>
                  ) : null}
                  {(heroKeys ?? [])
                    .filter((k) => k !== "status" && k !== titleKey)
                    .map((k) => {
                      const val = String(form[k] ?? "").trim();
                      if (!val) return null;
                      const label = fieldByKey[k]?.label ?? k;
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
                        >
                          {label} <strong className="ml-1.5 text-slate-900">{val}</strong>
                        </span>
                      );
                    })}
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={async () => {
                      if (!window.confirm(`Delete “${displayTitle}”?`)) return;
                      await remove(selected.id);
                      closeDetail();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Coverage</p>
                <p className="mt-1 text-5xl font-semibold tracking-tight text-[#1d6aa8]">{coverage}%</p>
                <div className="mt-3 w-40">
                  <ProgressBar value={coverage} />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {filledCount}/{totalFields} fields filled
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {detailSections.map((sec) => {
              const blocks = sec.keys.map((k) => ({
                key: k,
                label: fieldByKey[k]?.label ?? k,
                body: String(form[k] ?? "").trim(),
              }));
              return (
                <div
                  key={sec.title}
                  className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${sec.tone} ${
                    sec.span === "full" ? "lg:col-span-2" : ""
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{sec.title}</p>
                  {blocks.length === 1 ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {blocks[0].body || "Not written yet — edit study to fill this in."}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {blocks.map((b) => (
                        <div key={b.key}>
                          <p className="text-xs font-medium text-slate-500">{b.label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                            {b.body || "Not written yet."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Modal open={editing} onClose={() => setEditing(false)} title={`Edit · ${displayTitle}`} wide>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await update(selected.id, form);
                setEditing(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            <FieldInputs fields={fields} form={form} set={set} titleKey={titleKey} />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className={btnGhost} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Save study"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (selected) {
    const displayTitle = String(form[titleKey] || selected[titleKey] || selected.name || selected.country || "Untitled");
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button type="button" onClick={closeDetail} className={`${btnGhost} mb-3`}>
              ← Back to {title}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{displayTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit everything inside this entry. Changes save when you click Save.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={async () => {
                if (!window.confirm(`Delete “${displayTitle}”?`)) return;
                await remove(selected.id);
                closeDetail();
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await update(selected.id, form);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 p-5 shadow-[0_8px_24px_rgba(59,143,217,0.06)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInputs fields={fields} form={form} set={set} titleKey={titleKey} />
          </div>
          {typeof form.progress === "number" ? (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{form.progress}%</span>
              </div>
              <ProgressBar value={Number(form.progress) || 0} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void reload()}
              placeholder="Search…"
              className={`${inputClass} w-44`}
            />
            <button type="button" className={btnPrimary} onClick={openCreate}>
              {createLabel}
            </button>
          </div>
        }
      />

      {derivedStats.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {derivedStats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={createLabel} wide>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const titleVal = String(form[titleKey] ?? "").trim();
            if (!titleVal && titleKey) return;
            setSaving(true);
            try {
              const created = await create(form);
              setCreateOpen(false);
              setForm(empty);
              openDetail(created);
            } finally {
              setSaving(false);
            }
          }}
        >
          <FieldInputs fields={fields} form={form} set={set} titleKey={titleKey} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={btnGhost} onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Creating…" : createLabel}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} body={`Click “${createLabel}” to add your first entry.`} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const name = String(item[titleKey] ?? item.name ?? item.country ?? "Untitled");
            const preview = (previewKeys ?? [])
              .map((k) => String(item[k] ?? "").trim())
              .find(Boolean);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openDetail(item)}
                  className={`${cardInteractive} ${listCardTone(index)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {String(item.status ?? item.category ?? item.type ?? "")}
                        {typeof item.progress === "number" ? ` · ${item.progress}%` : ""}
                        {typeof item.wordCount === "number" ? ` · ${item.wordCount} words` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
                      Open →
                    </span>
                  </div>
                  {preview ? (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{preview}</p>
                  ) : null}
                  {typeof item.progress === "number" ? (
                    <div className="mt-3">
                      <ProgressBar value={item.progress as number} tone={index} />
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
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
      subtitle="Books, constitutions, reports, and research. Click any item to open it."
      createLabel="Add reading"
      titleKey="title"
      previewKeys={["summary", "keyLessons", "notes"]}
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
        { key: "status", label: "Status", type: "select", options: ["reading", "paused", "completed"] },
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
      subtitle="Briefs, papers, speeches, and essays. Click any item to open it."
      createLabel="Add writing"
      previewKeys={["body", "notes"]}
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
        { key: "status", label: "Status", type: "select", options: ["draft", "review", "published"] },
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
      subtitle="Study one ministry at a time. Click a ministry to open its full dossier."
      createLabel="Add ministry"
      titleKey="name"
      previewKeys={["overview", "challenges", "recommendations"]}
      dossierLabel="Ministry dossier"
      heroKeys={["status", "currentMinister"]}
      detailSections={[
        { title: "Overview", keys: ["overview"], tone: "from-emerald-50 to-white border-emerald-200", span: "full" },
        { title: "Responsibilities", keys: ["responsibilities"], tone: "from-sky-50 to-white border-sky-200" },
        { title: "Budget", keys: ["budget"], tone: "from-amber-50 to-white border-amber-200" },
        { title: "Structure", keys: ["structure"], tone: "from-violet-50 to-white border-violet-200" },
        { title: "Challenges", keys: ["challenges"], tone: "from-rose-50 to-white border-rose-200" },
        {
          title: "My recommendations",
          keys: ["recommendations"],
          tone: "from-teal-50 to-white border-teal-200",
          span: "full",
        },
        { title: "Research", keys: ["research"], tone: "from-orange-50 to-white border-orange-200", span: "full" },
        {
          title: "Files & tags",
          keys: ["tags", "attachments"],
          tone: "from-slate-50 to-white border-slate-200",
        },
      ]}
      fields={[
        { key: "name", label: "Ministry name" },
        { key: "currentMinister", label: "Current minister" },
        { key: "status", label: "Status", type: "select", options: ["studying", "paused", "completed"] },
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
      subtitle="Lessons for Somalia from the world. Click a country to open its full dossier."
      createLabel="Add country"
      titleKey="country"
      previewKeys={["lessonsSomalia", "governmentModel", "notes"]}
      dossierLabel="Country dossier"
      heroKeys={["status", "governmentModel"]}
      detailSections={[
        { title: "Economy", keys: ["economy"], tone: "from-emerald-50 to-white border-emerald-200" },
        { title: "Education", keys: ["education"], tone: "from-sky-50 to-white border-sky-200" },
        { title: "Healthcare", keys: ["healthcare"], tone: "from-rose-50 to-white border-rose-200" },
        { title: "Military", keys: ["military"], tone: "from-slate-50 to-white border-slate-300" },
        { title: "Infrastructure", keys: ["infrastructure"], tone: "from-amber-50 to-white border-amber-200" },
        { title: "Technology", keys: ["technology"], tone: "from-violet-50 to-white border-violet-200" },
        {
          title: "Lessons for Somalia",
          keys: ["lessonsSomalia"],
          tone: "from-teal-50 to-white border-teal-200",
          span: "full",
        },
        {
          title: "Ideas worth adapting",
          keys: ["ideasAdapt"],
          tone: "from-orange-50 to-white border-orange-200",
          span: "full",
        },
        { title: "Personal notes", keys: ["notes"], tone: "from-lime-50 to-white border-lime-200", span: "full" },
        { title: "Tags", keys: ["tags"], tone: "from-slate-50 to-white border-slate-200" },
      ]}
      fields={[
        { key: "country", label: "Country" },
        { key: "governmentModel", label: "Government model" },
        { key: "status", label: "Status", type: "select", options: ["studying", "paused", "completed"] },
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
      subtitle="Private vault for national solutions. Click an idea to open it."
      createLabel="Add policy idea"
      previewKeys={["problem", "recommended"]}
      fields={[
        { key: "title", label: "Title" },
        { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "critical"] },
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
      subtitle="Practice sessions and growth log. Click a session to open it."
      createLabel="Add session"
      previewKeys={["topic", "improvements", "notes"]}
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

export function TasksSection() {
  return (
    <CrudSection
      collection="tasks"
      title="Tasks"
      subtitle="Daily and upcoming work. Click a task to open it."
      createLabel="Create task"
      previewKeys={["description"]}
      fields={[
        { key: "title", label: "Title" },
        { key: "dueDate", label: "Due date", type: "date" },
        { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
        { key: "status", label: "Status", type: "select", options: ["todo", "doing", "done"] },
        { key: "category", label: "Category" },
        { key: "description", label: "Description", type: "textarea", span: 2 },
        { key: "tags", label: "Tags", span: 2 },
      ]}
    />
  );
}

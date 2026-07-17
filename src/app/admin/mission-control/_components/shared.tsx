"use client";

import { useCallback, useEffect, useState } from "react";

export async function mcFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function useCollection<T extends { id: string }>(collection: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(
    async (query = q) => {
      setLoading(true);
      setError("");
      try {
        const params = query ? `?q=${encodeURIComponent(query)}` : "";
        const rows = await mcFetch<T[]>(`/api/admin/mission-control/${collection}${params}`);
        setItems(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [collection, q]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (body: Record<string, unknown>) => {
    const row = await mcFetch<T>(`/api/admin/mission-control/${collection}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    await reload();
    return row;
  };

  const update = async (id: string, body: Record<string, unknown>) => {
    const row = await mcFetch<T>(`/api/admin/mission-control/${collection}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    await reload();
    return row;
  };

  const remove = async (id: string) => {
    await mcFetch(`/api/admin/mission-control/${collection}/${id}`, { method: "DELETE" });
    await reload();
  };

  return { items, loading, error, q, setQ, reload, create, update, remove };
}

const STAT_TONES = [
  {
    card: "from-emerald-50 to-white border-emerald-200/80",
    label: "text-emerald-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(16,185,129,0.15)]",
  },
  {
    card: "from-amber-50 to-white border-amber-200/80",
    label: "text-amber-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(245,158,11,0.15)]",
  },
  {
    card: "from-rose-50 to-white border-rose-200/80",
    label: "text-rose-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(244,63,94,0.14)]",
  },
  {
    card: "from-violet-50 to-white border-violet-200/80",
    label: "text-violet-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(139,92,246,0.14)]",
  },
  {
    card: "from-teal-50 to-white border-teal-200/80",
    label: "text-teal-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(20,184,166,0.14)]",
  },
  {
    card: "from-orange-50 to-white border-orange-200/80",
    label: "text-orange-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(249,115,22,0.14)]",
  },
  {
    card: "from-sky-50 to-white border-sky-200/80",
    label: "text-sky-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(14,165,233,0.14)]",
  },
  {
    card: "from-lime-50 to-white border-lime-200/80",
    label: "text-lime-700/70",
    glow: "hover:shadow-[0_8px_28px_rgba(132,204,22,0.14)]",
  },
];

const LIST_CARD_TONES = [
  "from-emerald-50/90 to-white border-emerald-200/70 hover:border-emerald-400/60",
  "from-amber-50/90 to-white border-amber-200/70 hover:border-amber-400/60",
  "from-rose-50/90 to-white border-rose-200/70 hover:border-rose-400/60",
  "from-violet-50/90 to-white border-violet-200/70 hover:border-violet-400/60",
  "from-teal-50/90 to-white border-teal-200/70 hover:border-teal-400/60",
  "from-orange-50/90 to-white border-orange-200/70 hover:border-orange-400/60",
  "from-sky-50/90 to-white border-sky-200/70 hover:border-sky-400/60",
  "from-fuchsia-50/90 to-white border-fuchsia-200/70 hover:border-fuchsia-400/60",
];

export function ProgressBar({ value, className = "", tone = 0 }: { value: number; className?: string; tone?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const bars = [
    "from-emerald-500 to-teal-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
    "from-violet-500 to-fuchsia-400",
    "from-sky-500 to-cyan-400",
    "from-lime-500 to-emerald-400",
  ];
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${bars[tone % bars.length]} transition-all duration-700`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: number;
}) {
  const t = STAT_TONES[tone % STAT_TONES.length];
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 ${t.card} ${t.glow}`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${t.label}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-[#fbfcfe] px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#3B8FD9] focus:bg-white focus:ring-2 focus:ring-[#3B8FD9]/15";

export const btnPrimary =
  "rounded-xl bg-gradient-to-b from-[#4B9CD3] to-[#3B8FD9] px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_6px_16px_rgba(59,143,217,0.28)] transition hover:brightness-105 disabled:opacity-50";

export const btnGhost =
  "rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/80 hover:text-slate-900";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200/80 bg-gradient-to-b from-sky-50/60 to-white px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
        <span className="text-lg">✦</span>
      </div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-2 h-1 w-10 rounded-full bg-gradient-to-r from-[#3B8FD9] to-[#6BB8E8]" />
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 flex max-h-[min(92vh,880px)] w-full flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${
          wide ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sky-50 bg-gradient-to-r from-sky-50/80 to-white px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className={btnGhost}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConsistencyRing({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div className="relative mx-auto h-36 w-36">
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-sky-50 to-white shadow-inner" />
      <svg className="relative h-full w-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#dbeafe" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#mcRing)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="mcRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6BB8E8" />
            <stop offset="100%" stopColor="#2F7FC4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{v}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700/50">Score</span>
      </div>
    </div>
  );
}

export function itemToForm(
  item: Record<string, unknown>,
  fields: { key: string; type?: string }[],
  empty: Record<string, string | number>
) {
  const next: Record<string, string | number> = { ...empty };
  for (const f of fields) {
    const v = item[f.key];
    if (f.type === "date" && v) next[f.key] = String(v).slice(0, 10);
    else if (f.key === "tags" && Array.isArray(v)) next[f.key] = v.join(", ");
    else if (v != null) next[f.key] = v as string | number;
  }
  return next;
}

export const cardInteractive =
  "group w-full rounded-2xl border bg-gradient-to-br p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)]";

export function listCardTone(index: number) {
  return LIST_CARD_TONES[index % LIST_CARD_TONES.length];
}

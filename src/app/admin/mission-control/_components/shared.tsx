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

  const reload = useCallback(async (query = q) => {
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
  }, [collection, q]);

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

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="h-full rounded-full bg-[#4B9CD3] transition-all duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#4B9CD3]/50 focus:ring-2 focus:ring-[#4B9CD3]/20";

export const btnPrimary =
  "rounded-xl bg-[#4B9CD3] px-4 py-2.5 text-sm font-medium text-black transition hover:bg-[#6BB3E0] disabled:opacity-50";

export const btnGhost =
  "rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className="mt-1 text-sm text-white/40">{body}</p>
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

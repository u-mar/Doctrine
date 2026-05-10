"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface JournalRatingProps {
  entrySlug: string;
}

const MAX_RATING = 5;

function storageKeyFor(entrySlug: string) {
  return `journal-rating:${entrySlug}`;
}

/** Older Briefs list used slug-only keys; detail pages use brief:<slug>. */
function legacyBriefStorageKeys(entrySlug: string): string[] {
  if (!entrySlug.startsWith("brief:")) {
    return [];
  }
  const slug = entrySlug.slice("brief:".length);
  if (!slug) {
    return [];
  }
  return [`journal-rating:${slug}`];
}

function readLocalRating(entrySlug: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const keys = [storageKeyFor(entrySlug), ...legacyBriefStorageKeys(entrySlug)];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= MAX_RATING) {
      return parsed;
    }
  }
  return null;
}

export default function JournalRating(props: JournalRatingProps) {
  return <JournalRatingInner key={props.entrySlug} {...props} />;
}

function JournalRatingInner({ entrySlug }: JournalRatingProps) {
  const canonicalStorageKey = useMemo(() => storageKeyFor(entrySlug), [entrySlug]);
  const migratedLegacyRef = useRef(false);

  const [rating, setRating] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncLocal = useCallback(
    (value: number | null) => {
      if (typeof window === "undefined") {
        return;
      }
      if (value === null) {
        window.localStorage.removeItem(canonicalStorageKey);
      } else {
        window.localStorage.setItem(canonicalStorageKey, String(value));
      }
      for (const legacy of legacyBriefStorageKeys(entrySlug)) {
        window.localStorage.removeItem(legacy);
      }
    },
    [canonicalStorageKey, entrySlug]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/content/rating?itemKey=${encodeURIComponent(entrySlug)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error ?? "Could not load ratings");
      }
      const data = (await res.json()) as {
        average: number | null;
        myRating: number | null;
      };
      let nextMy = data.myRating;
      let mergedAvg = data.average;

      if (nextMy === null && !migratedLegacyRef.current) {
        const local = readLocalRating(entrySlug);
        if (local !== null) {
          migratedLegacyRef.current = true;
          const putRes = await fetch("/api/content/rating", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemKey: entrySlug, value: local }),
          });
          if (putRes.ok) {
            const saved = (await putRes.json()) as {
              average: number | null;
              myRating: number | null;
            };
            nextMy = saved.myRating;
            mergedAvg = saved.average;
            syncLocal(nextMy ?? local);
          }
        }
      }

      setRating(nextMy ?? readLocalRating(entrySlug));
      setAverage(mergedAvg);
      if (nextMy !== null) {
        syncLocal(nextMy);
      }
    } catch (e) {
      const fallback = readLocalRating(entrySlug);
      setRating(fallback);
      setAverage(null);
      setError(e instanceof Error ? e.message : "Could not load ratings");
    } finally {
      setLoading(false);
    }
  }, [entrySlug, syncLocal]);

  useEffect(() => {
    migratedLegacyRef.current = false;
    void load();
  }, [load]);

  const handleRate = async (value: number) => {
    setSaving(true);
    setError(null);
    const prev = rating;
    setRating(value);
    syncLocal(value);
    try {
      const res = await fetch("/api/content/rating", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: entrySlug, value }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error ?? "Could not save rating");
      }
      const data = (await res.json()) as {
        average: number | null;
        myRating: number | null;
      };
      setRating(data.myRating ?? value);
      setAverage(data.average);
      syncLocal(data.myRating ?? value);
    } catch (e) {
      setRating(prev);
      syncLocal(prev);
      setError(e instanceof Error ? e.message : "Could not save rating");
    } finally {
      setSaving(false);
    }
  };

  let summary: ReactNode;
  if (average !== null) {
    const yours = rating != null ? `Your ${rating}/${MAX_RATING} · ` : "";
    summary = (
      <span className="text-xs text-muted-foreground">
        {yours}
        {average.toFixed(1)} avg
      </span>
    );
  } else {
    summary = <span className="text-xs text-muted-foreground">{rating ? `${rating}/${MAX_RATING}` : "Tap a star"}</span>;
  }

  return (
    <section className="mt-6 rounded-lg border border-border/35 bg-muted/10 px-3 py-3 sm:mt-8 sm:rounded-xl sm:border-border/60 sm:bg-muted/20 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-xs font-medium text-muted-foreground">Rate this piece</span>
        <div className="flex items-center gap-0.5" role="group" aria-label="Star rating">
          {Array.from({ length: MAX_RATING }, (_, index) => {
            const value = index + 1;
            const isActive = rating !== null && value <= rating;

            return (
              <button
                key={value}
                type="button"
                disabled={loading || saving}
                onClick={() => void handleRate(value)}
                aria-label={`Rate ${value} out of ${MAX_RATING}`}
                aria-pressed={rating === value}
                className={`rounded px-0.5 py-0.5 text-xl leading-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 ${
                  isActive ? "text-primary" : "text-muted-foreground/45 hover:text-muted-foreground/70"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
        {loading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : saving ? (
          <span className="text-xs text-muted-foreground">Saving…</span>
        ) : (
          summary
        )}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}

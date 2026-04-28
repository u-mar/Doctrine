"use client";

import { useEffect, useMemo, useState } from "react";

interface JournalRatingProps {
  entrySlug: string;
}

const MAX_RATING = 5;

export default function JournalRating({ entrySlug }: JournalRatingProps) {
  const [rating, setRating] = useState<number | null>(null);

  const storageKey = useMemo(() => `journal-rating:${entrySlug}`, [entrySlug]);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return;
    }

    const parsedRating = Number(storedValue);

    if (!Number.isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= MAX_RATING) {
      setRating(parsedRating);
    }
  }, [storageKey]);

  const handleRate = (value: number) => {
    setRating(value);
    window.localStorage.setItem(storageKey, String(value));
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Rate this entry</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your rating helps highlight which journal ideas resonate most.
      </p>

      <div className="mt-4 flex items-center gap-1">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const value = index + 1;
          const isActive = rating !== null && value <= rating;

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleRate(value)}
              aria-label={`Rate ${value} out of ${MAX_RATING}`}
              aria-pressed={rating === value}
              className={`rounded-md px-1 py-1 text-3xl leading-none transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                isActive ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              ★
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {rating ? `You rated this ${rating}/${MAX_RATING}.` : "No rating submitted yet."}
      </p>
    </section>
  );
}

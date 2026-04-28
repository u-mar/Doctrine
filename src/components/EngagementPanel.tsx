"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Vote = "agree" | "disagree" | null;

interface EngagementState {
  vote: Vote;
  comments: string[];
}

interface EngagementPanelProps {
  itemKey: string;
  title?: string;
  commentsEnabled?: boolean;
  voteStyle?: "default" | "polarity";
  showStatusText?: boolean;
}

export default function EngagementPanel({
  itemKey,
  title = "Join the discussion",
  commentsEnabled = true,
  voteStyle = "default",
  showStatusText = true,
}: EngagementPanelProps) {
  const storageKey = useMemo(() => `engagement:${itemKey}`, [itemKey]);

  const [vote, setVote] = useState<Vote>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as EngagementState;

      if (parsed.vote === "agree" || parsed.vote === "disagree") {
        setVote(parsed.vote);
      }

      if (Array.isArray(parsed.comments)) {
        setComments(parsed.comments.filter((item) => typeof item === "string"));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const persist = (nextState: EngagementState) => {
    window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  };

  const handleVote = (nextVote: Exclude<Vote, null>) => {
    const finalVote = vote === nextVote ? null : nextVote;
    setVote(finalVote);
    persist({ vote: finalVote, comments });
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!commentsEnabled) {
      return;
    }

    const cleaned = newComment.trim();

    if (!cleaned) {
      return;
    }

    const nextComments = [cleaned, ...comments].slice(0, 10);
    setComments(nextComments);
    setNewComment("");
    persist({ vote, comments: nextComments });
  };

  return (
    <section className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
      {title ? (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleVote("agree")}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            voteStyle === "polarity"
              ? vote === "agree"
                ? "border-emerald-700 bg-emerald-600 text-white"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
              : vote === "agree"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
          }`}
        >
          Agree
        </button>
        <button
          type="button"
          onClick={() => handleVote("disagree")}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            voteStyle === "polarity"
              ? vote === "disagree"
                ? "border-rose-700 bg-rose-600 text-white"
                : "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/50"
              : vote === "disagree"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
          }`}
        >
          Disagree
        </button>
        {showStatusText ? (
          <span className="text-xs text-muted-foreground">
            {vote ? `You currently ${vote}.` : "Share your stance."}
          </span>
        ) : null}
      </div>

      {commentsEnabled && (
        <>
          <form onSubmit={handleSubmitComment} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={180}
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Post
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">No comments yet. Be the first to add one.</p>
            )}
            {comments.map((comment, index) => (
              <p key={`${comment}-${index}`} className="rounded-lg bg-background px-3 py-2 text-sm">
                {comment}
              </p>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

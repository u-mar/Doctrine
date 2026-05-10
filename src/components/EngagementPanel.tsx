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
  const [vote, setVote] = useState<Vote>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loaded, setLoaded] = useState(false);

  const queryKey = useMemo(() => encodeURIComponent(itemKey), [itemKey]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/content/engagement?itemKey=${queryKey}`);
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as {
          vote?: Vote;
          comments?: string[];
        };
        if (cancelled) {
          return;
        }
        if (data.vote === "agree" || data.vote === "disagree") {
          setVote(data.vote);
        } else {
          setVote(null);
        }
        if (Array.isArray(data.comments)) {
          setComments(data.comments.filter((item) => typeof item === "string"));
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const persist = async (nextState: EngagementState) => {
    await fetch("/api/content/engagement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemKey,
        vote: nextState.vote,
        comments: nextState.comments,
      }),
    });
  };

  const handleVote = async (nextVote: Exclude<Vote, null>) => {
    const finalVote = vote === nextVote ? null : nextVote;
    setVote(finalVote);
    await persist({ vote: finalVote, comments });
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
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
    await persist({ vote, comments: nextComments });
  };

  if (!loaded) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground">Loading engagement…</p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
      {title ? (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleVote("agree")}
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
          onClick={() => void handleVote("disagree")}
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
          <form onSubmit={(e) => void handleSubmitComment(e)} className="mt-4 flex gap-2">
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

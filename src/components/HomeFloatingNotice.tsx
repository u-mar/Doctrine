"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "doctrine-home-notice-dismissed";

export default function HomeFloatingNotice({
  enabled,
  message,
}: {
  enabled: boolean;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const [hiddenForSession, setHiddenForSession] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const text = message.trim();
  const visible = enabled && text.length > 0 && !hiddenForSession;

  useEffect(() => {
    if (typeof window === "undefined" || !enabled || !text) {
      return;
    }
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === text) {
        setHiddenForSession(true);
      }
    } catch {
      /* ignore */
    }
  }, [enabled, text]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const dismissForSession = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, text);
    } catch {
      /* ignore */
    }
    setHiddenForSession(true);
    setOpen(false);
  }, [text]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40"
      role="complementary"
      aria-label="Site notice"
    >
      <div className="relative flex flex-col items-end">
      <div
        ref={panelRef}
        className={`absolute bottom-full right-0 mb-3 origin-bottom-right transition-all duration-200 ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="w-[min(calc(100vw-2rem),19rem)] rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md dark:bg-card/90">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Note</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close notice panel"
            >
              ✕
            </button>
          </div>
          <p className="max-h-[min(40vh,14rem)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {text}
          </p>
          <button
            type="button"
            onClick={dismissForSession}
            className="mt-3 w-full rounded-lg border border-border bg-muted/40 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Don&apos;t show again this visit
          </button>
        </div>
      </div>

      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30 transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        aria-label={open ? "Close site notice" : "Open site notice"}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2} aria-hidden />
      </button>
      </div>
    </div>
  );
}

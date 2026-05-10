"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPageClient() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorText("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: contact,
          message,
          company: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setStatus("success");
      setName("");
      setContact("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25 text-foreground">
      <div className="container mx-auto max-w-lg px-4 pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)] pb-16 sm:px-6 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)]">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">Home</span>
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          If you have any opinions or want to share anything with me — I&apos;d like to hear it.
        </p>

        {status === "success" ? (
          <div className="mt-8 rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
            <p className="font-medium text-foreground">Thanks — your message was received.</p>
            <p className="mt-2 text-sm text-muted-foreground">I&apos;ll read it when I can.</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={(ev) => void handleSubmit(ev)} className="relative mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Name</span>
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">How to reach you</span>
              <input
                type="text"
                name="contact"
                required
                autoComplete="email"
                value={contact}
                onChange={(ev) => setContact(ev.target.value)}
                placeholder="Email, phone, @handle — whatever you prefer"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Message</span>
              <textarea
                name="message"
                required
                rows={6}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your message…"
              />
            </label>

            {/* Honeypot for bots (off-screen, not display:none) */}
            <div
              className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
              aria-hidden="true"
            >
              <label>
                Company
                <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(ev) => setHoneypot(ev.target.value)} />
              </label>
            </div>

            {status === "error" ? <p className="text-sm text-destructive">{errorText}</p> : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

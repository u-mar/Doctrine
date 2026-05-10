import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip markdown markers so list excerpts and cards show plain text (e.g. ## headings). */
export function stripMarkdownForPreview(text: string): string {
  if (!text.trim()) {
    return ""
  }
  let s = text.replace(/\r\n/g, "\n")
  s = s.replace(/^#{1,6}\s*/gm, "")
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1")
  s = s.replace(/\*([^*]+)\*/g, "$1")
  s = s.replace(/`([^`]+)`/g, "$1")
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  s = s.replace(/\s+/g, " ").trim()
  return s
}

/** Short preview for cards; prefers breaking at a word boundary. */
export function truncatePlainText(text: string, maxChars: number): string {
  const t = text.trim()
  if (t.length <= maxChars) {
    return t
  }
  let cut = t.slice(0, maxChars).trimEnd()
  const lastSpace = cut.lastIndexOf(" ")
  if (lastSpace > maxChars * 0.55) {
    cut = cut.slice(0, lastSpace).trimEnd()
  }
  return `${cut}…`
}

/** Multi-page reader: put this on its own line between sections of one entry. */
export const CONTENT_PAGE_BREAK = "\n[[[PAGE]]]\n";

const LEGACY_PAGE_BREAK = "\n---\n";

/** Split stored entry body into reader pages (new marker first, then legacy `---`). */
export function splitContentPages(content: string): string[] {
  if (content.length === 0) {
    return [""];
  }
  if (content.includes("[[[PAGE]]]")) {
    return content.split(CONTENT_PAGE_BREAK);
  }
  return content.split(LEGACY_PAGE_BREAK);
}

/**
 * CommonMark/GFM reject strong/emphasis if there is whitespace right after the opener
 * (e.g. `** Counterfeit` renders as literal asterisks). Normalize typical authoring mistakes.
 *
 * Also fixes `**Label:**Word` (no space after closing **) which often renders as raw asterisks,
 * and turns block-leading `**Label:** …` paragraphs into bullet lines for point-form lists.
 *
 * Normalizes odd line endings (Windows / Unicode separators) so lists break correctly
 * in admin preview and on the public MDX renderer.
 *
 * Turns typed `\\n` (backslash + letter n) into real line breaks — common when authors
 * paste escape sequences instead of pressing Enter.
 */
export function normalizeMarkdownSource(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\u2028|\u2029/g, "\n");
  // Literal "\n" / "\r\n" in note text → real newlines
  s = s.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  // One-line outlines: "Topic- Next topic- Third" (hyphen + space + capital) → real newlines
  for (let pass = 0; pass < 16; pass++) {
    const next = s.replace(/(\w+)-\s+([A-Z])/g, "$1\n$2");
    if (next === s) break;
    s = next;
  }
  s = s.replace(/\*\*\s+/g, "**");
  s = s.replace(/__\s+/g, "__");
  // Glue: `:**` immediately followed by a word — insert space so ** closes reliably for parsers
  s = s.replace(/(\*\*[^*\n]+?:\*\*)([A-Za-z0-9(])/g, "$1 $2");
  // Point form: paragraph (or document) starts with **Title:** → markdown bullet
  s = s.replace(/(^|\n\n)(\*\*[^*\n]+?:\*\*[^\n]*)/gm, (full, sep: string, body: string) => {
    if (/^\s*-\s/.test(body)) {
      return full;
    }
    return `${sep}- ${body}`;
  });
  // Single newline between drivers: `...\n**Next:**` → list continuation
  s = s.replace(/\n(?!\n)(\*\*[^*\n]+?:\*\*[^\n]*)/g, (full, body: string) => {
    if (/^\s*-\s/.test(body)) {
      return full;
    }
    return `\n- ${body}`;
  });
  return s;
}

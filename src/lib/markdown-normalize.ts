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
 * `stripAuthoringEscapes` turns typed `\n` / `\r` into real line breaks so readers never see
 * the two-character escape (skipped when it looks like `X:\` + `n` in a Windows path).
 *
 * Reader page breaks use `[[[PAGE]]]` on its own line (see `page-break.ts`); legacy `\n---\n`
 * still splits old posts. A whole line of only `---` (or `[[[BR]]]`) becomes extra paragraph space
 * inside a page so it does not steal the agenda line break.
 *
 * Repairs pasted one-line outlines: `### Agenda Topic- Next- …`, plain `Agenda Topic- …`,
 * hyphen-separated phrases (including spaces around `-`), and en/em dashes from Word.
 *
 * Hyphen splitting never runs on list or heading lines — otherwise `politics-Long` inside
 * `- **Personality politics- Long-term…**` breaks Markdown and collapses to one bullet.
 */

/**
 * Turn literal `\n`, `\r`, `\r\n`, and `\\n` into real newlines so they never show as text
 * on the public site. Does not touch `X:\n` (e.g. `c:\new\...` path segments).
 */
export function stripAuthoringEscapes(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\u2028|\u2029/g, "\n");
  s = s.replace(/\\r\\n/g, "\n");
  s = s.replace(/\\\\n/g, "\n");
  s = s.replace(/\\r/g, "\n");
  s = s.replace(/\\n/g, (match, offset, str) => {
    if (offset >= 2) {
      const window = str.slice(offset - 2, offset + 1);
      if (/[A-Za-z]:\\/.test(window)) {
        return match;
      }
    }
    return "\n";
  });
  return s;
}

/**
 * This exact run-on agenda paste (one line or newline only after "Agenda") often survives
 * generic hyphen rules and renders as a single HTML paragraph. Rewrite to real Markdown.
 */
function repairAgendaPersonalityOutline(s: string): string {
  const replacement =
    "### Agenda\n\n- **Personality politics**\n- **Long-term development**\n- **Clan issues**";
  const sp = /[\s\u00A0\u202F]+/;
  const spOpt = /[\s\u00A0\u202F]*/;
  const runOn =
    `Agenda(?:${sp.source}|\\n+)Personality${sp.source}politics${spOpt.source}-${spOpt.source}Long(?:-|\\s)term${spOpt.source}-${spOpt.source}development${spOpt.source}-${spOpt.source}Clan${sp.source}issues\\.?`;
  const re1 = new RegExp(runOn, "gi");
  const re2 =
    /\bAgenda\s+Personality\s+politics\s*-\s*Long(?:-|\s+)term\s*-\s*development\s*-\s*Clan\s+issues\.?\b/gi;
  let out = s.replace(re1, replacement);
  out = out.replace(re2, replacement);
  return out;
}

/** "a - B - C" style on one line; needs 2+ hyphen joints so "January - February" is untouched. */
function splitHyphenOutlineLine(line: string): string {
  const joints = line.match(/\w+\s*-\s*[A-Z]/g);
  if (!joints || joints.length < 2) {
    return line;
  }
  let out = line;
  for (let pass = 0; pass < 24; pass++) {
    const next = out.replace(/\b(\w+)\s*-\s*([A-Z][a-z]{2,})\b/g, "$1\n$2");
    if (next === out) break;
    out = next;
  }
  return out;
}

function shouldSkipHyphenHeuristics(line: string): boolean {
  const t = line.trimStart();
  return /^[-*]\s/.test(t) || /^#{1,6}\s/.test(t) || /^>\s/.test(t);
}

/** `politics-Long-term` style breaks — only on plain (non-list, non-heading) lines. */
function applyTightHyphenBreaks(line: string): string {
  if (shouldSkipHyphenHeuristics(line)) {
    return line;
  }
  let out = line;
  for (let pass = 0; pass < 16; pass++) {
    const next = out.replace(/(\w{4,})-([A-Z][a-z]{2,})\b/g, "$1\n$2");
    if (next === out) break;
    out = next;
  }
  return out;
}

export function normalizeMarkdownSource(raw: string): string {
  let s = stripAuthoringEscapes(raw);
  s = s.replace(/^\uFEFF/, "");
  s = s.replace(/\u00A0/g, " ");
  s = s.replace(/\u202F/g, " ");
  s = s.replace(/^[\u2022\u2023]\s*/gm, "- ");
  // En dash / em dash / other dash chars (Word, Unicode) → ASCII hyphen
  s = s.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-");
  // GFM needs a blank line before a list when it immediately follows a heading (tight MDX/md parsing).
  s = s.replace(/(^|\n)(#{1,6}\s[^\n]+)\n(?=[-*+]\s|\d+\.\s)/g, "$1$2\n\n");
  // Reader pages use [[[PAGE]]]; a whole line of --- is treated as a forced paragraph gap (not a page split).
  s = s.replace(/^\s*\[\[\[BR\]\]\]\s*$/gm, "\n\n");
  s = s.replace(/^\s*-{3,}\s*$/gm, "\n\n");

  s = repairAgendaPersonalityOutline(s);

  // Standalone "Agenda" on its own line (no #) → markdown heading
  s = s.replace(/^\s*Agenda\s*$/m, "### Agenda");

  // "### Agenda Personality politics- ..." on one line → heading + blank line + body
  s = s.replace(/^(#{1,6}\s+\S+)\s+(.+)$/gm, (full, headingStart, rest) => {
    if (rest.includes("\n") || /^\s*[-*]\s/.test(rest.trim())) {
      return full;
    }
    if (/\w+-\s*[A-Z]/.test(rest)) {
      return `${headingStart}\n\n${rest}`;
    }
    return full;
  });
  // Single-line: "Agenda Personality politics - Long-term ..." (spaces around hyphens in tail)
  if (!/\n/.test(s) && /^\s*Agenda\s+/i.test(s) && !/^\s*#/.test(s.trim())) {
    const rest = s.replace(/^\s*Agenda\s+/i, "").trimStart();
    const joints = rest.match(/\w+\s*-\s*[A-Z]/g);
    if (joints && joints.length >= 2) {
      s = `### Agenda\n\n${splitHyphenOutlineLine(rest)}`;
    }
  }

  // Hyphen outline / tight-hyphen passes: never on list or heading lines (protects `- **…**` bullets)
  s = s
    .split("\n")
    .map((line) => {
      if (shouldSkipHyphenHeuristics(line)) {
        return line;
      }
      return applyTightHyphenBreaks(splitHyphenOutlineLine(line));
    })
    .join("\n");

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

  s = repairAgendaPersonalityOutline(s);
  return stripAuthoringEscapes(s);
}

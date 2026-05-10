/** Email shape — loose but practical. */
export function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** For tel: links — keep leading + and digits only. */
export function toTelHref(raw: string): string {
  const t = raw.trim();
  const hasPlus = t.startsWith("+");
  const digits = t.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return hasPlus ? `+${digits.replace(/^\+/, "")}` : digits;
}

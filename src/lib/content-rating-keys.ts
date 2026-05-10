/** Allowed chars for rating item keys (e.g. brief:slug, idea:slug). */
const ITEM_KEY_REGEX = /^[a-zA-Z0-9_:.-]{1,200}$/;

export const RATING_VISITOR_COOKIE = "doctrine_rating_vid";

export function isValidRatingItemKey(key: string): boolean {
  return ITEM_KEY_REGEX.test(key);
}

export function parseRatingItemKeysParam(raw: string | null, max = 80): string[] {
  if (!raw?.trim()) {
    return [];
  }
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && isValidRatingItemKey(k));
  return [...new Set(keys)].slice(0, max);
}

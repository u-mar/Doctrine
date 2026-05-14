const COOKIE_NAME = "admin_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const pad = (4 - (b64url.length % 4)) % 4;
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bytesToBase64Url(new Uint8Array(mac));
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Signed session token (Edge-safe) for httpOnly cookie. */
export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) {
    return null;
  }
  const exp = Date.now() + MAX_AGE_MS;
  const payload = JSON.stringify({ exp });
  const payloadPart = bytesToBase64Url(encoder.encode(payload));
  const sig = await hmacSha256Base64Url(secret, payloadPart);
  return `${payloadPart}.${sig}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes(".")) {
    return false;
  }
  const secret = getSigningSecret();
  if (!secret) {
    return false;
  }
  const dot = token.lastIndexOf(".");
  const payloadPart = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payloadPart || !sig) {
    return false;
  }
  const expected = await hmacSha256Base64Url(secret, payloadPart);
  if (!timingSafeEqualStrings(expected, sig)) {
    return false;
  }
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payloadPart));
    const data = JSON.parse(json) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export { COOKIE_NAME };

export function adminSessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(MAX_AGE_MS / 1000),
  };
}

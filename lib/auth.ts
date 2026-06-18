export const SESSION_COOKIE_NAME = "studytrack_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.APP_PASSWORD || "local-development-secret";
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return toHex(signature);
}

export async function createSessionToken() {
  const expiresAt = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  const signature = await sign(expiresAt);

  return `${expiresAt}.${signature}`;
}

export async function isValidSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [expiresAt, signature] = token.split(".");
  const expiresAtNumber = Number(expiresAt);

  if (!expiresAt || !signature || Number.isNaN(expiresAtNumber) || expiresAtNumber < Date.now()) {
    return false;
  }

  const expectedSignature = await sign(expiresAt);

  return constantTimeEqual(signature, expectedSignature);
}

export function getAppPassword() {
  return process.env.APP_PASSWORD?.trim();
}

export function shouldUseSecureCookie() {
  return process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
}

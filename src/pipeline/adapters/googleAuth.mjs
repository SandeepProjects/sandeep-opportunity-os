/**
 * Sandeep Opportunity OS — Google Service Account JWT & OAuth2 Auth Adapter
 *
 * Server-side only. Uses pure Node.js node:crypto to sign RS256 assertions
 * and exchange them for short-lived Google OAuth2 Bearer tokens.
 *
 * ZERO CLIENT LEAKAGE:
 * Never import or invoke this module from client-side React code.
 */
import crypto from "node:crypto";

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Normalizes private key formatting (e.g. unescaping literal \n if stored in environment).
 * @param {string} key
 * @returns {string}
 */
export function normalizePrivateKey(key) {
  if (!key || typeof key !== "string") return "";
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  return clean.replace(/\\n/g, "\n");
}

/**
 * Exchanges Google service account credentials for an OAuth2 Bearer access token.
 *
 * @param {Object} [options]
 * @param {string} [options.email]
 * @param {string} [options.privateKey]
 * @param {string[]} [options.scopes]
 * @param {Function} [options.fetchFn]
 * @returns {Promise<string>}
 */
export async function getGoogleAccessToken(options = {}) {
  const email = options.email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = options.privateKey || process.env.GOOGLE_PRIVATE_KEY;
  const privateKey = normalizePrivateKey(rawKey);
  const fetchFn = options.fetchFn || globalThis.fetch;
  const scopes = options.scopes || [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
  ];

  if (!email || !privateKey) {
    const error = new Error("MISSING_SERVICE_ACCOUNT_CREDENTIALS");
    error.code = "MISSING_SERVICE_ACCOUNT_CREDENTIALS";
    throw error;
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    const error = new Error("INVALID_SERVICE_ACCOUNT_PRIVATE_KEY");
    error.code = "INVALID_SERVICE_ACCOUNT_PRIVATE_KEY";
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt > now + 60 && !options.forceRefresh) {
    return cachedToken;
  }

  // Create JWT header and payload
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    })
  ).toString("base64url");

  let signature;
  try {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    signature = sign.sign(privateKey, "base64url");
  } catch (err) {
    const error = new Error(`RSA_SIGNING_FAILED: ${err.message}`);
    error.code = "RSA_SIGNING_FAILED";
    throw error;
  }

  const assertion = `${header}.${payload}.${signature}`;

  const res = await fetchFn("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(
      assertion
    )}`
  });

  if (!res.ok) {
    const errText = await res.text();
    const error = new Error(`Google OAuth2 token exchange failed: HTTP ${res.status} - ${errText}`);
    error.statusCode = res.status;
    error.responseBody = errText;
    throw error;
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600);
  return cachedToken;
}

export function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

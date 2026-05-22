/**
 * Email registration for `npx @boxdraw-ai/cli install`.
 *
 * Flow:
 *   1. CLI prompts for email.
 *   2. POST { email } to /signup on the boxdraw server.
 *   3. Server emails the user an API key (`bxd_<24 alphanumeric>`)
 *      via AWS SES.
 *   4. User pastes the key into the CLI prompt.
 *   5. CLI does a local shape check and writes the key into the
 *      agent configs.
 *
 * No separate "verify the token" round-trip — the email IS the
 * verification (only someone who controls the inbox can paste the
 * key back). The server-side endpoint is idempotent per email, so
 * re-running install with the same email re-sends the same key.
 */

/// Where /signup lives. Override at runtime for local dev:
///   BOXDRAW_API_BASE=http://127.0.0.1:3000 npx @boxdraw-ai/cli install
const DEFAULT_API_BASE = 'https://api.boxdraw.ai';

function apiBase(): string {
  const env = process.env.BOXDRAW_API_BASE;
  if (env && env.trim()) return env.trim().replace(/\/+$/, '');
  return DEFAULT_API_BASE;
}

export type RequestResult = { ok: true } | { ok: false; reason: string };

/// Trigger the "send me an API key" email. POSTs `{ email }` to
/// /signup; the server mails the key via SES. Idempotent — sending
/// the same email twice gets you the same key in your inbox a
/// second time, NOT a new key.
export async function requestApiKey(email: string): Promise<RequestResult> {
  if (!isPlausibleEmail(email)) {
    return { ok: false, reason: `"${email}" doesn't look like an email address` };
  }
  let resp: Response;
  try {
    resp = await fetch(`${apiBase()}/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch (e) {
    return { ok: false, reason: `couldn't reach boxdraw.ai (${(e as Error).message})` };
  }
  if (resp.ok) return { ok: true };
  // Pull the server's error message if it spoke JSON. Fall back to
  // generic copy keyed by status code.
  let serverMsg = '';
  try {
    const body = (await resp.json()) as { error?: string };
    if (body.error) serverMsg = body.error;
  } catch { /* not JSON */ }
  if (serverMsg) return { ok: false, reason: serverMsg };
  if (resp.status === 400) return { ok: false, reason: "email looked invalid to the server" };
  if (resp.status === 429) return { ok: false, reason: "rate-limited — try again in an hour" };
  if (resp.status === 503) return { ok: false, reason: "email delivery is being set up, try again shortly" };
  return { ok: false, reason: `${resp.status} ${resp.statusText}` };
}

export type ValidateResult = { ok: true; token: string } | { ok: false; reason: string };

/// Shape-check the pasted key. No round-trip — the next time the
/// key is actually used (drawing a diagram, fetching one), the
/// server validates it. Catching the obvious typos here saves the
/// user from a confusing failure later.
export function validateApiKey(pasted: string): ValidateResult {
  const s = pasted.trim();
  if (s.length === 0) return { ok: false, reason: 'no key entered' };
  if (!s.startsWith('bxd_')) return { ok: false, reason: 'key should start with `bxd_`' };
  const suffix = s.slice(4);
  if (suffix.length !== 24) return { ok: false, reason: `expected 24 chars after \`bxd_\`, got ${suffix.length}` };
  if (!/^[A-Za-z0-9]+$/.test(suffix)) return { ok: false, reason: 'key contains characters outside [A-Za-z0-9]' };
  return { ok: true, token: s };
}

/// Quick sanity check — not a real RFC validator. We just want to
/// catch the obvious typo before bothering the server with it.
function isPlausibleEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s.trim());
}

// Server-side store for registered Expo push tokens.
//
// In production we persist tokens in Vercel KV (Upstash Redis) via its REST API
// so no extra npm dependency is required. When KV env vars are absent (e.g. local
// `npm run dev`) we fall back to an in-memory Set so the flow still works for a
// single dev-server process. See .env.example for the required variables.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

/** Redis set key under which all push tokens are stored. */
const TOKENS_KEY = 'push:tokens';

/** True when Vercel KV is configured and we should use durable storage. */
const kvEnabled = Boolean(KV_URL && KV_TOKEN);

/** Process-local fallback used only when KV is not configured. */
const memoryStore = new Set<string>();

const TOKEN_PREFIXES = ['ExponentPushToken[', 'ExpoPushToken['];

/** Basic shape validation so we never store junk. */
export function isValidExpoToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PREFIXES.some((p) => token.startsWith(p));
}

/** Call the Upstash/Vercel KV REST API and return its parsed `result`. */
async function kvCommand<T>(...args: (string | number)[]): Promise<T> {
  const path = args.map((a) => encodeURIComponent(String(a))).join('/');
  const response = await fetch(`${KV_URL}/${path}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`KV request failed: HTTP ${response.status}`);
  }
  const body = (await response.json()) as { result: T };
  return body.result;
}

/** Register (or refresh) a push token. Idempotent — duplicates are ignored. */
export async function addToken(token: string): Promise<void> {
  if (kvEnabled) {
    await kvCommand('sadd', TOKENS_KEY, token);
    return;
  }
  memoryStore.add(token);
}

/** Remove a token (e.g. after Expo reports DeviceNotRegistered). */
export async function removeToken(token: string): Promise<void> {
  if (kvEnabled) {
    await kvCommand('srem', TOKENS_KEY, token);
    return;
  }
  memoryStore.delete(token);
}

/** Return all registered push tokens. */
export async function listTokens(): Promise<string[]> {
  if (kvEnabled) {
    return (await kvCommand<string[]>('smembers', TOKENS_KEY)) ?? [];
  }
  return [...memoryStore];
}

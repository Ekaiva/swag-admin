import type { PushPayload, PushResponse, TokensResponse } from './types';

/** Fetch all registered Expo push tokens for the recipient selector. */
export async function fetchTokens(): Promise<string[]> {
  const response = await fetch('/api/tokens');
 
  if (!response.ok) return [];
  const data = (await response.json()) as TokensResponse;
   console.log('FETCH TOKENS RESPONSE:', data);
  return data.tokens ?? [];
}

/** Thin fetch wrapper around the serverless function. Throws on HTTP failure. */
export async function sendNotification(payload: PushPayload): Promise<PushResponse> {
  const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as PushResponse;

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  return data;
}
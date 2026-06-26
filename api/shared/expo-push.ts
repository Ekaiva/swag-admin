// Server-side Expo Push API client. All interaction with Expo lives here so the
// serverless function stays thin. See: https://docs.expo.dev/push-notifications/sending-notifications/

export type Screen = '1' | '2' | '3';

export interface ExpoPushPayload {
  /** One or more recipient Expo push tokens. */
  tokens: string[];
  title: string;
  body: string;
  screen: Screen;
}

/** A single push ticket returned by Expo (success or per-message error). */
export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/** Shape of the JSON Expo returns from POST /push/send. */
export interface ExpoPushResponse {
  /** Expo returns an array of tickets, one per recipient token. */
  data?: ExpoPushTicket[];
  errors?: { code: string; message: string }[];
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Send one push notification through Expo and return Expo's typed response.
 * Throws only on transport / non-2xx errors; per-message failures (e.g.
 * DeviceNotRegistered) come back inside the resolved response so the caller
 * can surface them to the UI.
 */
export async function sendPushNotification(payload: ExpoPushPayload): Promise<ExpoPushResponse> {
  // Expo accepts a single message whose `to` is an array of tokens and returns
  // one ticket per token in `data`.
  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: payload.tokens,
      title: payload.title,
      body: payload.body,
      data: { screen: payload.screen },
      sound: 'default',
    }),
  });

  const result = (await response.json()) as ExpoPushResponse;
  console.log("EXPO PUSH RESPONSE:", result);

  if (!response.ok) {
    const reason = result.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(`Expo push request failed: ${reason}`);
  }

  return result;
}

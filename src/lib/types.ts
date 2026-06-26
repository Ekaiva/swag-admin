// Shared client-side types. The wire payload mirrors what api/send-notification.ts expects.

export type Screen = '1' | '2' | '3';

export interface PushPayload {
  /** A single explicit recipient token (used when sendToAll is false). */
  token?: string;
  /** When true, the server sends to every registered token. */
  sendToAll?: boolean;
  title: string;
  body: string;
  screen: Screen;
}

/** A single push ticket returned by Expo (success or per-message error). */
export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Response from our /api/send-notification function. On success it forwards
 * Expo's body ({ data } / { errors }). On failure our wrapper adds { error }.
 */
export interface PushResponse {
  data?: PushTicket[];
  errors?: { code: string; message: string }[];
  error?: string;
  /** Number of devices the notification was sent to. */
  recipientCount?: number;
}

/** Response from GET /api/tokens. */
export interface TokensResponse {
  tokens?: string[];
  error?: string;
}

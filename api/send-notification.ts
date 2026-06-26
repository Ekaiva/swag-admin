import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendPushNotification, type Screen } from "./shared/expo-push.js";
import { listTokens } from "./shared/token-store.js";

const VALID_SCREENS: Screen[] = ['1', '2', '3'];

interface SendBody {
  /** Explicit recipient token(s). Ignored when `sendToAll` is true. */
  token?: string;
  tokens?: string[];
  /** When true, send to every registered token in the store. */
  sendToAll?: boolean;
  title?: string;
  body?: string;
  screen?: Screen;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, tokens, sendToAll, title, body, screen } = (req.body ?? {}) as SendBody;

  if (!title || !body || !screen) {
    return res.status(400).json({ error: 'Missing required fields: title, body, screen' });
  }
  if (!VALID_SCREENS.includes(screen)) {
    return res.status(400).json({ error: "screen must be '1', '2', or '3'" });
  }

  // Resolve the recipient list: all registered tokens, an explicit array, or a single token.
  let recipients: string[];
  if (sendToAll) {
    recipients = await listTokens();
  } else if (Array.isArray(tokens) && tokens.length > 0) {
    recipients = tokens;
  } else if (token) {
    recipients = [token];
  } else {
    recipients = [];
  }

  if (recipients.length === 0) {
    return res.status(400).json({
      error: sendToAll ? 'No registered tokens to send to.' : 'A target token is required.',
    });
  }

  try {
    const result = await sendPushNotification({ tokens: recipients, title, body, screen });
    return res.status(200).json({ ...result, recipientCount: recipients.length });
  } catch (err) {
  console.error("SEND NOTIFICATION ERROR:", err);

  const message =
    err instanceof Error ? err.message : String(err);

  return res.status(500).json({
    error: message,
  });
}
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addToken, isValidExpoToken, listTokens } from './shared/token-store';

// CORS — the Expo app registers its token from a different origin.
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // POST /api/tokens — register a device's Expo push token.
    if (req.method === 'POST') {
      const { token } = (req.body ?? {}) as { token?: string };
      if (!isValidExpoToken(token)) {
        return res.status(400).json({ error: 'A valid Expo push token is required.' });
      }
      await addToken(token);
      return res.status(200).json({ ok: true });
    }

    // GET /api/tokens — list all registered tokens for the admin UI.
    if (req.method === 'GET') {
      const tokens = await listTokens();
      return res.status(200).json({ tokens });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error handling tokens';
    return res.status(500).json({ error: message });
  }
}

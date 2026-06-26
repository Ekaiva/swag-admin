import { useState } from 'react';
import { sendNotification } from '../lib/api';
import type { PushPayload, PushResponse } from '../lib/types';

interface SendState {
  loading: boolean;
  response: PushResponse | null;
  error: string | null;
}

const INITIAL: SendState = { loading: false, response: null, error: null };

/** Owns submit lifecycle state (loading / success / error) for the form. */
export function useSendNotification() {
  const [state, setState] = useState<SendState>(INITIAL);

  async function send(payload: PushPayload) {
    setState({ loading: true, response: null, error: null });
    try {
      const response = await sendNotification(payload);
      setState({ loading: false, response, error: null });
    } catch (err) {
      
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      setState({ loading: false, response: null, error: message });
    }
  }

  return { ...state, send };
}

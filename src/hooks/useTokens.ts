import { useCallback, useEffect, useState } from 'react';
import { fetchTokens } from '../lib/api';

interface TokensState {
  tokens: string[];
  loading: boolean;
  error: string | null;
}

const INITIAL: TokensState = { tokens: [], loading: true, error: null };

/** Loads the list of registered Expo push tokens for the recipient selector. */
export function useTokens() {
  const [state, setState] = useState<TokensState>(INITIAL);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const tokens = await fetchTokens();
      setState({ tokens, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tokens';
      setState({ tokens: [], loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}

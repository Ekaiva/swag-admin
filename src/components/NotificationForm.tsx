import { useState, type FormEvent } from 'react';
import type { PushPayload, Screen } from '../lib/types';
import { useTokens } from '../hooks/useTokens';

// Screen options map to the app's tabs via the data.screen field the
// notification handler reads to deep-navigate.
const SCREENS: { value: Screen; label: string }[] = [
  { value: '1', label: 'Screen 1 — Home' },
  { value: '2', label: 'Screen 2 — Discover' },
  { value: '3', label: 'Screen 3 — Profile' },
];

const TOKEN_PREFIXES = ['ExponentPushToken[', 'ExpoPushToken['];

// Special <select> sentinels that aren't real tokens.
const ALL = '__all__';
const MANUAL = '__manual__';

interface Props {
  disabled: boolean;
  onSubmit: (payload: PushPayload) => void;
}

export function NotificationForm({ disabled, onSubmit }: Props) {
  const { tokens, loading: tokensLoading, error: tokensError, reload } = useTokens();
  const [recipient, setRecipient] = useState<string>(ALL);
  const [manualToken, setManualToken] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [screen, setScreen] = useState<Screen>('1');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (recipient === ALL) {
      setError(null);
      onSubmit({ sendToAll: true, title: title.trim(), body: body.trim(), screen });
      return;
    }

    const token = (recipient === MANUAL ? manualToken : recipient).trim();
    if (!token) {
      setError('Push token is required.');
      return;
    }
    if (!TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix))) {
      setError('Token must start with "ExponentPushToken[" or "ExpoPushToken[".');
      return;
    }

    setError(null);
    onSubmit({ token, title: title.trim(), body: body.trim(), screen });
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span>
          Recipient
          <button type="button" className="link-button" onClick={() => void reload()}>
            refresh
          </button>
        </span>
        <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
          <option value={ALL}>
            Please selct token 
          </option>
          {tokens.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={MANUAL}>Enter token manually…</option>
        </select>
      </label>

      {recipient === MANUAL && (
        <label className="field">
          <span>Expo push token</span>
          <input
            type="text"
            placeholder="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      )}

      {tokensError && <p className="field-error">Could not load tokens: {tokensError}</p>}

      <label className="field">
        <span>Title</span>
        <input
          type="text"
          placeholder="Notification title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Body</span>
        <textarea
          placeholder="Notification message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
        />
      </label>

      <label className="field">
        <span>Target screen</span>
        <select value={screen} onChange={(e) => setScreen(e.target.value as Screen)}>
          {SCREENS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={disabled}>
        {disabled ? 'Sending…' : 'Send notification'}
      </button>
    </form>
  );
}

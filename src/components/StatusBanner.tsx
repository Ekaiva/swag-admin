import type { PushResponse } from '../lib/types';

interface Props {
  loading: boolean;
  response: PushResponse | null;
  error: string | null;
}

/** Renders the outcome of the last send: network error, Expo error, or success. */
export function StatusBanner({ loading, response, error }: Props) {
  if (loading) {
    return <div className="banner banner-info">Sending notification…</div>;
  }

  if (error) {
    return <div className="banner banner-error">Request failed: {error}</div>;
  }

  if (!response) {
    return null;
  }

  // Expo reports per-message problems via each ticket's status (or errors[]).
  const tickets = response.data ?? [];
  const errorCount = tickets.filter((t) => t.status === 'error').length;
  const okCount = tickets.length - errorCount;
  const isError =
    (response.errors?.length ?? 0) > 0 || (tickets.length > 0 && okCount === 0);

  if (isError) {
    const message =
      tickets.find((t) => t.status === 'error')?.message ??
      response.errors?.[0]?.message ??
      'Expo rejected the notification.';
    return (
      <div className="banner banner-error">
        <strong>Push not delivered:</strong> {message}
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    );
  }

  const total = response.recipientCount ?? tickets.length;
  return (
    <div className="banner banner-success">
      <strong>Notification accepted by Expo.</strong>
      <span>
        {' '}
        Delivered to {okCount}/{total} device{total === 1 ? '' : 's'}
        {errorCount > 0 ? ` (${errorCount} failed)` : ''}.
      </span>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
}

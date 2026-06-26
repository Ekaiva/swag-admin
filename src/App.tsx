import { NotificationForm } from './components/NotificationForm';
import { StatusBanner } from './components/StatusBanner';
import { useSendNotification } from './hooks/useSendNotification';

export default function App() {
  const { loading, response, error, send } = useSendNotification();

  return (
    <main className="container">
      <header className="header">
        <h1>Push Notification Admin</h1>
        <p>Send an Expo push notification to a device and deep-link it to a screen.</p>
      </header>

      <section className="card">
        <NotificationForm disabled={loading} onSubmit={send} />
        <StatusBanner loading={loading} response={response} error={error} />
      </section>
    </main>
  );
}

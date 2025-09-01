import { useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';

function Toast({ id, message }: { id: number; message: string }) {
  const { dismiss } = useWebSocket();
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), 3000);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return (
    <div className="bg-primary text-white px-4 py-2 rounded shadow">
      {message}
    </div>
  );
}

export default function Toasts() {
  const { toasts } = useWebSocket();
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <Toast key={t.id} id={t.id} message={t.message} />
      ))}
    </div>
  );
}

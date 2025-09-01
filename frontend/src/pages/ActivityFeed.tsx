import { useEffect, useState } from 'react';
import { api } from '../api';

type Event = {
  id: string;
  type: string;
  client_id: string | null;
  data: any;
  created_at: string;
};

export default function ActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);

  const fetchFeed = () =>
    api<{ events: Event[] }>(`/api/activity/feed`).then((d) => setEvents(d.events));

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/clients/');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'client.tagged' || data.type === 'client.note.added') {
          const evt: Event = {
            id: crypto.randomUUID(),
            type: data.type,
            client_id: data.client_id || null,
            data: data,
            created_at: new Date().toISOString(),
          };
          setEvents((ev) => [evt, ...ev].slice(0, 50));
        }
      } catch (err) {
        console.error(err);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Activity Feed</h1>
      <ul className="space-y-1">
        {events.map((e) => (
          <li key={e.id} className="border-b pb-1">
            {e.type === 'client.tagged' && (
              <span>Client {e.client_id} tagged: {e.data.tags.join(', ')}</span>
            )}
            {e.type === 'client.note.added' && (
              <span>
                Client {e.client_id} note by {e.data.note.author}: {e.data.note.text}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

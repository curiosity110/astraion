import { useEffect, useState } from 'react';
import { api } from '../api';

type Summary = {
  total_clients: number;
  total_trips: number;
  active_reservations: number;
  seats_available_today: number;
};

type Trip = {
  id: string;
  trip_date: string;
  destination: string;
  links?: Record<string, string>;
};

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  links?: Record<string, string>;
};

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const fetchAll = () => {
    api<Summary>('/api/dashboard/summary').then(setSummary);
    api<{ trips: Trip[] }>('/api/dashboard/upcoming-trips').then((d) => setTrips(d.trips));
    api<{ clients: Client[] }>('/api/dashboard/recent-clients').then((d) => setClients(d.clients));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard/');
    ws.onmessage = fetchAll;
    return () => ws.close();
  }, []);

  if (!summary) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-primary-50 rounded">
          <div className="text-sm">Clients</div>
          <div className="text-2xl font-semibold">{summary.total_clients}</div>
        </div>
        <div className="p-4 bg-primary-50 rounded">
          <div className="text-sm">Trips</div>
          <div className="text-2xl font-semibold">{summary.total_trips}</div>
        </div>
        <div className="p-4 bg-primary-50 rounded">
          <div className="text-sm">Active Reservations</div>
          <div className="text-2xl font-semibold">{summary.active_reservations}</div>
        </div>
        <div className="p-4 bg-primary-50 rounded">
          <div className="text-sm">Seats Available Today</div>
          <div className="text-2xl font-semibold">{summary.seats_available_today}</div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Upcoming Trips</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border">
            <thead>
              <tr>
                <th className="px-2">Date</th>
                <th className="px-2">Destination</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="odd:bg-gray-50 hover:bg-gray-100">
                  <td className="px-2">{t.trip_date}</td>
                  <td className="px-2">{t.destination}</td>
                  <td className="px-2">
                    <a className="text-primary underline" href={t.links?.['ui.self'] || `/trips/${t.id}`}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Recent Clients</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border">
            <thead>
              <tr>
                <th className="px-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="odd:bg-gray-50 hover:bg-gray-100">
                  <td className="px-2">
                    <a className="text-primary underline" href={c.links?.['ui.self'] || `/clients/${c.id}`}>
                      {c.first_name} {c.last_name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

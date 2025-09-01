import { useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

type Trip = {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  links?: Record<string, string>;
};

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTrips = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    api<Trip[]>(`/api/trips/?${params.toString()}`)
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, [destination, dateFrom, dateTo]);

  useEffect(() => {
    const handler = () => fetchTrips();
    window.addEventListener('ws-message', handler);
    return () => window.removeEventListener('ws-message', handler);
  }, [destination, dateFrom, dateTo]);

  return (
    <Layout title="Trips" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trips' }]}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <input
          className="border p-2"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          className="border p-2"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/trips/export?format=csv`}>
          Export CSV
        </a>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/trips/export?format=json`}>
          Export JSON
        </a>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div>No trips scheduled yet.</div>
      ) : (
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
                    <a className="text-primary underline" href={t.links?.['ui.self'] || `/trips/${t.id}`}>
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

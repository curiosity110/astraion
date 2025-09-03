import { useEffect, useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';
import Button from '../components/Button';
import InfoChip from '../components/InfoChip';
import CapacityBar from '../components/CapacityBar';
import ThemeToggle from '../components/ThemeToggle';

interface Trip {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  capacity: number;
  booked: number;
  status: string;
  links?: Record<string, string>;
}

const globalStyles = `
  :root {
    --shadow-cosmic: 0 4px 12px rgba(0,0,0,0.1);
    --gradient-cosmic: linear-gradient(135deg, hsl(252 100% 67%), hsl(216 100% 50%));
    --gradient-stellar: linear-gradient(135deg, hsl(171 100% 67%), hsl(203 100% 50%));
  }
`;

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    setLoading(true);
    api<any>(`/api/trips/?${params.toString()}`)
      .then((d) => setTrips(Array.isArray(d) ? d : d?.results || []))
      .finally(() => setLoading(false));
  }, [destination, dateFrom, dateTo]);

  const safeTrips: Trip[] = Array.isArray(trips) ? trips : [];

  return (
    <div className={`astraion ${theme}`}>
      <style>{globalStyles}</style>
      <Layout title="Trips" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trips' }]}> 
        <div className="flex justify-end"><ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} /></div>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="border p-2 flex-1 rounded-xl"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <input
            className="border p-2 rounded-xl"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            className="border p-2 rounded-xl"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="space-y-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : safeTrips.length === 0 ? (
          <div className="mt-4">No trips scheduled yet.</div>
        ) : (
          <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeTrips.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl p-4 shadow-[var(--shadow-cosmic)] bg-white dark:bg-gray-900 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">
                    {t.origin} → {t.destination}
                  </h3>
                  <InfoChip label={t.status} variant={t.status === 'CANCELLED' ? 'danger' : 'success'} />
                </div>
                <p className="text-sm text-gray-500">{t.trip_date}</p>
                <CapacityBar used={t.booked ?? 0} total={t.capacity ?? 0} />
                <Button
                  className="mt-2"
                  onClick={() => (window.location.href = t.links?.['ui.self'] || `/trips/${t.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </Layout>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';

type Trip = {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  links?: Record<string, string>;
};

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    api<Trip[]>('/api/trips/').then(setTrips).catch(() => setTrips([]));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Trips</h1>
      <ul className="space-y-2">
        {trips.map((t) => (
          <li key={t.id} className="border p-2 rounded">
            <div>{t.trip_date} {t.origin} → {t.destination}</div>
            <a className="text-primary underline" href={t.links?.['ui.self'] || `/trips/${t.id}`}>View</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

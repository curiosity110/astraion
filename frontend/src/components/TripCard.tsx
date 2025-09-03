import { useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { api } from '../api';

export interface Trip {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  departure_time?: string | null;
  price?: number;
  status: string;
  links?: Record<string, string>;
}

export default function TripCard({ trip, wrap = true }: { trip: Trip; wrap?: boolean }) {
  const [capacity, setCapacity] = useState<number | null>(null);
  useEffect(() => {
    api<{ stats: { total: number } }>(`/api/trips/${trip.id}/report`)
      .then((d) => setCapacity(d?.stats?.total ?? null))
      .catch(() => setCapacity(null));
  }, [trip.id]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString();
  const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '');

  const content = (
      <div className="grid grid-cols-2 gap-2 p-4 text-sm md:grid-cols-6">
        <InfoChip icon={CalendarDaysIcon} label="Date" value={fmtDate(trip.trip_date)} />
        <InfoChip icon={MapPinIcon} label="Route" value={`${trip.origin} → ${trip.destination}`} />
        {trip.departure_time && (
          <InfoChip icon={ClockIcon} label="Departure" value={fmtTime(trip.departure_time)} />
        )}
        <InfoChip icon={CurrencyDollarIcon} label="Price" value={`$${trip.price ?? 0}`} />
        {capacity !== null && <InfoChip icon={UsersIcon} label="Capacity" value={`${capacity} seats`} />}
        <div className="flex items-center justify-end">
          <span className="rounded-full border border-[hsl(var(--primary)/0.2)] px-2 py-1 text-xs">{trip.status}</span>
        </div>
      </div>
  );

  return wrap ? (
    <div className="rounded-2xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--card))] shadow-[var(--shadow-cosmic)]">
      {content}
    </div>
  ) : (
    content
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 opacity-80" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

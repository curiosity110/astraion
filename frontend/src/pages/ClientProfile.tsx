import { useEffect, useState } from 'react';
import { api } from '../api';

type Phone = { e164: string; label: string };
type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  passport_id: string;
  phones: Phone[];
  links?: Record<string, string>;
};
type Reservation = {
  id: string;
  trip: string;
  status: string;
  quantity: number;
  contact_client: string | null;
};

export default function ClientProfile({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    api<Client>(`/api/clients/${id}/`).then((c) => {
      setClient(c);
      const url = c.links?.['api.reservations'];
      if (url) {
        api<Reservation[]>(url).then(setReservations).catch(() => setReservations([]));
      }
    });
  }, [id]);

  if (!client) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
      <div className="space-y-1">
        <p>Email: {client.email}</p>
        <p>Passport: {client.passport_id}</p>
        <p>Phones: {client.phones?.map((p) => p.e164).join(', ')}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Reservations</h2>
        <ul className="list-disc pl-5">
          {reservations.map((r) => (
            <li key={r.id}>{r.trip} — {r.status} ({r.quantity})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

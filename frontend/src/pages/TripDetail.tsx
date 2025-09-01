import { useEffect, useState } from 'react';
import { api } from '../api';

type Trip = {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  links: Record<string, string>;
};

type SeatAssignment = {
  id: string;
  seat_no: number;
  reservation: string;
  passenger_client: string | null;
  first_name: string;
  last_name: string;
};

type Reservation = {
  id: string;
  trip: string;
  quantity: number;
  status: string;
};

export default function TripDetail({ id }: { id: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<SeatAssignment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchTrip = () => api<Trip>(`/api/trips/${id}/`).then(setTrip);
  const fetchSeats = (url?: string) => api<SeatAssignment[]>(url || `/api/trips/${id}/seats/`).then(setSeats);
  const fetchReservations = () =>
    api<Reservation[]>(`/api/reservations/`).then((data) => {
      setReservations(data.filter((r) => r.trip === id));
    });

  useEffect(() => {
    fetchTrip();
    fetchSeats();
    fetchReservations();
  }, [id]);

  useEffect(() => {
    if (!trip) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/trip/${id}/`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (['seat.assigned', 'seat.released', 'reservation.updated', 'client.updated'].includes(data.type)) {
          fetchSeats(trip.links?.['api.seats']);
          fetchReservations();
        }
      } catch {}
    };
    return () => ws.close();
  }, [id, trip]);

  if (!trip) return <div className="p-4">Loading...</div>;

  const seatCount = seats.length > 0 ? Math.max(...seats.map((s) => s.seat_no)) : 0;
  const seatNumbers = Array.from({ length: seatCount }, (_, i) => i + 1);

  const reserveSeat = async (clientId: string) => {
    if (!trip.links?.['api.reserve']) return;
    await api(trip.links['api.reserve'], {
      method: 'POST',
      body: JSON.stringify({ quantity: 1, contact_client_id: clientId, notes: '' }),
    });
    fetchSeats(trip.links['api.seats']);
    fetchReservations();
  };

  const cancelReservation = async (resId: string) => {
    await api(`/api/reservations/${resId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    fetchSeats(trip.links?.['api.seats']);
    fetchReservations();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Trip {trip.trip_date} {trip.origin} → {trip.destination}</h1>
      <div>
        <h2 className="text-xl font-semibold">Seat Map</h2>
        <div className="grid grid-cols-4 gap-2 w-64">
          {seatNumbers.map((n) => {
            const a = seats.find((s) => s.seat_no === n);
            return (
              <div key={n} className={`p-2 text-center border rounded ${a ? 'bg-primary text-white' : 'bg-white'}`}>{n}</div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Reservations</h2>
        <ul className="space-y-2">
          {reservations.filter((r) => r.status !== 'CANCELLED').map((r) => (
            <li key={r.id} className="border p-2 rounded flex justify-between">
              <span>{r.quantity} seat(s) - {r.status}</span>
              <button className="text-danger" onClick={() => cancelReservation(r.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Reserve a seat</h2>
        <ReserveForm onReserve={reserveSeat} />
      </div>
    </div>
  );
}

function ReserveForm({ onReserve }: { onReserve: (clientId: string) => void }) {
  const [clientId, setClientId] = useState('');
  return (
    <div className="flex gap-2">
      <input
        className="border p-2 flex-1"
        placeholder="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <button className="bg-primary text-white px-4" onClick={() => { onReserve(clientId); setClientId(''); }}>
        Reserve
      </button>
    </div>
  );
}

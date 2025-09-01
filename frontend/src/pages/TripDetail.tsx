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
  phone: string;
  passport_id: string;
  status: string;
};

type Reservation = {
  id: string;
  trip: string;
  quantity: number;
  status: string;
  contact_client: string | null;
};

export default function TripDetail({ id }: { id: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<SeatAssignment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatAssignment | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } catch (err) {
        console.error(err);
      }
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, trip]);

  if (!trip) return <div className="p-4">Loading...</div>;

  const seatCount = seats.length > 0 ? Math.max(...seats.map((s) => s.seat_no)) : 0;
  const seatNumbers = Array.from({ length: seatCount }, (_, i) => i + 1);

  const reserveSeat = async (clientId: string, quantity: number, override: boolean) => {
    if (!trip.links?.['api.reserve']) return;
    await api(trip.links['api.reserve'], {
      method: 'POST',
      body: JSON.stringify({ quantity, contact_client_id: clientId, notes: '' }),
      headers: override ? { 'X-Manager-Override': 'true' } : undefined,
    });
    fetchSeats(trip.links['api.seats']);
    fetchReservations();
  };

  const updateReservation = async (
    resId: string,
    data: Partial<{ quantity: number; status: string; contact_client_id: string | null }>,
    override: boolean,
  ) => {
    await api(`/api/reservations/${resId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: override ? { 'X-Manager-Override': 'true' } : undefined,
    });
    fetchSeats(trip.links?.['api.seats']);
    fetchReservations();
  };

  const cancelReservation = async (resId: string) => {
    await updateReservation(resId, { status: 'CANCELLED' }, false);
  };

  const updateAssignment = async (assignId: string, data: Partial<SeatAssignment>) => {
    await api(`/api/assignments/${assignId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
              <div
                key={n}
                className={`p-2 text-center border rounded cursor-pointer ${a ? 'bg-primary text-white' : 'bg-white'}`}
                onClick={() => setSelectedSeat(a || null)}
              >
                {n}
                {a && (
                  <div className="text-xs">
                    {a.first_name} {a.last_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {selectedSeat && (
          <SeatForm
            seat={selectedSeat}
            onSave={(id, data) => updateAssignment(id, data).then(() => setSelectedSeat(null))}
            onClose={() => setSelectedSeat(null)}
          />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold">Reservations</h2>
        <ul className="space-y-2">
          {reservations.filter((r) => r.status !== 'CANCELLED').map((r) => (
            <ReservationItem
              key={r.id}
              reservation={r}
              onSave={updateReservation}
              onCancel={cancelReservation}
            />
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

function ReserveForm({ onReserve }: { onReserve: (clientId: string, quantity: number, override: boolean) => Promise<void> }) {
  const [clientId, setClientId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [override, setOverride] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      await onReserve(clientId, quantity, override);
      setClientId('');
      setQuantity(1);
      setOverride(false);
      setError('');
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err.status === 409 && !override) {
        setError('Reservation exceeds free seats');
      } else {
        setError(err.message || 'Error');
      }
    }
  };

  return (
    <div className="space-y-2">
      {error && <div className="text-danger text-sm">{error}</div>}
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Contact Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <input
          type="number"
          className="border p-2 w-24"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button className="bg-primary text-white px-4" onClick={submit}>
          Reserve
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
        Override
      </label>
    </div>
  );
}

function ReservationItem({
  reservation,
  onSave,
  onCancel,
}: {
  reservation: Reservation;
  onSave: (
    id: string,
    data: Partial<{ quantity: number; status: string; contact_client_id: string | null }>,
    override: boolean,
  ) => Promise<void>;
  onCancel: (id: string) => void;
}) {
  const [quantity, setQuantity] = useState(reservation.quantity);
  const [status, setStatus] = useState(reservation.status);
  const [contact, setContact] = useState(reservation.contact_client || '');
  const [override, setOverride] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      await onSave(reservation.id, { quantity, status, contact_client_id: contact || null }, override);
      setError('');
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err.status === 409 && !override) {
        setError('Reservation exceeds free seats');
      } else {
        setError(err.message || 'Error');
      }
    }
  };

  return (
    <li className="border p-2 rounded space-y-2">
      {error && <div className="text-danger text-sm">{error}</div>}
      <div className="flex gap-2">
        <input
          type="number"
          className="border p-1 w-16"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <select className="border p-1" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <input
          className="border p-1 flex-1"
          placeholder="Contact Client ID"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <button className="bg-primary text-white px-2" onClick={save}>
          Save
        </button>
        <button className="text-danger px-2" onClick={() => onCancel(reservation.id)}>
          Cancel
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
        Override
      </label>
    </li>
  );
}

function SeatForm({
  seat,
  onSave,
  onClose,
}: {
  seat: SeatAssignment;
  onSave: (id: string, data: Partial<SeatAssignment>) => Promise<void>;
  onClose: () => void;
}) {
  const [seatNo, setSeatNo] = useState(seat.seat_no);
  const [first, setFirst] = useState(seat.first_name);
  const [last, setLast] = useState(seat.last_name);
  const [phone, setPhone] = useState(seat.phone);
  const [passport, setPassport] = useState(seat.passport_id);
  const [error, setError] = useState('');

  const save = async () => {
    try {
      await onSave(seat.id, { seat_no: seatNo, first_name: first, last_name: last, phone, passport_id: passport });
      setError('');
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || 'Error');
    }
  };

  return (
    <div className="mt-4 border p-2 rounded w-64 space-y-2">
      <h3 className="font-semibold">Seat {seat.seat_no}</h3>
      {error && <div className="text-danger text-sm">{error}</div>}
      <input className="border p-1 w-full" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name" />
      <input className="border p-1 w-full" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" />
      <input className="border p-1 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <input
        className="border p-1 w-full"
        value={passport}
        onChange={(e) => setPassport(e.target.value)}
        placeholder="Passport"
      />
      <input
        type="number"
        className="border p-1 w-full"
        value={seatNo}
        onChange={(e) => setSeatNo(Number(e.target.value))}
      />
      <div className="flex gap-2 justify-end">
        <button className="bg-primary text-white px-2" onClick={save}>
          Save
        </button>
        <button className="px-2" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

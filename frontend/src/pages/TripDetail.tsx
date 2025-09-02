import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

// Types are minimal; align to your existing payloads.
type SeatRow = {
  id: string;
  seat_no: number;
  assignment?: {
    id: string;
    status: string; // HOLD / CONFIRMED / CANCELLED
    passenger?: { id?: string; first_name?: string; last_name?: string; phone?: string };
    reservation_id?: string;
  } | null;
};
type Trip = {
  id: string;
  date: string;
  origin: string;
  destination: string;
  capacity: number;
  links?: {
    api?: { reserve?: string; manifest_csv?: string };
    ui?: { self?: string };
  };
};

export default function TripDetail() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newPax, setNewPax] = useState({ first_name: "", last_name: "", phone: "" });

  // 1) Load trip + seats
  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await api<Trip>(`/api/trips/${tripId}/`);
      setTrip(t);
      const s = await api<SeatRow[]>(`/api/trips/${tripId}/seats`); // use your existing seats link (adjust if different)
      setSeats(s);
      setLoading(false);
    })();
  }, [tripId]);

  // 2) Websocket live updates (no logic change; update seats state)
  useEffect(() => {
    if (!tripId) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/trip_${tripId}/`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (["seat.assigned", "seat.released", "reservation.updated"].includes(msg.type)) {
          // Re-fetch seats for simplicity (styling task; no logic changes)
          api<SeatRow[]>(`/api/trips/${tripId}/seats`).then(setSeats);
        }
      } catch (err) {
        console.error(err);
      }
    };
    return () => ws.close();
  }, [tripId]);

  // Derived stats for header
  const stats = useMemo(() => {
    const booked = seats.filter((s) => s.assignment && s.assignment.status !== "CANCELLED").length;
    const cancelled = seats.filter((s) => s.assignment?.status === "CANCELLED").length;
    const available = (trip?.capacity || 0) - booked;
    return { booked, cancelled, available };
  }, [seats, trip]);

  // Quick add: allocate 1 seat HOLD with inline pax data
  async function quickAddOne() {
    if (!trip) return;
    setAdding(true);
    try {
      // Use your POST /api/trips/{id}/reserve {quantity, notes?} then PATCH assignment to attach pax inline
      const reserveUrl = trip.links?.api?.reserve || `/api/trips/${trip.id}/reserve`;
      const r = await api<{ reservation_id: string; assigned_seats: number[] }>(reserveUrl, {
        method: "POST",
        body: JSON.stringify({ quantity: 1, notes: "Quick add" }),
      });
      const seatNo = r.assigned_seats[0];
      const seat = seats.find((s) => s.seat_no === seatNo);
      if (seat?.assignment?.id) {
        await api(`/api/assignments/${seat.assignment.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            first_name: newPax.first_name,
            last_name: newPax.last_name,
            phone: newPax.phone,
            status: "HOLD",
          }),
        });
      }
      const s2 = await api<SeatRow[]>(`/api/trips/${trip.id}/seats`);
      setSeats(s2);
      setNewPax({ first_name: "", last_name: "", phone: "" });
    } finally {
      setAdding(false);
    }
  }

  const visibleSeats = useMemo(() => {
    if (!query) return seats;
    const q = query.toLowerCase();
    return seats.filter((s) => {
      const p = s.assignment?.passenger;
      const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").toLowerCase();
      const phone = (p?.phone || "").toLowerCase();
      return (
        String(s.seat_no).includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        (s.assignment?.status || "").toLowerCase().includes(q)
      );
    });
  }, [seats, query]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {trip ? `${trip.origin} → ${trip.destination}` : "Trip"}
          </h1>
          <p className="text-white/60">
            {trip ? new Date(trip.date).toLocaleDateString() : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Booked" value={stats.booked} />
          <Stat label="Available" value={stats.available} />
          <Stat label="Cancelled" value={stats.cancelled} />
          {trip?.links?.api?.manifest_csv && (
            <a
              href={trip.links.api.manifest_csv}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Export CSV
            </a>
          )}
        </div>
      </header>

      {/* Quick Add Panel */}
      <div className="rounded-2xl border border-white/10 p-4 bg-white/5">
        <h2 className="font-semibold mb-3">Quick Add Passenger (assign 1 seat)</h2>
        <div className="flex flex-wrap gap-3">
          <input className="fld" placeholder="First name" value={newPax.first_name} onChange={(e)=>setNewPax(p=>({...p, first_name:e.target.value}))}/>
          <input className="fld" placeholder="Last name" value={newPax.last_name} onChange={(e)=>setNewPax(p=>({...p, last_name:e.target.value}))}/>
          <input className="fld" placeholder="Phone" value={newPax.phone} onChange={(e)=>setNewPax(p=>({...p, phone:e.target.value}))}/>
          <button
            onClick={quickAddOne}
            disabled={adding}
            className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add & Assign"}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter seats / name / phone / status"
              className="fld w-72"
            />
          </div>
        </div>
      </div>

      {/* Manifest table (THE LIST) */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse">
          <thead className="bg-white/5 text-white/70 sticky top-[64px]">
            <tr>
              <th className="text-left px-4 py-3">Seat</th>
              <th className="text-left px-4 py-3">Passenger</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-white/60">Loading…</td></tr>}
            {!loading && visibleSeats.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-white/60">No seats match.</td></tr>
            )}
            {visibleSeats.map((s) => {
              const p = s.assignment?.passenger;
              const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "-";
              const phone = p?.phone || "-";
              const status = s.assignment?.status || "FREE";
              const isFree = !s.assignment;

              return (
                <tr key={s.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{s.seat_no}</td>
                  <td className="px-4 py-3">{name}</td>
                  <td className="px-4 py-3">{phone}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      "inline-flex px-2 py-1 rounded-lg text-xs",
                      status === "FREE" ? "bg-white/10 text-white/70" :
                      status === "HOLD" ? "bg-warning/20 text-warning" :
                      status === "CANCELLED" ? "bg-danger/20 text-danger" :
                      "bg-success/20 text-success"
                    ].join(" ")}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isFree ? (
                      <button
                        className="btn-ghost"
                        onClick={async () => {
                          if (!trip) return;
                          await api<{ reservation_id: string; assigned_seats: number[] }>(
                            trip.links?.api?.reserve || `/api/trips/${trip.id}/reserve`,
                            { method: "POST", body: JSON.stringify({ quantity: 1, notes: `Assign seat ${s.seat_no}` }) }
                          );
                          // simple refresh
                          const s2 = await api<SeatRow[]>(`/api/trips/${trip.id}/seats`);
                          setSeats(s2);
                        }}
                      >
                        Assign
                      </button>
                    ) : (
                      <button
                        className="btn-ghost"
                        onClick={async () => {
                          if (!s.assignment?.id) return;
                          await api(`/api/assignments/${s.assignment.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: "CANCELLED" }) // soft release; no logic change server side
                          });
                          const s2 = await api<SeatRow[]>(`/api/trips/${trip!.id}/seats`);
                          setSeats(s2);
                        }}
                      >
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* tiny field class */}
      <style>{`
        .fld { background:#0b0b0b; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:.5rem .75rem; }
        .btn-ghost { padding:.5rem .75rem; border-radius:12px; background:rgba(255,255,255,.06); }
        .btn-ghost:hover { background:rgba(255,255,255,.12); }
      `}</style>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

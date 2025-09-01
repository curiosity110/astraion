import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Trip = {
  id: string;
  date: string;        // ISO
  origin: string;
  destination: string;
  capacity: number;
  stats?: { booked: number; available: number; cancelled: number };
  links?: { ui?: { self: string } };
};

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await api<Trip[]>("/api/trips/");
      setTrips(data);
      setLoading(false);
    })();
  }, []);

  const filtered = trips.filter(
    (t) =>
      t.destination.toLowerCase().includes(q.toLowerCase()) ||
      t.origin.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Trips</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search destination or origin"
          className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Route</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Booked</th>
              <th className="text-left px-4 py-3">Available</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-white/60">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-white/60">No trips.</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{t.origin} → {t.destination}</td>
                <td className="px-4 py-3">{t.capacity}</td>
                <td className="px-4 py-3">{t.stats?.booked ?? "-"}</td>
                <td className="px-4 py-3">{t.stats?.available ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/trips/${t.id}`}
                    className="inline-flex items-center px-3 py-2 rounded-xl bg-primary text-white hover:brightness-110"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

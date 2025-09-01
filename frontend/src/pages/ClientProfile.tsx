import { useEffect, useState } from "react";
import { api } from "../api";

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
type HistoryItem = {
  id: string;
  date: string;
  destination: string;
  reservation_id: string;
  seat_no: number | null;
  status: string;
};

export default function ClientProfile({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<"profile" | "history">("profile");

  const fetchClient = () =>
    api<Client>(`/api/clients/${id}/`).then((c) => {
      setClient(c);
      const url = c.links?.["api.reservations"];
      if (url) {
        api<Reservation[]>(url)
          .then(setReservations)
          .catch(() => setReservations([]));
      }
    });
  const fetchHistory = () =>
    api<{ trips: HistoryItem[] }>(`/api/clients/${id}/history/`).then((d) =>
      setHistory(d.trips)
    );

  useEffect(() => {
    fetchClient();
    fetchHistory();
  }, [id]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/clients/");
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "client.updated" && data.client_id === id) {
          fetchClient();
          fetchHistory();
        }
        if (
          data.type === "reservation.updated" &&
          data.client_ids?.includes(id)
        ) {
          fetchHistory();
        }
      } catch (err) {
        console.error(err);
      }
    };
    return () => ws.close();
  }, [id]);

  if (!client) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        {client.first_name} {client.last_name}
      </h1>
      <div className="flex gap-4 border-b">
        <button
          className={`p-2 ${tab === "profile" ? "border-b-2" : ""}`}
          onClick={() => setTab("profile")}
        >
          Profile
        </button>
        <button
          className={`p-2 ${tab === "history" ? "border-b-2" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>
      {tab === "profile" ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <p>Email: {client.email}</p>
            <p>Passport: {client.passport_id}</p>
            <p>Phones: {client.phones?.map((p) => p.e164).join(", ")}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Reservations</h2>
            <ul className="list-disc pl-5">
              {reservations.map((r) => (
                <li key={r.id}>
                  {r.trip} — {r.status} ({r.quantity})
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Trip History</h2>
          <table className="min-w-full text-left border">
            <thead>
              <tr>
                <th className="px-2">Date</th>
                <th className="px-2">Destination</th>
                <th className="px-2">Seat</th>
                <th className="px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={`${h.reservation_id}-${h.seat_no}`}>
                  <td className="px-2">{h.date}</td>
                  <td className="px-2">{h.destination}</td>
                  <td className="px-2">{h.seat_no ?? "-"}</td>
                  <td className="px-2">{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

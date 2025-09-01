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
  tags: string[];
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
type Note = {
  id: string;
  author: string;
  text: string;
  created_at: string;
};

export default function ClientProfile({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTag, setNewTag] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");
  const [noteText, setNoteText] = useState("");
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
  const fetchNotes = () =>
    api<Note[]>(`/api/clients/${id}/notes/`).then(setNotes);

  const updateTags = (tags: string[]) =>
    api(`/api/clients/${id}/tags/`, {
      method: "PATCH",
      body: JSON.stringify({ tags }),
    }).then(fetchClient);

  const addTag = () => {
    if (!newTag || !client) return;
    updateTags([...(client.tags || []), newTag]);
    setNewTag("");
  };
  const removeTag = (t: string) => {
    if (!client) return;
    updateTags(client.tags.filter((x) => x !== t));
  };

  const addNote = () => {
    if (!noteText) return;
    api(`/api/clients/${id}/notes/`, {
      method: "POST",
      body: JSON.stringify({ author: noteAuthor, text: noteText }),
    }).then(() => {
      setNoteText("");
      fetchNotes();
    });
  };

  useEffect(() => {
    fetchClient();
    fetchHistory();
    fetchNotes();
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
        if (data.type === "client.tagged" && data.client_id === id) {
          fetchClient();
        }
        if (data.type === "client.note.added" && data.client_id === id) {
          fetchNotes();
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
            <h2 className="text-xl font-semibold">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {client.tags?.map((t) => (
                <span key={t} className="bg-gray-200 px-2 rounded">
                  {t} <button onClick={() => removeTag(t)}>x</button>
                </span>
              ))}
            </div>
            <div className="mt-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="border px-2"
              />
              <button
                className="ml-2 px-2 bg-primary text-white"
                onClick={addTag}
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Notes</h2>
            <ul className="list-disc pl-5">
              {notes.map((n) => (
                <li key={n.id}>
                  <b>{n.author}</b>: {n.text}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                placeholder="Author"
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                className="border px-2"
              />
              <input
                placeholder="Note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="border px-2 flex-1"
              />
              <button className="px-2 bg-primary text-white" onClick={addNote}>
                Add
              </button>
            </div>
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

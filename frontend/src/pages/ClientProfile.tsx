import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

type Phone = { e164: string };
type Client = {
  id: string;
  first_name: string;
  last_name: string;
  phones?: Phone[];
  notes?: string;
};

export default function ClientProfile() {
  const { clientId } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", notes: "" });

  const load = useCallback(async () => {
    if (!clientId) return;
    const c = await api<Client>(`/api/clients/${clientId}/`);
    setClient(c);
    setForm({
      first_name: c.first_name || "",
      last_name: c.last_name || "",
      phone: c.phones?.[0]?.e164 || "",
      notes: c.notes || "",
    });
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!clientId) return;
    await api(`/api/clients/${clientId}/`, {
      method: "PATCH",
      body: JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        notes: form.notes,
        phones: form.phone ? [{ e164: form.phone }] : [],
      }),
    });
    setEditing(false);
    load();
  };

  if (!client) return <div className="text-white/60">Loading…</div>;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {client.first_name} {client.last_name}
        </h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110"
          >
            Edit
          </button>
        )}
      </header>

      {editing ? (
        <div className="space-y-3 max-w-md">
          <input className="fld w-full" value={form.first_name} onChange={(e)=>setForm(f=>({...f, first_name:e.target.value}))} placeholder="First name" />
          <input className="fld w-full" value={form.last_name} onChange={(e)=>setForm(f=>({...f, last_name:e.target.value}))} placeholder="Last name" />
          <input className="fld w-full" value={form.phone} onChange={(e)=>setForm(f=>({...f, phone:e.target.value}))} placeholder="Phone" />
          <textarea className="fld w-full" value={form.notes} onChange={(e)=>setForm(f=>({...f, notes:e.target.value}))} placeholder="Notes" />
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
            <button className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110" onClick={save}>Save</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p>Phone: {client.phones?.map(p=>p.e164).join(", ") || "-"}</p>
          <p>Notes: {client.notes || "-"}</p>
        </div>
      )}

      <style>{`
        .fld { background:#0b0b0b; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:.5rem .75rem; }
        .btn-ghost { padding:.5rem .75rem; border-radius:12px; background:rgba(255,255,255,.06); }
        .btn-ghost:hover { background:rgba(255,255,255,.12); }
      `}</style>
    </section>
  );
}

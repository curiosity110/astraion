import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  links?: { ui?: { self?: string } };
};

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api<Client[] | { results: Client[] }>(
      `/api/clients/?search=${encodeURIComponent(q)}`
    );
    const arr = Array.isArray(data) ? data : data?.results || [];
    setClients(arr);
    setLoading(false);
  }, [q]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    await api("/api/clients/", {
      method: "POST",
      body: JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        phones: form.phone ? [{ e164: form.phone }] : [],
      }),
    });
    setForm({ first_name: "", last_name: "", phone: "" });
    setShow(false);
    load();
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShow(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110"
          >
            Add
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={2} className="px-4 py-10 text-center text-white/60">Loading…</td></tr>
            )}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-10 text-center text-white/60">No clients.</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link to={`/clients/${c.id}`}>{c.first_name} {c.last_name}</Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/clients/${c.id}`}
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

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-2xl border border-white/10 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Add Client</h2>
            <input className="fld w-full" placeholder="First name" value={form.first_name} onChange={(e)=>setForm(f=>({...f, first_name:e.target.value}))}/>
            <input className="fld w-full" placeholder="Last name" value={form.last_name} onChange={(e)=>setForm(f=>({...f, last_name:e.target.value}))}/>
            <input className="fld w-full" placeholder="Phone" value={form.phone} onChange={(e)=>setForm(f=>({...f, phone:e.target.value}))}/>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110" onClick={submit}>Save</button>
            </div>
          </div>
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

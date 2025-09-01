import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { api } from '../api';
import Layout from '../components/Layout';

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  links?: Record<string, string>;
};

export default function ClientsList() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [passport, setPassport] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchClients = () => {
    setLoading(true);
    api<Client[]>(`/api/clients/?search=${encodeURIComponent(search)}`)
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  useEffect(() => {
    const handler = () => fetchClients();
    window.addEventListener('ws-message', handler);
    return () => window.removeEventListener('ws-message', handler);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setFirst('');
    setLast('');
    setPhone('');
    setPassport('');
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setFirst(c.first_name);
    setLast(c.last_name);
    setPhone('');
    setPassport('');
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!first) {
      setError('First name required');
      return;
    }
    const payload: any = { first_name: first, last_name: last, passport_id: passport, notes, phones: phone ? [{ e164: phone }] : [] };
    try {
      if (editing) {
        await api(`/api/clients/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/clients/', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchClients();
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || 'Error');
    }
  };

  const remove = async (id: string) => {
    await api(`/api/clients/${id}/`, { method: 'DELETE' });
    fetchClients();
  };

  return (
    <Layout title="Clients" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients' }]}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="bg-primary text-white px-4 py-2" onClick={openCreate}>
          Add Client
        </button>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/clients/export?format=csv`}>
          Export CSV
        </a>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/clients/export?format=json`}>
          Export JSON
        </a>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div>No clients found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border">
            <thead>
              <tr>
                <th className="px-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="odd:bg-gray-50 hover:bg-gray-100">
                  <td className="px-2 space-x-2">
                    <a className="text-primary underline" href={c.links?.['ui.self'] || `/clients/${c.id}`}>
                      {c.first_name} {c.last_name}
                    </a>
                    <button className="text-sm text-primary" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                    <button className="text-sm text-danger" onClick={() => remove(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white p-4 space-y-2 w-full max-w-sm">
          <Dialog.Title>{editing ? 'Edit Client' : 'Add Client'}</Dialog.Title>
          {error && <div className="text-danger text-sm">{error}</div>}
          <input className="border p-1 w-full" placeholder="First name" value={first} onChange={(e) => setFirst(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Last name" value={last} onChange={(e) => setLast(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Passport" value={passport} onChange={(e) => setPassport(e.target.value)} />
          <textarea className="border p-1 w-full" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="bg-primary text-white px-3 py-1" onClick={save}>
              Save
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </Layout>
  );
}

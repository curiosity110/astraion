import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { api } from '../api';
import Layout from '../components/Layout';

type Trip = {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
  links?: Record<string, string>;
};

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [date, setDate] = useState('');
  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');
  const [bus, setBus] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchTrips = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    api<Trip[]>(`/api/trips/?${params.toString()}`)
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, [destination, dateFrom, dateTo]);

  useEffect(() => {
    const handler = () => fetchTrips();
    window.addEventListener('ws-message', handler);
    return () => window.removeEventListener('ws-message', handler);
  }, [destination, dateFrom, dateTo]);

  const openCreate = () => {
    setEditing(null);
    setDate('');
    setDest('');
    setOrigin('');
    setBus('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (t: Trip) => {
    setEditing(t);
    setDate(t.trip_date);
    setDest(t.destination);
    setOrigin(t.origin);
    setBus('');
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!date || !dest || !origin || !bus) {
      setError('All fields required');
      return;
    }
    const payload = { trip_date: date, destination: dest, origin, bus };
    try {
      if (editing) {
        await api(`/api/trips/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/trips/', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchTrips();
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || 'Error');
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/trips/${id}/`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) {
      const err = e as { message?: string };
      alert(err.message || 'Cannot delete');
    }
  };

  const bulkAction = async (action: string) => {
    await api('/api/trips/bulk/', {
      method: 'POST',
      body: JSON.stringify({ ids: selected, action }),
    });
    setSelected([]);
    fetchTrips();
  };

  const importCsv = async () => {
    if (!csvFile) return;
    const form = new FormData();
    form.append('file', csvFile);
    await fetch('/api/trips/import/', { method: 'POST', body: form });
    setCsvFile(null);
    (document.getElementById('trip-csv') as HTMLInputElement).value = '';
    fetchTrips();
  };

  return (
    <Layout title="Trips" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trips' }]}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <input
          className="border p-2"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          className="border p-2"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <button className="bg-primary text-white px-4 py-2" onClick={openCreate}>
          Add Trip
        </button>
        <input id="trip-csv" type="file" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
        <button className="bg-primary text-white px-4 py-2" onClick={importCsv}>
          Import CSV
        </button>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/trips/export?format=csv`}>
          Export CSV
        </a>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/trips/export?format=json`}>
          Export JSON
        </a>
      </div>
      {selected.length > 0 && (
        <div className="my-2 space-x-2">
          <button className="bg-danger text-white px-2" onClick={() => bulkAction('cancel')}>
            Cancel Selected
          </button>
          <button className="bg-primary text-white px-2" onClick={() => bulkAction('export_manifests')}>
            Export Manifests
          </button>
        </div>
      )}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div>No trips scheduled yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border">
            <thead>
              <tr>
                <th className="px-2">
                  <input
                    type="checkbox"
                    checked={selected.length === trips.length}
                    onChange={(e) => setSelected(e.target.checked ? trips.map((t) => t.id) : [])}
                  />
                </th>
                <th className="px-2">Date</th>
                <th className="px-2">Destination</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="odd:bg-gray-50 hover:bg-gray-100">
                  <td className="px-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? [...selected, t.id] : selected.filter((id) => id !== t.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-2">{t.trip_date}</td>
                  <td className="px-2">{t.destination}</td>
                  <td className="px-2 space-x-2">
                    <a className="text-primary underline" href={t.links?.['ui.self'] || `/trips/${t.id}`}>
                      View
                    </a>
                    <button className="text-sm text-primary" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button className="text-sm text-danger" onClick={() => remove(t.id)}>
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
          <Dialog.Title>{editing ? 'Edit Trip' : 'Add Trip'}</Dialog.Title>
          {error && <div className="text-danger text-sm">{error}</div>}
          <input className="border p-1 w-full" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Destination" value={dest} onChange={(e) => setDest(e.target.value)} />
          <input className="border p-1 w-full" placeholder="Bus ID" value={bus} onChange={(e) => setBus(e.target.value)} />
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

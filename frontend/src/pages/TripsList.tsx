import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { api } from '../api';
import Layout from '../components/Layout';
import TripCard, { Trip } from '../components/TripCard';

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

  const fetchTrips = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    api<any>(`/api/trips/?${params.toString()}`)
      .then((d) => setTrips(Array.isArray(d) ? d : d?.results || []))
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

  const safeTrips: Trip[] = Array.isArray(trips) ? trips : [];

  const remove = async (id: string) => {
    try {
      await api(`/api/trips/${id}/`, { method: 'DELETE' });
      fetchTrips();
    } catch (e) {
      const err = e as { message?: string };
      alert(err.message || 'Cannot delete');
    }
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
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : safeTrips.length === 0 ? (
        <div>No trips scheduled yet.</div>
      ) : (
        <div className="space-y-4">
          {safeTrips.map((t) => (
            <div key={t.id}>
              <TripCard trip={t} />
              <div className="mt-2 flex gap-2 text-sm">
                <a className="text-primary underline" href={t.links?.['ui.self'] || `/trips/${t.id}`}>View</a>
                <button className="text-primary" onClick={() => openEdit(t)}>Edit</button>
                <button className="text-danger" onClick={() => remove(t.id)}>Delete</button>
              </div>
            </div>
          ))}
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

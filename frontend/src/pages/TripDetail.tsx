import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { useWebSocket } from '../components/WebSocketProvider';

// Types
interface Trip {
  id: string;
  trip_date: string;
  origin: string;
  destination: string;
}
interface Seat {
  id: string;
  seat_no: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  passport_id?: string;
  status: string;
}
interface Draft {
  first_name?: string;
  last_name?: string;
  phone?: string;
  passport_id?: string;
}

type Choice = 'link' | 'create' | 'inline';

export default function TripDetail({ id }: { id: string }) {
  const { push } = useWebSocket();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [filter, setFilter] = useState('');

  // group hold
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [holdQty, setHoldQty] = useState(1);
  const [holdNotes, setHoldNotes] = useState('');

  // bulk paste
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // popover for linking choices
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    draft: Draft;
    matches: Array<{ id: string; first_name?: string; last_name?: string; phone?: string }>;
    resolve: (choice: Choice, data?: { id: string }, remember?: boolean) => void;
  } | null>(null);

  useEffect(() => {
    fetchTrip();
    fetchSeats();
  }, [id]);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/trip_${id}/`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (
          ['seat.assigned', 'seat.released', 'reservation.updated', 'client.updated'].includes(
            data.type,
          )
        ) {
          fetchSeats();
        }
      } catch {
        /* ignore */
      }
    };
    return () => ws.close();
  }, [id]);

  const fetchTrip = () => api<Trip>(`/api/trips/${id}/`).then(setTrip);
  const fetchSeats = () => api<Seat[]>(`/api/trips/${id}/seats`).then(setSeats);

  const total = seats.length;
  const cancelled = seats.filter((s) => s.status === 'CANCELLED').length;
  const available = seats.filter((s) => s.status === 'FREE').length;
  const booked = total - available - cancelled;

  const updateSeatLocal = (id: string, field: keyof Draft, value: string) => {
    setSeats((ss) => ss.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const pickLinking = async (
    draft: Draft,
    anchor: HTMLElement | null,
  ): Promise<{ choice: Choice; clientId?: string }> => {
    const pref = sessionStorage.getItem('linkingPreference') as Choice | null;

    if (pref === 'inline') return { choice: 'inline' };
    if (pref === 'create') {
      const c = await createClient(draft);
      return { choice: 'create', clientId: c.id };
    }
    const q = (draft.phone || `${draft.first_name || ''} ${draft.last_name || ''}`.trim()).toString();
    const matches = await findMatches(q);
    return new Promise((res) => {
      const rect = anchor?.getBoundingClientRect();
      const x = rect ? rect.left : window.innerWidth / 2;
      const y = rect ? rect.bottom + window.scrollY : window.innerHeight / 2 + window.scrollY;
      setPopover({
        x,
        y,
        draft,
        matches,
        resolve: async (choice, data, remember) => {
          if (remember) sessionStorage.setItem('linkingPreference', choice);
          if (choice === 'create') {
            const c = await createClient(draft);
            res({ choice: 'create', clientId: c.id });
          } else if (choice === 'link') {
            res({ choice: 'link', clientId: data?.id });
          } else {
            res({ choice: 'inline' });
          }
          setPopover(null);
        },
      });
    });
  };

  const saveSeat = async (seat: Seat, anchor: HTMLElement | null) => {
    const draft: Draft = {
      first_name: seat.first_name,
      last_name: seat.last_name,
      phone: seat.phone,
      passport_id: seat.passport_id,
    };
    try {
      const result = await pickLinking(draft, anchor);
      if (result.choice === 'inline') {
        await api(`/api/assignments/${seat.id}`, {
          method: 'PATCH',
          body: JSON.stringify(draft),
        });
      } else if (result.clientId) {
        await api(`/api/assignments/${seat.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ passenger_client_id: result.clientId }),
        });
      }
      push('Saved ✓');
      fetchSeats();
    } catch (e) {
      push((e as Error).message || 'Error');
    }
  };

  const releaseSeat = async (id: string) => {
    await api(`/api/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    fetchSeats();
  };

  const assignOne = async () => {
    await api(`/api/trips/${id}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ quantity: 1 }),
    });
    fetchSeats();
  };

  const createHold = async (anchor: HTMLElement | null) => {
    try {
      const draft: Draft = {
        first_name: contactFirst,
        last_name: contactLast,
        phone: contactPhone,
      };
      const result = await pickLinking(draft, anchor);
      const body: Record<string, unknown> = { quantity: holdQty, notes: holdNotes };
      if (result.choice !== 'inline' && result.clientId) body.contact_client_id = result.clientId;
      await api(`/api/trips/${id}/reserve`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      push('Saved ✓');
      setContactFirst('');
      setContactLast('');
      setContactPhone('');
      setHoldQty(1);
      setHoldNotes('');
      fetchSeats();
    } catch (e) {
      push((e as Error).message || 'Error');
    }
  };

  const doBulk = async () => {
    const lines = bulkText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const free = seats.filter((s) => s.status === 'FREE');
    for (let i = 0; i < lines.length && i < free.length; i++) {
      const [first, last, phone, passport] = lines[i].split(/\s*,\s*/);
      const seat = free[i];
      const updated: Seat = {
        ...seat,
        first_name: first || '',
        last_name: last || '',
        phone: phone || '',
        passport_id: passport || '',
      };
      await saveSeat(updated, null);
    }
    setBulkMode(false);
    setBulkText('');
  };

  const filtered = seats.filter((s) => {
    const q = filter.toLowerCase();
    return (
      String(s.seat_no).includes(q) ||
      (s.first_name || '').toLowerCase().includes(q) ||
      (s.last_name || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.status || '').toLowerCase().includes(q)
    );
  });

  if (!trip) return <Layout title="Trip" />;

  return (
    <Layout
      title={`${trip.origin} → ${trip.destination} — ${trip.trip_date}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trips', href: '/trips' },
        { label: 'Manifest' },
      ]}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span>Total {total}</span>
          <span>Booked {booked}</span>
          <span>Available {available}</span>
          <span>Cancelled {cancelled}</span>
        </div>
        <a
          href={`/api/export/trips/${id}/manifest.csv`}
          className="bg-primary text-white px-3 py-2 rounded-xl"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 mt-4">
        <h2 className="font-semibold">Create Group Hold</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2"
            placeholder="First"
            value={contactFirst}
            onChange={(e) => setContactFirst(e.target.value)}
          />
          <input
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2"
            placeholder="Last"
            value={contactLast}
            onChange={(e) => setContactLast(e.target.value)}
          />
          <input
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2"
            placeholder="Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2"
            value={holdQty}
            onChange={(e) => setHoldQty(Number(e.target.value))}
          />
          <input
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 md:col-span-2"
            placeholder="Notes"
            value={holdNotes}
            onChange={(e) => setHoldNotes(e.target.value)}
          />
          <button
            className="bg-primary text-white rounded-xl px-3 py-2 md:col-span-2"
            onClick={(e) => createHold(e.currentTarget)}
          >
            Create Hold
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <input
          className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          className="bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2"
          onClick={() => setBulkMode((b) => !b)}
        >
          {bulkMode ? 'Close' : 'Bulk paste'}
        </button>
      </div>
      {bulkMode && (
        <div className="mt-2 space-y-2">
          <textarea
            className="w-full h-32 bg-neutral-900 border border-white/10 rounded-xl p-3"
            placeholder="First,Last,Phone,Passport\n..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button
            className="bg-primary text-white px-3 py-2 rounded-xl"
            onClick={doBulk}
          >
            Apply
          </button>
        </div>
      )}

      <div className="overflow-auto mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-white/70 sticky top-[64px]">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">First</th>
              <th className="p-2 text-left">Last</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Passport</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="odd:bg-white/5 hover:bg-white/10">
                <td className="p-2">{s.seat_no}</td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent focus:outline-none"
                    value={s.first_name || ''}
                    onChange={(e) => updateSeatLocal(s.id, 'first_name', e.target.value)}
                    onBlur={(e) => saveSeat(s, e.currentTarget)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent focus:outline-none"
                    value={s.last_name || ''}
                    onChange={(e) => updateSeatLocal(s.id, 'last_name', e.target.value)}
                    onBlur={(e) => saveSeat(s, e.currentTarget)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent focus:outline-none"
                    value={s.phone || ''}
                    onChange={(e) => updateSeatLocal(s.id, 'phone', e.target.value)}
                    onBlur={(e) => saveSeat(s, e.currentTarget)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent focus:outline-none"
                    value={s.passport_id || ''}
                    onChange={(e) => updateSeatLocal(s.id, 'passport_id', e.target.value)}
                    onBlur={(e) => saveSeat(s, e.currentTarget)}
                  />
                </td>
                <td className="p-2">
                  <span className={statusClass(s.status)}>{s.status}</span>
                </td>
                <td className="p-2 space-x-2">
                  {s.status === 'FREE' ? (
                    <button
                      className="bg-primary text-white px-2 py-1 rounded-lg"
                      onClick={assignOne}
                    >
                      Assign
                    </button>
                  ) : (
                    <button
                      className="bg-danger/20 text-danger px-2 py-1 rounded-lg"
                      onClick={() => releaseSeat(s.id)}
                    >
                      Release
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popover && (
        <div className="absolute z-50" style={{ left: popover.x, top: popover.y }}>
          <LinkChoice
            draft={popover.draft}
            matches={popover.matches}
            onPick={(choice, data, remember) => popover.resolve(choice, data, remember)}
          />
        </div>
      )}
    </Layout>
  );
}

function statusClass(status: string) {
  if (status === 'FREE') return 'px-2 py-1 rounded bg-white/10 text-white/70';
  if (status === 'HOLD') return 'px-2 py-1 rounded bg-warning/20 text-warning';
  if (status === 'CONFIRMED') return 'px-2 py-1 rounded bg-success/20 text-success';
  if (status === 'CANCELLED') return 'px-2 py-1 rounded bg-danger/20 text-danger';
  return '';
}

function LinkChoice({
  draft,
  matches,
  onPick,
}: {
  draft: Draft;
  matches: Array<{ id: string; first_name?: string; last_name?: string; phone?: string }>;
  onPick: (choice: Choice, data?: { id: string }, remember?: boolean) => void;
}) {
  const [remember, setRemember] = useState(false);
  return (
    <div className="p-3 rounded-xl border border-white/10 bg-neutral-900 shadow-xl w-[360px]">
      <div className="text-sm font-medium mb-2">Save passenger</div>
      {matches.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-white/60 mb-1">Possible matches</div>
          <div className="max-h-32 overflow-auto space-y-1">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => onPick('link', { id: m.id }, remember)}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10"
              >
                {(m.first_name || '') + ' ' + (m.last_name || '')} — {m.phone || 'no phone'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onPick('inline', undefined, remember)}
          className="px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Inline only
        </button>
        <button
          onClick={() => onPick('create', draft, remember)}
          className="px-2 py-2 rounded-lg bg-primary hover:brightness-110"
        >
          Create client
        </button>
      </div>
      <label className="mt-3 text-xs text-white/50 flex items-center gap-1">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember my choice for this session
      </label>
    </div>
  );
}

async function findMatches(query: string) {
  if (!query) return [];
  try {
    return await api<Array<{ id: string; first_name?: string; last_name?: string; phone?: string }>>(
      `/api/clients/?search=${encodeURIComponent(query)}`,
    );
  } catch {
    return [];
  }
}
async function createClient(p: Draft) {
  return api<{ id: string }>('/api/clients/', { method: 'POST', body: JSON.stringify(p) });
}

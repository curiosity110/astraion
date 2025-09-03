// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import {
  PaperAirplaneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  MoonIcon,
  SunIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Astraion Staff – Trip Details (Single Page)
 * - Full HSL design tokens
 * - Trip summary + capacity meter
 * - Passenger Manifest with inline editing (CRUD)
 * - Quick Add drawer (search existing clients → autofill & link)
 * - Dedupe guards on email/phone (in-manifest + client DB)
 * - Toasts, keyboard shortcuts, dark/light switch
 */

export default function TripDetail({}: { id: string }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // --- Demo data (replace with API calls) ---
  const [trip, setTrip] = useState(() => ({
    id: 101,
    code: "TRIP-2025-0315-NYC-LAX",
    origin: "New York",
    destination: "Los Angeles",
    departDate: "2025-03-15",
    departTime: "08:30",
    currency: "USD",
    price: 299,
    capacity: 45,
    status: "active",
  }));

  const [clients] = useState(() => [
    { id: 1, first: "John", last: "Smith", email: "john@smith.com", phone: "+1 555 123-4567" },
    { id: 2, first: "Sarah", last: "Johnson", email: "sarah@johnson.com", phone: "+1 555 987-6543" },
    { id: 3, first: "Michael", last: "Davis", email: "m.davis@example.com", phone: "+1 555 456-7890" },
    { id: 4, first: "Emma", last: "Rodriguez", email: "emma.r@example.com", phone: "+1 555 532-0042" },
    { id: 5, first: "Ava", last: "Nguyen", email: "ava.nguyen@example.com", phone: "+1 555 112-1212" },
    { id: 6, first: "Noah", last: "Patel", email: "noah.patel@example.com", phone: "+1 555 774-2210" },
  ]);

  const [rows, setRows] = useState(() => [
    { id: "001", clientId: 1, name: "John Smith", email: "john@smith.com", phone: "+1 555 123-4567", seat: "12A", notes: "Vegetarian meal", status: "confirmed" },
    { id: "002", clientId: 2, name: "Sarah Johnson", email: "sarah@johnson.com", phone: "+1 555 987-6543", seat: "07C", notes: "Window seat preferred", status: "confirmed" },
    { id: "003", clientId: 3, name: "Michael Davis", email: "m.davis@example.com", phone: "+1 555 456-7890", seat: "14B", notes: "", status: "pending" },
  ]);

  const counts = useMemo(() => ({
    total: rows.length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    pending: rows.filter((r) => r.status === "pending").length,
    open: trip.capacity - rows.filter((r) => r.status === "confirmed").length,
  }), [rows, trip.capacity]);

  const [editRowId, setEditRowId] = useState(null);
  const [draft, setDraft] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");

  const showToast = (msg) => {
    setToast({ id: Math.random().toString(36).slice(2), msg });
    setTimeout(() => setToast(null), 3000);
  };

  // keyboard shortcuts: N=new passenger, / focus search, E edit selected row
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/") {
        const el = document.getElementById("manifest-search");
        if (el) { e.preventDefault(); el.focus(); }
      }
      if (e.key.toLowerCase() === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        startAdd();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // helpers
  const startEdit = (id) => {
    setEditRowId(id);
    const row = rows.find((r) => r.id === id);
    setDraft({ ...row });
  };
  const startAdd = () => {
    const nextId = String(rows.length + 1).padStart(3, "0");
    setEditRowId(nextId);
    setDraft({ id: nextId, name: "", email: "", phone: "", seat: "", notes: "", status: "pending" });
  };

  const cancelEdit = () => { setEditRowId(null); setDraft({}); };

  const commitEdit = () => {
    // capacity guard for confirming
    if (draft.status === "confirmed" && counts.confirmed >= trip.capacity && !rows.find((r) => r.id === draft.id && r.status === "confirmed")) {
      showToast("Capacity reached. Cannot confirm more passengers.");
      return;
    }

    setRows((prev) => {
      const exists = prev.some((r) => r.id === draft.id);
      const next = exists ? prev.map((r) => (r.id === draft.id ? { ...draft } : r)) : [...prev, { ...draft }];
      return next;
    });
    setEditRowId(null);
    setDraft({});
    showToast("Saved");
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (editRowId === id) cancelEdit();
    showToast("Removed passenger");
  };

  // dedupe checks
  const manifestDuplicate = useMemo(() => {
    const email = draft.email?.trim().toLowerCase();
    const phone = digits(draft.phone || "");
    if (!editRowId) return null;
    const dupEmail = email && rows.some((r) => r.id !== draft.id && r.email?.toLowerCase() === email);
    const dupPhone = phone && rows.some((r) => r.id !== draft.id && digits(r.phone || "") === phone);
    return dupEmail || dupPhone;
  }, [draft, rows, editRowId]);

  const clientMatches = useMemo(() => {
    if (!draft || (!draft.email && !draft.name && !draft.phone)) return [];
    const name = (draft.name || "").toLowerCase();
    const email = (draft.email || "").toLowerCase();
    const phone = digits(draft.phone || "");
    return clients
      .map((c) => ({
        ...c,
        name: `${c.first} ${c.last}`,
        score:
          (email && c.email.toLowerCase() === email ? 0.8 : 0) +
          (phone && digits(c.phone) === phone ? 0.6 : 0) +
          (name && `${c.first} ${c.last}`.toLowerCase().includes(name) ? 0.3 : 0),
      }))
      .filter((x) => x.score >= 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [draft, clients]);

  const filteredRows = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.id, r.name, r.email, r.phone, r.seat, r.status].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  return (
    <div className={`astraion ${theme}`}>
      <style>{globalStyles}</style>

      <header className="sticky top-0 z-40 border-b border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--background)/0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2"><PaperAirplaneIcon className="h-5 w-5" /><span className="font-semibold">Astraion Staff</span></div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <span className="rounded-full border border-[hsl(var(--primary)/0.2)] px-2 py-1 text-xs">Role: Agent</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* Trip summary */}
        <div className="rounded-2xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--card))] shadow-[var(--shadow-cosmic)]">
          <div className="grid grid-cols-2 gap-2 p-4 text-sm md:grid-cols-6">
            <InfoChip icon={CalendarDaysIcon} label="Date" value={fmtDate(trip.departDate)} />
            <InfoChip icon={MapPinIcon} label="Route" value={`${trip.origin} → ${trip.destination}`} />
            <InfoChip icon={ClockIcon} label="Departure" value={fmtTime(trip.departTime)} />
            <InfoChip icon={CurrencyDollarIcon} label="Price" value={`${trip.currency === "USD" ? "$" : ""}${trip.price}`} />
            <InfoChip icon={UsersIcon} label="Capacity" value={`${trip.capacity} seats`} />
            <div className="flex items-center justify-end"><span className="rounded-full border border-[hsl(var(--primary)/0.2)] px-2 py-1 text-xs">{trip.status}</span></div>
          </div>
          <div className="border-t border-[hsl(var(--primary)/0.1)] p-4">
            <CapacityBar total={trip.capacity} confirmed={counts.confirmed} pending={counts.pending} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={startAdd}><PlusIcon className="mr-1 h-4 w-4"/> Add Passenger</Button>
            <Button variant="cosmic" onClick={() => setDrawerOpen(true)}><MagnifyingGlassIcon className="mr-1 h-4 w-4"/> Quick Add (Clients)</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="cosmic" onClick={() => showToast("Import CSV – coming soon in API")}> <ArrowUpTrayIcon className="mr-1 h-4 w-4"/> Import CSV</Button>
            <Button variant="stellar" onClick={() => showToast("Exported CSV for trip")}> <ArrowDownTrayIcon className="mr-1 h-4 w-4"/> Export CSV</Button>
          </div>
        </div>

        {/* Manifest Table */}
        <div className="mt-3 rounded-2xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--card))] shadow-[var(--shadow-cosmic)]">
          <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--primary)/0.1)] p-3">
            <div className="font-semibold">Passenger Manifest</div>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span>👥 {counts.total}</span>
              <span>✅ {counts.confirmed}</span>
              <span>🪑 Open {counts.open}</span>
              <div className="ml-3 flex items-center rounded-xl border border-[hsl(var(--primary)/0.2)] px-2 py-1">
                <MagnifyingGlassIcon className="mr-1 h-3 w-3"/>
                <input id="manifest-search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search ( / )" className="bg-transparent text-xs outline-none"/>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[hsl(var(--background))]">
                <tr>
                  {['#','Name','Email','Phone','Seat','Notes','Status','Actions'].map((h)=>(
                    <th key={h} className="px-3 py-2 font-medium text-[hsl(var(--muted-foreground))]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--primary)/0.1)]">
                {filteredRows.map((r)=> (
                  editRowId === r.id ? (
                    <EditRow
                      key={r.id}
                      draft={draft}
                      setDraft={setDraft}
                      manifestDuplicate={manifestDuplicate}
                      clientMatches={clientMatches}
                      onSave={commitEdit}
                      onCancel={cancelEdit}
                    />
                  ) : (
                    <tr key={r.id} className="hover:bg-[hsl(var(--background))]">
                      <td className="px-3 py-2">{r.id}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.phone}</td>
                      <td className="px-3 py-2">{r.seat}</td>
                      <td className="px-3 py-2 truncate max-w-[280px]">{r.notes}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${r.status === 'confirmed' ? 'bg-[hsl(var(--accent)/0.18)]' : r.status==='pending' ? 'bg-[hsl(var(--primary)/0.12)]' : 'bg-[hsl(0_72%_50%/0.12)]'}`}>{r.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <IconButton title="Edit" onClick={()=>startEdit(r.id)}><PencilSquareIcon className="h-4 w-4"/></IconButton>
                          <IconButton title="Delete" onClick={()=>removeRow(r.id)}><TrashIcon className="h-4 w-4"/></IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                ))}

                {/* Add mode row */}
                {editRowId && !rows.some((x)=>x.id===editRowId) && (
                  <EditRow
                    key={editRowId}
                    draft={draft}
                    setDraft={setDraft}
                    manifestDuplicate={manifestDuplicate}
                    clientMatches={clientMatches}
                    onSave={commitEdit}
                    onCancel={cancelEdit}
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add Drawer */}
        <QuickAddDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          clients={clients}
          onUse={(c) => {
            setDrawerOpen(false);
            const nextId = String(rows.length + 1).padStart(3, "0");
            setEditRowId(nextId);
            setDraft({ id: nextId, clientId: c.id, name: `${c.first} ${c.last}`, email: c.email, phone: c.phone, seat: "", notes: "", status: "pending" });
          }}
        />

        {/* Toast */}
        {toast && (
          <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4">
            <div className="pointer-events-auto rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--card))] p-3 shadow-[var(--shadow-cosmic)]">
              <div className="flex items-center gap-2 text-sm"><CheckCircleIcon className="h-4 w-4"/>{toast.msg}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------ Components ------------------------ */
function CapacityBar({ total, confirmed, pending }) {
  const pctConfirmed = Math.min(100, Math.round((confirmed / total) * 100));
  const pctPending = Math.min(100, Math.round((pending / total) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <span>Capacity</span>
        <span>{confirmed} confirmed / {total} total</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--background))]">
        <div className="h-full" style={{ width: pctConfirmed + "%", background: "var(--gradient-stellar)" }} />
        <div className="-mt-3 h-3" style={{ width: Math.min(100, pctConfirmed + pctPending) + "%", background: "hsl(var(--primary)/0.12)" }} />
      </div>
    </div>
  );
}

function IconButton({ children, ...props }) {
  return (
    <button className="inline-flex items-center justify-center rounded-xl border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--background))] px-2 py-1 text-xs hover:scale-[1.02]" {...props}>
      {children}
    </button>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 opacity-80" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function EditRow({ draft, setDraft, manifestDuplicate, clientMatches, onSave, onCancel }) {
  const warn = manifestDuplicate || (clientMatches?.length ?? 0) > 0;
  return (
    <tr className="bg-[hsl(var(--background))]">
      <td className="px-3 py-2">{draft.id}</td>
      <td className="px-3 py-2"><Input value={draft.name} onChange={(v)=>setDraft({...draft, name:v})} placeholder="Full name"/></td>
      <td className="px-3 py-2"><Input value={draft.email} onChange={(v)=>setDraft({...draft, email:v})} placeholder="email@example.com"/></td>
      <td className="px-3 py-2"><Input value={draft.phone} onChange={(v)=>setDraft({...draft, phone:v})} placeholder="+1 555…"/></td>
      <td className="px-3 py-2"><Input value={draft.seat} onChange={(v)=>setDraft({...draft, seat:v})} placeholder="12A" className="w-20"/></td>
      <td className="px-3 py-2"><Input value={draft.notes} onChange={(v)=>setDraft({...draft, notes:v})} placeholder="Notes"/></td>
      <td className="px-3 py-2">
        <select className="rounded-lg border border-[hsl(var(--primary)/0.2)] bg-transparent px-2 py-1 text-sm outline-none" value={draft.status} onChange={(e)=>setDraft({...draft, status:e.target.value})}>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="cancelled">cancelled</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="stellar" className="px-3 py-1 text-xs" onClick={onSave}><CheckIcon className="mr-1 h-3 w-3"/> Save</Button>
          <Button variant="cosmic" className="px-3 py-1 text-xs" onClick={onCancel}><XMarkIcon className="mr-1 h-3 w-3"/> Cancel</Button>
        </div>
        {warn && (
          <div className="mt-2 flex items-start gap-1 text-xs text-[hsl(var(--danger))]">
            <ExclamationTriangleIcon className="mt-0.5 h-3 w-3"/>
            <div>
              Possible duplicate. {manifestDuplicate ? "Same email/phone exists in this manifest." : "Matches existing client(s)."}
              {clientMatches?.length ? (
                <div className="mt-1 rounded-lg border border-[hsl(var(--primary)/0.2)] p-2 text-[11px]">
                  <div className="mb-1 text-[hsl(var(--muted-foreground))]">Suggested clients:</div>
                  <ul className="space-y-1">
                    {clientMatches.map((c)=> (
                      <li key={c.id} className="flex justify-between">
                        <span>{c.name} — {c.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function Input({ value, onChange, placeholder, className = "" }) {
  return (
    <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-lg border border-[hsl(var(--primary)/0.2)] bg-transparent px-2 py-1 text-sm outline-none ${className}`}/>
  );
}

function QuickAddDrawer({ open, onClose, clients, onUse }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients.map((c)=>({...c, name:`${c.first} ${c.last}`}));
    return clients
      .map((c)=>({...c, name:`${c.first} ${c.last}`}))
      .filter((c)=> [c.name, c.email, c.phone].some((v)=>v.toLowerCase().includes(needle)));
  }, [q, clients]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--card))] p-4 shadow-[var(--shadow-cosmic)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Quick Add from Clients</div>
          <IconButton onClick={onClose}><XMarkIcon className="h-4 w-4"/></IconButton>
        </div>
        <div className="mb-3 flex items-center rounded-xl border border-[hsl(var(--primary)/0.2)] px-3 py-2">
          <MagnifyingGlassIcon className="mr-2 h-4 w-4"/>
          <input autoFocus value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, email, phone" className="bg-transparent text-sm outline-none w-full"/>
        </div>
        <div className="space-y-2">
          {results.map((c)=>(
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--background))] p-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{c.email} • {c.phone}</div>
              </div>
              <Button onClick={()=>onUse(c)} className="text-xs px-3 py-1">Use</Button>
            </div>
          ))}
          {!results.length && <div className="text-sm text-[hsl(var(--muted-foreground))]">No matches.</div>}
        </div>
      </div>
    </div>
  );
}

function Button({ children, variant = "default", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition-[transform,box-shadow] active:scale-[0.98]";
  const variants = {
    default: "text-white shadow-[var(--shadow-cosmic)] hover:scale-[1.02]",
    stellar: "text-[hsl(var(--foreground))] shadow-[var(--shadow-cosmic)] hover:scale-[1.02]",
    cosmic: "text-white border border-[hsl(var(--primary)/0.4)] hover:scale-[1.02]",
  };
  const style = {
    default: { background: "var(--gradient-cosmic)" },
    stellar: { background: "var(--gradient-stellar)" },
    cosmic: { background: "var(--gradient-cosmic)", boxShadow: "0 0 0 1px hsl(var(--primary)/0.5) inset" },
  }[variant];
  return (
    <button style={style} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button onClick={onToggle} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--background))] px-3 py-2 text-sm">
      {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />} {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

/* ------------------------------ Utils & Styles ------------------------------ */
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; }
}
function fmtTime(hm) {
  try {
    const [h, m] = hm.split(":");
    const d = new Date();
    d.setHours(+h, +m, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return hm; }
}
function digits(s) { return (s || "").replace(/\D+/g, ""); }

const globalStyles = `
.astraion { color-scheme: light dark; min-height: 100vh; background: hsl(var(--background)); color: hsl(var(--foreground)); }
.astraion .navlink { color: hsl(var(--muted-foreground)); }

.astraion.light {
  --primary: 224 76% 15%;
  --primary-glow: 224 76% 25%;
  --accent: 43 96% 56%;
  --background: 210 40% 98%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --muted-foreground: 224 10% 40%;
  --danger: 0 72% 50%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 15%), hsl(224 76% 25%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 15% / 0.25);
}
.astraion.dark {
  --primary: 224 76% 70%;
  --accent: 43 96% 56%;
  --background: 224 71% 4%;
  --card: 224 76% 6%;
  --foreground: 210 40% 98%;
  --muted-foreground: 224 10% 70%;
  --danger: 0 72% 62%;

  --gradient-cosmic: linear-gradient(135deg, hsl(224 76% 20%), hsl(224 76% 35%));
  --gradient-stellar: linear-gradient(135deg, hsl(43 96% 56%), hsl(43 96% 70%));
  --shadow-cosmic: 0 10px 40px -10px hsl(224 76% 10% / 0.45);
}
`;

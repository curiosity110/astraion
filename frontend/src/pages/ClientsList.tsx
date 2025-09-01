import { useEffect, useState } from 'react';
import { api } from '../api';

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  links?: Record<string, string>;
};

export default function ClientsList() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const fetchClients = () => {
    api<Client[]>(`/api/clients/?search=${encodeURIComponent(search)}`)
      .then(setClients)
      .catch(() => setClients([]));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard/');
    ws.onmessage = fetchClients;
    return () => ws.close();
  }, [search]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Clients</h1>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/clients/export?format=csv`}>Export CSV</a>
        <a className="bg-primary text-white px-4 py-2 text-center" href={`/api/clients/export?format=json`}>Export JSON</a>
      </div>
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
                <td className="px-2">
                  <a className="text-primary underline" href={c.links?.['ui.self'] || `/clients/${c.id}`}>
                    {c.first_name} {c.last_name}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

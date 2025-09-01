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

  useEffect(() => {
    api<Client[]>(`/api/clients/?search=${encodeURIComponent(search)}`)
      .then(setClients)
      .catch(() => setClients([]));
  }, [search]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Clients</h1>
      <input
        className="border p-2 w-full"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="space-y-1">
        {clients.map((c) => (
          <li key={c.id}>
            <a className="text-primary underline" href={c.links?.['ui.self'] || `/clients/${c.id}`}> 
              {c.first_name} {c.last_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

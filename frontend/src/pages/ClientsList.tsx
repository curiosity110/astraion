import { useEffect, useState } from 'react';
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

  return (
    <Layout title="Clients" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients' }]}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
      )}
    </Layout>
  );
}

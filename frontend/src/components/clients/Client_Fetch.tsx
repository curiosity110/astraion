// hooks/useClients.ts
import { useEffect, useState, useCallback } from "react";

export type Client = { id: number; name: string };

export function client_fetch() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/clients/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Client[] = await res.json();
      console.table(data);
      setClients(data);
    } catch (err: any) {
      console.error("useClients error:", err);
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { clients, loading, error, refetch: load };
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = (await resp.json().catch(() => null)) as unknown;
  if (!resp.ok) {
    const detail = (data as { detail?: string } | null)?.detail;
    const err = new Error(detail || `API ${resp.status}`) as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

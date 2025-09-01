export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API ${resp.status}`);
  }
  return resp.json();
}

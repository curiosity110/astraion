function getCookie(name: string): string | null {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop() as string) : null;
}
async function ensureCsrf() {
  if (!getCookie('csrftoken')) await fetch('/api/clients/', { credentials: 'include' });
}
export async function api<T>(url: string, opts: RequestInit = {}, expectJson = true): Promise<T> {
  const method = (opts.method || 'GET').toUpperCase();
  const needsCsrf = ['POST','PUT','PATCH','DELETE'].includes(method);
  if (needsCsrf) await ensureCsrf();

  const headers = new Headers(opts.headers || {});
  if (needsCsrf) headers.set('X-CSRFToken', getCookie('csrftoken') || '');
  if (expectJson) headers.set('Accept', 'application/json');
  if (opts.body && !(opts.body instanceof FormData)) headers.set('Content-Type','application/json');

  const res = await fetch(url, { ...opts, headers, credentials:'include' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${await res.text().catch(()=> '')}`);
  // @ts-expect-error: response may not be JSON when expectJson is false
  return expectJson ? res.json() : res.text();
}

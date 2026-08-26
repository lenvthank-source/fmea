import { API_BASE_URL } from '../config';

export async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    // Nest returns { message: string | string[], error, statusCode }
    if (body?.message) {
      if (Array.isArray(body.message)) return body.message.join(', ');
      return body.message;
    }
    if (body?.error) return body.error;
  } catch {
    // not json
  }
  return res.statusText || fallback;
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// Light wrapper — use where you want auto error message extraction.
// Does not toast itself; caller decides toast severity.
export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = { ...getAuthHeaders(), ...(opts.headers as Record<string, string> | undefined) };
  return fetch(url, { ...opts, headers });
}

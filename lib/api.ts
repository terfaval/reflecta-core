export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_HOST as string | undefined) ||
    '';

  let url = path;
  if (!/^https?:\/\//.test(path)) {
    const trimmedBase = base.replace(/\/$/, '');
    let normalized = path.replace(/^\/+/, '');
    if (!normalized.startsWith('api/')) {
      normalized = `api/${normalized}`;
    }
    url = `${trimmedBase}/${normalized}`;
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const response = await fetch(url, { ...options, headers });
  let data: T | { error?: string };
  try {
    data = await response.json();
  } catch {
    data = {} as T;
  }
  if (!response.ok) {
    const message = (data as any).error || response.statusText;
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data as T;
}
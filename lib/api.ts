export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_HOST as string | undefined) ||
    '';

  const url = /^https?:\/\//.test(path)
    ? path
    : `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`API hiba: ${response.status}`);
  }

  try {
    const data = await response.json();
    return data as T;
  } catch {
    return {} as T;
  }
}
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
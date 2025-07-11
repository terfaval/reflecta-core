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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (typeof window !== 'undefined') {
    const uid = sessionStorage.getItem('reflecta_user_id');
    const role = sessionStorage.getItem('reflecta_role');
    if (uid && !('X-User-Id' in headers)) headers['X-User-Id'] = uid;
    if (role && !('X-Role' in headers)) headers['X-Role'] = role;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      window.location.href = '/non-authorized';
    }
    throw new Error(`Auth hiba: ${response.status}`);
  }

  if (!response.ok) {
    let message = `API hiba: ${response.status}`;
    try {
      const err = await response.clone().json();
      message = err.error || err.detail || message;
    } catch {
      // ignore parse errors and keep generic message
    }
    throw new Error(message);
  }

  try {
    const data = await response.json();
    return data as T;
  } catch {
    return {} as T;
  }
}
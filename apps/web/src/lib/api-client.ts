import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class AuthExpiredError extends Error {
  constructor() {
    super('Session expirée. Veuillez vous reconnecter.');
    this.name = 'AuthExpiredError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new AuthExpiredError();
  }
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshToken}` },
  });
  if (!res.ok) {
    clearTokens();
    throw new AuthExpiredError();
  }
  const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const accessToken = getAccessToken();

  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    const newToken = await refreshTokens();
    res = await doFetch(newToken);
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = (body as { message?: unknown })?.message;
    const msg = Array.isArray(raw) ? (raw[0] as string) : (raw as string | undefined);
    throw new ApiError(res.status, msg || `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

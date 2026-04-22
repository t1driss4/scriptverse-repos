const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = body?.message;
    const msg = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(msg || `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  signup(data: { email: string; password: string; role?: string }) {
    return request<AuthTokens>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  },

  logout(accessToken: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  resetPassword(email: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

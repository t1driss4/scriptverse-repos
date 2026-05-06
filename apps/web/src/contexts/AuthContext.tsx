'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/api';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  decodeJwt,
  isTokenExpired,
} from '@/lib/auth-storage';
import type { Role } from '@/lib/types';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateFromToken = useCallback((token: string): AuthUser => {
    const payload = decodeJwt(token);
    if (!payload) throw new Error('Invalid token');
    return { id: payload.sub, email: payload.email, role: payload.role };
  }, []);

  const enrichWithProfile = useCallback(async (base: AuthUser): Promise<void> => {
    try {
      const profile = await authApi.me();
      setUser({
        ...base,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
      });
    } catch {
      // Profile fetch failed — keep base user from JWT, still authenticated
      setUser(base);
    }
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const payload = decodeJwt(accessToken);

    if (payload && !isTokenExpired(payload)) {
      const base = { id: payload.sub, email: payload.email, role: payload.role };
      enrichWithProfile(base).finally(() => setIsLoading(false));
      return;
    }

    // Access token expired — try silent refresh
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      setIsLoading(false);
      return;
    }

    authApi
      .refresh(refreshToken)
      .then(async ({ accessToken: newAccess, refreshToken: newRefresh }) => {
        setTokens(newAccess, newRefresh);
        const base = hydrateFromToken(newAccess);
        await enrichWithProfile(base);
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, [hydrateFromToken, enrichWithProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken, refreshToken } = await authApi.login({ email, password });
      setTokens(accessToken, refreshToken);
      const base = hydrateFromToken(accessToken);
      await enrichWithProfile(base);
    },
    [hydrateFromToken, enrichWithProfile],
  );

  const signup = useCallback(
    async (data: { email: string; password: string; role?: string }) => {
      const { accessToken, refreshToken } = await authApi.signup(data);
      setTokens(accessToken, refreshToken);
      const base = hydrateFromToken(accessToken);
      await enrichWithProfile(base);
    },
    [hydrateFromToken, enrichWithProfile],
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      await authApi.logout(token).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

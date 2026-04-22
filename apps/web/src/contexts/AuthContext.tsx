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

  const hydrateFromToken = useCallback((token: string) => {
    const payload = decodeJwt(token);
    if (payload) {
      setUser({ id: payload.sub, email: payload.email, role: payload.role });
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
      setUser({ id: payload.sub, email: payload.email, role: payload.role });
      setIsLoading(false);
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
      .then(({ accessToken: newAccess, refreshToken: newRefresh }) => {
        setTokens(newAccess, newRefresh);
        hydrateFromToken(newAccess);
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, [hydrateFromToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken, refreshToken } = await authApi.login({
        email,
        password,
      });
      setTokens(accessToken, refreshToken);
      hydrateFromToken(accessToken);
    },
    [hydrateFromToken],
  );

  const signup = useCallback(
    async (data: { email: string; password: string; role?: string }) => {
      const { accessToken, refreshToken } = await authApi.signup(data);
      setTokens(accessToken, refreshToken);
      hydrateFromToken(accessToken);
    },
    [hydrateFromToken],
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

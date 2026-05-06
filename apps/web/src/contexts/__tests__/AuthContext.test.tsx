import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock('@/lib/auth-storage', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  decodeJwt: vi.fn(),
  isTokenExpired: vi.fn(),
}));

import { authApi } from '@/lib/api';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  decodeJwt,
  isTokenExpired,
} from '@/lib/auth-storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const validPayload = {
  sub: 'user-1',
  email: 'test@example.com',
  role: 'APPRENANT' as const,
  exp: 9_999_999_999,
  iat: 0,
};

const mockProfile = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'APPRENANT' as const,
  avatar: 'https://example.com/avatar.jpg',
};

const validToken = `header.${btoa(JSON.stringify(validPayload))}.sig`;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(getRefreshToken).mockReturnValue(null);
    vi.mocked(decodeJwt).mockReturnValue(null);
    vi.mocked(isTokenExpired).mockReturnValue(false);
    vi.mocked(setTokens).mockReset();
    vi.mocked(clearTokens).mockReset();
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.signup).mockReset();
    vi.mocked(authApi.logout).mockReset();
    vi.mocked(authApi.me).mockReset();
    vi.mocked(authApi.refresh).mockReset();
  });

  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  describe('mount: no access token', () => {
    it('sets isLoading=false and user=null immediately', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
    });
  });

  describe('mount: valid non-expired token', () => {
    it('enriches user with profile data from authApi.me()', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(isTokenExpired).mockReturnValue(false);
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'APPRENANT',
        firstName: 'Jean',
        lastName: 'Dupont',
        avatar: 'https://example.com/avatar.jpg',
      });
    });

    it('falls back to base JWT user when profile fetch fails', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(isTokenExpired).mockReturnValue(false);
      vi.mocked(authApi.me).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'APPRENANT',
      });
    });
  });

  describe('mount: expired token', () => {
    it('clears tokens and stays unauthenticated when no refresh token exists', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue({ ...validPayload, exp: 1000 });
      vi.mocked(isTokenExpired).mockReturnValue(true);
      vi.mocked(getRefreshToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('silently refreshes and hydrates user when refresh token is available', async () => {
      const newToken = `header.${btoa(JSON.stringify(validPayload))}.sig2`;

      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt)
        .mockReturnValueOnce({ ...validPayload, exp: 1000 })
        .mockReturnValueOnce(validPayload);
      vi.mocked(isTokenExpired).mockReturnValue(true);
      vi.mocked(getRefreshToken).mockReturnValue('rt-old');
      vi.mocked(authApi.refresh).mockResolvedValue({
        accessToken: newToken,
        refreshToken: 'rt-new',
      });
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(setTokens).toHaveBeenCalledWith(newToken, 'rt-new');
      expect(result.current.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
      });
    });

    it('clears tokens when silent refresh fails', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue({ ...validPayload, exp: 1000 });
      vi.mocked(isTokenExpired).mockReturnValue(true);
      vi.mocked(getRefreshToken).mockReturnValue('rt-old');
      vi.mocked(authApi.refresh).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login()', () => {
    it('stores tokens and sets user after successful login', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: validToken,
        refreshToken: 'rt',
      });
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(setTokens).toHaveBeenCalledWith(validToken, 'rt');
      expect(result.current.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        role: 'APPRENANT',
      });
    });
  });

  describe('signup()', () => {
    it('stores tokens and sets user after successful signup', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);
      vi.mocked(authApi.signup).mockResolvedValue({
        accessToken: validToken,
        refreshToken: 'rt',
      });
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.signup({
          email: 'new@example.com',
          password: 'secret',
          role: 'APPRENANT',
        });
      });

      expect(authApi.signup).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secret',
        role: 'APPRENANT',
      });
      expect(setTokens).toHaveBeenCalledWith(validToken, 'rt');
      expect(result.current.user).toMatchObject({ id: 'user-1' });
    });
  });

  describe('logout()', () => {
    it('calls authApi.logout, clears tokens, and resets user when token exists', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(isTokenExpired).mockReturnValue(false);
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalledWith(validToken);
      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('skips authApi.logout and only clears tokens when no access token', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).not.toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('still clears tokens even when authApi.logout rejects', async () => {
      vi.mocked(getAccessToken).mockReturnValue(validToken);
      vi.mocked(decodeJwt).mockReturnValue(validPayload);
      vi.mocked(isTokenExpired).mockReturnValue(false);
      vi.mocked(authApi.me).mockResolvedValue(mockProfile);
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });
});

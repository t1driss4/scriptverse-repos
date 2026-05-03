import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  decodeJwt,
  isTokenExpired,
} from '../auth-storage';

describe('auth-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('returns null when not set', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns stored access token', () => {
      localStorage.setItem('sv_access_token', 'acc123');
      expect(getAccessToken()).toBe('acc123');
    });
  });

  describe('getRefreshToken', () => {
    it('returns null when not set', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('returns stored refresh token', () => {
      localStorage.setItem('sv_refresh_token', 'ref123');
      expect(getRefreshToken()).toBe('ref123');
    });
  });

  describe('setTokens', () => {
    it('stores both access and refresh tokens', () => {
      setTokens('myAccess', 'myRefresh');
      expect(localStorage.getItem('sv_access_token')).toBe('myAccess');
      expect(localStorage.getItem('sv_refresh_token')).toBe('myRefresh');
    });

    it('overwrites previously stored tokens', () => {
      setTokens('old', 'oldR');
      setTokens('new', 'newR');
      expect(localStorage.getItem('sv_access_token')).toBe('new');
      expect(localStorage.getItem('sv_refresh_token')).toBe('newR');
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from localStorage', () => {
      setTokens('a', 'b');
      clearTokens();
      expect(localStorage.getItem('sv_access_token')).toBeNull();
      expect(localStorage.getItem('sv_refresh_token')).toBeNull();
    });

    it('is safe to call when no tokens are stored', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('decodeJwt', () => {
    function makeToken(payload: object): string {
      return `header.${btoa(JSON.stringify(payload))}.sig`;
    }

    it('decodes a valid JWT payload', () => {
      const payload = {
        sub: 'user-1',
        email: 'test@test.com',
        role: 'APPRENANT',
        exp: 9999999999,
        iat: 1000000000,
      };
      expect(decodeJwt(makeToken(payload))).toEqual(payload);
    });

    it('returns null for a string without dots', () => {
      expect(decodeJwt('nodots')).toBeNull();
    });

    it('returns null when payload segment is invalid base64/JSON', () => {
      expect(decodeJwt('header.!!!invalid!!!.sig')).toBeNull();
    });

    it('returns null for a completely empty string', () => {
      expect(decodeJwt('')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when exp timestamp is in the past', () => {
      expect(
        isTokenExpired({ sub: 'u', email: 'e', role: 'APPRENANT', exp: 1, iat: 0 }),
      ).toBe(true);
    });

    it('returns false when exp timestamp is far in the future', () => {
      expect(
        isTokenExpired({ sub: 'u', email: 'e', role: 'APPRENANT', exp: 9999999999, iat: 0 }),
      ).toBe(false);
    });
  });
});

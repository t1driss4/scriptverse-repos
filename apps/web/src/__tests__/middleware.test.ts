import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url: unknown) => ({ type: 'redirect', url })),
    next: vi.fn(() => ({ type: 'next' })),
  },
}));

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function makeRequest(pathname: string, hasLoggedInCookie = false): NextRequest {
  const clonedUrl = {
    pathname,
    search: '',
    searchParams: { set: vi.fn() },
  };

  return {
    nextUrl: {
      pathname,
      clone: vi.fn(() => clonedUrl),
    },
    cookies: {
      has: (name: string) => name === 'sv_logged_in' && hasLoggedInCookie,
    },
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.mocked(NextResponse.redirect).mockClear();
    vi.mocked(NextResponse.next).mockClear();
  });

  describe('protected routes (unauthenticated)', () => {
    it('redirects /dashboard to /auth/login with redirect param when not logged in', () => {
      const req = makeRequest('/dashboard');
      middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirected = (vi.mocked(NextResponse.redirect).mock.calls[0][0] as unknown as { pathname: string; searchParams: { set: ReturnType<typeof vi.fn> } });
      expect(redirected.pathname).toBe('/auth/login');
      expect(redirected.searchParams.set).toHaveBeenCalledWith('redirect', '/dashboard');
    });

    it('redirects /dashboard/settings to /auth/login with redirect param', () => {
      const req = makeRequest('/dashboard/settings');
      middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirected = (vi.mocked(NextResponse.redirect).mock.calls[0][0] as unknown as { pathname: string; searchParams: { set: ReturnType<typeof vi.fn> } });
      expect(redirected.pathname).toBe('/auth/login');
      expect(redirected.searchParams.set).toHaveBeenCalledWith('redirect', '/dashboard/settings');
    });

    it('redirects /formateur to /auth/login with redirect param when not logged in', () => {
      const req = makeRequest('/formateur');
      middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirected = (vi.mocked(NextResponse.redirect).mock.calls[0][0] as unknown as { pathname: string; searchParams: { set: ReturnType<typeof vi.fn> } });
      expect(redirected.pathname).toBe('/auth/login');
      expect(redirected.searchParams.set).toHaveBeenCalledWith('redirect', '/formateur');
    });
  });

  describe('protected routes (authenticated)', () => {
    it('allows access to /dashboard when logged in', () => {
      const req = makeRequest('/dashboard', true);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to /formateur when logged in', () => {
      const req = makeRequest('/formateur', true);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('auth pages (unauthenticated)', () => {
    it('allows access to /auth/login when not logged in', () => {
      const req = makeRequest('/auth/login', false);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to /auth/signup when not logged in', () => {
      const req = makeRequest('/auth/signup', false);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('auth pages (authenticated)', () => {
    it('redirects /auth/login to /dashboard when already logged in', () => {
      const req = makeRequest('/auth/login', true);
      middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirected = (vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string; search: string });
      expect(redirected.pathname).toBe('/dashboard');
      expect(redirected.search).toBe('');
    });

    it('redirects /auth/signup to /dashboard when already logged in', () => {
      const req = makeRequest('/auth/signup', true);
      middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
      const redirected = (vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string });
      expect(redirected.pathname).toBe('/dashboard');
    });
  });

  describe('unprotected routes', () => {
    it('passes through public routes without redirect', () => {
      const req = makeRequest('/catalogue', false);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('passes through home route without redirect', () => {
      const req = makeRequest('/', false);
      middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});

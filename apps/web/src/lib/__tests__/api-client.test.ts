import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../auth-storage', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth-storage';
import { apiRequest, AuthExpiredError, ApiError } from '../api-client';

describe('api-client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(getRefreshToken).mockReturnValue(null);
    vi.mocked(setTokens).mockReset();
    vi.mocked(clearTokens).mockReset();
  });

  // ─── Success paths ───────────────────────────────────────────────────────────

  it('returns parsed JSON on a 200 response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    const result = await apiRequest('/test');
    expect(result).toEqual({ ok: true });
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) });
    const result = await apiRequest('/test');
    expect(result).toBeUndefined();
  });

  it('attaches Authorization header when access token exists', async () => {
    vi.mocked(getAccessToken).mockReturnValue('my-token');
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    await apiRequest('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('omits Authorization header when no access token', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    await apiRequest('/test');
    const headers = (mockFetch.mock.calls[0][1] as { headers: Record<string, string> }).headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('merges caller-provided headers', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    await apiRequest('/test', { headers: { 'X-Custom': 'yes' } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'yes' }),
      }),
    );
  });

  // ─── Error paths ─────────────────────────────────────────────────────────────

  it('throws ApiError with string message from server', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });
    await expect(apiRequest('/test')).rejects.toThrow('Forbidden');
  });

  it('throws ApiError with first item when message is an array', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: ['must be email'] }),
    });
    await expect(apiRequest('/test')).rejects.toThrow('must be email');
  });

  it('throws ApiError with fallback message when body has no message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });
    await expect(apiRequest('/test')).rejects.toThrow('Erreur 500');
  });

  it('ApiError carries the HTTP status code', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: 'Unprocessable' }),
    });
    const err = await apiRequest('/test').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
  });

  // ─── 401 → refresh flow ──────────────────────────────────────────────────────

  it('retries with refreshed token after 401 and calls setTokens', async () => {
    vi.mocked(getAccessToken).mockReturnValue('old-token');
    vi.mocked(getRefreshToken).mockReturnValue('refresh-tok');

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-acc', refreshToken: 'new-ref' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'ok' }),
      });

    const result = await apiRequest('/protected');
    expect(setTokens).toHaveBeenCalledWith('new-acc', 'new-ref');
    expect(result).toEqual({ data: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws AuthExpiredError when 401 and no refresh token available', async () => {
    vi.mocked(getAccessToken).mockReturnValue('old-token');
    vi.mocked(getRefreshToken).mockReturnValue(null);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) });
    await expect(apiRequest('/protected')).rejects.toBeInstanceOf(AuthExpiredError);
    expect(clearTokens).toHaveBeenCalled();
  });

  it('throws AuthExpiredError when 401 and refresh request itself fails', async () => {
    vi.mocked(getAccessToken).mockReturnValue('old-token');
    vi.mocked(getRefreshToken).mockReturnValue('refresh-tok');
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) });
    await expect(apiRequest('/protected')).rejects.toBeInstanceOf(AuthExpiredError);
    expect(clearTokens).toHaveBeenCalled();
  });

  // ─── Error class shapes ───────────────────────────────────────────────────────

  it('AuthExpiredError is an instance of Error with correct name', () => {
    const err = new AuthExpiredError();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthExpiredError);
    expect(err.name).toBe('AuthExpiredError');
  });

  it('ApiError is an instance of Error and exposes status', () => {
    const err = new ApiError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
  });
});

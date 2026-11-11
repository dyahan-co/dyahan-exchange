import { afterEach, describe, expect, it, vi } from 'vitest';
import { dyahanApi } from './dyahanApi';

describe('dyahanApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends registration and login JSON to the auth endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ userId: 'u1' }))
      .mockResolvedValueOnce(Response.json({ userId: 'u1' }));
    vi.stubGlobal('fetch', fetchMock);

    await dyahanApi.register('neo', 'secret');
    await dyahanApi.login('neo', 'secret');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/auth/register', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'neo', password: 'secret', noticeAccepted: true }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'neo', password: 'secret' }),
    });
  });

  it('sends bearer tokens for current user and logout, accepting an empty 204 response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ userId: 'u1' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await dyahanApi.me('token');
    await expect(dyahanApi.logout('token')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: 'Bearer token' },
      body: undefined,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: 'Bearer token' },
      body: undefined,
    });
  });

  it('encodes guess round IDs and submits the answer', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ status: 'WON' }));
    vi.stubGlobal('fetch', fetchMock);

    await dyahanApi.submitGuessAnswer('token', 'round/1', 'слон');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/guess-rounds/round%2F1/answers', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer: 'слон' }),
    });
  });

  it('normalizes network failures and API error responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')));
    await expect(dyahanApi.login('neo', 'secret')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      code: 'NETWORK_ERROR',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        Response.json(
          {
            message: ['first', 'second'],
            code: 'INVALID',
          },
          { status: 400 },
        ),
      ),
    );
    await expect(dyahanApi.login('neo', 'secret')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'first, second',
      status: 400,
      code: 'INVALID',
    });
  });

  it('falls back to response text and a generic message for malformed errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(new Response('plain error', { status: 502 })),
    );
    await expect(dyahanApi.login('neo', 'secret')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Ошибка запроса (502)',
      status: 502,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 500 })));
    await expect(dyahanApi.login('neo', 'secret')).rejects.toMatchObject({
      message: 'Ошибка запроса (500)',
      status: 500,
    });
  });
});

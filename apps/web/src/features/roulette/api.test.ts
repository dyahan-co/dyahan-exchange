import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { session } from '../../auth/session';
import { revealRound, startRound, syncRoulette } from './api';

vi.mock('../../auth/session', () => ({
  session: {
    getToken: vi.fn(),
  },
}));

const fetchMock = vi.fn<typeof fetch>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function wallet(overrides: Record<string, unknown> = {}) {
  return {
    currency: 'KUM',
    balanceMinor: '100',
    availableMinor: '100',
    heldMinor: '0',
    p2pBlockedUntil: null,
    ...overrides,
  };
}

function pending() {
  return {
    id: 'round-1',
    status: 'PENDING',
    currency: 'KUM',
    stakeMinor: '2',
    rulesVersion: 1,
    commitment: 'commitment',
    createdAt: '2026-11-12T00:00:00Z',
    revealAt: '2026-11-12T00:00:03Z',
    result: null,
  };
}

function settled(outcome = 'WIN', number = 5, delta = '2', balance = '102') {
  return {
    ...pending(),
    status: 'SETTLED',
    result: {
      number,
      nonce: 'nonce',
      outcome,
      deltaMinor: delta,
      balanceBeforeMinor: '100',
      balanceAfterMinor: balance,
      transactionId: 'transaction-1',
      settledAt: '2026-11-12T00:00:04Z',
    },
  };
}

beforeEach(() => {
  vi.mocked(session.getToken).mockReturnValue('session-token');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('roulette API', () => {
  it('requires login before sending requests', async () => {
    vi.mocked(session.getToken).mockReturnValue(null);

    await expect(syncRoulette()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads a wallet when there is no active round', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(wallet()));

    await expect(syncRoulette()).resolves.toEqual({
      balance: 100,
      available: 100,
      reserved: 0,
      p2pBlockedUntil: null,
      round: null,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/roulette-rounds/active',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
        }),
      }),
    );
  });

  it('creates a round with an idempotency key and reads its hold', async () => {
    fetchMock
      .mockResolvedValueOnce(json(pending()))
      .mockResolvedValueOnce(json(wallet({ availableMinor: '98', heldMinor: '2' })));

    const snapshot = await startRound('request-key');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/roulette-rounds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': 'request-key',
          Authorization: 'Bearer session-token',
        }),
      }),
    );

    expect(snapshot.available).toBe(98);
    expect(snapshot.reserved).toBe(2);
    expect(snapshot.round).toEqual({
      id: 'round-1',
      status: 'pending',
      commitment: 'commitment',
      revealAt: '2026-11-12T00:00:03Z',
    });
  });

  it.each([
    ['WIN', 5, '2', '102', 'win'],
    ['LOSS', 6, '-2', '98', 'loss'],
    ['GREEN', 7, '-100', '0', 'green'],
  ])(
    'maps a %s result and the current wallet',
    async (outcome, number, delta, balance, mappedOutcome) => {
      const blockedUntil = outcome === 'GREEN' ? '2026-11-13T00:00:03Z' : null;

      fetchMock
        .mockResolvedValueOnce(json(settled(outcome, number, delta, balance)))
        .mockResolvedValueOnce(
          json(
            wallet({
              balanceMinor: balance,
              availableMinor: balance,
              p2pBlockedUntil: blockedUntil,
            }),
          ),
        );

      const snapshot = await revealRound('round/1');

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        '/api/v1/roulette-rounds/round%2F1/reveal',
        expect.objectContaining({ method: 'GET' }),
      );

      expect(snapshot.round).toMatchObject({
        status: 'settled',
        number,
        outcome: mappedOutcome,
        delta: Number(delta),
        balanceBefore: 100,
        balanceAfter: Number(balance),
      });
      expect(snapshot.balance).toBe(Number(balance));
      expect(snapshot.p2pBlockedUntil).toBe(blockedUntil);
    },
  );

  it('preserves structured server errors', async () => {
    fetchMock.mockResolvedValueOnce(
      json(
        {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Недостаточно доступных КУМ',
        },
        422,
      ),
    );

    await expect(startRound('key')).rejects.toMatchObject({
      status: 422,
      code: 'INSUFFICIENT_FUNDS',
      message: 'Недостаточно доступных КУМ',
    });
  });

  it('handles an error without a JSON body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(syncRoulette()).rejects.toMatchObject({
      status: 503,
      message: 'Не удалось выполнить запрос (503).',
    });
  });

  it('handles a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(syncRoulette()).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it.each([200, 502])('rejects malformed JSON with HTTP %s', async (status) => {
    fetchMock.mockResolvedValueOnce(new Response('not-json', { status }));

    await expect(syncRoulette()).rejects.toMatchObject({
      status: status === 200 ? 0 : status,
      code: 'INVALID_RESPONSE',
    });
  });

  it.each([{ currency: 'DRUB' }, { balanceMinor: '1.5' }, { balanceMinor: '9007199254740992' }])(
    'rejects unsupported wallet data: %j',
    async (override) => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(json(wallet(override)));

      await expect(syncRoulette()).rejects.toBeInstanceOf(Error);
    },
  );

  it('rejects a missing wallet', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(null));

    await expect(syncRoulette()).rejects.toThrow('кошелёк');
  });

  it.each([0, 11, 1.5])('rejects an invalid result number: %s', async (number) => {
    fetchMock
      .mockResolvedValueOnce(json(settled('WIN', number)))
      .mockResolvedValueOnce(json(wallet()));

    await expect(revealRound('round-1')).rejects.toThrow('результат');
  });

  it('rejects a settled round without a result', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ ...pending(), status: 'SETTLED' }))
      .mockResolvedValueOnce(json(wallet()));

    await expect(revealRound('round-1')).rejects.toThrow('результат');
  });

  it('rejects an unknown outcome', async () => {
    fetchMock.mockResolvedValueOnce(json(settled('UNKNOWN'))).mockResolvedValueOnce(json(wallet()));

    await expect(revealRound('round-1')).rejects.toThrow('исход');
  });

  it('rejects an empty creation response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(startRound('key')).rejects.toThrow('созданный раунд');
  });

  it('rejects an empty reveal response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(revealRound('round-1')).rejects.toThrow('результат раунда');
  });
});

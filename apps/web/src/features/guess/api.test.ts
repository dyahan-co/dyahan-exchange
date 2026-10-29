import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, sendAnswer, startRound } from './api';

const respond = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('startRound делает POST /api/guess-rounds', async () => {
    const fetchMock = vi.fn().mockReturnValue(respond({ roundId: 'r-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(startRound()).resolves.toMatchObject({ roundId: 'r-1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/guess-rounds', { method: 'POST' });
  });

  it('sendAnswer шлёт roundId как Idempotency-Key', async () => {
    const fetchMock = vi.fn().mockReturnValue(respond({ correct: true }));
    vi.stubGlobal('fetch', fetchMock);

    await sendAnswer('r-1', 'Кот');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/guess-rounds/r-1/answers');
    expect(init.headers['Idempotency-Key']).toBe('r-1');
    expect(JSON.parse(init.body)).toEqual({ answer: 'Кот' });
  });

  it('не-2xx превращается в ApiError со статусом', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => respond({}, 410)),
    );

    await expect(sendAnswer('r-1', 'x')).rejects.toBeInstanceOf(ApiError);
    await expect(sendAnswer('r-1', 'x')).rejects.toMatchObject({ status: 410 });
  });
});

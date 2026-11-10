import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { CoreApiService } from './core-api.service.js';

describe('CoreApiService', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  let service: CoreApiService;

  beforeEach(() => {
    process.env.CORE_BASE_URL = 'http://core.test';
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    service = new CoreApiService();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    delete process.env.CORE_BASE_URL;
  });

  it('forwards method, authorization and JSON body to Core', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ roundId: 'round-123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await service.forward(
      '/api/v1/guess-rounds',
      'POST',
      'Bearer session-token',
      { answer: 'слон' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('/api/v1/guess-rounds', 'http://core.test'),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer session-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: 'слон' }),
      },
    );
    expect(result).toEqual({
      status: 201,
      body: { roundId: 'round-123' },
    });
  });

  it('preserves Core error status and response body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Требуется действующая сессия',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await service.forward(
      '/api/v1/auth/me',
      'GET',
      'Bearer expired-token',
    );

    expect(result).toEqual({
      status: 401,
      body: {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Требуется действующая сессия',
      },
    });
  });

  it('returns a service-unavailable error when Core cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new Error('connection refused'));

    await expect(
      service.forward('/api/v1/auth/me', 'GET'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
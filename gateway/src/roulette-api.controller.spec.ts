import { jest } from '@jest/globals';
import type { Response } from 'express';
import type { CoreApiService } from './core-api.service.js';
import { RouletteApiController } from './roulette-api.controller.js';

describe('RouletteApiController', () => {
  const forward = jest.fn<CoreApiService['forward']>();

  const controller = new RouletteApiController({
    forward,
  } as unknown as CoreApiService);

  function response() {
    const res = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    return res as unknown as Response & typeof res;
  }

  beforeEach(() => {
    forward.mockReset();
  });

  it('forwards authorization and the idempotency key when creating a round', async () => {
    const body = { id: 'round-1', status: 'PENDING' };
    forward.mockResolvedValueOnce({ status: 200, body });
    const res = response();

    await controller.createRound('Bearer token', 'request-key', res);

    expect(forward).toHaveBeenCalledWith(
      '/api/v1/roulette-rounds',
      'POST',
      'Bearer token',
      undefined,
      'request-key',
    );

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(body);
    expect(res.end).not.toHaveBeenCalled();
  });

  it('reads the active round', async () => {
    forward.mockResolvedValueOnce({
      status: 200,
      body: { id: 'active-round' },
    });
    const res = response();

    await controller.activeRound('Bearer token', res);

    expect(forward).toHaveBeenCalledWith(
      '/api/v1/roulette-rounds/active',
      'GET',
      'Bearer token',
    );
    expect(res.send).toHaveBeenCalledWith({ id: 'active-round' });
  });

  it('encodes the round ID when reading a result', async () => {
    forward.mockResolvedValueOnce({
      status: 200,
      body: { status: 'SETTLED' },
    });
    const res = response();

    await controller.reveal('Bearer token', 'round/1', res);

    expect(forward).toHaveBeenCalledWith(
      '/api/v1/roulette-rounds/round%2F1/reveal',
      'GET',
      'Bearer token',
    );
    expect(res.send).toHaveBeenCalledWith({ status: 'SETTLED' });
  });

  it('encodes the round ID when reading a round', async () => {
    forward.mockResolvedValueOnce({
      status: 200,
      body: { id: 'round/1' },
    });
    const res = response();

    await controller.getRound('Bearer token', 'round/1', res);

    expect(forward).toHaveBeenCalledWith(
      '/api/v1/roulette-rounds/round%2F1',
      'GET',
      'Bearer token',
    );
    expect(res.send).toHaveBeenCalledWith({ id: 'round/1' });
  });

  it('forwards wallet errors without replacing their status or body', async () => {
    const body = {
      code: 'UNAUTHORIZED',
      message: 'Требуется действующая сессия',
    };

    forward.mockResolvedValueOnce({ status: 401, body });
    const res = response();

    await controller.wallet(undefined, res);

    expect(forward).toHaveBeenCalledWith('/api/v1/wallet', 'GET', undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(body);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it.each([
    { status: 204, body: null },
    { status: 200, body: null },
    { status: 204, body: { ignored: true } },
  ])('ends an empty response: %j', async (result) => {
    forward.mockResolvedValueOnce(result);
    const res = response();

    await controller.activeRound('Bearer token', res);

    expect(res.status).toHaveBeenCalledWith(result.status);
    expect(res.end).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});

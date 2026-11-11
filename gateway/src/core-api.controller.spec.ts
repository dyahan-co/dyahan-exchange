import { jest } from '@jest/globals';
import type { Response } from 'express';
import { CoreApiController } from './core-api.controller.js';
import type { CoreApiResult, CoreApiService } from './core-api.service.js';

describe('CoreApiController', () => {
  const forward = jest.fn<CoreApiService['forward']>();
  const controller = new CoreApiController({
    forward,
  } as unknown as CoreApiService);
  const response = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    return res as unknown as Response & typeof res;
  };

  beforeEach(() => forward.mockReset());

  it.each([
    [
      'register',
      '/api/v1/auth/register',
      'POST',
      undefined,
      { nickname: 'neo' },
    ],
    ['login', '/api/v1/auth/login', 'POST', undefined, { nickname: 'neo' }],
    ['logout', '/api/v1/auth/logout', 'POST', 'Bearer token', undefined],
    ['me', '/api/v1/auth/me', 'GET', 'Bearer token', undefined],
    [
      'startGuessRound',
      '/api/v1/guess-rounds',
      'POST',
      'Bearer token',
      undefined,
    ],
  ] as const)(
    'forwards %s to Core and returns its response',
    async (method, path, httpMethod, authorization, body) => {
      const result: CoreApiResult = { status: 201, body: { ok: true } };
      forward.mockResolvedValueOnce(result);
      const res = response();
      const handlers: Record<string, (...args: never[]) => Promise<void>> = {
        register: controller.register.bind(controller) as never,
        login: controller.login.bind(controller) as never,
        logout: controller.logout.bind(controller) as never,
        me: controller.me.bind(controller) as never,
        startGuessRound: controller.startGuessRound.bind(controller) as never,
      };

      if (method === 'register' || method === 'login') {
        await handlers[method](body as never, res as never);
      } else {
        await handlers[method](authorization as never, res as never);
      }

      if (body === undefined) {
        expect(forward).toHaveBeenCalledWith(path, httpMethod, authorization);
      } else {
        expect(forward).toHaveBeenCalledWith(
          path,
          httpMethod,
          authorization,
          body,
        );
      }
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    },
  );

  it('encodes submitted guess round IDs', async () => {
    forward.mockResolvedValueOnce({ status: 200, body: { correct: true } });
    const res = response();

    await controller.submitGuessAnswer(
      'Bearer token',
      'round/1',
      { answer: 'слон' },
      res,
    );

    expect(forward).toHaveBeenCalledWith(
      '/api/v1/guess-rounds/round%2F1/answers',
      'POST',
      'Bearer token',
      { answer: 'слон' },
    );
    expect(res.send).toHaveBeenCalledWith({ correct: true });
  });

  it.each([
    [{ status: 204, body: null }],
    [{ status: 200, body: null }],
  ] as const)('ends empty responses for result %j', async (result) => {
    forward.mockResolvedValueOnce(result);
    const res = response();

    await controller.me('Bearer token', res);

    expect(res.status).toHaveBeenCalledWith(result.status);
    expect(res.end).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});

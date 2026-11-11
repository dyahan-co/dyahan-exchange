import { RouletteController } from './roulette.controller';
import { RouletteService } from './roulette.service';

describe('RouletteController', () => {
  const service = {
    createDemo: jest.fn(),
    sync: jest.fn(),
    start: jest.fn(),
    reveal: jest.fn(),
  };

  const controller = new RouletteController(service as unknown as RouletteService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the demo session created by the service', () => {
    const result = { token: 'demo-token' };
    service.createDemo.mockReturnValueOnce(result);

    expect(controller.createDemo()).toBe(result);
    expect(service.createDemo).toHaveBeenCalledTimes(1);
  });

  it('extracts the bearer token when synchronizing', () => {
    const result = { balance: 100 };
    service.sync.mockReturnValueOnce(result);

    expect(controller.sync('Bearer session-token')).toBe(result);
    expect(service.sync).toHaveBeenCalledWith('session-token');
  });

  it.each([undefined, '', 'Basic credentials'])(
    'passes an empty token for invalid authorization: %s',
    (authorization) => {
      controller.sync(authorization);

      expect(service.sync).toHaveBeenCalledWith('');
    },
  );

  it('forwards the token and idempotency key when starting a round', () => {
    const result = { round: { id: 'round-1' } };
    service.start.mockReturnValueOnce(result);

    expect(controller.start('Bearer token', 'request-key')).toBe(result);
    expect(service.start).toHaveBeenCalledWith('token', 'request-key');
  });

  it('passes empty values when authorization and key are missing', () => {
    controller.start();

    expect(service.start).toHaveBeenCalledWith('', '');
  });

  it('forwards the round ID when revealing a result', () => {
    const result = { round: { id: 'round-1', number: 5 } };
    service.reveal.mockReturnValueOnce(result);

    expect(controller.reveal('round-1', 'Bearer token')).toBe(result);
    expect(service.reveal).toHaveBeenCalledWith('token', 'round-1');
  });

  it('passes missing authorization to the service as an empty token', () => {
    controller.reveal('round-1');

    expect(service.reveal).toHaveBeenCalledWith('', 'round-1');
  });
});

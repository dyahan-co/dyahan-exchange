import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RouletteService } from './roulette.service';

describe('RouletteService', () => {
  let directory: string;
  let service: RouletteService;
  let token: string;
  let draw: jest.Mock<number, []>;
  let now: number;

  beforeEach(async () => {
    now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    directory = await mkdtemp(join(tmpdir(), 'dyahan-roulette-'));
    draw = jest.fn(() => 1);

    service = new RouletteService(join(directory, 'roulette.json'), draw);

    await service.onModuleInit();
    ({ token } = await service.createDemo());
  });

  afterEach(async () => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  async function play(number: number) {
    draw.mockReturnValue(number);

    const started = await service.start(token, randomUUID());
    now += 3_001;

    return service.reveal(token, started.round!.id);
  }

  it('резервирует ставку и скрывает число до раскрытия', async () => {
    const snapshot = await service.start(token, randomUUID());

    expect(snapshot.available).toBe(26);
    expect(snapshot.reserved).toBe(2);
    expect(snapshot.round?.status).toBe('pending');
    expect(snapshot.round).not.toHaveProperty('number');
    expect(snapshot.round).not.toHaveProperty('nonce');
  });

  it('не раскрывает результат раньше срока', async () => {
    const started = await service.start(token, randomUUID());
    const snapshot = await service.reveal(token, started.round!.id);

    expect(snapshot.round?.status).toBe('pending');
    expect(snapshot.balance).toBe(28);
    expect(snapshot.reserved).toBe(2);
  });

  it.each([1, 2, 3, 4, 5])('число %i даёт чистый выигрыш +2', async (number) => {
    const snapshot = await play(number);

    expect(snapshot.balance).toBe(30);
    expect(snapshot.reserved).toBe(0);
    expect(snapshot.round).toMatchObject({
      outcome: 'win',
      delta: 2,
    });
  });

  it.each([6, 8, 9, 10])('число %i списывает 2 КУМ', async (number) => {
    const snapshot = await play(number);

    expect(snapshot.balance).toBe(26);
    expect(snapshot.round).toMatchObject({
      outcome: 'loss',
      delta: -2,
    });
  });

  it('семёрка обнуляет маленький баланс и блокирует P2P', async () => {
    const snapshot = await play(7);

    expect(snapshot.balance).toBe(0);
    expect(snapshot.reserved).toBe(0);
    expect(snapshot.round).toMatchObject({
      outcome: 'green',
      delta: -28,
    });
    expect(new Date(snapshot.p2pBlockedUntil!).getTime()).toBe(now - 1 + 24 * 60 * 60 * 1_000);
  });

  it('повтор запроса не создаёт вторую ставку', async () => {
    const key = randomUUID();

    const first = await service.start(token, key);
    const second = await service.start(token, key);

    expect(second.round?.id).toBe(first.round?.id);
    expect(second.reserved).toBe(2);
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it('параллельные ставки не обходят резерв', async () => {
    const results = await Promise.allSettled([
      service.start(token, randomUUID()),
      service.start(token, randomUUID()),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });

  it('повтор раскрытия не начисляет награду повторно', async () => {
    const first = await play(1);
    const second = await service.reveal(token, first.round!.id);

    expect(second.balance).toBe(30);
    expect(second.round).toEqual(first.round);
  });

  it('запрещает ставку при недостатке средств', async () => {
    await play(7);

    await expect(service.start(token, randomUUID())).rejects.toBeInstanceOf(ConflictException);
  });

  it('не позволяет прочитать чужой раунд', async () => {
    const started = await service.start(token, randomUUID());
    const other = await service.createDemo();

    await expect(service.reveal(other.token, started.round!.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('отклоняет неизвестную сессию', async () => {
    await expect(service.sync('invalid')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('сохраняет баланс после перезапуска', async () => {
    await play(1);
    service.onModuleDestroy();

    service = new RouletteService(join(directory, 'roulette.json'), draw);

    await service.onModuleInit();

    expect((await service.sync(token)).balance).toBe(30);
  });
});

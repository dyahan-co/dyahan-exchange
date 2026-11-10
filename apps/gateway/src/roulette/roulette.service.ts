import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const ROULETTE_FILE = Symbol('ROULETTE_FILE');
export const ROULETTE_DRAW = Symbol('ROULETTE_DRAW');

const STAKE = 2;
const ROUND_DURATION = 3_000;
const P2P_FREEZE_DURATION = 24 * 60 * 60 * 1_000;

type Outcome = 'win' | 'loss' | 'green';

interface Round {
  id: string;
  key: string;
  number: number;
  nonce: string;
  commitment: string;
  revealAt: number;
  settled: boolean;
  balanceBefore: number;
  balanceAfter?: number;
  outcome?: Outcome;
}

interface Account {
  balance: number;
  reserved: number;
  p2pBlockedUntil: number | null;
  rounds: Round[];
}

interface Database {
  accounts: Record<string, Account>;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class RouletteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RouletteService.name);

  private database: Database = { accounts: {} };
  private queue: Promise<unknown> = Promise.resolve();
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @Inject(ROULETTE_FILE) private readonly file: string,
    @Inject(ROULETTE_DRAW) private readonly draw: () => number,
  ) {}

  async onModuleInit() {
    try {
      this.database = JSON.parse(await readFile(this.file, 'utf8')) as Database;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    await this.transaction((database) => {
      this.settleDueRounds(database);
    });

    // Расчёт продолжится, даже если пользователь закрыл страницу.
    this.timer = setInterval(() => {
      void this.transaction((database) => {
        this.settleDueRounds(database);
      }).catch((error: unknown) => {
        this.logger.error('Не удалось сохранить результат рулетки', error);
      });
    }, 500);

    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Последовательно выполняем операции внутри одного процесса.
   * Новое состояние становится видимым только после успешной записи.
   */
  private transaction<T>(operation: (database: Database) => T): Promise<T> {
    const result = this.queue.then(async () => {
      const next = structuredClone(this.database);
      const value = operation(next);

      await mkdir(dirname(this.file), { recursive: true });

      const temporaryFile = `${this.file}.tmp`;
      await writeFile(temporaryFile, JSON.stringify(next), {
        mode: 0o600,
      });
      await rename(temporaryFile, this.file);

      this.database = next;
      return value;
    });

    this.queue = result.catch(() => undefined);
    return result;
  }

  private account(database: Database, token: string): Account {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new UnauthorizedException('Демосессия не найдена');
    }

    const account = database.accounts[hash(token)];

    if (!account) {
      throw new UnauthorizedException('Демосессия не найдена');
    }

    return account;
  }

  private settleDueRounds(database: Database) {
    const now = Date.now();

    for (const account of Object.values(database.accounts)) {
      const round = account.rounds.find((item) => !item.settled);

      if (!round || round.revealAt > now) continue;

      const outcome: Outcome = round.number === 7 ? 'green' : round.number <= 5 ? 'win' : 'loss';

      if (outcome === 'green') {
        account.balance = Math.max(0, account.balance - 100);
        account.p2pBlockedUntil = Math.max(
          account.p2pBlockedUntil ?? 0,
          round.revealAt + P2P_FREEZE_DURATION,
        );
      } else {
        account.balance += outcome === 'win' ? STAKE : -STAKE;
      }

      account.reserved = 0;
      round.settled = true;
      round.outcome = outcome;
      round.balanceAfter = account.balance;
    }
  }

  private publicRound(round: Round) {
    const base = {
      id: round.id,
      commitment: round.commitment,
      revealAt: new Date(round.revealAt).toISOString(),
    };

    if (!round.settled) {
      return {
        ...base,
        status: 'pending' as const,
      };
    }

    return {
      ...base,
      status: 'settled' as const,
      number: round.number,
      nonce: round.nonce,
      outcome: round.outcome!,
      balanceBefore: round.balanceBefore,
      balanceAfter: round.balanceAfter!,
      delta: round.balanceAfter! - round.balanceBefore,
    };
  }

  private snapshot(account: Account) {
    const lastRound = account.rounds.at(-1);

    return {
      balance: account.balance,
      available: account.balance - account.reserved,
      reserved: account.reserved,
      p2pBlockedUntil:
        account.p2pBlockedUntil && account.p2pBlockedUntil > Date.now()
          ? new Date(account.p2pBlockedUntil).toISOString()
          : null,
      round: lastRound ? this.publicRound(lastRound) : null,
    };
  }

  createDemo() {
    return this.transaction((database) => {
      const token = randomBytes(32).toString('hex');

      database.accounts[hash(token)] = {
        balance: 28,
        reserved: 0,
        p2pBlockedUntil: null,
        rounds: [],
      };

      return { token };
    });
  }

  sync(token: string) {
    return this.transaction((database) => {
      const account = this.account(database, token);
      this.settleDueRounds(database);
      return this.snapshot(account);
    });
  }

  start(token: string, key: string) {
    return this.transaction((database) => {
      if (!/^[a-f0-9-]{36}$/i.test(key)) {
        throw new BadRequestException('Передайте UUID в Idempotency-Key');
      }

      const account = this.account(database, token);
      this.settleDueRounds(database);

      const existing = account.rounds.find((round) => round.key === key);

      if (existing) {
        return {
          ...this.snapshot(account),
          round: this.publicRound(existing),
        };
      }

      if (account.rounds.some((round) => !round.settled)) {
        throw new ConflictException('Предыдущий раунд ещё не завершён');
      }

      if (account.balance - account.reserved < STAKE) {
        throw new ConflictException('Для ставки нужно минимум 2 КУМ');
      }

      const number = this.draw();

      if (!Number.isInteger(number) || number < 1 || number > 10) {
        throw new Error('Некорректный результат генератора');
      }

      const id = randomUUID();
      const nonce = randomBytes(32).toString('hex');

      const round: Round = {
        id,
        key,
        number,
        nonce,
        commitment: hash(`${id}|${number}|${nonce}`),
        revealAt: Date.now() + ROUND_DURATION,
        settled: false,
        balanceBefore: account.balance,
      };

      account.reserved = STAKE;
      account.rounds.push(round);

      return this.snapshot(account);
    });
  }

  reveal(token: string, id: string) {
    return this.transaction((database) => {
      const account = this.account(database, token);
      const round = account.rounds.find((item) => item.id === id);

      if (!round) {
        throw new NotFoundException('Раунд не найден');
      }

      this.settleDueRounds(database);

      return {
        ...this.snapshot(account),
        round: this.publicRound(round),
      };
    });
  }
}

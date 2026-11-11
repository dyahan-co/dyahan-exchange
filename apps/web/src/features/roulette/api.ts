import { session } from '../../auth/session';

export interface PendingRound {
  id: string;
  status: 'pending';
  commitment: string;
  revealAt: string;
}

export interface SettledRound {
  id: string;
  status: 'settled';
  commitment: string;
  revealAt: string;
  number: number;
  nonce: string;
  outcome: 'win' | 'loss' | 'green';
  balanceBefore: number;
  balanceAfter: number;
  delta: number;
}

export interface Snapshot {
  balance: number;
  available: number;
  reserved: number;
  p2pBlockedUntil: string | null;
  round: PendingRound | SettledRound | null;
}

interface WalletResponse {
  currency: string;
  balanceMinor: string;
  availableMinor: string;
  heldMinor: string;
  p2pBlockedUntil: string | null;
}

interface RoundResponse {
  id: string;
  status: 'PENDING' | 'SETTLED';
  currency: string;
  stakeMinor: string;
  rulesVersion: number;
  commitment: string;
  createdAt: string;
  revealAt: string;
  result: {
    number: number;
    nonce: string;
    outcome: 'WIN' | 'LOSS' | 'GREEN';
    deltaMinor: string;
    balanceBeforeMinor: string;
    balanceAfterMinor: string;
    transactionId: string;
    settledAt: string;
  } | null;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function requireToken(): string {
  const token = session.getToken();

  if (!token) {
    throw new ApiError(401, 'Для игры войдите в свой аккаунт.', 'UNAUTHORIZED');
  }

  return token;
}

async function request<T>(
  path: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  key?: string,
): Promise<T | null> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/api/v1${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Не удалось связаться с сервером. Проверьте соединение.',
      'NETWORK_ERROR',
    );
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiError(
        response.ok ? 0 : response.status,
        'Сервер вернул некорректный ответ.',
        'INVALID_RESPONSE',
      );
    }
  }

  if (!response.ok) {
    const error = body as {
      message?: unknown;
      code?: unknown;
    } | null;

    throw new ApiError(
      response.status,
      typeof error?.message === 'string'
        ? error.message
        : `Не удалось выполнить запрос (${response.status}).`,
      typeof error?.code === 'string' ? error.code : undefined,
    );
  }

  return body as T | null;
}

// Текущие страница и Redux хранят числа.
// Запрещаем преобразование, если оно может потерять точность.
function money(value: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new Error('Сервер вернул некорректную сумму.');
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    throw new Error('Сумма превышает поддерживаемый интерфейсом диапазон.');
  }

  return number;
}

function mapRound(round: RoundResponse): PendingRound | SettledRound {
  const common = {
    id: round.id,
    commitment: round.commitment,
    revealAt: round.revealAt,
  };

  if (round.status === 'PENDING') {
    return {
      ...common,
      status: 'pending',
    };
  }

  const result = round.result;

  if (
    round.status !== 'SETTLED' ||
    !result ||
    !Number.isInteger(result.number) ||
    result.number < 1 ||
    result.number > 10
  ) {
    throw new Error('Сервер вернул некорректный результат раунда.');
  }

  const outcomes = {
    WIN: 'win',
    LOSS: 'loss',
    GREEN: 'green',
  } as const;

  const outcome = outcomes[result.outcome];

  if (!outcome) {
    throw new Error('Сервер вернул неизвестный исход раунда.');
  }

  return {
    ...common,
    status: 'settled',
    number: result.number,
    nonce: result.nonce,
    outcome,
    balanceBefore: money(result.balanceBeforeMinor),
    balanceAfter: money(result.balanceAfterMinor),
    delta: money(result.deltaMinor),
  };
}

async function makeSnapshot(token: string, round: RoundResponse | null): Promise<Snapshot> {
  const wallet = await request<WalletResponse>('/wallet', token);

  if (!wallet || wallet.currency !== 'KUM') {
    throw new Error('Не удалось получить кошелёк КУМ.');
  }

  return {
    balance: money(wallet.balanceMinor),
    available: money(wallet.availableMinor),
    reserved: money(wallet.heldMinor),
    p2pBlockedUntil: wallet.p2pBlockedUntil,
    round: round ? mapRound(round) : null,
  };
}

export async function syncRoulette(): Promise<Snapshot> {
  const token = requireToken();

  const round = await request<RoundResponse>('/roulette-rounds/active', token);

  return makeSnapshot(token, round);
}

export async function startRound(key: string): Promise<Snapshot> {
  const token = requireToken();

  const round = await request<RoundResponse>('/roulette-rounds', token, 'POST', key);

  if (!round) {
    throw new Error('Сервер не вернул созданный раунд.');
  }

  return makeSnapshot(token, round);
}

export async function revealRound(id: string): Promise<Snapshot> {
  const token = requireToken();

  const round = await request<RoundResponse>(
    `/roulette-rounds/${encodeURIComponent(id)}/reveal`,
    token,
  );

  if (!round) {
    throw new Error('Сервер не вернул результат раунда.');
  }

  return makeSnapshot(token, round);
}

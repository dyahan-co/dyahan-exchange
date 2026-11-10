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

const BASE = '/api/v1/roulette';
const TOKEN_KEY = 'dyahan.roulette.demo-token';

let sessionPromise: Promise<string> | undefined;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof body.message === 'string' ? body.message : 'Не удалось выполнить запрос',
    );
  }

  return body as T;
}

async function session(): Promise<string> {
  const saved = sessionStorage.getItem(TOKEN_KEY);
  if (saved) return saved;

  // React StrictMode не должен создавать две демосессии.
  sessionPromise ??= fetch(`${BASE}/demo`, {
    method: 'POST',
  })
    .then((response) => parse<{ token: string }>(response))
    .then(({ token }) => {
      sessionStorage.setItem(TOKEN_KEY, token);
      return token;
    })
    .catch((error: unknown) => {
      sessionPromise = undefined;
      throw error;
    });

  return sessionPromise;
}

async function request(path: string, key?: string): Promise<Snapshot> {
  const token = await session();

  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
  }).then((response) => parse<Snapshot>(response));
}

export const syncRoulette = () => request('/sync');

export const startRound = (key: string) => request('/rounds', key);

export const revealRound = (id: string) => request(`/rounds/${encodeURIComponent(id)}/reveal`);

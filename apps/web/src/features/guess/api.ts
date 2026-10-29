export type Round = {
  roundId: string;
  number: number;
  imageUrl: string;
  expiresAt: string;
  hint: string;
};

export type AnswerResult = {
  correct: boolean;
  correctTitle: string;
  reward: number;
  balanceBefore: number;
  balanceAfter: number;
};

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}

export const startRound = (): Promise<Round> =>
  fetch('/api/guess-rounds', { method: 'POST' }).then((r) => parse<Round>(r));

// roundId служит ключом идемпотентности: повтор не даёт вторую награду.
export const sendAnswer = (roundId: string, answer: string): Promise<AnswerResult> =>
  fetch(`/api/guess-rounds/${roundId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': roundId },
    body: JSON.stringify({ answer }),
  }).then((r) => parse<AnswerResult>(r));

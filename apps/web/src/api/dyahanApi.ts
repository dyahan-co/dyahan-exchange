const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AuthResponse {
  userId: string;
  nickname: string;
  role: string;
  sessionToken: string;
  sessionExpiresAt: string;
}

export interface MeResponse {
  userId: string;
  nickname: string;
  role: string;
  status: string;
}

export interface GuessRound {
  roundId: string;
  imageObjectKey: string;
  imageUrl: string;
  hint: string;
  expiresAt: string;
}

export interface GuessSubmissionResult {
  roundId: string;
  status: 'WON' | 'LOST' | 'EXPIRED';
  score: number;
  rewardTransactionId: string | null;
  closedAt: string | null;
  correct: boolean;
}

interface ApiErrorBody {
  message?: string | string[];
  code?: string;
}

async function request<T>(
  path: string,
  options: {
    method: 'GET' | 'POST';
    token?: string;
    body?: unknown;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером', 0, 'NETWORK_ERROR');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorBody | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message || `Ошибка запроса (${response.status})`;

    throw new ApiError(message, response.status, errorBody?.code);
  }

  return data as T;
}

export const dyahanApi = {
  register(nickname: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { nickname, password, noticeAccepted: true },
    });
  },

  login(nickname: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { nickname, password },
    });
  },

  me(token: string): Promise<MeResponse> {
    return request<MeResponse>('/api/v1/auth/me', { method: 'GET', token });
  },

  logout(token: string): Promise<void> {
    return request<void>('/api/v1/auth/logout', { method: 'POST', token });
  },

  startGuessRound(token: string): Promise<GuessRound> {
    return request<GuessRound>('/api/v1/guess-rounds', { method: 'POST', token });
  },

  submitGuessAnswer(
    token: string,
    roundId: string,
    answer: string,
  ): Promise<GuessSubmissionResult> {
    return request<GuessSubmissionResult>(
      `/api/v1/guess-rounds/${encodeURIComponent(roundId)}/answers`,
      {
        method: 'POST',
        token,
        body: { answer },
      },
    );
  },
};
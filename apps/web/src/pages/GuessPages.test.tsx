import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dyahanApi, type GuessRound } from '../api/dyahanApi';
import { App } from '../app/App';
import { session } from '../auth/session';
import { GuessResultPage } from './GuessResultPage';

vi.mock('../api/dyahanApi', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  dyahanApi: {
    register: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
    startGuessRound: vi.fn(),
    submitGuessAnswer: vi.fn(),
  },
}));

vi.mock('../auth/session', () => ({
  session: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    restore: vi.fn(),
    logout: vi.fn(),
    clear: vi.fn(),
  },
}));

const round: GuessRound = {
  roundId: 'round-test-123',
  imageObjectKey: 'dev/guess/slon.png',
  imageUrl: 'https://images.example.test/slon.png',
  hint: 'Крупное животное с хоботом',
  expiresAt: new Date(Date.now() + 120_000).toISOString(),
};

beforeEach(() => {
  vi.mocked(session.getToken).mockReturnValue('test-session-token');
  vi.mocked(dyahanApi.startGuessRound).mockResolvedValue(round);
  vi.mocked(dyahanApi.submitGuessAnswer).mockResolvedValue({
    roundId: round.roundId,
    status: 'WON',
    score: 1,
    rewardTransactionId: 'reward-test-123',
    closedAt: new Date().toISOString(),
    correct: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('GuessRoundPage', () => {
  it('loads the real round, shows its image and hint, then submits the answer to the API', async () => {
    render(
      <MemoryRouter initialEntries={['/guess']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Слоп-угадайка/ })).toBeInTheDocument();

    expect(dyahanApi.startGuessRound).toHaveBeenCalledWith('test-session-token');

    expect(
      await screen.findByRole('img', { name: 'Картинка для раунда угадайки' }),
    ).toHaveAttribute('src', round.imageUrl);

    expect(screen.getByRole('progressbar', { name: 'Время на ответ' })).toHaveAttribute(
      'aria-valuemax',
      '120',
    );

    fireEvent.click(screen.getByRole('button', { name: /Показать подсказку/ }));
    expect(screen.getByText(round.hint)).toBeInTheDocument();

    const answer = screen.getByRole('textbox', { name: 'Ваш ответ' });
    fireEvent.change(answer, { target: { value: 'слон' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ответить' }));

    await waitFor(() => {
      expect(dyahanApi.submitGuessAnswer).toHaveBeenCalledWith(
        'test-session-token',
        round.roundId,
        'слон',
      );
    });

    expect(await screen.findByRole('heading', { name: 'Ответ засчитан' })).toBeInTheDocument();
    expect(screen.getByText('Сервер подтвердил правильный ответ.')).toBeInTheDocument();
    expect(screen.getByText('+1 КУМ')).toBeInTheDocument();
  });

  it('uses the server expiration time and navigates to the expired result', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/guess']}>
        <App />
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(110_000);
    });

    expect(screen.getByText('00:10')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(screen.getByRole('heading', { name: 'Время вышло' })).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
  });
});

describe('GuessResultPage', () => {
  function renderResult({
    answer = 'слон',
    result = {
      roundId: round.roundId,
      status: 'WON' as const,
      score: 1,
      rewardTransactionId: 'reward-test-123',
      closedAt: new Date().toISOString(),
      correct: true,
    },
    status = '',
  }: {
    answer?: string;
    result?: {
      roundId: string;
      status: 'WON' | 'LOST' | 'EXPIRED';
      score: number;
      rewardTransactionId: string | null;
      closedAt: string | null;
      correct: boolean;
    } | null;
    status?: string;
  } = {}) {
    return render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/guess/result',
            search: status ? `?status=${status}` : '',
            state: { round, answer, result },
          },
        ]}
      >
        <GuessResultPage />
      </MemoryRouter>,
    );
  }

  it('renders a successful server result and the submitted image', () => {
    renderResult();

    expect(screen.getByRole('heading', { name: 'Ответ засчитан' })).toBeInTheDocument();
    expect(screen.getByText('Сервер подтвердил правильный ответ.')).toBeInTheDocument();
    expect(screen.getByText('слон')).toBeInTheDocument();
    expect(screen.getByText('+1 КУМ')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Картинка раунда угадайки' })).toHaveAttribute(
      'src',
      round.imageUrl,
    );
  });

  it('renders an incorrect server result without a reward', () => {
    renderResult({
      result: {
        roundId: round.roundId,
        status: 'LOST',
        score: 0,
        rewardTransactionId: null,
        closedAt: new Date().toISOString(),
        correct: false,
      },
    });

    expect(screen.getByRole('heading', { name: 'Ответ не совпал' })).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
  });

  it('renders an expired round', () => {
    renderResult({ answer: '', result: null, status: 'expired' });

    expect(screen.getByRole('heading', { name: 'Время вышло' })).toBeInTheDocument();
    expect(
      screen.getByText('Раунд завершился по таймеру. Награда за этот раунд не начислена.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
  });

  it('shows a fallback when opened without round result data', () => {
    render(
      <MemoryRouter initialEntries={['/guess/result']}>
        <GuessResultPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Результат недоступен' })).toBeInTheDocument();
  });
});

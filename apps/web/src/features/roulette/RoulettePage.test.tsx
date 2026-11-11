import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { balanceChanged } from '../../store/balanceSlice';
import { makeStore } from '../../store';
import {
  ApiError,
  revealRound,
  startRound,
  syncRoulette,
  type SettledRound,
  type Snapshot,
} from './api';
import { RoulettePage } from './RoulettePage';

vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>();

  return {
    ...original,
    syncRoulette: vi.fn(),
    startRound: vi.fn(),
    revealRound: vi.fn(),
  };
});

vi.mock('./RouletteWheel', () => ({
  RouletteWheel: ({
    rotation,
    pending,
    onFinished,
  }: {
    rotation: number;
    pending: boolean;
    onFinished: () => void;
  }) => (
    <div>
      <output data-testid="wheel-angle">{rotation}</output>
      <span>{pending ? 'Тестовое колесо вращается' : 'Тестовое колесо готово'}</span>
      <button type="button" onClick={onFinished}>
        Завершить анимацию
      </button>
    </div>
  ),
}));

function idle(available = 100): Snapshot {
  return {
    balance: available,
    available,
    reserved: 0,
    p2pBlockedUntil: null,
    round: null,
  };
}

function pending(): Snapshot {
  return {
    ...idle(),
    available: 98,
    reserved: 2,
    round: {
      id: 'round-1',
      status: 'pending',
      commitment: 'commitment',
      revealAt: '2020-01-01T00:00:00Z',
    },
  };
}

function settled(outcome: SettledRound['outcome'] = 'win'): Snapshot {
  const number = outcome === 'green' ? 7 : outcome === 'loss' ? 6 : 5;
  const delta = outcome === 'green' ? -100 : outcome === 'loss' ? -2 : 2;
  const balance = 100 + delta;

  return {
    ...idle(balance),
    p2pBlockedUntil: outcome === 'green' ? '2099-01-01T00:00:00Z' : null,
    round: {
      id: 'round-1',
      status: 'settled',
      commitment: 'commitment',
      revealAt: '2020-01-01T00:00:00Z',
      number,
      nonce: 'nonce',
      outcome,
      balanceBefore: 100,
      balanceAfter: balance,
      delta,
    },
  };
}

function renderPage() {
  const store = makeStore();

  store.dispatch(
    balanceChanged({
      available: 100,
      availableDr: 1200,
      reserved: 0,
    }),
  );

  const view = render(
    <Provider store={store}>
      <RoulettePage />
    </Provider>,
  );

  return { store, ...view };
}

beforeEach(() => {
  vi.mocked(syncRoulette).mockReset();
  vi.mocked(startRound).mockReset();
  vi.mocked(revealRound).mockReset();
});

describe('RoulettePage', () => {
  it('shows loading until the wallet arrives', async () => {
    let resolve!: (snapshot: Snapshot) => void;
    const loaded = new Promise<Snapshot>((done) => {
      resolve = done;
    });

    vi.mocked(syncRoulette).mockReturnValueOnce(loaded);
    renderPage();

    expect(screen.getByText('Загружаем баланс…')).toBeInTheDocument();

    resolve(idle());

    expect(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' })).toBeEnabled();
  });

  it('updates KUM without overwriting DRUB', async () => {
    vi.mocked(syncRoulette).mockResolvedValueOnce(idle(98));
    const { store } = renderPage();

    await screen.findByRole('button', { name: 'Крутить за 2 КУМ' });

    expect(store.getState().balance).toEqual({
      available: 98,
      availableDr: 1200,
      reserved: 0,
    });
  });

  it('disables betting when the available balance is insufficient', async () => {
    vi.mocked(syncRoulette).mockResolvedValueOnce(idle(1));
    renderPage();

    expect(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' })).toBeDisabled();

    expect(screen.getByText('Для нового раунда нужно минимум 2 КУМ.')).toBeInTheDocument();

    expect(startRound).not.toHaveBeenCalled();
  });

  it('allows retrying a failed initial load', async () => {
    vi.mocked(syncRoulette)
      .mockRejectedValueOnce(new Error('Сервер недоступен'))
      .mockResolvedValueOnce(idle());

    renderPage();

    expect(await screen.findByText('Сервер недоступен')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    expect(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' })).toBeEnabled();
  });

  it.each(['win', 'loss', 'green'] as const)(
    'reveals a %s result only after animation finishes',
    async (outcome) => {
      vi.mocked(syncRoulette).mockResolvedValueOnce(idle());
      vi.mocked(startRound).mockResolvedValueOnce(pending());
      vi.mocked(revealRound).mockResolvedValueOnce(settled(outcome));

      const { store } = renderPage();

      fireEvent.click(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' }));

      await waitFor(() => {
        expect(revealRound).toHaveBeenCalledWith('round-1');
        expect(screen.getByTestId('wheel-angle')).toHaveTextContent(
          outcome === 'green' ? '144' : outcome === 'loss' ? '180' : '216',
        );
      });

      expect(screen.queryByText(/^Выпало /)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Завершить анимацию' }));

      expect(await screen.findByText(/^Выпало /)).toHaveTextContent(
        outcome === 'green' ? '7' : outcome === 'loss' ? '6' : '5',
      );

      expect(store.getState().balance.reserved).toBe(0);
      expect(store.getState().balance.availableDr).toBe(1200);

      if (outcome === 'green') {
        expect(screen.getByText(/P2P заблокирован до/)).toBeInTheDocument();
      }
    },
  );

  it('restores a pending round and lets the user retry reading its result', async () => {
    vi.mocked(syncRoulette).mockResolvedValueOnce(pending());

    vi.mocked(revealRound)
      .mockRejectedValueOnce(new Error('Соединение потеряно'))
      .mockResolvedValueOnce(settled());

    renderPage();

    expect(await screen.findByText(/Не удалось получить результат:/)).toHaveTextContent(
      'Соединение потеряно',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Получить результат' }));

    await waitFor(() => {
      expect(revealRound).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('wheel-angle')).toHaveTextContent('216');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Завершить анимацию' }));

    expect(await screen.findByText('Выпало 5')).toBeInTheDocument();
  });

  it('reuses the idempotency key after a network failure', async () => {
    vi.mocked(syncRoulette).mockResolvedValueOnce(idle());

    vi.mocked(startRound)
      .mockRejectedValueOnce(new ApiError(0, 'Сеть недоступна'))
      .mockResolvedValueOnce(settled());

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' }));

    await screen.findByText('Сеть недоступна');

    fireEvent.click(screen.getByRole('button', { name: 'Крутить за 2 КУМ' }));

    await waitFor(() => {
      expect(startRound).toHaveBeenCalledTimes(2);
    });

    expect(vi.mocked(startRound).mock.calls[0][0]).toBe(vi.mocked(startRound).mock.calls[1][0]);
  });

  it('uses a new key after an explicit business rejection', async () => {
    vi.mocked(syncRoulette).mockResolvedValueOnce(idle());

    vi.mocked(startRound)
      .mockRejectedValueOnce(new ApiError(409, 'Раунд уже существует'))
      .mockResolvedValueOnce(settled());

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Крутить за 2 КУМ' }));

    await screen.findByText('Раунд уже существует');

    fireEvent.click(screen.getByRole('button', { name: 'Крутить за 2 КУМ' }));

    await waitFor(() => {
      expect(startRound).toHaveBeenCalledTimes(2);
    });

    expect(vi.mocked(startRound).mock.calls[0][0]).not.toBe(vi.mocked(startRound).mock.calls[1][0]);
  });
});

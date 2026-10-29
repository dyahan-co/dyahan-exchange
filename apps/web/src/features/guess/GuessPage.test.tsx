import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuessPage, formatTime } from './GuessPage';
import * as api from './api';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  startRound: vi.fn(),
  sendAnswer: vi.fn(),
}));

const round = () => ({
  roundId: 'r-1',
  number: 42,
  imageUrl: '/guess-placeholder.svg',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  hint: 'далеко от дома',
});

const win: api.AnswerResult = {
  correct: true,
  correctTitle: 'Кот в космосе',
  reward: 1,
  balanceBefore: 28,
  balanceAfter: 29,
};

beforeEach(() => {
  vi.mocked(api.startRound).mockReset().mockResolvedValue(round());
  vi.mocked(api.sendAnswer).mockReset();
});

describe('formatTime', () => {
  it('форматирует мм:сс и не уходит в минус', () => {
    expect(formatTime(42_000)).toBe('00:42');
    expect(formatTime(60_000)).toBe('01:00');
    expect(formatTime(-5)).toBe('00:00');
  });
});

describe('GuessPage', () => {
  it('показывает раунд из U05', async () => {
    render(<GuessPage />);
    expect(await screen.findByRole('heading', { name: 'Слоп-угадайка' })).toBeInTheDocument();
    expect(screen.getByText(/Раунд #0042/)).toBeInTheDocument();
    expect(screen.getByText('Подсказка: далеко от дома.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ответить' })).toBeDisabled();
  });

  it('верный ответ ведёт на U06: +1 КУМ, баланс 28 → 29', async () => {
    vi.mocked(api.sendAnswer).mockResolvedValue(win);
    const user = userEvent.setup();
    render(<GuessPage />);
    await user.type(await screen.findByLabelText('Ваш ответ'), 'Кот в космосе');
    await user.click(screen.getByRole('button', { name: 'Ответить' }));

    expect(await screen.findByText('Ответ засчитан')).toBeInTheDocument();
    expect(screen.getByTestId('reward')).toHaveTextContent('+1 КУМ');
    expect(screen.getByTestId('balance-before')).toHaveTextContent('28 КУМ');
    expect(screen.getByTestId('balance-after')).toHaveTextContent('29 КУМ');
    expect(api.sendAnswer).toHaveBeenCalledWith('r-1', 'Кот в космосе');
  });

  it('неверный ответ: награда 0, баланс не меняется', async () => {
    vi.mocked(api.sendAnswer).mockResolvedValue({
      ...win,
      correct: false,
      reward: 0,
      balanceAfter: 28,
    });
    const user = userEvent.setup();
    render(<GuessPage />);
    await user.type(await screen.findByLabelText('Ваш ответ'), 'Собака');
    await user.click(screen.getByRole('button', { name: 'Ответить' }));

    expect(await screen.findByText('Ответ не засчитан')).toBeInTheDocument();
    expect(screen.getByTestId('balance-after')).toHaveTextContent('28 КУМ');
  });

  it('защита от двойной отправки', async () => {
    let resolve!: (r: api.AnswerResult) => void;
    vi.mocked(api.sendAnswer).mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<GuessPage />);
    await user.type(await screen.findByLabelText('Ваш ответ'), 'Кот в космосе');
    const button = screen.getByRole('button', { name: 'Ответить' });
    await user.click(button);
    await user.click(button);

    expect(api.sendAnswer).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    resolve(win);
    await waitFor(() => expect(screen.getByText('Ответ засчитан')).toBeInTheDocument());
  });

  it('ошибка загрузки: можно повторить', async () => {
    vi.mocked(api.startRound).mockRejectedValueOnce(new Error('net'));
    const user = userEvent.setup();
    render(<GuessPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить раунд');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Слоп-угадайка' })).toBeInTheDocument();
  });
});

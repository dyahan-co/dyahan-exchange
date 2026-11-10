import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { GuessResultPage } from './GuessResultPage';

afterEach(() => {
  vi.useRealTimers();
});

describe('GuessRoundPage', () => {
  it('shows the round, toggles its hint and submits the answer to the result route', () => {
    render(
      <MemoryRouter initialEntries={['/guess']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Слоп-угадайка/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Время на ответ' })).toHaveAttribute(
      'aria-valuenow',
      '42',
    );

    const hintButton = screen.getByRole('button', { name: /Подсказка: далеко от дома/ });
    fireEvent.click(hintButton);
    expect(screen.getByText(/необычную сцену, связанную с космосом/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Скрыть подсказку/ }));
    expect(screen.queryByText(/необычную сцену, связанную с космосом/)).not.toBeInTheDocument();

    const answer = screen.getByRole('textbox', { name: 'Ваш ответ' });
    const submit = screen.getByRole('button', { name: 'Ответить' });
    expect(submit).toBeDisabled();

    fireEvent.change(answer, { target: { value: '   ' } });
    fireEvent.submit(answer.closest('form') as HTMLFormElement);
    expect(screen.getByRole('heading', { name: /Слоп-угадайка/ })).toBeInTheDocument();

    fireEvent.change(answer, { target: { value: 'Кот в космосе' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(screen.getByRole('heading', { name: 'Ответ отправлен' })).toBeInTheDocument();
    expect(screen.getByText('Кот в космосе')).toBeInTheDocument();
    expect(screen.getByText(/Проверка ответа и начисление награды/)).toBeInTheDocument();
  });

  it('marks the countdown as urgent and routes to the expired result when time runs out', async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={['/guess']}>
        <App />
      </MemoryRouter>,
    );

    for (let second = 0; second < 32; second += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
    }
    expect(screen.getByText('00:10').parentElement).toHaveClass('urgent');

    for (let second = 0; second < 10; second += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
    }
    expect(screen.getByRole('heading', { level: 1, name: /Раунд завершён/ })).toBeInTheDocument();
    expect(screen.getByText('Время вышло')).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
  });
});

describe('GuessResultPage', () => {
  function renderResult(query: string) {
    return render(
      <MemoryRouter initialEntries={[`/guess/result${query}`]}>
        <GuessResultPage />
      </MemoryRouter>,
    );
  }

  it('renders a correct settlement and the updated balance', () => {
    renderResult('?status=correct');

    expect(screen.getByRole('heading', { name: 'Ответ засчитан' })).toBeInTheDocument();
    expect(screen.getByText('Верное название: «Кот в космосе».')).toBeInTheDocument();
    expect(screen.getByText('+1 КУМ')).toBeInTheDocument();
    expect(screen.getByText('29 КУМ')).toBeInTheDocument();
    expect(screen.queryByText(/ИТОГОВЫЕ ДАННЫЕ ПРИХОДЯТ ОТ СЕРВЕРА/)).not.toBeInTheDocument();
  });

  it('renders an incorrect settlement without changing the balance', () => {
    renderResult('?status=incorrect');

    expect(screen.getByRole('heading', { name: 'Ответ не совпал' })).toBeInTheDocument();
    expect(screen.getByText(/Попробуйте сформулировать ответ иначе/)).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
    expect(screen.getAllByText('28 КУМ')).toHaveLength(2);
  });

  it('renders demo, expired and unavailable result states', () => {
    const { unmount } = renderResult('?status=demo&answer=Кот');
    expect(screen.getByRole('heading', { name: 'Ответ отправлен' })).toBeInTheDocument();
    expect(screen.getByText('Кот')).toBeInTheDocument();
    expect(screen.getByText('Проверка на сервере')).toBeInTheDocument();
    unmount();

    const expired = renderResult('?status=expired');
    expect(screen.getByRole('heading', { level: 1, name: /Раунд завершён/ })).toBeInTheDocument();
    expect(screen.getByText(/Не успели отправить ответ/)).toBeInTheDocument();
    expect(screen.getByText('0 КУМ')).toBeInTheDocument();
    expired.unmount();

    renderResult('?status=unknown');
    expect(
      screen.getByRole('heading', { name: 'Результат появится после проверки' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Откройте раунд и отправьте ответ/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Следующий раунд' })).toHaveAttribute('href', '/guess');
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Рынок' })).toHaveAttribute(
      'href',
      '/market',
    );
  });
});

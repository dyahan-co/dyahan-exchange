import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameCards } from './GameCards';
import { MarketAside } from './MarketAside';
import { MarketChart } from './MarketChart';
import { MarketEvents } from './MarketEvents';

afterEach(() => {
  vi.useRealTimers();
});

describe('market interactions', () => {
  it('shows guest and player balance panels and toggles operation history', () => {
    const { unmount } = render(
      <MemoryRouter>
        <MarketAside />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Попробовать бесплатно' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Создать аккаунт' })).toHaveAttribute(
      'href',
      '/register',
    );
    unmount();

    render(
      <MemoryRouter>
        <MarketAside player />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Ваш баланс' })).toBeInTheDocument();
    expect(screen.queryByText('Награда за угадайку')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /История операций/ }));
    expect(screen.getByText('Награда за угадайку')).toBeInTheDocument();
    expect(screen.getByText('Резерв для сделки')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /История операций/ }));
    expect(screen.queryByText('Награда за угадайку')).not.toBeInTheDocument();
  });

  it('opens the demo preview and closes it from each answer', () => {
    render(
      <MemoryRouter>
        <GameCards />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Быстрый preview/ }));
    expect(screen.getByText(/Что происходит на картинке/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Паникует' }));
    expect(screen.queryByText(/Что происходит на картинке/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Быстрый preview/ }));
    fireEvent.click(screen.getByRole('button', { name: /Покупает ещё КУМ/ }));
    expect(screen.queryByText(/Что происходит на картинке/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Быстрый preview/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Уходит в отпуск' }));
    expect(screen.queryByText(/Что происходит на картинке/)).not.toBeInTheDocument();
  });

  it('changes chart ranges, advances demo data and shows a candle tooltip', () => {
    vi.useFakeTimers();
    render(<MarketChart />);

    for (const range of ['1 ч', '6 ч', '1 д', '1 н']) {
      fireEvent.click(screen.getByRole('button', { name: range }));
      expect(screen.getByLabelText(`Демо-график КУМ за ${range}`)).toBeInTheDocument();
    }

    const chart = screen.getByLabelText('Демо-график КУМ за 1 н');
    fireEvent.mouseEnter(chart.querySelector('i') as HTMLElement);
    expect(screen.getByText(/\d{2},\d{2} д₽/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    fireEvent.mouseLeave(chart.parentElement as HTMLElement);
    expect(screen.queryByText(/\d{2},\d{2} д₽/)).not.toBeInTheDocument();
  });

  it('cycles through guest events and renders the player event variant', () => {
    const { unmount } = render(<MarketEvents />);
    expect(screen.getByText('Кит_404')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Следующее событие' }));
    expect(screen.getByText('Бабушка_с_плечом')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Следующее событие' }));
    expect(screen.getByText('Контрагент_42')).toBeInTheDocument();
    unmount();

    render(<MarketEvents player />);
    expect(screen.getByText('ПОСЛЕДНЕЕ СОБЫТИЕ')).toBeInTheDocument();
    expect(screen.getByText('Рынок КУМcoin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Следующее событие' })).not.toBeInTheDocument();
  });
});

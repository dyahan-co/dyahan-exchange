import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeStore } from '../store';
import P2PCreateOrderPage from './P2PCreateOrderPage';
import P2POrderBookPage from './P2POrderBookPage';

function renderPage(page: React.ReactNode) {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter>{page}</MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('P2POrderBookPage', () => {
  it('renders mock orders and links to creating an order', () => {
    renderPage(<P2POrderBookPage />);

    expect(screen.getByRole('heading', { name: 'Стакан P2P' })).toBeInTheDocument();
    expect(screen.getByText('Гостевой доступ')).toBeInTheDocument();
    expect(screen.getByText('Пельмень_228')).toBeInTheDocument();
    expect(screen.getByText('Кот_на_ликвидности')).toBeInTheDocument();
    expect(screen.getByText('Ордерович')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Создать заявку/ })).toHaveAttribute(
      'href',
      '/p2p/create',
    );
  });

  it('changes the selected trade direction and accepts filter values', () => {
    renderPage(<P2POrderBookPage />);

    const tabs = within(screen.getByRole('group', { name: 'Направление сделки' }));
    const buyTab = tabs.getByRole('button', { name: 'Купить КУМ' });
    const sellTab = tabs.getByRole('button', { name: 'Продать КУМ' });

    expect(buyTab).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(sellTab);
    expect(sellTab).toHaveAttribute('aria-pressed', 'true');
    expect(buyTab).toHaveAttribute('aria-pressed', 'false');

    fireEvent.change(screen.getByLabelText('Количество'), { target: { value: '5 КУМ' } });
    fireEvent.change(screen.getByLabelText('Цена за КУМ'), { target: { value: '50 дР' } });
    expect(screen.getByLabelText('Количество')).toHaveValue('5 КУМ');
    expect(screen.getByLabelText('Цена за КУМ')).toHaveValue('50 дР');
  });
});

describe('P2PCreateOrderPage', () => {
  it('shows the default order summary and cancel destination', () => {
    renderPage(<P2PCreateOrderPage />);

    expect(screen.getByRole('heading', { name: 'Создать заявку' })).toBeInTheDocument();
    expect(screen.getByText('420,00')).toBeInTheDocument();
    expect(screen.getByText('10 КУМ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Отменить' })).toHaveAttribute('href', '/p2p');
  });

  it('recalculates the total and reserve when quantity and price change', () => {
    renderPage(<P2PCreateOrderPage />);

    fireEvent.change(screen.getByLabelText('Количество КУМ'), {
      target: { value: '3,25' },
    });
    fireEvent.change(screen.getByLabelText('Цена за 1 КУМ, дР'), {
      target: { value: '12,5' },
    });

    expect(screen.getByText('40,63')).toBeInTheDocument();
    expect(screen.getByText('3.25 КУМ')).toBeInTheDocument();
  });

  it('allows selecting whether to buy or sell', () => {
    renderPage(<P2PCreateOrderPage />);

    const tabs = within(screen.getByRole('group', { name: 'Тип заявки' }));
    const sellTab = tabs.getByRole('button', { name: 'Продать КУМ' });
    const buyTab = tabs.getByRole('button', { name: 'Купить КУМ' });

    expect(sellTab).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(buyTab);
    expect(buyTab).toHaveAttribute('aria-pressed', 'true');
    expect(sellTab).toHaveAttribute('aria-pressed', 'false');
  });
});

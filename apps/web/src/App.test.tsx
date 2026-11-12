import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import userEvent from '@testing-library/user-event';

describe('App routes', () => {
  it('renders the guest market at the root route', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: /Рынок КУМcoin/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Создать аккаунт/ })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('renders the player market at the market route', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/market']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: /Рынок КУМcoin/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Вернуться к угадайке/ })).toHaveAttribute(
      'href',
      '/guess',
    );
  });

  it('navigates from the P2P header tab to the order book and create-order page', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    await user.click(screen.getByRole('link', { name: 'P2P' }));

    expect(screen.getByRole('heading', { name: 'Стакан P2P' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'P2P' })).toHaveClass('active');

    await user.click(screen.getByRole('link', { name: /Создать заявку/ }));

    expect(screen.getByRole('heading', { name: 'Создать заявку' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Отменить' }));

    expect(screen.getByRole('heading', { name: 'Стакан P2P' })).toBeInTheDocument();
  });
});

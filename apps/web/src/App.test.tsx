import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { Provider } from 'react-redux';
import { makeStore } from './store';

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
});

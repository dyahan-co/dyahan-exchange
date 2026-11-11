import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Shell } from './Shell';

afterEach(() => window.localStorage.clear());

describe('Shell', () => {
  it('shows guest market navigation and disclaimer on the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Shell>Market content</Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Войти / регистрация' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByText('Market content')).toBeInTheDocument();
    expect(screen.getByText(/Реальных платежей нет/)).toBeInTheDocument();
  });

  it('shows player navigation on market and guess routes', () => {
    window.localStorage.setItem(
      'dyahan.sessionUser',
      JSON.stringify({
        userId: 'user-1',
        nickname: 'Контрагент_42',
        role: 'PLAYER',
        status: 'ACTIVE',
      }),
    );
    const { unmount } = render(
      <MemoryRouter initialEntries={['/market']}>
        <Shell>Player content</Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Контрагент_42/ })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Рынок' })).toHaveAttribute('href', '/market');
    unmount();

    render(
      <MemoryRouter initialEntries={['/guess/round']}>
        <Shell>Guess content</Shell>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Контрагент_42/ })).toBeInTheDocument();
  });

  it('uses the account shell for non-market account routes', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Shell>Login content</Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Рынок' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Войти / регистрация' })).toBeInTheDocument();
  });
});

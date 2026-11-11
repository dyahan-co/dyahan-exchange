import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Shell } from './Shell';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

function saveSession() {
  window.localStorage.setItem('dyahan.sessionToken', 'test-session-token');

  window.localStorage.setItem(
    'dyahan.sessionUser',
    JSON.stringify({
      userId: 'user-1',
      nickname: 'Контрагент_42',
      role: 'PLAYER',
      status: 'ACTIVE',
    }),
  );
}

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

  it.each(['/market', '/guess/round', '/roulette'])(
    'shows the session user and profile link on %s',
    (path) => {
      saveSession();

      render(
        <MemoryRouter initialEntries={[path]}>
          <Shell>Player content</Shell>
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: /Контрагент_42/ })).toHaveAttribute(
        'href',
        '/profile',
      );

      expect(screen.getByRole('link', { name: 'Рынок' })).toHaveAttribute('href', '/market');

      expect(screen.queryByRole('link', { name: 'Войти / регистрация' })).not.toBeInTheDocument();
    },
  );

  it('shows guest navigation when a saved user has no session token', () => {
    saveSession();
    window.localStorage.removeItem('dyahan.sessionToken');

    render(
      <MemoryRouter initialEntries={['/roulette']}>
        <Shell>Roulette content</Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Войти / регистрация' })).toHaveAttribute(
      'href',
      '/login',
    );

    expect(screen.queryByRole('link', { name: /Контрагент_42/ })).not.toBeInTheDocument();
  });

  it('uses guest navigation on the login route without a session', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Shell>Login content</Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Рынок' })).toHaveAttribute('href', '/');

    expect(screen.getByRole('link', { name: 'Войти / регистрация' })).toBeInTheDocument();
  });
});

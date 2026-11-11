import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from './RequireAuth';
import { session } from '../auth/session';

vi.mock('../auth/session', () => ({
  session: { restore: vi.fn() },
}));

function CurrentPath() {
  const location = useLocation();
  return <p>Текущий путь: {location.pathname}</p>;
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <h1>Профиль игрока</h1>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading status while restoring the session', () => {
    vi.mocked(session.restore).mockReturnValue(new Promise(() => undefined));
    renderProtectedRoute();

    expect(screen.getByRole('status')).toHaveTextContent('Проверяем сессию');
  });

  it('renders protected content for an authenticated user', async () => {
    vi.mocked(session.restore).mockResolvedValue({
      userId: 'user-1',
      nickname: 'Daniil',
      role: 'PLAYER',
      status: 'ACTIVE',
    });
    renderProtectedRoute();

    expect(await screen.findByRole('heading', { name: 'Профиль игрока' })).toBeInTheDocument();
  });

  it('redirects anonymous users to login', async () => {
    vi.mocked(session.restore).mockResolvedValue(null);
    renderProtectedRoute();

    await waitFor(() => expect(screen.getByText('Текущий путь: /login')).toBeInTheDocument());
  });
});

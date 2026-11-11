import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeStore } from '../store';
import { balanceChanged } from '../store/balanceSlice';
import { theme } from '../theme';
import ProfilePage from './ProfilePage';

function LocationText() {
  const { pathname } = useLocation();
  return <output>{pathname}</output>;
}

function renderProfilePage() {
  const store = makeStore();
  store.dispatch(balanceChanged({ available: 42, availableDr: 17, reserved: 4 }));

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LocationText />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(
    'dyahan.sessionUser',
    JSON.stringify({ userId: 'user-1', nickname: 'Daniil', role: 'PLAYER', status: 'ACTIVE' }),
  );
});

describe('ProfilePage', () => {
  it('renders the session nickname and balances from Redux', () => {
    renderProfilePage();

    expect(screen.getByRole('heading', { name: 'Daniil' })).toBeInTheDocument();
    expect(screen.getByLabelText('Баланс игрока')).toHaveTextContent('42 КУМ');
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'STRONG' && element.textContent === '17 д₽',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/История и данные кошелька появятся после подключения API кошелька/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Операций пока нет' })).toBeInTheDocument();
  });

  it('changes the empty state when filtering transaction categories', () => {
    renderProfilePage();

    fireEvent.click(screen.getByRole('button', { name: 'Игры' }));
    expect(screen.getByText('В разделе «Игры» пока нет операций.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Игры' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'P2P' }));
    expect(screen.getByText('В разделе «P2P» пока нет операций.')).toBeInTheDocument();
  });

  it('clears the local session and navigates to login on logout', async () => {
    renderProfilePage();

    fireEvent.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));

    await waitFor(() => expect(screen.getByText('/login')).toBeInTheDocument());
    expect(window.localStorage.getItem('dyahan.sessionUser')).toBeNull();
  });
});

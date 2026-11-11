import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { makeStore } from '../store';
import { balanceChanged } from '../store/balanceSlice';
import { theme } from '../theme';
import ProfilePage from './ProfilePage';

function renderProfilePage() {
  const store = makeStore();
  store.dispatch(balanceChanged({ available: 42, availableDr: 17, reserved: 4 }));

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}>
        <ThemeProvider theme={theme}>
          <ProfilePage />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProfilePage', () => {
  it('renders the profile and balances from the Redux store', () => {
    renderProfilePage();

    expect(screen.getByRole('heading', { name: 'Контрагент_42' })).toBeInTheDocument();
    expect(screen.getByText('42 КУМ')).toBeInTheDocument();
    expect(screen.getByText('17 дР')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent?.includes('Всего у вас') === true,
      ),
    )
      .toHaveTextContent('Всего у вас 46 КУМ: 42 доступны, а 4 выставлены на продажу.');
  });

  it('filters transaction history by category', () => {
    renderProfilePage();

    expect(screen.getByText('Угадайка · раунд #0042')).toBeInTheDocument();
    expect(screen.getByText('Блокировка 4 КУМ для продажи · #P42')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Игры' }));
    expect(screen.getByText('Угадайка · раунд #0042')).toBeInTheDocument();
    expect(screen.getByText('Начисление игрового баланса')).toBeInTheDocument();
    expect(screen.queryByText('Блокировка 4 КУМ для продажи · #P42')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'P2P' }));
    expect(screen.getByText('Блокировка 4 КУМ для продажи · #P42')).toBeInTheDocument();
    expect(screen.queryByText('Угадайка · раунд #0042')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Кредит' }));
    expect(screen.queryByText('Угадайка · раунд #0042')).not.toBeInTheDocument();
    expect(screen.queryByText('Блокировка 4 КУМ для продажи · #P42')).not.toBeInTheDocument();
  });
});

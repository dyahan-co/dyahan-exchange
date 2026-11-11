import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { makeStore } from '../store';
import IntroPage from './IntroPage';

describe('IntroPage', () => {
  it('renders the onboarding guide', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/intro']}>
          <IntroPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: /Добро пожаловать/ })).toBeInTheDocument();
    expect(screen.getByText(/Начните с бесплатной угадайки/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Посмотрите на картинку' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Отправьте свой вариант' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Получите награду' })).toBeInTheDocument();
  });

  it('links to the guessing game and market', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/intro']}>
          <IntroPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('link', { name: 'Начать угадайку' })).toHaveAttribute('href', '/guess');
    expect(screen.getByRole('link', { name: 'Открыть рынок' })).toHaveAttribute('href', '/market');
  });
});

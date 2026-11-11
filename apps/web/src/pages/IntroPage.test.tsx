import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { makeStore } from '../store';
import IntroPage from './IntroPage';

describe('IntroPage', () => {
  it('renders the welcome guide and casino chips image', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/intro']}>
          <IntroPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Добро пожаловать' })).toBeInTheDocument();
    expect(
      screen.getByText('Сначала попробуйте угадайку. Она бесплатная — даже при нулевом балансе.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Посмотрите картинку' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Отправьте один ответ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Получите +1 КУМ' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Dyahan Exchange Casino Chips Stack' }),
    ).toBeInTheDocument();
  });

  it('links to the terminal from both primary actions', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/intro']}>
          <IntroPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('link', { name: 'Начать угадайку' })).toHaveAttribute('href', '/guess');
    expect(screen.getByRole('link', { name: 'Перейти в терминал' })).toHaveAttribute('href', '/market');
  });
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders the brand, primary navigation and account link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Логотип Дяхан' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeInTheDocument();
    for (const label of ['Рынок', 'Игры', 'P2P', 'Чат', 'Банк', 'Сообщество']) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '/');
    }
    expect(screen.getByRole('link', { name: 'Войти / регистрация' })).toHaveAttribute('href', '/');
  });
});

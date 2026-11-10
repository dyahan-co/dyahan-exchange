import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App routes', () => {
  it('renders the guest market at the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Рынок КУМcoin/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Создать аккаунт/ })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});

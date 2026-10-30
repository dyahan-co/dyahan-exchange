import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import { App } from './App';
import { MemoryRouter } from 'react-router-dom';

describe('App', () => {
  it('рисует заголовок и блок баланса', () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Дяхан Exchange' })).toBeInTheDocument();
    expect(screen.getByTestId('balance-available')).toHaveTextContent('0 КУМ');
  });
});

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import { App } from './App';

describe('App', () => {
  it('рисует заголовок и блок баланса', () => {
    render(
      <Provider store={makeStore()}>
        <App />
      </Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Дяхан Exchange' })).toBeInTheDocument();
    expect(screen.getByTestId('balance-available')).toHaveTextContent('0 КУМ');
  });
});

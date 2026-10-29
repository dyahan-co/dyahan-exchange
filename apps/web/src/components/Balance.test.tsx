import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '../store';
import { balanceChanged } from '../store/balanceSlice';
import { Balance } from './Balance';

describe('Balance', () => {
  it('показывает баланс и резерв из стора', () => {
    const store = makeStore();
    store.dispatch(balanceChanged({ available: 42, reserved: 7 }));
    render(
      <Provider store={store}>
        <Balance />
      </Provider>,
    );
    expect(screen.getByTestId('balance-available')).toHaveTextContent('42 КУМ');
    expect(screen.getByTestId('balance-reserved')).toHaveTextContent('В резерве: 7');
  });
});

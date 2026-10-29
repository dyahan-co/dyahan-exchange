import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from './store';
import { App } from './App';

function renderAt(path: string) {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
}

describe('App', () => {
  it('на главной рисует заголовок и блок баланса', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Дяхан Exchange' })).toBeInTheDocument();
    expect(screen.getByTestId('balance-available')).toHaveTextContent('0 КУМ');
  });

  it('неизвестный путь ведёт на главную', () => {
    renderAt('/nope');
    expect(screen.getByRole('heading', { name: 'Дяхан Exchange' })).toBeInTheDocument();
  });
});

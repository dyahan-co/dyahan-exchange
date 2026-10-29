import reducer, { balanceChanged } from './balanceSlice';

describe('balanceSlice', () => {
  it('начинается с нулевого баланса', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual({ available: 0, reserved: 0 });
  });

  it('принимает авторитетное значение с сервера', () => {
    const next = reducer(undefined, balanceChanged({ available: 5, reserved: 2 }));
    expect(next).toEqual({ available: 5, reserved: 2 });
  });
});

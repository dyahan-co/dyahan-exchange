import { describe, expect, it } from 'vitest';
import reducer, { balanceChanged } from './balanceSlice';

describe('partial wallet updates', () => {
  it('preserves DRUB when roulette updates KUM and its hold', () => {
    const state = reducer(
      {
        available: 100,
        availableDr: 1200,
        reserved: 0,
      },
      balanceChanged({
        available: 98,
        reserved: 2,
      }),
    );

    expect(state).toEqual({
      available: 98,
      availableDr: 1200,
      reserved: 2,
    });
  });

  it('accepts an explicit zero DRUB balance', () => {
    const state = reducer(
      {
        available: 100,
        availableDr: 1200,
        reserved: 0,
      },
      balanceChanged({
        available: 102,
        availableDr: 0,
        reserved: 0,
      }),
    );

    expect(state).toEqual({
      available: 102,
      availableDr: 0,
      reserved: 0,
    });
  });
});

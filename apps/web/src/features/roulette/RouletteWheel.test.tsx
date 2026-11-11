import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouletteWheel } from './RouletteWheel';

let nextId: number;
let frames: Map<number, FrameRequestCallback>;

function advanceFrame(time: number) {
  const callbacks = [...frames.values()];
  frames.clear();

  act(() => {
    callbacks.forEach((callback) => callback(time));
  });
}

function wheelGroup(): SVGGElement {
  const svg = screen.getByRole('img', {
    name: 'Колесо рулетки: числа от 1 до 10',
  });

  const group = svg.querySelector<SVGGElement>('g[transform]');

  if (!group) {
    throw new Error('Не найдена вращающаяся группа колеса');
  }

  return group;
}

beforeEach(() => {
  nextId = 0;
  frames = new Map();

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextId;
      frames.set(id, callback);
      return id;
    }),
  );

  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      frames.delete(id);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RouletteWheel', () => {
  it('shows an already settled position without replaying the animation', () => {
    const onFinished = vi.fn();

    render(<RouletteWheel rotation={-180} pending={false} onFinished={onFinished} />);

    expect(wheelGroup()).toHaveAttribute('transform', 'rotate(180 200 200)');
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('spins, keeps labels upright and stops exactly at the server result', () => {
    const onFinished = vi.fn();

    const { rerender, unmount } = render(
      <RouletteWheel rotation={0} pending onFinished={onFinished} />,
    );

    advanceFrame(0);
    advanceFrame(50);

    expect(wheelGroup()).toHaveAttribute('transform', 'rotate(36 200 200)');

    const label = wheelGroup().querySelector('text');
    expect(label?.getAttribute('transform')).toMatch(/^rotate\(-36 /);
    expect(onFinished).not.toHaveBeenCalled();

    rerender(<RouletteWheel rotation={180} pending={false} onFinished={onFinished} />);

    advanceFrame(100);
    advanceFrame(200);

    expect(onFinished).not.toHaveBeenCalled();

    advanceFrame(10000);

    expect(wheelGroup()).toHaveAttribute('transform', 'rotate(180 200 200)');
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('cancels a pending animation when unmounted', () => {
    const onFinished = vi.fn();

    const { unmount } = render(<RouletteWheel rotation={0} pending onFinished={onFinished} />);

    advanceFrame(0);
    expect(frames.size).toBe(1);

    unmount();

    expect(frames.size).toBe(0);
    expect(onFinished).not.toHaveBeenCalled();
  });
});

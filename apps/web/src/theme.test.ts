import { describe, it, expect } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('Проверяет цвета темы', () => {
    expect(theme.palette.primary.main).toBe('#FFD000');
    expect(theme.palette.background.default).toBe('#0A0A0A');
    expect(theme.palette.background.paper).toBe('#141414');
  });
});

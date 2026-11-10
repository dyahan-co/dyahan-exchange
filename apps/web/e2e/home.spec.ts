import { test, expect } from '@playwright/test';

test('guest market shows the terminal and routes to the guessing game', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Рынок КУМcoin/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Играть в угадайку/ })).toHaveAttribute(
    'href',
    '/guess',
  );
});

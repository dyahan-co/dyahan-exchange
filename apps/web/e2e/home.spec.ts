import { test, expect } from '@playwright/test';

test('главная показывает заголовок и нулевой баланс', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Дяхан Exchange' })).toBeVisible();
  await expect(page.getByTestId('balance-available')).toHaveText('999 КУМ');
});

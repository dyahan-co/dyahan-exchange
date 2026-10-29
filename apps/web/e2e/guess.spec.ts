import { expect, test } from '@playwright/test';

test.describe('слоп-угадайка (U05 → U06)', () => {
  test('верный ответ даёт +1 КУМ', async ({ page }) => {
    await page.goto('/guess');

    await expect(page.getByRole('heading', { name: 'Слоп-угадайка' })).toBeVisible();
    await expect(page.getByText('Подсказка: далеко от дома.')).toBeVisible();

    await page.getByLabel('Ваш ответ').fill('Кот в космосе');
    await page.getByRole('button', { name: 'Ответить' }).click();

    await expect(page.getByText('Ответ засчитан')).toBeVisible();
    await expect(page.getByTestId('reward')).toHaveText('+1 КУМ');
    await expect(page.getByTestId('balance-before')).toHaveText('28 КУМ');
    await expect(page.getByTestId('balance-after')).toHaveText('29 КУМ');

    await page.getByRole('button', { name: 'Следующий раунд' }).click();
    await expect(page.getByRole('button', { name: 'Ответить' })).toBeVisible();
  });

  test('неверный ответ не меняет баланс', async ({ page }) => {
    await page.goto('/guess');
    await page.getByLabel('Ваш ответ').fill('Собака на пляже');
    await page.getByRole('button', { name: 'Ответить' }).click();

    await expect(page.getByText('Ответ не засчитан')).toBeVisible();
    await expect(page.getByTestId('reward')).toHaveText('+0 КУМ');
    await expect(page.getByTestId('balance-after')).toHaveText('28 КУМ');
  });
});

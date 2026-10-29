import { expect, test, type Page } from '@playwright/test';

// В CI поднимается только фронтенд, поэтому API угадайки мокаем.
async function mockGuessApi(page: Page) {
  let counter = 41;
  await page.route('**/api/guess-rounds', async (route) => {
    counter += 1;
    await route.fulfill({
      json: {
        roundId: `round-${counter}`,
        number: counter,
        imageUrl: '/guess-placeholder.svg',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        hint: 'далеко от дома',
      },
    });
  });
  await page.route('**/api/guess-rounds/*/answers', async (route) => {
    const body = route.request().postDataJSON() ?? {};
    const text = String(body.answer ?? '').toLowerCase();
    const correct = text.includes('кот') && text.includes('космос');
    await route.fulfill({
      json: {
        correct,
        correctTitle: 'Кот в космосе',
        reward: correct ? 1 : 0,
        balanceBefore: 28,
        balanceAfter: correct ? 29 : 28,
      },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockGuessApi(page);
});

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

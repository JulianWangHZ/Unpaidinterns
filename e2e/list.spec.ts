import { expect, test } from '@playwright/test';

test('signs in with the printed link and shows grouped demo sessions', async ({ page }) => {
  await page.goto('/api/auth?token=e2e-token');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /Needs you/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Working/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Resting/ })).toBeVisible();
  await expect(page.locator('.row')).toHaveCount(5);
  await expect(page.getByText('api-server').first()).toBeVisible();
});

test('rejects a reused sign-in link', async ({ request }) => {
  const response = await request.get('/api/auth?token=e2e-token');
  expect(response.status()).toBe(401);
});

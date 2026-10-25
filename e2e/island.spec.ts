import { expect, test } from '@playwright/test';

test('renders the 3D island with a synced agent list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.island-stage canvas')).toBeVisible();
  const list = page.getByRole('complementary', { name: 'Agents' });
  await expect(list.getByRole('button')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Zoom into api-server' })).toBeVisible();
});

test('shows a bubble over the agent that needs the user', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bubble[data-alert]:not([hidden])')).toContainText('Needs you');
});

test('zooms into a district and back to the overview', async ({ page }) => {
  await page.goto('/');
  const overview = page.getByRole('button', { name: 'Overview' });
  await expect(overview).toHaveCount(0);
  await page.getByRole('button', { name: 'Zoom into docs-site' }).click();
  await expect(overview).toBeVisible();
  await overview.click();
  await expect(overview).toHaveCount(0);
});

test('selects an agent from the side list', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('complementary', { name: 'Agents' }).getByRole('button', { name: /Gemini/ });
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
});

test('rejects a reused sign-in link', async ({ request }) => {
  const response = await request.get('/api/auth?token=e2e-token');
  expect(response.status()).toBe(401);
});

import { expect, test } from '@playwright/test';

test('renders the office scene with a synced agent list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.island-stage canvas')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Office' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Agents' }).getByRole('button')).toHaveCount(5);
});

test('tags every office agent and highlights the one that needs the user', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nametag')).toHaveCount(5);
  await expect(page.locator('.nametag[data-alert]')).toContainText('Needs you');
});

test('shows a bubble only over the agent that needs the user outdoors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Amusement park' }).click();
  await expect(page.locator('.bubble[data-alert]:not([hidden])')).toContainText('Needs you');
  await page.getByRole('tab', { name: 'Office' }).click();
});

test('switches scenes and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Pool' }).click();
  await expect(page.getByRole('tab', { name: 'Pool' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Pool' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Office' }).click();
});

test('follows an agent picked from the side list and returns to the overview', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('complementary', { name: 'Agents' }).getByRole('button', { name: /Gemini/ });
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Overview' }).click();
  await expect(row).toHaveAttribute('aria-pressed', 'false');
});

test('serves an empty model manifest for every scene', async ({ request }) => {
  for (const scene of ['office', 'park', 'pool']) {
    const response = await request.get(`/scenes/${scene}/manifest.json`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ characters: {} });
  }
});

test('rejects a reused sign-in link', async ({ request }) => {
  const response = await request.get('/api/auth?token=e2e-token');
  expect(response.status()).toBe(401);
});

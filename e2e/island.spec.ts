import { expect, test } from '@playwright/test';

const chats = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Chats' });

test('renders the office with a chat list of every agent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.island-stage canvas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Office' })).toHaveAttribute('aria-current', 'page');
  await expect(chats(page).locator('.contact')).toHaveCount(5);
});

test('tags every office agent with its product icon and highlights the one that needs the user', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nametag')).toHaveCount(5);
  await expect(page.locator('.nametag .nt-icon')).toHaveCount(5);
  await expect(page.locator('.nametag[data-alert]')).toContainText('Needs you');
  await expect(page.locator('.nt-name', { hasText: 'fix-auth' })).toBeVisible();
});

test('switches scenes and hides agents from the settings menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Pool' }).click();
  await expect(page.getByRole('radio', { name: 'Pool' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('switch', { name: 'Codex' }).click();
  await expect(chats(page).locator('.contact')).toHaveCount(4);
  await page.getByRole('switch', { name: 'Codex' }).click();
  await page.getByRole('radio', { name: 'Office' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
});

test('opens a conversation from the list and goes back', async ({ page }) => {
  await page.goto('/');
  await chats(page).locator('.contact', { hasText: 'docs-site' }).click();
  await expect(chats(page).locator('.conv-title')).toContainText('docs-site');
  await expect(chats(page).getByRole('textbox')).toBeVisible();
  await chats(page).getByRole('button', { name: 'Back to all chats' }).click();
  await expect(chats(page).locator('.contact')).toHaveCount(5);
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

import { expect, test } from '@playwright/test';

test('renders the office with the agent counts in the top bar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.island-stage canvas')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Office' })).toHaveAttribute('aria-selected', 'true');
  const summary = page.getByLabel('Agent status');
  await expect(summary).toContainText('Needs you');
  await expect(summary).toContainText('Working');
  await expect(summary).toContainText('Done');
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
  // Office shows a name tag per agent, so hiding Codex removes one.
  await page.getByRole('switch', { name: 'Codex' }).click();
  await expect(page.locator('.nametag')).toHaveCount(4);
  await page.getByRole('switch', { name: 'Codex' }).click();
  await expect(page.locator('.nametag')).toHaveCount(5);
  await page.getByRole('radio', { name: 'Pool' }).click();
  await expect(page.getByRole('radio', { name: 'Pool' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Office' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
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

test('keeps the office scene alive across a trip to the board', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('.island-stage canvas');
  await expect(canvas).toBeVisible();
  await canvas.evaluate((element) => element.setAttribute('data-first', ''));
  await page.getByRole('tab', { name: 'Board' }).click();
  await expect(page.getByRole('heading', { name: /To do/ })).toBeVisible();
  await expect(canvas).toBeHidden();
  await page.getByRole('tab', { name: 'Office' }).click();
  await expect(page.locator('.island-stage canvas[data-first]')).toBeVisible();
});

test('puts picture-in-picture beside the settings gear', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('.view-bar-end .tool-button');
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-label', /picture-in-picture|Chrome or Edge/);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).not.toContainText('picture-in-picture');
});

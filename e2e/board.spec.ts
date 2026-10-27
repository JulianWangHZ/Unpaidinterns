import { expect, test } from '@playwright/test';

test('shows every agent as a card in the needs-you, working and done lanes', async ({ page }) => {
  await page.goto('/#/board');
  const needsYou = page.getByRole('region', { name: /Needs you/ });
  const working = page.getByRole('region', { name: /Working/ });
  const done = page.getByRole('region', { name: /Done/ });
  await expect(needsYou.locator('.agent-card')).not.toHaveCount(0);
  await expect(working.locator('.agent-card')).not.toHaveCount(0);
  await expect(done.locator('.agent-card')).not.toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add task' })).toHaveCount(0);
});

test('offers the resume command on every board card', async ({ page }) => {
  await page.goto('/#/board');
  const cards = page.locator('.lanes .agent-card');
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('.lanes .ac-copy')).toHaveCount(await cards.count());
  await expect(page.locator('.lanes .ac-copy').first()).toHaveAttribute('title', /--resume|resume /);
});

test('switches language and remembers it', async ({ page }) => {
  await page.goto('/#/board');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '中文' }).click();
  await expect(page.getByRole('heading', { name: /待釐清/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /待釐清/ })).toBeVisible();
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: /Needs you/ })).toBeVisible();
});

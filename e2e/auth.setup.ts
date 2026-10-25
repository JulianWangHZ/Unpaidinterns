import { expect, test as setup } from '@playwright/test';
import { AUTH_STATE } from '../playwright.config.js';

setup('sign in with the printed link', async ({ page }) => {
  await page.goto('/api/auth?token=e2e-token');
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: AUTH_STATE });
});

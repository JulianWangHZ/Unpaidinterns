import { expect, test, type Locator, type Page } from '@playwright/test';

async function drag(page: Page, from: Locator, to: Locator) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('drag target is not visible');
  await page.mouse.move(start.x + start.width / 2, start.y + 20);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + 28);
  await page.mouse.move(end.x + end.width / 2, end.y + 30, { steps: 15 });
  await page.mouse.up();
}

async function addTask(page: Page, title: string) {
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByPlaceholder('What needs doing?').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
}

const column = (page: Page, name: 'todo' | 'doing' | 'done') => page.locator(`section[data-column="${name}"]`);

test('creates a task, drags it to In progress and keeps it after reload', async ({ page }) => {
  await page.goto('/#/board');
  await addTask(page, 'Ship the board');
  const card = column(page, 'todo').locator('.kc', { hasText: 'Ship the board' });
  await expect(card).toBeVisible();

  await drag(page, card, column(page, 'doing').locator('.stack'));
  await expect(column(page, 'doing').locator('.kc', { hasText: 'Ship the board' })).toBeVisible();

  await page.reload();
  await expect(column(page, 'doing').locator('.kc', { hasText: 'Ship the board' })).toBeVisible();
});

test('binds a live session to a task and shows its status on the card', async ({ page }) => {
  await page.goto('/#/board');
  await addTask(page, 'Pair with Gemini');
  await page.getByRole('button', { name: 'Edit Pair with Gemini' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit task' });
  await dialog.getByRole('checkbox', { name: /Gemini · docs-site/ }).check();
  await expect(dialog.getByLabel('Project')).toHaveValue('docs-site');
  await dialog.getByRole('button', { name: 'Save task' }).click();
  await expect(dialog).toBeHidden();

  const card = page.locator('.kc', { hasText: 'Pair with Gemini' });
  await expect(card.locator('.s')).toContainText('Gemini');
  await expect(card.locator('.meta').first()).toHaveText('docs-site');
});

test('deletes a task from the editor', async ({ page }) => {
  await page.goto('/#/board');
  await addTask(page, 'Throwaway');
  await page.getByRole('button', { name: 'Edit Throwaway' }).click();
  await page.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.locator('.kc', { hasText: 'Throwaway' })).toHaveCount(0);
});

test('switches language and remembers it', async ({ page }) => {
  await page.goto('/#/board');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '中文' }).click();
  await expect(page.getByRole('heading', { name: /待辦/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /待辦/ })).toBeVisible();
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: /To do/ })).toBeVisible();
});

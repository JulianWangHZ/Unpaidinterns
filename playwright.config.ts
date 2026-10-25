import { defineConfig } from '@playwright/test';

const PORT = 4799;

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome' },
  webServer: {
    command: `pnpm --filter @unpaidinterns/web build && pnpm --filter @unpaidinterns/server exec tsx src/main.ts --demo --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    env: { UNPAIDINTERNS_TOKEN: 'e2e-token' },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

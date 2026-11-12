import { defineConfig } from '@playwright/test';

// Ponta a ponta (SPEC-05): o site estático do build, servido na porta fixa do projeto, num celular de 360 px e
// num desktop. `reuseExistingServer: false` faz o teste parar, sem matar nada, se a 3010 já estiver ocupada.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3010',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'celular',
      use: { browserName: 'chromium', viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
    },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'pnpm -s build && node scripts/servir-estatico.mjs',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

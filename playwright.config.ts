import { defineConfig, devices } from '@playwright/test';

const reuseExistingServer = !process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    launchOptions: {
      // Opcional: usar un Chromium ya instalado en lugar del que baja `playwright install`.
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_PATH'] || undefined,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // El flujo completo necesita la API, los dos remotes y el shell.
  webServer: [
    { command: 'npm run api', url: 'http://localhost:3000/api/health', reuseExistingServer },
    {
      command: 'npm run start:catalogo',
      url: 'http://localhost:4201/remoteEntry.json',
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'npm run start:carrito',
      url: 'http://localhost:4202/remoteEntry.json',
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'npm run start:shell',
      url: 'http://localhost:4200/remoteEntry.json',
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});

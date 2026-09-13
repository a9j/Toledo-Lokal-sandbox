import { defineConfig, devices } from '@playwright/test';

/**
 * iPhone 15 sized, against a preview of the production build.
 *
 * Tests that need real data are not here. This environment cannot reach
 * Supabase, so a suite that asserted on real content would fail for a reason
 * that has nothing to do with the code.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'iphone-15',
      use: {
        ...devices['iPhone 15'],
        // iPhone 15 defaults to WebKit. Keep the phone viewport and touch
        // behaviour, but run it on Chromium, which is the engine available in
        // CI and in the build container.
        browserName: 'chromium',
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: {
    // Bind explicitly to IPv4. vite preview defaults to :: and some CI
    // containers have no IPv6, where it fails with EAFNOSUPPORT.
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

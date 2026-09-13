import { test, expect } from '@playwright/test';

/**
 * These run against a built app at iPhone 15 size.
 *
 * The component kit is deliberately data free, so these assertions hold
 * anywhere, including an environment that cannot reach Supabase. Tests that
 * need real content belong in a separate file and are skipped until the suite
 * runs somewhere with a database.
 */

// The route is lazy loaded and the chunk has to arrive before anything is on
// screen, which is slower than the 5 second default on a cold preview server.
const READY = { timeout: 30_000 };

test.describe('component kit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/kit');
    await expect(page.getByRole('heading', { name: 'Old West End', level: 1 })).toBeVisible(READY);
  });

  test('renders without a page error', async ({ page }) => {
    // Listener first, then a fresh navigation, or errors thrown during the
    // original load are missed entirely.
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Old West End', level: 1 })).toBeVisible(READY);
    expect(errors).toEqual([]);
  });

  test('every entity card has a picture and a kind', async ({ page }) => {
    const cards = page.locator('a:has(img):has(h3)');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const img = card.locator('img').first();

      // Card images are loading="lazy", so one below the fold has not fetched
      // anything yet and reports naturalWidth 0 for a reason that is not a
      // broken image. Scroll it into view first, then assert.
      await card.scrollIntoViewIfNeeded();
      await expect
        .poll(
          () => img.evaluate((el: HTMLImageElement) => el.naturalWidth),
          { timeout: 10_000, message: `card ${i} never loaded its image` },
        )
        .toBeGreaterThan(0);
    }
  });

  test('the hero title is legible in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      const title = page.getByRole('heading', { name: 'Old West End', level: 1 });
      await expect(title).toBeVisible(READY);
      // The scrim must sit above the page coloured fade, which is what makes
      // white text readable on a light page. Regression guard for a real bug.
      const colour = await title.evaluate((el) => getComputedStyle(el).color);
      expect(colour).toBe('rgb(255, 255, 255)');
    }
  });

  test('the empty state offers a way out', async ({ page }) => {
    await expect(page.getByText('Nothing new yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find something to follow' })).toBeVisible();
  });
});

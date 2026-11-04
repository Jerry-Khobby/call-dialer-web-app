import { expect, test } from './fixtures';

const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset['theme']);

test.describe('Appearance', () => {
  test('follows the device until the user picks a theme on My Card', async ({ browser, baseURL, makeUser }) => {
    for (const scheme of ['dark', 'light'] as const) {
      const context = await browser.newContext({ baseURL, colorScheme: scheme });
      const page = await context.newPage();
      await page.goto('/login');
      expect(await theme(page)).toBe(scheme);
      await context.close();
    }

    const ama = await makeUser('Ama Owusu');
    await ama.page.goto('/account');
    await ama.page.getByRole('radio', { name: /Light/ }).click();
    expect(await theme(ama.page)).toBe('light');
    await expect(ama.page.getByRole('radio', { name: /Light/ })).toHaveAttribute('aria-checked', 'true');
  });

  test('the chosen theme is applied before the app starts, so a reload never flashes', async ({ makeUser }) => {
    const ama = await makeUser('Ama Owusu');
    await ama.page.goto('/account');
    await ama.page.getByRole('radio', { name: /Dark/ }).click();
    await ama.page.reload({ waitUntil: 'commit' });
    await ama.page.waitForFunction(() => document.documentElement.dataset['theme'] !== undefined);
    expect(await theme(ama.page)).toBe('dark'); // set by index.html's inline script
    const background = await ama.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(11, 13, 18)');
  });
});

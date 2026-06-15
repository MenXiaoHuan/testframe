import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest({
  baseURL: 'https://example.test',
  headers: {
    'x-group-test': 'demo-header',
  },
});

test.describe('groupContext headers', () => {
  test('会注入自定义请求头', async ({ page }) => {
    let requestHeader = '';

    await page.route('https://example.test/headers', async route => {
      requestHeader = route.request().headers()['x-group-test'] ?? '';
      await route.fulfill({
        contentType: 'text/html',
        body: '<h1>headers</h1>',
      });
    });

    await page.goto('https://example.test/headers');

    expect(requestHeader).toBe('demo-header');
    await expect(page.getByRole('heading', { name: 'headers' })).toBeVisible();
  });
});

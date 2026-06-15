import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest({
  baseURL: 'https://example.test',
  cookies: [
    {
      name: 'group-cookie',
      value: 'cookie-value',
      url: 'https://example.test/',
    },
  ],
});

test.describe('groupContext cookies', () => {
  test('会在页面中带上预设 cookie', async ({ page }) => {
    await page.route('https://example.test/cookies', async route => {
      await route.fulfill({
        contentType: 'text/html',
        body: `
          <html>
            <body>
              <script>
                document.body.textContent = document.cookie;
              </script>
            </body>
          </html>
        `,
      });
    });

    await page.goto('https://example.test/cookies');

    await expect(page.locator('body')).toContainText('group-cookie=cookie-value');
  });
});

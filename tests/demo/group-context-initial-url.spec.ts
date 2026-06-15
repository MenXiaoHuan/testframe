import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const initialURL = 'data:text/html,<h1>initial</h1>';
const nextURL = 'data:text/html,<h1>next</h1>';
const test = createGroupTest({
  initialURL,
});

test.describe('groupContext initialURL', () => {
  test('进入测试前会自动打开 initialURL', async ({ page }) => {
    await expect(page).toHaveURL(initialURL);
    await expect(page.locator('h1')).toHaveText('initial');
    await page.goto(nextURL);
  });

  test('下一个测试开始前会重新回到 initialURL', async ({ page }) => {
    await expect(page).toHaveURL(initialURL);
    await expect(page.locator('h1')).toHaveText('initial');
  });
});

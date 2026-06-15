import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

let step = 0;
const test = createGroupTest({
  initialURL: 'data:text/html,<h1>serial</h1>',
});

test.describe('groupContext 默认串行', () => {
  test('第一个测试先运行', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('serial');
    step = 1;
  });

  test('第二个测试在第一个之后运行', async ({ page }) => {
    expect(step).toBe(1);
    await expect(page.locator('h1')).toHaveText('serial');
  });
});

import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

let step = 0;
const test = createGroupTest({
  initialURL: 'data:text/html,<h1>parallel</h1>',
  serial: false,
});

test.describe('groupContext serial opt-out', () => {
  test('第一个测试会修改当前 worker 内的共享状态', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('parallel');
    step = 1;
  });

  test('第二个测试不会被串行模式锁住', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('parallel');
    expect(step).toBe(0);
  });
});

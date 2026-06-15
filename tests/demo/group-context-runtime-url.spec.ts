import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const initialURL = 'data:text/html,<h1>runtime-url</h1>';
const test = createGroupTest({
  initialURL,
});

test.describe('groupContext runtime-url', () => {
  test('会在测试结束前停留在当前页面', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('runtime-url');
  });
});

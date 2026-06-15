import { expect } from '../../utils/allure';
import { demoGroupConfig } from '../../config/test-groups/demo';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest(demoGroupConfig);

test.describe('示例', () => {
  test('进入 Playwright 文档首页', async ({ page }) => {
    await page.getByRole('link', { name: 'Docs' }).click();
    await expect(page).toHaveURL(/\/docs\/intro/);
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });

});

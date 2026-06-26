import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest({
  initialURL: 'data:text/html,<h1>video-check</h1>',
});

test.describe('groupContext video', () => {
  test('保留默认上下文视频录制配置', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('video-check');
  });
});

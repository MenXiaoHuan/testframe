import { expect } from '../../../utils/allure';
import { interviewLoginGroupConfig } from '../../../config/test-groups/interview_login';
import { createGroupTest } from '../../../utils/groupContext';

const test = createGroupTest(interviewLoginGroupConfig);

test.describe('登录模块', () => {
  
  test('输入正确的账号和密码', async ({ page }) => {
    await page.locator('uni-input').filter({ hasText: '请输入您的账号' }).getByRole('textbox').click();
    await page.locator('uni-input').filter({ hasText: '请输入您的账号' }).getByRole('textbox').fill('admin001');
    await page.locator('uni-input').filter({ hasText: '请输入您的密码' }).getByRole('textbox').click();
    await page.locator('uni-input').filter({ hasText: '请输入您的密码' }).getByRole('textbox').fill('666999');
    await page.getByText('登 录').click();
    await expect(page).toHaveURL(`${interviewLoginGroupConfig.baseURL}/#/pages/home/index`);
  });

});

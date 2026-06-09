import os from 'node:os';

import { defineConfig, devices } from '@playwright/test';
import { Status } from 'allure-js-commons';

const sharedUse = {
  viewport: { width: 1440, height: 900 },
  screenshot: 'on' as const,
  trace: 'on' as const,
  video: 'on' as const,
  ignoreHTTPSErrors: true,
};

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  retries: 1,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: './.allure-results',
        detail: true,
        suiteTitle: true,
        categories: [
          {
            name: '超时失败',
            messageRegex: '.*timeout.*exceeded.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: '定位器或元素不可见',
            messageRegex: '.*locator\\.|.*element is not visible.*|.*waiting for locator.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: '断言失败',
            messageRegex: '.*expect\\(|.*toHave.*|.*toBe.*|.*AssertionError.*',
            matchedStatuses: [Status.FAILED],
          },
          {
            name: '用例数据或步骤配置异常',
            messageRegex: '.*未支持的步骤动作.*|.*Cannot read properties.*',
            matchedStatuses: [Status.BROKEN],
          },
        ],
        environmentInfo: {
          site_config_mode: 'group_context',
          node_version: process.version,
          os_arch: os.arch(),
          os_platform: os.platform(),
          os_release: os.release(),
        },
      },
    ],
  ],
  outputDir: './.playwright-artifacts',
  use: sharedUse,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...sharedUse,
      },
    },
  ],
});

import os from 'node:os';

import { defineConfig, devices } from '@playwright/test';
import { Status } from 'allure-js-commons';
import { buildAllureEnvironmentInfo } from './utils/allureMetadata';

const sharedUse = {
  viewport: { width: 1440, height: 900 },
  screenshot: 'on' as const,
  trace: 'on' as const,
  video: 'on' as const,
  ignoreHTTPSErrors: true,
};

const environmentInfo = buildAllureEnvironmentInfo({
  env: process.env,
  browserProject: 'chromium',
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  osPlatform: os.platform(),
  osRelease: os.release(),
});

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
            name: '页面加载或路由异常',
            messageRegex: '.*page.goto.*|.*waitForURL.*|.*net::ERR_.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: 'HTTPS 或证书异常',
            messageRegex: '.*ERR_CERT_AUTHORITY_INVALID.*|.*SSL.*|.*certificate.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: '接口响应异常',
            messageRegex: '.*waitForResponse.*|.*Response.*status.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: '元素定位异常',
            messageRegex: '.*locator\\.|.*element is not visible.*|.*waiting for locator.*',
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: '断言异常',
            messageRegex: '.*expect\\(|.*toHave.*|.*toBe.*|.*AssertionError.*',
            matchedStatuses: [Status.FAILED],
          },
          {
            name: '数据准备异常',
            messageRegex: '.*storageState.*|.*ENOENT.*|.*Cannot find module.*',
            matchedStatuses: [Status.BROKEN],
          },
          {
            name: '脚本逻辑异常',
            messageRegex: '.*Cannot read properties.*|.*TypeError.*|.*ReferenceError.*',
            matchedStatuses: [Status.BROKEN],
          },
        ],
        environmentInfo,
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

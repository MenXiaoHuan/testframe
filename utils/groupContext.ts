import type {
  BrowserContext,
  BrowserContextOptions,
} from '@playwright/test';

import { test } from './allure';

type ContextCookie = Parameters<BrowserContext['addCookies']>[0][number];

export type GroupTestOptions = {
  baseURL?: string;
  initialURL?: string;
  serial?: boolean;
  headers?: Record<string, string>;
  cookies?: ContextCookie[];
  contextOptions?: Omit<BrowserContextOptions, 'baseURL' | 'extraHTTPHeaders'>;
};

export function createGroupTest(options: GroupTestOptions = {}) {
  const groupTest = test.extend({
    context: async ({ browser }, use) => {
      const context = await browser.newContext({
        baseURL: options.baseURL,
        extraHTTPHeaders: options.headers,
        ...options.contextOptions,
      });

      if (options.cookies?.length) {
        await context.addCookies(options.cookies);
      }

      await use(context);
      await context.close();
    },

    page: async ({ context }, use) => {
      const page = await context.newPage();

      if (options.initialURL) {
        await page.goto(options.initialURL);
      }

      await use(page);
      await page.close();
    },
  });

  if (options.serial ?? true) {
    groupTest.describe.configure({ mode: 'serial' });
  }

  groupTest.afterEach(async ({ page }, testInfo) => {
    if (page.isClosed()) {
      return;
    }

    await testInfo.attach('runtime-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  });

  return groupTest;
}

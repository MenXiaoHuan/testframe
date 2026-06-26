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
    contextOptions: async ({ contextOptions }, use) => {
      const mergedHeaders = {
        ...(contextOptions.extraHTTPHeaders ?? {}),
        ...(options.headers ?? {}),
      };
      await use({
        ...contextOptions,
        ...options.contextOptions,
        baseURL: options.baseURL ?? contextOptions.baseURL,
        extraHTTPHeaders: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
      });
    },

    context: async ({ context }, use) => {
      if (options.cookies?.length) {
        await context.addCookies(options.cookies);
      }

      await use(context);
    },

    page: async ({ page }, use) => {
      if (options.initialURL) {
        await page.goto(options.initialURL);
      }

      await use(page);
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

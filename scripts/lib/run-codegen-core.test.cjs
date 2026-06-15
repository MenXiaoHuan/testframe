const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildGroupTestOptions,
  buildNativeCodegenArgs,
  extractGeneratedTestBody,
  isManagedTemplate,
  normalizeRecordedBody,
  renderCodegenTemplate,
  resolveCodegenUrl,
} = require('./run-codegen-core.cjs');

test('buildGroupTestOptions maps runtime to createGroupTest config', () => {
  const groupTestOptions = buildGroupTestOptions(
    {
      url: 'https://playwright.dev/',
    },
    {
      url: 'https://playwright.dev/',
      contextOptions: {
        baseURL: 'https://playwright.dev',
        extraHTTPHeaders: {
          'x-demo': 'yes',
        },
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        storageState: {
          cookies: [],
          origins: [],
        },
      },
    },
  );

  assert.deepEqual(groupTestOptions, {
    baseURL: 'https://playwright.dev',
    initialURL: 'https://playwright.dev/',
    headers: {
      'x-demo': 'yes',
    },
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      storageState: {
        cookies: [],
        origins: [],
      },
    },
  });
});

test('renderCodegenTemplate outputs createGroupTest scaffold', () => {
  const template = renderCodegenTemplate(
    {
      name: 'playwright-demo',
      output: '/Users/bytedance/playwright_framework/tests/codegen/playwright-demo.spec.ts',
    },
    {
      url: 'https://playwright.dev/',
      contextOptions: {
        baseURL: 'https://playwright.dev',
        viewport: { width: 1440, height: 900 },
      },
    },
  );

  assert.match(template, /import \{ expect \} from '\.\.\/\.\.\/utils\/allure';/);
  assert.match(template, /import \{ createGroupTest \} from '\.\.\/\.\.\/utils\/groupContext';/);
  assert.match(template, /const test = createGroupTest\(\{/);
  assert.match(template, /initialURL": "https:\/\/playwright\.dev\/"/);
  assert.match(template, /test\.describe\('Playwright Demo'/);
  assert.match(template, /test\('executes recorded flow', async \(\{ page \}\)/);
  assert.match(template, /Paste recorded steps here\./);
  assert.equal(isManagedTemplate(template), true);
});

test('renderCodegenTemplate uses a natural fallback title when name is missing', () => {
  const template = renderCodegenTemplate(
    {
      output: '/Users/bytedance/playwright_framework/tests/codegen/recorded.spec.ts',
    },
    {
      contextOptions: {},
    },
  );

  assert.match(template, /test\.describe\('Recorded Scenario'/);
  assert.match(template, /test\('executes recorded flow', async \(\{ page \}\)/);
});

test('resolveCodegenUrl resolves relative initialURL against baseURL', () => {
  assert.equal(
    resolveCodegenUrl({
      url: '/#/pages/login/index',
      contextOptions: {
        baseURL: 'https://localhost:5173',
      },
    }),
    'https://localhost:5173/#/pages/login/index',
  );
});

test('buildNativeCodegenArgs includes temp output and storage file', () => {
  const args = buildNativeCodegenArgs(
    {
      browser: 'chromium',
      device: 'iPhone 11',
    },
    {
      url: 'https://playwright.dev/',
      contextOptions: {},
    },
    '/tmp/recorded.spec.ts',
    '/tmp/storage.json',
  );

  assert.deepEqual(args, [
    'playwright',
    'codegen',
    '--output',
    '/tmp/recorded.spec.ts',
    '--viewport-size',
    '1440,900',
    '--ignore-https-errors',
    '-b',
    'chromium',
    '--device',
    'iPhone 11',
    'https://playwright.dev/',
    '--load-storage',
    '/tmp/storage.json',
  ]);
});

test('extractGeneratedTestBody returns raw playwright steps', () => {
  const source = `import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Docs' }).click();
  await expect(page).toHaveURL(/\\/docs\\/intro/);
});
`;

  assert.equal(
    extractGeneratedTestBody(source),
    [
      "await page.goto('https://playwright.dev/');",
      "await page.getByRole('link', { name: 'Docs' }).click();",
      "await expect(page).toHaveURL(/\\/docs\\/intro/);",
    ].join('\n'),
  );
});

test('normalizeRecordedBody drops the initial goto when it matches initialURL', () => {
  const source = `import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Docs' }).click();
  await expect(page).toHaveURL(/\\/docs\\/intro/);
});
`;

  assert.equal(
    normalizeRecordedBody(source, {
      url: 'https://playwright.dev/',
      contextOptions: {},
    }),
    [
      "await page.getByRole('link', { name: 'Docs' }).click();",
      "await expect(page).toHaveURL(/\\/docs\\/intro/);",
    ].join('\n'),
  );
});

test('normalizeRecordedBody trims trailing spaces and collapses repeated blank lines', () => {
  const source = `import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  
  await page.getByRole('link', { name: 'Docs' }).click();  
  
  
  await expect(page).toHaveURL(/\\/docs\\/intro/);
});
`;

  assert.equal(
    normalizeRecordedBody(source, {
      url: 'https://playwright.dev/',
      contextOptions: {},
    }),
    [
      "await page.getByRole('link', { name: 'Docs' }).click();",
      '',
      "await expect(page).toHaveURL(/\\/docs\\/intro/);",
    ].join('\n'),
  );
});

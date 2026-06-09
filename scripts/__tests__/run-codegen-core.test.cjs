const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRecordingContextOptions,
  resolveRecordingRuntime,
  runCodegen,
} = require('../lib/run-codegen-core.cjs');

test('buildRecordingContextOptions applies default viewport and https settings', () => {
  assert.deepEqual(
    buildRecordingContextOptions(
      {
        device: null,
      },
      {
        devices: {},
      }
    ),
    {
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    }
  );
});

test('buildRecordingContextOptions merges device descriptors over defaults', () => {
  assert.deepEqual(
    buildRecordingContextOptions(
      {
        device: 'iPhone 13',
      },
      {
        devices: {
          'iPhone 13': {
            viewport: { width: 390, height: 844 },
            userAgent: 'Mobile UA',
            isMobile: true,
          },
        },
      }
    ),
    {
      viewport: { width: 390, height: 844 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mobile UA',
      isMobile: true,
    }
  );
});

test('resolveRecordingRuntime merges env, role, and cli headers while using inline role storageState', () => {
  assert.deepEqual(
    resolveRecordingRuntime(
      {
        env: 'local',
        role: 'admin',
        headers: {
          Authorization: 'Bearer override-token',
          'X-Trace-Id': 'trace-001',
        },
        url: 'https://localhost:5173/#/pages/login/index',
      },
      {
        loadRecordingConfig(kind, name) {
          if (kind === 'env' && name === 'local') {
            return {
              baseURL: 'https://localhost:5173',
              headers: {
                'X-App-Env': 'local',
              },
            };
          }

          if (kind === 'role' && name === 'admin') {
            return {
              storageState: {
                cookies: [
                  {
                    name: 'admin_session',
                    value: 'session-from-role',
                    domain: 'localhost',
                    path: '/',
                  },
                ],
                origins: [
                  {
                    origin: 'https://localhost:5173',
                    localStorage: [
                      {
                        name: 'token',
                        value: 'token-from-role',
                      },
                    ],
                  },
                ],
              },
              headers: {
                Authorization: 'Bearer admin-token',
              },
            };
          }

          return null;
        },
      }
    ),
    {
      url: 'https://localhost:5173/#/pages/login/index',
      contextOptions: {
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        baseURL: 'https://localhost:5173',
        extraHTTPHeaders: {
          'X-App-Env': 'local',
          Authorization: 'Bearer override-token',
          'X-Trace-Id': 'trace-001',
        },
        storageState: {
          cookies: [
            {
              name: 'admin_session',
              value: 'session-from-role',
              domain: 'localhost',
              path: '/',
            },
          ],
          origins: [
            {
              origin: 'https://localhost:5173',
              localStorage: [
                {
                  name: 'token',
                  value: 'token-from-role',
                },
              ],
            },
          ],
        },
      },
    }
  );
});

test('runCodegen launches the selected browser, opens a page, and pauses recording', async () => {
  const calls = [];
  let paused = false;
  let closed = false;

  const page = {
    async goto(url) {
      calls.push(['goto', url]);
    },
    async pause() {
      paused = true;
      calls.push(['pause']);
    },
  };

  const context = {
    async newPage() {
      calls.push(['newPage']);
      return page;
    },
  };

  const browser = {
    async newContext(options) {
      calls.push(['newContext', options]);
      return context;
    },
    async close() {
      closed = true;
      calls.push(['close']);
    },
  };

  await runCodegen({
    options: {
      project: 'chromium',
      browser: 'firefox',
      device: 'iPhone 13',
      url: 'https://localhost:5173/#/pages/login/index',
    },
    playwright: {
      firefox: {
        async launch(options) {
          calls.push(['launch', 'firefox', options]);
          return browser;
        },
      },
    },
    devices: {
      'iPhone 13': {
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  });

  assert.deepEqual(calls, [
    ['launch', 'firefox', { headless: false }],
    [
      'newContext',
      {
        viewport: { width: 390, height: 844 },
        ignoreHTTPSErrors: true,
        isMobile: true,
      },
    ],
    ['newPage'],
    ['goto', 'https://localhost:5173/#/pages/login/index'],
    ['pause'],
    ['close'],
  ]);
  assert.equal(paused, true);
  assert.equal(closed, true);
});

test('runCodegen passes env, role, headers, and inline role storageState through the recording runtime', async () => {
  const calls = [];

  const page = {
    async goto(url) {
      calls.push(['goto', url]);
    },
    async pause() {
      calls.push(['pause']);
    },
  };

  const browser = {
    async newContext(options) {
      calls.push(['newContext', options]);
      return {
        async newPage() {
          calls.push(['newPage']);
          return page;
        },
      };
    },
    async close() {
      calls.push(['close']);
    },
  };

  await runCodegen({
    options: {
      project: 'chromium',
      env: 'local',
      role: 'admin',
      headers: {
        Authorization: 'Bearer override-token',
        'X-Trace-Id': 'trace-001',
      },
      url: 'https://localhost:5173/#/pages/login/index',
    },
    playwright: {
      chromium: {
        async launch() {
          calls.push(['launch']);
          return browser;
        },
      },
    },
    devices: {},
    loadRecordingConfig(kind, name) {
      if (kind === 'env' && name === 'local') {
        return {
          baseURL: 'https://localhost:5173',
          headers: {
            'X-App-Env': 'local',
          },
        };
      }

      if (kind === 'role' && name === 'admin') {
        return {
          storageState: {
            cookies: [
              {
                name: 'admin_session',
                value: 'session-from-role',
                domain: 'localhost',
                path: '/',
              },
            ],
            origins: [
              {
                origin: 'https://localhost:5173',
                localStorage: [
                  {
                    name: 'token',
                    value: 'token-from-role',
                  },
                ],
              },
            ],
          },
          headers: {
            Authorization: 'Bearer admin-token',
          },
        };
      }

      return null;
    },
  });

  assert.deepEqual(calls, [
    ['launch'],
    [
      'newContext',
      {
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        baseURL: 'https://localhost:5173',
        extraHTTPHeaders: {
          'X-App-Env': 'local',
          Authorization: 'Bearer override-token',
          'X-Trace-Id': 'trace-001',
        },
        storageState: {
          cookies: [
            {
              name: 'admin_session',
              value: 'session-from-role',
              domain: 'localhost',
              path: '/',
            },
          ],
          origins: [
            {
              origin: 'https://localhost:5173',
              localStorage: [
                {
                  name: 'token',
                  value: 'token-from-role',
                },
              ],
            },
          ],
        },
      },
    ],
    ['newPage'],
    ['goto', 'https://localhost:5173/#/pages/login/index'],
    ['pause'],
    ['close'],
  ]);
});

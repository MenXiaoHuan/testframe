const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseCodegenArgs,
  buildCodegenArgs,
  defaultCodegenOutput,
} = require('../lib/run-codegen-options.cjs');

test('defaultCodegenOutput maps scene names into tests/codegen/*.spec.ts', () => {
  assert.equal(defaultCodegenOutput('login'), 'tests/codegen/login.spec.ts');
  assert.equal(
    defaultCodegenOutput('user-profile'),
    'tests/codegen/user-profile.spec.ts'
  );
});

test('parseCodegenArgs uses scene name and url defaults', () => {
  assert.deepEqual(
    parseCodegenArgs([
      '--name',
      'login',
      '--url',
      'https://localhost:5173/#/pages/login/index',
    ]),
    {
      name: 'login',
      env: null,
      role: null,
      headers: {},
      project: null,
      device: null,
      browser: null,
      url: 'https://localhost:5173/#/pages/login/index',
      output: 'tests/codegen/login.spec.ts',
    }
  );
});

test('parseCodegenArgs stores project, device, and browser', () => {
  assert.deepEqual(
    parseCodegenArgs([
      '--name',
      'login',
      '--env',
      'local',
      '--role',
      'admin',
      '--header',
      'X-Trace-Id=trace-001',
      '--header',
      'Authorization=Bearer override-token',
      '--project',
      'chromium',
      '--device',
      'iPhone 13',
      '--browser',
      'firefox',
      '--url',
      'https://localhost:5173/#/pages/login/index',
    ]),
    {
      name: 'login',
      env: 'local',
      role: 'admin',
      headers: {
        'X-Trace-Id': 'trace-001',
        Authorization: 'Bearer override-token',
      },
      project: 'chromium',
      device: 'iPhone 13',
      browser: 'firefox',
      url: 'https://localhost:5173/#/pages/login/index',
      output: 'tests/codegen/login.spec.ts',
    }
  );
});

test('buildCodegenArgs builds playwright codegen command', () => {
  assert.deepEqual(
    buildCodegenArgs({
      output: 'tests/codegen/login.spec.ts',
      url: 'https://localhost:5173/#/pages/login/index',
    }),
    [
      'playwright',
      'codegen',
      '--output',
      'tests/codegen/login.spec.ts',
      '--viewport-size',
      '1440,900',
      '--ignore-https-errors',
      'https://localhost:5173/#/pages/login/index',
    ]
  );
});

test('buildCodegenArgs uses project defaults and lets explicit browser win', () => {
  assert.deepEqual(
    buildCodegenArgs({
      output: 'tests/codegen/login.spec.ts',
      url: 'https://localhost:5173/#/pages/login/index',
      project: 'chromium',
      device: 'iPhone 13',
      browser: 'firefox',
    }),
    [
      'playwright',
      'codegen',
      '--output',
      'tests/codegen/login.spec.ts',
      '--viewport-size',
      '1440,900',
      '--ignore-https-errors',
      '-b',
      'firefox',
      '--device',
      'iPhone 13',
      'https://localhost:5173/#/pages/login/index',
    ]
  );
});

test('buildCodegenArgs falls back to chromium project browser when browser is omitted', () => {
  assert.deepEqual(
    buildCodegenArgs({
      output: 'tests/codegen/login.spec.ts',
      url: 'https://localhost:5173/#/pages/login/index',
      project: 'chromium',
      device: null,
      browser: null,
    }),
    [
      'playwright',
      'codegen',
      '--output',
      'tests/codegen/login.spec.ts',
      '--viewport-size',
      '1440,900',
      '--ignore-https-errors',
      '-b',
      'chromium',
      'https://localhost:5173/#/pages/login/index',
    ]
  );
});

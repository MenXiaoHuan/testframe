const test = require('node:test');
const assert = require('node:assert/strict');

const {
  cleanupPaths,
  createOpenReport,
  resolveExitCode,
  runE2E,
} = require('../lib/run-e2e-core.cjs');

test('cleanupPaths deletes the known artifact directories', () => {
  const removed = [];

  cleanupPaths({
    rmSync(pathname, options) {
      removed.push([pathname, options]);
    },
  });

  assert.deepEqual(removed, [
    ['./.allure-results', { recursive: true, force: true }],
    ['./reports/allure-report', { recursive: true, force: true }],
    ['./.playwright-artifacts', { recursive: true, force: true }],
  ]);
});

test('resolveExitCode prefers test failures over report failures', () => {
  assert.equal(resolveExitCode(1, 0), 1);
  assert.equal(resolveExitCode(1, 2), 1);
  assert.equal(resolveExitCode(0, 2), 2);
  assert.equal(resolveExitCode(0, 0), 0);
});

test('runE2E executes tests then generates report and auto-opens locally', () => {
  const calls = [];
  let opened = false;

  const result = runE2E({
    argv: ['--target', 'tests/interview_agent/login/login.spec.ts'],
    env: {},
    runSync(command, args) {
      calls.push([command, args]);
      return { status: 0 };
    },
    openReport() {
      opened = true;
    },
    cleanup() {
      calls.push(['cleanup', []]);
    },
  });

  assert.deepEqual(calls, [
    ['cleanup', []],
    ['npx', ['playwright', 'test', 'tests/interview_agent/login/login.spec.ts']],
    [
      'npx',
      [
        'allure',
        'awesome',
        './.allure-results',
        '--output',
        './reports/allure-report',
        '--report-name',
        'Allure 自动化测试报告',
        '--report-language',
        'zh',
        '--hide-labels',
        'package',
        '--hide-labels',
        'feature',
        '--hide-labels',
        'titlePath',
        '--hide-labels',
        'parentSuite',
        '--hide-labels',
        'subSuite',
        '--hide-labels',
        'host',
        '--hide-labels',
        'thread',
      ],
    ],
  ]);
  assert.equal(opened, true);
  assert.equal(result.exitCode, 0);
});

test('runE2E does not auto-open report in CI mode', () => {
  let opened = false;

  const result = runE2E({
    argv: [],
    env: { CI: 'true' },
    runSync() {
      return { status: 0 };
    },
    openReport() {
      opened = true;
    },
    cleanup() {},
  });

  assert.equal(opened, false);
  assert.equal(result.exitCode, 0);
});

test('runE2E returns test failure even when report generation also fails', () => {
  let runCount = 0;

  const result = runE2E({
    argv: [],
    env: { CI: 'true' },
    runSync() {
      runCount += 1;
      return runCount === 1 ? { status: 1 } : { status: 2 };
    },
    openReport() {},
    cleanup() {},
  });

  assert.equal(result.testStatus, 1);
  assert.equal(result.reportStatus, 2);
  assert.equal(result.exitCode, 1);
});

test('createOpenReport launches allure open as a detached local process', () => {
  let unrefCalled = false;
  let captured = null;

  const openReport = createOpenReport({
    spawn(command, args, options) {
      captured = { command, args, options };
      return {
        unref() {
          unrefCalled = true;
        },
      };
    },
  });

  openReport();

  assert.deepEqual(captured.command, 'npx');
  assert.deepEqual(captured.args, ['allure', 'open', './reports/allure-report']);
  assert.equal(captured.options.detached, true);
  assert.equal(captured.options.stdio, 'ignore');
  assert.equal(unrefCalled, true);
});

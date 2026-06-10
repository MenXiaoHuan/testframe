const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectCi,
  parseArgs,
  buildPlaywrightArgs,
} = require('../lib/run-e2e-options.cjs');

test('detectCi returns true for explicit CI providers and flags', () => {
  assert.equal(detectCi({ CI: 'true' }), true);
  assert.equal(detectCi({ GITHUB_ACTIONS: 'true' }), true);
  assert.equal(detectCi({ BUILDKITE: 'true' }), true);
  assert.equal(detectCi({ GITLAB_CI: 'true' }), true);
});

test('detectCi returns false for local env values, including CI=1', () => {
  assert.equal(detectCi({}), false);
  assert.equal(detectCi({ CI: 'false' }), false);
  assert.equal(detectCi({ CI: '1' }), false);
});

test('parseArgs handles file target and headed flag', () => {
  const options = parseArgs([
    '--target',
    'tests/interview_agent/login/login.spec.ts',
    '--headed',
  ]);

  assert.deepEqual(options, {
    target: 'tests/interview_agent/login/login.spec.ts',
    grep: null,
    project: null,
    headed: true,
    debug: false,
  });
});

test('parseArgs handles debug mode without target', () => {
  const options = parseArgs(['--debug']);

  assert.deepEqual(options, {
    target: null,
    grep: null,
    project: null,
    headed: false,
    debug: true,
  });
});

test('parseArgs handles grep and project filters', () => {
  const options = parseArgs(['--grep', '登录', '--project', 'chromium']);

  assert.deepEqual(options, {
    target: null,
    grep: '登录',
    project: 'chromium',
    headed: false,
    debug: false,
  });
});

test('buildPlaywrightArgs builds full command args', () => {
  const args = buildPlaywrightArgs({
    target: 'tests/interview_agent/login/login.spec.ts',
    grep: null,
    project: null,
    headed: true,
    debug: false,
  });

  assert.deepEqual(args, [
    'playwright',
    'test',
    'tests/interview_agent/login/login.spec.ts',
    '--headed',
  ]);
});

test('buildPlaywrightArgs omits target in full run mode', () => {
  const args = buildPlaywrightArgs({
    target: null,
    grep: null,
    project: null,
    headed: false,
    debug: true,
  });

  assert.deepEqual(args, ['playwright', 'test', '--debug']);
});

test('buildPlaywrightArgs appends grep and project flags', () => {
  const args = buildPlaywrightArgs({
    target: 'tests/interview_agent/login/login.spec.ts',
    grep: '登录',
    project: 'chromium',
    headed: false,
    debug: false,
  });

  assert.deepEqual(args, [
    'playwright',
    'test',
    'tests/interview_agent/login/login.spec.ts',
    '--grep',
    '登录',
    '--project',
    'chromium',
  ]);
});

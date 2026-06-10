const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

test('package scripts route report access through the unified opener only', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(packageJson.scripts.codegen, 'node ./scripts/run-codegen.cjs');
  assert.equal(packageJson.scripts['test:e2e'], 'node ./scripts/run-e2e.cjs');
  assert.equal(packageJson.scripts['test:e2e:headed'], 'node ./scripts/run-e2e.cjs --headed');
  assert.equal(packageJson.scripts['test:e2e:debug'], 'node ./scripts/run-e2e.cjs --debug');
  assert.equal(packageJson.scripts['test:ci'], 'CI=true node ./scripts/run-e2e.cjs');
  assert.equal(
    packageJson.scripts['test:interview-login'],
    'node ./scripts/run-e2e.cjs --target tests/interview_agent/login/login.spec.ts --headed'
  );
  assert.equal(packageJson.scripts['report:open'], 'node ./scripts/open-report.cjs');
  assert.equal('report' in packageJson.scripts, false);
});

test('legacy report alias is removed so report:open stays the single entrypoint', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal('report' in packageJson.scripts, false);
});

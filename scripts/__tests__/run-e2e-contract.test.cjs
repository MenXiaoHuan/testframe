const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

test('package scripts route all test commands through the unified runner', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(packageJson.scripts.codegen, 'node ./scripts/run-codegen.cjs');
  assert.equal(
    packageJson.scripts['codegen:interview-login'],
    'node ./scripts/run-codegen.cjs --name login --url https://localhost:5173/#/pages/login/index'
  );
  assert.equal(
    packageJson.scripts['codegen:interview-login:admin'],
    'node ./scripts/run-codegen.cjs --name login --env local --role admin --url https://localhost:5173/#/pages/login/index'
  );
  assert.equal(packageJson.scripts['test:e2e'], 'node ./scripts/run-e2e.cjs');
  assert.equal(
    packageJson.scripts['test:e2e:headed'],
    'node ./scripts/run-e2e.cjs --headed'
  );
  assert.equal(
    packageJson.scripts['test:e2e:debug'],
    'node ./scripts/run-e2e.cjs --debug'
  );
  assert.equal(
    packageJson.scripts['test:interview-login'],
    'node ./scripts/run-e2e.cjs --target tests/interview_agent/login/login.spec.ts --headed'
  );
  assert.equal(packageJson.scripts['test:ci'], 'CI=true node ./scripts/run-e2e.cjs');
  assert.equal(packageJson.scripts.report, 'npm run report:open');
  assert.equal(packageJson.scripts['report:open'], 'npx allure open ./reports/allure-report');
});

test('report command remains an alias to report:open', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(packageJson.scripts.report, 'npm run report:open');
});

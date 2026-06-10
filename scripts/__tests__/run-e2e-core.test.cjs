const test = require('node:test');
const assert = require('node:assert/strict');

const { runE2E } = require('../lib/run-e2e-core.cjs');

function createRunSyncStub(statuses) {
  const calls = [];
  let index = 0;

  return {
    calls,
    runSync(command, args) {
      calls.push({ command, args });
      const status = statuses[index] ?? 0;
      index += 1;
      return { status };
    },
  };
}

test('runE2E removes runtime artifacts after report generation succeeds', () => {
  const cleanupCalls = [];
  const runtimeCleanupCalls = [];
  const customizeCalls = [];
  const openCalls = [];
  const { runSync } = createRunSyncStub([0, 0]);

  const result = runE2E({
    argv: [],
    env: {},
    runSync,
    cleanup() {
      cleanupCalls.push('pre');
    },
    cleanupRuntimeArtifacts() {
      runtimeCleanupCalls.push('post');
    },
    customizeReport() {
      customizeCalls.push('patched');
    },
    openReport() {
      openCalls.push('opened');
    },
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(cleanupCalls, ['pre']);
  assert.deepEqual(runtimeCleanupCalls, ['post']);
  assert.deepEqual(customizeCalls, ['patched']);
  assert.deepEqual(openCalls, ['opened']);
});

test('runE2E keeps runtime artifacts when tests fail even if report generation succeeds', () => {
  const runtimeCleanupCalls = [];
  const customizeCalls = [];
  const openCalls = [];
  const { runSync } = createRunSyncStub([1, 0]);

  const result = runE2E({
    argv: [],
    env: {},
    runSync,
    cleanup() {},
    cleanupRuntimeArtifacts() {
      runtimeCleanupCalls.push('post');
    },
    customizeReport() {
      customizeCalls.push('patched');
    },
    openReport() {
      openCalls.push('opened');
    },
  });

  assert.equal(result.exitCode, 1);
  assert.deepEqual(runtimeCleanupCalls, []);
  assert.deepEqual(customizeCalls, ['patched']);
  assert.deepEqual(openCalls, ['opened']);
});

test('runE2E keeps runtime artifacts when report customization fails', () => {
  const runtimeCleanupCalls = [];
  const { runSync } = createRunSyncStub([0, 0]);

  assert.throws(
    () =>
      runE2E({
        argv: [],
        env: {},
        runSync,
        cleanup() {},
        cleanupRuntimeArtifacts() {
          runtimeCleanupCalls.push('post');
        },
        customizeReport() {
          throw new Error('patch failed');
        },
        openReport() {},
      }),
    /patch failed/
  );

  assert.deepEqual(runtimeCleanupCalls, []);
});

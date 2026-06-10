import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAllureEnvironmentInfo,
  buildTraceGuidance,
  cleanTitle,
  deriveAllureMetadata,
} from '../../utils/allureMetadata';

test('cleanTitle removes tags and duplicate spaces', () => {
  assert.equal(cleanTitle('输入正确的账号和密码 @smoke   @login'), '输入正确的账号和密码');
});

test('deriveAllureMetadata maps known test directories to Chinese business modules', () => {
  const metadata = deriveAllureMetadata({
    cwd: '/repo',
    file: '/repo/tests/interview_agent/login/login.spec.ts',
    title: '输入正确的账号和密码',
  });

  assert.deepEqual(metadata, {
    parentSuiteName: '端到端自动化',
    featureName: '面试助手',
    subSuiteName: 'login.spec',
    storyName: '输入正确的账号和密码',
  });
});

test('deriveAllureMetadata falls back to original directory name when no Chinese mapping exists', () => {
  const metadata = deriveAllureMetadata({
    cwd: '/repo',
    file: '/repo/tests/unknown_group/example/demo.spec.ts',
    title: '示例用例',
  });

  assert.equal(metadata.featureName, 'unknown_group');
});

test('buildAllureEnvironmentInfo returns Chinese keys and human-readable values', () => {
  const info = buildAllureEnvironmentInfo({
    env: {},
    browserProject: 'chromium',
    generatedAt: '2026-06-10 10:00:00',
    nodeVersion: 'v25.9.0',
    osPlatform: 'darwin',
    osRelease: '24.5.0',
  });

  assert.equal(info['执行模式'], '本地');
  assert.equal(info['浏览器项目'], 'chromium');
  assert.equal(info['Node 版本'], 'v25.9.0');
  assert.equal(info['操作系统'], 'darwin 24.5.0');
  assert.equal(info['报告生成时间'], '2026-06-10 10:00:00');
});

test('buildTraceGuidance returns Chinese instructions for a trace archive', () => {
  const text = buildTraceGuidance({
    traceName: 'trace.zip',
    tracePath: '.playwright-artifacts/login/trace.zip',
  });

  assert.match(text, /Trace 附件/);
  assert.match(text, /npx playwright show-trace/);
  assert.match(text, /trace\.zip/);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import config from '../../playwright.config';
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

test('deriveAllureMetadata keeps story names clean for report homepage display', () => {
  const metadata = deriveAllureMetadata({
    cwd: '/repo',
    file: '/repo/tests/codegen/login.spec.ts',
    title: '  登录成功   @smoke  ',
  });

  assert.equal(metadata.storyName, '登录成功');
  assert.equal(metadata.featureName, '录制稿');
});

test('playwright config keeps Chinese environment info enabled for allure report output', () => {
  const reporters = Array.isArray(config.reporter) ? config.reporter : [];
  const allureReporter = reporters.find(
    (item): item is [string, Record<string, unknown>] =>
      Array.isArray(item) && item[0] === 'allure-playwright'
  );

  assert.ok(allureReporter, 'expected allure-playwright reporter config to exist');

  const [, options] = allureReporter;
  const environmentInfo = options.environmentInfo as Record<string, string>;

  assert.equal(options.detail, true);
  assert.deepEqual(Object.keys(environmentInfo), [
    '执行模式',
    '浏览器项目',
    'Node 版本',
    '操作系统',
    '报告生成时间',
    '站点配置模式',
  ]);
  assert.equal(environmentInfo['浏览器项目'], 'chromium');
});

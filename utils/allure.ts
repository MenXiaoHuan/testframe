import path from 'node:path';

import { expect, test as base } from '@playwright/test';
import {
  Severity,
  feature,
  owner,
  parentSuite,
  severity,
  story,
  subSuite,
} from 'allure-js-commons';

function cleanTitle(value: string): string {
  return value.replace(/@\w+/g, '').replace(/\s+/g, ' ').trim();
}

export const test = base;

test.beforeEach(async ({}, testInfo) => {
  const relativeFile = path.relative(process.cwd(), testInfo.file);
  const segments = relativeFile.split(path.sep);
  const testsIndex = segments.indexOf('tests');
  const testSegments = testsIndex >= 0 ? segments.slice(testsIndex + 1) : segments;
  const suiteGroup = testSegments.length > 1 ? testSegments[0] : 'root';
  const fileName = path.basename(relativeFile, path.extname(relativeFile));
  const testCaseTitle = cleanTitle(testInfo.title);

  await parentSuite('Playwright E2E');
  await feature(suiteGroup);
  await story(testCaseTitle || fileName);
  await subSuite(fileName);
  await owner('QA');

  await severity(Severity.MINOR);
});

export { expect };

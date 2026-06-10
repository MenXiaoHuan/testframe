# Reporting Runtime Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Allure report UI default to Chinese reliably, remove the legacy report wrapper, and keep main workspace and worktree on one reporting runtime contract.

**Architecture:** Keep reporting logic split into three layers. Data stays in `utils/allure.ts`, `utils/allureMetadata.ts`, and `playwright.config.ts`; orchestration stays in `scripts/lib/run-e2e-core.cjs` and `scripts/open-report.cjs`; UI fallback stays in `scripts/lib/allure-report-shell.cjs`. Use tests to lock each layer before changing implementation.

**Tech Stack:** Node.js, CommonJS scripts, TypeScript utility modules, Playwright, `allure-playwright`, `allure awesome`, `node:test`, `tsx`

---

### Task 1: Stabilize Report UI Language

**Files:**
- Modify: `scripts/lib/allure-report-shell.cjs`
- Modify: `scripts/__tests__/allure-report-shell.test.cjs`
- Test: `scripts/__tests__/allure-report-shell.test.cjs`

- [ ] **Step 1: Write the failing shell-language test**

Add this test to `scripts/__tests__/allure-report-shell.test.cjs`:

```js
test('injectReportShell forces reportLanguage to zh when allure output keeps en', () => {
  const html = `
    <html>
      <head>
        <script>
          window.allureReportOptions = {"reportLanguage":"en","reportName":"Demo"};
        </script>
      </head>
      <body></body>
    </html>`;

  const injectedHtml = injectReportShell(html);

  assert.match(injectedHtml, /"reportLanguage":"zh"/);
  assert.doesNotMatch(injectedHtml, /"reportLanguage":"en"/);
});
```

- [ ] **Step 2: Run the shell tests and confirm they fail**

Run:

```bash
node --test scripts/__tests__/allure-report-shell.test.cjs
```

Expected: FAIL because `injectReportShell()` currently injects collapse behavior only and does not rewrite `reportLanguage`.

- [ ] **Step 3: Implement minimal UI-language patching**

Update `scripts/lib/allure-report-shell.cjs` so `injectReportShell()` rewrites the embedded report options before adding the customization script:

```js
function forceReportLanguage(html, nextLanguage = REPORT_LANGUAGE) {
  return html.replace(
    /("reportLanguage"\s*:\s*")([^"]+)(")/,
    `$1${nextLanguage}$3`
  );
}

function injectReportShell(html) {
  const patchedHtml = forceReportLanguage(html);

  if (patchedHtml.includes(`id="${REPORT_CUSTOMIZATION_MARKER}"`)) {
    return patchedHtml;
  }

  const injection = REPORT_CUSTOMIZATION_SCRIPT;

  if (patchedHtml.includes('</head>')) {
    return patchedHtml.replace('</head>', `${injection}\n</head>`);
  }

  return `${patchedHtml}\n${injection}`;
}
```

- [ ] **Step 4: Run the shell tests and confirm they pass**

Run:

```bash
node --test scripts/__tests__/allure-report-shell.test.cjs
```

Expected: PASS with all shell tests green.

- [ ] **Step 5: Commit the language-fallback change**

```bash
git add scripts/lib/allure-report-shell.cjs scripts/__tests__/allure-report-shell.test.cjs
git commit -m "fix: force chinese report ui language"
```

### Task 2: Remove Legacy Report Wrapper

**Files:**
- Delete: `scripts/test-with-allure.cjs`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Test: `scripts/__tests__/run-e2e-contract.test.cjs`

- [ ] **Step 1: Write the failing contract assertion for legacy wrapper removal**

Add this assertion to `scripts/__tests__/run-e2e-contract.test.cjs`:

```js
assert.equal(existsSync('scripts/test-with-allure.cjs'), false);
```

Add the import if missing:

```js
const { existsSync, readFileSync } = require('node:fs');
```

- [ ] **Step 2: Run the contract test and confirm it fails**

Run:

```bash
node --test scripts/__tests__/run-e2e-contract.test.cjs
```

Expected: FAIL because `scripts/test-with-allure.cjs` still exists.

- [ ] **Step 3: Delete the legacy wrapper and remove stale docs wording**

Delete `scripts/test-with-allure.cjs`.

If `README.md` or `CONTRIBUTING.md` still mention the old wrapper or imply multiple report entrypoints, keep only:

```md
`npm run test:e2e`
`npm run report:open`
```

- [ ] **Step 4: Run the contract test and confirm it passes**

Run:

```bash
node --test scripts/__tests__/run-e2e-contract.test.cjs
```

Expected: PASS with `report:open` as the only report opener and no legacy wrapper file.

- [ ] **Step 5: Commit the cleanup**

```bash
git add README.md CONTRIBUTING.md scripts/__tests__/run-e2e-contract.test.cjs
git rm scripts/test-with-allure.cjs
git commit -m "refactor: remove legacy allure wrapper"
```

### Task 3: Re-Align Main Workspace Reporting Runtime

**Files:**
- Modify: `scripts/lib/run-e2e-core.cjs`
- Modify: `scripts/open-report.cjs`
- Modify: `utils/allure.ts`
- Modify: `utils/allureMetadata.ts`
- Modify: `playwright.config.ts`
- Modify: `scripts/__tests__/run-e2e-core.test.cjs`
- Modify: `scripts/__tests__/allure-metadata.test.ts`
- Test: `scripts/__tests__/run-e2e-core.test.cjs`
- Test: `scripts/__tests__/allure-metadata.test.ts`

- [ ] **Step 1: Write failing tests for the final main-workspace contract**

Ensure these expectations exist:

In `scripts/__tests__/run-e2e-core.test.cjs`:

```js
assert.deepEqual(captured.args, ['allure', 'open', './reports/allure-report']);
assert.ok(REPORT_ARGS.includes('--report-language'));
assert.ok(REPORT_ARGS.includes('zh'));
```

In `scripts/__tests__/allure-metadata.test.ts`:

```ts
assert.equal(metadata.parentSuiteName, 'Playwright E2E');
assert.equal(metadata.featureName, 'interview_agent');
assert.equal(options.detail, true);
assert.deepEqual(Object.keys(environmentInfo), [
  '执行模式',
  '浏览器项目',
  'Node 版本',
  '操作系统',
]);
```

- [ ] **Step 2: Run the metadata and core tests and confirm current failures**

Run:

```bash
node --import tsx --test scripts/__tests__/allure-metadata.test.ts
node --test scripts/__tests__/run-e2e-core.test.cjs
```

Expected: FAIL if any file drifted from the agreed contract.

- [ ] **Step 3: Apply minimal code alignment**

Keep the final main-workspace implementation shaped like this:

In `utils/allureMetadata.ts`:

```ts
return {
  parentSuiteName: 'Playwright E2E',
  featureName: rawFeature,
  subSuiteName: fileName,
  storyName: cleanTitle(input.title) || fileName,
};
```

In `utils/allure.ts`:

```ts
await parentSuite(metadata.parentSuiteName);
await feature(metadata.featureName);
await story(metadata.storyName);
await subSuite(metadata.subSuiteName);
await attachment(
  'Trace 使用说明',
  buildTraceGuidance({
    traceName: 'trace.zip',
    tracePath: `${testInfo.outputDir}/trace.zip`,
  }),
  ContentType.TEXT
);
```

In `scripts/lib/run-e2e-core.cjs` keep:

```js
const REPORT_HIDDEN_LABELS = ['package', 'feature', 'titlePath', 'parentSuite', 'subSuite', 'host', 'thread'];
```

and:

```js
const REPORT_ARGS = [
  'allure',
  'awesome',
  './.allure-results',
  '--output',
  './reports/allure-report',
  '--report-name',
  'Allure 自动化测试报告',
  '--report-language',
  REPORT_LANGUAGE,
  ...REPORT_HIDDEN_LABELS.flatMap((labelName) => ['--hide-labels', labelName]),
];
```

- [ ] **Step 4: Run the aligned tests and confirm they pass**

Run:

```bash
node --import tsx --test scripts/__tests__/allure-metadata.test.ts
node --test scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/run-e2e-contract.test.cjs
```

Expected: PASS with the main workspace matching the agreed reporting contract.

- [ ] **Step 5: Commit the runtime alignment**

```bash
git add scripts/lib/run-e2e-core.cjs scripts/open-report.cjs utils/allure.ts utils/allureMetadata.ts playwright.config.ts scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/allure-metadata.test.ts scripts/__tests__/run-e2e-contract.test.cjs
git commit -m "feat: align reporting runtime layers"
```

### Task 4: Sync Worktree Reporting Runtime

**Files:**
- Modify: `.worktrees/feature-reporting-optimization/scripts/lib/run-e2e-core.cjs`
- Modify: `.worktrees/feature-reporting-optimization/scripts/lib/allure-report-shell.cjs`
- Modify: `.worktrees/feature-reporting-optimization/scripts/open-report.cjs`
- Modify: `.worktrees/feature-reporting-optimization/utils/allure.ts`
- Modify: `.worktrees/feature-reporting-optimization/utils/allureMetadata.ts`
- Modify: `.worktrees/feature-reporting-optimization/playwright.config.ts`
- Modify: `.worktrees/feature-reporting-optimization/scripts/__tests__/allure-metadata.test.ts`
- Modify: `.worktrees/feature-reporting-optimization/scripts/__tests__/allure-report-shell.test.cjs`
- Modify: `.worktrees/feature-reporting-optimization/scripts/__tests__/run-e2e-core.test.cjs`
- Modify: `.worktrees/feature-reporting-optimization/scripts/__tests__/run-e2e-contract.test.cjs`

- [ ] **Step 1: Mirror the final main-workspace contract into the worktree tests**

Key expectations:

```js
assert.equal('report' in packageJson.scripts, false);
assert.equal(packageJson.scripts['report:open'], 'node ./scripts/open-report.cjs');
```

```ts
assert.equal(metadata.parentSuiteName, 'Playwright E2E');
assert.equal(metadata.featureName, 'interview_agent');
```

```js
assert.match(injectedHtml, /"reportLanguage":"zh"/);
```

- [ ] **Step 2: Run the worktree tests and confirm any drift fails**

Run:

```bash
cd /Users/bytedance/playwright_framework/.worktrees/feature-reporting-optimization
node --import tsx --test scripts/__tests__/allure-metadata.test.ts
node --test scripts/__tests__/allure-report-shell.test.cjs scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/run-e2e-contract.test.cjs
```

Expected: FAIL only if the worktree still differs from the main contract.

- [ ] **Step 3: Apply the same implementation decisions in the worktree**

Keep the same outcomes as the main workspace:

```js
// report opener
"report:open": "node ./scripts/open-report.cjs"
```

```js
// no business-value translation tables
featureName: rawFeature
```

```js
// UI fallback
"reportLanguage":"zh"
```

- [ ] **Step 4: Run the worktree tests and confirm they pass**

Run:

```bash
cd /Users/bytedance/playwright_framework/.worktrees/feature-reporting-optimization
node --import tsx --test scripts/__tests__/allure-metadata.test.ts
node --test scripts/__tests__/allure-report-shell.test.cjs scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/run-e2e-contract.test.cjs
```

Expected: PASS with worktree and main workspace aligned.

- [ ] **Step 5: Commit the worktree sync**

```bash
cd /Users/bytedance/playwright_framework/.worktrees/feature-reporting-optimization
git add scripts/lib/run-e2e-core.cjs scripts/lib/allure-report-shell.cjs scripts/open-report.cjs utils/allure.ts utils/allureMetadata.ts playwright.config.ts scripts/__tests__/allure-metadata.test.ts scripts/__tests__/allure-report-shell.test.cjs scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/run-e2e-contract.test.cjs package.json README.md CONTRIBUTING.md
git commit -m "feat: sync reporting runtime contract"
```

### Task 5: Verify Real Report Output

**Files:**
- Verify: `reports/allure-report/index.html`
- Verify: `reports/allure-report/data/test-results/*.json`
- Verify: `.allure-results/environment.properties`

- [ ] **Step 1: Generate a fresh real report in the main workspace**

Run:

```bash
npm run test:interview-login
```

Expected: `1 passed` and `the report successfully generated`.

- [ ] **Step 2: Verify the UI language fallback landed**

Run:

```bash
grep -n '"reportLanguage"' reports/allure-report/index.html
```

Expected output contains:

```text
"reportLanguage":"zh"
```

- [ ] **Step 3: Verify hidden labels are not exposed in the generated result**

Run:

```bash
grep -R '"name":"feature"\|"name":"package"\|"name":"parentSuite"\|"name":"subSuite"\|"name":"titlePath"\|"name":"host"\|"name":"thread"' reports/allure-report/data/test-results
```

Expected: no matches.

- [ ] **Step 4: Verify retained evidence is still present**

Run:

```bash
grep -R 'Trace 使用说明' .allure-results reports/allure-report/data/test-results
grep -R '执行模式\\|浏览器项目\\|Node 版本\\|操作系统' .allure-results/environment.properties
```

Expected: matches found for trace guidance and the four environment keys.

- [ ] **Step 5: Final verification commit**

```bash
git add docs/superpowers/specs/2026-06-10-reporting-runtime-alignment-design.md docs/superpowers/plans/2026-06-10-reporting-runtime-alignment.md
git commit -m "docs: add reporting runtime alignment plan"
```

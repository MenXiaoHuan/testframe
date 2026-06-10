const test = require('node:test');
const assert = require('node:assert/strict');

const { injectReportShell } = require('../lib/allure-report-shell.cjs');

test('injectReportShell appends a single report customization script and style block', () => {
  const html = '<html><head><title>report</title></head><body><div id="app"></div></body></html>';

  const firstPass = injectReportShell(html);
  const secondPass = injectReportShell(firstPass);

  assert.match(firstPass, /allure-report-ui-customizations/);
  assert.match(firstPass, /report-default-metadata/);
  assert.match(firstPass, /report-default-variables/);
  assert.doesNotMatch(firstPass, /report-quick-filters-hidden/);
  assert.equal(secondPass.match(/allure-report-ui-customizations/g)?.length, 1);
});

test('injectReportShell keeps the injected customization script syntactically valid', () => {
  const html = '<html><head></head><body></body></html>';
  const injectedHtml = injectReportShell(html);
  const scriptMatch = injectedHtml.match(/<script id="allure-report-ui-customizations">([\s\S]*?)<\/script>/);

  assert.ok(scriptMatch, 'expected injected customization script to exist');
  assert.doesNotThrow(() => new Function(scriptMatch[1]));
});

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

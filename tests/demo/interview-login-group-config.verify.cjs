const { strict: assert } = require('node:assert');
const { spawnSync } = require('node:child_process');

function resolveBaseUrl(env = {}) {
  const command = spawnSync(
    'npx',
    [
      'tsx',
      '--eval',
      "import { interviewLoginGroupConfig } from './config/test-groups/interview_login.ts'; console.log(interviewLoginGroupConfig.baseURL);",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
      encoding: 'utf8',
    },
  );

  if (command.status !== 0) {
    process.stderr.write(command.stdout);
    process.stderr.write(command.stderr);
    process.exit(command.status ?? 1);
  }

  return command.stdout.trim();
}

assert.equal(resolveBaseUrl(), 'https://localhost:5172');
assert.equal(resolveBaseUrl({ PLAYWRIGHT_PLATFORM_MODE: 'true' }), 'https://host.docker.internal:5172');
assert.equal(resolveBaseUrl({ INTERVIEW_LOGIN_BASE_URL: 'https://example.internal:9443' }), 'https://example.internal:9443');

process.stdout.write('interview login group baseURL verified\n');

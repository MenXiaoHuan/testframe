const { strict: assert } = require('node:assert');
const { spawnSync } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const artifactDir = join(process.cwd(), '.playwright-artifacts');

function collectFiles(dir, bucket = []) {
  if (!existsSync(dir)) {
    return bucket;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, bucket);
    } else {
      bucket.push(fullPath);
    }
  }
  return bucket;
}

const beforeFiles = collectFiles(artifactDir);
const beforeVideoCount = beforeFiles.filter((file) => file.endsWith('.webm')).length;

const command = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'tests/demo/group-context-video.spec.ts',
    '--workers=1',
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_PLATFORM_MODE: 'true',
    },
    encoding: 'utf8',
  },
);

if (command.status !== 0) {
  process.stderr.write(command.stdout);
  process.stderr.write(command.stderr);
  process.exit(command.status ?? 1);
}

const files = collectFiles(artifactDir);
const afterVideoFiles = files.filter((file) => file.endsWith('.webm'));

assert.ok(
  afterVideoFiles.length > beforeVideoCount,
  'expected a newly recorded video file under .playwright-artifacts',
);

process.stdout.write('groupContext video artifact verified\n');

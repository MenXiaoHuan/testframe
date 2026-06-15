const { strict: assert } = require('node:assert');
const { spawnSync } = require('node:child_process');

const command = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'tests/demo/group-context-runtime-url.spec.ts',
    '--reporter=json',
    '--workers=1',
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  },
);

if (command.status !== 0) {
  process.stderr.write(command.stdout);
  process.stderr.write(command.stderr);
  process.exit(command.status ?? 1);
}

const report = JSON.parse(command.stdout);

function collectAttachments(node, bucket = []) {
  if (!node || typeof node !== 'object') {
    return bucket;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectAttachments(item, bucket);
    }
    return bucket;
  }

  if (Array.isArray(node.attachments)) {
    bucket.push(...node.attachments);
  }

  for (const value of Object.values(node)) {
    collectAttachments(value, bucket);
  }

  return bucket;
}

const attachments = collectAttachments(report);
const runtimeUrlAttachment = attachments.find(attachment => attachment.name === 'runtime-url');

assert.ok(runtimeUrlAttachment, 'expected runtime-url attachment to be present in reporter output');

const attachmentBody = runtimeUrlAttachment.body
  ? Buffer.from(runtimeUrlAttachment.body, 'base64').toString('utf8')
  : '';

assert.match(
  attachmentBody,
  /data:text\/html,<h1>runtime-url<\/h1>/,
  'expected runtime-url attachment to contain the current page URL',
);

process.stdout.write('runtime-url attachment verified\n');

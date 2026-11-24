// S8b unit 04: every client test of the helpdesk stage reads server answers from
// test/js/helpers/helpdesk-answers.mjs. Fails when such a file does not import the helper, or
// when its text uses an answer key as an object-literal key. A file that does not exist yet is
// skipped. Run with: node test/js/helpdesk-no-handwritten-answers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILES = [
  'helpdesk-request', 'helpdesk-client', 'mfa-client-own', 'own-phone-scenes', 'mfa-signin-my-phone',
  'helpdesk-ink-tag', 'helpdesk-pretext-open', 'helpdesk-desktop-form',
  'helpdesk-client-wiring', 'helpdesk-keyring-connect'
].map((n) => `${n}.test.mjs`);
const KEYS = ['granted', 'triesLeft', 'retryIn', 'lockoutPcIds', 'ownPhone', 'enrolled', 'typeToSignIn', 'mfaRequired', 'promptsSent'];

// An answer key written as an object-literal key: `key:`, `'key':` or `"key":`, not `?key:` or `a ? b : c`.
export function handwrittenKeys(text) {
  const found = [];
  for (const key of KEYS) {
    const re = new RegExp(`(?:^|[\\s{,(])['"]?${key}['"]?\\s*:(?!:)`, 'm');
    if (re.test(text)) found.push(key);
  }
  return found;
}

test('the lint sees a hand-written answer key', () => {
  assert.deepEqual(handwrittenKeys("const a = { granted: true, 'triesLeft': 2 };"), ['granted', 'triesLeft']);
  assert.deepEqual(handwrittenKeys('const a = answer("helpdesk.refused"); a.body.triesLeft;'), []);
});

for (const file of FILES) {
  const path = join(HERE, file);
  test(`${file} reads its answers from the shared file`, { skip: !existsSync(path) && 'not written yet' }, () => {
    const text = readFileSync(path, 'utf8');
    assert.match(text, /from\s+['"][^'"]*helpers\/helpdesk-answers\.mjs['"]/, 'does not import helpers/helpdesk-answers.mjs');
    assert.deepEqual(handwrittenKeys(text), [], 'hand-written answer keys');
  });
}

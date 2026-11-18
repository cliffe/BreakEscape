// playtest harness `mg type`: typed flag values are redacted from the output by default.
// Run with: node --test test/js/playtest-typed-redact.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { redactTyped } = require('../../.claude/skills/playtest-scenario/scripts/typed-redact.js');

const echo = (typed) => ({ ok: true, typed, submit: true, submittedVia: 'enter' });

test('typing into a flag station is redacted', () => {
  const r = redactTyped(echo('hunter2-made-up'), { state: { id: 'flag-station', text: 'Submit a flag' }, text: 'hunter2-made-up' });
  assert.equal(r.typed, '[redacted 15 chars]');
  assert.equal(r.typedRedacted, true);
  assert.equal(r.submittedVia, 'enter');
});

test('a flag{...} value is redacted even in an unrelated minigame', () => {
  const r = redactTyped(echo('flag{made_up}'), { state: { id: 'password', text: 'Enter password' }, text: 'flag{made_up}' });
  assert.equal(r.typed, '[redacted 13 chars]');
});

test('ordinary typing is left alone', () => {
  const r = redactTyped(echo('Hospital1987'), { state: { id: 'password', text: 'Enter password' }, text: 'Hospital1987' });
  assert.deepEqual(r, echo('Hospital1987'));
});

test('showTyped keeps the value', () => {
  const r = redactTyped(echo('flag{made_up}'), { state: { id: 'flag-station' }, text: 'flag{made_up}', show: true });
  assert.equal(r.typed, 'flag{made_up}');
});

test('failures and non-type results pass through', () => {
  const f = { ok: false, reason: 'no-field-at-index-0' };
  assert.equal(redactTyped(f, { state: { id: 'flag-station' }, text: 'x' }), f);
});

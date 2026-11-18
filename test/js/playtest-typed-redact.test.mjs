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

const { scrub, stateSecrets, isFlagTyped } = require('../../.claude/skills/playtest-scenario/scripts/typed-redact.js');

test('scrub removes registered secrets from a drained bridge log entry', () => {
  const secrets = new Set(['made-up-secret-9']);
  const entry = { kind: 'action', action: 'minigame.type', detail: { text: 'made-up-secret-9' }, result: { typed: 'made-up-secret-9', ok: true } };
  const out = scrub({ log: [entry] }, secrets);
  assert.equal(JSON.stringify(out).includes('made-up-secret-9'), false);
  assert.equal(out.log[0].detail.text, '[redacted 16 chars]');
  assert.equal(entry.detail.text, 'made-up-secret-9', 'the input is not mutated');
});

test('stateSecrets reads a flag station: submittedFlags, field values, history text', () => {
  const state = { id: 'flag-station', title: 'Flag Terminal', text: 'History: flag{made_up_1}', submittedFlags: ['flag{made_up_1}'],
                  fields: [{ index: 0, value: 'typed-but-unsent' }, { index: 1, value: '' }] };
  const secrets = new Set(stateSecrets(state));
  assert.deepEqual([...secrets].sort(), ['flag{made_up_1}', 'typed-but-unsent']);
  const out = scrub(state, secrets);
  assert.equal(JSON.stringify(out).includes('made_up_1'), false);
  assert.equal(JSON.stringify(out).includes('typed-but-unsent'), false);
});

test('stateSecrets ignores an ordinary minigame', () => {
  assert.deepEqual(stateSecrets({ id: 'password', text: 'Enter password', fields: [{ value: 'Hospital1987' }] }), []);
});

test('isFlagTyped: flag target or flag shape only', () => {
  assert.equal(isFlagTyped({ id: 'flag-station' }, 'abcdef'), true);
  assert.equal(isFlagTyped({ id: 'password' }, 'flag{x}'), true);
  assert.equal(isFlagTyped({ id: 'password' }, 'Hospital1987'), false);
});

test('scrub with no secrets returns the node unchanged', () => {
  const n = { a: 'b' };
  assert.equal(scrub(n, new Set()), n);
});

// R3 m4: only a real flag station, or a flag{...} shape, adds to the session-wide secrets.
const { isFlagStation } = require('../../.claude/skills/playtest-scenario/scripts/typed-redact.js');

test('R3 m4: a screen that merely mentions flag does not register typed text or field values', () => {
  const triage = { id: 'inbox', title: 'Flag suspicious lines', text: 'Flag the bad ones', fields: [{ value: 'admin_office' }] };
  assert.equal(isFlagTyped(triage, 'admin'), false);
  assert.deepEqual(stateSecrets(triage), []);
  assert.equal(isFlagStation(triage), false);
});

test('R3 m4: the loose match still masks the one echo', () => {
  const r = redactTyped({ ok: true, typed: 'admin' }, { state: { id: 'inbox', title: 'Flag suspicious lines' }, text: 'admin' });
  assert.equal(r.typedRedacted, true);
});

test('R3 m4: flag{...} values are secrets anywhere; plain values only at a station', () => {
  assert.deepEqual(stateSecrets({ id: 'inbox', fields: [{ value: 'flag{made_up_x}' }, { value: 'admin_office' }] }), ['flag{made_up_x}']);
  assert.equal(isFlagStation({ id: 'x', stationId: 's1' }), true);
  assert.equal(isFlagStation({ type: 'FlagStationMinigame' }), true);
});

test('R3 m3: scrub with shape masks an unregistered flag{...} everywhere', () => {
  const out = scrub({ in: 'type flag{made_up_y} now', nested: ['a flag{b}'] }, new Set(), true);
  assert.equal(JSON.stringify(out).includes('made_up_y'), false);
  assert.equal(out.nested[0], 'a [redacted 7 chars]');
});

test('R3 n3: only the flag/value field of an object submittedFlags entry is a secret', () => {
  const s = stateSecrets({ id: 'flag-station', submittedFlags: [{ flag: 'flag{made_up_z}', status: 'accepted' }] });
  assert.deepEqual(s, ['flag{made_up_z}']);
});

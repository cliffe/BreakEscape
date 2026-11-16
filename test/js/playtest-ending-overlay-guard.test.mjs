// The playtest harness must report the ending-check overlay as blockingUi and refuse
// Escape-style closes while it is up. Run with: bin/test-js test/js/playtest-ending-overlay-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const g = require(join(here, '..', '..', '.claude/skills/playtest-scenario/scripts/ending-overlay-guard.js'));

test('Escape-style actions are recognised', () => {
  assert.ok(g.isEscapeStyleMg('close'));
  assert.ok(g.isEscapeStyleMg('pressKey', ['Escape']));
  assert.ok(!g.isEscapeStyleMg('pressKey', ['Enter']));
  assert.ok(!g.isEscapeStyleMg('getState'));
  assert.ok(g.isEscapeKey('esc') && !g.isEscapeKey('a'));
});

test('refusal names the endingOverlay command', () => {
  assert.equal(g.REFUSAL.ok, false);
  assert.match(g.REFUSAL.hint, /endingOverlay/);
  assert.match(g.REFUSAL.hint, /"end"/);
  assert.match(g.REFUSAL.hint, /"keep"/);
});

test('describeEndingOverlayInPage lists the buttons, and is null without the overlay', () => {
  const mk = (btns) => ({ querySelectorAll: () => btns.map(t => ({ textContent: t })),
                          querySelector: () => ({ textContent: 'Before the mission ends' }), textContent: '' });
  globalThis.document = { getElementById: () => null };
  assert.equal(g.describeEndingOverlayInPage(), null);
  globalThis.document = { getElementById: () => mk(['Keep going', 'End the mission now']) };
  const d = g.describeEndingOverlayInPage();
  assert.deepEqual(d.buttons, ['Keep going', 'End the mission now']);
  assert.deepEqual(g.mergeBlockingUi(null, d), d);
  assert.equal(g.mergeBlockingUi({ a: 1 }, null).a, 1);
  delete globalThis.document;
});

// D290 (option b): trusting Liam's look-alike careers link in ca02_cv_lures earns one Fatima bark.
// The engine writes outcome.messageGlobals as "caught" only (Report, Delete or Verify on a phish),
// so kit_ca02_portal_caught stays false when Liam was trusted, and the bark fires on that.
// Run with: node --test test/js/ca02-liam-bark.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LINE = 'IT have asked anyone who opened that careers link to change their password today.';
const sc = JSON.parse(readFileSync(join(root, 'scenarios/ca02_cv_lures/scenario.json.erb'), 'utf8'));
const fatima = sc.rooms.training_room.npcs.find((n) => n.id === 'fatima_begum');
const marks = fatima.eventMappings.map((m, i) => [m, i]).filter(([m]) => m.bark === LINE);

test('Liam message maps to a declared kit_ boolean global', () => {
  const set = sc.social.triageSets.find((s) => s.id === 'e2_recruitment_inbox');
  assert.equal(set.outcome.messageGlobals.e2_portfolio_lookalike, 'kit_ca02_portal_caught');
  assert.equal(set.outcome.messageGlobals.e2_enable_content, 'kit_key_caught');
  assert.equal(sc.globalVariables.kit_ca02_portal_caught, false);
  assert.ok(set.messages.find((m) => m.id === 'e2_portfolio_lookalike').truth.isPhish);
});

test('the bark is one Fatima mapping and the last in her array (the server keys by index)', () => {
  assert.equal(marks.length, 1);
  assert.equal(marks[0][1], fatima.eventMappings.length - 1);
});

test('bark: waits for the ask, whenPerceivable, once, only when Liam was trusted', () => {
  const m = marks[0][0];
  assert.equal(m.eventPattern, 'global_variable_changed:kit_ca02_asked');
  assert.equal(m.whenPerceivable, true);
  assert.equal(m.onceOnly, true);
  assert.ok(m.delayMs >= 8000, 'long enough for Chidi\'s own ask to finish first');
  assert.match(m.condition, /kit_ca02_portal_caught !== true/);
});

test('no overlap with the enable reaction: skipped when Chidi\'s choice already triggers it', () => {
  const m = marks[0][0];
  const enable = fatima.eventMappings.find((e) => /IT have just cut your machine off/.test(e.bark || ''));
  // her enable reaction fires on a choice that is not '', 'asked' or 'report'; the new one refuses enable and silent
  assert.match(enable.condition, /value !== 'report'/);
  assert.match(m.condition, /kit_ca02_cv_choice !== 'enable'/);
  assert.match(m.condition, /kit_ca02_cv_choice !== 'silent'/);
  // after the choice the enable bark waits 8 s, longer than this clip (4.7 s), so a bark already speaking ends first
  assert.ok(enable.delayMs >= 8000);
});

test('the clip exists, on Fatima\'s voice', () => {
  const dir = join(root, 'tts_cache/ca02_cv_lures');
  const key = readdirKey(dir);
  assert.ok(key, 'a sidecar carries the line');
  assert.ok(existsSync(join(dir, `${key}.mp3`)));
});

function readdirKey(dir) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (j.text === LINE && j.npc === 'fatima_begum') return j.key;
  }
  return null;
}

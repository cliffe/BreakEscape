// aw4 (FUN_DECISIONS): one rule of thumb, identical in every awareness shell's debrief
// (social.awareness.ruleOfThumb, shown above the Monday card by debrief-view.js). The four shell
// generators read it from awareness_deploy.py; the seven full episodes carry the same literal by
// hand. This test is the single guard that every registered shell still agrees, so a change to the
// text must be made in both places or this fails.
//
// ENG-09d: the shells are registered below, not just counted. A new full episode adds ONE line to
// FULL_EPISODES (its defend-only twin is derived: <dir>_defend), and a new check role adds one to
// CHECK_ROLES (four shells: pre/post x ab/ba). A shell on disk that is not registered, or a
// registered one that is missing, fails with its name, so a new shell cannot drop out of this guard.
// Run with: node --test test/js/social-awareness-rule-of-thumb.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scenarios = join(root, 'scenarios');

const shells = readdirSync(scenarios, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('awareness_'))
  .map((d) => d.name)
  .sort();

// The registry. One line per full episode; the defend-only twin is derived.
const FULL_EPISODES = [
  'awareness_e1_invoice_fraud',
  'awareness_e2_cv_lures',
  'awareness_e3_helpdesk_reset',
  'awareness_e4_exec_whaling',
  'awareness_e5_signin_pages',
  'awareness_e6_texts_and_qr',
  'awareness_e7_voice_ceo',
  'awareness_e8_after_the_click',
  'awareness_e9_passwords',
  'awareness_e11_misdirected_data',
  'awareness_e15_shadow_it',
  'awareness_e19_malware_and_updates',
];
// One line per check role; each is four shells (pre and post, each in ab and ba order).
const CHECK_ROLES = [
  'executive',
  'finance',
  'general',
  'general_v2',
  'helpdesk',
  'hr',
  'mobile',
];
// Single shells that are neither a full episode nor a check role (no defend twin, no pre/post pair),
// such as the core_17 annual edition. One line per shell, the folder name as it is.
const STANDALONE_SHELLS = [
  'awareness_core_17_annual_2027_defend',
  // E17 is defend-only: one shell, no full twin, listed in both courses.
  'awareness_e17_acceptable_use_defend',
];
const registered = [
  ...FULL_EPISODES,
  ...FULL_EPISODES.map((d) => `${d}_defend`),
  ...CHECK_ROLES.flatMap((r) => ['pre', 'post'].flatMap((st) => ['ab', 'ba'].map((o) => `awareness_${st}_${r}_${o}`))),
  ...STANDALONE_SHELLS,
].sort();

test('the registered awareness shells are exactly the shells on disk (ENG-09d)', () => {
  assert.equal(registered.length, new Set(registered).size, 'a shell is registered twice');
  assert.equal(registered.length, 2 * FULL_EPISODES.length + 4 * CHECK_ROLES.length + STANDALONE_SHELLS.length);
  const extra = shells.filter((d) => !registered.includes(d));
  const missing = registered.filter((d) => !shells.includes(d));
  assert.deepEqual(extra, [], `awareness shell(s) on disk that this guard does not register (add to FULL_EPISODES, CHECK_ROLES or STANDALONE_SHELLS): ${extra.join(', ')}`);
  assert.deepEqual(missing, [], `registered shell(s) with no folder under scenarios/: ${missing.join(', ')}`);
});

test(`every awareness shell (${registered.length}) carries social.awareness.ruleOfThumb`, () => {
  assert.equal(shells.length, registered.length, `expected ${registered.length} awareness shells, found ${shells.length}`);
  const seen = new Set();
  for (const name of registered) {
    const j = JSON.parse(readFileSync(join(scenarios, name, 'scenario.json.erb'), 'utf8'));
    const rule = j?.social?.awareness?.ruleOfThumb;
    assert.ok(rule && typeof rule.text === 'string' && rule.text.trim().length > 0,
      `${name}: social.awareness.ruleOfThumb.text is missing or empty`);
    seen.add(JSON.stringify(rule));
  }
  assert.equal(seen.size, 1, `the rule of thumb is not identical across shells: ${[...seen].map((t) => t.slice(0, 50)).join(' | ')}`);
});

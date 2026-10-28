// scripts/validate_social/options.rb: the late-option lints (MECHANICS_AUDIT packet M3):
// hintsByFactor, labelBy, checklistTiming, mirrorToBehavior and lockedHint.
// One fixture per option under test/js/fixtures/social_options. The lints are called in-process
// (never the bare CLI, which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-social-options.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social_options');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const load = (name) => JSON.parse(readFileSync(join(fx, `${name}.json`), 'utf8'));

// Lints one scenario object (passed on stdin). Returns the issue strings.
function lint(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    j = JSON.parse($stdin.read)
    puts JSON.generate(ValidateSocial.check(j, repo_root: ${JSON.stringify(root)}, valid_item_types: nil))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(json) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// Exactly n issues match re (only issues that mention `scope` are counted)
function has(issues, re, n = 1) {
  const hits = issues.filter((s) => re.test(s));
  assert.equal(hits.length, n, `${re}: ${hits.length} hit(s)\n${issues.join('\n')}`);
}

test('hintsByFactor: a typo in a factor id, a wrong type and an unread variant fail', { skip }, () => {
  const issues = lint(load('hints_by_factor')).filter((s) => s.includes('hintsByFactor'));
  // the clean targets raise nothing
  has(issues, /\[hbf_ok\]/, 0);
  // factors[] modes: pretextRelevant is required, attachmentPlausible only advisory
  has(issues, /\[hbf_factors_list\]\.hintsByFactor\.pretextRelevant/, 0);
  has(issues, /⚠️.*\[hbf_factors_list\]\.hintsByFactor\.attachmentPlausible: this target does not require/);
  // unknown factor id
  has(issues, /❌.*\[hbf_typo\]\.hintsByFactor has the key 'senderTrsut', which is not a factor id/);
  // unknown variant of a known factor
  has(issues, /❌.*\[hbf_typo\]\.hintsByFactor\.senderTrust has the variant 'owned', which the judge never reads/);
  // not an object
  has(issues, /❌.*\[hbf_not_object\]\.hintsByFactor must be an object keyed by factor id \(got a string\)/);
  // empty string, number, object with only an empty variant
  has(issues, /❌.*\[hbf_bad_values\]\.hintsByFactor\.senderTrust is empty/);
  has(issues, /❌.*\[hbf_bad_values\]\.hintsByFactor\.pretextRelevant must be a hint string or an object of variants \(got a number\)/);
  has(issues, /❌.*\[hbf_bad_values\]\.hintsByFactor\.linkCredible\.wrong must be a non-empty string/);
  has(issues, /❌.*\[hbf_bad_values\]\.hintsByFactor\.linkCredible has none of the variants missing, wrong/);
  // senderTrust with no spoof variant; urgencyCalibrated is never required, so its hint never shows
  has(issues, /⚠️.*\[hbf_no_spoof\]\.hintsByFactor\.senderTrust has no 'spoof' variant/);
  has(issues, /⚠️.*\[hbf_no_spoof\]\.hintsByFactor\.urgencyCalibrated: this target does not require/);
  assert.equal(issues.length, 10, issues.join('\n'));
});

test('hintsByFactor: a hint for a factor the target does not require is a warning', { skip }, () => {
  const json = load('hints_by_factor');
  json.social.phishTargets = [{ id: 'hbf_unrequired', requiredFactors: ['senderTrust'], hintsByFactor: { addressedTo: 'Greet her.' } }];
  const issues = lint(json).filter((s) => s.includes('hintsByFactor'));
  assert.deepEqual(issues.length, 1, issues.join('\n'));
  assert.match(issues[0], /^⚠️.*hintsByFactor\.addressedTo: this target does not require 'addressedTo'/);
});

test('labelBy: "role" warns for a target with no role anywhere; a typo fails', { skip }, () => {
  const json = load('label_by');
  let issues = lint(json).filter((s) => s.includes('labelBy'));
  // t_role has a role, t_contact's contact has one; only t_named falls back to a name
  assert.equal(issues.length, 1, issues.join('\n'));
  assert.match(issues[0], /^⚠️.*labelBy is "role", but social\.phishTargets\[t_named\] has no role/);

  json.social.engagement.report.labelBy = 'name';
  assert.deepEqual(lint(json).filter((s) => s.includes('labelBy')), []);

  for (const bad of ['roles', 'Role', true]) {
    json.social.engagement.report.labelBy = bad;
    issues = lint(json).filter((s) => s.includes('labelBy'));
    assert.equal(issues.length, 1, `${bad}: ${issues.join('\n')}`);
    assert.match(issues[0], /^❌.*social\.engagement\.report\.labelBy is .*it must be "role" .* or "name"/);
  }
});

test('checklistTiming: onSend and withReply pass; anything else fails', { skip }, () => {
  const json = load('checklist_timing');
  for (const ok of ['onSend', 'withReply']) {
    json.social.mailClient.checklistTiming = ok;
    assert.deepEqual(lint(json).filter((s) => s.includes('checklistTiming')), [], ok);
  }
  for (const bad of ['onsend', 'with_reply', 'never', 1, null]) {
    json.social.mailClient.checklistTiming = bad;
    const issues = lint(json).filter((s) => s.includes('checklistTiming'));
    assert.equal(issues.length, 1, `${bad}: ${issues.join('\n')}`);
    assert.match(issues[0], /^❌.*checklistTiming is .*; it must be "onSend" \(the default\) or "withReply"/);
  }
});

test('mirrorToBehavior: needs a boolean and a person NPC that exists', { skip }, () => {
  const issues = lint(load('mirror_to_behavior')).filter((s) => s.includes('mirrorToBehavior'));
  has(issues, /characters\.ann\./, 0);
  has(issues, /characters\.eve\./, 0);
  has(issues, /❌.*characters\.bob\.mirrorToBehavior is true, but social\.characters\.bob\.channels has no 'person' NPC/);
  has(issues, /❌.*characters\.cat\.mirrorToBehavior is true, but channels\.person 'cat_desk' is not an NPC in any room/);
  has(issues, /❌.*characters\.dan\.mirrorToBehavior must be true or false \(got "yes"\)/);
  assert.equal(issues.length, 3, issues.join('\n'));
});

test('lockedHint: runs without a social key; wrong type, blank, unlocked and non-key locks are reported', { skip }, () => {
  const json = load('locked_hint');
  assert.equal(json.social, undefined);
  const issues = lint(json).filter((s) => s.includes('lockedHint'));
  has(issues, /\/rooms\/vault /, 0);
  has(issues, /\/rooms\/office\/objects\[0\]/, 0);
  has(issues, /❌.*\/rooms\/store lockedHint must be a non-empty string \(got a number\)/);
  has(issues, /❌.*\/rooms\/yard\/doors\[0\] lockedHint must be a non-empty string \(got an empty string\)/);
  has(issues, /⚠️.*\/rooms\/lab has a lockedHint but is not locked/);
  has(issues, /⚠️.*\/rooms\/office\/objects\[1\] has a lockedHint but its lockType is "pin"/);
  assert.equal(issues.length, 4, issues.join('\n'));
});

test('a scenario without the options raises none of these lints', { skip }, () => {
  const json = load('checklist_timing');
  delete json.social.mailClient.checklistTiming;
  const issues = lint(json);
  assert.deepEqual(issues.filter((s) => /hintsByFactor|labelBy|checklistTiming|mirrorToBehavior|lockedHint/.test(s)), []);
});

test('a report-workstation with no social.engagement.report warns; with one it is quiet', { skip }, () => {
  const json = load('checklist_timing');
  json.rooms = { r1: { objects: [{ id: 'rw', name: 'Report desk', type: 'report-workstation' }] } };
  has(lint(json).filter((s) => s.includes('report-workstation')), /⚠️.*Report desk.*no social\.engagement\.report/);
  json.social.engagement = { report: { title: 'Report' } };
  has(lint(json).filter((s) => s.includes('report-workstation')), /report-workstation/, 0);
});

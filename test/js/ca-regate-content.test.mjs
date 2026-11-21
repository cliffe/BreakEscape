// Cyber Aware regate content fixes (blind persona playtests). Text-level checks on the shells.
// Run with: node --test test/js/ca-regate-content.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const erb = (n) => readFileSync(join(root, 'scenarios', n, 'scenario.json.erb'), 'utf8');

test('ca11: only data-rights, disputes, complaints and breaches go to the DPO; contact updates are ordinary work', () => {
  for (const n of ['ca11_misdirected_data', 'ca11_misdirected_data_defend']) {
    const t = erb(n);
    assert.ok(!/see, correct or delete/.test(t), `${n}: still says correct goes to the DPO`);
    assert.match(t, /routine update, (such as|like) a new contact number, is ordinary work/);
    assert.match(t, /Correcting a contact detail on a claim is ordinary work/);
  }
});

test('ca11: teamLine has no fixed bracket about a deleted item', () => {
  for (const n of ['ca11_misdirected_data', 'ca11_misdirected_data_defend']) {
    const t = erb(n);
    assert.ok(!/one you deleted counts/.test(t), n);
    const m = t.match(/"teamLine": "([^"]*)"/);
    assert.ok(m && m[1].includes('{n}'), n);
  }
});

test('ca10: the supplier is Fernside everywhere, no Hatherby', () => {
  assert.ok(!/Hatherby/.test(erb('ca10_downloads_and_fake_checks')));
  const kit = readFileSync(join(root, 'planning_notes/phishing_and_social_engineering/awareness/office_kits/quayholt_insurance.json'), 'utf8');
  assert.ok(!/Hatherby/.test(kit));
});

test('ca02: the careers page lists the HGV driver role the genuine application names', () => {
  const t = erb('ca02_cv_lures');
  assert.match(t, /"id": "blk_vacancy_driver"/);
  assert.match(t, /Also hiring: HGV driver \(Class 1\)/);
  assert.match(t, /the Class 1 driver job on your website/);
});

test('ca13: the "your brief" debrief names the contact list the brief asked for, not a payment', () => {
  const t = erb('ca13_ai_assistant');
  assert.ok(!/small payment banked/.test(t));
  assert.ok(!/small invoice is paid/.test(t));
  assert.match(t, /the brief you handed the assistant is Brightwell's site contact list/);
});

// The ca02 attack seat lives twice: in the planning fragment
// (planning_notes/.../awareness/e2/attack.json) and in the shipped erb
// (scenarios/ca02_cv_lures/scenario.json.erb). The defend-side parity test does not look at
// the attack seat, so the Option A change (archive label, default macro block wording) was
// first made in the erb alone. This test fails if the shared attack copy drifts again.
// Not compared: phishTargets[0].subjects (the erb adds requiresTemplate and uses a colon).
// Run with: node --test test/js/ca02-attack-fragment-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const frag = JSON.parse(readFileSync(join(root, 'planning_notes/phishing_and_social_engineering/awareness/e2/attack.json'), 'utf8'));
const erb = JSON.parse(readFileSync(join(root, 'scenarios/ca02_cv_lures/scenario.json.erb'), 'utf8')).social;

test('ca02 attack payload kit matches the erb', () => {
  assert.deepEqual(frag.mailClient.payloadKit, erb.mailClient.payloadKit);
});

test('ca02 attack seeded brief matches the erb', () => {
  assert.deepEqual(frag.mailClient.seededMessages, erb.mailClient.seededMessages);
});

test('ca02 attack recruiter target copy matches the erb', () => {
  const f = frag.phishTargets[0];
  const e = erb.phishTargets[0];
  for (const k of ['factorStrings', 'replies', 'hints', 'requiredFactors', 'advisoryFactors', 'primedFor']) {
    assert.deepEqual(f[k], e[k], `phishTargets[0].${k} differs`);
  }
});

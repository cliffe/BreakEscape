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

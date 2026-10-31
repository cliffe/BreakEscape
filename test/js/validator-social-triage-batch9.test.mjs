// Engine batch 9 validator entries: per-item truth.trustLine (genuine-Trust line, real items only)
// and truth.chips / chipsOmit (per-item tick-list overrides). scripts/validate_social/triage.rb,
// called in-process on inline fixtures.
// Run with: node --test test/js/validator-social-triage-batch9.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function lintJson(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Triage.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const email = (id, truth) => ({
  id, from: { name: 'A', address: 'a@x.example' }, to: 'guest@x.example', subject: 's', time: '09:00', body: 'Body',
  links: [], attachments: [], auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, truth
});
const phishTruth = (extra = {}) => ({ isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'n' }, ...extra });
const realTruth = (extra = {}) => ({ isPhish: false, flags: [], whyFine: { default: 'fine' }, ...extra });

const base = (messages, setExtra = {}) => ({
  globalVariables: { triage_percent: 0, triage_reportRate: 0, triage_done: false, triage_pass: false },
  rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
  social: {
    mailClient: { accounts: [{ id: 'guest' }] },
    triageSets: [{ id: 's', stage: 'mission', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 }, messages, ...setExtra }]
  }
});
const errors = (out) => out.filter((s) => s.startsWith('❌'));
const warns = (out) => out.filter((s) => s.startsWith('⚠'));

test('truth.trustLine on a real item is accepted', { skip }, () => {
  const out = lintJson(base([email('a', realTruth({ trustLine: 'Right call — a real invoice.' })), email('b', phishTruth())]));
  assert.deepEqual(errors(out).filter((e) => /trustLine/.test(e)), []);
  assert.deepEqual(warns(out).filter((w) => /trustLine/.test(w)), []);
});

test('empty truth.trustLine errors', { skip }, () => {
  const out = lintJson(base([email('a', realTruth({ trustLine: '' })), email('b', phishTruth())]));
  assert.equal(errors(out).filter((e) => /trustLine is empty/.test(e)).length, 1);
});

test('truth.trustLine on a phish item warns (it is the genuine-Trust line, never seen on a phish)', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ trustLine: 'x' }))]));
  assert.equal(warns(out).filter((w) => /trustLine is on a phish item/.test(w)).length, 1);
});

test('truth.chips / chipsOmit naming ticks the set offers are accepted silently', { skip }, () => {
  const out = lintJson(base([
    email('a', realTruth()),
    email('b', phishTruth({ chips: ['senderTrust', 'linkCredible'], chipsOmit: ['urgencyCalibrated'] }))
  ]));
  assert.deepEqual(errors(out).filter((e) => /\.(chips|chipsOmit)/.test(e)), []);
  assert.deepEqual(warns(out).filter((w) => /\.(chips|chipsOmit)/.test(w)), []);
});

test('truth.chips must be an array of ids', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ chips: 'senderTrust' }))]));
  assert.equal(errors(out).filter((e) => /chips must be an array/.test(e)).length, 1);
});

test('a chips id the set does not offer warns (it changes nothing)', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ chips: ['not_a_real_tell'] }))]));
  assert.equal(warns(out).filter((w) => /not a tick this set offers/.test(w)).length, 1);
});

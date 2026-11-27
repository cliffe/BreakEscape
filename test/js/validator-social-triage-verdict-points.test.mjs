// batch-6 M1: the validator warns when a trust-family verdict reaches full marks (60) on a phish
// item (truth.verdictPoints) or for a kind that carries a phish (scoring.kindPoints), and accepts
// the { phish, real } split that lets Trust be full marks on genuine items only.
// scripts/validate_social/triage.rb, called in-process. Fixtures inline.
// Run with: node --test test/js/validator-social-triage-verdict-points.test.mjs
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
const warns = (out) => out.filter((s) => s.startsWith('⚠'));
const errors = (out) => out.filter((s) => s.startsWith('❌'));
const trustWarns = (out) => warns(out).filter((w) => /full marks/.test(w));

test('truth.verdictPoints.trust = 60 on a phish item warns', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ verdictPoints: { trust: 60 } }))]));
  assert.equal(trustWarns(out).filter((w) => /truth\.verdictPoints\.trust/.test(w)).length, 1);
});

test('truth.verdictPoints.trust = 60 on a real item does not warn', { skip }, () => {
  const out = lintJson(base([email('a', realTruth({ verdictPoints: { trust: 60 } })), email('b', phishTruth())]));
  assert.deepEqual(trustWarns(out), []);
});

test('scoring.kindPoints.email.trust = 60 (flat) warns when a phish email is in the set', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth())],
    { scoring: { kindPoints: { email: { trust: 60 } } } }));
  assert.equal(trustWarns(out).filter((w) => /kindPoints\.email\.trust/.test(w)).length, 1);
});

test('scoring.kindPoints.email = { phish:{trust:0}, real:{trust:60} } does not warn (the clean pattern)', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth())],
    { scoring: { kindPoints: { email: { phish: { trust: 0 }, real: { trust: 60 } } } } }));
  assert.deepEqual(errors(out).filter((e) => /kindPoints/.test(e)), []);
  assert.deepEqual(trustWarns(out), []);
});

test('scoring.kindPoints.email.phish.trust = 60 warns (it rewards trusting a phish outright)', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth())],
    { scoring: { kindPoints: { email: { phish: { trust: 60 }, real: { trust: 60 } } } } }));
  assert.equal(trustWarns(out).filter((w) => /kindPoints\.email\.phish\.trust/.test(w)).length, 1);
});

test('the { phish, real } split is rejected on a per-item truth.verdictPoints', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ verdictPoints: { phish: { trust: 0 } } }))]));
  assert.ok(errors(out).some((e) => /split is only for set\.scoring\.kindPoints/.test(e)));
});

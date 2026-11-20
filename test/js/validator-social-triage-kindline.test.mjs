// truth.kindLine / truth.missLabel (genuine items scored as isPhish true) and set.chipOrder:
// scripts/validate_social/triage.rb. Called in-process. Fixtures inline.
// Run with: node --test test/js/validator-social-triage-kindline.test.mjs
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
    triageSets: [{ id: 's', stage: 'mission', scoringProfile: 'analyst', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 }, messages, ...setExtra }]
  }
});
const errors = (out) => out.filter((s) => s.startsWith('❌'));
const warns = (out) => out.filter((s) => s.startsWith('⚠'));

test('a phish with kindLine and missLabel is accepted', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ kindLine: 'This one was real.', missLabel: 'ignoring a notice' }))]));
  assert.deepEqual(errors(out).filter((e) => /kindLine|missLabel/.test(e)), []);
});

test('an empty kindLine or missLabel is an error', { skip }, () => {
  const out = lintJson(base([email('a', realTruth()), email('b', phishTruth({ kindLine: ' ', missLabel: '' }))]));
  assert.equal(errors(out).filter((e) => /kindLine is empty/.test(e)).length, 1);
  assert.equal(errors(out).filter((e) => /missLabel is empty/.test(e)).length, 1);
});

test('kindLine on a real item is a warning (never shown)', { skip }, () => {
  const out = lintJson(base([email('a', realTruth({ kindLine: 'x' })), email('b', phishTruth())]));
  assert.equal(warns(out).filter((e) => /kindLine is on a real item/.test(e)).length, 1);
});

test('chipOrder accepts default and relevantFirst, rejects others', { skip }, () => {
  const msgs = [email('a', realTruth()), email('b', phishTruth())];
  assert.deepEqual(errors(lintJson(base(msgs, { chipOrder: 'relevantFirst' }))).filter((e) => /chipOrder/.test(e)), []);
  assert.equal(errors(lintJson(base(msgs, { chipOrder: 'random' }))).filter((e) => /chipOrder/.test(e)).length, 1);
});

// ENG-03a: scripts/validate_social/triage.rb page-state url rule. url is required for the
// web-page states (none, fakeCheck, fakeUpdate, downloadBar, browserWarning) and optional for the
// chrome/overlay states (relaunchBar, fullScreenAlarm, extensionPermission); an unknown state is
// rejected. Called in-process. Fixtures inline.
// Run with: node --test test/js/validator-social-triage-page-states.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function lintJson(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Triage.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const email = (id, phish, flags = []) => ({
  id, from: { name: 'A', address: 'a@x.example' }, to: 'guest@x.example', subject: 's', time: '09:00', body: 'Body',
  links: [], attachments: [], auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
  truth: phish
    ? { isPhish: true, flags, perFlagNote: Object.fromEntries(flags.map((f) => [f, 'n'])) }
    : { isPhish: false, flags: [], whyFine: { default: 'fine' } }
});

// A genuine page message (no scored flags, so no channelTells machinery needed).
const pageMsg = (id, page) => ({
  id, kind: 'page', subject: 's', time: '09:00', body: 'Body', page,
  truth: { isPhish: false, flags: [], whyFine: { default: 'fine' } }
});

const base = (pageMessage) => ({
  globalVariables: { triage_percent: 0, triage_reportRate: 0, triage_complete: false, triage_pass: false },
  rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
  social: {
    mailClient: { accounts: [{ id: 'guest' }] },
    triageSets: [{
      id: 's', stage: 'mission', scoringProfile: 'analyst', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
      messages: [email('a', false), email('b', true, ['senderTrust']), pageMessage]
    }]
  }
});

const errors = (out) => out.filter((s) => s.startsWith('❌'));

test('a chrome/overlay state (relaunchBar) with no url raises no url error', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { state: 'relaunchBar', heading: 'An update is ready' })));
  assert.deepEqual(errors(out), [], out.join('\n'));
});

test('a web-page state (fakeCheck) with no url is flagged', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { state: 'fakeCheck', heading: 'Verify you are human', clipboardReveal: 'a harmless description' })));
  assert.ok(errors(out).some((e) => /page\.url is missing/.test(e)), out.join('\n'));
});

test('a web-page state (fakeCheck) with a url validates', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { url: 'https://orders.fernside.example/verify', padlock: true, state: 'fakeCheck', clipboardReveal: 'a harmless description' })));
  assert.deepEqual(errors(out), [], out.join('\n'));
});

test('the ordinary page (no state) still requires a url', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { padlock: true, heading: 'Sign in' })));
  assert.ok(errors(out).some((e) => /page\.url is missing/.test(e)), out.join('\n'));
});

test('an unknown state is rejected', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { state: 'nope' })));
  assert.ok(errors(out).some((e) => /page\.state 'nope' is not one of/.test(e)), out.join('\n'));
});

test('extensionPermission permissions must be non-empty strings', { skip }, () => {
  const good = lintJson(base(pageMsg('p', { state: 'extensionPermission', heading: 'Add?', permissions: ['Read everything'] })));
  assert.deepEqual(errors(good), [], good.join('\n'));
  const bad = lintJson(base(pageMsg('p', { state: 'extensionPermission', heading: 'Add?', permissions: ['', 'x'] })));
  assert.ok(errors(bad).some((e) => /permissions must be an array of non-empty strings/.test(e)), bad.join('\n'));
});

// E10 MI2: page.fields may carry a tick-box object { label, type, checked? }.
test('page.fields accepts a tick object and a string, and rejects an object with no label', { skip }, () => {
  const good = lintJson(base(pageMsg('p', { url: 'https://c.example/verify', padlock: true,
    fields: ['Email', { label: 'I am not a robot', type: 'tick', checked: false }] })));
  assert.deepEqual(errors(good), [], good.join('\n'));
  const bad = lintJson(base(pageMsg('p', { url: 'https://c.example/verify', padlock: true, fields: [{ type: 'tick' }] })));
  assert.ok(errors(bad).some((e) => /page\.fields must be an array/.test(e)), bad.join('\n'));
  const badType = lintJson(base(pageMsg('p', { url: 'https://c.example/verify', padlock: true, fields: [{ label: 'x', type: 'radio' }] })));
  assert.ok(errors(badType).some((e) => /page\.fields must be an array/.test(e)), badType.join('\n'));
});

// Batch 3: set-level label overrides phishCaughtLabel and scoreLine.
const withLabels = (labels) => {
  const b = base(pageMsg('p', { url: 'https://x.example', padlock: true, heading: 'Sign in' }));
  b.social.triageSets[0].labels = labels;
  return b;
};
test('labels.phishCaughtLabel and labels.scoreLine validate, and empty is rejected', { skip }, () => {
  assert.deepEqual(errors(lintJson(withLabels({ phishCaughtLabel: 'Requests handled', scoreLine: 'Right call is most of it.' }))), []);
  assert.ok(errors(lintJson(withLabels({ phishCaughtLabel: '' }))).some((e) => /labels\.phishCaughtLabel must be a non-empty string/.test(e)));
  assert.ok(errors(lintJson(withLabels({ scoreLine: '  ' }))).some((e) => /labels\.scoreLine must be a non-empty string/.test(e)));
  assert.ok(errors(lintJson(withLabels({ nope: 'x' }))).some((e) => /labels has the key 'nope'/.test(e)));
});

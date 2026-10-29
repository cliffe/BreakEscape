// ENG-14: scripts/validate_social/triage.rb and the schema for page.state 'wifiList'. url is
// optional; networks must be a non-empty array of { ssid, signal, secured } with no credential-like
// field. Lint called in-process; schema via validate_json. Fixtures inline.
// Run with: node --test test/js/validator-social-triage-wifi-list.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

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

const pageMsg = (id, page) => ({
  id, kind: 'page', subject: 's', time: '09:00', body: 'Body', page,
  truth: { isPhish: false, flags: [], whyFine: { default: 'fine' } }
});
const email = (id) => ({
  id, from: { name: 'A', address: 'a@x.example' }, to: 'guest@x.example', subject: 's', time: '09:00', body: 'Body',
  links: [], attachments: [], auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
  truth: { isPhish: false, flags: [], whyFine: { default: 'fine' } }
});
const base = (pageMessage) => ({
  globalVariables: { triage_percent: 0, triage_reportRate: 0, triage_done: false, triage_pass: false },
  rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
  social: {
    mailClient: { accounts: [{ id: 'guest' }] },
    triageSets: [{
      id: 's', stage: 'mission', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
      messages: [email('a'), pageMessage]
    }]
  }
});
const errors = (out) => out.filter((s) => s.startsWith('❌'));
const nets = () => [
  { ssid: 'BeanBarrow Guest', signal: 'strong', secured: true },
  { ssid: 'BeanBarrow Free', signal: 3, secured: false, note: 'n' }
];
const good = () => ({ state: 'wifiList', venueNote: 'The sign by the till', networks: nets() });

test('a clean wifiList card with no url validates', { skip }, () => {
  const out = lintJson(base(pageMsg('p', good())));
  assert.deepEqual(errors(out), [], out.join('\n'));
});

test('a wifiList card with no networks, or an empty list, is refused', { skip }, () => {
  for (const pg of [{ state: 'wifiList' }, { state: 'wifiList', networks: [] }]) {
    const out = lintJson(base(pageMsg('p', pg)));
    assert.ok(errors(out).some((e) => /networks is missing or empty/.test(e)), out.join('\n'));
  }
});

test('a networks entry with a credential-like field is refused', { skip }, () => {
  for (const k of ['password', 'passphrase', 'psk', 'key', 'secret']) {
    const pg = good();
    pg.networks[0][k] = 'x';
    const out = lintJson(base(pageMsg('p', pg)));
    assert.ok(errors(out).some((e) => new RegExp(`networks\\[0\\]\\.${k} looks like a credential field`).test(e)), `${k}: ${out.join('\n')}`);
  }
});

test('a networks entry needs a name and a usable signal, and secured must be boolean', { skip }, () => {
  const pg = good();
  pg.networks = [{ ssid: '', signal: 'strong', secured: true }, { ssid: 'B', signal: 'loud', secured: true }, { ssid: 'C', signal: 2, secured: 'yes' }];
  const out = lintJson(base(pageMsg('p', pg)));
  const e = errors(out).join('\n');
  assert.match(e, /networks\[0\]\.ssid is empty/);
  assert.match(e, /networks\[1\]\.signal must be/);
  assert.match(e, /networks\[2\]\.secured must be true or false/);
});

test('a missing secured flag is a warning, not an error', { skip }, () => {
  const pg = good();
  delete pg.networks[0].secured;
  const out = lintJson(base(pageMsg('p', pg)));
  assert.deepEqual(errors(out), [], out.join('\n'));
  assert.ok(out.some((s) => /networks\[0\]\.secured is not set/.test(s)), out.join('\n'));
});

test('the ordinary page and the other states are unchanged: url still required with no state', { skip }, () => {
  const out = lintJson(base(pageMsg('p', { padlock: true, heading: 'Sign in' })));
  assert.ok(errors(out).some((e) => /page\.url is missing/.test(e)), out.join('\n'));
  const ok = lintJson(base(pageMsg('p', { state: 'relaunchBar', heading: 'Ready' })));
  assert.deepEqual(errors(ok), [], ok.join('\n'));
});

// ── schema ─────────────────────────────────────────────────────────────────────
const schemaBase = JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_schema/base.json'), 'utf8'));
function schemaIssues(pageObj) {
  const j = structuredClone(schemaBase);
  j.social.triageSets[0].messages.push(pageMsg('wifi1', pageObj));
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    j = JSON.parse($stdin.read)
    social, other = ValidateSocial.split_schema_errors(validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
    puts JSON.generate(social + other)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(j), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('schema: a wifiList card (no url, networks, venueNote, labels) passes', { skip }, () => {
  const pg = good();
  pg.labels = { secured: 'Locked', open: 'Unlocked' };
  assert.deepEqual(schemaIssues(pg), []);
});

test('schema: a typo key on a network entry, or a network with no signal, fails', { skip }, () => {
  const typo = good();
  typo.networks[0].sssid = 'x';
  assert.ok(schemaIssues(typo).some((e) => /sssid/.test(e)));
  const noSignal = good();
  delete noSignal.networks[0].signal;
  assert.ok(schemaIssues(noSignal).some((e) => /signal/.test(e)));
});

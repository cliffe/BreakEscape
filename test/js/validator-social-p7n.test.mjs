// P7-N (validator owner, wave 2): the triage fields P7-L added (page.certificate, page.autofill,
// voicemail audio), attack.layout, the triage `unlaunched` lint counting an episode's defend set,
// the passPercent-0 warning exempting an episode set, the defendOnly prefix message, and the
// 05 N5 rule that setGlobalPrefix names count as written for exportGlobals.
// Inline scenarios through the in-process lints and the schema; fixtures in
// test/js/fixtures/social_awareness/. Run with: bundle exec node --test test/js/validator-social-p7n.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = (n) => JSON.parse(readFileSync(join(root, 'test/js/fixtures/social_awareness', n), 'utf8'));
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };
const clone = (o) => JSON.parse(JSON.stringify(o));

function rb(body, json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: json['importGlobals'])
    ${body}`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const triage = (j) => rb('puts JSON.generate(ValidateSocial::Triage.check(ctx))', j);
const awareness = (j) => rb('puts JSON.generate(ValidateSocial::Awareness.check(ctx))', j);
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);

const TELLS = ['padlock_myth', 'vish_callback_pressure'];
const truth = (f) => ({ isPhish: true, flags: [f], perFlagNote: { [f]: 'n' } });
function mini(messages) {
  return {
    globalVariables: { k_percent: 0, k_reportRate: 0, k_complete: false, k_pass: false },
    rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 'k' } }] } },
    social: {
      triageSets: [{
        id: 'k', stage: 'training', scoringProfile: 'awareness', channelTells: TELLS,
        outcome: { setGlobalPrefix: 'k_', passPercent: 60 }, messages
      }]
    }
  };
}
const page = (extra = {}) => ({ id: 'pg', kind: 'page', page: { url: 'https://sso.example/login', padlock: true, fields: ['Email'], ...extra }, truth: truth('padlock_myth') });
const vm = (extra = {}) => ({ id: 'vm', kind: 'voicemail', from: { name: 'Dana' }, body: 'Pay it now.', duration: '0:20', truth: truth('vish_callback_pressure'), ...extra });

test('page.certificate: a host name is clean; a URL, a phrase, a port or an empty value is an error', { skip }, () => {
  assert.deepEqual(triage(mini([page({ certificate: { issuedTo: 'sso.example', issuer: 'Open Certs Ltd', note: 'n' } })])), []);
  assert.deepEqual(triage(mini([page({ certificate: { issuedTo: '*.sso.example' } })])), []);
  for (const bad of ['https://sso.example', 'sso.example/login', 'sso.example:443', 'Ledgerwell Ltd', 'localhost', 'sso_example.test']) {
    expectIn(triage(mini([page({ certificate: { issuedTo: bad } })])), /❌.*page\.certificate\.issuedTo .* does not look like a host name/);
  }
  expectIn(triage(mini([page({ certificate: { issuer: 'x' } })])), /❌.*page\.certificate\.issuedTo is missing/);
  expectIn(triage(mini([page({ certificate: 'sso.example' })])), /❌.*page\.certificate must be an object/);
});

test('voicemail audio: { clipId } is clean on a voicemail, an error when empty, ignored with a warning elsewhere', { skip }, () => {
  assert.deepEqual(triage(mini([vm({ audio: { clipId: 'VO6' } })])), []);
  expectIn(triage(mini([vm({ audio: { clipId: '' } })])), /❌.*audio\.clipId is empty or missing/);
  expectIn(triage(mini([vm({ audio: 'VO6' })])), /❌.*audio\.clipId is empty or missing/);
  expectIn(triage(mini([page({}), { ...page({}), id: 'pg2', audio: { clipId: 'VO6' } }])), /⚠️.*has 'audio', which a page message does not read/);
});

function schemaRun(list) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    out = JSON.parse($stdin.read).map do |j|
      social, other = ValidateSocial.split_schema_errors(validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
      { social: social, other: other }
    end
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(list), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('schema: certificate, autofill, audio and attack.layout are accepted; bad shapes fail under #/social', { skip }, () => {
  const good = mini([
    page({ certificate: { issuedTo: 'sso.example', issuer: 'i', note: 'n' }, autofill: 'none' }),
    { ...page({ autofill: 'filled' }), id: 'pg2' },
    vm({ audio: { clipId: 'VO6' } })
  ]);
  const bads = [
    ['autofill outside the enum', mini([page({ autofill: 'maybe' })]), /autofill/],
    ['certificate without issuedTo', mini([page({ certificate: { issuer: 'x' } })]), /issuedTo/],
    ['an unknown certificate key', mini([page({ certificate: { issuedTo: 'a.example', expires: 'x' } })]), /expires/],
    ['audio without clipId', mini([vm({ audio: {} })]), /clipId/],
    ['an unknown audio key', mini([vm({ audio: { clipId: 'VO6', url: 'x' } })]), /url/]
  ];
  const full = fx('clean_full.json');
  full.social.awarenessEpisode.attack.layout = 'phone';
  const badLayout = fx('clean_full.json');
  badLayout.social.awarenessEpisode.attack.layout = 'tablet';
  const results = schemaRun([good, full, badLayout, ...bads.map((b) => b[1])]);
  // mini() is not a whole scenario, so only the #/social errors are compared
  assert.deepEqual(results[0].social, []);
  assert.deepEqual(results[1], { social: [], other: [] });
  assert.ok(results[2].social.some((e) => e.includes('layout')), results[2].social.join('\n'));
  bads.forEach(([name, , re], i) => {
    const { social } = results[i + 3];
    assert.ok(social.some((e) => re.test(e)), `${name}: no matching error\n${social.join('\n')}`);
  });
});

test('unlaunched: an episode defend set counts as launched; a stray set still warns', { skip }, () => {
  const j = fx('clean_defend_only.json');
  assert.equal(hits(triage(j), /is not launched by any triage-workstation/), 0);
  // the same set with no episode block pointing at it is unlaunched (the kiosk does not launch it)
  const stray = clone(j);
  stray.social.triageSets.push({ ...clone(stray.social.triageSets[0]), id: 'stray', outcome: { setGlobalPrefix: 'stray_', passPercent: 0 } });
  expectIn(triage(stray), /social\.triageSets\[stray\] is not launched/);
  delete stray.social.awarenessEpisode;
  expectIn(triage(stray), /is not launched/, 2);
});

test('passPercent 0: warned on a training set, not on an episode defend set', { skip }, () => {
  const j = fx('clean_defend_only.json');
  j.social.triageSets[0].stage = 'training';
  assert.equal(hits(triage(j), /passPercent is 0/), 0);
  const plain = clone(j);
  delete plain.social.awarenessEpisode;
  plain.rooms.ep_room.objects.push({ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: plain.social.triageSets[0].id } });
  expectIn(triage(plain), /⚠️.*passPercent is 0 on a training set/);
});

test('defendOnly prefix: the doubled _defend_defend_ stays the rule, and the error says why', { skip }, () => {
  const j = fx('clean_defend_only.json');
  assert.equal(j.social.triageSets[0].outcome.setGlobalPrefix, 'episode_e1_stub_defend_defend_');
  assert.deepEqual(awareness(j), []);
  j.social.triageSets[0].outcome.setGlobalPrefix = 'episode_e1_stub_defend_';
  expectIn(awareness(j), /setGlobalPrefix is "episode_e1_stub_defend_"; it must be 'episode_e1_stub_defend_defend_'.*defendPrefix\(\)/);
});

test('05 N5: setGlobalPrefix names, with {stage} filled, count as written for exportGlobals', { skip }, () => {
  const j = fx('clean_check_pre.json');
  const writes = rb('puts JSON.generate(carry_over_json_writes(json).keys)', j);
  for (const n of ['percent', 'reportRate', 'complete']) assert.ok(writes.includes(`triage_pre_${n}`), writes.join(','));
  assert.deepEqual(j.exportGlobals, ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_complete']);
});

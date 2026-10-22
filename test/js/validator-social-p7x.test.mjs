// P7-X (validator owner, wave 3): the `mfa` stage and its push-stream data, and the role swap's
// `defend.calls[]` (schema fields and awareness.rb lints). A clean E3-shaped shell is built from
// test/js/fixtures/social_awareness/clean_full.json, then mutated, one failing case per lint.
// Run with: bundle exec node --test test/js/validator-social-p7x.test.mjs
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
const lint = (j) => rb('puts JSON.generate(ValidateSocial::Awareness.check(ctx))', j);
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const ep = (j) => j.social.awarenessEpisode;
const set = (j) => j.social.triageSets[0];

const MFA = {
  pushes: [
    { id: 'p1', at: '06:41', app: 'Northgate Authenticator', account: 'm.reyes', location: 'Unknown location', device: 'Unknown device' },
    { id: 'p2', at: '06:43', app: 'Northgate Authenticator', account: 'm.reyes', location: 'Unknown location', device: 'Unknown device' },
    { id: 'p3', at: '06:47', app: 'Northgate Authenticator', account: 'm.reyes' }
  ],
  approvesAt: '06:50',
  mode: 'attacker'
};
const call = (id, genuine, extra = {}) => ({
  id,
  genuine,
  callerId: '+44 20 7946 0000',
  transcript: [{ who: 'Caller', text: 'I am locked out, please reset it now.' }],
  claims: [{ fact: 'employee_id', value: 'e4417' }],
  ...(genuine
    ? { notes: { whyFine: { default: 'The caller took the callback.' } } }
    : { tells: ['vish_callback_pressure'], notes: { perFlagNote: { vish_callback_pressure: 'Would not take a callback.' } } }),
  ...extra
});

// An E3-shaped shell: mfa stage and data, a pretext call to claim against, four calls + one push item.
function e3() {
  const j = fx('clean_full.json');
  j.social.pretextNpcs = [{ callId: 'helpdesk_call', character: 'helpdesk', knows: {
    employee_id: { value: 'e4417', grade: 'identity' }, manager: { value: 'okafor', grade: 'lesser', accept: ['adaeze'] }
  } }];
  ep(j).stages = ['brief', 'osint', 'write', 'mfa', 'flip', 'defend', 'debrief'];
  ep(j).mfa = clone(MFA);
  set(j).verifyVerdict = true;
  set(j).channelTells = ['vish_callback_pressure', 'unrequested_mfa_push'];
  set(j).messages = [set(j).messages[0]];
  set(j).messages[0].truth = { isPhish: false, whyFine: { default: 'fine' }, flags: [] };
  delete set(j).messages[0].notes;
  ep(j).defend.calls = [call('c_imp1', false), call('c_imp2', false), call('c_real1', true), call('c_real2', true)];
  return j;
}

test('the E3-shaped shell is clean, and so is the same shell without mfa and calls', { skip }, () => {
  assert.deepEqual(lint(e3()), []);
  const j = fx('clean_full.json');
  assert.deepEqual(lint(j), []);
});

test('mfa stage: allowed straight after write or after flip, nowhere else', { skip }, () => {
  let j = e3();
  ep(j).stages = ['brief', 'osint', 'write', 'flip', 'mfa', 'defend', 'debrief'];
  assert.deepEqual(lint(j), []);
  j = e3();
  ep(j).stages = ['brief', 'mfa', 'osint', 'write', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages .*straight after 'write' or straight after 'flip'/);
  j = e3();
  ep(j).stages = ['brief', 'osint', 'write', 'mfa', 'flip', 'defend', 'debrief', 'mfa'];
  expectIn(lint(j), /variant 'full' has stages/);
  j = fx('clean_defend_only.json');
  ep(j).stages = ['brief', 'mfa', 'defend', 'debrief'];
  ep(j).mfa = clone(MFA);
  expectIn(lint(j), /variant 'defendOnly' has stages/);
});

test('mfa data: required with the stage, ignored without it', { skip }, () => {
  let j = e3();
  delete ep(j).mfa;
  expectIn(lint(j), /stages lists 'mfa' but there is no awarenessEpisode\.mfa/);
  j = e3();
  ep(j).stages = ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /⚠️.*awarenessEpisode\.mfa is set but stages has no 'mfa'/);
  j = e3();
  ep(j).mfa = 'later';
  expectIn(lint(j), /awarenessEpisode\.mfa must be an object/);
});

test('mfa pushes: a list, each with an app and a valid time, unique ids', { skip }, () => {
  let j = e3();
  ep(j).mfa.pushes = [];
  expectIn(lint(j), /mfa\.pushes must be a non-empty array/);
  j = e3();
  ep(j).mfa.pushes = [ep(j).mfa.pushes[0]];
  expectIn(lint(j), /⚠️.*mfa\.pushes has one push/);
  j = e3();
  delete ep(j).mfa.pushes[1].app;
  expectIn(lint(j), /pushes\[1\]\.app is missing/);
  for (const bad of ['25:00', '6:75', 'half past six', null]) {
    j = e3();
    ep(j).mfa.pushes[2].at = bad;
    expectIn(lint(j), /pushes\[2\]\.at is .*HH:MM/);
  }
  j = e3();
  ep(j).mfa.pushes[1].id = 'p1';
  expectIn(lint(j), /pushes repeats the id "p1"/);
  j = e3();
  ep(j).mfa.pushes[0] = 'push';
  expectIn(lint(j), /pushes\[0\] must be an object/);
});

test('mfa approvesAt: present, a time, not before the first push; mode; mixed formats warn', { skip }, () => {
  let j = e3();
  delete ep(j).mfa.approvesAt;
  expectIn(lint(j), /mfa\.approvesAt is missing/);
  j = e3();
  ep(j).mfa.approvesAt = 'soon';
  expectIn(lint(j), /mfa\.approvesAt is "soon"/);
  j = e3();
  ep(j).mfa.approvesAt = '06:30';
  expectIn(lint(j), /approvesAt \(06:30\) is before the first push/);
  j = e3();
  ep(j).mfa.mode = 'defender';
  expectIn(lint(j), /mfa\.mode is "defender"/);
  j = e3();
  ep(j).mfa.approvesAt = 410;
  expectIn(lint(j), /⚠️.*mixes "HH:MM" strings and plain numbers/);
  j = e3();
  ep(j).mfa = { pushes: [{ at: 400, app: 'A' }, { at: 402, app: 'A' }], approvesAt: 410 };
  assert.deepEqual(lint(j), []);
});

test('defend.calls: shape, ids and the set that holds them', { skip }, () => {
  let j = e3();
  ep(j).defend.calls = 'none';
  expectIn(lint(j), /defend\.calls must be an array/);
  j = e3();
  ep(j).defend.calls = [];
  expectIn(lint(j), /defend\.calls is empty/);
  j = e3();
  ep(j).defend.calls[1].id = 'c_imp1';
  expectIn(lint(j), /calls\[1\] \(c_imp1\)\.id 'c_imp1' is used by an earlier call/);
  j = e3();
  ep(j).defend.calls[0].id = set(j).messages[0].id;
  expectIn(lint(j), /\.id '[a-z_]+' is also a message id in defend set/);
  j = e3();
  delete ep(j).defend.calls[0].id;
  expectIn(lint(j), /calls\[0\]\.id is missing/);
  j = e3();
  ep(j).defend.calls[0].genuine = 'no';
  expectIn(lint(j), /calls\[0\] \(c_imp1\)\.genuine must be true or false/);
  j = e3();
  set(j).verifyVerdict = false;
  expectIn(lint(j), /call messages, which belong in an awareness set with verifyVerdict: true/);
  j = e3();
  set(j).scoringProfile = 'analyst';
  expectIn(lint(j), /belong in an awareness set with verifyVerdict: true/);
});

test('defend.calls: the set count includes the calls', { skip }, () => {
  let j = e3();
  ep(j).defend.calls.pop();
  ep(j).defend.calls.pop();
  expectIn(lint(j), /has 3 message\(s\) including defend\.calls; an episode's defend set has 5 to 8/);
  j = e3();
  set(j).messages.push(clone(set(j).messages[0]), clone(set(j).messages[0]), clone(set(j).messages[0]), clone(set(j).messages[0]));
  expectIn(lint(j), /has 9 message\(s\) including defend\.calls/);
});

test('defend.calls: a genuine and an impostor are both needed', { skip }, () => {
  let j = e3();
  ep(j).defend.calls = [call('a', false), call('b', false), call('c', false), call('d', false)];
  expectIn(lint(j), /no genuine call; refusing every caller would win/);
  j = e3();
  ep(j).defend.calls = [call('a', true), call('b', true), call('c', true), call('d', true)];
  expectIn(lint(j), /no impostor call/);
});

test('defend.calls claims: the fact must be a knows id of the pretext call', { skip }, () => {
  let j = e3();
  ep(j).defend.calls[0].claims = [{ fact: 'shoe_size', value: '9' }];
  expectIn(lint(j), /claims\[0\]\.fact 'shoe_size' is not a knows id of the pretext call/);
  j = e3();
  ep(j).defend.calls[0].claims = [{ fact: 'manager', value: '' }];
  expectIn(lint(j), /claims\[0\]\.value is missing/);
  j = e3();
  ep(j).defend.calls[0].claims = [{ value: 'x' }];
  expectIn(lint(j), /claims\[0\]\.fact is missing/);
  j = e3();
  ep(j).defend.calls[0].claims = {};
  expectIn(lint(j), /claims must be an array of \{ fact, value \}/);
  // a wrong value on an impostor is the point; on a genuine caller it is a warning, and accept counts
  j = e3();
  ep(j).defend.calls[0].claims = [{ fact: 'employee_id', value: 'e0000' }];
  assert.deepEqual(lint(j), []);
  j = e3();
  ep(j).defend.calls[2].claims = [{ fact: 'employee_id', value: 'e0000' }];
  expectIn(lint(j), /⚠️.*a genuine caller claims 'e0000' for 'employee_id'/);
  j = e3();
  ep(j).defend.calls[2].claims = [{ fact: 'manager', value: 'adaeze' }];
  assert.deepEqual(lint(j), []);
});

test('defend.callsFrom names the pretext call claims resolve against', { skip }, () => {
  let j = e3();
  j.social.pretextNpcs.push({ callId: 'other', character: 'x', knows: { shoe_size: { value: '9', grade: 'lesser' } } });
  ep(j).defend.calls[0].claims = [{ fact: 'shoe_size', value: '9' }];
  assert.deepEqual(lint(j), []);
  ep(j).defend.callsFrom = 'helpdesk_call';
  expectIn(lint(j), /claims\[0\]\.fact 'shoe_size' is not a knows id/);
  ep(j).defend.callsFrom = 'nope';
  expectIn(lint(j), /defend\.callsFrom 'nope' is not a callId in social\.pretextNpcs/);
});

test('defend.calls tells and notes: channel tells only, impostor flagged, genuine clean', { skip }, () => {
  let j = e3();
  ep(j).defend.calls[0].tells = ['senderTrust'];
  ep(j).defend.calls[0].notes = { perFlagNote: { senderTrust: 'n' } };
  expectIn(lint(j), /truth\.flags: 'senderTrust' is an email factor/);
  j = e3();
  ep(j).defend.calls[0].tells = ['borrowed_authority'];
  ep(j).defend.calls[0].notes = { perFlagNote: { borrowed_authority: 'n' } };
  expectIn(lint(j), /'borrowed_authority' is not in 00 section 2's factor library or this set's enabled channel tells/);
  j = e3();
  ep(j).defend.calls[0].tells = [];
  expectIn(lint(j), /a phish needs at least one truth\.flags id/);
  j = e3();
  delete ep(j).defend.calls[0].notes;
  expectIn(lint(j), /truth\.perFlagNote is missing/);
  j = e3();
  ep(j).defend.calls[2].tells = ['vish_callback_pressure'];
  expectIn(lint(j), /real mail must have no truth\.flags/);
  j = e3();
  delete ep(j).defend.calls[2].notes;
  expectIn(lint(j), /truth\.whyFine is missing or empty/);
  j = e3();
  ep(j).defend.calls[0].tells = 'vish_callback_pressure';
  expectIn(lint(j), /\.tells must be an array of channel tell ids/);
});

test('defend.calls transcript and caller id come from the call kind rules', { skip }, () => {
  let j = e3();
  delete ep(j).defend.calls[0].transcript;
  expectIn(lint(j), /calls\[0\] \(c_imp1\)\.transcript must be a non-empty array/);
  j = e3();
  ep(j).defend.calls[0].transcript = [{ who: 'A' }];
  expectIn(lint(j), /transcript\[0\] needs a non-empty text/);
  j = e3();
  delete ep(j).defend.calls[0].callerId;
  expectIn(lint(j), /⚠️.*has no callerId or from/);
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

test('schema: mfa, the mfa stage and defend.calls are accepted; bad shapes fail under #/social', { skip }, () => {
  const bads = [
    ['a stage outside the list', (j) => { ep(j).stages.push('gloat'); }, /gloat|stages/],
    ['mfa without approvesAt', (j) => { delete ep(j).mfa.approvesAt; }, /approvesAt/],
    ['a push without app', (j) => { delete ep(j).mfa.pushes[0].app; }, /app/],
    ['an unknown mfa key', (j) => { ep(j).mfa.speed = 2; }, /speed/],
    ['an unknown push key', (j) => { ep(j).mfa.pushes[0].colour = 'red'; }, /colour/],
    ['mode outside the enum', (j) => { ep(j).mfa.mode = 'defender'; }, /mode/],
    ['a call without genuine', (j) => { delete ep(j).defend.calls[0].genuine; }, /genuine/],
    ['a call without a transcript', (j) => { delete ep(j).defend.calls[0].transcript; }, /transcript/],
    ['an unknown call key', (j) => { ep(j).defend.calls[0].mood = 'tense'; }, /mood/],
    ['a claim without a value', (j) => { delete ep(j).defend.calls[0].claims[0].value; }, /value/],
    ['an unknown note key', (j) => { ep(j).defend.calls[2].notes.whyNot = {}; }, /whyNot/],
    ['an unknown defend key', (j) => { ep(j).defend.callz = []; }, /callz/]
  ].map(([name, mut, re]) => { const j = e3(); mut(j); return [name, j, re]; });
  const results = schemaRun([e3(), ...bads.map((b) => b[1])]);
  assert.deepEqual(results[0], { social: [], other: [] });
  bads.forEach(([name, , re], i) => {
    const { social } = results[i + 1];
    assert.ok(social.some((e) => re.test(e)), `${name}: no matching error\n${social.join('\n')}`);
  });
});

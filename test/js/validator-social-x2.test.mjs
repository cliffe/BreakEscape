// P7-X2 (validator pass): the lint and schema items from the Phase 7 hand-offs.
//   build stage + attack.landingPageId, attack.callId, the new strings (flipMissed, flipPageIntro,
//   flipCallIntro, continue, facilitator, defendIntro, conceptPanel, voicePanel), claim labels,
//   se_awareness_records as [] or {}, the check-mission lints, the kiosk-launched post stage,
//   enable_content_prompt, and the carry-over name lint exemption for triage result globals.
// Built from test/js/fixtures/social_awareness/*.json; one failing case per lint.
// Run with: bundle exec node --test test/js/validator-social-x2.test.mjs
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

function rb(body, json, raw = false) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: json['importGlobals'],
                                      raw: ${raw ? 'JSON.generate(JSON.parse(' + JSON.stringify(JSON.stringify(raw === true ? json : raw)) + '))' : 'nil'})
    ${body}`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const lint = (j, raw = false) => rb('puts JSON.generate(ValidateSocial::Awareness.check(ctx))', j, raw);
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const ep = (j) => j.social.awarenessEpisode;
const atk = (j) => j.social.awarenessEpisode.attack;

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

// ---- build stage and landingPageId --------------------------------------------------------

const BUILD = ['brief', 'osint', 'build', 'write', 'flip', 'defend', 'debrief'];
function e5() {
  const j = fx('clean_full.json');
  j.social.landingPages = [{ id: 'sso_login', brands: [], targets: { supplier_contact: { linkThreshold: 55 } } }];
  ep(j).stages = clone(BUILD);
  atk(j).landingPageId = 'sso_login';
  return j;
}

test('build stage: osint, build, write; with mfa after write or flip; landingPageId resolves', { skip }, () => {
  assert.deepEqual(lint(e5()), []);
  let j = e5();
  ep(j).mfa = { pushes: [{ at: '06:41', app: 'Auth' }, { at: '06:43', app: 'Auth' }], approvesAt: '06:50' };
  ep(j).stages = ['brief', 'osint', 'build', 'write', 'mfa', 'flip', 'defend', 'debrief'];
  assert.deepEqual(lint(j), []);
  ep(j).stages = ['brief', 'osint', 'build', 'write', 'flip', 'mfa', 'defend', 'debrief'];
  assert.deepEqual(lint(j), []);
  j = e5();
  ep(j).stages = ['brief', 'osint', 'write', 'build', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages .*'build' straight after 'osint'/);
  j = e5();
  ep(j).stages = ['brief', 'build', 'osint', 'write', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages/);
  j = e5();
  delete atk(j).landingPageId;
  expectIn(lint(j), /stages lists 'build' but attack\.landingPageId is missing/);
  j = e5();
  atk(j).landingPageId = 'ghost';
  expectIn(lint(j), /attack\.landingPageId 'ghost' is not a social\.landingPages id/);
  j = e5();
  j.social.landingPages[0].targets = { someone_else: {} };
  expectIn(lint(j), /no targets entry for attack\.target 'supplier_contact'/);
  j = e5();
  ep(j).stages = ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'];
  const out = lint(j);
  expectIn(out, /^⚠️.*attack\.landingPageId is set but stages has no 'build'/);
  assert.equal(out.length, 1);
  j = fx('clean_defend_only.json');
  ep(j).stages = ['brief', 'build', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'defendOnly' has stages/);
});

// ---- callId ---------------------------------------------------------------------------------

function e3() {
  const j = fx('clean_full.json');
  j.social.pretextNpcs = [{ callId: 'helpdesk_call', character: 'helpdesk', knows: { who: { value: 'gordon_full', grade: 'identity' } } }];
  delete j.social.mailClient;
  const a = atk(j);
  delete a.accountIds;
  delete a.defaultAccount;
  delete a.maxMessages;
  delete a.target;
  a.callId = 'helpdesk_call';
  return j;
}

test('attack.callId: a pretextNpcs callId; no mail account, send cap or target needed', { skip }, () => {
  assert.deepEqual(lint(e3()), []);
  let j = e3();
  atk(j).callId = 'nope';
  expectIn(lint(j), /attack\.callId 'nope' is not a callId in social\.pretextNpcs/);
  j = e3();
  atk(j).accountIds = ['ghost'];
  expectIn(lint(j), /accountIds 'ghost' is not a social\.mailClient\.accounts id/);
  j = e3();
  atk(j).target = 'nobody';
  expectIn(lint(j), /attack\.target 'nobody' is not a social\.phishTargets id/);
  j = e3();
  delete atk(j).scored;
  expectIn(lint(j), /scored is nil; it must be false/);
  // without a callId the mail fields are still required
  j = fx('clean_full.json');
  delete atk(j).accountIds;
  expectIn(lint(j), /attack\.accountIds is empty/);
  delete atk(j).maxMessages;
  expectIn(lint(j), /maxMessages is nil; it must be 1/);
});

test('an unscored attack passes the full-episode lint as it is (E7 script attack needs no relaxation)', { skip }, () => {
  const j = fx('clean_full.json');
  assert.equal(atk(j).scored, false);
  assert.equal(atk(j).maxMessages, 1);
  assert.deepEqual(lint(j), []);
  atk(j).flipAudioClipId = 'vo7_ceo_clone';
  // the lint does not read it; the schema decides (see the schema test)
  assert.deepEqual(lint(j), []);
});

// ---- strings ---------------------------------------------------------------------------------

const STRINGS = {
  flipMissed: 'It did not land.',
  flipPageIntro: 'This is the page you built.',
  flipCallIntro: 'This is the call you made.',
  continue: 'Carry on',
  defendIntro: 'Go through the page requests.',
  conceptPanel: 'Why enable content matters.',
  voicePanel: { heading: 'A voice is not proof', text: 'A voice can be copied.' },
  facilitator: { brief: 'Read it out.', defend: 'Let them work.', check: 'Compare answers in pairs.', pause: 'Stop here.' }
};

test('strings: the new keys are linted for shape', { skip }, () => {
  let j = fx('clean_full.json');
  Object.assign(ep(j).strings, clone(STRINGS));
  assert.deepEqual(lint(j), []);
  j = fx('clean_full.json');
  ep(j).strings.conceptPanel = '  ';
  expectIn(lint(j), /strings\.conceptPanel has no text/);
  j = fx('clean_full.json');
  ep(j).strings.voicePanel = { heading: 'Only a heading' };
  expectIn(lint(j), /strings\.voicePanel has no text/);
  j = fx('clean_full.json');
  ep(j).strings.facilitator = { brief: 'x', gloat: 'y' };
  expectIn(lint(j), /strings\.facilitator\.gloat is not a stage id or 'pause'/);
  j = fx('clean_full.json');
  ep(j).strings.facilitator = 'read it out';
  expectIn(lint(j), /strings\.facilitator must be an object/);
  j = fx('clean_full.json');
  ep(j).facilitated = true;
  ep(j).strings.facilitator = { brief: 'x', pause: 'y' };
  expectIn(lint(j), /strings\.facilitator has no line for stage 'defend'/);
});

// ---- claim labels ----------------------------------------------------------------------------

const call = (id, genuine, claims) => ({
  id,
  genuine,
  callerId: '+44 20 7946 0000',
  transcript: [{ who: 'Caller', text: 'I am locked out, please reset it now.' }],
  claims,
  ...(genuine
    ? { notes: { whyFine: { default: 'The caller took the callback.' } } }
    : { tells: ['vish_callback_pressure'], notes: { perFlagNote: { vish_callback_pressure: 'Would not take a callback.' } } })
});

function defendOnlyCalls() {
  const j = fx('clean_defend_only.json');
  const s = j.social.triageSets[0];
  s.verifyVerdict = true;
  s.channelTells = ['vish_callback_pressure'];
  ep(j).defend.calls = [
    call('c1', false, [{ fact: 'who', value: 'gordon_full', label: 'Gordon Pryce' }]),
    call('c2', true, [{ fact: 'who', value: 'gordon_full', label: 'Gordon Pryce' }])
  ];
  return j;
}

test('claim labels: a defendOnly shell without pretextNpcs needs them and skips callsFrom', { skip }, () => {
  let j = defendOnlyCalls();
  assert.deepEqual(lint(j), []);
  ep(j).defend.callsFrom = 'quayholt_helpdesk_reset';
  assert.deepEqual(lint(j), [], 'callsFrom is not read when there are no pretextNpcs');
  delete ep(j).defend.calls[0].claims[0].label;
  expectIn(lint(j), /calls\[0\] \(c1\)\.claims\[0\]\.label is missing/);
  j = defendOnlyCalls();
  ep(j).defend.calls[0].claims[0].label = '';
  expectIn(lint(j), /claims\[0\]\.label must be a non-empty string/);
  j = defendOnlyCalls();
  delete ep(j).defend.calls[0].claims[0].fact;
  expectIn(lint(j), /claims\[0\]\.fact is missing/);
});

test('claim labels: with pretextNpcs the facts still resolve, and a claim with no label warns', { skip }, () => {
  let j = defendOnlyCalls();
  j.social.pretextNpcs = [{ callId: 'helpdesk_call', character: 'helpdesk', knows: { who: { value: 'gordon_full', grade: 'identity' } } }];
  assert.deepEqual(lint(j), []);
  ep(j).defend.calls[0].claims[0].fact = 'shoe_size';
  expectIn(lint(j), /fact 'shoe_size' is not a knows id/);
  j = defendOnlyCalls();
  j.social.pretextNpcs = [{ callId: 'helpdesk_call', character: 'helpdesk', knows: { who: { value: 'gordon_full', grade: 'identity' } } }];
  delete ep(j).defend.calls[0].claims[0].label;
  let out = lint(j);
  expectIn(out, /^⚠️.*claims\[0\]: value 'gordon_full' has no label/);
  assert.equal(out.length, 1);
  j.social.intelFacts = { staff: { provides: [{ about: 'who', value: 'gordon_full', label: 'Gordon Pryce' }] } };
  out = lint(j);
  assert.deepEqual(out, [], 'an intelFacts provides label is enough');
});

// ---- state globals -----------------------------------------------------------------------------

test('se_awareness_records may start as [] or {}; the episode state stays {}', { skip }, () => {
  let j = fx('clean_full.json');
  j.globalVariables.se_awareness_records = [];
  assert.deepEqual(lint(j), []);
  j.globalVariables.se_awareness_records = {};
  assert.deepEqual(lint(j), []);
  j.globalVariables.se_awareness_records = ['x'];
  expectIn(lint(j), /global 'se_awareness_records' is declared as \["x"\]/);
  j.globalVariables.se_awareness_records = 'no';
  expectIn(lint(j), /global 'se_awareness_records' is declared as "no"/);
  j = fx('clean_full.json');
  j.globalVariables.episode_e1_stub_state = [];
  expectIn(lint(j), /global 'episode_e1_stub_state' is declared as \[\]; it must be \{\}/);
  j = fx('clean_full.json');
  delete j.globalVariables.se_awareness_records;
  expectIn(lint(j), /'se_awareness_records' is not declared/);
});

// ---- check missions -----------------------------------------------------------------------------

test('check missions: the set stage equals defend.stage, no pairedWith, no redeclared pre export', { skip }, () => {
  assert.deepEqual(lint(fx('clean_check_post.json')), []);
  assert.deepEqual(lint(fx('clean_check_pre.json')), []);
  let j = fx('clean_check_post.json');
  j.social.triageSets[0].stage = 'pre';
  expectIn(lint(j), /has stage "pre" but defend\.stage is "post"/);
  j = fx('clean_check_pre.json');
  j.social.triageSets[0].stage = 'post';
  expectIn(lint(j), /has stage "post" but defend\.stage is "pre"/);
  j = fx('clean_check_post.json');
  delete j.social.triageSets[0].stage;
  assert.deepEqual(lint(j), [], 'a set with no stage takes the check mission stage');

  j = fx('clean_check_pre.json');
  const partner = clone(j.social.triageSets[0]);
  partner.id = 'other_form';
  partner.pairedWith = j.social.triageSets[0].id;
  j.social.triageSets.push(partner);
  j.social.triageSets[0].pairedWith = 'other_form';
  expectIn(lint(j), /has pairedWith 'other_form', which is in the same game/);

  // a pre name declared as well as imported, seen through the raw (unmerged) declaration
  j = fx('clean_check_post.json');
  const raw = clone(j);
  raw.globalVariables.triage_pre_percent = 0;
  raw.globalVariables.triage_pre_complete = false;
  const out = lint(j, raw);
  expectIn(out, /declares 'triage_pre_percent' in globalVariables and also imports it/);
  expectIn(out, /declares 'triage_pre_complete' in globalVariables and also imports it/);
  expectIn(out, /triage_pre_reportRate/, 0);
});

test('check missions: variant is optional in the schema and in the lint', { skip }, () => {
  const j = fx('clean_check_post.json');
  assert.equal(ep(j).variant, 'full');
  delete ep(j).variant;
  assert.deepEqual(lint(j), []);
  const f = fx('clean_full.json');
  delete ep(f).variant;
  expectIn(lint(f), /variant is missing/);
});

test('a kiosk-launched check set runs as post (the set itself omits stage)', { skip }, () => {
  const ask = (j) => rb(`set = json['social']['triageSets'][0]
    puts JSON.generate(ValidateSocial::Triage.runs_as_post?(ctx, set))`, j);
  let j = fx('clean_check_post.json');
  delete j.social.triageSets[0].stage;
  assert.equal(ask(j), true);
  j = fx('clean_check_pre.json');
  delete j.social.triageSets[0].stage;
  assert.equal(ask(j), false);
  j = fx('clean_full.json');
  assert.equal(ask(j), false);
});

// ---- triage: enable_content_prompt ----------------------------------------------------------------

test('enable_content_prompt is a channel tell', { skip }, () => {
  const j = fx('clean_full.json');
  const out = rb(`issues = []
    set = { 'channelTells' => ['enable_content_prompt'] }
    universe = ValidateSocial::Triage.flag_universe(set, 'set', issues)
    puts JSON.generate({ issues: issues, universe: universe })`, j);
  assert.deepEqual(out.issues, []);
  assert.ok(out.universe.includes('enable_content_prompt'));
});

// ---- carry-over name lint --------------------------------------------------------------------------

test('carry-over: triage result globals and the pre baseline names are exempt from lower_snake_case', { skip }, () => {
  const ask = (j, name) => rb(`puts JSON.generate(carry_over_triage_result_name?(json, ${JSON.stringify(name)}))`, j);
  const j = fx('clean_check_post.json');
  for (const n of ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_complete', 'triage_post_reportRate', 'triage_pre_pass']) {
    assert.equal(ask(j, n), true, n);
  }
  for (const n of ['Bad-Name', 'triage_pre_reportRates', 'm06_Assets', 'something_else']) {
    assert.equal(ask(j, n), false, n);
  }
  // the fixed baseline names are exempt even in a mission with no triage set
  const bare = fx('clean_full.json');
  delete bare.social;
  assert.equal(ask(bare, 'triage_pre_reportRate'), true);
  assert.equal(ask(bare, 'triage_post_reportRate'), false);
  // a literal prefix without {stage}, and comparison.prePrefix
  const lit = fx('clean_check_post.json');
  lit.social.triageSets[0].outcome.setGlobalPrefix = 'baseline_';
  lit.social.triageSets[0].comparison = { prePrefix: 'earlier_' };
  assert.equal(ask(lit, 'baseline_reportRate'), true);
  assert.equal(ask(lit, 'earlier_reportRate'), true);
});

test('carry-over: check_carry_over no longer rejects triage_pre_reportRate, still rejects other camelCase names', { skip }, () => {
  const j = fx('clean_check_post.json');
  const out = rb(`own = json['globalVariables'].reject { |k, _| json['importGlobals'].any? { |e| e['as'] == k } }
    imports = prepare_carry_over_globals(json)
    issues = check_carry_over(json, '.', 'check_post', File.join('${root}', 'test/js/fixtures/carry_over/scenarios'), imports, own)
    puts JSON.generate(issues.grep(/lower_snake_case/))`, j);
  assert.deepEqual(out, []);
  j.importGlobals.push({ from: 'check_pre', var: 'someOtherName', as: 'someOtherName', default: 0 });
  const out2 = rb(`own = json['globalVariables'].reject { |k, _| json['importGlobals'].any? { |e| e['as'] == k } }
    imports = prepare_carry_over_globals(json)
    issues = check_carry_over(json, '.', 'check_post', File.join('${root}', 'test/js/fixtures/carry_over/scenarios'), imports, own)
    puts JSON.generate(issues.grep(/lower_snake_case/))`, j);
  assert.equal(out2.length, 1);
  assert.match(out2[0], /'someOtherName'/);
});

// ---- schema ---------------------------------------------------------------------------------------

test('schema: the new stage, attack and strings keys are accepted; bad shapes fail under #/social', { skip }, () => {
  const good = e5();
  Object.assign(ep(good).strings, clone(STRINGS));
  const goodCall = e3();
  goodCall.social.awarenessEpisode.defend.calls = [call('c1', false, [{ fact: 'who', value: 'gordon_full', label: 'Gordon' }])];
  const check = fx('clean_check_post.json');
  delete ep(check).variant;
  const bads = [
    ['an unknown attack key', (j) => { atk(j).landingPage = 'x'; }, /landingPage/],
    ['a numeric landingPageId', (j) => { atk(j).landingPageId = 5; }, /landingPageId/],
    ['a numeric callId', (j) => { atk(j).callId = 5; }, /callId/],
    ['a stage outside the list', (j) => { ep(j).stages.push('gloat'); }, /gloat|stages/],
    ['a numeric flipMissed', (j) => { ep(j).strings.flipMissed = 1; }, /flipMissed/],
    ['a bad facilitator key', (j) => { ep(j).strings.facilitator = { gloat: 'x' }; }, /gloat/],
    ['a numeric facilitator line', (j) => { ep(j).strings.facilitator = { brief: 3 }; }, /brief/],
    ['a voicePanel without text', (j) => { ep(j).strings.voicePanel = { heading: 'x' }; }, /text|voicePanel/],
    ['a numeric conceptPanel', (j) => { ep(j).strings.conceptPanel = 4; }, /conceptPanel/],
    ['a numeric defendIntro', (j) => { ep(j).strings.defendIntro = 4; }, /defendIntro/]
  ].map(([name, mut, re]) => { const j = clone(good); mut(j); return [name, j, re]; });
  const badClaim = clone(goodCall);
  badClaim.social.awarenessEpisode.defend.calls[0].claims[0].label = 7;
  bads.push(['a numeric claim label', badClaim, /label/]);
  const results = schemaRun([good, goodCall, check, ...bads.map((b) => b[1])]);
  assert.deepEqual(results[0], { social: [], other: [] });
  assert.deepEqual(results[1].social, []);
  assert.deepEqual(results[2].social, []);
  bads.forEach(([name, , re], i) => {
    const { social } = results[i + 3];
    assert.ok(social.some((e) => re.test(e)), `${name}: no matching error\n${social.join('\n')}`);
  });
});

// ---- the CLI on shipped shells -------------------------------------------------------------------

function cli(scenario) {
  const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(root, 'scenarios', scenario, 'scenario.json.erb'),
    '--strict-social', '--no-graph', '--skip-ink', '--no-lint'], { encoding: 'utf8', env });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('CLI: a post check shell no longer trips the carry-over name lint, and the episode fixture is clean', { skip }, () => {
  const post = cli('awareness_post_general_v2_ab');
  assert.equal(post.status, 0, post.out);
  assert.equal(hits(post.out.split('\n'), /imported name 'triage_pre_reportRate' must be lower_snake_case/), 0, post.out);
  const fixture = cli('test_social_episode');
  assert.equal(fixture.status, 0, fixture.out);
});

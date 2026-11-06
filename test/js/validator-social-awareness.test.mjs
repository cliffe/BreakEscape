// scripts/validate_social/awareness.rb (P7-D): the awarenessEpisode shell lints, the schema entry for
// social.awarenessEpisode and the kiosk's { episodeId }. One failing case per lint, built by mutating
// the clean fixtures in test/js/fixtures/social_awareness/; the CLI run on scenarios/test_social_episode.
// Run with: bundle exec node --test test/js/validator-social-awareness.test.mjs
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

function lint(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: json['importGlobals'])
    puts JSON.generate(ValidateSocial::Awareness.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const clone = (o) => JSON.parse(JSON.stringify(o));
const ep = (j) => j.social.awarenessEpisode;
const kiosk = (j) => j.rooms.ep_room.objects[0];
const aim = (j) => j.objectives[0];
const host = (j) => j.rooms.ep_room.npcs[0];
const set = (j) => j.social.triageSets[0];

test('the four clean shells give no issues', { skip }, () => {
  for (const n of ['clean_full.json', 'clean_defend_only.json', 'clean_check_pre.json', 'clean_check_post.json']) {
    assert.deepEqual(lint(fx(n)), [], n);
  }
});

test('a scenario without an awarenessEpisode or a kiosk is untouched; a stray kiosk is an error', { skip }, () => {
  const j = fx('clean_full.json');
  delete j.social.awarenessEpisode;
  expectIn(lint(j), /kiosk but social\.awarenessEpisode is missing/);
  kiosk(j).type = 'mail_terminal';
  assert.deepEqual(lint(j), []);
});

test('kiosk: exactly one, with the episode id', { skip }, () => {
  let j = fx('clean_full.json');
  j.rooms.ep_room.objects = [];
  expectIn(lint(j), /no kiosk object/);
  j = fx('clean_full.json');
  j.rooms.ep_room.objects.push({ ...clone(kiosk(j)), id: 'second' });
  expectIn(lint(j), /2 kiosk objects/);
  j = fx('clean_full.json');
  kiosk(j).minigameData.episodeId = 'other';
  expectIn(lint(j), /episodeId is "other" but social\.awarenessEpisode\.id is 'e1_stub'/);
  j = fx('clean_full.json');
  delete kiosk(j).minigameData;
  expectIn(lint(j), /episodeId is nil/);
});

test('stages: valid ids, in the order of the variant, ["check"] on a check', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).stages = ['brief', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'full' has stages/);
  j = fx('clean_full.json');
  ep(j).stages = ['brief', 'osint', 'write', 'flip', 'defend', 'gloat'];
  expectIn(lint(j), /'gloat', which is not one of/);
  j = fx('clean_defend_only.json');
  ep(j).stages = ['brief', 'osint', 'defend', 'debrief'];
  expectIn(lint(j), /variant 'defendOnly' has stages/);
  j = fx('clean_check_pre.json');
  ep(j).stages = ['check', 'debrief'];
  expectIn(lint(j), /must be \["check"\]/);
  j = fx('clean_full.json');
  ep(j).variant = 'sideways';
  expectIn(lint(j), /variant 'sideways' must be full, defendOnly or brief/);
});

test('ids: _defend on defendOnly, and only there', { skip }, () => {
  let j = fx('clean_defend_only.json');
  const old = ep(j).id;
  ep(j).id = 'e1_stub';
  kiosk(j).minigameData.episodeId = 'e1_stub';
  expectIn(lint(j), /must end in '_defend'/);
  assert.ok(old.endsWith('_defend'));
  j = fx('clean_full.json');
  ep(j).id = 'e1_stub_defend';
  kiosk(j).minigameData.episodeId = 'e1_stub_defend';
  expectIn(lint(j), /ends in '_defend', which is the defendOnly suffix/);
});

test('attack: target, sites, accounts resolve; one send; unscored; reply delay 5 to 8', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).attack.target = 'nobody';
  expectIn(lint(j), /attack\.target 'nobody' is not a social\.phishTargets id/);
  j = fx('clean_full.json');
  ep(j).attack.siteIds = ['supplier_site', 'ghost_site'];
  expectIn(lint(j), /siteIds 'ghost_site' is not a social\.osint\.sites id/);
  j = fx('clean_full.json');
  ep(j).attack.accountIds = ['analyst', 'ghost'];
  expectIn(lint(j), /accountIds 'ghost' is not a social\.mailClient\.accounts id/);
  j = fx('clean_full.json');
  ep(j).attack.defaultAccount = 'ghost';
  expectIn(lint(j), /defaultAccount 'ghost' is not in attack\.accountIds/);
  j = fx('clean_full.json');
  ep(j).attack.maxMessages = 2;
  expectIn(lint(j), /maxMessages is 2; it must be 1/);
  j = fx('clean_full.json');
  delete ep(j).attack.scored;
  expectIn(lint(j), /scored is nil; it must be false/);
  for (const d of [4, 9, undefined]) {
    j = fx('clean_full.json');
    if (d === undefined) delete j.social.phishTargets[0].emailReplyDelay; else j.social.phishTargets[0].emailReplyDelay = d;
    const out = lint(j);
    expectIn(out, /^⚠️ SOCIAL: awarenessEpisode: target 'supplier_contact' emailReplyDelay/);
    assert.equal(out.length, 1);
  }
  j = fx('clean_full.json');
  delete ep(j).attack;
  expectIn(lint(j), /a full episode needs an attack block/);
});

test('a defendOnly shell never reads the attack block', { skip }, () => {
  const j = fx('clean_defend_only.json');
  ep(j).attack = { target: 'nobody', maxMessages: 9 };
  assert.deepEqual(lint(j), []);
});

test('defend set: resolves, awareness profile, passPercent 0, prefix, message count', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).defend.setId = 'nope';
  expectIn(lint(j), /defend\.setId 'nope' is not a social\.triageSets id/);
  j = fx('clean_full.json');
  set(j).scoringProfile = 'analyst';
  expectIn(lint(j), /scoringProfile 'analyst'/);
  j = fx('clean_full.json');
  set(j).outcome.passPercent = 60;
  expectIn(lint(j), /passPercent 60; it must be 0/);
  j = fx('clean_full.json');
  set(j).outcome.setGlobalPrefix = 'e1_';
  expectIn(lint(j), /setGlobalPrefix is "e1_"; it must be 'episode_e1_stub_defend_'/);
  j = fx('clean_full.json');
  set(j).messages = set(j).messages.slice(0, 3);
  expectIn(lint(j), /has 3 message\(s\); an episode's defend set has 4 to 8/);
  j = fx('clean_full.json');
  set(j).messages = [...set(j).messages, ...set(j).messages.map((m) => ({ ...m, id: `${m.id}_b` }))];
  expectIn(lint(j), /has 10 message\(s\); an episode's defend set has 4 to 8/);
  j = fx('clean_check_pre.json');
  set(j).messages = set(j).messages.slice(0, 9);
  expectIn(lint(j), /has 9 message\(s\); a check form has 10/);
});

test('conclusion: one aim, concludeRequires on the done global, a host mapping', { skip }, () => {
  let j = fx('clean_full.json');
  delete aim(j).missionConclusion;
  expectIn(lint(j), /no aim has missionConclusion/);
  j = fx('clean_full.json');
  j.objectives.push({ ...clone(aim(j)), aimId: 'second', tasks: [] });
  expectIn(lint(j), /2 aims have missionConclusion/);
  j = fx('clean_full.json');
  delete aim(j).concludeRequires;
  expectIn(lint(j), /concludeRequires\.globals nil must list 'episode_e1_stub_defend_complete'/);
  j = fx('clean_full.json');
  aim(j).concludeRequires.globals = ['something_else'];
  expectIn(lint(j), /must list 'episode_e1_stub_defend_complete'/);
  j = fx('clean_full.json');
  host(j).eventMappings = [];
  expectIn(lint(j), /no NPC has an eventMappings entry for 'global_variable_changed:episode_e1_stub_defend_complete'/);
  j = fx('clean_full.json');
  host(j).eventMappings[0].completeTask = 'another_task';
  expectIn(lint(j), /no NPC has an eventMappings entry/);
  j = fx('clean_full.json');
  delete ep(j).conclusionTaskId;
  expectIn(lint(j), /conclusionTaskId is missing/);
  j = fx('clean_full.json');
  ep(j).conclusionTaskId = 'elsewhere';
  expectIn(lint(j), /conclusionTaskId 'elsewhere' is not a task of the conclusion aim/);
  j = fx('clean_full.json');
  delete j.globalVariables.episode_e1_stub_defend_complete;
  expectIn(lint(j), /done global 'episode_e1_stub_defend_complete' is not declared/);
});

test('state and records globals are declared as {}', { skip }, () => {
  let j = fx('clean_full.json');
  delete j.globalVariables.episode_e1_stub_state;
  expectIn(lint(j), /global 'episode_e1_stub_state' is not declared/);
  j = fx('clean_full.json');
  j.globalVariables.se_awareness_records = '';
  expectIn(lint(j), /global 'se_awareness_records' is declared as ""/);
  j = fx('clean_full.json');
  j.globalVariables.episode_e1_stub_state = { v: 1 };
  expectIn(lint(j), /declared as \{"v"=>1\}/);
});

test('check missions: the pre exports, the post imports with as and completed', { skip }, () => {
  let j = fx('clean_check_pre.json');
  j.exportGlobals = ['triage_pre_percent'];
  expectIn(lint(j), /does not list 'triage_pre_reportRate' in exportGlobals/);
  expectIn(lint(j), /does not list 'triage_pre_complete' in exportGlobals/);
  j = fx('clean_check_post.json');
  j.importGlobals[0].as = 'baseline_percent';
  expectIn(lint(j), /import of 'triage_pre_percent' has as: "baseline_percent"/);
  j = fx('clean_check_post.json');
  delete j.importGlobals[1].as;
  expectIn(lint(j), /import of 'triage_pre_reportRate' has as: nil/);
  j = fx('clean_check_post.json');
  j.importGlobals = j.importGlobals.filter((e) => e.var !== 'triage_pre_complete');
  expectIn(lint(j), /does not import 'triage_pre_complete'/);
  j = fx('clean_check_post.json');
  j.importGlobals = j.importGlobals.filter((e) => !e.completed);
  expectIn(lint(j), /no import with completed: "pre_check_completed"/);
  j = fx('clean_check_post.json');
  j.importGlobals[3].completed = 'pre_done';
  expectIn(lint(j), /no import with completed: "pre_check_completed"/);
  j = fx('clean_check_post.json');
  j.importGlobals[3].from = 'another_mission';
  expectIn(lint(j), /imports from more than one mission/);
  j = fx('clean_check_post.json');
  delete j.importGlobals[0].from;
  expectIn(lint(j), /import of 'triage_pre_percent' has no from/);
  j = fx('clean_check_pre.json');
  ep(j).defend.stage = 'sideways';
  expectIn(lint(j), /names its stage, pre or post/);
});

test('result globals: a missing percent or reportRate is a warning, naming the global', { skip }, () => {
  for (const g of ['percent', 'reportRate']) {
    const j = fx('clean_full.json');
    delete j.globalVariables[`episode_e1_stub_defend_${g}`];
    const out = lint(j);
    expectIn(out, new RegExp(`⚠️.*result global 'episode_e1_stub_defend_${g}' is not declared`));
    assert.equal(hits(out, /❌/), 0, out.join('\n'));
  }
});

test('full episode: a missing playerSentAuth row for the attack account is a warning naming it', { skip }, () => {
  let j = fx('clean_full.json');
  delete set(j).playerSentAuth.accounts.analyst;
  expectIn(lint(j), /⚠️.*no playerSentAuth\.accounts\.analyst row/);
  j = fx('clean_full.json');
  delete set(j).playerSentAuth;
  expectIn(lint(j), /⚠️.*no playerSentAuth\.accounts\.analyst row/);
  // A defendOnly episode never sends, so it needs no row.
  assert.deepEqual(lint(fx('clean_defend_only.json')), []);
});

test('strings.brief: empty or blank is an error; absent is left alone', { skip }, () => {
  for (const v of ['', '   ', null]) {
    const j = fx('clean_full.json');
    ep(j).strings.brief = v;
    expectIn(lint(j), /❌.*strings\.brief is empty/);
  }
  const j = fx('clean_full.json');
  delete ep(j).strings.brief;
  assert.deepEqual(lint(j), []);
});

// aw2: strings.flipDefenderLineByChoice is keyed by the pretext the learner chose. A key that is not
// a template id, or a template that is not a pretext, would never be shown (warn); an empty value is
// an error; pretext keys with text are clean.
test('strings.flipDefenderLineByChoice: pretext keys clean, others warn, empty errors', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).strings.flipDefenderLineByChoice = { pretext_invoice: 'The invoice branch.', pretext_account: 'The account branch.' };
  assert.deepEqual(lint(j), [], 'two real pretext keys with text are clean');

  j = fx('clean_full.json');
  ep(j).strings.flipDefenderLineByChoice = { not_a_template: 'x' };
  expectIn(lint(j), /⚠️.*flipDefenderLineByChoice\.not_a_template is not a social\.templates id/);

  j = fx('clean_full.json');
  ep(j).strings.flipDefenderLineByChoice = { ask_confirm: 'x' };
  expectIn(lint(j), /⚠️.*flipDefenderLineByChoice\.ask_confirm is the template 'ask_confirm', which is not a 'pretext'/);

  j = fx('clean_full.json');
  ep(j).strings.flipDefenderLineByChoice = { pretext_invoice: '  ' };
  expectIn(lint(j), /❌.*flipDefenderLineByChoice\.pretext_invoice has no text/);

  j = fx('clean_full.json');
  ep(j).strings.flipDefenderLineByChoice = 'not an object';
  expectIn(lint(j), /❌.*flipDefenderLineByChoice must be an object/);
});

// aw-ux2: strings.teamLine ({n}, optional {team}) is a non-empty string; a line with no {n} warns.
test('strings.teamLine: a good line is clean, empty errors, no {n} warns', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).strings.teamLine = 'Your reports kept {n} items from the {team} people on your team.';
  assert.deepEqual(lint(j), []);

  j = fx('clean_full.json');
  ep(j).strings.teamLine = '  ';
  expectIn(lint(j), /❌.*strings\.teamLine must be a non-empty string/);

  j = fx('clean_full.json');
  ep(j).strings.teamLine = 'Thanks for reporting.';
  expectIn(lint(j), /⚠️.*strings\.teamLine has no \{n\}/);
});

test('set.labels.teamBadge: a good badge is clean, empty errors, no {n} warns', { skip }, () => {
  const labelIssues = (labels) => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
      puts JSON.generate(ValidateSocial::Triage.label_checks(JSON.parse(${JSON.stringify(JSON.stringify({ labels }))}), 'set'))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
  };
  assert.deepEqual(labelIssues({ teamBadge: 'Reports made for the team: {n}', teamBadgeTitle: 'Items you reported' }), []);
  expectIn(labelIssues({ teamBadge: ' ' }), /❌.*labels\.teamBadge must be a non-empty string/);
  expectIn(labelIssues({ teamBadge: 'Reports made' }), /⚠️.*labels\.teamBadge has no \{n\}/);
});

test('the real validator: schema passes on test_social_episode; the only social error is the missing kiosk sprite', { skip }, () => {
  const r = spawnSync('ruby', ['scripts/validate_scenario.rb', 'scenarios/test_social_episode/scenario.json.erb',
    '--no-graph', '--skip-ink', '--strict-social'], { cwd: root, encoding: 'utf8', env });
  assert.match(r.stdout, /Schema validation passed/);
  const errors = r.stdout.split('\n').filter((l) => /❌ SOCIAL/.test(l));
  const other = errors.filter((l) => !/assets\/objects\/kiosk\.png does not exist/.test(l));
  assert.deepEqual(other, []);
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

test('schema: the clean shells pass; typos, a bad stage id and a bad variant fail under #/social', { skip }, () => {
  const cases = [
    ['a mistyped key', (e) => { e.stagez = []; }, 'stagez'],
    ['a mistyped attack key', (e) => { e.attack.maxMessage = 1; }, 'maxMessage'],
    ['a mistyped defend key', (e) => { e.defend.setID = 'x'; }, 'setID'],
    ['a mistyped strings key', (e) => { e.strings.flipHeadin = 'x'; }, 'flipHeadin'],
    ['a mistyped brand key', (e) => { e.brand.logo = 'x'; }, 'logo'],
    ['an unknown stage id', (e) => { e.stages.push('mfa2'); }, 'mfa2'],
    ['a bad variant', (e) => { e.variant = 'half'; }, 'half'],
    ['a bad defend.stage', (e) => { e.defend.stage = 'during'; }, 'during'],
    ['maxMessages as a string', (e) => { e.attack.maxMessages = 'one'; }, 'integer'],
    ['no id', (e) => { delete e.id; }, 'id']
  ];
  const scenarios = [fx('clean_full.json'), fx('clean_check_pre.json'), ...cases.map(([, mutate]) => {
    const j = fx('clean_full.json');
    mutate(j.social.awarenessEpisode);
    return j;
  })];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  assert.deepEqual(results[1], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 2];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('#/social/awarenessEpisode') && e.includes(detail)),
      `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

test('the kiosk entry in minigame-data-schemas.json needs episodeId and nothing else', () => {
  const s = JSON.parse(readFileSync(join(root, 'scripts/minigame-data-schemas.json'), 'utf8'));
  assert.deepEqual(s.kiosk, { required: ['episodeId'], optional: [] });
});

test('social.awareness (aw1, aw4, aw6): clean settings pass; blanks warn, a bad teamSize errors', { skip }, () => {
  let j = fx('clean_full.json');
  j.social.awareness = { reportRoute: 'Use the Report button.', ruleOfThumb: { heading: 'Habit', text: 'Stop. Check. Report.' }, teamSize: 12 };
  assert.deepEqual(lint(j), []);
  j = fx('clean_full.json');
  j.social.awareness = { reportRoute: '  ', ruleOfThumb: { text: '' }, teamSize: 1 };
  const out = lint(j);
  expectIn(out, /social\.awareness\.reportRoute has no text; the generic/);
  expectIn(out, /social\.awareness\.ruleOfThumb has no text; nothing is shown/);
  expectIn(out, /social\.awareness\.teamSize is 1/);
  j = fx('clean_full.json');
  j.social.awareness = { reportRoute: 'x'.repeat(700) };
  expectIn(lint(j), /reportRoute is 700 characters/);
  j = fx('clean_full.json');
  j.social.awareness = 'nope';
  expectIn(lint(j), /social\.awareness must be an object/);
  j = fx('clean_full.json');
  ep(j).debrief = { mondayCard: 'slot:something_else' };
  expectIn(lint(j), /only 'slot:customer_report_route' is read/);
});

// ENG-09b: strings.conceptPanel may be an array of { heading?, text }.
test('conceptPanel: an array needs text in every entry; the string and object forms are unchanged', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).strings.conceptPanel = [{ heading: 'One', text: 'First.' }, { text: 'Second.' }];
  assert.deepEqual(lint(j), []);
  j = fx('clean_full.json');
  ep(j).strings.conceptPanel = [{ heading: 'One', text: 'First.' }, { heading: 'Two', text: '  ' }, { heading: 'Three' }];
  const out = lint(j);
  expectIn(out, /strings\.conceptPanel entry 2 has no text/);
  expectIn(out, /strings\.conceptPanel entry 3 has no text/);
  expectIn(out, /strings\.conceptPanel entry 1 has no text/, 0);
  j = fx('clean_full.json');
  ep(j).strings.conceptPanel = [];
  expectIn(lint(j), /strings\.conceptPanel is an empty list/);
  j = fx('clean_full.json');
  ep(j).strings.conceptPanel = { text: '' };
  expectIn(lint(j), /strings\.conceptPanel has no text/);
  // voicePanel stays single-panel
  j = fx('clean_full.json');
  ep(j).strings.voicePanel = [{ text: 'x' }];
  expectIn(lint(j), /strings\.voicePanel has no text/);
});

// ENG-01: flipAftermath and stepLabels.
const aftermathBlock = () => ({
  heading: 'Now you are Kieran', victimName: 'Kieran', intro: 'His account a few minutes later.',
  items: [
    { id: 'fa_sent', kind: 'email', folder: 'sent', to: 'finance@fixture.example', subject: 'Invoice', time: '15:08', note: 'He did not write this.' },
    { id: 'fa_push', kind: 'push', push: { app: 'Authenticator', account: 'k@fixture.example' } }
  ],
  line: 'Most of the damage happens between noticing and reporting.'
});

test('flipAftermath and stepLabels: a clean block passes; each lint fires on its own', { skip }, () => {
  let j = fx('clean_full.json');
  ep(j).flipAftermath = aftermathBlock();
  ep(j).stepLabels = { flip: 'The click' };
  assert.deepEqual(lint(j), []);
  const bad = (mutate, re) => {
    const k = fx('clean_full.json');
    ep(k).flipAftermath = aftermathBlock();
    mutate(ep(k).flipAftermath);
    expectIn(lint(k), re);
  };
  bad((b) => { b.items = []; }, /flipAftermath\.items must be a non-empty list/);
  bad((b) => { b.items[0].id = ''; }, /items\[0\]\.id is empty or missing/);
  bad((b) => { b.items[1].id = 'fa_sent'; }, /items\[1\]\.id 'fa_sent' repeats/);
  bad((b) => { b.items[0].kind = 'fax'; }, /items\[0\]\.kind is "fax"/);
  bad((b) => { delete b.items[0].to; delete b.items[0].subject; }, /an email row needs a to or a subject/);
  bad((b) => { delete b.items[1].push.app; }, /items\[1\]\.push\.app is missing/);
  j = fx('clean_full.json');
  ep(j).stepLabels = { flop: 'x', defend: ' ' };
  const out = lint(j);
  expectIn(out, /stepLabels\.flop is not a stage id/);
  expectIn(out, /stepLabels\.defend is empty/);
  // a defend-only shell never runs the flip
  j = fx('clean_defend_only.json');
  ep(j).flipAftermath = aftermathBlock();
  expectIn(lint(j), /flipAftermath is set but this episode runs no flip stage/);
});

test('schema: flipAftermath, stepLabels and a conceptPanel array pass; typos fail', { skip }, () => {
  const ok = fx('clean_full.json');
  ep(ok).flipAftermath = aftermathBlock();
  ep(ok).stepLabels = { flip: 'The click' };
  ep(ok).strings.conceptPanel = [{ heading: 'One', text: 'First.' }, { text: 'Second.' }];
  const typo = fx('clean_full.json');
  ep(typo).flipAftermath = { ...aftermathBlock(), headin: 'x' };
  const noKind = fx('clean_full.json');
  ep(noKind).flipAftermath = aftermathBlock();
  delete ep(noKind).flipAftermath.items[0].kind;
  const noText = fx('clean_full.json');
  ep(noText).strings.conceptPanel = [{ heading: 'No text' }];
  const labels = fx('clean_full.json');
  ep(labels).stepLabels = { flip: 3 };
  const [r0, r1, r2, r3, r4] = schemaRun([ok, typo, noKind, noText, labels]);
  assert.deepEqual(r0, { social: [], other: [] });
  assert.ok(r1.social.some((e) => e.includes('headin')), r1.social.join('\n'));
  assert.ok(r2.social.some((e) => e.includes('kind')), r2.social.join('\n'));
  assert.ok(r3.social.length > 0, 'an array entry without text fails the schema');
  assert.ok(r4.social.length > 0, 'a non-string step label fails the schema');
});

test('standalone: false skips the conclusion, host NPC and conclusionTaskId checks only', { skip }, () => {
  const j = fx('clean_full.json');
  aim(j).missionConclusion = false;
  delete ep(j).conclusionTaskId;
  expectIn(lint(j), /no aim has missionConclusion/);
  expectIn(lint(j), /conclusionTaskId is missing/);
  ep(j).standalone = false;
  assert.deepEqual(lint(j), []);
  // the done global still has to be declared
  delete j.globalVariables.episode_e1_stub_defend_complete;
  expectIn(lint(j), /done global .* is not declared/);
});

// ── ENG-11: the sort drill (awarenessEpisode.sortDrill) ───────────────────────────
const drill = () => ({
  bins: [{ id: 'yes', label: 'Allowed' }, { id: 'no', label: 'Not allowed' }, { id: 'ask', label: 'Ask first' }],
  scored: true, answerKeyProfile: 'house_rules', alwaysScoresBin: 'ask',
  cards: [
    { id: 'S1', situation: 'Stream the match at lunch', answer: 'yes', reason: 'Own time is fine.' },
    { id: 'S2', situation: 'Lend your badge', answer: 'no', reason: 'It is yours alone.', locked: true },
    { id: 'S3', situation: 'Install a free tool', answer: 'ask', reason: 'Check it first.', confirmed: false, new: true }
  ],
  drawRules: { oneOfEachAnswer: true, newFirst: true }, drawCount: 3
});
const withDrill = (mutate) => {
  const j = fx('clean_defend_only.json');
  ep(j).sortDrill = drill();
  if (mutate) mutate(ep(j).sortDrill, j);
  return j;
};

test('sortDrill: a clean scored drill and a clean unscored one raise nothing; absent is left alone', { skip }, () => {
  assert.deepEqual(lint(withDrill()), []);
  const unscored = withDrill((d) => { d.scored = false; delete d.answerKeyProfile; delete d.alwaysScoresBin; });
  assert.deepEqual(lint(unscored), []);
  assert.deepEqual(lint(fx('clean_defend_only.json')), []);
});

test('sortDrill: two to four bins with unique ids', { skip }, () => {
  expectIn(lint(withDrill((d) => { d.bins = [d.bins[0]]; })), /bins must hold 2 to 4 bins/);
  expectIn(lint(withDrill((d) => { d.bins.push({ id: 'a', label: 'A' }, { id: 'b', label: 'B' }); })), /bins must hold 2 to 4 bins/);
  expectIn(lint(withDrill((d) => { d.bins[1].id = 'yes'; })), /id 'yes' is used more than once/);
  expectIn(lint(withDrill((d) => { d.bins[0].label = ''; })), /bins\[0\] needs a non-empty id and label/);
});

test('sortDrill: every card answer names a real bin, with a situation and a reason', { skip }, () => {
  expectIn(lint(withDrill((d) => { d.cards[0].answer = 'maybe'; })), /answer 'maybe' is not one of the bins/);
  expectIn(lint(withDrill((d) => { d.cards[0].answer = ['yes', 'ghost']; })), /answer 'ghost' is not one of the bins/);
  expectIn(lint(withDrill((d) => { delete d.cards[0].answer; })), /answer is missing/);
  expectIn(lint(withDrill((d) => { d.cards[0].reason = ''; })), /reason is empty or missing/);
  expectIn(lint(withDrill((d) => { d.cards[0].situation = ' '; })), /situation is empty or missing/);
  expectIn(lint(withDrill((d) => { d.cards[1].id = 'S1'; })), /id 'S1' is used more than once/);
  assert.deepEqual(lint(withDrill((d) => { d.cards[0].answer = ['yes', 'ask']; })), [], 'a list of accepted bins is fine');
});

test('sortDrill: a scored drill names its answer key; alwaysScoresBin names a bin', { skip }, () => {
  expectIn(lint(withDrill((d) => { delete d.answerKeyProfile; })), /scored but names no answerKeyProfile/);
  expectIn(lint(withDrill((d) => { d.alwaysScoresBin = 'maybe'; })), /alwaysScoresBin 'maybe' is not one of the bins/);
  expectIn(lint(withDrill((d) => { d.scored = false; })), /answerKeyProfile is set on an unscored drill/);
  expectIn(lint(withDrill((d) => { d.scored = 'yes'; })), /scored must be true or false/);
});

test('sortDrill: acceptable bins (drill-level and per-card) name real bins and are read only when scored (E17-M1)', { skip }, () => {
  // drill-level default applies to every card; a card can switch it off with an empty list
  assert.deepEqual(lint(withDrill((d) => { d.acceptable = ['ask']; })), [], 'a drill-level acceptable bin is fine');
  assert.deepEqual(lint(withDrill((d) => { d.acceptable = ['ask']; d.cards[0].acceptable = []; })), [], 'a card switches the default off with an empty list');
  expectIn(lint(withDrill((d) => { d.acceptable = ['maybe']; })), /sortDrill\.acceptable 'maybe' is not one of the bins/);
  expectIn(lint(withDrill((d) => { d.acceptable = []; })), /sortDrill\.acceptable must be a non-empty array/);
  // per-card list
  assert.deepEqual(lint(withDrill((d) => { d.cards[0].acceptable = ['ask']; })), [], 'a per-card acceptable bin is fine');
  expectIn(lint(withDrill((d) => { d.cards[0].acceptable = ['ask', 'maybe']; })), /acceptable 'maybe' is not one of the bins/);
  expectIn(lint(withDrill((d) => { d.cards[0].acceptable = 'ask'; })), /acceptable must be an array of bin ids/);
  expectIn(lint(withDrill((d) => { d.cards[0].acceptable = ['yes']; })), /acceptable 'yes' is already an answer/);
  expectIn(lint(withDrill((d) => { d.scored = false; delete d.answerKeyProfile; delete d.alwaysScoresBin; d.acceptable = ['ask']; })),
    /acceptable is set on an unscored drill/);
});

test('sortDrill: locked cards keep one answer and stay drawable; something must be drawable', { skip }, () => {
  expectIn(lint(withDrill((d) => { d.cards[1].answer = ['no', 'ask']; })), /locked but has more than one accepted answer/);
  expectIn(lint(withDrill((d) => { d.cards[1].confirmed = false; })), /locked and confirmed: false/);
  expectIn(lint(withDrill((d) => { d.cards[0].confirmed = false; d.cards[1].locked = false; d.cards[1].confirmed = false; })), /no confirmed card to draw/);
});

test('sortDrill: drawCount must hold oneOfEachAnswer', { skip }, () => {
  expectIn(lint(withDrill((d) => { d.drawCount = 2; })), /drawCount 2 is below the 3 bins the cards answer/);
  expectIn(lint(withDrill((d) => { d.drawCount = 0; })), /drawCount must be a whole number/);
});

test('sortDrill: it needs a defend stage to run in, so a check mission cannot carry one', { skip }, () => {
  const j = fx('clean_check_pre.json');
  ep(j).sortDrill = drill();
  expectIn(lint(j), /sortDrill runs inside the defend stage/);
});

test('sortDrill schema: the clean drill passes; a mistyped key, a fifth bin and a bad answer type fail', { skip }, () => {
  const cases = [
    ['a mistyped key', (d) => { d.scoredd = true; }, 'scoredd'],
    ['a mistyped card key', (d) => { d.cards[0].reasn = 'x'; }, 'reasn'],
    ['five bins', (d) => { d.bins.push({ id: 'a', label: 'A' }, { id: 'b', label: 'B' }); }, 'bins'],
    ['one bin', (d) => { d.bins = [d.bins[0]]; }, 'bins'],
    ['a numeric answer', (d) => { d.cards[0].answer = 7; }, 'answer'],
    ['scored as a string', (d) => { d.scored = 'yes'; }, 'scored'],
    ['a missing reason', (d) => { delete d.cards[0].reason; }, 'reason'],
    ['a non-array acceptable', (d) => { d.cards[0].acceptable = 7; }, 'acceptable']
  ];
  const scenarios = [withDrill(), ...cases.map(([, mutate]) => withDrill(mutate))];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 1];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('sortDrill') && e.includes(detail)), `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

// ── ENG-10: the brief-only episode (variant "brief", stages ["brief"]) ──────────────
test('a clean brief-only shell gives no issues and needs no defend set or attack block', { skip }, () => {
  assert.deepEqual(lint(fx('clean_brief_only.json')), []);
});

test('brief: stages must be ["brief"], and defend or attack blocks are refused', { skip }, () => {
  let j = fx('clean_brief_only.json');
  ep(j).stages = ['brief', 'debrief'];
  expectIn(lint(j), /variant 'brief' has stages/);
  j = fx('clean_brief_only.json');
  ep(j).defend = { setId: 'x' };
  expectIn(lint(j), /brief episode has a defend block/);
  j = fx('clean_brief_only.json');
  ep(j).attack = {};
  expectIn(lint(j), /brief episode has a attack block/);
  // a full episode may still not author just ["brief"]
  j = fx('clean_full.json');
  ep(j).stages = ['brief'];
  expectIn(lint(j), /variant 'full' has stages/);
});

test('brief: doneGlobal is required, declared, starts false, and the aim waits on it', { skip }, () => {
  let j = fx('clean_brief_only.json');
  delete ep(j).doneGlobal;
  expectIn(lint(j), /needs doneGlobal/);
  expectIn(lint(j), /oncePerLearner is true but there is no doneGlobal/);
  j = fx('clean_brief_only.json');
  delete j.globalVariables.episode_b1_stub_done;
  expectIn(lint(j), /done global 'episode_b1_stub_done' is not declared/);
  j = fx('clean_brief_only.json');
  j.globalVariables.episode_b1_stub_done = true;
  expectIn(lint(j), /must start false/);
  j = fx('clean_brief_only.json');
  aim(j).concludeRequires.globals = [];
  expectIn(lint(j), /concludeRequires\.globals \[\] must list 'episode_b1_stub_done'/);
  j = fx('clean_brief_only.json');
  host(j).eventMappings = [];
  expectIn(lint(j), /no NPC has an eventMappings entry for 'global_variable_changed:episode_b1_stub_done'/);
  j = fx('clean_brief_only.json');
  ep(j).oncePerLearner = 'yes';
  expectIn(lint(j), /oncePerLearner must be true or false/);
});

test('brief: briefCards is a non-empty array of cards with text; the other lines are non-empty', { skip }, () => {
  let j = fx('clean_brief_only.json');
  ep(j).strings.briefCards = [];
  expectIn(lint(j), /briefCards must be a non-empty array/);
  j = fx('clean_brief_only.json');
  ep(j).strings.briefCards[1].text = '  ';
  expectIn(lint(j), /briefCards\[1\] has no text/);
  j = fx('clean_brief_only.json');
  ep(j).strings.briefCards[0].heading = '';
  expectIn(lint(j), /briefCards\[0\]\.heading is empty/);
  j = fx('clean_brief_only.json');
  ep(j).strings.briefDone = '';
  ep(j).strings.alreadySeen = ' ';
  expectIn(lint(j), /strings\.briefDone is empty/);
  expectIn(lint(j), /strings\.alreadySeen is empty/);
  j = fx('clean_brief_only.json');
  delete ep(j).strings.briefCards;
  expectIn(lint(j), /neither strings\.briefCards nor strings\.brief/);
});

test('a non-brief episode with a doneGlobal must declare it, and still needs a defend block', { skip }, () => {
  let j = fx('clean_defend_only.json');
  ep(j).doneGlobal = 'nope';
  expectIn(lint(j), /doneGlobal 'nope' is not declared/);
  j = fx('clean_defend_only.json');
  delete ep(j).defend;
  expectIn(lint(j), /defend\.setId is missing/);
});

// ── ENG-12: the concern form (awarenessEpisode.concernForm) ───────────────────────
const concern = () => ({
  factChips: [
    { id: 'F1', kind: 'what', label: 'A door was propped open' },
    { id: 'F2', kind: 'when', label: 'Tuesday morning' },
    { id: 'F3', kind: 'who', label: 'I saw the delivery driver' }
  ],
  conclusionChips: [{ id: 'C1', label: 'Someone is up to something' }],
  guidance: 'Tell the site manager.', minFacts: 2
});
const withConcern = (mutate, base = 'clean_defend_only.json') => {
  const j = fx(base);
  ep(j).concernForm = concern();
  if (mutate) mutate(ep(j).concernForm, j);
  return j;
};

test('concernForm: a clean form raises nothing; absent is left alone; it can sit beside a sortDrill', { skip }, () => {
  assert.deepEqual(lint(withConcern()), []);
  assert.deepEqual(lint(withConcern((c) => { delete c.conclusionChips; delete c.guidance; delete c.minFacts; })), []);
  const both = withConcern();
  ep(both).sortDrill = drill();
  assert.deepEqual(lint(both), []);
  assert.deepEqual(lint(fx('clean_defend_only.json')), []);
});

test('concernForm: fact chips need an id, a label, a known kind and a unique id', { skip }, () => {
  expectIn(lint(withConcern((c) => { c.factChips[0].kind = 'why'; })), /factChips\[F1\]\.kind 'why' is not one of what, when, where, who/);
  expectIn(lint(withConcern((c) => { delete c.factChips[0].kind; })), /factChips\[F1\]\.kind '' is not one of/);
  expectIn(lint(withConcern((c) => { c.factChips[1].id = 'F1'; })), /factChips: id 'F1' is used more than once/);
  expectIn(lint(withConcern((c) => { c.factChips[0].label = ' '; })), /factChips\[0\] needs a non-empty id and label/);
  expectIn(lint(withConcern((c) => { c.factChips = []; })), /factChips must be a non-empty array/);
});

test('concernForm: conclusion chips need an id and label, and no id may repeat a fact chip', { skip }, () => {
  expectIn(lint(withConcern((c) => { c.conclusionChips[0].id = 'F2'; })), /conclusionChips: id 'F2' is also used by another chip/);
  expectIn(lint(withConcern((c) => { c.conclusionChips[0].label = ''; })), /conclusionChips\[0\] needs a non-empty id and label/);
  expectIn(lint(withConcern((c) => { c.conclusionChips = 'no'; })), /conclusionChips must be an array/);
});

test('concernForm: minFacts is a whole number the fact chips can reach', { skip }, () => {
  expectIn(lint(withConcern((c) => { c.minFacts = 4; })), /minFacts 4 is more than the 3 fact chips/);
  expectIn(lint(withConcern((c) => { c.minFacts = 0; })), /minFacts must be a whole number/);
});

test('concernForm: it needs a defend stage to run in, so a check mission cannot carry one', { skip }, () => {
  expectIn(lint(withConcern(null, 'clean_check_pre.json')), /concernForm runs inside the defend stage/);
});

test('concernForm schema: the clean form passes; a mistyped key, a bad kind and a missing label fail', { skip }, () => {
  const cases = [
    ['a mistyped key', (c) => { c.guidence = 'x'; }, 'guidence'],
    ['a mistyped chip key', (c) => { c.factChips[0].lable = 'x'; }, 'lable'],
    ['a bad kind', (c) => { c.factChips[0].kind = 'Why Not'; }, 'kind'],
    ['a missing label', (c) => { delete c.factChips[0].label; }, 'label'],
    ['no fact chips', (c) => { delete c.factChips; }, 'factChips'],
    ['minFacts as a string', (c) => { c.minFacts = 'two'; }, 'minFacts'],
    ['a numeric string', (c) => { c.strings = { check: 7 }; }, 'check']
  ];
  const scenarios = [withConcern(), ...cases.map(([, mutate]) => withConcern(mutate))];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 1];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('concernForm') && e.includes(detail)), `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

// ── ENG-13: the privacy-settings panel (awarenessEpisode.privacyPanel) ────────────
const panel = () => ({
  settings: [
    { id: 'p_audience', label: 'Posts: connections only', section: 'Her profile', closesFacts: ['se_intel_p_leave', 'p_badge'] },
    { id: 'p_pet', label: 'Security answer: made up', closesFacts: ['se_intel_p_pet'], default: 'tight', hint: 'A made-up answer.' }
  ],
  note: 'A teaching view.'
});
const withPanel = (mutate) => {
  const j = fx('clean_defend_only.json');
  j.social.intelFacts = {
    p_leave: { subject: 'company', text: 'Away all next week' },
    p_badge: { subject: 'company', text: 'A lanyard in shot' },
    p_pet: { subject: 'company', text: 'The dog is called Biscuit' }
  };
  ep(j).privacyPanel = panel();
  if (mutate) mutate(ep(j).privacyPanel, j);
  return j;
};

test('privacyPanel: a clean panel raises nothing, with or without the se_intel_ prefix; absent is left alone', { skip }, () => {
  assert.deepEqual(lint(withPanel()), []);
  assert.deepEqual(lint(fx('clean_defend_only.json')), []);
});

test('privacyPanel: closesFacts must name declared intelFacts', { skip }, () => {
  expectIn(lint(withPanel((p) => { p.settings[0].closesFacts = ['se_intel_ghost']; })), /closesFacts: 'se_intel_ghost' is not a declared social\.intelFacts id/);
  expectIn(lint(withPanel((p) => { p.settings[0].closesFacts = ['p_ghost', 'p_badge']; })), /'p_ghost' is not a declared/);
  expectIn(lint(withPanel((p) => { p.settings[0].closesFacts = []; })), /closesFacts must be a non-empty array/);
  expectIn(lint(withPanel((p) => { delete p.settings[0].closesFacts; })), /closesFacts must be a non-empty array/);
  expectIn(lint(withPanel((p) => { p.settings[0].closesFacts = [7]; })), /not a fact id/);
  expectIn(lint(withPanel((p, j) => { delete j.social.intelFacts; })), /none are declared/, 3);
});

test('privacyPanel: settings need unique ids, a label and a known default', { skip }, () => {
  expectIn(lint(withPanel((p) => { p.settings = []; })), /settings must be a non-empty array/);
  expectIn(lint(withPanel((p) => { p.settings[1].id = 'p_audience'; })), /id 'p_audience' is used more than once/);
  expectIn(lint(withPanel((p) => { p.settings[0].label = ' '; })), /label is empty or missing/);
  expectIn(lint(withPanel((p) => { p.settings[0].id = ''; })), /needs a non-empty id/);
  expectIn(lint(withPanel((p) => { p.settings[0].default = 'closed'; })), /default "closed" must be 'open' or 'tight'/);
  expectIn(lint(withPanel((p) => { p.settings[0].password = 'x'; })), /looks like a credential field/);
  expectIn(lint(withPanel((p) => { p.settings[0] = 'x'; })), /settings\[0\] must be an object/);
});

test('privacyPanel: it needs a defend stage, so a check mission cannot carry one', { skip }, () => {
  const j = fx('clean_check_pre.json');
  ep(j).privacyPanel = panel();
  expectIn(lint(j), /privacyPanel runs inside the defend stage/);
  const k = withPanel();
  ep(k).privacyPanel = 'nope';
  expectIn(lint(k), /privacyPanel must be an object/);
});

test('privacyPanel schema: the clean panel passes; a mistyped key, a bad default and a missing label fail', { skip }, () => {
  const cases = [
    ['a mistyped key', (p) => { p.settingz = []; }, 'settingz'],
    ['a mistyped setting key', (p) => { p.settings[0].closesFact = ['x']; }, 'closesFact'],
    ['a bad default', (p) => { p.settings[0].default = 'closed'; }, 'default'],
    ['a missing label', (p) => { delete p.settings[0].label; }, 'label'],
    ['closesFacts as a string', (p) => { p.settings[0].closesFacts = 'p_leave'; }, 'closesFacts'],
    ['no settings key', (p) => { delete p.settings; }, 'settings']
  ];
  const scenarios = [withPanel(), ...cases.map(([, mutate]) => withPanel(mutate))];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 1];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('privacyPanel') && e.includes(detail)), `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

// ── ENG-02: the password guesser (stage `guess`, awarenessEpisode.guess) ──────────
const guessFact = (id) => ({ text: `Fact ${id}.`, subject: 'supplier_contact', source: 'ep_staff', provides: [{ type: 'name', about: 'recipient', value: id, label: id, kind: 'generic' }] });
const guessBlock = () => ({
  target: 'supplier_contact',
  commonList: ['aaa111', 'bbb222'],
  patternSlots: [
    { id: 'team', factId: 'g_team', word: 'Rovers', template: '{team}77' },
    { id: 'pet', factId: 'g_pet', word: 'Bobbin', template: '{pet}!' }
  ],
  reuseStep: { site: 'Fishing Forum', domain: 'fishing.example', factId: 'g_forum', landsOn: 'work', note: 'One small site opened it.' },
  passphraseDemo: { words: ['otter', 'ladder', 'crimson'], neverLands: true },
  landedGlobal: 'guess_stub_landed',
  note: 'Nothing real is typed here.'
});
const withGuess = (mutate) => {
  const j = fx('clean_full.json');
  const e = ep(j);
  e.stages = ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief'];
  e.attack = { siteIds: ['supplier_site'], scored: false };
  e.guess = guessBlock();
  for (const id of ['g_team', 'g_pet', 'g_forum']) { j.social.intelFacts[id] = guessFact(id); j.globalVariables[`se_intel_${id}`] = false; }
  j.globalVariables.guess_stub_landed = false;
  if (mutate) mutate(e.guess, j, e);
  return j;
};

test('guess: a clean E9-shaped episode raises nothing (no write stage, no mail account, no mail target)', { skip }, () => {
  assert.deepEqual(lint(withGuess()), []);
  // the mode may be spelled out; the other keys are optional
  assert.deepEqual(lint(withGuess((g) => { g.mode = 'target'; })), []);
  assert.deepEqual(lint(withGuess((g) => { delete g.commonList; delete g.passphraseDemo; delete g.note; delete g.target; })), []);
});

test('guess: the stage order is brief osint guess flip defend debrief and nothing looser', { skip }, () => {
  expectIn(lint(withGuess((g, j, e) => { e.stages = ['brief', 'guess', 'flip', 'defend', 'debrief']; })), /variant 'full' has stages/);
  expectIn(lint(withGuess((g, j, e) => { e.stages = ['brief', 'osint', 'flip', 'guess', 'defend', 'debrief']; })), /variant 'full' has stages/);
  // the built orders still pass
  assert.deepEqual(lint(fx('clean_full.json')), []);
});

test('guess: the stage needs the block, the block needs the stage, a defendOnly shell carries neither', { skip }, () => {
  expectIn(lint(withGuess((g, j, e) => { delete e.guess; })), /stages lists 'guess' but there is no awarenessEpisode\.guess block/);
  const j = fx('clean_full.json');
  ep(j).guess = guessBlock();
  expectIn(lint(j), /guess is set but stages has no 'guess'/);
  const d = fx('clean_defend_only.json');
  ep(d).guess = guessBlock();
  expectIn(lint(d), /defendOnly episode has an awarenessEpisode\.guess block/);
});

test('guess: a pattern slot or the reuse step must name a declared intel fact', { skip }, () => {
  expectIn(lint(withGuess((g) => { g.patternSlots[0].factId = 'ghost'; })), /patternSlots\[0\]\.factId 'ghost' is not a social\.intelFacts id/);
  expectIn(lint(withGuess((g) => { delete g.patternSlots[1].factId; })), /patternSlots\[1\]\.factId '' is not a social\.intelFacts id/);
  expectIn(lint(withGuess((g) => { g.reuseStep.factId = 'ghost'; })), /reuseStep\.factId 'ghost' is not a social\.intelFacts id/);
  expectIn(lint(withGuess((g) => { delete g.reuseStep.site; })), /reuseStep\.site is missing/);
  expectIn(lint(withGuess((g) => { delete g.reuseStep; })), /no reuseStep; nothing in it can land/);
});

test('guess: a slot template uses only its own token and has a word to put in it', { skip }, () => {
  expectIn(lint(withGuess((g) => { g.patternSlots[0].template = '{team}{pet}'; })), /may use only its own \{team\}/);
  expectIn(lint(withGuess((g) => { g.patternSlots[0].template = 'fixed'; })), /has no \{team\} token/);
  expectIn(lint(withGuess((g) => { delete g.patternSlots[0].word; })), /patternSlots\[0\]\.word is missing/);
  expectIn(lint(withGuess((g) => { g.patternSlots[1].id = 'team'; })), /id 'team' is used by an earlier slot/);
  expectIn(lint(withGuess((g) => { g.patternSlots[0].template = 'x'.repeat(60); })), /longer than 48 characters/);
});

test('guess: landedGlobal is declared false; the passphrase never lands; the common list stays short', { skip }, () => {
  expectIn(lint(withGuess((g) => { delete g.landedGlobal; })), /landedGlobal is missing/);
  expectIn(lint(withGuess((g) => { g.landedGlobal = 'undeclared_global'; })), /landedGlobal 'undeclared_global' is not declared in globalVariables/);
  expectIn(lint(withGuess((g, j) => { j.globalVariables.guess_stub_landed = true; })), /must be declared false/);
  expectIn(lint(withGuess((g) => { g.passphraseDemo.neverLands = false; })), /neverLands must be true/);
  expectIn(lint(withGuess((g) => { g.passphraseDemo.words = []; })), /words must be a list of game words/);
  expectIn(lint(withGuess((g) => { g.commonList = Array.from({ length: 9 }, (_, i) => `w${i}`); })), /has 9 entries; keep it to 8/);
  expectIn(lint(withGuess((g) => { g.commonList[0] = 'y'.repeat(30); })), /commonList\[0\] must be a short string/);
  expectIn(lint(withGuess((g) => { g.mode = 'sweep'; })), /guess\.mode is "sweep"; it must be one of target, spray, stuff/);
});

test('guess: nothing in the block names a credential', { skip }, () => {
  expectIn(lint(withGuess((g) => { g.password = 'x'; })), /guess\.password looks like a credential field/);
  expectIn(lint(withGuess((g) => { g.patternSlots[0].secret = 'x'; })), /patternSlots\[0\]\.secret looks like a credential field/);
  expectIn(lint(withGuess((g) => { g.reuseStep.passwordHash = 'x'; })), /reuseStep\.passwordHash looks like a credential field/);
  assert.deepEqual(lint(withGuess()), [], 'passphraseDemo is not a credential field');
});

// ── ENG-02b: the organisation-scale modes (guess.mode "spray" and "stuff") ───────
const sprayBlock = () => ({
  mode: 'spray',
  roster: { namesFactId: 'g_names', patternFactId: 'g_pattern', domain: 'practice.example', sample: ['Ann Example', 'Bo Sample', 'Cy Placeholder'], note: 'From the team page.' },
  wordList: {
    slots: [{ id: 'project', factId: 'g_project', word: 'Harbour', template: '{project}' }, { id: 'place', factId: 'g_place', word: 'Quayside', template: '{place}1' }],
    seasonYear: ['Autumn2099'], note: 'From the practice website.'
  },
  spray: { passes: [{ id: 'p1', fromSlot: 'project' }, { id: 'p2', literal: 'Autumn2099' }], opensCount: 2, note: 'Once per account.' },
  stuff: { rows: [{ label: 'Supplier portal login', opens: true }, { label: 'Staff wiki login', opens: false }], note: 'A leaked password from elsewhere.' },
  passphraseDemo: { words: ['otter', 'ladder', 'crimson'], neverLands: true },
  landedGlobal: 'guess_stub_landed',
  note: 'Nothing real is used here.'
});
const withSpray = (mutate, block = sprayBlock) => {
  const j = fx('clean_full.json');
  const e = ep(j);
  e.stages = ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief'];
  e.attack = { siteIds: ['supplier_site'], scored: false };
  e.guess = block();
  for (const id of ['g_names', 'g_pattern', 'g_project', 'g_place']) { j.social.intelFacts[id] = guessFact(id); j.globalVariables[`se_intel_${id}`] = false; }
  j.globalVariables.guess_stub_landed = false;
  if (mutate) mutate(e.guess, j, e);
  return j;
};
const stuffOnly = () => ({ mode: 'stuff', stuff: sprayBlock().stuff, landedGlobal: 'guess_stub_landed' });

test('guess spray: a clean E18-shaped block raises nothing; the optional parts may be left out', { skip }, () => {
  assert.deepEqual(lint(withSpray()), []);
  assert.deepEqual(lint(withSpray((g) => { delete g.stuff; delete g.passphraseDemo; delete g.note; })), []);
});

test('guess spray: roster, wordList and spray are all required', { skip }, () => {
  for (const k of ['roster', 'wordList', 'spray']) {
    expectIn(lint(withSpray((g) => { delete g[k]; })), new RegExp(`mode is "spray" but there is no awarenessEpisode\\.guess\\.${k} block`));
  }
});

test('guess spray: the roster facts must be declared; the domain is a host-only .example', { skip }, () => {
  expectIn(lint(withSpray((g) => { g.roster.namesFactId = 'ghost'; })), /roster\.namesFactId 'ghost' is not a social\.intelFacts id/);
  expectIn(lint(withSpray((g) => { g.roster.patternFactId = 'ghost'; })), /roster\.patternFactId 'ghost' is not a social\.intelFacts id/);
  expectIn(lint(withSpray((g) => { g.roster.domain = 'practice.com'; })), /does not end \.example/);
  expectIn(lint(withSpray((g) => { g.roster.sample = []; })), /roster\.sample must be a list of made-up staff names/);
  expectIn(lint(withSpray((g) => { g.roster.sample = Array.from({ length: 11 }, (_, i) => `Person ${i}`); })), /has 11 names; keep it to 10/);
  expectIn(lint(withSpray((g) => { g.roster.sample[0] = 'ann@practice.example'; })), /sample\[0\] must be a short made-up name/);
});

test('guess spray: every word-list slot names a declared fact and uses only its own token', { skip }, () => {
  expectIn(lint(withSpray((g) => { g.wordList.slots[0].factId = 'ghost'; })), /wordList\.slots\[0\]\.factId 'ghost' is not a social\.intelFacts id/);
  expectIn(lint(withSpray((g) => { g.wordList.slots[0].template = '{project}{place}'; })), /may use only its own \{project\}/);
  expectIn(lint(withSpray((g) => { delete g.wordList.slots[1].word; })), /wordList\.slots\[1\]\.word is missing/);
  expectIn(lint(withSpray((g) => { g.wordList.slots[1].id = 'project'; })), /id 'project' is used by an earlier slot/);
  expectIn(lint(withSpray((g) => { g.wordList.seasonYear = ['a', 'b', 'c', 'd', 'e']; })), /seasonYear has 5 entries; keep it to 4/);
  expectIn(lint(withSpray((g) => { g.wordList.slots = []; })), /wordList\.slots must be a list/);
});

test('guess spray: a pass has exactly one of fromSlot (a real slot) or literal', { skip }, () => {
  expectIn(lint(withSpray((g) => { g.spray.passes[0].literal = 'x'; })), /passes\[0\] must have exactly one of fromSlot .* or literal .*, not both/);
  expectIn(lint(withSpray((g) => { delete g.spray.passes[0].fromSlot; })), /passes\[0\] must have exactly one of .*not neither/);
  expectIn(lint(withSpray((g) => { g.spray.passes[0].fromSlot = 'ghost'; })), /passes\[0\]\.fromSlot 'ghost' is not a wordList\.slots id/);
  expectIn(lint(withSpray((g) => { g.spray.passes[1].literal = 'y'.repeat(30); })), /passes\[1\]\.literal must be a short made-up string/);
  expectIn(lint(withSpray((g) => { g.spray.opensCount = 9; })), /opensCount is 9 but the roster sample has 3 accounts/);
  expectIn(lint(withSpray((g) => { g.spray.opensCount = 'two'; })), /opensCount must be a whole number/);
});

test('guess spray: a stuffing row is a generic label and a flag, never a value', { skip }, () => {
  expectIn(lint(withSpray((g) => { g.stuff.rows[0].value = 'x'; })), /stuff\.rows\[0\] carries value/);
  expectIn(lint(withSpray((g) => { g.stuff.rows[0].password = 'x'; })), /stuff\.rows\[0\]\.password looks like a credential field/);
  expectIn(lint(withSpray((g) => { g.stuff.rows[0].label = 'ann@practice.example'; })), /stuff\.rows\[0\]\.label .* looks like an address/);
  expectIn(lint(withSpray((g) => { g.stuff.rows[0].label = 'ann: hunter'; })), /stuff\.rows\[0\]\.label .* looks like an address/);
  expectIn(lint(withSpray((g) => { delete g.stuff.rows[1].opens; })), /stuff\.rows\[1\]\.opens must be true or false/);
  expectIn(lint(withSpray((g) => { g.stuff.rows = Array.from({ length: 9 }, (_, i) => ({ label: `Login ${i}`, opens: false })); })), /stuff\.rows has 9 entries; keep it to 8/);
  expectIn(lint(withSpray((g) => { g.stuff.rows.forEach((r) => { r.opens = false; }); })), /stuff has no row that opens/);
});

test('guess spray: the common checks still apply (landedGlobal, credential keys); target-only keys are caught', { skip }, () => {
  expectIn(lint(withSpray((g) => { delete g.landedGlobal; })), /landedGlobal is missing/);
  expectIn(lint(withSpray((g) => { g.landedGlobal = 'undeclared_global'; })), /landedGlobal 'undeclared_global' is not declared/);
  expectIn(lint(withSpray((g) => { g.secret = 'x'; })), /guess\.secret looks like a credential field/);
  expectIn(lint(withSpray((g) => { g.passphraseDemo.neverLands = false; })), /neverLands must be true/);
  expectIn(lint(withSpray((g) => { g.patternSlots = []; })), /guess\.patternSlots belongs to mode "target"/);
});

test('guess stuff: a stuff-only block is clean; it needs stuff and the same no-credential check', { skip }, () => {
  assert.deepEqual(lint(withSpray(null, stuffOnly)), []);
  expectIn(lint(withSpray((g) => { delete g.stuff; }, stuffOnly)), /mode is "stuff" but there is no awarenessEpisode\.guess\.stuff block/);
  expectIn(lint(withSpray((g) => { g.stuff.rows[0].hash = 'x'; }, stuffOnly)), /stuff\.rows\[0\]\.hash looks like a credential field/);
  expectIn(lint(withSpray((g) => { delete g.landedGlobal; }, stuffOnly)), /landedGlobal is missing/);
  expectIn(lint(withSpray((g) => { g.reuseStep = { site: 'x', factId: 'g_names' }; }, stuffOnly)), /guess\.reuseStep belongs to mode "target"/);
});

test('guess spray schema: the clean blocks pass; mistyped keys, extra row keys and bad shapes fail', { skip }, () => {
  const cases = [
    ['a mistyped roster key', (g) => { g.roster.domian = 'x'; }, 'domian'],
    ['a missing roster sample', (g) => { delete g.roster.sample; }, 'sample'],
    ['a long roster sample', (g) => { g.roster.sample = Array.from({ length: 11 }, (_, i) => `P${i}`); }, 'sample'],
    ['a slot without a word', (g) => { delete g.wordList.slots[0].word; }, 'word'],
    ['five season strings', (g) => { g.wordList.seasonYear = ['a', 'b', 'c', 'd', 'e']; }, 'seasonYear'],
    ['a pass key', (g) => { g.spray.passes[0].pwd = 'x'; }, 'pwd'],
    ['no opensCount', (g) => { delete g.spray.opensCount; }, 'opensCount'],
    ['a value on a stuff row', (g) => { g.stuff.rows[0].value = 'x'; }, 'value'],
    ['a stuff row without opens', (g) => { delete g.stuff.rows[0].opens; }, 'opens'],
    ['a mistyped stuff key', (g) => { g.stuff.row = []; }, 'row']
  ];
  const scenarios = [withSpray(), withSpray(null, stuffOnly), ...cases.map(([, mutate]) => withSpray(mutate))];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  assert.deepEqual(results[1], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 2];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('guess') && e.includes(detail)), `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

test('a full episode with a write stage still needs its mail attack block', { skip }, () => {
  const j = fx('clean_full.json');
  delete ep(j).attack.maxMessages;
  expectIn(lint(j), /attack\.maxMessages is nil/);
  const k = fx('clean_full.json');
  ep(k).attack.accountIds = [];
  expectIn(lint(k), /attack\.accountIds is empty/);
});

test('guess schema: the clean block passes; a mistyped key, a long common list, a bad mode and a bare slot fail', { skip }, () => {
  const cases = [
    ['a mistyped key', (g) => { g.landedGlobl = 'x'; }, 'landedGlobl'],
    ['a mistyped slot key', (g) => { g.patternSlots[0].facId = 'x'; }, 'facId'],
    ['nine common guesses', (g) => { g.commonList = Array.from({ length: 9 }, (_, i) => `w${i}`); }, 'commonList'],
    ['a bad mode', (g) => { g.mode = 'sweep'; }, 'mode'],
    ['a slot without a word', (g) => { delete g.patternSlots[0].word; }, 'word'],
    ['no landedGlobal', (g) => { delete g.landedGlobal; }, 'landedGlobal'],
    ['neverLands false', (g) => { g.passphraseDemo.neverLands = false; }, 'neverLands'],
    ['a reuse step without a site', (g) => { delete g.reuseStep.site; }, 'site']
  ];
  const scenarios = [withGuess(), ...cases.map(([, mutate]) => withGuess(mutate))];
  const results = schemaRun(scenarios);
  assert.deepEqual(results[0], { social: [], other: [] });
  cases.forEach(([name, , detail], i) => {
    const { social, other } = results[i + 1];
    assert.deepEqual(other, [], `${name}: an error outside #/social`);
    assert.ok(social.some((e) => e.includes('guess') && e.includes(detail)), `${name}: no error naming ${detail}\n${social.join('\n')}`);
  });
});

test('guess schema: strings.guessNote, strings.flipGuessIntro and a guess facilitator line are allowed', { skip }, () => {
  const j = withGuess((g, jj, e) => { e.strings.guessNote = 'x'; e.strings.flipGuessIntro = 'y'; e.strings.facilitator = { guess: 'Discuss.' }; e.strings.stages = { guess: { heading: 'h', text: 't', button: 'b' } }; e.stepLabels = { guess: 'Guess list' }; });
  assert.deepEqual(schemaRun([j])[0], { social: [], other: [] });
});

test('ENG-08: a full episode may author the osint-optional order brief write flip defend debrief (E13)', { skip }, () => {
  const j = fx('clean_full.json');
  ep(j).stages = ['brief', 'write', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /has stages/, 0); // the stage-order lint accepts it
});

test('ENG-06: the assistant block is authored-only (no model field, replies are literal strings)', { skip }, () => {
  // a clean assistant adds no issue
  let j = fx('clean_full.json');
  ep(j).assistant = {
    title: 'Assist',
    summarise: { button: 'Go', reply: 'The summary line.' },
    exchanges: [{ id: 'e1', prompt: 'Q?', reply: 'A.' }]
  };
  expectIn(lint(j), /assistant/, 0);

  // a model/free-text field is refused
  j = fx('clean_full.json');
  ep(j).assistant = { title: 'Assist', model: 'gpt-x', summarise: { button: 'Go', reply: 'ok' } };
  expectIn(lint(j), /assistant\.model is not allowed/);

  // a non-string reply is refused
  j = fx('clean_full.json');
  ep(j).assistant = { title: 'Assist', exchanges: [{ id: 'e1', prompt: 'Q?', reply: { live: true } }] };
  expectIn(lint(j), /reply must be a literal string/);
});

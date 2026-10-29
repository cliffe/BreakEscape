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
  expectIn(lint(j), /concludeRequires\.globals nil must list 'episode_e1_stub_defend_done'/);
  j = fx('clean_full.json');
  aim(j).concludeRequires.globals = ['something_else'];
  expectIn(lint(j), /must list 'episode_e1_stub_defend_done'/);
  j = fx('clean_full.json');
  host(j).eventMappings = [];
  expectIn(lint(j), /no NPC has an eventMappings entry for 'global_variable_changed:episode_e1_stub_defend_done'/);
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
  delete j.globalVariables.episode_e1_stub_defend_done;
  expectIn(lint(j), /done global 'episode_e1_stub_defend_done' is not declared/);
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
  expectIn(lint(j), /does not list 'triage_pre_done' in exportGlobals/);
  j = fx('clean_check_post.json');
  j.importGlobals[0].as = 'baseline_percent';
  expectIn(lint(j), /import of 'triage_pre_percent' has as: "baseline_percent"/);
  j = fx('clean_check_post.json');
  delete j.importGlobals[1].as;
  expectIn(lint(j), /import of 'triage_pre_reportRate' has as: nil/);
  j = fx('clean_check_post.json');
  j.importGlobals = j.importGlobals.filter((e) => e.var !== 'triage_pre_done');
  expectIn(lint(j), /does not import 'triage_pre_done'/);
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

test('result globals: a missing percent, reportRate or pass is a warning, naming the global', { skip }, () => {
  for (const g of ['percent', 'reportRate', 'pass']) {
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
  delete j.globalVariables.episode_e1_stub_defend_done;
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
    ['a missing reason', (d) => { delete d.cards[0].reason; }, 'reason']
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

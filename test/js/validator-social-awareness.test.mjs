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
  expectIn(lint(j), /variant 'sideways' must be full or defendOnly/);
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
  set(j).messages = set(j).messages.slice(0, 4);
  expectIn(lint(j), /has 4 message\(s\); an episode's defend set has 5 to 8/);
  j = fx('clean_full.json');
  set(j).messages = [...set(j).messages, ...set(j).messages.map((m) => ({ ...m, id: `${m.id}_b` }))];
  expectIn(lint(j), /has 10 message\(s\); an episode's defend set has 5 to 8/);
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

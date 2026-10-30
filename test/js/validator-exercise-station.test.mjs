// scripts/validate_social/exercises.rb: social.exercises, exercise-station objects and the
// openMinigame mapping action, plus the scene-config lints they share with the awareness episode
// (Awareness.*_config_checks) and the schema entries (scripts/scenario-schema.json).
// The clean case is scenarios/test_exercise_station; each failing case mutates a copy of it.
// Run with: node --test test/js/validator-exercise-station.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const scenario = () => JSON.parse(readFileSync(join(root, 'scenarios/test_exercise_station/scenario.json.erb'), 'utf8'));
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function check(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    puts JSON.generate(ValidateSocial.check(json, repo_root: ${JSON.stringify(root)}))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
// Only the lints this feature owns: exercise-station / social.exercises / openMinigame / scene configs
const mine = (issues) => issues.filter((m) => /exercise|station|openMinigame|concernForm|privacyPanel|sortDrill|config/i.test(m));
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const clone = (o) => JSON.parse(JSON.stringify(o));
const objs = (j) => j.rooms.hall.objects;
const stationById = (j, id) => objs(j).find((o) => o.id === id);
const exerciseById = (j, id) => j.social.exercises.find((e) => e.id === id);
const reed = (j) => j.rooms.hall.npcs[0];

test('the fixture scenario raises nothing from these lints', { skip }, () => {
  assert.deepEqual(mine(check(scenario())).filter((m) => m.startsWith('❌') || m.startsWith('⚠️')), []);
});

test('a station needs minigameData, a known scene and a config', { skip }, () => {
  let j = scenario();
  delete stationById(j, 'station_sort').minigameData;
  expectIn(check(j), /objects\[0\].*has no minigameData/);
  j = scenario();
  stationById(j, 'station_sort').minigameData = { exerciseId: 'sort_basic', scene: 'lockpicking' };
  expectIn(check(j), /no usable scene/);
  j = scenario();
  stationById(j, 'station_sort').minigameData = { scene: 'sort-drill' };
  expectIn(check(j), /neither an inline config nor an exerciseId/);
  j = scenario();
  stationById(j, 'station_sort').minigameData = {};
  expectIn(check(j), /no usable scene/);
});

test('an exerciseId must be in social.exercises, and agree with the scene', { skip }, () => {
  let j = scenario();
  stationById(j, 'station_sort').minigameData.exerciseId = 'ghost';
  expectIn(check(j), /exerciseId 'ghost' is not in social.exercises/);
  j = scenario();
  stationById(j, 'station_sort').minigameData.scene = 'concern-form';
  expectIn(check(j), /scene 'concern-form' does not match exercise 'sort_basic'/);
});

test('the result globals must be declared, and a missing prefix is a warning', { skip }, () => {
  let j = scenario();
  delete j.globalVariables.ex_privacy_done;
  expectIn(check(j), /writes the global 'ex_privacy_done'/);
  j = scenario();
  delete j.globalVariables.ex_sort_percent;
  expectIn(check(j), /writes the global 'ex_sort_percent'/);
  j = scenario();
  j.social.exercises[1].setGlobalPrefix = undefined;
  delete stationById(j, 'station_concern').minigameData.setGlobalPrefix;
  expectIn(check(j), /^⚠️.*objects\[1\].*no setGlobalPrefix/);
  j = scenario();
  stationById(j, 'station_privacy').minigameData.setGlobalPrefix = '';
  expectIn(check(j), /setGlobalPrefix must be a non-empty string/);
});

test('a scored percent is only required for a scored sort drill', { skip }, () => {
  const j = scenario();
  exerciseById(j, 'sort_basic').config.scored = false;
  delete exerciseById(j, 'sort_basic').config.answerKeyProfile;
  delete j.globalVariables.ex_sort_percent;
  assert.equal(hits(check(j), /ex_sort_percent/), 0);
});

test('social.exercises: ids, scene and the scene config are linted, naming the exercise', { skip }, () => {
  let j = scenario();
  j.social.exercises.push({ id: 'sort_basic', scene: 'sort-drill', config: {} });
  expectIn(check(j), /id 'sort_basic' is used more than once/);
  j = scenario();
  exerciseById(j, 'sort_basic').scene = 'lockpicking';
  expectIn(check(j), /social\.exercises\[sort_basic\]\.scene "lockpicking" must be one of/);
  j = scenario();
  exerciseById(j, 'sort_basic').config.cards[0].answer = 'nowhere';
  expectIn(check(j), /social\.exercises\[sort_basic\]\.config: .*answer 'nowhere' is not one of the bins/);
  j = scenario();
  exerciseById(j, 'concern_demo').config.factChips[0].kind = 'when';
  expectIn(check(j), /social\.exercises\[concern_demo\]\.config: .*kind 'when' is not one of what, where, how/);
  j = scenario();
  exerciseById(j, 'assistant_demo').config.apiKey = 'x';
  expectIn(check(j), /social\.exercises\[assistant_demo\]\.config: .*config\.apiKey is not allowed/);
  j = scenario();
  j.social.exercises.push({ id: 'e5', scene: 'sort-drill' });
  expectIn(check(j), /social\.exercises\[e5\]\.config must be an object/);
});

test('an inline config is linted too, naming the object', { skip }, () => {
  let j = scenario();
  stationById(j, 'station_privacy').minigameData.config.settings[0].closesFacts = ['unknown_fact'];
  expectIn(check(j), /objects\[2\].*closesFacts: 'unknown_fact' is not a declared/);
  // inline facts count as declared
  j = scenario();
  assert.equal(hits(check(j), /closesFacts/), 0);
  j = scenario();
  stationById(j, 'station_guess').minigameData.config.landedGlobal = 'not_declared';
  expectIn(check(j), /objects\[4\].*landedGlobal 'not_declared' is not declared/);
});

test('concernForm kinds: a list of ids or { id, label }, unique, with chips inside it', { skip }, () => {
  let j = scenario();
  delete exerciseById(j, 'concern_demo').config.kinds;
  expectIn(check(j), /kind 'how' is not one of what, when, where, who/);
  j = scenario();
  exerciseById(j, 'concern_demo').config.kinds = ['what', 'what'];
  expectIn(check(j), /kinds: id 'what' is used more than once/);
  j = scenario();
  exerciseById(j, 'concern_demo').config.kinds = ['Bad Kind'];
  expectIn(check(j), /kinds\[0\] needs a lower-case id/);
  j = scenario();
  exerciseById(j, 'concern_demo').config.kinds = [];
  expectIn(check(j), /kinds must be a non-empty array/);
});

test('openMinigame in an event mapping: a registry type, no conversationMode, a checked station', { skip }, () => {
  let j = scenario();
  reed(j).eventMappings[0].openMinigame = 'no-such-type';
  expectIn(check(j), /openMinigame names "no-such-type"/);
  j = scenario();
  reed(j).eventMappings[0].conversationMode = 'person-chat';
  expectIn(check(j), /opens a minigame or a conversation, not both/);
  j = scenario();
  reed(j).eventMappings[0].openMinigame.minigameData.exerciseId = 'ghost';
  expectIn(check(j), /openMinigame.*exerciseId 'ghost' is not in social.exercises/);
  j = scenario();
  reed(j).eventMappings[0].openMinigame = 'mail_terminal';
  assert.equal(hits(check(j), /openMinigame/), 0);
});

test('a scenario with no social block can still carry a station with an inline config', { skip }, () => {
  const j = scenario();
  delete j.social;
  stationById(j, 'station_sort').minigameData = { scene: 'sort-drill', setGlobalPrefix: 'ex_sort_', config: { bins: [{ id: 'a', label: 'A' }], cards: [] } };
  reed(j).eventMappings = [];
  const issues = check(j);
  expectIn(issues, /objects\[0\].*bins must hold 2 to 4 bins/);
});

test('the CLI accepts the fixture and the schema knows the new keys', { skip }, () => {
  const run = (path) => spawnSync('ruby', ['scripts/validate_scenario.rb', path, '--strict-social', '--no-graph', '--skip-ink'],
    { cwd: root, encoding: 'utf8', env });
  const clean = run('scenarios/test_exercise_station/scenario.json.erb');
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  assert.match(clean.stdout, /Schema validation passed/);
  assert.doesNotMatch(clean.stdout, /❌/);
});

test('the schema rejects a bad exercise, a bad openMinigame and a bad videoCall', { skip }, () => {
  const script = (json) => `require 'json'
    require 'set'
    require 'json-schema'
    schema = JSON.parse(File.read(${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    puts JSON.generate(JSON::Validator.fully_validate(schema, json, strict: false))`;
  const errors = (json) => {
    const r = spawnSync('ruby', ['-e', script(json)], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
  };
  assert.deepEqual(errors(scenario()), []);
  let j = scenario();
  j.social.exercises[0].scene = 'lockpicking';
  assert.ok(errors(j).some((e) => /exercises\/0\/scene/.test(e)), 'a scene outside the five');
  j = scenario();
  delete j.social.exercises[0].config;
  assert.ok(errors(j).some((e) => /exercises\/0/.test(e) && /config/.test(e)), 'config is required');
  j = scenario();
  j.social.exercises[0].config.bnis = [];
  assert.ok(errors(j).some((e) => /exercises\/0/.test(e)), 'a typo in the named config fails the scene definition');
  j = scenario();
  j.social.exercises[1].config.factChips[0].kind = 'Not A Kind';
  assert.ok(errors(j).some((e) => /exercises\/1/.test(e)), 'a kind must be an id');
  j = scenario();
  reed(j).eventMappings[0].openMinigame = 'lockpicking';
  assert.ok(errors(j).some((e) => /openMinigame/.test(e)), 'only registry types');
  j = scenario();
  reed(j).timedConversation = { delay: 0, targetKnot: 'k', videoCall: 'yes' };
  assert.ok(errors(j).some((e) => /videoCall/.test(e)), 'videoCall is a boolean');
});

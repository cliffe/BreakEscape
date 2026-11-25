// E2 (world hold), E3 (stepAways beats) and E5 (flipDefenderLineByGlobal): the awareness validator
// rules and schema entries. Good and bad cases per rule, built from clean_full.json.
// Run with: node --test test/js/validator-social-holds-beats.test.mjs
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
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);
const ep = (j) => j.social.awarenessEpisode;

// A full episode whose write stage is a pretext call, with a kiosk room and a lobby.
function mk() {
  const j = fx('clean_full.json');
  j.rooms.lobby = JSON.parse(JSON.stringify(j.rooms.ep_room));
  j.rooms.lobby.objects = [];
  j.social.pretextNpcs = [{ callId: 'front_desk', character: 'desk_mark' }];
  delete ep(j).attack.target;
  delete ep(j).attack.accountIds;
  delete ep(j).attack.defaultAccount;
  delete ep(j).attack.maxMessages;
  ep(j).attack.callId = 'front_desk';
  ep(j).world = {
    room: 'lobby', startRoom: 'ep_room',
    costume: { sprite: 'male_spy_v2', talk: 'assets/characters/male_spy_talk.png' }
  };
  return j;
}
const world = (j) => ep(j).world;
const strs = (j) => (ep(j).strings ||= {});
const declare = (j, ...names) => { j.globalVariables = { ...(j.globalVariables || {}) }; for (const n of names) j.globalVariables[n] = false; };
const noIssues = (j) => assert.deepEqual(lint(j).filter((s) => /hold|stepAway|flipDefenderLineByGlobal/.test(s)), []);

// ---- E2: the hold ----
test('E2: a good hold is clean and schema-accepted', { skip }, () => {
  const j = mk(); declare(j, 'held_done');
  Object.assign(world(j), { holdUntil: 'held_done', holdMaxMs: 60000 });
  noIssues(j);
  const [r] = schemaRun([j]);
  assert.deepEqual(r.social.filter((s) => /hold/i.test(s)), []);
});
test('E2: holdUntil needs a positive numeric holdMaxMs', { skip }, () => {
  for (const cap of [undefined, '75000', 0, -5]) {
    const j = mk(); declare(j, 'held_done');
    world(j).holdUntil = 'held_done';
    if (cap !== undefined) world(j).holdMaxMs = cap;
    expectIn(lint(j), /holdUntil needs a positive world\.holdMaxMs/);
  }
});
test('E2: holdUntil must be a declared, string, non-server-owned global', { skip }, () => {
  const j = mk(); world(j).holdUntil = 'nope'; world(j).holdMaxMs = 1000;
  expectIn(lint(j), /holdUntil "nope" is not a declared global/);
  world(j).holdUntil = 7;
  expectIn(lint(j), /holdUntil must be a global name/);
  const k = mk(); declare(k, 'imported_g'); k.importGlobals = [{ as: 'imported_g', from: 'm01_x', var: 'x' }];
  Object.assign(world(k), { holdUntil: 'imported_g', holdMaxMs: 1000 });
  expectIn(lint(k), /holdUntil "imported_g" is a server-owned global/);
});
test('E2: holdMaxMs alone and over 90 s warn', { skip }, () => {
  const j = mk(); world(j).holdMaxMs = 5000;
  expectIn(lint(j), /holdMaxMs has no effect without world\.holdUntil/);
  const k = mk(); declare(k, 'held_done');
  Object.assign(world(k), { holdUntil: 'held_done', holdMaxMs: 120000 });
  expectIn(lint(k), /holdMaxMs exceeds 90 s/);
});
test('E2: a world costume with a wearable in the scenario warns; a worn global cannot be the hold', { skip }, () => {
  const j = mk();
  j.rooms.lobby.objects.push({ type: 'key', name: 'Hi-vis', takeable: true, wearable: { costume: 'male_spy_v2', global: 'worn_hivis' } });
  expectIn(lint(j), /world\.costume is set and the scenario has a wearable/);
  declare(j, 'worn_hivis');
  Object.assign(world(j), { holdUntil: 'worn_hivis', holdMaxMs: 1000 });
  expectIn(lint(j), /holdUntil "worn_hivis" is a server-owned global/);
  expectIn(lint(mk()), /world\.costume is set and the scenario has a wearable/, 0);
});

// ---- E3: stepAways ----
const beat = (o = {}) => ({ id: 'b1', after: 'flip', readyGlobal: null, doneGlobal: 'b1_done', ...o });
test('E3: a good list is clean and schema-accepted', { skip }, () => {
  const j = mk(); declare(j, 'b1_done', 'b2_done'); strs(j).worldBeat = 'Look up.';
  ep(j).stepAways = [beat(), { id: 'b2', after: 'defend', event: 'episode_step_away', pickedKey: 'lateBeat', strings: 'worldBeat', doneGlobal: 'b2_done', resumeOnDone: true }];
  noIssues(j);
  const [r] = schemaRun([j]);
  assert.deepEqual(r.social.filter((s) => /stepAways|worldBeat/.test(s)), []);
});
test('E3: schema rejects a seventh beat and an unknown beat key', { skip }, () => {
  const j = mk();
  ep(j).stepAways = Array.from({ length: 7 }, (_, i) => ({ id: `b${i}`, after: 'flip' }));
  const k = mk(); ep(k).stepAways = [{ id: 'a', after: 'flip', bogus: 1 }];
  const [r1, r2] = schemaRun([j, k]);
  assert.ok(r1.social.some((s) => /stepAways/.test(s)), r1.social.join('\n'));
  assert.ok(r2.social.some((s) => /bogus|stepAways/.test(s)), r2.social.join('\n'));
});
test('E3: stepAway and stepAways together, not a list, check/non-full shells', { skip }, () => {
  const j = mk(); declare(j, 'b1_done'); ep(j).stepAway = true; ep(j).stepAways = [beat()];
  expectIn(lint(j), /stepAway and stepAways are both set/);
  const k = mk(); ep(k).stepAways = 'x';
  expectIn(lint(k), /stepAways must be a list/);
  const d = fx('clean_defend_only.json'); ep(d).stepAways = [beat()];
  expectIn(lint(d), /stepAways is set on a "defendOnly" episode/);
});
test('E3: after, id and pickedKey rules', { skip }, () => {
  const j = mk(); declare(j, 'b1_done'); strs(j).worldBeat = 'x';
  ep(j).stepAways = [beat({ after: 'nowhere' })];
  expectIn(lint(j), /after "nowhere" is not a stage/);
  ep(j).stepAways = [beat({ after: 'debrief' })];
  expectIn(lint(j), /is the last stage/);
  ep(j).stepAways = [beat({ id: 'x', after: 'flip' }), beat({ id: 'x', after: 'write', pickedKey: 'other' })];
  expectIn(lint(j), /id 'x' repeats/);
  ep(j).stepAways = [beat({ id: 'a', after: 'flip' }), beat({ id: 'b', after: 'flip', pickedKey: 'other' })];
  expectIn(lint(j), /already has a beat/);
  ep(j).stepAways = [beat({ id: 'a', after: 'flip' }), beat({ id: 'b', after: 'write' })];
  expectIn(lint(j), /pickedKey 'worldBeatPicked' repeats/);
  for (const bad of ['done', 'sent', 'drillVia', '9x', 'a_b']) {
    ep(j).stepAways = [beat({ pickedKey: bad })];
    expectIn(lint(j), /pickedKey/);
  }
});
test('E3: readyGlobal/doneGlobal declared, event, resumeOnDone, strings text', { skip }, () => {
  const j = mk(); strs(j).worldBeat = 'x';
  ep(j).stepAways = [beat({ readyGlobal: 'ghost_ready', doneGlobal: 'ghost_done' })];
  expectIn(lint(j), /readyGlobal 'ghost_ready' is not declared/);
  expectIn(lint(j), /doneGlobal 'ghost_done' is not declared/);
  declare(j, 'b1_done');
  ep(j).stepAways = [beat({ event: 'episode_step_away' })];
  expectIn(lint(j), /only the post-defend beat may emit/);
  ep(j).stepAways = [beat({ doneGlobal: null, resumeOnDone: true })];
  expectIn(lint(j), /resumeOnDone is true with no doneGlobal/);
  delete strs(j).worldBeat;
  ep(j).stepAways = [beat()];
  expectIn(lint(j), /strings\.worldBeat has no text/);
});
test('E3: a post-defend beat with no strings.stepAway does not warn (engine default copy)', { skip }, () => {
  const j = mk(); declare(j, 'b1_done'); strs(j).worldBeat = 'x'; delete strs(j).stepAway;
  ep(j).stepAways = [beat(), { id: 'b2', after: 'defend', event: 'episode_step_away', pickedKey: 'lateBeat', doneGlobal: null }];
  expectIn(lint(j), /strings\.stepAway has no text/, 0);
  delete strs(j).worldBeat;
  expectIn(lint(j), /strings\.worldBeat has no text/);
});
test('E3: doneGlobal may not be a server-owned global', { skip }, () => {
  const j = mk(); declare(j, 'imported_g'); j.importGlobals = [{ as: 'imported_g', from: 'm01_x', var: 'x' }];
  strs(j).worldBeat = 'x';
  ep(j).stepAways = [beat({ doneGlobal: 'imported_g' })];
  expectIn(lint(j), /doneGlobal 'imported_g' is a server-owned global/);
  declare(j, 'b1_done');
  ep(j).stepAways = [beat()];
  expectIn(lint(j), /server-owned/, 0);
});
test('E3: a beat after defend needs the debrief; the list is barred from check shells', { skip }, () => {
  const j = mk(); declare(j, 'b1_done'); strs(j).stepAway = 'x';
  ep(j).stages = ['brief', 'osint', 'write', 'flip', 'debrief', 'defend'];
  ep(j).stepAways = [beat({ after: 'defend' })];
  expectIn(lint(j), /is the last stage|debrief does not follow/);
  const c = fx('clean_check_pre.json'); ep(c).stepAways = [beat()];
  assert.ok(lint(c).some((s) => /stepAways/.test(s)));
});
test('E3: a list-form post-defend beat on kit_defend_done warns without a mapping', { skip }, () => {
  const j = mk(); declare(j, 'kit_defend_done'); strs(j).stepAway = 'x';
  ep(j).stepAways = [{ id: 'p', after: 'defend', readyGlobal: 'kit_defend_done' }];
  expectIn(lint(j), /waits on kit_defend_done but no eventMapping sets it/);
});

// ---- E5: flipDefenderLineByGlobal ----
test('E5: a good list is clean and schema-accepted', { skip }, () => {
  const j = mk(); declare(j, 'g1', 'g2');
  strs(j).flipDefenderLineByGlobal = [{ global: 'g1', line: 'One.', heading: 'H' }, { global: 'g2', line: 'Two.' }];
  noIssues(j);
  const [r] = schemaRun([j]);
  assert.deepEqual(r.social.filter((s) => /flipDefenderLineByGlobal/.test(s)), []);
});
test('E5: undeclared global, empty or {var} line, duplicate global, wrong shape', { skip }, () => {
  const j = mk(); declare(j, 'g1');
  strs(j).flipDefenderLineByGlobal = [{ global: 'ghost', line: 'x' }];
  expectIn(lint(j), /\[0\]\.global 'ghost' is not declared/);
  strs(j).flipDefenderLineByGlobal = [{ global: 'g1', line: '  ' }];
  expectIn(lint(j), /\[0\]\.line is empty/);
  strs(j).flipDefenderLineByGlobal = [{ global: 'g1', line: 'Hi {name}' }];
  expectIn(lint(j), /\[0\]\.line has a \{placeholder\}/);
  strs(j).flipDefenderLineByGlobal = [{ global: 'g1', line: 'a', heading: 'B {x}' }];
  expectIn(lint(j), /\[0\]\.heading has a \{placeholder\}/);
  strs(j).flipDefenderLineByGlobal = [{ global: 'g1', line: 'a' }, { global: 'g1', line: 'b' }];
  expectIn(lint(j), /\[1\]\.global 'g1' repeats an earlier entry/);
  strs(j).flipDefenderLineByGlobal = { g1: 'a' };
  expectIn(lint(j), /must be a list of/);
  const [r] = schemaRun([j]);
  assert.ok(r.social.some((s) => /flipDefenderLineByGlobal/.test(s)), r.social.join('\n'));
});

// ENG-05a/05b/08: the awareness validator and schema for the `world` modifier (a call attack played
// in another room, in a costume). One failing case per lint, built from clean_full.json made into
// a call-attack fixture with two rooms.
// Run with: node --test test/js/validator-social-world.test.mjs
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

test('the baseline call fixture is clean without world, and world adds no issue', { skip }, () => {
  const j = mk();
  delete ep(j).world;
  const base = lint(j);
  assert.deepEqual(lint(mk()), base, 'a clean world block adds nothing');
  assert.equal(base.filter((s) => /world/.test(s)).length, 0);
});

test('world.room and world.startRoom must be rooms of the scenario', { skip }, () => {
  let j = mk();
  world(j).room = 'atrium';
  expectIn(lint(j), /world\.room 'atrium' is not a room/);
  j = mk();
  world(j).startRoom = 'atrium';
  const out = lint(j);
  expectIn(out, /world\.startRoom 'atrium' is not a room/);
  expectIn(out, /is not the scenario startRoom/);
});

test('world.startRoom must be the scenario startRoom, and differ from world.room', { skip }, () => {
  let j = mk();
  j.startRoom = 'lobby';
  world(j).room = 'ep_room';
  world(j).startRoom = 'ep_room';
  expectIn(lint(j), /both 'ep_room'/);
  expectIn(lint(j), /is not the scenario startRoom 'lobby'/);
  j = mk();
  j.startRoom = 'lobby';
  expectIn(lint(j), /is not the scenario startRoom 'lobby'/);
});

test('world needs a call attack: a mail attack, or no write stage, fails', { skip }, () => {
  let j = mk();
  delete ep(j).attack.callId;
  expectIn(lint(j), /world modifies a call attack/);
  j = mk();
  ep(j).stages = ['brief', 'osint', 'flip', 'defend', 'debrief'];
  expectIn(lint(j), /world modifies a call attack/);
});

test('a defendOnly episode with world is an error', { skip }, () => {
  const j = fx('clean_defend_only.json');
  ep(j).world = { room: 'ep_room', startRoom: 'ep_room' };
  expectIn(lint(j), /a defendOnly episode has an awarenessEpisode\.world block/);
});

test('the costume names a sprite; a missing talk path is a warning', { skip }, () => {
  let j = mk();
  world(j).costume = {};
  expectIn(lint(j), /world\.costume must name a sprite/);
  j = mk();
  delete world(j).costume.talk;
  expectIn(lint(j), /world\.costume\.talk is missing/);
  j = mk();
  delete world(j).costume;
  assert.equal(lint(j).filter((s) => /world/.test(s)).length, 0, 'the costume is optional');
});

test('the schema accepts a clean world block and rejects unknown or missing keys', { skip }, () => {
  const ok = mk();
  ok.social.awarenessEpisode.world.spawn = { x: 4, y: 6 };
  const noRoom = mk();
  delete world(noRoom).room;
  const stray = mk();
  world(stray).costume.colour = 'yellow';
  const strayTop = mk();
  world(strayTop).teleport = true;
  const noSprite = mk();
  world(noSprite).costume = { talk: 'assets/characters/x_talk.png' };
  const [a, b, c, d, e] = schemaRun([ok, noRoom, stray, strayTop, noSprite]);
  assert.deepEqual(a.social, [], a.social.join('\n'));
  for (const r of [b, c, d, e]) assert.ok(r.social.length > 0, 'the schema should reject it');
});

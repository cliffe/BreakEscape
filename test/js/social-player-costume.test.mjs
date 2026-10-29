// ENG-05b: the costume over the chosen avatar (utils/player-costume.js), aw9.
// updatePlayerSprite is replaced by a stand-in that does what the real one does to the scenario
// and the character registry (core/player.js:118: syncScenarioPlayer, then the registry), so the
// restore path is exercised against the real player-avatar.js.
// Run with: node --test test/js/social-player-costume.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const load = (rel) => import(pathToFileURL(join(js, rel)).href);
const avatar = await load('utils/player-avatar.js');
const costumeMod = await load('utils/player-costume.js');
const { applyCostume, removeCostume, costumeActive, costumeRestoreKey } = costumeMod;

const COSTUME = { sprite: 'male_spy_v2', talk: 'assets/characters/male_spy_talk.png' };

// A world: the scenario names one avatar, the learner chose another.
function world({ chosen = 'female_scientist_v2', scenarioSprite = 'female_office_worker_v2', scenarioTalk = 'assets/characters/female_office_worker_talk.png' } = {}) {
  const scenario = { player: { spriteSheet: scenarioSprite, spriteTalk: scenarioTalk } };
  const config = chosen ? { playerSprite: chosen } : {};
  const registry = { player: { spriteSheet: chosen || scenarioSprite, spriteTalk: null } };
  const calls = [];
  // The real updatePlayerSprite's effect on shared state.
  const updatePlayerSprite = async (key) => {
    calls.push(key);
    if (key === 'broken') return false;
    avatar.syncScenarioPlayer(scenario, key);
    registry.player.spriteSheet = key;
    registry.player.spriteTalk = avatar.playerTalkPath(key, scenario.player.spriteTalk);
    return true;
  };
  return { scenario, config, registry, calls, deps: { scenario, config, registry, updatePlayerSprite } };
}

test('applyCostume stores the chosen avatar, then swaps to the costume and its talk portrait', async () => {
  const w = world();
  assert.equal(costumeActive(), false);
  assert.equal(await applyCostume(COSTUME, w.deps), true);
  assert.deepEqual(w.calls, ['male_spy_v2']);
  assert.equal(costumeActive(), true);
  assert.equal(costumeRestoreKey(), 'female_scientist_v2', 'the stored key is the chosen avatar, not the scenario sprite');
  assert.equal(w.scenario.player.spriteSheet, 'male_spy_v2');
  assert.equal(w.scenario.player.spriteTalk, COSTUME.talk);
  assert.equal(w.registry.player.spriteTalk, COSTUME.talk);
  await removeCostume(w.deps);
});

test('removeCostume restores the chosen avatar, never the scenario player.spriteSheet, and syncs the scenario', async () => {
  const w = world();
  await applyCostume(COSTUME, w.deps);
  assert.equal(await removeCostume(w.deps), true);
  assert.equal(w.calls.at(-1), 'female_scientist_v2');
  assert.notEqual(w.calls.at(-1), 'female_office_worker_v2');
  assert.equal(w.scenario.player.spriteSheet, 'female_scientist_v2');
  assert.equal(w.scenario.player.spriteTalk, 'assets/characters/female_scientist_v2_talk.png', 'the costume portrait is gone, the avatar portrait is derived');
  assert.equal(w.registry.player.spriteSheet, 'female_scientist_v2');
  assert.equal(costumeActive(), false);
  assert.equal(avatar.chosenPlayerSprite(w.config, w.scenario), 'female_scientist_v2');
});

test('removeCostume calls syncScenarioPlayer with the restored key', async () => {
  const w = world();
  const synced = [];
  await applyCostume(COSTUME, w.deps);
  await removeCostume({ ...w.deps, sync: (scenario, key) => { synced.push(key); return avatar.syncScenarioPlayer(scenario, key); } });
  assert.deepEqual(synced, ['female_scientist_v2']);
});

test('with no chosen avatar configured the scenario sprite is what is restored (read before the swap)', async () => {
  // Without a config the "chosen" avatar is the scenario's; the swap overwrites scenario.player,
  // so the key has to be read first. If it were read after, the costume would be handed back.
  const w = world({ chosen: null });
  await applyCostume(COSTUME, w.deps);
  assert.equal(avatar.chosenPlayerSprite(w.config, w.scenario), 'male_spy_v2', 'precondition: the swap overwrote the scenario');
  await removeCostume(w.deps);
  assert.equal(w.scenario.player.spriteSheet, 'female_office_worker_v2');
  assert.equal(w.scenario.player.spriteTalk, 'assets/characters/female_office_worker_talk.png');
});

test('a costume stacked on a costume still hands back the chosen avatar', async () => {
  const w = world();
  await applyCostume(COSTUME, w.deps);
  await applyCostume({ sprite: 'female_hacker_hood_v2' }, w.deps);
  assert.equal(costumeRestoreKey(), 'female_scientist_v2');
  await removeCostume(w.deps);
  assert.equal(w.scenario.player.spriteSheet, 'female_scientist_v2');
});

test('removeCostume with no costume on does nothing, so every exit path may call it', async () => {
  const w = world();
  assert.equal(await removeCostume(w.deps), false);
  assert.deepEqual(w.calls, []);
  assert.equal(w.scenario.player.spriteSheet, 'female_office_worker_v2');
});

test('a sprite swap that fails leaves no costume recorded; a failed restore stays retryable', async () => {
  const w = world();
  assert.equal(await applyCostume({ sprite: 'broken' }, w.deps), false);
  assert.equal(costumeActive(), false);
  await applyCostume(COSTUME, w.deps);
  let fail = true;
  const flaky = { ...w.deps, updatePlayerSprite: async (k) => (fail ? false : w.deps.updatePlayerSprite(k)) };
  assert.equal(await removeCostume(flaky), false);
  assert.equal(costumeActive(), true, 'still dressed, so a later call can retry');
  fail = false;
  assert.equal(await removeCostume(flaky), true);
  assert.equal(w.scenario.player.spriteSheet, 'female_scientist_v2');
});

test('a costume without a sprite is refused and changes nothing', async () => {
  const w = world();
  assert.equal(await applyCostume({ talk: 'x' }, w.deps), false);
  assert.equal(await applyCostume(null, w.deps), false);
  assert.deepEqual(w.calls, []);
});

test('the avatar helpers behave identically before and after a costume round trip (no costume: untouched)', async () => {
  // Without a costume the new module is never loaded by the game; with one, the pure helpers still
  // answer the same for the same inputs.
  const cfg = { playerSprite: 'female_scientist_v2' };
  const sc = { player: { spriteSheet: 'female_office_worker_v2', spriteTalk: 'assets/characters/female_office_worker_talk.png' } };
  const before = [avatar.chosenPlayerSprite(cfg, sc), avatar.playerTalkPath('hacker'), avatar.playerTalkPath('x_v2', 'assets/characters/x_talk.png'), avatar.playerTalkPath('y_v2', 'assets/characters/x_talk.png')];
  const w = world();
  await applyCostume(COSTUME, w.deps);
  await removeCostume(w.deps);
  const after = [avatar.chosenPlayerSprite(cfg, sc), avatar.playerTalkPath('hacker'), avatar.playerTalkPath('x_v2', 'assets/characters/x_talk.png'), avatar.playerTalkPath('y_v2', 'assets/characters/x_talk.png')];
  assert.deepEqual(after, before);
  assert.deepEqual(before, ['female_scientist_v2', 'assets/characters/hacker-talk.png', 'assets/characters/x_talk.png', 'assets/characters/y_v2_talk.png']);
});

// Player poses (systems/player-poses.js; docs/achitechture/NPC_POSES.md): drink on a drink from
// the inventory, a short use on a world interaction, phone around phone-style minigames; nothing
// without pose frames; skipped seated, walking, knocked out or fighting; breathing while held.
// The trigger sites are checked too: consumables.js, interactions.js, minigame-manager.js.
// Run with: node test/js/player-poses.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);
const { PlayerPoses, isPhoneScene, playerPoseKey, USE_MS, DRINK_MS, PHONE_CLOSE_MS } = await imp('systems/player-poses.js');

const ALL = ['drink', 'use', 'phone'].flatMap(n => ['south', 'north', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'].map(d => `pose_${n}_${d}`));

function rig({ poseKeys = ALL } = {}) {
    const played = [];
    const scene = { time: { now: 0 }, anims: { get: (k) => (poseKeys.includes(k) ? { frames: [{}] } : null) } };
    const player = {
        active: true, destroyed: false, visible: true, direction: 'down', isMoving: false, body: { velocity: { x: 0, y: 0 } },
        scene, texture: { key: 'male_office_worker_v2' }, frame: { name: 'x', width: 80, height: 80 },
        anims: { currentAnim: { key: 'idle-down' }, isPlaying: true, play(k) { this.currentAnim = { key: k }; played.push(k); } },
        setCrop() { return this; }
    };
    window.player = player;
    window.gameScenario = {};
    window.seating = { isSeated: () => false };
    window.playerIsKnockedOut = () => false;
    window.npcBehaviorManager = { behaviors: new Map() };
    window.inventory = { items: [] };
    const poses = new PlayerPoses(scene);
    window.playerPoses = poses;
    return { poses, player, scene, played };
}

test('phone-style minigames: phone chat (texts and calls) and a person-chat video call', () => {
    assert.equal(isPhoneScene('phone-chat', {}), true);
    assert.equal(isPhoneScene('person-chat', { videoCall: true }), true);
    assert.equal(isPhoneScene('person-chat', {}), false);
    for (const s of ['pin', 'container', 'notes', 'authenticator', 'mail-client']) assert.equal(isPhoneScene(s, {}), false, s);
    assert.equal(playerPoseKey('drink', 'up-left'), 'pose_drink_north-west');
});

test('drink: the drink pose for DRINK_MS, breathing, then the idle', () => {
    const { poses, player, scene } = rig();
    assert.equal(poses.drink(), true);
    assert.equal(player.anims.currentAnim.key, 'pose_drink_south');
    poses.update();
    assert.ok(poses.holder.breath, 'the held pose breathes');
    scene.time.now = DRINK_MS - 1;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'pose_drink_south');
    scene.time.now = DRINK_MS;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'idle-down');
    assert.equal(poses.holder.breath, null, 'breathing ends with the pose');
    assert.equal(poses.cur, null);
});

test('use: a short pose facing the object; never for an inventory item', () => {
    const { poses, player, scene } = rig();
    player.direction = 'up-right';
    const desk = { scenarioData: { type: 'pc' } };
    assert.equal(poses.use(desk), true);
    assert.equal(player.anims.currentAnim.key, 'pose_use_north-east');
    scene.time.now = USE_MS;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'idle-up-right');
    assert.ok(USE_MS >= 400 && USE_MS <= 600);
    const mug = { scenarioData: { type: 'coffee' } };
    window.inventory.items.push(mug);
    assert.equal(poses.use(mug), false);
});

test('phone: holds while the minigame is open, then PHONE_CLOSE_MS after it closes', () => {
    const { poses, player, scene } = rig();
    const inst = {};
    assert.equal(poses.onMinigameStart('phone-chat', {}, inst), true);
    scene.time.now = 60000;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'pose_phone_south', 'held while open');
    assert.equal(poses.use({ scenarioData: {} }), false, 'no use over an open phone');
    assert.equal(poses.onMinigameEnd({}), false, 'another minigame closing does not end it');
    assert.equal(poses.onMinigameEnd(inst), true);
    scene.time.now += PHONE_CLOSE_MS - 1;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'pose_phone_south');
    scene.time.now += 1;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'idle-down');
    assert.equal(poses.onMinigameStart('pin', {}, {}), false, 'not phone-style');
    // A video call
    assert.equal(poses.onMinigameStart('person-chat', { videoCall: true }, {}), true);
});

test('skipped: no frames, seated, walking, knocked out, fighting, chased, office visuals off', () => {
    const cases = [
        ['no frames', (r) => { r.poses.scene.anims.get = () => null; }],
        ['seated', () => { window.seating.isSeated = () => true; }],
        ['walking', (r) => { r.player.body.velocity.x = 80; }],
        ['knocked out', () => { window.playerIsKnockedOut = () => true; }],
        ['fighting', (r) => { r.player.anims.currentAnim = { key: 'lead-jab_south' }; }],
        ['chased', () => { window.npcBehaviorManager.behaviors.set('guard', { currentState: 'chase' }); }],
        ['office visuals off', () => { window.gameScenario.officeVisuals = false; }]
    ];
    for (const [label, set] of cases) {
        const r = rig();
        set(r);
        assert.equal(r.poses.drink(), false, label);
        assert.equal(r.poses.use({ scenarioData: {} }), false, label);
        assert.equal(r.played.length, 0, label);
    }
});

test('walking off ends the pose at once and keeps the walk', () => {
    const { poses, player } = rig();
    poses.drink();
    player.anims.play('walk-left');
    player.isMoving = true;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'walk-left');
    assert.equal(poses.cur, null);
});

test('trigger: useConsumable shows the drink pose for a drink, not for food', async () => {
    const { useConsumable } = await imp('systems/consumables.js');
    const calls = [];
    window.playerPoses = { drink: () => calls.push('drink') };
    const deps = (inv) => ({ playerHealth: { isKO: () => false, getHP: () => 100, getMaxHP: () => 100, heal() {} },
        notify() {}, inventoryItems: inv, noCombat: true, playSound() {}, useUp() {} });
    const coffee = { scenarioData: { type: 'coffee', name: 'Coffee' } };
    useConsumable(coffee, deps([coffee]));
    const snack = { scenarioData: { type: 'sandwich', name: 'Sandwich', consumable: true, heal: 10 } };
    useConsumable(snack, deps([snack]));
    assert.deepEqual(calls, ['drink']);
});

test('trigger: the minigame framework calls the phone hook on open and close', async () => {
    const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
    const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
    class Stub extends MinigameScene { init() {} start() {} }
    MinigameFramework.registerScene('phone-chat-stub-test', Stub);
    const calls = [];
    window.playerPoses = {
        onMinigameStart: (type, params, inst) => calls.push(['start', type, !!inst]),
        onMinigameEnd: (inst) => calls.push(['end', !!inst])
    };
    window.game = { input: { mouse: {} }, scene: { keys: {} } };
    MinigameFramework.startMinigame('phone-chat-stub-test', null, { videoCall: true });
    MinigameFramework.endMinigame(false, null);
    assert.deepEqual(calls.slice(0, 2), [['start', 'phone-chat-stub-test', true], ['end', true]]);
});

test('trigger: handleObjectInteraction asks for the use pose before the interaction runs', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const body = src.slice(src.indexOf('export function handleObjectInteraction('));
    const hook = body.indexOf('window.playerPoses?.use?.(sprite)');
    assert.ok(hook > 0, 'the hook is in handleObjectInteraction');
    assert.ok(hook < body.indexOf("emit('object_interacted'"), 'before the interaction event');
    assert.ok(hook > body.indexOf('maybeInteractionWarning(sprite)'), 'after the warning gate');
});

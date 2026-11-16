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
const { PlayerPoses, installPlayerPoses, isPhoneScene, playerPoseKey, USE_MS, DRINK_MS, PHONE_CLOSE_MS, PHONE_LEAD_MS } = await imp('systems/player-poses.js');

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

// ---- review fixes: walking at open, exclusions, drink in a chat, other minigames ----

test('phone opened while still moving: the pose arrives once the player stops, and the close pose follows', async () => {
    const { poses, player, scene } = rig();
    player.body.velocity.x = 80;
    const inst = {};
    assert.equal(poses.onMinigameStart('phone-chat', {}, inst), false, 'refused while walking');
    assert.notEqual(player.anims.currentAnim.key, 'pose_phone_south');
    poses.update();
    assert.notEqual(player.anims.currentAnim.key, 'pose_phone_south', 'still walking');
    player.body.velocity.x = 0;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'pose_phone_south');
    assert.equal(poses.cur.hold, true);
    assert.equal(poses.onMinigameEnd(inst), true);
    assert.equal(poses.phoneWanted, false);
    scene.time.now += PHONE_CLOSE_MS;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'idle-down');
});

test('phone minigame during which the pose never showed: no close pose', () => {
    const { poses, player } = rig();
    window.seating.isSeated = () => true;
    const inst = {};
    poses.onMinigameStart('phone-chat', {}, inst);
    poses.update();
    assert.equal(poses.cur, null);
    window.seating.isSeated = () => false;   // stood up just as it closed
    assert.equal(poses.onMinigameEnd(inst), false);
    assert.equal(poses.cur, null);
    assert.notEqual(player.anims.currentAnim.key, 'pose_phone_south');
});

test('use: only for world objects (not NPCs, chairs, swivel chairs, container sprites, or over a minigame)', () => {
    const cases = [
        ['npc', { _isNPC: true, npcId: 'a' }],
        ['swivel chair', { isSwivelChair: true }],
        ['temp sprite', { objectId: 'temp_container_item_3' }]
    ];
    for (const [label, sprite] of cases) {
        const r = rig();
        assert.equal(r.poses.use(sprite), false, label);
        assert.equal(r.played.length, 0, label);
    }
    let r = rig();
    const chair = { scenarioData: { type: 'chair' } };
    window.seating.isSeat = (s) => s === chair;
    assert.equal(r.poses.use(chair), false, 'seat');
    delete window.seating.isSeat;
    r = rig();
    window.MinigameFramework = { currentMinigame: {} };
    assert.equal(r.poses.use({ scenarioData: {} }), false, 'minigame open');
    delete window.MinigameFramework;
    assert.equal(r.poses.use({ scenarioData: {}, objectId: 'desk_1' }), true, 'a world object still does');
});

test('a drink during a phone chat: the phone pose comes back when the drink ends', () => {
    const { poses, player, scene } = rig();
    const inst = {};
    poses.onMinigameStart('phone-chat', {}, inst);
    assert.equal(poses.drink(), true);
    assert.equal(player.anims.currentAnim.key, 'pose_drink_south');
    scene.time.now += DRINK_MS;
    poses.update();
    assert.equal(player.anims.currentAnim.key, 'pose_phone_south', 'back at once, no idle frame between');
    assert.equal(poses.cur.hold, true);
    assert.equal(poses.onMinigameEnd(inst), true);
});

test('a use or drink pose clears when a non-phone minigame opens; a held phone does not', () => {
    let { poses, player } = rig();
    poses.drink();
    assert.equal(poses.onMinigameStart('pin', {}, {}), false);
    assert.equal(player.anims.currentAnim.key, 'idle-down');
    assert.equal(poses.cur, null);
    ({ poses, player } = rig());
    poses.onMinigameStart('phone-chat', {}, {});
    poses.onMinigameStart('notes', {}, {});
    assert.equal(player.anims.currentAnim.key, 'pose_phone_south');
});

// ---- the phone lead-in ----

function leadRig(opts) {
    const r = rig(opts);
    const timers = [];
    r.poses.timer = (fn, ms) => timers.push({ fn, ms });
    r.timers = timers;
    r.opened = 0;
    r.open = () => { r.opened++; return 'opened'; };
    return r;
}

test('openWithPhoneLead: the pose shows at once, the phone opens after PHONE_LEAD_MS', () => {
    const r = leadRig();
    assert.equal(PHONE_LEAD_MS, 300);
    assert.equal(r.poses.openWithPhoneLead(r.open), true);
    assert.equal(r.player.anims.currentAnim.key, 'pose_phone_south');
    assert.equal(r.opened, 0);
    assert.equal(r.timers.length, 1);
    assert.equal(r.timers[0].ms, PHONE_LEAD_MS);
    r.timers[0].fn();
    assert.equal(r.opened, 1);
    assert.equal(r.poses.leadPending, false);
    // The minigame opening turns the timed pose into the held one
    r.poses.onMinigameStart('phone-chat', {}, {});
    assert.equal(r.poses.cur.hold, true);
});

test('openWithPhoneLead: a second tap during the lead does not open twice', () => {
    const r = leadRig();
    r.poses.openWithPhoneLead(r.open);
    assert.equal(r.poses.openWithPhoneLead(r.open), true);
    assert.equal(r.timers.length, 1);
    r.timers[0].fn();
    assert.equal(r.opened, 1);
    // After it, a new tap works again
    assert.equal(r.poses.leadPending, false, 'the timer cleared it');
    window.MinigameFramework = undefined;
    r.poses.openWithPhoneLead(r.open);
    assert.equal(r.timers.length, 2);
});

test('openWithPhoneLead: another minigame opening during the lead wins', () => {
    const r = leadRig();
    r.poses.openWithPhoneLead(r.open);
    window.MinigameFramework = { currentMinigame: {} };
    r.timers[0].fn();
    delete window.MinigameFramework;
    assert.equal(r.opened, 0);
    assert.equal(r.poses.leadPending, false, 'the player can tap again');
});

test('openWithPhoneLead: a knock out during the lead drops the open', () => {
    const r = leadRig();
    r.poses.openWithPhoneLead(r.open);
    window.playerIsKnockedOut = () => true;
    r.timers[0].fn();
    assert.equal(r.opened, 0);
    assert.equal(r.poses.leadPending, false);
    window.playerIsKnockedOut = () => false;
});

test('openWithPhoneLead: scene gone or replaced during the lead drops the open', () => {
    let r = leadRig();
    r.poses.openWithPhoneLead(r.open);
    r.poses.dead = true;
    r.timers[0].fn();
    assert.equal(r.opened, 0);
    r = leadRig();
    r.poses.openWithPhoneLead(r.open);
    window.playerPoses = {};
    r.timers[0].fn();
    assert.equal(r.opened, 0);
});

test('openWithPhoneLead: no pose frames (or a blocked pose) opens at once, no timer', () => {
    let r = leadRig({ poseKeys: [] });
    assert.equal(r.poses.openWithPhoneLead(r.open), 'opened');
    assert.equal(r.opened, 1);
    assert.equal(r.timers.length, 0);
    assert.equal(r.poses.leadPending, false);
    r = leadRig();
    r.player.body.velocity.x = 80;   // walking: show is refused, the phone opens now
    assert.equal(r.poses.openWithPhoneLead(r.open), 'opened');
    assert.equal(r.timers.length, 0);
});

test('phoneLead: shows the pose for the existing wait, no callback', () => {
    const r = leadRig();
    assert.equal(r.poses.phoneLead(), true);
    assert.equal(r.player.anims.currentAnim.key, 'pose_phone_south');
    assert.equal(r.timers.length, 0);
    assert.equal(leadRig({ poseKeys: [] }).poses.phoneLead(), false);
});

test('lead-in call sites: interactions and barks (hard to drive alone, so source checks)', () => {
    const read = (f) => readFileSync(join(js, f), 'utf8');
    const inter = read('systems/interactions.js');
    assert.equal(inter.split('openWithPhoneLead(go)').length - 1, 2, 'both phone-object opens');
    assert.match(read('systems/npc-barks.js'), /openWithPhoneLead\(go\)/);
    // The ringer hook and the scripted-call site have behaviour tests below and in the ringer and queue suites
});

test('openWithPhoneLead: a minigame already open at the tap opens at once, no timer, held phone kept', () => {
    const r = leadRig();
    r.poses.onMinigameStart('phone-chat', {}, { id: 'a' });   // phone chat A is open
    assert.equal(r.poses.cur.hold, true);
    window.MinigameFramework = { currentMinigame: { id: 'a' } };
    try {
        assert.equal(r.poses.openWithPhoneLead(r.open), 'opened');
        assert.equal(r.opened, 1);
        assert.equal(r.timers.length, 0);
        assert.equal(r.poses.leadPending, false);
        assert.equal(r.poses.cur.hold, true, 'the held phone pose is not swapped for a timed one');
        r.poses.onMinigameEnd({ id: 'a' });
        r.poses.onMinigameStart('phone-chat', {}, { id: 'b' });   // the swap to B
        assert.equal(r.poses.cur.hold, true);
        assert.equal(r.poses.cur.name, 'phone');
    } finally { delete window.MinigameFramework; }
});

test('openWithPhoneLead: a different open during the lead replaces the pending one (newest wins)', () => {
    const r = leadRig();
    const ran = [];
    r.poses.openWithPhoneLead(() => ran.push('first'));
    assert.equal(r.poses.openWithPhoneLead(() => ran.push('second')), true);
    assert.equal(r.timers.length, 1, 'no second timer');
    r.timers[0].fn();
    assert.deepEqual(ran, ['second']);
});

test('a reused instance after a scene restart is alive again and its lead-in opens', () => {
    const r = leadRig();
    const handlers = {};
    r.scene.events = { once: (n, f) => { (handlers[n] ||= []).push(f); }, on() {} };
    window.playerPoses = null;
    const inst = installPlayerPoses(r.scene);
    assert.equal(window.playerPoses, inst);
    handlers.shutdown.forEach(f => f());
    assert.equal(inst.dead, true);
    inst.leadPending = true;   // as if a lead was pending at the shutdown
    assert.equal(installPlayerPoses(r.scene), inst, 'the same instance is reused');
    assert.equal(inst.dead, false);
    assert.equal(inst.leadPending, false);
    assert.equal(handlers.shutdown.length, 2, 'a fresh shutdown listener');
    const timers = [];
    inst.timer = (fn) => timers.push(fn);
    let opened = 0;
    inst.openWithPhoneLead(() => { opened++; });
    timers[0]();
    assert.equal(opened, 1);
});

test('no pose frames: a phone chat does no per-frame pose work', () => {
    const r = leadRig({ poseKeys: [] });
    let reads = 0;
    window.npcBehaviorManager = { get behaviors() { reads++; return new Map(); } };
    r.poses.onMinigameStart('phone-chat', {}, {});
    reads = 0;
    for (let i = 0; i < 10; i++) r.poses.update();
    assert.equal(reads, 0);
});

test('a direction without phone frames does not switch the pose off for the whole call', () => {
    const r = leadRig();
    r.player.direction = 'up';
    const had = r.poses.has.bind(r.poses);
    let missing = true;
    r.poses.has = (n) => (n === 'phone' && missing ? false : had(n));
    r.poses.onMinigameStart('phone-chat', {}, {});
    r.poses.update();
    assert.equal(r.poses.cur, null, 'no frames for this direction: no pose');
    assert.equal(r.poses.phoneWanted, true, 'still wanted');
    missing = false;
    r.poses.update();
    assert.equal(r.poses.cur?.name, 'phone', 'the pose comes back once the frames exist');
});

test('a reinstall cancels a queued lead timer and clears the phone state', () => {
    const r = leadRig();
    const handlers = [];
    r.scene.events = { once: (n, f) => { if (n === 'shutdown') handlers.push(f); }, on() {} };
    window.playerPoses = null;
    const inst = installPlayerPoses(r.scene);
    const timers = [];
    inst.timer = (fn, ms) => timers.push({ fn, ms });
    let opened = 0;
    inst.openWithPhoneLead(() => { opened++; });
    inst.onMinigameStart('phone-chat', {}, {});
    assert.equal(timers.length, 1);
    handlers.forEach(f => f());
    assert.equal(installPlayerPoses(r.scene), inst);
    assert.equal(inst.cur, null);
    assert.equal(inst.phoneScene, null);
    assert.equal(inst.phoneWanted, false);
    assert.equal(inst.phoneShown, false);
    // The stale timer fires with no new lead, then with a new lead pending
    timers[0].fn();
    assert.equal(opened, 0);
    let second = 0;
    inst.openWithPhoneLead(() => { second++; });
    assert.equal(timers.length, 2);
    timers[0].fn();
    assert.equal(second, 0, 'the stale timer does not run the new lead early');
    assert.equal(inst.leadPending, true);
    timers[1].fn();
    assert.equal(second, 1);
});

test('sprite swap with a phone held: the pose ends, the new atlas shows the phone again if it has frames', () => {
    const swap = (r) => { r.player.anims.play('idle-down'); };
    // The new atlas has no pose frames
    let r = leadRig();
    r.poses.onMinigameStart('phone-chat', {}, {});
    assert.equal(r.poses.cur.name, 'phone');
    r.scene.anims.get = () => null;
    swap(r);
    r.poses.update(); r.poses.update();
    assert.equal(r.poses.cur, null);
    assert.equal(r.player.anims.currentAnim.key, 'idle-down');
    // The new atlas has the frames: the phone comes back
    r = leadRig();
    r.poses.onMinigameStart('phone-chat', {}, {});
    swap(r);
    r.poses.update(); r.poses.update();
    assert.equal(r.poses.cur?.name, 'phone');
    assert.equal(r.poses.cur.hold, true);
    assert.equal(r.player.anims.currentAnim.key, 'pose_phone_south');
});

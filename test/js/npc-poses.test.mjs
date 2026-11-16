// NPC poses (systems/npc-poses.js; docs/achitechture/NPC_POSES.md): the pose mapping, machine
// recognition, per-NPC limits, seated precedence, blockers, and the postupdate pass with a
// stub scene: a pose shows only when the atlas has its frames, and the idle comes back after.
// Run with: node test/js/npc-poses.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { wantedPose, isMachine, npcAllows, poseBlocked, poseAnimKey, NpcPoses, USE_LEAD_MS, SETTLE_MS, POSE_RECHECK_MS,
    facesWithin, facesObject, directionTo }
    from '../../public/break_escape/js/systems/npc-poses.js';

const using = (need, extra = {}) => ({ job: { need, kind: 'use', phase: 'using', targetId: 't', ...extra }, call: null });
const obj = (type, affordance) => ({ affordance, _sprite: { scenarioData: { type }, texture: { key: type } } });

test('drink needs: drink, after a short use at a machine', () => {
    const coffee = obj('coffee_station1', { satisfies: 'caffeine' });
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 0 }), 'use');
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: USE_LEAD_MS + 1 }), 'drink');
    const cooler = obj('water_cooler1', { satisfies: ['thirst', 'social'] });
    assert.equal(wantedPose({ s: using('thirst'), obj: cooler, usingMs: USE_LEAD_MS }), 'drink');
    // A mug left on a table is no machine: drink from the start
    const mug = obj('mug', { satisfies: 'caffeine' });
    assert.equal(wantedPose({ s: using('caffeine'), obj: mug, usingMs: 0 }), 'drink');
    // A social use of the cooler (owner call): drink, after the short use while facing it
    assert.equal(wantedPose({ s: using('social'), obj: cooler, usingMs: 99999 }), 'drink');
    assert.equal(wantedPose({ s: using('social'), obj: cooler, usingMs: 0 }), 'use');
    // A social use of something with no drink: none
    assert.equal(wantedPose({ s: using('social'), obj: obj('leather_sofa1', { satisfies: ['rest', 'social'] }) }), null);
});

test('use only while facing the object: turned away, drink for a drink, else none', () => {
    const coffee = obj('coffee_station1', { satisfies: 'caffeine' });
    const cooler = obj('water_cooler1', { satisfies: ['thirst', 'social'] });
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 0, facing: false }), 'drink');
    assert.equal(wantedPose({ s: using('social'), obj: cooler, usingMs: 0, facing: false }), 'drink');
    assert.equal(wantedPose({ s: using('hunger'), obj: obj('photocopier1', {}), facing: false }), null);
    assert.equal(wantedPose({ s: using('hunger'), obj: obj('photocopier1', {}), facing: true }), 'use');
    assert.equal(facesWithin('down', 'down'), true);
    assert.equal(facesWithin('down-left', 'down'), true);
    assert.equal(facesWithin('right', 'up-right'), true);
    assert.equal(facesWithin('up-right', 'right'), true);
    assert.equal(facesWithin('left', 'down'), false);
    assert.equal(facesWithin('up', 'down'), false);
    assert.equal(directionTo(0, 10), 'down');
    assert.equal(directionTo(-10, -9), 'up-left');
    const npcAt = (x, y, direction) => ({ direction, sprite: { x, y } });
    const machine = { affordance: {}, _sprite: { x: 100, y: 140 } };   // below the NPC
    assert.equal(facesObject(npcAt(100, 100, 'down'), machine), true);
    assert.equal(facesObject(npcAt(100, 100, 'down-right'), machine), true);
    assert.equal(facesObject(npcAt(100, 100, 'up'), machine), false, 'turned to a colleague behind');
    assert.equal(facesObject(npcAt(100, 100, 'left'), machine), false, 'turned to the player');
    assert.equal(facesObject(npcAt(100, 100, 'up'), null), true, 'no object: no facing rule');
});

test('a microwave meal: use briefly while facing, then nothing', () => {
    const mw = obj('microwave1', { satisfies: 'hunger' });
    assert.equal(wantedPose({ s: using('hunger'), obj: mw, usingMs: 0 }), 'use');
    assert.equal(wantedPose({ s: using('hunger'), obj: mw, usingMs: USE_LEAD_MS + 1 }), null);
});

test('other machines: use; non-machines: none', () => {
    for (const type of ['photocopier1', 'printer2', 'keypad', 'wall_socket', 'hot_water_boiler1', 'shredder1']) {
        assert.equal(wantedPose({ s: using('rest'), obj: obj(type, { satisfies: 'rest' }) }), 'use', type);
    }
    for (const type of ['qdc_fridge1', 'leather_sofa1', 'pc', 'cake1', 'coffee_cups1', 'glass_coffee_table1']) {
        assert.equal(wantedPose({ s: using('hunger'), obj: obj(type, { satisfies: 'hunger' }) }), null, type);
    }
});

test('machine recognition: the explicit field wins over type and texture', () => {
    assert.equal(isMachine(obj('photocopier1', {})), true);
    assert.equal(isMachine(obj('photocopier1', { machine: false })), false);
    assert.equal(isMachine(obj('crate', { machine: true })), true);
    assert.equal(isMachine({ affordance: {}, _sprite: { scenarioData: { type: 'custom', officeType: 'copier' } } }), true);
    assert.equal(isMachine({ affordance: {}, _sprite: { scenarioData: {}, texture: { key: 'vending1' } } }), true);
    assert.equal(isMachine(null), false);
    // A machine word inside a non-machine name
    assert.equal(isMachine(obj('coffee_cups1', {})), false);
    assert.equal(isMachine(obj('glass_coffee_table1', {})), false);
    // The resolved office preset wins over the name
    const withPreset = (preset, type) => ({ affordance: {}, _sprite: { scenarioData: { type }, _officeAffordance: { preset } } });
    for (const p of ['coffee', 'kettle', 'cooler', 'microwave', 'copier', 'shredder']) assert.equal(isMachine(withPreset(p, 'x')), true, p);
    for (const p of ['filing', 'post_tray', 'desk_pc', 'fridge', 'sofa', 'desk_phone']) assert.equal(isMachine(withPreset(p, 'printer_shelf')), false, p);
});

test('affordance.pose overrides the mapping, false turns it off', () => {
    assert.equal(wantedPose({ s: using('hunger'), obj: obj('crate', { pose: 'use' }) }), 'use');
    assert.equal(wantedPose({ s: using('caffeine'), obj: obj('coffee_station1', { satisfies: 'caffeine', pose: false }) }), null);
    assert.equal(wantedPose({ s: using('caffeine'), obj: obj('coffee_station1', { satisfies: 'caffeine', pose: 'phone' }) }), 'phone');
    assert.equal(wantedPose({ s: using('caffeine'), obj: obj('crate', { pose: 'wave' }) }), null);
});

test('desk phone calls: phone, for the owner and an answering colleague', () => {
    assert.equal(wantedPose({ s: { job: null, call: { phoneId: 'p', until: 9 } } }), 'phone');
    assert.equal(wantedPose({ s: using(null, { phone: true }), obj: obj('desk_phone', {}) }), 'phone');
    // Walking to a ringing phone is not yet a call
    assert.equal(wantedPose({ s: { job: { phone: true, phase: 'goto_target' }, call: null } }), null);
});

test('no pose for visits, self (mobile) uses, the own desk, errands, or no job', () => {
    const cooler = obj('water_cooler1', { satisfies: 'thirst' });
    for (const extra of [{ kind: 'visit' }, { kind: 'self' }, { socialDesk: true }, { errand: true }]) {
        assert.equal(wantedPose({ s: using('thirst', extra), obj: cooler, usingMs: 9999 }), null, JSON.stringify(extra));
    }
    assert.equal(wantedPose({ s: { job: null, call: null } }), null);
    assert.equal(wantedPose({ s: using('thirst', { phase: 'goto_target' }), obj: cooler }), null);
    assert.equal(wantedPose({ s: null }), null);
});

test('seated wins, and per-NPC limits', () => {
    const coffee = obj('coffee_station1', { satisfies: 'caffeine' });
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 9999, seated: true }), null);
    assert.equal(wantedPose({ s: { job: null, call: { phoneId: 'p' } }, seated: true }), null);
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 9999, npc: { poses: false } }), null);
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 9999, npc: { poses: ['phone'] } }), null);
    // use not allowed at the machine: straight to drink
    assert.equal(wantedPose({ s: using('caffeine'), obj: coffee, usingMs: 0, npc: { poses: ['drink'] } }), 'drink');
    assert.equal(npcAllows({}, 'drink'), true);
    assert.equal(npcAllows(null, 'use'), true);
});

test('blockers: seat, movement, chase, chat, combat animations', () => {
    const sprite = { anims: { currentAnim: { key: 'npc-a-idle-down' }, isPlaying: true } };
    assert.equal(poseBlocked({ sprite }), false);
    assert.equal(poseBlocked({ sprite, _seat: {} }), true);
    assert.equal(poseBlocked({ sprite, _seatMove: {} }), true);
    assert.equal(poseBlocked({ sprite, isMoving: true }), true);
    assert.equal(poseBlocked({ sprite, currentState: 'face_player' }), false, 'facing the player keeps the pose');
    assert.equal(poseBlocked({ sprite, currentState: 'chase' }), true);
    assert.equal(poseBlocked({ sprite }, { inChat: true }), true);
    assert.equal(poseBlocked({ sprite }, { ko: true }), true);
    assert.equal(poseBlocked({ sprite: { anims: { currentAnim: { key: 'npc-a-attack-down' }, isPlaying: true } } }), true);
    assert.equal(poseBlocked(null), true);
});

// A stub world: one needs NPC at a coffee machine (the machine just below it), a behaviour
// whose playAnimation copies the real one's dedupe (lastAnimationKey and flipX), and a scene
// whose anims hold the idle keys and whatever pose keys the test gives it. starts counts
// sprite.play calls (each one fires Phaser's animation start event).
function rig({ poseKeys = [], seat = null, settleMs = 0 } = {}) {
    const played = [];
    const sprite = {
        x: 100, y: 100, flipX: false, destroyed: false,
        anims: { currentAnim: { key: 'npc-ana-idle-down' }, isPlaying: true },
        play(key) { this.anims.currentAnim = { key }; played.push(key); },
        setFlipX(v) { this.flipX = v; }
    };
    const idleKeys = ['down', 'up', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'].map(d => `npc-ana-idle-${d}`);
    const has = (k) => poseKeys.includes(k) || idleKeys.includes(k);
    const scene = { anims: { get: (k) => (has(k) ? { frames: [{}] } : null), exists: has }, time: { now: 0 } };
    const b = {
        sprite, scene, direction: 'down', isMoving: false, currentState: 'idle', _seat: seat, lastAnimationKey: 'npc-ana-idle-down',
        playAnimation(state, dir) {
            if (this._seat) return;
            const k = `npc-ana-${state}-${dir}`;
            if (this.lastAnimationKey !== k || this.sprite.flipX !== false) {
                if (scene.anims.exists(k)) { this.sprite.play(k, true); this.lastAnimationKey = k; }
            }
            this.sprite.setFlipX(false);
        },
        // NPCBehavior's idle state: playAnimation('idle', direction) on every behaviour tick
        tick() { this.playAnimation('idle', this.direction); }
    };
    const s = using('caffeine', { targetId: 'coffee' });
    let lookups = 0;
    const machine = obj('coffee_station1', { satisfies: 'caffeine' });
    machine._sprite.x = 100; machine._sprite.y = 140;
    let chatting = false;
    const sys = {
        clockMs: 0,
        states: new Map([['ana', s]]),
        world: { getObject: () => { lookups++; return machine; }, inChatWith: () => chatting }
    };
    globalThis.npcNeedsSystem = sys;
    globalThis.npcBehaviorManager = { getBehavior: () => b };
    globalThis.npcManager = { getNPC: () => ({ id: 'ana' }) };
    globalThis.npcHostileSystem = null;
    globalThis.gameScenario = {};
    const poses = new NpcPoses(scene);
    poses.settleMs = settleMs;
    return {
        poses, b, s, sys, played, scene,
        lookups: () => lookups, chat: (v) => { chatting = v; }
    };
}

test('pass: use, then drink, then the idle back when the use ends', () => {
    const { poses, b, s, sys, played } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'down')] });
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down');
    assert.equal(b.lastAnimationKey, 'npc-ana-idle-down', 'left on the idle the behaviour would play');
    sys.clockMs = USE_LEAD_MS + 10;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_drink-down');
    poses.update();
    assert.equal(played.filter(k => k.includes('drink')).length, 1, 'a held pose is not replayed every frame');
    s.job = null;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down');
    assert.equal(poses.active.size, 0);
    assert.deepEqual(poses.log.map(e => e.pose), ['use', 'drink', null]);
});

test('pass: an atlas without pose frames is never touched', () => {
    const { poses, b, played } = rig({ poseKeys: [] });
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down');
    assert.equal(played.length, 0);
    assert.equal(poses.active.size, 0);
});

test('pass: only drink frames present: the drink shows at once, use is skipped silently', () => {
    const { poses, b } = rig({ poseKeys: [poseAnimKey('ana', 'drink', 'down')] });
    poses.update();
    // use wanted for the first seconds, but the atlas lacks it: the idle stays until drink
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down');
});

test('pass: a seated NPC keeps its sit frame; walking off drops the pose without an idle replay', () => {
    const keys = [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'down')];
    const seated = rig({ poseKeys: keys, seat: { chair: 'c' } });
    seated.poses.update();
    assert.equal(seated.played.length, 0);
    const r = rig({ poseKeys: keys });
    r.poses.update();
    r.b.isMoving = true;
    r.b.sprite.play('npc-ana-walk-left');
    r.poses.update();
    assert.equal(r.b.sprite.anims.currentAnim.key, 'npc-ana-walk-left');
    assert.equal(r.poses.active.size, 0);
});

test('pass: facing follows the behaviour direction', () => {
    const { poses, b, sys } = rig({ poseKeys: [poseAnimKey('ana', 'drink', 'down'), poseAnimKey('ana', 'drink', 'up-left')] });
    sys.clockMs = USE_LEAD_MS + 1;
    poses.update();
    poses.update();
    b.direction = 'up-left';
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_drink-up-left');
});

test('pass: behaviour ticks between passes start no animation while a pose holds', () => {
    const { poses, b, played } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down')] });
    poses.update();
    const before = played.length;
    for (let i = 0; i < 100; i++) { b.tick(); poses.update(); }   // 5 s of 50 ms behaviour ticks
    assert.equal(played.length, before, 'no idle restart and no pose replay');
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down');
    // A turn replays the idle once in the behaviour and the pose once in the pass
    b.direction = 'down-left';
    b.tick();
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down-left', 'no down-left use frame: idle');
});

test('pass: turned away from the machine, the use is dropped (drink once its frames exist)', () => {
    const keys = [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'up')];
    const { poses, b } = rig({ poseKeys: keys });
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down');
    b.direction = 'up';   // paired with a colleague behind
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_drink-up');
});

test('pass: the object is looked up once per job, not every frame', () => {
    const { poses, s, lookups } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down')] });
    for (let i = 0; i < 20; i++) poses.update();
    assert.equal(lookups(), 1);
    s.job = { ...s.job, phase: 'queued' };
    for (let i = 0; i < 20; i++) poses.update();
    assert.equal(lookups(), 1, 'no lookup outside `using`');
    s.job = { ...s.job, phase: 'using' };
    poses.update();
    assert.equal(lookups(), 2, 'a new job looks up again');
});

test('pass: a conversation pauses the use lead; the idle shows during it', () => {
    const keys = [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'down')];
    const { poses, b, sys, chat } = rig({ poseKeys: keys });
    poses.update();
    sys.clockMs = 1000;
    poses.update();
    chat(true);
    sys.clockMs = 10000;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down', 'chat drops the pose');
    chat(false);
    sys.clockMs = 10100;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down', 'the lead resumes where it stopped');
    sys.clockMs = 10000 + USE_LEAD_MS;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_drink-down');
});

test('pass: the first pose waits SETTLE_MS (no flash before sitting)', () => {
    const { poses, b, scene, played } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down')], settleMs: SETTLE_MS });
    poses.update();
    scene.time.now = SETTLE_MS - 50;
    poses.update();
    assert.equal(played.length, 0);
    b._seat = { chair: 'c' };   // seating sat it within the tick
    scene.time.now = SETTLE_MS + 50;
    poses.update();
    assert.equal(played.length, 0, 'never posed');
    b._seat = null;
    poses.update();
    scene.time.now += SETTLE_MS;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down');
});

test('pass: officeVisuals false, hostility, KO, chat, leaving states and a destroyed sprite', () => {
    const keys = [poseAnimKey('ana', 'use', 'down')];
    let r = rig({ poseKeys: keys });
    globalThis.gameScenario = { officeVisuals: false };
    r.poses.update();
    assert.equal(r.played.length, 0, 'office visuals off: no pose');
    for (const [label, set] of [
        ['hostile', () => { globalThis.npcHostileSystem = { isNPCHostile: () => true, isNPCKO: () => false }; }],
        ['ko', () => { globalThis.npcHostileSystem = { isNPCHostile: () => false, isNPCKO: () => true }; }],
        ['chat', (x) => x.chat(true)]
    ]) {
        r = rig({ poseKeys: keys });
        r.poses.update();
        assert.equal(r.b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down', label);
        set(r);
        r.poses.update();
        assert.equal(r.b.sprite.anims.currentAnim.key, 'npc-ana-idle-down', label);
        assert.equal(r.poses.active.size, 0, label);
    }
    r = rig({ poseKeys: keys });
    r.poses.update();
    r.sys.states.delete('ana');
    r.poses.update();
    assert.equal(r.poses.active.size, 0);
    assert.equal(r.poses.useStart.size, 0, 'stale use records go');
    assert.equal(r.b.sprite.anims.currentAnim.key, 'npc-ana-idle-down');
    r = rig({ poseKeys: keys });
    r.poses.update();
    r.b.sprite.destroyed = true;
    r.poses.update();
    assert.equal(r.poses.active.size, 0);
});

test('an atlas without pose frames: checked once, no per-frame pose work, looked at again later and on a new texture', () => {
    const { poses, b, scene, lookups } = rig({ poseKeys: [] });
    b.sprite.texture = { key: 'ana_v1' };
    let gets = 0;
    const get = scene.anims.get;
    scene.anims.get = (k) => { gets++; return get(k); };
    poses.update();
    const first = gets;
    assert.ok(first > 0, 'the first frame checks the atlas');
    for (let i = 0; i < 5; i++) poses.update();
    assert.equal(gets, first, 'no pose lookups while the no is fresh');
    assert.equal(lookups(), 0, 'no object lookup for an NPC that cannot pose');
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down');
    // A new texture is checked at once
    b.sprite.texture = { key: 'ana_v2' };
    poses.update();
    assert.ok(gets > first, 'a sprite swap checks the new atlas');
    // Frames made later are found after the recheck time
    const useKey = poseAnimKey('ana', 'use', 'down');
    scene.anims.get = (k) => (k === useKey || get(k) ? { frames: [{}] } : null);
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-idle-down', 'still the cached no');
    scene.time.now = POSE_RECHECK_MS + 1;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, useKey);
});

test('frames that appear mid-use keep the use clock: the lead is not restarted', () => {
    const { poses, b, sys, scene } = rig({ poseKeys: [] });
    b.sprite.texture = { key: 'ana_v1' };
    poses.update();
    sys.clockMs = USE_LEAD_MS + 10;   // the use has run past its lead with no frames
    poses.update();
    const drinkKey = poseAnimKey('ana', 'drink', 'down');
    const get = scene.anims.get;
    scene.anims.get = (k) => (k === drinkKey || k === poseAnimKey('ana', 'use', 'down') || get(k) ? { frames: [{}] } : null);
    scene.time.now = POSE_RECHECK_MS + 1;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, drinkKey, 'straight to the drink, not a fresh use lead');
});

// ── pose fixes: turn to the object on arrival; a colleague on a phone call stands ──────────
test('pass: arriving turned away from the machine, the NPC turns to it and the use pose shows', () => {
    const keys = [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'up'), poseAnimKey('ana', 'drink', 'down')];
    const { poses, b, sys, played } = rig({ poseKeys: keys });
    b.direction = 'up';   // came in facing away; the machine is below
    poses.update();
    assert.equal(b.direction, 'down', 'turned to face the machine');
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down', 'the use lead plays');
    sys.clockMs = USE_LEAD_MS + 10;
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_drink-down');
    // turned away later (paired with a colleague behind): not turned back again
    b.direction = 'up';
    poses.update();
    assert.equal(b.direction, 'up');
    assert.equal(played.filter(k => k.includes('pose_use')).length, 1);
});

test('pass: the turn uses the object centre, eight directions (down-right of the NPC)', () => {
    const keys = [poseAnimKey('ana', 'use', 'down-right')];
    const { poses, b } = rig({ poseKeys: keys });
    // The machine's centre is down-right of the NPC, its x/y (top-left) is not
    const sp = globalThis.npcNeedsSystem.world.getObject()._sprite;
    sp.x = 80; sp.y = 90; sp.getCenter = () => ({ x: 139, y: 137 });
    b.direction = 'up-left';
    poses.update();
    assert.equal(b.direction, 'down-right');
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down-right');
});

test('pass: an NPC with no use frames still turns but shows nothing; a chat-blocked NPC does not turn', () => {
    const { poses, b, chat } = rig({ poseKeys: [poseAnimKey('ana', 'wave', 'down')] });
    b.direction = 'up';
    chat(true);
    poses.update();
    assert.equal(b.direction, 'up', 'in a conversation: left alone');
});

test('pass: a colleague answering a phone turns to it and plays pose_phone', () => {
    const keys = [poseAnimKey('ana', 'phone', 'down')];
    const { poses, b, s } = rig({ poseKeys: keys });
    s.job = { need: null, kind: 'use', phase: 'using', targetId: 'phone', phone: true };
    s.call = { phoneId: 'phone', until: 9999 };
    b.direction = 'left';
    poses.update();
    assert.equal(b.direction, 'down', 'facing the phone');
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_phone-down');
    assert.deepEqual(poses.log.map(e => e.pose), ['phone']);
});

test('pass: a seated colleague on the phone keeps the sit frame (the seat is dropped by seating, not here)', () => {
    const { poses, b, s } = rig({ poseKeys: [poseAnimKey('ana', 'phone', 'down')], seat: { chair: {} } });
    s.job = { need: null, kind: 'use', phase: 'using', targetId: 'phone', phone: true };
    s.call = { phoneId: 'phone', until: 9999 };
    b.direction = 'left';
    poses.update();
    assert.equal(b.direction, 'left');
    assert.equal(poses.active.size, 0);
});

test('pass: the turn holds face_player off until the pose is released', async () => {
    const keys = [poseAnimKey('ana', 'use', 'down')];
    const { poses, b, s } = rig({ poseKeys: keys });
    b.direction = 'up';
    poses.update();
    assert.equal(b._poseHoldFacing, true);
    // face_player (executeState) would turn the NPC back to the player every tick; it must not
    globalThis.window ||= globalThis;
    const { NPCBehavior } = await import('../../public/break_escape/js/systems/npc-behavior.js');
    {
        const fake = { config: { facePlayer: true }, _poseHoldFacing: true, direction: 'down',
            canSeePlayerToFace: () => true, npcBodyPos: () => ({ x: 0, y: 0 }), calculateDirection: () => 'up',
            playAnimation() {} };
        NPCBehavior.prototype.facePlayer.call(fake, { x: 0, y: -50 });
        assert.equal(fake.direction, 'down', 'held');
        fake._poseHoldFacing = false;
        NPCBehavior.prototype.facePlayer.call(fake, { x: 0, y: -50 });
        assert.equal(fake.direction, 'up', 'free again');
    }
    s.job = null;
    poses.update();
    assert.equal(b._poseHoldFacing, false);
});

test('pass: an owner answering its own desk phone (a call, no job) turns to the phone and plays pose_phone', () => {
    const { poses, b, s, sys } = rig({ poseKeys: [poseAnimKey('ana', 'phone', 'down')] });
    const phone = obj('phone1', {});
    phone._sprite.x = 100; phone._sprite.y = 140;
    sys.world.getObject = () => phone;
    s.job = null;
    s.call = { phoneId: 'phone', until: 9999 };
    b.direction = 'left';
    poses.update();
    assert.equal(b.direction, 'down');
    assert.equal(b._poseHoldFacing, true);
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_phone-down');
    b.direction = 'left';   // turned away mid-call: not turned back
    poses.update();
    assert.equal(b.direction, 'left');
});

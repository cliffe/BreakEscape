// NPC poses (systems/npc-poses.js; docs/achitechture/NPC_POSES.md): the pose mapping, machine
// recognition, per-NPC limits, seated precedence, blockers, and the postupdate pass with a
// stub scene: a pose shows only when the atlas has its frames, and the idle comes back after.
// Run with: node test/js/npc-poses.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { wantedPose, isMachine, npcAllows, poseBlocked, poseAnimKey, NpcPoses, USE_LEAD_MS }
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
    // At the cooler for social only: no drink, but the cooler is still a machine
    assert.equal(wantedPose({ s: using('social'), obj: cooler, usingMs: 99999 }), 'use');
});

test('other machines: use; non-machines: none', () => {
    for (const type of ['photocopier1', 'printer2', 'microwave1', 'vending_machine', 'keypad', 'wall_socket', 'hot_water_boiler1']) {
        assert.equal(wantedPose({ s: using('hunger'), obj: obj(type, { satisfies: 'hunger' }) }), 'use', type);
    }
    for (const type of ['qdc_fridge1', 'leather_sofa1', 'pc', 'cake1']) {
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

test('blockers: seat, movement, face-player, chat, combat animations', () => {
    const sprite = { anims: { currentAnim: { key: 'npc-a-idle-down' }, isPlaying: true } };
    assert.equal(poseBlocked({ sprite }), false);
    assert.equal(poseBlocked({ sprite, _seat: {} }), true);
    assert.equal(poseBlocked({ sprite, _seatMove: {} }), true);
    assert.equal(poseBlocked({ sprite, isMoving: true }), true);
    assert.equal(poseBlocked({ sprite, currentState: 'face_player' }), true);
    assert.equal(poseBlocked({ sprite }, { inChat: true }), true);
    assert.equal(poseBlocked({ sprite }, { ko: true }), true);
    assert.equal(poseBlocked({ sprite: { anims: { currentAnim: { key: 'npc-a-attack-down' }, isPlaying: true } } }), true);
    assert.equal(poseBlocked(null), true);
});

// A stub world: one needs NPC at a coffee machine, a behaviour with a sprite, and a scene
// whose anims hold whatever pose keys the test gives it.
function rig({ poseKeys = [], seat = null } = {}) {
    const played = [];
    const sprite = {
        flipX: false, destroyed: false,
        anims: { currentAnim: { key: 'npc-ana-idle-down' }, isPlaying: true },
        play(key) { this.anims.currentAnim = { key }; played.push(key); },
        setFlipX(v) { this.flipX = v; }
    };
    const b = {
        sprite, direction: 'down', isMoving: false, currentState: 'idle', _seat: seat, lastAnimationKey: 'npc-ana-idle-down',
        playAnimation(state, dir) { if (this._seat) return; const k = `npc-ana-${state}-${dir}`; this.sprite.play(k); this.lastAnimationKey = k; }
    };
    const scene = { anims: { get: (k) => (poseKeys.includes(k) ? { frames: [{}] } : null) } };
    const s = using('caffeine', { targetId: 'coffee' });
    const sys = {
        clockMs: 0,
        states: new Map([['ana', s]]),
        world: { getObject: () => obj('coffee_station1', { satisfies: 'caffeine' }), inChatWith: () => false }
    };
    globalThis.npcNeedsSystem = sys;
    globalThis.npcBehaviorManager = { getBehavior: () => b };
    globalThis.npcManager = { getNPC: () => ({ id: 'ana' }) };
    globalThis.npcHostileSystem = null;
    return { poses: new NpcPoses(scene), b, s, sys, played };
}

test('pass: use, then drink, then the idle back when the use ends', () => {
    const { poses, b, s, sys, played } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'drink', 'down')] });
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-down');
    assert.equal(b.lastAnimationKey, 'npc-ana-pose_use-down');
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
    const { poses, b } = rig({ poseKeys: [poseAnimKey('ana', 'use', 'down'), poseAnimKey('ana', 'use', 'up-left')] });
    poses.update();
    b.direction = 'up-left';
    poses.update();
    assert.equal(b.sprite.anims.currentAnim.key, 'npc-ana-pose_use-up-left');
});

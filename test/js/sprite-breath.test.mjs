// Engine breathing (systems/sprite-breath.js; D24 in docs/achitechture/NPC_POSES.md): the seated
// output is pinned call for call against a trace recorded from seating.js before the helpers
// moved (fixtures/seated-breath-trace.json), and pose frames and opt-in standing idles breathe
// through npc-poses.js.
// Run with: node test/js/sprite-breath.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.window = globalThis;
window.matchMedia = () => ({ matches: false });
const seating = await import('../../public/break_escape/js/systems/seating.js');
const breath = await import('../../public/break_escape/js/systems/sprite-breath.js');
const { NpcPoses, poseAnimKey } = await import('../../public/break_escape/js/systems/npc-poses.js');

// The script the fixture was recorded with: every call the breathing makes, in order.
function runTrace(updateBreath, endBreath) {
    const calls = [];
    const rec = (who, name, args) => calls.push([who, name, JSON.parse(JSON.stringify(args))]);
    // A 80x80 frame: figure rows 20..70 opaque in column 40 ('sit'); 'sit2' rows 10..60
    const figures = { sit: [20, 70], sit2: [10, 60] };
    window.game = { textures: {
        getFrame: (k, f) => (figures[f] ? { width: 80, height: 80 } : null),
        getPixelAlpha: (x, y, k, f) => { const r = figures[f]; return r && x === 40 && y >= r[0] && y <= r[1] ? 255 : 0; }
    } };
    let now = 0;
    const scene = { time: { get now() { return now; } }, add: { image(x, y, key, frame) { rec('scene', 'add.image', [x, y, key, frame]); return mkImage(key, frame); } } };
    function mkImage(key, frame) {
        const img = { texture: { key }, frame: { name: frame }, isTinted: false };
        for (const m of ['setCrop', 'setOrigin', 'setScale', 'setFlip', 'setPosition', 'setAlpha', 'setDepth', 'setVisible', 'clearTint', 'destroy'])
            img[m] = (...a) => { rec('img', m, a); if (m === 'clearTint') img.isTinted = false; return img; };
        img.setTexture = (k, f) => { rec('img', 'setTexture', [k, f]); img.texture = { key: k }; img.frame = { name: f }; return img; };
        img.setTint = (...a) => { rec('img', 'setTint', a); img.isTinted = true; return img; };
        return img;
    }
    const handlers = {};
    const sprite = {
        active: true, visible: true, scene, texture: { key: 'atlas' }, frame: { name: 'sit', width: 80, height: 80 },
        originX: 0.5, originY: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false, x: 100, y: 200, alpha: 1, depth: 5,
        isTinted: false, tintTopLeft: 0, tintTopRight: 0, tintBottomLeft: 0, tintBottomRight: 0, postFX: { list: [] },
        setCrop(...a) { rec('sprite', 'setCrop', a); return this; },
        once(ev, fn) { rec('sprite', 'once', [ev]); handlers[ev] = fn; }
    };
    const origRandom = Math.random;
    Math.random = () => 0.25;
    try {
        const holder = {};
        const step = (t, on) => { now = t; rec('t', String(t), [on]); updateBreath(holder, sprite, on); };
        for (let t = 0; t <= 7200; t += 100) step(t, true);
        step(7300, false);
        sprite.flipX = true; sprite.x = 120; sprite.scaleX = sprite.scaleY = 2;
        for (let t = 7400; t <= 11000; t += 200) step(t, true);
        sprite.frame = { name: 'sit2', width: 80, height: 80 };
        sprite.isTinted = true; sprite.tintTopLeft = 0xff0000;
        for (let t = 11200; t <= 14600; t += 200) step(t, true);
        sprite.isTinted = false;
        sprite.postFX.list = [1];
        step(14800, true);
        sprite.postFX.list = [];
        sprite.visible = false; step(15000, true); sprite.visible = true;
        for (let t = 15200; t <= 18000; t += 400) step(t, true);
        endBreath(holder, sprite);
        rec('holder', 'breath', [holder.breath ?? 'gone']);
    } finally { Math.random = origRandom; }
    return calls;
}

test('seated breathing is unchanged by the move to sprite-breath.js (recorded trace, call for call)', () => {
    const want = JSON.parse(readFileSync(new URL('./fixtures/seated-breath-trace.json', import.meta.url), 'utf8'));
    const got = runTrace(seating.updateSeatedBreath, seating.endSeatedBreath);
    assert.equal(got.length, want.length);
    assert.equal(JSON.stringify(got), JSON.stringify(want));
});

test('seating.js still exports breathRows and breathDown (the same functions)', () => {
    assert.equal(seating.breathRows, breath.breathRows);
    assert.equal(seating.breathDown, breath.breathDown);
});

// One NPC on a stub scene whose atlas has pose frames 70 rows tall (rows 10..80 of 96).
let clock = 0;
function npcRig({ poseKeys = [], seat = null, npc = { id: 'ana' } } = {}) {
    const calls = [];
    window.game = { textures: {
        getFrame: () => ({ width: 80, height: 96 }),
        getPixelAlpha: (x, y) => (x === 40 && y >= 10 && y <= 80 ? 255 : 0)
    } };
    const images = [];
    const scene = {
        time: { get now() { return clock; } },
        anims: { get: (k) => (poseKeys.includes(k) ? { frames: [{}] } : null) },
        add: { image(x, y, key, frame) {
            const img = { texture: { key }, frame: { name: frame }, isTinted: false, destroyed: false, visible: false, y: 0 };
            for (const m of ['setCrop', 'setOrigin', 'setScale', 'setFlip', 'setAlpha', 'setDepth', 'clearTint', 'setTint']) img[m] = () => img;
            img.setPosition = (px, py) => { img.y = py; return img; };
            img.setVisible = (v) => { img.visible = v; return img; };
            img.setTexture = (k, f) => { img.texture = { key: k }; img.frame = { name: f }; return img; };
            img.destroy = () => { img.destroyed = true; };
            images.push(img);
            return img;
        } }
    };
    const sprite = {
        active: true, visible: true, destroyed: false, scene, texture: { key: 'mow' }, frame: { name: 'breathing-idle_south_frame_000', width: 80, height: 96 },
        originX: 0.5, originY: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false, x: 100, y: 200, alpha: 1, depth: 5,
        isTinted: false, postFX: { list: [] }, crop: null,
        anims: { currentAnim: { key: 'npc-ana-idle-down' }, isPlaying: true },
        play(key) { this.anims.currentAnim = { key }; this.frame = { ...this.frame, name: key.replace('npc-ana-', '') }; },
        setFlipX(v) { this.flipX = v; },
        setCrop(...a) { this.crop = a.length ? a : null; calls.push(a); return this; },
        once() {}
    };
    const b = {
        sprite, direction: 'down', isMoving: false, currentState: 'idle', _seat: seat, lastAnimationKey: 'npc-ana-idle-down',
        playAnimation(state, dir) { if (this._seat) return; const k = `npc-ana-${state}-${dir}`; this.sprite.play(k); this.lastAnimationKey = k; }
    };
    const s = { job: { need: 'thirst', kind: 'use', phase: 'using', targetId: 'cooler' }, call: null };
    window.npcNeedsSystem = {
        clockMs: 0, states: new Map([['ana', s]]),
        world: { getObject: () => ({ affordance: { satisfies: 'thirst' }, _sprite: { scenarioData: { type: 'mug' }, texture: { key: 'mug' } } }), inChatWith: () => false }
    };
    window.npcBehaviorManager = { behaviors: new Map([['ana', b]]), getBehavior: (id) => (id === 'ana' ? b : null) };
    window.npcManager = { getNPC: () => npc };
    window.npcHostileSystem = null;
    return { poses: new NpcPoses(scene), b, s, sprite, images, calls };
}
const realRandom = Math.random;
const DOWN = 2000, UP = 500;   // phase 0: head and shoulders down from 1800 to 3240 ms of each 3600
const cut = 10 + Math.round(breath.BREATH_CUT * 70);

test('a pose frame breathes: cropped under the shoulders and the top drawn 1px lower, then up again', () => {
    Math.random = () => 0;
    try {
        const { poses, sprite, images } = npcRig({ poseKeys: [poseAnimKey('ana', 'drink', 'down')] });
        clock = UP; poses.update();
        assert.equal(sprite.anims.currentAnim.key, 'npc-ana-pose_drink-down');
        assert.equal(sprite.crop, null, 'up: no crop');
        clock = DOWN; poses.update();
        assert.deepEqual(sprite.crop, [0, cut, 80, 96 - cut]);
        assert.equal(images.length, 1);
        assert.equal(images[0].visible, true);
        assert.equal(images[0].y, sprite.y + 1);
        clock = 3600 + UP; poses.update();
        assert.equal(sprite.crop, null);
        assert.equal(images[0].visible, false);
    } finally { Math.random = realRandom; }
});

test('the pose ending mid-breath clears the crop and the image, and the idle does not breathe by default', () => {
    Math.random = () => 0;
    try {
        const { poses, s, sprite, images } = npcRig({ poseKeys: [poseAnimKey('ana', 'drink', 'down')] });
        clock = DOWN; poses.update();
        assert.notEqual(sprite.crop, null);
        s.job = null; poses.update();
        assert.equal(sprite.anims.currentAnim.key, 'npc-ana-idle-down');
        assert.equal(sprite.crop, null);
        assert.equal(images[0].destroyed, true);
        assert.equal(poses.breath.size, 0);
        clock = 3600 + DOWN; poses.update();
        assert.equal(sprite.crop, null, 'standing idle breathing is off by default');
    } finally { Math.random = realRandom; }
});

test('standing idles breathe when the NPC opts in (idleBreathing) or with the debug switch; never while walking', () => {
    Math.random = () => 0;
    try {
        const opted = npcRig({ npc: { id: 'ana', idleBreathing: true } });
        opted.s.job = null;
        clock = DOWN; opted.poses.update();
        assert.deepEqual(opted.sprite.crop, [0, cut, 80, 96 - cut]);
        opted.b.isMoving = true; opted.sprite.anims.currentAnim = { key: 'npc-ana-walk-down' };
        opted.poses.update();
        assert.equal(opted.sprite.crop, null, 'walking ends it');
        assert.equal(opted.poses.breath.size, 0);
        const all = npcRig({});
        all.s.job = null;
        all.poses.idleBreathing = true;
        all.poses.update();
        assert.notEqual(all.sprite.crop, null);
    } finally { Math.random = realRandom; }
});

test('a pose that ends because the NPC sat down hands the crop back to seating', () => {
    Math.random = () => 0;
    try {
        const { poses, b, sprite } = npcRig({ poseKeys: [poseAnimKey('ana', 'drink', 'down')] });
        clock = DOWN; poses.update();
        assert.notEqual(sprite.crop, null);
        b._seat = { breath: { img: null, phase: 0, crop: 'sit_south_frame_000|40' } };
        poses.update();
        assert.equal(b._seat.breath.crop, null, 'seating sets its own crop again next frame');
        assert.equal(poses.breath.size, 0);
    } finally { Math.random = realRandom; }
});

test('an atlas without pose frames: nothing breathes, nothing is cropped', () => {
    const { poses, sprite, calls } = npcRig({});
    clock = DOWN; poses.update();
    assert.equal(sprite.crop, null);
    assert.equal(calls.length, 0);
});

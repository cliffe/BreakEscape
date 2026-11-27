// NPC torch origin (npc-los.js torchHandOffset, npcTorchOrigin, losOriginMode): the
// beam (lighting.js stampNpcTorches) starts at the NPC's right hand, and while the
// torch is held the NPC's line of sight and drawn cone start there too.
// Run with: node --test test/js/npc-torch-origin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.Phaser = {
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
        RadToDeg: (r) => r * 180 / Math.PI,
        DegToRad: (d) => d * Math.PI / 180
    },
    Geom: { Point: class { constructor(x, y) { this.x = x; this.y = y; } } }
};
globalThis.window = {};

const los = await import(dataUrl(readFileSync(join(sys, 'npc-los.js'), 'utf8')));
const { torchHandOffset, npcTorchOrigin, losOriginMode, losTorchOrigin, npcTorchHeld, stepTorchAim, isInLineOfSight, drawLOSCone } = los;

const FACING = { east: 0, 'south-east': 45, south: 90, 'south-west': 135, west: 180, 'north-west': 225, north: 270, 'north-east': 315 };
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// Frame pixels (80x80, centre 40,40) of the hand, for reading against the art
const framePt = (deg) => { const o = torchHandOffset(deg); return { x: 40 + o.dx, y: 40 + o.dy }; };

test('per facing: the right hand, at hand height, between the head and the feet (row 69)', () => {
    for (const [name, deg] of Object.entries(FACING)) {
        const p = framePt(deg);
        assert.ok(p.y > 45 && p.y < 56, `${name}: hand row ${p.y.toFixed(1)} is waist/hand height`);
        assert.ok(p.x > 26 && p.x < 54, `${name}: hand column ${p.x.toFixed(1)} is within the figure`);
    }
    // facing south the right hand is on the viewer's left; north, the viewer's right
    assert.ok(framePt(FACING.south).x < 33, 'south: viewer\'s left');
    assert.ok(framePt(FACING.north).x > 47, 'north: viewer\'s right');
    // facing east the right hand is on the near side: lower than the far-side hand facing west
    assert.ok(framePt(FACING.east).y > framePt(FACING.west).y + 3, 'east hand lower (near side) than west (far side)');
    // facing east/west the hand sits a little forward of the body axis
    assert.ok(framePt(FACING.east).x > 40, 'east: held forward');
    assert.ok(framePt(FACING.west).x < 40, 'west: held forward, just behind the body');
});

test('mirroring: opposite facings mirror through the body axis', () => {
    const s = torchHandOffset(FACING.south), n = torchHandOffset(FACING.north);
    assert.ok(near(s.dx, -n.dx), 'south and north mirror left/right');
    const e = torchHandOffset(FACING.east), w = torchHandOffset(FACING.west);
    assert.ok(near(e.dx, -w.dx), 'east and west mirror forward/back');
    // left/right mirror pairs (the image flipped about the vertical axis): the hand
    // is on the other hand's side, so x mirrors and the row stays only for N/S
    const se = torchHandOffset(FACING['south-east']), sw = torchHandOffset(FACING['south-west']);
    assert.ok(se.dy > sw.dy, 'facing south-east the right hand is in front (lower) than facing south-west (behind)');
    const ne = torchHandOffset(FACING['north-east']), nw = torchHandOffset(FACING['north-west']);
    assert.ok(ne.dy > nw.dy, 'facing north-east the right hand is in front (lower) than facing north-west (behind)');
});

test('the hand moves continuously with the aim, so a smoothed turn never jumps', () => {
    let prev = torchHandOffset(0);
    for (let a = 1; a <= 360; a++) {
        const o = torchHandOffset(a);
        assert.ok(Math.hypot(o.dx - prev.dx, o.dy - prev.dy) < 0.5, `step at ${a} degrees`);
        prev = o;
    }
    // a patrol about-turn (east to west) through the smoother: at most a few px per frame
    // the hand sweeps round the body over several frames: no frame covers more than a
    // third of the path (the first frame of an about-turn turns the aim 45 degrees)
    let aim = 0, last = torchHandOffset(aim), worst = 0, path = 0;
    for (let f = 0; f < 60; f++) {
        aim = stepTorchAim(aim, 180);
        const o = torchHandOffset(aim);
        const step = Math.hypot(o.dx - last.dx, o.dy - last.dy);
        worst = Math.max(worst, step);
        path += step;
        last = o;
    }
    assert.ok(worst < 8, `largest per-frame hand move ${worst.toFixed(2)} px`);
    assert.ok(worst / path < 0.34, `largest frame is ${(100 * worst / path).toFixed(0)}% of the sweep`);
    assert.ok(near(aim, 180, 0.01), 'settles on the target');
});

test('offsets scale with the frame (legacy 64 px sprites)', () => {
    const a = torchHandOffset(90, 80), b = torchHandOffset(90, 64);
    assert.ok(near(b.dx, a.dx * 0.8) && near(b.dy, a.dy * 0.8));
});

const sprite = (x, y, extra = {}) => ({ x, y, displayHeight: 80, visible: true, getCenter: () => ({ x, y }), body: { center: { x, y: y + 31 } }, ...extra });

test('npcTorchOrigin: sprite centre plus the hand offset, at the fresh smoothed aim or else the facing', () => {
    const npc = { id: 'g', facingDirection: 0, behavior: { torch: true }, _sprite: sprite(100, 100) };
    const o = npcTorchOrigin(npc, 1000);
    const e = torchHandOffset(0);
    assert.ok(near(o.x, 100 + e.dx) && near(o.y, 100 + e.dy), 'facing');
    npc._torchAim = { angle: 90, at: 900 };
    const s = torchHandOffset(90);
    const o2 = npcTorchOrigin(npc, 1000);
    assert.ok(near(o2.x, 100 + s.dx) && near(o2.y, 100 + s.dy), 'fresh aim');
    const o3 = npcTorchOrigin(npc, 5000);
    assert.ok(near(o3.x, o.x) && near(o3.y, o.y), 'stale aim: back to the facing');
});

test('origin mode: torch by default while held, body without a torch, los.origin overrides both', () => {
    const torch = { behavior: { torch: true }, los: {} };
    const none = { behavior: {}, los: {} };
    assert.equal(losOriginMode(torch), 'torch');
    assert.equal(losOriginMode(none), 'body');
    assert.equal(losOriginMode(torch, { origin: 'body' }), 'body', 'override: body');
    assert.equal(losOriginMode(none, { origin: 'torch' }), 'torch', 'override: torch without a torch');
    assert.equal(losOriginMode(torch, { origin: 'nonsense' }), 'torch', 'unknown value: default');
});

test('a conditional torch is held only while its condition holds (asked of the lighting system)', () => {
    const npc = { behavior: { torch: { condition: 'globalVars.night' } } };
    assert.equal(npcTorchHeld(npc), false, 'no lighting system: not held');
    window.lightingSystem = { npcTorchHeld: () => true };
    assert.equal(npcTorchHeld(npc), true);
    window.lightingSystem = { npcTorchHeld: () => false };
    assert.equal(npcTorchHeld(npc), false);
    assert.equal(losOriginMode(npc), 'body', 'torch off: body origin');
    delete window.lightingSystem;
});

test('LOS from the torch hand: range and angle measured from the hand, not the sprite centre', () => {
    // Facing south, the hand is ~10 px to the viewer's left of the body and ~13 px down.
    const mk = (cfg) => ({ id: 'g', facingDirection: 90, behavior: { torch: true }, los: cfg, _sprite: sprite(100, 100) });
    const cfg = { enabled: true, range: 100, angle: 50 };
    const hand = losTorchOrigin(mk(cfg), cfg);
    assert.ok(hand.x < 95 && hand.y > 110, 'hand is left and below the centre');
    // A point straight below the hand at ~95 px: in range from the hand, out of range from the centre
    const target = { x: hand.x, y: hand.y + 95 };
    assert.equal(isInLineOfSight(mk(cfg), target, cfg), true, 'torch origin sees it');
    assert.equal(isInLineOfSight(mk({ ...cfg, origin: 'body' }), target, { ...cfg, origin: 'body' }), false, 'body origin: too far');
    // A point well left of the body axis, level with the hand + 40 px: inside the cone from the
    // hand, outside it from the centre
    const side = { x: hand.x - 15, y: hand.y + 40 };
    assert.equal(isInLineOfSight(mk(cfg), side, cfg), true, 'torch origin: inside the cone');
    const npcNoTorch = { id: 'g', facingDirection: 90, behavior: {}, los: cfg, _sprite: sprite(100, 100) };
    assert.equal(isInLineOfSight(npcNoTorch, side, cfg), false, 'no torch: body origin, outside the cone');
});

test('occlusion is tested from the torch hand when sight starts there', () => {
    const seen = [];
    window.npcSightOcclusion = { isSightClear: (npc, target, from) => { seen.push(from); return true; } };
    const cfg = { enabled: true, range: 200, angle: 120 };
    const npc = { id: 'g', facingDirection: 90, behavior: { torch: true }, los: cfg, _sprite: sprite(100, 100) };
    isInLineOfSight(npc, { x: 100, y: 160 }, cfg);
    const hand = losTorchOrigin(npc, cfg);
    assert.ok(seen[0] && near(seen[0].x, hand.x) && near(seen[0].y, hand.y), 'from = hand');
    isInLineOfSight({ ...npc, behavior: {} }, { x: 100, y: 160 }, cfg);
    assert.equal(seen[1], undefined, 'no torch: feet (occlusion module default)');
    delete window.npcSightOcclusion;
});

test('drawn cone starts at the hand while the torch is held, at the feet otherwise', () => {
    const lines = [];
    const g = {
        lineStyle() { return g; }, strokeCircle() {}, strokePoints() {}, fillStyle() {}, fillPoints() {},
        lineBetween(x1, y1) { lines.push({ x: x1, y: y1 }); }, setDepth() { return g; }, setAlpha() { return g; }
    };
    const scene = { add: { graphics: () => g } };
    const cfg = { enabled: true, range: 120, angle: 50 };
    const npc = { id: 'g', facingDirection: 0, behavior: { torch: true }, los: cfg, _sprite: sprite(100, 100) };
    drawLOSCone(scene, npc, cfg);
    const hand = losTorchOrigin(npc, cfg);
    assert.ok(near(lines[0].x, hand.x) && near(lines[0].y, hand.y), 'facing line from the hand');
    lines.length = 0;
    drawLOSCone(scene, { ...npc, behavior: {} }, cfg);
    assert.ok(near(lines[0].x, 100) && near(lines[0].y, 131), 'no torch: from the feet');
});

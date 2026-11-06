// Seating (systems/seating.js): chair facings, frame orders and seat lookup.
// The live paths (player sit/roll/stand/jump, placed and needs NPCs, chair fetching)
// are proved by headless runs of scenarios/test_seating.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const seating = await import('../../public/break_escape/js/systems/seating.js');
const { COMPASS, seatSpec, chairFacing, snapFacing, isStaticSeatTexture } = seating;

/** A swivel chair sprite as rooms.js builds it. */
function swivel(base, frame) {
    return { isSwivelChair: true, originalTexture: `${base}${frame}`, currentFrame: frame - 1, texture: { key: `${base}${frame}` } };
}

test('rotation sheets map to facings per chair (they do not share one order)', () => {
    const cases = {
        // clockwise from south
        'chair-exec-rotate': ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'],
        // anticlockwise from south
        'chair-grey-4-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        'chair-darkgray-1-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        'chair-white-2-rotate': ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'],
        // clockwise from north
        'chair-white-1-rotate': ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
    };
    for (const [base, facings] of Object.entries(cases)) {
        facings.forEach((f, i) => assert.equal(chairFacing(swivel(base, i + 1)), f, `${base}${i + 1}`));
    }
});

test('only known chairs are seats; trolleys and carts are not', () => {
    assert.equal(seatSpec(swivel('chair-grey-1-rotate', 1))?.kind, 'swivel');
    assert.equal(seatSpec(swivel('crash-cart-rotate', 1)), null);
    assert.equal(seatSpec(swivel('wheelchair-rotate', 2)), null);
    assert.equal(seatSpec({ texture: { key: 'hospital_chair_north' } })?.facing, 'north');
    assert.equal(seatSpec({ texture: { key: 'chair-waiting-left-1' } })?.facing, 'west');
    assert.equal(seatSpec({ texture: { key: 'leather_sofa1' } })?.places.length, 2); // two places
    assert.equal(seatSpec({ texture: { key: 'm10_steel_chair1' } })?.facing, 'south');
    assert.equal(seatSpec({ texture: { key: 'm10_steel_bench1' } }), null); // a workbench
    assert.equal(seatSpec({ texture: { key: 'lecture_seat_row1' } }), null);
    assert.ok(isStaticSeatTexture('exec_chair_back1'));
    assert.ok(!isStaticSeatTexture('chair-grey-1')); // a static image that becomes a swivel chair
});

test('a static image placed as a swivel chair is not also a static seat', () => {
    // exec_chair_back1 used as a texture by a swivel sprite must read as swivel
    const s = { isSwivelChair: true, originalTexture: 'chair-exec-rotate5', currentFrame: 4, texture: { key: 'exec_chair_back1' } };
    assert.equal(seatSpec(s)?.kind, 'swivel');
});

test('snapFacing keeps a valid facing and picks the nearest otherwise', () => {
    assert.equal(snapFacing('east'), 'east');
    assert.equal(snapFacing('north-east', ['north', 'south']), 'north');
    assert.equal(snapFacing('south-west', ['south', 'west', 'east']), 'south');
    assert.equal(snapFacing('west', ['north', 'south']), 'north'); // a tie keeps list order
    assert.equal(COMPASS.length, 8);
});

// ── slice 2 (OFFICE_LIFE_PLAN 2.11): seated through an own-desk use ────────────
test('needsStop: an own-desk work use keeps the home stop in every phase and on the returning tick after it', async () => {
    const { NPCNeedsSystem, NEEDS_TICK_MS } = await import('../../public/break_escape/js/systems/npc-needs.js');
    const { makeWorld } = await import('./fixtures/needs-stub-world.mjs');
    const rec = { id: 'clerk', needsHome: 'own_pc', needs: { work: { decayPerMin: 20, urgentAt: 40, initial: 30, jitterPct: 0 } } };
    const w = makeWorld({ npcs: { clerk: { pos: { x: 100, y: 100 }, rec } },
        objects: [{ id: 'own_pc', x: 100, y: 68, affordance: { satisfies: 'work', restores: 60, useSeconds: 10 } }] });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const prev = window.npcManager;
    window.npcManager = { getNPC: id => (id === 'clerk' ? rec : null) };
    try {
        const seen = new Set();
        for (let i = 0; i < (10 * 60000) / NEEDS_TICK_MS; i++) {
            sys.step(NEEDS_TICK_MS);
            const ns = sys.states.get('clerk');
            seen.add(ns.mode + (ns.job ? ':' + ns.job.phase : ''));
            const stop = seating.needsStop(ns);
            assert.ok(stop, `null stop at tick ${sys.tickCount} (${ns.mode}${ns.job ? ' ' + ns.job.phase : ''})`);
            assert.equal(stop.key, 'at:own_pc');
            assert.equal(stop.post, true);
        }
        assert.ok(seen.has('job:using') && seen.has('returning') && seen.has('idle'), [...seen].join(','));
        assert.ok(sys.getLog().filter(e => e.ev === 'used' && e.target === 'own_pc').length >= 2);
    } finally {
        window.npcManager = prev;
    }
});

test('needsStop: a real trip still unseats (null while walking out and back)', () => {
    const prev = window.npcManager;
    window.npcManager = { getNPC: () => ({ needsHome: 'own_pc' }) };
    try {
        const job = (phase, targetId) => ({ kind: 'use', phase, targetId, need: 'caffeine' });
        assert.equal(seating.needsStop({ npcId: 'c', mode: 'job', atPost: false, job: job('goto_target', 'coffee') }), null);
        assert.equal(seating.needsStop({ npcId: 'c', mode: 'returning', atPost: false, job: null }), null);
        assert.equal(seating.needsStop({ npcId: 'c', mode: 'job', atPost: false, job: job('using', 'coffee') }).key, 'at:coffee');
        // Own desk picked while away (walking back to it): not at the post, so no stop until using
        assert.equal(seating.needsStop({ npcId: 'c', mode: 'job', atPost: false, job: job('goto_target', 'own_pc') }), null);
        assert.equal(seating.needsStop({ npcId: 'c', mode: 'job', atPost: true, job: job('goto_target', 'own_pc') }).key, 'at:own_pc');
    } finally {
        window.npcManager = prev;
    }
});

test('compassToward: screen offsets map to the right facing (east is +x, south is +y)', () => {
    const cases = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1],
                    'south-east': [1, 1], 'north-east': [1, -1], 'south-west': [-1, 1], 'north-west': [-1, -1] };
    for (const [facing, [dx, dy]] of Object.entries(cases)) assert.equal(seating.compassToward(dx, dy), facing);
});

// ---- typing bob (OFFICE_LIFE_PLAN 2.12, slice 3)

function seatedSprite() {
    return {
        x: 0, y: 0, displayOriginX: 40, displayOriginY: 40, texture: { key: 'bob_test_atlas' },
        frame: { name: '' }, anims: { isPlaying: false }, body: null, moves: 0,
        setPosition(x, y) { this.x = x; this.y = y; this.moves++; },
        setFrame(n) { this.frame.name = n; }, setDepth(d) { this.depth = d; }
    };
}

test('poseSprite: dy 1 places the sprite one pixel lower, and the next frame keeps it there while the bob is due', () => {
    const chair = { x: 100, y: 200, depth: 230 };
    const seat = { kind: 'static', seat: [16, 20], facing: 'south' };
    const a = seatedSprite(), b = seatedSprite();
    seating.poseSprite(a, chair, seat, 'south', 0, 0);
    seating.poseSprite(b, chair, seat, 'south', 0, 1);
    assert.equal(b.y, a.y + 1);
    assert.equal(b.x, a.x);
    const moves = b.moves;
    seating.poseSprite(b, chair, seat, 'south', 0, 1);
    assert.equal(b.y, a.y + 1, 'held while the bob is due');
    assert.equal(b.moves, moves, 'not moved again');
    seating.poseSprite(b, chair, seat, 'south', 0, 0);
    assert.equal(b.y, a.y, 'back down');
});

test('typingBob: only a work use in its using phase, every 600 ms of the needs clock; off under reduced motion or officeVisuals false', () => {
    const working = { mode: 'job', job: { kind: 'use', need: 'work', phase: 'using' } };
    assert.equal(seating.typingBob(working, 0), 0);
    assert.equal(seating.typingBob(working, 599), 0);
    assert.equal(seating.typingBob(working, 600), 1);
    assert.equal(seating.typingBob(working, 1250), 0);
    assert.equal(seating.typingBob(working, 600, { reduced: true }), 0);
    assert.equal(seating.typingBob(working, 600, { off: true }), 0);
    assert.equal(seating.typingBob({ mode: 'job', job: { kind: 'use', need: 'work', phase: 'goto_target' } }, 600), 0);
    assert.equal(seating.typingBob({ mode: 'job', job: { kind: 'use', need: 'caffeine', phase: 'using' } }, 600), 0);
    assert.equal(seating.typingBob({ mode: 'idle', job: null }, 600), 0);
    assert.equal(seating.typingBob(null, 600), 0);
});

// ── a needs NPC back at its post sits from its home cell, not where the walk stopped ──────
// Live, lab_physical_pentest game 624: Melanie (pierce) came back from coffee and stopped at
// (235,172), within the behaviour layer's one-tile arrival tolerance of her home cell (204,172).
// Her static chair's foot is (200,186): 37.7 px from her feet, past NEAR_CHAIR (36), so she
// stood at her desk for good. Measured from the home cell it is 14.6 px.

test('needsSeatRef: home cell at the post within 1.5 tiles; the feet elsewhere', () => {
    const home = { x: 204, y: 172 };
    assert.deepEqual(seating.needsSeatRef({ x: 235, y: 172 }, { post: true }, home), home);
    assert.deepEqual(seating.needsSeatRef({ x: 235, y: 172 }, { post: false }, home), { x: 235, y: 172 });
    assert.deepEqual(seating.needsSeatRef({ x: 300, y: 172 }, { post: true }, home), { x: 300, y: 172 }, 'moved away by a script');
    assert.deepEqual(seating.needsSeatRef({ x: 235, y: 172 }, { post: true }, null), { x: 235, y: 172 });
});

function labSeatRig(feetX) {
    const chair = { x: 192, y: 160, width: 16, height: 26, depth: 186, active: true, objectId: 'pierce_chair',
        texture: { key: 'aw_chair_north_charcoal1' }, scenarioData: { id: 'pierce_chair' } };
    const pc = { id: 'staff_pc_2', roomId: 'open_plan', x: 204, y: 140, affordance: { satisfies: 'work', useFrom: { dx: 0, dy: 1 } } };
    const sprite = {
        x: feetX, y: 172, displayOriginX: 40, displayOriginY: 40, scaleX: 1, scaleY: 1,
        texture: { key: 'lab_worker' }, frame: { name: 'breathing-idle_east_frame_000' }, anims: { isPlaying: false },
        body: { offset: { x: 30, y: 35 }, width: 20, height: 10, checkCollision: { none: false }, immovable: false,
            setVelocity() {}, reset(x, y) { sprite.x = x; sprite.y = y; } },
        setPosition(x, y) { this.x = x; this.y = y; }, setFrame(n) { this.frame.name = n; }, setDepth(d) { this.depth = d; }
    };
    const behavior = { npcId: 'pierce', roomId: 'open_plan', sprite, isMoving: false, playAnimation() {} };
    const ns = { npcId: 'pierce', mode: 'idle', atPost: true, job: null, home: { x: 204, y: 172, roomId: 'open_plan', objectId: 'staff_pc_2' } };
    const saved = {};
    for (const k of ['npcNeedsSystem', 'npcManager', 'rooms', 'game', 'pathfindingManager']) saved[k] = window[k];
    window.npcNeedsSystem = { states: new Map([['pierce', ns]]), world: { npcStatus: () => ({}), getObject: id => (id === 'staff_pc_2' ? pc : null), inChatWith: () => false }, clockMs: 0 };
    window.npcManager = { getNPC: id => (id === 'pierce' ? { needsHome: 'staff_pc_2' } : null) };
    window.rooms = { open_plan: { objects: { pierce_chair: chair } } };
    window.game = { textures: { get: () => ({ has: () => true }) } };
    window.pathfindingManager = null;
    const restore = () => { for (const [k, v] of Object.entries(saved)) window[k] = v; };
    return { chair, sprite, behavior, restore };
}

test('needs NPC back at its post sits in its own chair though the walk stopped a tile short', () => {
    const rig = labSeatRig(235 - 0);   // body centre x: sprite.x + (30 - 40) + 10 = sprite.x
    try {
        assert.equal(seating.updateSeatedNPC(rig.behavior, { x: 320, y: 191 }), true, 'seated');
        assert.equal(rig.chair.seatedBy, 'pierce');
        assert.equal(rig.sprite.frame.name, 'sit_north_frame_000');
    } finally { rig.restore(); }
});

test('breathDown: head and shoulders are down for 40% of each 3.6s breath, offset by phase', () => {
    let down = 0;
    for (let t = 0; t < 3600; t += 10) if (seating.breathDown(t, 0)) down++;
    assert.equal(down, 144); // 1440 ms of 3600
    assert.equal(seating.breathDown(1700, 0), false);
    assert.equal(seating.breathDown(1800, 0), true);
    assert.equal(seating.breathDown(1700, 100), true); // phase shifts the cycle
    assert.equal(seating.breathDown(3600 + 1800, 0), true); // repeats
});

test('breathRows: the cut sits 42% down the opaque figure; blank or tiny frames do not breathe', () => {
    const prev = window.game;
    // a 10x80 frame, opaque on rows 20..70
    window.game = { textures: {
        getFrame: (key, name) => (name === 'empty' || name === 'sit' ? { width: 10, height: 80 } : null),
        getPixelAlpha: (x, y, key, name) => (name === 'sit' && y >= 20 && y <= 70 ? 255 : 0)
    } };
    try {
        assert.deepEqual(seating.breathRows('stub_a', 'sit'), { top: 20, cut: 20 + Math.round(0.42 * 50) });
        assert.equal(seating.breathRows('stub_a', 'empty'), null);
        assert.equal(seating.breathRows('stub_a', 'missing'), null);
    } finally {
        window.game = prev;
    }
});

// ── seat box slice 1: the stand-up order (docs/achitechture/SEAT_BOX_PLAN.md 1.3) ──────────

test('seatedBlock: the driver always takes the chair body (the 12 x 8 experiment toggle is gone)', () => {
    const body = { width: 18, height: 8 };
    assert.deepEqual(seating.seatedBlock(body), { w: 18, h: 8 });
    assert.deepEqual(seating.seatedBlock(body, { w: 8, h: 6 }), { w: 18, h: 8 }, 'a second argument is ignored');
});

test('nothing in the engine sets window.__seatBox (test-only: false selects the old stand-up code)', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = new URL('../../public/break_escape/js/', import.meta.url).pathname;
    const hits = [];
    const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.js') && /__seatBox\s*=(?!=)/.test(readFileSync(p, 'utf8'))) hits.push(p); } };
    walk(root);
    assert.deepEqual(hits, []);
    assert.equal(window.__seatBox, undefined);
});

test('pickStandSpot: compass, flood, approach, then stay seated or forced', () => {
    // A desk box at x 48..126, y 264..280; the chair's castor base at (87, 260), facing south.
    const desk = { x0: 48, x1: 126, y0: 264, y1: 280 };
    const inDesk = (x, y, hw, hh) => x + hw > desk.x0 && x - hw < desk.x1 && y + hh > desk.y0 && y - hh < desk.y1;
    const at = { cx: 87, cy: 260, facing: 'south', reach: 20 };
    const world = (blocked = () => false, floodCells = []) => ({
        cellNear: (x, y) => (blocked(x, y) || inDesk(x, y, 0, 0) ? null : { x, y }),
        boxClear: (x, y) => !blocked(x, y) && !inDesk(x, y, 9, 5),
        lineClear: (x, y) => [0.25, 0.5, 0.75].every(k => !inDesk(87 + (x - 87) * k, 260 + (y - 260) * k, 1, 1)),
        flood: n => floodCells.slice(0, n * 4)
    });
    // 1. open floor behind the desk: a compass spot on the near side, never south of the desk
    const a = seating.pickStandSpot(at, world());
    assert.equal(a.via, 'compass');
    assert.ok(a.y < desk.y0 - 5, `landed at y ${a.y}, desk back edge ${desk.y0}`);
    // 2. every compass spot blocked (a wall to the north, the desk to the south): flood fill
    const wallN = (x, y) => y < 252;
    const b = seating.pickStandSpot(at, world(wallN, [{ x: 120, y: 256 }, { x: 140, y: 256 }]));
    assert.equal(b.via, 'flood');
    // 3. nothing near: the approach point
    const shut = () => true;
    const c = seating.pickStandSpot({ ...at, approach: { x: 87, y: 230 } }, { ...world(shut), boxClear: (x, y) => y === 230 });
    assert.deepEqual([c.x, c.y, c.via], [87, 230, 'approach']);
    // 4. a voluntary jump-off with nowhere clear stays seated
    assert.equal(seating.pickStandSpot({ ...at, approach: { x: 87, y: 230 }, forced: false }, world(shut)), null);
    // 5. forced, the 8-cell flood with the box check only (the line may cross something)
    const far = Array.from({ length: 40 }, (_, i) => ({ x: 40 + i, y: 200 }));
    const f = seating.pickStandSpot({ ...at, approach: { x: 87, y: 230 } },
        { ...world(shut), boxClear: (x, y) => x === 60 && y === 200, lineClear: () => false, flood: n => (n === 8 ? far : []) });
    assert.deepEqual([f.x, f.y, f.via], [60, 200, 'forced-flood']);
    // 6. forced (KO, punch, chair gone) with nothing in the flood: the approach point even if blocked
    const e = seating.pickStandSpot({ ...at, approach: { x: 87, y: 230 } }, world(shut));
    assert.deepEqual([e.x, e.y, e.via], [87, 230, 'forced-approach']);
    // the south cell across the desk is never returned by any branch
    for (const r of [a, b, c, e]) assert.ok(!(r.y > desk.y1), JSON.stringify(r));
});

test('pickStandSpot: a voluntary stand takes the approach only within 32 px and line clear (R2 m4)', () => {
    const at = { cx: 87, cy: 260, facing: 'south', reach: 23 };
    const io = (lineOk) => ({ cellNear: () => null, boxClear: () => true, lineClear: () => lineOk, flood: () => [] });
    const near = { x: 87, y: 230 }, far = { x: 87, y: 220 };   // 30 px, 40 px
    assert.equal(seating.pickStandSpot({ ...at, approach: near, forced: false }, io(true)).via, 'approach');
    assert.equal(seating.pickStandSpot({ ...at, approach: far, forced: false }, io(true)), null, '40 px away: refused');
    assert.equal(seating.pickStandSpot({ ...at, approach: near, forced: false }, io(false)), null, 'across a desk: refused');
    assert.equal(seating.pickStandSpot({ ...at, approach: far }, io(false)).via, 'approach', 'forced takes it');
});

// ── a rig that drives the real sit, roll, jump-off and standUp against fake bodies ──────

const iter = list => ({ iterate(fn) { list.forEach(fn); } });
const sBody = (left, top, w, h, name = 'desk') => ({ left, top, right: left + w, bottom: top + h, enable: true,
    immovable: false, physicsType: 1, gameObject: { name } });
const DESK1 = () => sBody(48, 264, 78, 16, 'desk1');   // desk1: F 280, foot 16

/** A dynamic body that tracks a sprite (position from the sprite only on reset/update). */
function dynBody(go, ox, oy, w, h) {
    const b = {
        gameObject: go, offset: { x: ox, y: oy }, width: w, height: h, enable: true, immovable: false, physicsType: 0,
        velocity: { x: 0, y: 0 }, checkCollision: { none: false },
        position: { x: 0, y: 0, copy(p) { this.x = p.x; this.y = p.y; } },
        prev: { copy() {} }, prevFrame: { copy() {} },
        get left() { return this.position.x; }, get top() { return this.position.y; },
        get right() { return this.position.x + this.width; }, get bottom() { return this.position.y + this.height; },
        setVelocity(x, y) { this.velocity.x = x; this.velocity.y = y; },
        setSize(nw, nh) { this.width = nw; this.height = nh; },
        setOffset(x, y) { this.offset.x = x; this.offset.y = y; },
        reset(x, y) { go.x = x; go.y = y; },
        updateFromGameObject() { this.position.x = go.x + this.offset.x; this.position.y = go.y + this.offset.y; },
        updateCenter() {}
    };
    b.updateFromGameObject();
    return b;
}

const ORDER_CCW_S = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];

/**
 * castor: the chair's castor base; facing: the chair's facing when the player sits; approach:
 * where the player stands to sit; statics: extra static bodies (desks, walls).
 */
async function standRig({ castor, facing, approach, statics = [] }) {
    const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const { installEasyStar } = await import('./fixtures/world-grid-fixture.mjs');
    installEasyStar();
    const dynamics = [];
    const fakeImg = () => { const o = { texture: { key: 'x' }, frame: { name: '' }, depth: 0, x: 0, y: 0,
        anims: { stop() {} }, play() {}, setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; },
        setDepth(d) { o.depth = d; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; }, setCrop() { return o; },
        setTexture() { return o; }, setFrame(n) { o.frame.name = n; return o; }, destroy() { o.destroyed = true; } }; return o; };
    const scene = {
        time: { delayedCall() {}, now: 0 },
        physics: { world: { bounds: { x: 0, y: 0, width: 320, height: 400 }, staticBodies: iter(statics), bodies: iter(dynamics) } },
        add: { sprite: () => fakeImg(), image: () => fakeImg() },
        textures: { exists: () => false },
        tweens: { addCounter(cfg) { cfg.onUpdate?.({ getValue: () => 1 }); cfg.onComplete?.(); } }
    };
    const chair = { scene, isSwivelChair: true, originalTexture: 'chair-grey-1-rotate1', texture: { key: 'chair-grey-1-rotate1' },
        currentFrame: ORDER_CCW_S.indexOf(facing), x: castor.x - 20, y: castor.y - 35, displayOriginX: 0, displayOriginY: 0,
        scaleX: 1, scaleY: 1, width: 40, height: 40, depth: 1, active: true, visible: true, objectId: 'rig_chair' };
    chair.body = dynBody(chair, 11, 31, 18, 8);
    const player = { x: 0, y: 0, displayOriginX: 0, displayOriginY: 0, scaleX: 1, scaleY: 1, visible: true, depth: 0,
        texture: { key: 'rig_player' }, frame: { name: 'idle' }, direction: 'down',
        anims: { isPlaying: false, stop() {}, play() {}, animationManager: { exists: () => false } },
        setVisible(v) { this.visible = v; }, setDepth(d) { this.depth = d; } };
    player.body = dynBody(player, 31, 60, 18, 10);
    const feet = () => ({ x: player.x + player.body.offset.x + player.body.width / 2, y: player.y + player.body.offset.y + player.body.height / 2 });
    const putFeet = (x, y) => { const f = feet(); player.x += x - f.x; player.y += y - f.y; player.body.updateFromGameObject(); };
    putFeet(approach.x, approach.y);
    dynamics.push(chair.body, player.body);
    const pm = new NPCPathfindingManager(scene);
    pm.rebuildWorldGrid();
    const saved = {};
    for (const k of ['player', 'pathfindingManager', 'game', 'gameAlert', '__seatBox']) saved[k] = window[k];
    const alerts = [];
    Object.assign(window, { player, pathfindingManager: pm, game: { textures: { get: () => ({ has: () => true }) } },
        gameAlert: m => alerts.push(m) });
    const rig = {
        chair, player, scene, pm, alerts, feet, statics,
        sit() { assert.equal(seating.trySit(chair), true); assert.equal(seating.isSeated(), true); },
        /** Roll: move the driver's feet by (dx, dy) facing `dir` (a player direction), then place(). */
        roll(dx, dy, dir) { const f = feet(); player.direction = dir; putFeet(f.x + dx, f.y + dy); seating.place(); },
        jump() { seating.onJumpKey(); seating.onJumpKey(); },
        last() { return window.seating.lastStand; },
        restore() { if (seating.isSeated()) seating.standUp(); for (const [k, v] of Object.entries(saved)) window[k] = v; }
    };
    return rig;
}

/** The landing's walking box is clear of every static body and the line from the castor crosses none (1 px steps). */
function assertCleanLanding(rig, castor, label) {
    const f = rig.feet();
    for (const b of rig.statics) {
        assert.ok(!(f.x + 9 > b.left && f.x - 9 < b.right && f.y + 5 > b.top && f.y - 5 < b.bottom), `${label}: landed in ${b.gameObject.name} at ${f.x},${f.y}`);
        const n = Math.ceil(Math.hypot(f.x - castor.x, f.y - castor.y));
        for (let i = 1; i < n; i++) {
            const x = castor.x + (f.x - castor.x) * i / n, y = castor.y + (f.y - castor.y) * i / n;
            assert.ok(!(x > b.left && x < b.right && y > b.top && y < b.bottom), `${label}: across ${b.gameObject.name} to ${f.x},${f.y}`);
        }
    }
    return f;
}

test('named cases on desk1 (R1 B1): behind, in front, each end; voluntary and forced land on the near side', async () => {
    const cases = [
        { name: 'behind', castor: { x: 87, y: 260 }, facing: 'south', approach: { x: 87, y: 232 }, ok: f => f.y < 264 },
        { name: 'in front', castor: { x: 87, y: 284 }, facing: 'north', approach: { x: 87, y: 312 }, ok: f => f.y > 280 },
        { name: 'west end', castor: { x: 39, y: 272 }, facing: 'east', approach: { x: 12, y: 272 }, ok: f => f.x < 48 || f.y < 264 || f.y > 280 },
        { name: 'east end', castor: { x: 135, y: 272 }, facing: 'west', approach: { x: 162, y: 272 }, ok: f => f.x > 126 || f.y < 264 || f.y > 280 }
    ];
    for (const c of cases) {
        for (const kind of ['voluntary', 'forced']) {
            const rig = await standRig({ ...c, statics: [DESK1()] });
            try {
                rig.sit();
                if (kind === 'voluntary') rig.jump(); else seating.standUp();
                assert.equal(seating.isSeated(), false, `${c.name} ${kind}: stood`);
                const f = assertCleanLanding(rig, c.castor, `${c.name} ${kind}`);
                assert.ok(c.ok(f), `${c.name} ${kind}: near side, landed ${f.x},${f.y}`);
                assert.ok(Math.hypot(f.x - c.castor.x, f.y - c.castor.y) <= 40, `${c.name} ${kind}: beside the chair`);
                assert.equal(rig.last().via, 'compass', `${c.name} ${kind}`);
                assert.equal(rig.player.visible, true);
            } finally { rig.restore(); }
        }
    }
});

test('__seatBox === false keeps the old code for the audit: behind desk1 it steps across the desk, never refuses', async () => {
    const rig = await standRig({ castor: { x: 87, y: 260 }, facing: 'south', approach: { x: 87, y: 232 }, statics: [DESK1()] });
    try {
        window.__seatBox = false;
        rig.sit();
        rig.jump();
        assert.equal(seating.isSeated(), false);
        assert.equal(rig.last().via, 'legacy-compass');
        assert.ok(rig.feet().y > 280, `old forward step lands south of the desk (${rig.feet().y})`);
    } finally { delete window.__seatBox; rig.restore(); }
});

test('player facing (R3 M3): sat facing east, rolled north to a desk; the stand counts from the stand-time facing', async () => {
    // Desk north of the chair (x 94..140, y 150..188), a cabinet east (x 110..150, y 190..230), a
    // wall south (y 215..240). Open: west (beside the chair) and north-west (round the desk's corner).
    const statics = [sBody(94, 150, 46, 38, 'desk'), sBody(110, 190, 40, 40, 'cabinet'), sBody(0, 215, 200, 25, 'wall')];
    const rig = await standRig({ castor: { x: 100, y: 230 }, facing: 'east', approach: { x: 70, y: 230 }, statics: [] });
    try {
        rig.sit();
        // roll 30 px north (the chair's body stays disabled where the player sat: stale)
        rig.roll(0, -30, 'up');
        rig.statics.push(...statics);   // the room's furniture, now that the chair is in place
        rig.scene.physics.world.staticBodies = iter(rig.statics);
        const castor = { x: rig.chair.x + 20, y: rig.chair.y + 35 };
        assert.deepEqual(castor, { x: 100, y: 200 });
        assert.equal(seating.currentSeat(), rig.chair);
        rig.jump();
        assert.equal(seating.isSeated(), false);
        const f = assertCleanLanding(rig, castor, 'east then north');
        assert.ok(f.x < 91 && f.y >= 196, `beside the chair to the west, not round the desk corner: ${f.x},${f.y}`);
        assert.equal(rig.last().via, 'compass');
    } finally { rig.restore(); }
    // control: the same roll with the chair still facing east (as a sit-time facing would count
    // it) tries north-west as a back diagonal before west, and steps round the desk's corner
    const ctl = await standRig({ castor: { x: 100, y: 230 }, facing: 'east', approach: { x: 70, y: 230 }, statics: [] });
    try {
        ctl.sit();
        ctl.roll(0, -30, 'right');
        ctl.statics.push(...statics);
        ctl.scene.physics.world.staticBodies = iter(ctl.statics);
        ctl.jump();
        const g = ctl.feet();
        assert.ok(g.y < 196, `facing east: the north-west diagonal (${g.x},${g.y})`);
    } finally { ctl.restore(); }
});

test('cramped (wall 12 px north of a chair behind desk1) and boxed in (voluntary refuses, forced takes the approach)', async () => {
    // cramped: still lands clear and on the near side
    {
        const castor = { x: 87, y: 260 };
        const rig = await standRig({ castor, facing: 'south', approach: { x: 40, y: 250 },
            statics: [DESK1(), sBody(0, 32, 320, 212, 'wall north')] });   // wall bottom 244 = chair top 256 - 12
        try {
            rig.sit();
            rig.jump();
            assert.equal(seating.isSeated(), false, 'cramped: stood');
            const f = assertCleanLanding(rig, castor, 'cramped');
            assert.ok(f.y < 264, `cramped: near side ${f.x},${f.y}`);
        } finally { rig.restore(); }
    }
    // boxed in: walls round the chair on every side, the desk south
    {
        const castor = { x: 87, y: 260 };
        const box = [DESK1(), sBody(0, 32, 320, 218, 'wall north'), sBody(0, 250, 76, 14, 'wall west'), sBody(98, 250, 100, 14, 'wall east')];
        const rig = await standRig({ castor, facing: 'south', approach: { x: 87, y: 240 }, statics: box });
        try {
            rig.sit();
            rig.jump();
            assert.equal(seating.isSeated(), true, 'voluntary: stays seated');
            assert.equal(rig.last().via, 'refused');
            assert.deepEqual(rig.alerts, ['No room to stand up here.']);
            seating.standUp();
            assert.equal(seating.isSeated(), false);
            assert.equal(rig.last().via, 'forced-approach');
            assert.deepEqual(rig.feet(), { x: 87, y: 240 });
        } finally { rig.restore(); }
    }
});

test('baked chair (R2 M1): a flood over the world grid can\'t leave a chair an NPC left; over the local grid it can', async () => {
    const sb = await import('../../public/break_escape/js/systems/seat-box.js');
    const castor = { x: 87, y: 260 };
    const statics = [DESK1(), sBody(0, 32, 320, 200, 'wall north')];
    const rig = await standRig({ castor, facing: 'south', approach: { x: 87, y: 238 }, statics });
    try {
        rig.chair.body.immovable = true;
        rig.pm.rebuildWorldGrid();          // baked: the chair's padded cells are blocked in the world grid
        rig.chair.body.immovable = false;   // the NPC stood up; nothing rebuilds
        const world = { grid: rig.pm.worldGrid, bounds: rig.pm.worldGridBounds };
        assert.deepEqual(sb.floodStandCells(world, castor.x, castor.y, 4), [], 'world grid: the flood is stuck in the chair');
        const local = sb.localStandGrid(rig.pm, { exclude: [rig.chair, rig.player] });
        assert.ok(sb.floodStandCells(local, castor.x, castor.y, 4).length > 0, 'local grid: the flood gets out');
        // and the player on that chair stands on the near side
        rig.sit();
        rig.jump();
        assert.equal(seating.isSeated(), false);
        const f = assertCleanLanding(rig, castor, 'baked');
        assert.ok(f.y < 264, `near side ${f.x},${f.y}`);
    } finally { rig.restore(); }
});

test('standUp survives a throw (R3 M1): body restored, visible, not seated, on the approach point', async () => {
    const rig = await standRig({ castor: { x: 87, y: 260 }, facing: 'south', approach: { x: 87, y: 232 }, statics: [DESK1()] });
    const err = console.error;
    try {
        rig.sit();
        assert.equal(rig.player.visible, false);
        window.pathfindingManager = { buildWorldGrid() { throw new Error('grid builder failed'); } };
        console.error = () => {};
        seating.standUp();
        assert.equal(seating.isSeated(), false);
        assert.equal(rig.player.isSeated, false);
        assert.equal(rig.player.visible, true);
        assert.deepEqual([rig.player.body.width, rig.player.body.height, rig.player.body.offset.x, rig.player.body.offset.y], [18, 10, 31, 60]);
        assert.deepEqual(rig.feet(), { x: 87, y: 232 });
        assert.equal(rig.last().via, 'error-approach');
        // the voluntary path too
        window.pathfindingManager = rig.pm;
        rig.sit();
        window.pathfindingManager = { buildWorldGrid() { throw new Error('grid builder failed'); } };
        rig.jump();
        assert.equal(seating.isSeated(), false);
        assert.equal(rig.player.visible, true);
    } finally { console.error = err; rig.restore(); }
});

// ── slice 21 (OFFICE_LIFE_PLAN 12.7): the chair roll mostly along x, out and back, and a rare swivel ──

function lcg(seed = 1) {
    let v = seed;
    return () => { v = (v * 9301 + 49297) % 233280; return v / 233280; };
}

test('fidgetOffset: |y| <= 1 and |x| <= 3 on screen, never zero, never towards the desk; east and west roll back up to 2 px', () => {
    const forward = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0],
                      'south-east': [1, 1], 'north-west': [-1, -1], 'north-east': [1, -1], 'south-west': [-1, 1] };
    const rand = lcg(7);
    for (const [facing, [fx, fy]] of Object.entries(forward)) {
        const xs = new Set();
        for (let i = 0; i < 300; i++) {
            const o = seating.fidgetOffset(facing, rand);
            assert.ok(Number.isInteger(o.x) && Number.isInteger(o.y), `${facing} whole pixels`);
            assert.ok(Math.abs(o.x) <= 3 && Math.abs(o.y) <= 1, `${facing} ${o.x},${o.y} out of range`);
            assert.ok(o.x !== 0 || o.y !== 0, `${facing} a roll that goes nowhere`);
            assert.ok(o.x * fx <= 0 && o.y * fy <= 0, `${facing} ${o.x},${o.y} rolls towards the desk`);
            if (fx) assert.ok(Math.abs(o.x) <= 2, `${facing} ${o.x} past 2 px back`);
            xs.add(o.x);
        }
        if (!fx) assert.ok(xs.has(-3) && xs.has(3), `${facing}: both ways along x, up to 3 px`);
    }
    // A stub rand at its edges stays in range
    for (const facing of Object.keys(forward)) {
        for (const v of [0, 0.999999]) {
            const o = seating.fidgetOffset(facing, () => v);
            assert.ok(Math.abs(o.x) <= 3 && Math.abs(o.y) <= 1 && (o.x || o.y), `${facing} rand ${v}`);
        }
    }
});

test('fidgetStep: out, hold 1 to 2 s, back to zero; held starts none and brings a roll straight back', () => {
    const rand = () => 0.5;
    const fd = seating.newFidget(0, rand);
    assert.equal(fd.phase, 'wait');
    const start = fd.until;
    assert.deepEqual(seating.fidgetStep(fd, start - 1, { facing: 'south', rand }), { x: 0, y: 0 });
    // Held when due: no roll
    seating.fidgetStep(fd, start, { held: true, facing: 'south', rand });
    assert.equal(fd.phase, 'wait');
    seating.fidgetStep(fd, start + 10, { facing: 'south', rand });
    assert.equal(fd.phase, 'out');
    const out = seating.fidgetStep(fd, start + 10 + 700, { facing: 'south', rand });
    assert.equal(fd.phase, 'hold');
    assert.ok(out.x !== 0 || out.y !== 0);
    const holdEnd = fd.until;
    assert.ok(holdEnd - (start + 710) >= 1000 && holdEnd - (start + 710) <= 2000, `hold ${holdEnd - start - 710}`);
    assert.deepEqual(seating.fidgetStep(fd, holdEnd - 1, { facing: 'south', rand }), out, 'holds where it rolled to');
    seating.fidgetStep(fd, holdEnd, { facing: 'south', rand });
    assert.equal(fd.phase, 'back');
    assert.deepEqual(seating.fidgetStep(fd, holdEnd + 700, { facing: 'south', rand }), { x: 0, y: 0 });
    assert.equal(fd.phase, 'wait');
    assert.ok(fd.until - (holdEnd + 700) >= 4000 && fd.until - (holdEnd + 700) <= 11000);
    // Held mid-roll: it eases straight back, from where it is
    seating.fidgetStep(fd, fd.until, { facing: 'south', rand });
    const t0 = fd.start;
    const mid = seating.fidgetStep(fd, t0 + 350, { facing: 'south', rand });
    seating.fidgetStep(fd, t0 + 360, { held: true, facing: 'south', rand });
    assert.equal(fd.phase, 'back');
    assert.ok(Math.abs(fd.from.x - mid.x) <= Math.abs(mid.x) + 0.5);
    assert.deepEqual(seating.fidgetStep(fd, t0 + 360 + 700, { held: true, facing: 'south', rand }), { x: 0, y: 0 });
    assert.equal(fd.phase, 'wait');
});

test('idleMotionHeld: a call, a pairing, a line, typing or a chat with the player holds the roll and the swivel', () => {
    assert.equal(seating.idleMotionHeld({}), false);
    for (const k of ['call', 'paired', 'talking', 'typing', 'chatting']) assert.equal(seating.idleMotionHeld({ [k]: true }), true, k);
    assert.equal(seating.isTyping({ mode: 'job', job: { kind: 'use', need: 'work', phase: 'using' } }), true);
    assert.equal(seating.isTyping({ mode: 'job', job: { kind: 'use', need: 'caffeine', phase: 'using' } }), false);
    assert.equal(seating.isTyping({ mode: 'idle', job: null }), false);
});

test('swivelFacing: same for a seed, about 5% of 6 s slots, one compass step snapped to valid, back to home, never typing', async () => {
    const { seededRoll } = await import('../../public/break_escape/js/systems/npc-needs.js');
    const roll = seed => salt => seededRoll(seed, 'tom', salt);
    const idle = { mode: 'idle', job: null };
    const facings = (seed, opts = {}) => {
        const out = [];
        for (let slot = 0; slot < 1000; slot++) {
            out.push(seating.swivelFacing({ state: idle, clockMs: slot * 6000 + 500, homeFacing: 'south', roll: roll(seed), ...opts }));
        }
        return out;
    };
    const a = facings(1), b = facings(1), c = facings(2);
    assert.deepEqual(a, b, 'same seed, same swivels');
    assert.notDeepEqual(a, c);
    const turned = a.filter(f => f !== 'south');
    assert.ok(turned.length >= 30 && turned.length <= 75, `turned in ${turned.length} of 1000 slots`);
    assert.ok(turned.every(f => f === 'south-east' || f === 'south-west'), 'one compass step');
    assert.ok(turned.includes('south-east') && turned.includes('south-west'), 'both ways');
    // Back to home within the slot (hold 2 to 4 s)
    for (let slot = 0; slot < 1000; slot++) {
        const f = seating.swivelFacing({ state: idle, clockMs: slot * 6000 + 4000, homeFacing: 'south', roll: roll(1) });
        assert.equal(f, 'south', `slot ${slot} still turned after 4 s`);
    }
    // Snapped to the chair's valid facings
    const snapped = facings(1, { valid: ['south', 'east', 'west'] });
    assert.ok(snapped.every(f => ['south', 'east', 'west'].includes(f)));
    // A swivelChance of 1 turns every slot; 0 none
    assert.ok(facings(1, { chance: 1 }).every(f => f !== 'south'));
    assert.ok(facings(1, { chance: 0 }).every(f => f === 'south'));
    // Never while typing
    const typing = { mode: 'job', job: { kind: 'use', need: 'work', phase: 'using' } };
    for (let slot = 0; slot < 200; slot++) {
        assert.equal(seating.swivelFacing({ state: typing, clockMs: slot * 6000 + 500, homeFacing: 'south', roll: roll(1), chance: 1 }), 'south');
    }
    // A coffee use (not work) may swivel
    const coffee = { mode: 'job', job: { kind: 'use', need: 'caffeine', phase: 'using' } };
    assert.notEqual(seating.swivelFacing({ state: coffee, clockMs: 500, homeFacing: 'south', roll: roll(1), chance: 1 }), 'south');
});

test('listenTarget: the nearest speaker in the same room within four tiles, until the line ends; never itself', () => {
    const speakers = [
        { npcId: 'rosa', roomId: 'office', x: 300, y: 100, until: 5000 },
        { npcId: 'amara', roomId: 'office', x: 180, y: 100, until: 5000 },
        { npcId: 'grace', roomId: 'kitchen', x: 110, y: 100, until: 5000 },
        { npcId: 'tom', roomId: 'office', x: 100, y: 100, until: 5000 }
    ];
    const base = { npcId: 'tom', roomId: 'office', x: 100, y: 100, speakers };
    assert.equal(seating.listenTarget({ ...base, clockMs: 1000 })?.npcId, 'amara');
    assert.equal(seating.listenTarget({ ...base, clockMs: 5000 }), null, 'the line has ended');
    assert.equal(seating.listenTarget({ ...base, x: 400, y: 400, clockMs: 1000 }), null, 'too far');
    assert.equal(seating.listenTarget({ ...base, speakers: [], clockMs: 0 }), null);
});

test('swivelEnabled: swivel false, officeVisuals false and los.enabled turn it off', () => {
    assert.equal(seating.swivelEnabled({}, {}), true);
    assert.equal(seating.swivelEnabled({ swivel: false }, {}), false);
    assert.equal(seating.swivelEnabled({}, { officeVisuals: false }), false);
    assert.equal(seating.swivelEnabled({ los: { enabled: true } }, {}), false);
    assert.equal(seating.swivelEnabled({ los: { enabled: false } }, {}), true);
});

test('the needs system builds the speakers list once per tick: chat lines and grumbles, with room and position', async () => {
    const { NPCNeedsSystem, NEEDS_TICK_MS } = await import('../../public/break_escape/js/systems/npc-needs.js');
    const { makeWorld } = await import('./fixtures/needs-stub-world.mjs');
    const rec = id => ({ id, needsHome: `${id}_pc`, needs: { work: { decayPerMin: 1, urgentAt: 10, initial: 90, jitterPct: 0 } } });
    const w = makeWorld({ npcs: { a: { pos: { x: 100, y: 100 }, rec: rec('a') }, b: { pos: { x: 160, y: 100 }, rec: rec('b'), room: 'kitchen' } },
        objects: [] });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let built = 0;
    const orig = sys._buildSpeakers.bind(sys);
    sys._buildSpeakers = () => { built++; return orig(); };
    for (let i = 0; i < 5; i++) sys.step(NEEDS_TICK_MS);
    assert.equal(built, 5, 'once per tick');
    assert.deepEqual(sys.speakers, []);
    // A grumble (one-off line) and a chat line
    sys.states.get('a').saying = { line: 'Not again.', until: sys.clockMs + 3000 };
    sys._chats.set('cooler', { a: 'a', b: 'b', current: { speakerId: 'b', partnerId: 'a', line: 'Hi', until: sys.clockMs + 2000 } });
    const list = sys._buildSpeakers();
    assert.deepEqual(list.map(s => [s.npcId, s.roomId, s.x, s.y, s.until - sys.clockMs]).sort(),
        [['a', 'office', 100, 100, 3000], ['b', 'kitchen', 160, 100, 2000]]);
    sys._chats.clear();
    sys.states.get('a').saying = null;
    assert.deepEqual(sys._buildSpeakers(), []);
});

// The live path: updateSeatedNPC on a needs NPC at its post, with stub sprites
function seatedNeedsRig({ rec = {}, ns = {}, speakers = [], clockMs = 500, partner = null, talking = null, chatWith = false } = {}) {
    const chair = { isSwivelChair: true, originalTexture: 'chair-grey-1-rotate1', currentFrame: 0, texture: { key: 'chair-grey-1-rotate1' },
        x: 100, y: 120, depth: 10, active: true, scene: { textures: { exists: () => true } },
        body: { reset(x, y) { chair.bx = x; chair.by = y; } },
        setTexture(k) { this.texture.key = k; } };
    const seat = seating.seatSpec(chair);
    const sprite = { x: 100, y: 100, displayOriginX: 40, displayOriginY: 40, scaleX: 1, scaleY: 1, active: false,
        texture: { key: 'stub_atlas' }, frame: { name: '' }, anims: { isPlaying: false }, scene: { time: { now: 0 } },
        body: { offset: { x: 30, y: 60 }, width: 20, height: 10, setVelocity() {}, reset() {} },
        setFrame(n) { this.frame.name = n; }, setDepth() {}, setPosition() {} };
    const behavior = { npcId: 'tom', roomId: 'office', sprite,
        _seat: { chair, seat, facing: 'south', homeFacing: 'south', place: 0, needsStop: 'at:tom_pc', facePlayer: false } };
    const state = { npcId: 'tom', mode: 'idle', atPost: true, job: null, ...ns };
    const emitted = [];
    const sys = {
        states: new Map([['tom', state]]), speakers, clockMs,
        world: { npcStatus: () => ({}), inChatWith: () => chatWith, npcPos: () => ({ x: 100, y: 100, roomId: 'office' }) },
        _chatPartner: () => partner, _talking: () => talking,
        roll: () => 0.01
    };
    return { behavior, chair, state, emitted, sys,
        install() {
            window.npcNeedsSystem = sys;
            window.npcManager = { getNPC: () => ({ needsHome: 'tom_pc', ...rec }) };
            window.eventDispatcher = { emit: (name, data) => emitted.push({ name, data }) };
            window.gameScenario = {};
        } };
}

test('updateSeatedNPC (needs): an idle swivel turns the chair and emits npc_swivelled with reason idle', () => {
    const prev = { n: window.npcNeedsSystem, m: window.npcManager, e: window.eventDispatcher, g: window.gameScenario };
    try {
        const rig = seatedNeedsRig();
        rig.install();
        assert.equal(seating.updateSeatedNPC(rig.behavior, null), true);
        assert.notEqual(rig.behavior._seat.facing, 'south');
        assert.equal(rig.emitted.length, 1);
        assert.equal(rig.emitted[0].name, 'npc_swivelled:tom');
        assert.equal(rig.emitted[0].data.reason, 'idle');
        // Back to home after the hold, no second event
        rig.sys.clockMs = 5900;
        seating.updateSeatedNPC(rig.behavior, null);
        assert.equal(rig.behavior._seat.facing, 'south');
        assert.equal(rig.emitted.length, 1);
    } finally {
        Object.assign(window, { npcNeedsSystem: prev.n, npcManager: prev.m, eventDispatcher: prev.e, gameScenario: prev.g });
    }
});

test('updateSeatedNPC (needs): listening faces the speaker and ends with the line; a chat with the player overrides it', () => {
    const prev = { n: window.npcNeedsSystem, m: window.npcManager, e: window.eventDispatcher, g: window.gameScenario };
    try {
        const rig = seatedNeedsRig({ speakers: [{ npcId: 'amara', roomId: 'office', x: 200, y: 100, until: 3000 }], clockMs: 1000 });
        rig.sys.roll = () => 0.99; // no idle swivel
        rig.install();
        seating.updateSeatedNPC(rig.behavior, null);
        assert.equal(rig.behavior._seat.facing, 'east');
        assert.deepEqual(rig.emitted.map(e => [e.name, e.data.reason, e.data.facing]), [['npc_swivelled:tom', 'listen', 'east']]);
        rig.sys.clockMs = 3000;
        seating.updateSeatedNPC(rig.behavior, null);
        assert.equal(rig.behavior._seat.facing, 'south', 'the line ended');
        // A chat with the player wins over a speaker
        rig.sys.clockMs = 1000;
        rig.sys.world.inChatWith = () => true;
        seating.updateSeatedNPC(rig.behavior, { x: 0, y: 105 });
        assert.equal(rig.behavior._seat.facing, 'west');
    } finally {
        Object.assign(window, { npcNeedsSystem: prev.n, npcManager: prev.m, eventDispatcher: prev.e, gameScenario: prev.g });
    }
});

test('updateSeatedNPC (needs): no swivel or listening on a call, paired, talking, typing, with los.enabled or swivel false', () => {
    const prev = { n: window.npcNeedsSystem, m: window.npcManager, e: window.eventDispatcher, g: window.gameScenario };
    const speakers = [{ npcId: 'amara', roomId: 'office', x: 200, y: 100, until: 3000 }];
    const cases = {
        call: { ns: { call: { objectId: 'tom_phone' } } },
        paired: { partner: 'amara' },
        talking: { talking: { line: 'Hi' } },
        typing: { ns: { mode: 'job', job: { kind: 'use', need: 'work', phase: 'using', targetId: 'tom_pc' } } },
        los: { rec: { los: { enabled: true } } },
        off: { rec: { swivel: false } }
    };
    try {
        for (const [name, opts] of Object.entries(cases)) {
            const rig = seatedNeedsRig({ speakers, clockMs: 1000, ...opts });
            rig.install();
            seating.updateSeatedNPC(rig.behavior, null);
            assert.equal(rig.behavior._seat.facing, 'south', name);
            assert.equal(rig.emitted.length, 0, name);
            if (name !== 'los' && name !== 'off') {
                // and the roll is held: no roll starts, however long it waits
                rig.behavior.sprite.scene.time.now = 60000;
                seating.updateSeatedNPC(rig.behavior, null);
                assert.equal(rig.behavior._seat.fidget.phase, 'wait', `${name}: roll held`);
                assert.equal(rig.chair.x, 100, name);
            }
        }
    } finally {
        Object.assign(window, { npcNeedsSystem: prev.n, npcManager: prev.m, eventDispatcher: prev.e, gameScenario: prev.g });
    }
});

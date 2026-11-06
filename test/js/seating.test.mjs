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

test('fidgetOffset: a seated NPC rolls at most 3px sideways and 2px back, never forward', () => {
    const forward = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0],
                      'south-east': [0.7071, 0.7071], 'north-west': [-0.7071, -0.7071] };
    let seq = 0;
    const rand = () => { seq = (seq * 9301 + 49297) % 233280; return seq / 233280; };
    for (const [facing, [fx, fy]] of Object.entries(forward)) {
        for (let i = 0; i < 200; i++) {
            const o = seating.fidgetOffset(facing, rand);
            assert.ok(Number.isInteger(o.x) && Number.isInteger(o.y), `${facing} whole pixels`);
            assert.ok(Math.hypot(o.x, o.y) <= 4.3, `${facing} ${o.x},${o.y} too far`);
            assert.ok(o.x * fx + o.y * fy <= 0.75, `${facing} ${o.x},${o.y} rolls forward`);
        }
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

test('seated block (option G experiment) is inert unless window.__seatBox is set', () => {
    const body = { width: 18, height: 8 };
    // off: the driver takes the chair's whole footprint, as before
    for (const off of [undefined, null, {}, { w: 0, h: 6 }, { w: 8 }, { w: 'x', h: 6 }, { w: -4, h: 4 }]) {
        assert.deepEqual(seating.seatedBlock(body, off), { w: 18, h: 8 }, JSON.stringify(off));
    }
    // on: the small block
    assert.deepEqual(seating.seatedBlock(body, { w: 8, h: 6 }), { w: 8, h: 6 });
    // the live default reads window.__seatBox, which nothing in the engine sets
    assert.equal(window.__seatBox, undefined);
});

test('pickStandSpot (seat-box experiment): compass, flood, approach, then stay seated or forced', () => {
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
    // 5. forced (KO, punch, chair gone): the approach point even if blocked; never across the desk
    const e = seating.pickStandSpot({ ...at, approach: { x: 87, y: 230 } }, world(shut));
    assert.deepEqual([e.x, e.y, e.via], [87, 230, 'forced-approach']);
    // the south cell across the desk is never returned by any branch
    for (const r of [a, b, c, e]) assert.ok(!(r.y > desk.y1), JSON.stringify(r));
});

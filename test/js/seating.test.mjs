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

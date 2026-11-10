// Slice 7: carry outcomes and reveal slots (OFFICE_LIFE_PLAN 2.2 Part A).
// The needs core on the sims stub (fixtures/needs-sims-world.mjs, addCopierBeat), the live adapter
// (createEngineWorld) on a fake window with a small stub of the rooms helpers, and the validator.
// Run with: node --test test/js/npc-needs-slots.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NPCNeedsSystem, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeSimsWorld, runSimsDay, addCopierBeat, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TICKS_PER_MIN = 240;

// ── plain items: today's path, byte for byte ─────────────────────────────────────

// sha256 of JSON.stringify(getLog()) for runSimsDay({ minutes: 15 }), recorded at 4bff74a0b, before
// slice 7 touched npc-needs.js. The parcel and both mug carries end in consume, as before.
// Re-recorded once since, for one moved entry out of 231: Amara's returned_post, when she
// brings the parcel to her own PC, is logged at tick 453 as she arrives, ahead of the "using"
// entry, and no longer at tick 494 after the session (a delivery to the own post is the
// return). Every other entry is as recorded at 4bff74a0b.
const GOLDEN_SIMS_DAY = 'a87a652c0b54abe9d8c237f6ba4b8cc097f193097a546267bbcf6b5b86b86948';

test('a plain item is consumed and the sims-day log is byte-identical to before slice 7', () => {
    const { sys, w } = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    const digest = createHash('sha256').update(JSON.stringify(sys.getLog())).digest('hex');
    assert.equal(digest, GOLDEN_SIMS_DAY);
    const amara = sys.getLog().filter(e => e.npc === 'amara');
    const used = amara.findIndex(e => e.ev === 'used' && e.item === 'parcel');
    assert.deepEqual(amara.slice(used - 2, used).map(e => [e.ev, e.t]), [['returned_post', 453], ['using', 453]]);
    assert.deepEqual(w.calls.consumed.map(c => c.itemId), ['office_mugs', 'parcel', 'player_mugs']);
    assert.ok(!sys.getLog().some(e => e.outcome), 'plain items log no outcome field');
});

// ── the copier beat on the stub ─────────────────────────────────────────────────

function copierDay({ minutes = 8, onDeliver, tap } = {}) {
    const w = makeSimsWorld();
    addCopierBeat(w, { onDeliver });
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    while (sys.tickCount < minutes * TICKS_PER_MIN) { sys.tick(); tap?.(sys, w); }
    return { sys, w };
}

test('Sanjay prints; Amara carries the slot to her PC, where it is placed, then filed after placeSeconds', () => {
    const { sys, w } = copierDay();
    const log = sys.getLog();
    const first = w.calls.revealed[0];
    assert.deepEqual(first, { producerId: 'office_copier', npcId: 'sanjay', slotId: 'copier_out_a' });
    const used = log.find(e => e.ev === 'used' && e.tag === 'printout');
    assert.ok(used, 'Amara delivered a printout');
    assert.equal(used.npc, 'amara');
    assert.equal(used.target, 'amara_pc');
    assert.equal(used.outcome, 'place');
    assert.equal(w.calls.placed[0].itemId, used.item);
    assert.ok(!w.calls.consumed.some(c => c.itemId.startsWith('copier_out')), 'a slot is never consumed');
    // Filed 60 s (240 ticks) of needs clock after it was set down
    const filed = log.find(e => e.ev === 'stowed' && e.item === used.item);
    assert.ok(filed, 'filed after placeSeconds');
    assert.equal(filed.t - used.t, 240);
    assert.equal(filed.reason, 'filed');
    // While placed it is not a carry candidate: Amara never fetched it from her own desk
    const fetches = log.filter(e => e.ev === 'job_start' && e.item === used.item);
    const shows = w.calls.revealed.filter(r => r.slotId === used.item);
    assert.ok(fetches.length <= shows.length, 'one fetch per reveal at most');
    // The emitted npc_used carries the tag, for the showcase objective
    assert.ok(w.calls.emits.some(e => e.name === 'npc_used:amara_pc' && e.data.tag === 'printout' && e.data.itemId === used.item));
});

test('the cycle repeats: a filed slot is free again and the pool is used in id order', () => {
    const { sys, w } = copierDay({ minutes: 15 });
    const ids = w.calls.revealed.map(r => r.slotId);
    assert.ok(ids.length >= 3, `several prints (${ids.join(',')})`);
    assert.equal(ids[0], 'copier_out_a');
    // Every reveal is the lowest id not on the tray, in a hand or on a desk at that moment; with one
    // collector who files each within a minute, a comes round again
    assert.ok(ids.filter(i => i === 'copier_out_a').length >= 2, 'copier_out_a cycles');
    assert.equal(w.calls.cosmetics.length, 0);
    assert.ok(sys.getLog().filter(e => e.ev === 'used' && e.tag === 'printout').every(e => e.outcome === 'place'));
});

test('onDeliver "stow" files a delivered slot at once', () => {
    const { sys, w } = copierDay({ onDeliver: 'stow' });
    const used = sys.getLog().find(e => e.ev === 'used' && e.tag === 'printout');
    assert.ok(used);
    assert.equal(used.outcome, 'stow');
    assert.equal(w.calls.placed.length, 0);
    assert.ok(w.calls.stowed.includes(used.item));
    assert.equal(w.globals[`${used.item}_shown`], false);
    // and the parcel would still be consumed: onDeliver only affects slots
});

test('pool exhaustion falls back to a cosmetic copy, removed after the producer placeSeconds', () => {
    const w = makeSimsWorld();
    addCopierBeat(w);
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    // No NPCs registered: nobody collects
    const got = [1, 2, 3, 4].map(() => sys._revealOutput('office_copier', 'sanjay'));
    assert.deepEqual(got, ['copier_out_a', 'copier_out_b', 'copier_out_c', null]);
    assert.equal(w.calls.cosmetics.length, 1);
    assert.ok(sys.getLog().some(e => e.ev === 'revealed' && e.reason === 'no_free_slot'));
    for (let i = 0; i < 239; i++) sys.tick();
    assert.equal(w.calls.cosmeticsRemoved.length, 0);
    sys.tick();
    assert.deepEqual(w.calls.cosmeticsRemoved, w.calls.cosmetics);
});

test('the player takes a slot Amara is fetching: npc_job_failed with reason item_gone (both paths)', () => {
    // Path 1: gone before she arrives (getObject finds nothing)
    {
        const w = makeSimsWorld();
        addCopierBeat(w);
        const move = w.world.moveTo;
        w.world.moveTo = (id, x, y, sp, o) => {
            const job = w.sys?.states.get(id)?.job;
            if (id === 'amara' && job?.phase === 'goto_item' && w.slots[job.itemId] && !w.slots[job.itemId].taken) w.take(job.itemId);
            return move(id, x, y, sp, o);
        };
        const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
        w.sys = sys;
        w.attach(sys);
        sys.registerAll();
        while (sys.tickCount < 6 * TICKS_PER_MIN && !w.calls.emits.some(e => e.name === 'npc_job_failed:amara')) sys.tick();
        const ev = w.calls.emits.find(e => e.name === 'npc_job_failed:amara');
        assert.ok(ev, 'emitted');
        assert.equal(ev.data.reason, 'item_gone');
        assert.equal(ev.data.itemId, 'copier_out_a');
        assert.equal(ev.data.npcId, 'amara');
        assert.ok(sys.getLog().some(e => e.npc === 'amara' && e.ev === 'job_aborted' && e.reason === 'item_gone'));
    }
    // Path 2: still listed when she arrives, but the pickup fails
    {
        const w = makeSimsWorld();
        addCopierBeat(w);
        const pick = w.world.pickUp;
        w.world.pickUp = (npcId, itemId) => (itemId.startsWith('copier_out') ? false : pick(npcId, itemId));
        const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
        w.attach(sys);
        sys.registerAll();
        while (sys.tickCount < 6 * TICKS_PER_MIN && !w.calls.emits.some(e => e.name === 'npc_job_failed:amara')) sys.tick();
        const ev = w.calls.emits.find(e => e.name === 'npc_job_failed:amara');
        assert.ok(ev);
        assert.equal(ev.data.reason, 'item_gone');
        assert.equal(ev.data.itemId, 'copier_out_a');
    }
});

test('an abort while carrying a slot files it instead of dropping it', () => {
    const w = makeSimsWorld();
    addCopierBeat(w);
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    while (sys.tickCount < 6 * TICKS_PER_MIN && !sys.states.get('amara').job?.carrying) sys.tick();
    const job = sys.states.get('amara').job;
    assert.ok(job?.carrying && job.slot, 'Amara is carrying a slot');
    sys.onExternalMove('amara');
    assert.ok(w.calls.stowed.includes(job.itemId));
    assert.equal(w.calls.dropped.length, 0);
});

test('reload on the stub: a revealed slot nobody holds is stowed when its room is first seen', () => {
    const w = makeSimsWorld();
    addCopierBeat(w);
    w.globals.copier_out_b_shown = true;          // revealed before the reload; globals persist
    w.slots.copier_out_b.pickable = true;
    const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.tick();
    assert.deepEqual(w.calls.stowed, ['copier_out_b']);
    assert.equal(w.globals.copier_out_b_shown, false);
});

// ── the live adapter on a fake window ───────────────────────────────────────────

function fakeSprite(id, roomId, x, y, sd = {}, extra = {}) {
    return {
        objectId: id, roomId, x, y, width: 16, height: 16, displayWidth: 16, displayHeight: 16,
        originX: 0, originY: 0, depth: y + 16, visible: true, active: true, interactable: true,
        revealOnGlobal: sd.revealOnGlobal, scenarioData: { id, ...sd },
        setVisible(v) { this.visible = v; return this; },
        setDepth(d) { this.depth = d; return this; },
        setInteractive() { this.inputOn = true; return this; },
        disableInteractive() { this.inputOn = false; return this; },
        destroy() { this.destroyed = true; },
        ...extra
    };
}

/** A window with an office and a kitchen, three copier slots, and the rooms helpers stubbed. */
function fakeWindow({ globals = {} } = {}) {
    const listeners = {};
    const removes = [];
    const slot = (id, takeable) => fakeSprite(id, 'office', 150, 70, {
        type: 'notes1', outputOf: 'office_copier', revealOnGlobal: `${id}_shown`, needsTag: 'printout', takeable, readable: true
    });
    const office = {
        position: { x: 0, y: 0 },
        objects: {
            office_copier: fakeSprite('office_copier', 'office', 140, 66, { type: 'photocopier1' }, { width: 35, height: 46, displayWidth: 35, displayHeight: 46 }),
            copier_out_a: slot('copier_out_a', true),
            copier_out_b: slot('copier_out_b', false),
            copier_out_c: slot('copier_out_c', false)
        }
    };
    const kitchen = {
        position: { x: -320, y: 0 },
        objects: { kitchen_desk: fakeSprite('kitchen_desk', 'kitchen', -200, 100, { type: 'desk', affordance: { accepts: ['printout'] } }, { width: 32, height: 32, displayWidth: 32, displayHeight: 32 }) }
    };
    // As revealRoom leaves them: hidden unless the global is true (with no listener after a reload)
    for (const sp of Object.values(office.objects)) if (sp.revealOnGlobal && globals[sp.revealOnGlobal] !== true) sp.visible = false;
    const amara = { id: 'amara' };
    const win = {
        rooms: { office, kitchen },
        gameState: { globalVariables: { ...globals } },
        inventory: { items: [] },
        eventDispatcher: {
            on(n, f) { (listeners[n] = listeners[n] || []).push(f); },
            emit(n, d) { (listeners[n] || []).forEach(f => f(d)); (win._emits = win._emits || []).push({ n, d }); }
        },
        npcManager: { getNPC: id => (id === 'amara' ? amara : null), npcs: new Map([['amara', amara]]) },
        npcBehaviorManager: { getBehavior: () => ({ roomId: 'kitchen', sprite: { body: { center: { x: -190, y: 140 } } } }) },
        pathfindingManager: { findNearestWalkableWorldCell: (x, y) => ({ x, y: y + 32 }) },
        RoomStateSync: { removeItemFromRoom: (roomId, id) => { removes.push({ roomId, id }); return Promise.resolve(true); } },
        // the stub of core/rooms.js showRevealedObject / hideRevealedObject
        showRevealedObject(obj) { obj.setVisible(true); obj.interactable = true; obj.setInteractive(); },
        hideRevealedObject(obj) { obj.setVisible(false); obj.interactable = false; obj.disableInteractive(); }
    };
    return { win, removes, amara };
}

function withWindow(win, fn) {
    globalThis.window = win;
    try { return fn(); } finally { delete globalThis.window; }
}

test('adapter: revealOutput takes the first free slot by id, sets its global and shows it; describe marks slots', () => {
    const { win } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        assert.equal(w.getObject('copier_out_a').slot, true);
        assert.equal(w.getObject('copier_out_a').pickable, false, 'hidden: not pickable');
        assert.equal(w.getObject('office_copier').slot, undefined);
        assert.deepEqual(w.revealOutput('office_copier', 'sanjay'), { slotId: 'copier_out_a' });
        assert.equal(win.gameState.globalVariables.copier_out_a_shown, true);
        assert.equal(win.rooms.office.objects.copier_out_a.visible, true);
        assert.equal(w.getObject('copier_out_a').pickable, true);
        assert.ok(win._emits.some(e => e.n === 'object_revealed:copier_out_a' && e.d.producerId === 'office_copier' && e.d.npcId === 'sanjay'));
        assert.deepEqual(w.revealOutput('office_copier', 'sanjay'), { slotId: 'copier_out_b' });
    });
});

test('adapter: read a cycling slot through the notebook (active = false): it is not free', () => {
    const { win } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        win.rooms.office.objects.copier_out_a.active = false;     // as the notebook leaves it
        assert.deepEqual(w.revealOutput('office_copier', 'sanjay'), { slotId: 'copier_out_b' });
        win.inventory.items.push(win.rooms.office.objects.copier_out_c);   // in the player's inventory
        assert.deepEqual(w.revealOutput('office_copier', 'sanjay'), {}, 'none free and no scene: no cosmetic either');
    });
});

test('adapter: stow frees the slot and re-inserts it into its declared room under its key', () => {
    const { win, amara } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        w.revealOutput('office_copier', 'sanjay');
        const sp = win.rooms.office.objects.copier_out_a;
        assert.equal(w.pickUp('amara', 'copier_out_a'), true);
        assert.equal(win.rooms.office.objects.copier_out_a, undefined, 'pickUp removed it from the room');
        assert.ok(amara._needsCarried.copier_out_a);
        assert.equal(w.stowHeld('amara', 'copier_out_a'), true);
        assert.equal(win.rooms.office.objects.copier_out_a, sp, 'back under its key');
        assert.equal(sp.visible, false);
        assert.equal(sp.x, 150); assert.equal(sp.y, 70);
        assert.equal(win.gameState.globalVariables.copier_out_a_shown, false);
        assert.deepEqual(w.revealOutput('office_copier', 'sanjay'), { slotId: 'copier_out_a' }, 'free again');
    });
});

test('adapter: cross-room place then pickup gives exactly one remove_object, naming the declared room', () => {
    const { win, removes } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        w.revealOutput('office_copier', 'sanjay');
        const sp = win.rooms.office.objects.copier_out_a;
        w.pickUp('amara', 'copier_out_a');
        const desk = w.getObject('kitchen_desk');
        assert.equal(w.placeHeld('amara', 'copier_out_a', desk), true);
        assert.equal(win.rooms.kitchen.objects.copier_out_a, sp, 'registered where it sits, by object id');
        assert.equal(win.rooms.office.objects.copier_out_a, undefined);
        assert.equal(sp.roomId, 'office', 'roomId stays the declared room');
        assert.equal(sp.visible, true);
        const placed = w.getObject('copier_out_a');
        assert.equal(placed.roomId, 'kitchen');
        assert.equal(placed.pickable, false, 'a placed slot is not a carry candidate');
        // Halfway from the desk centre (-184, 116) towards its approach cell (-184, 148)
        assert.equal(placed.x, -184); assert.equal(placed.y, 132);
        // The player picks it up in the kitchen: inventory.js addToInventory's room removal
        // (systems/inventory.js, "Remove from room if it exists and sync with server")
        win.currentPlayerRoom = 'kitchen';
        const roomObj = win.rooms[win.currentPlayerRoom].objects[sp.objectId];
        assert.ok(roomObj, 'player pickup finds it under the current room and its objectId');
        roomObj.setVisible(false);
        roomObj.active = false;
        win.RoomStateSync.removeItemFromRoom(sp.roomId || win.currentPlayerRoom, sp.objectId);
        assert.deepEqual(removes, [{ roomId: 'office', id: 'copier_out_a' }]);
        // The placeSeconds timer then finds it taken and leaves it alone
        assert.equal(w.stowSlot('copier_out_a'), false);
        assert.equal(win.gameState.globalVariables.copier_out_a_shown, true);
    });
});

test('adapter: placeAt overrides the default spot', () => {
    const { win } = fakeWindow();
    withWindow(win, () => {
        const w = createEngineWorld();
        w.revealOutput('office_copier', 'sanjay');
        w.pickUp('amara', 'copier_out_a');
        const desk = { ...w.getObject('kitchen_desk'), affordance: { accepts: ['printout'], placeAt: { dx: 0.5, dy: -0.25 } } };
        w.placeHeld('amara', 'copier_out_a', desk);
        const placed = w.getObject('copier_out_a');
        assert.equal(placed.x, -184 + 16); assert.equal(placed.y, 116 - 8);
    });
});

test('reload then cycle: a fresh system stows a revealed slot (global true, no listener), and the next print shows it', () => {
    const { win } = fakeWindow({ globals: { copier_out_a_shown: true } });
    withWindow(win, () => {
        const sp = win.rooms.office.objects.copier_out_a;
        assert.equal(sp.visible, true, 'after the reload it is back on the tray');
        const sys = new NPCNeedsSystem(createEngineWorld(), { seed: 'x', manualClock: true });
        sys.tick();
        assert.equal(sp.visible, false, 'stowed on sight');
        assert.equal(win.gameState.globalVariables.copier_out_a_shown, false);
        assert.equal(sys._revealOutput('office_copier', 'sanjay'), 'copier_out_a');
        assert.equal(sp.visible, true, 'shown by the direct call, with no listener registered');
    });
});

test('reload: a taken slot is not loaded, so the next print shows the next one', () => {
    const { win } = fakeWindow({ globals: { copier_out_a_shown: true } });
    delete win.rooms.office.objects.copier_out_a;     // the room payload filters out a taken item
    withWindow(win, () => {
        const sys = new NPCNeedsSystem(createEngineWorld(), { seed: 'x', manualClock: true });
        sys.tick();
        assert.equal(sys._revealOutput('office_copier', 'sanjay'), 'copier_out_b');
    });
});

// ── validator ───────────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const slotScen = (slot, extra = {}) => ({
    globalVariables: { s1_out: false },
    rooms: { office: { type: 'room_office', objects: [
        { id: 'copier', type: 'photocopier1' },
        { id: 'desk', type: 'desk', affordance: { accepts: ['printout'] } },
        { id: 's1', type: 'notes1', readable: true, text: 'x', outputOf: 'copier', revealOnGlobal: 's1_out', needsTag: 'printout', ...slot },
        ...(extra.objects || [])
    ], npcs: [{ id: 'amara', needsHome: 'desk', interests: { printout: { weight: 2 } }, onUse: { desk: { revealOutput: extra.producer || 'copier' } } }] } }
});
const has = (issues, frag) => issues.some(s => s.includes(frag));

test('validator: a non-takeable readable notes slot without readDisplay gameDisplay is an error', { skip }, () => {
    assert.ok(has(check(slotScen({ takeable: false })), 'non-takeable readable notes1 without readDisplay'));
    assert.ok(!has(check(slotScen({ takeable: false, readDisplay: 'gameDisplay' })), 'without readDisplay'));
    assert.ok(!has(check(slotScen({ takeable: true })), 'without readDisplay'), 'a takeable slot is one beat');
});

test('validator: slot globals, producers, onDeliver reach and the beats count', { skip }, () => {
    const ok = check(slotScen({ takeable: true }));
    assert.ok(!ok.some(s => s.startsWith('❌')), ok.join('\n'));
    assert.ok(has(ok, "Reveal slots for 'copier': 1 (1 takeable"));
    assert.ok(has(check(slotScen({ takeable: true, revealOnGlobal: undefined })), 'has outputOf but no revealOnGlobal'));
    assert.ok(has(check(slotScen({ takeable: true, outputOf: 'nope' })), "outputOf names 'nope'"));
    assert.ok(has(check(slotScen({ takeable: true }, { objects: [{ id: 'memo', type: 'notes1', observationVariants: [{ condition: 'globalVars.s1_out', value: 'x' }] }] })), 'is used elsewhere'));
    assert.ok(has(check(slotScen({ takeable: true }, { objects: [{ id: 's2', type: 'key', outputOf: 'copier', revealOnGlobal: 's1_out' }] })), 'is shared with'));
    assert.ok(has(check(slotScen({ takeable: true }, { producer: 'ghost' })), "revealOutput names 'ghost'"));
    assert.ok(has(check(slotScen({ takeable: true }, { objects: [{ id: 'shredder', type: 'shredder1', affordance: { accepts: ['post'], onDeliver: 'stow' } }] })), 'onDeliver only affects reveal slots'));
});

test('validator: test_needs_sims has no errors and lists its copier pool', { skip }, () => {
    const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(root, 'scenarios/test_needs_sims/scenario.json.erb')], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    const out = r.stdout + r.stderr;
    assert.ok(!/❌ ERROR/.test(out), out.split('\n').filter(l => l.includes('ERROR')).join('\n'));
    assert.ok(out.includes("Reveal slots for 'office_copier': 5 (1 takeable"));
});

test('adapter: a cosmetic copy registers as a fade companion of its producer and leaves with removeCosmetic', () => {
    const { win } = fakeWindow();
    win.game = { add: { sprite: (x, y, tex) => ({ x, y, texKey: tex, texture: { key: tex }, setOrigin() { return this; }, setDepth() { return this; }, destroy() { this.destroyed = true; } }) } };
    withWindow(win, () => {
        const w = createEngineWorld();
        for (let i = 0; i < 3; i++) w.revealOutput('office_copier', 'sanjay');
        const r = w.revealOutput('office_copier', 'sanjay');
        assert.ok(r.cosmetic, 'pool exhausted: a cosmetic copy');
        const prod = win.rooms.office.objects.office_copier;
        assert.equal(prod._fadeCompanions.size, 1);
        const [copy] = [...prod._fadeCompanions];
        assert.equal(copy._fadeOwner, prod);
        w.removeCosmetic(r.cosmetic);
        assert.equal(prod._fadeCompanions.size, 0);
        assert.equal(copy.destroyed, true);
    });
});

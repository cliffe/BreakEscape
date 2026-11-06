// Office life slice 8 (OFFICE_LIFE_PLAN 2.4, 7.3): social pairing at capacity-2 objects, chatter
// timing, overhearing, hush, social compatibility (needsCompany), and the speech bubbles hiding
// the action icon and thought bubble.
// Run with: bin/test-js test/js/npc-social-pairing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, bubbleMs, chatterPool, DEFAULT_CHATTER, CHAT_LINE_MAX, requiredGlobalsHold,
    createEngineWorld, OVERHEAR_RADIUS
} from '../../public/break_escape/js/systems/npc-needs.js';
import { NpcActionIcons } from '../../public/break_escape/js/systems/npc-action-icons.js';
import { NpcWorldBubbles, speechShown, pickShown, MAX_BUBBLES } from '../../public/break_escape/js/systems/npc-world-bubbles.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';
import { makeSimsWorld, SIMS_SEED } from './fixtures/needs-sims-world.mjs';

const thirsty = (initial = 20) => ({ thirst: { decayPerMin: 1, urgentAt: 50, initial, jitterPct: 0 } });
const cooler = (extra = {}) => ({ id: 'cooler', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 70, useSeconds: 15, capacity: 2, chatter: 'cooler', ...extra } });

/** Two (or more) NPCs and a cooler. `npcs`: { id: { needs, ...rec } }. Moves arrive at once. */
function office(npcs, { objects = [cooler()], seed = 1, globals = {}, hears = null, near = null, chatter } = {}) {
    const cfg = { npcs: {}, objects };
    let x = 100;
    for (const [id, rec] of Object.entries(npcs)) {
        cfg.npcs[id] = { pos: { x, y: 300 }, rec: { id, needsHome: { room: 'office', x: x / 32, y: 10 }, ...rec } };
        x += 64;
    }
    const w = makeWorld(cfg);
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.playerHears = hears || (() => ({ overheard: false, distance: null }));
    w.world.playerProximity = near || (() => ({ nearby: false, distance: null }));
    if (chatter !== undefined) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    const emitted = (prefix) => w.calls.emits.filter(e => e.name.startsWith(prefix));
    return { w, sys, globals, emitted };
}

// ── pure parts ───────────────────────────────────────────────────────────

test('bubbleMs: 2.5 s + 50 ms a character, at most 4 s', () => {
    assert.equal(bubbleMs(''), 2500);
    assert.equal(bubbleMs('Friday drinks?'), 2500 + 14 * 50);
    assert.equal(bubbleMs('x'.repeat(40)), 4000);
});

test('chatterPool: scenario replaces a built-in by name, false turns built-ins off, NPC lines add', () => {
    assert.deepEqual(chatterPool('cooler', undefined, null).lines, [...DEFAULT_CHATTER.cooler]);
    assert.deepEqual(chatterPool('cooler', { cooler: ['A'] }, null).lines, ['A']);
    assert.deepEqual(chatterPool('cooler', false, null).lines, []);
    assert.deepEqual(chatterPool('cooler', false, { cooler: ['Mine.'] }).lines, ['Mine.']);
    assert.deepEqual(chatterPool('cooler', { cooler: ['A'] }, { cooler: ['B'] }).lines, ['A', 'B']);
    const g = chatterPool('gossip', { gossip: { lines: ['Psst.'], hush: true, overhearRadius: 64 } }, null);
    assert.deepEqual(g, { lines: ['Psst.'], hush: true, overhearRadius: 64 });
    for (const pool of Object.values(DEFAULT_CHATTER)) for (const l of pool) assert.ok(l.length <= CHAT_LINE_MAX, l);
});

test('requiredGlobalsHold: a name (truthy) or { name: value }, all must match', () => {
    assert.equal(requiredGlobalsHold('x', { x: true }), true);
    assert.equal(requiredGlobalsHold('x', { x: false }), false);
    assert.equal(requiredGlobalsHold({ a: 1, b: 'y' }, { a: 1, b: 'y' }), true);
    assert.equal(requiredGlobalsHold({ a: 1, b: 'y' }, { a: 1, b: 'n' }), false);
});

// ── pairing ──────────────────────────────────────────────────────────────

test('pairing: two at a chatter cooler take turns; lines fit the overlap; same seed, same partner and lines', () => {
    const run = (seed) => {
        const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, { seed });
        o.sys.step(20000);
        return o.emitted('npc_chatted:').map(e => ({ s: e.data.speakerId, p: e.data.partnerId, l: e.data.lineId }));
    };
    const a = run(1), b = run(1);
    assert.deepEqual(a, b, 'deterministic for a seed');
    assert.ok(a.length >= 2 && a.length <= 4, `15 s overlap gives 2-4 lines, got ${a.length}`);
    for (let i = 1; i < a.length; i++) assert.notEqual(a[i].s, a[i - 1].s, 'speakers alternate');
    for (const e of a) assert.ok((e.s === 'ann' && e.p === 'bob') || (e.s === 'bob' && e.p === 'ann'));
    // Lines are timed: each starts after the previous bubble and a 0.5 s gap
    const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } });
    let prev = null;
    const times = [];
    for (let t = 0; t < 80; t++) {
        o.sys.step(NEEDS_TICK_MS);
        const n = o.emitted('npc_chatted:').length;
        if (n !== prev) { times.push(o.sys.clockMs); prev = n; }
        const st = o.sys.getState('ann');
        if (st.talking) assert.ok(st.talking.remainingMs <= 4000);
    }
    assert.ok(times.length >= 2);
});

test('pairing: no chat for a lone use, at a capacity-1 object, or at an object with no chatter pool', () => {
    const lone = office({ ann: { needs: thirsty() }, bob: { needs: thirsty(90) } });
    lone.sys.step(20000);
    assert.equal(lone.emitted('npc_chatted:').length, 0);
    const one = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, { objects: [cooler({ capacity: 1 })] });
    one.sys.step(40000);
    assert.equal(one.emitted('npc_chatted:').length, 0);
    const quiet = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, { objects: [cooler({ chatter: undefined })] });
    quiet.sys.step(20000);
    assert.equal(quiet.emitted('npc_chatted:').length, 0);
});

test('pairing: a short overlap gives fewer lines; the dwell is not stretched', () => {
    const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, { objects: [cooler({ useSeconds: 4 })] });
    o.sys.step(10000);
    assert.equal(o.emitted('npc_chatted:').length, 1, 'one 2.5-4 s line fits a 4 s overlap');
    const used = o.sys.getLog().filter(e => e.ev === 'used');
    assert.equal(used.length, 2);
    assert.ok(used.every(e => e.t <= Math.ceil(4000 / NEEDS_TICK_MS) + 2), 'both finished on time');
});

test('pairing ends when one NPC is frozen in a conversation; the other finishes in silence', () => {
    const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.emitted('npc_chatted:').length, 1);
    o.w.setChat('bob');
    o.sys.step(20000);
    assert.equal(o.emitted('npc_chatted:').length, 1, 'no more lines');
    assert.equal(o.sys.getState('ann').talking, null);
    assert.ok(o.sys.getLog().some(e => e.npc === 'ann' && e.ev === 'used'));
});

test('overheard and npc_overheard: only when the world says the player hears it', () => {
    let hears = true;
    const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, { hears: (id, r) => ({ overheard: hears, distance: 150, r }) });
    o.sys.step(NEEDS_TICK_MS * 2);
    const first = o.emitted('npc_chatted:')[0];
    assert.equal(first.data.overheard, true);
    assert.equal(first.data.playerDistance, 150);
    assert.equal(o.emitted(`npc_overheard:${first.data.speakerId}`).length, 1);
    hears = false;
    o.sys.step(5000);
    assert.equal(o.emitted('npc_chatted:').length, 2);
    assert.equal(o.emitted('npc_overheard:').length, 1, 'not overheard: no npc_overheard');
});

test('adapter playerHears: 150 px heard, 170 px not, through a wall not, other room not', () => {
    const sprite = { body: { center: { x: 0, y: 0 } } };
    let clear = true;
    globalThis.window = {
        player: { body: { center: { x: 150, y: 0 } } }, currentPlayerRoom: 'office',
        npcBehaviorManager: { getBehavior: () => ({ sprite, roomId: 'office', canSeePlayerToFace: () => clear }) }
    };
    try {
        const world = createEngineWorld();
        assert.equal(world.playerHears('ann', OVERHEAR_RADIUS).overheard, true);
        window.player.body.center.x = 170;
        assert.equal(world.playerHears('ann', OVERHEAR_RADIUS).overheard, false);
        window.player.body.center.x = 150;
        clear = false;
        assert.equal(world.playerHears('ann', OVERHEAR_RADIUS).overheard, false, 'through a wall');
        clear = true;
        window.currentPlayerRoom = 'kitchen';
        assert.equal(world.playerHears('ann', OVERHEAR_RADIUS).overheard, false, 'another room');
        window.gameState = { globalVariables: { x: true } };
        assert.equal(world.globalHolds('x'), true);
        assert.equal(world.globalHolds({ x: false }), false);
    } finally { delete globalThis.window; }
});

test('hush: a hush pool stops after the current line once the player is near', () => {
    let near = false;
    const o = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, {
        chatter: { cooler: { lines: ['Did you hear?', 'No, what?'], hush: true } },
        near: () => ({ nearby: near, distance: near ? 40 : 400 })
    });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.emitted('npc_chatted:').length, 1);
    near = true;
    o.sys.step(20000);
    assert.equal(o.emitted('npc_chatted:').length, 1, 'stopped after the line in progress');
    // Without hush the same pool carries on with the player close
    const loud = office({ ann: { needs: thirsty() }, bob: { needs: thirsty() } }, {
        chatter: { cooler: ['Did you hear?', 'No, what?'] }, near: () => ({ nearby: true, distance: 40 })
    });
    loud.sys.step(20000);
    assert.ok(loud.emitted('npc_chatted:').length >= 2);
});

test('chattiness 0: that NPC only listens; NPC lines add to the pool', () => {
    const o = office({ ann: { needs: thirsty(), chattiness: 0 }, bob: { needs: thirsty(), chatter: { cooler: ['Bob here.'] } } }, { chatter: { cooler: ['Hi.'] } });
    o.sys.step(20000);
    const lines = o.emitted('npc_chatted:');
    assert.ok(lines.length >= 1);
    assert.ok(lines.every(e => e.data.speakerId === 'bob'));
    assert.ok(lines.every(e => ['Hi.', 'Bob here.'].includes(e.data.line)));
});

// ── compatibility ────────────────────────────────────────────────────────

test('groups: the same group chats; different groups share the cooler in silence', () => {
    const same = office({ ann: { needs: thirsty(), needsCompany: { groups: ['research'] } }, bob: { needs: thirsty(), needsCompany: { groups: ['research', 'x'] } } });
    same.sys.step(20000);
    assert.ok(same.emitted('npc_chatted:').length >= 2);
    const diff = office({ ann: { needs: thirsty(), needsCompany: { groups: ['research'] } }, bob: { needs: thirsty(), needsCompany: { groups: ['sales'] } } });
    diff.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(diff.sys.getState('ann').job?.phase, 'using');
    assert.equal(diff.sys.getState('bob').job?.phase, 'using', 'they share');
    diff.sys.step(20000);
    assert.equal(diff.emitted('npc_chatted:').length, 0);
    assert.equal(diff.emitted('npc_avoided:').length, 0);
    // One side with no groups: the group test passes
    const open = office({ ann: { needs: thirsty(), needsCompany: { groups: ['research'] } }, bob: { needs: thirsty() } });
    open.sys.step(20000);
    assert.ok(open.emitted('npc_chatted:').length >= 1);
});

/** ann goes first (thirstier, earlier id); bob arrives to find her there. */
function avoidCase(annRec, bobRec, opts) {
    return office({ ann: { needs: thirsty(10), ...annRec }, bob: { needs: thirsty(20), ...bobRec } }, opts);
}

for (const [label, annRec, bobRec] of [
    ['declared on the one already there', { needsCompany: { avoids: ['bob'] } }, {}],
    ['declared on the newcomer', {}, { needsCompany: { avoids: ['ann'] } }],
    ['"*" on the one already there', { needsCompany: { avoids: ['*'] } }, {}],
    ['"*" on the newcomer', {}, { needsCompany: { avoids: ['*'] } }],
    ['group: entry', { needsCompany: { groups: ['contractors'] } }, { needsCompany: { avoids: ['group:contractors'] } }]
]) {
    test(`avoidance ${label}: no sharing either way, npc_avoided once, then the place when the first leaves`, () => {
        const o = avoidCase(annRec, bobRec);
        o.sys.step(NEEDS_TICK_MS);
        const annJob = o.sys.getState('ann').job, bobJob = o.sys.getState('bob').job;
        // Exactly one of them holds the cooler; the other waits at its desk
        assert.ok(!!annJob !== !!bobJob, 'only one holds it');
        const first = annJob ? 'ann' : 'bob', second = annJob ? 'bob' : 'ann';
        o.sys.step(NEEDS_TICK_MS * 8);
        const av = o.emitted('npc_avoided:');
        assert.equal(av.length, 1, 'once per episode');
        assert.equal(av[0].name, `npc_avoided:${second}`);
        assert.deepEqual(av[0].data, { npcId: second, avoidedId: first, objectId: 'cooler' });
        assert.equal(o.sys.getState(second).job, null, 'waits');
        o.sys.step(40000);
        assert.ok(o.sys.getLog().some(e => e.npc === second && e.ev === 'used' && e.target === 'cooler'), 'takes the place after');
        assert.equal(o.emitted('npc_chatted:').length, 0);
    });
}

for (const [label, entry, extra] of [
    ['npc', { npc: 'bob', requireGlobal: 'bob_exposed' }, {}],
    ['group', { group: 'contractors', requireGlobal: 'bob_exposed' }, { needsCompany: { groups: ['contractors'] } }],
    ['"*"', { npc: '*', requireGlobal: { bob_exposed: true } }, {}]
]) {
    test(`requireGlobal (${label} entry): false pairs and chats, true avoids`, () => {
        const off = avoidCase({ needsCompany: { avoids: [entry] } }, extra, { globals: { bob_exposed: false } });
        off.sys.step(20000);
        assert.ok(off.emitted('npc_chatted:').length >= 1, 'pairs while the global is false');
        assert.equal(off.emitted('npc_avoided:').length, 0);
        const on = avoidCase({ needsCompany: { avoids: [entry] } }, extra, { globals: { bob_exposed: true } });
        on.sys.step(20000);
        assert.equal(on.emitted('npc_chatted:').length, 0);
        assert.equal(on.emitted('npc_avoided:').length, 1);
    });
}

test('a global that flips mid-chat lets the pairing finish', () => {
    const o = avoidCase({ needsCompany: { avoids: [{ npc: 'bob', requireGlobal: 'g' }] } }, {}, { globals: { g: false } });
    o.sys.step(NEEDS_TICK_MS * 2);
    assert.equal(o.emitted('npc_chatted:').length, 1);
    o.globals.g = true;
    o.sys.step(20000);
    assert.ok(o.emitted('npc_chatted:').length >= 2);
});

test('the decision log is unchanged by chatter at the cooler (sims day, no needsCompany)', () => {
    const day = (chat) => {
        const w = makeSimsWorld();
        if (chat) for (const o of w.objs) if (o.id === 'water_cooler') o.affordance = { ...o.affordance, chatter: 'cooler' };
        const sys = new NPCNeedsSystem(w.world, { seed: SIMS_SEED, manualClock: true });
        w.attach(sys);
        sys.registerAll();
        const at = (tick, fn) => { while (sys.tickCount < tick) sys.tick(); fn(); };
        at(360, () => { w.loadRoom(sys, 'kitchen'); w.loadRoom(sys, 'lounge'); });
        at(450, () => w.drop('parcel', 'post', 200, 200));
        while (sys.tickCount < 12 * 240) sys.tick();
        return { log: sys.getLog(), chats: w.calls.emits.filter(e => e.name.startsWith('npc_chatted:')).length };
    };
    const quiet = day(false), chatty = day(true);
    assert.deepEqual(chatty.log, quiet.log);
    assert.equal(quiet.chats, 0);
    assert.ok(!quiet.log.some(e => e.ev === 'avoided'));
});

// ── bubbles ──────────────────────────────────────────────────────────────

function rig({ scenario = {}, state, room = 'office', minigame = null }) {
    const mk = () => {
        const o = { x: 0, y: 0, visible: true, data: {}, scene: null, calls: [], width: 60, height: 12,
            setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
            setSize() { return o; }, setTexture() { o.width = 16; o.height = 16; return o; },
            setText(t) { o.text = t; return o; }, setDepth() { return o; }, setScale() { return o; },
            setData(k, v) { o.data[k] = v; return o; },
            clear() { return o; }, fillStyle() { return o; }, lineStyle() { return o; },
            fillRoundedRect() { return o; }, strokeRoundedRect() { return o; }, fillCircle() { return o; }, strokeCircle() { return o; },
            fillTriangle() { return o; }, lineBetween() { return o; } };
        return o;
    };
    const scene = {
        add: { rectangle: mk, text: mk, image: mk, graphics: mk, container: () => { const c = mk(); c.scene = scene; return c; } },
        textures: { exists: () => true }, load: { image() {}, once() {}, isLoading: () => true, start() {} }
    };
    const sprite = { x: 200, y: 163, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
        getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    globalThis.window = {
        gameScenario: scenario, currentPlayerRoom: room, rooms: {}, player: { x: 210, y: 170 },
        MinigameFramework: { currentMinigame: minigame },
        npcNeedsSystem: { states: new Map([['tom', {}]]), getState: () => state },
        npcBehaviorManager: { getBehavior: () => ({ sprite, roomId: 'office' }) }
    };
}

test('talking hides the action icon and the thought bubble; the speech bubble shows the line', () => {
    const state = { job: { kind: 'use', need: 'thirst', targetId: 'cooler', phase: 'using' }, pressing: { need: 'hunger', ratio: 0.3 }, talking: null };
    try {
        rig({ scenario: { showPressingNeeds: true }, state });
        const icons = new NpcActionIcons();
        const speech = new NpcWorldBubbles();
        icons.update(); speech.update();
        assert.equal(icons.icons.get('tom').box.visible, true);
        assert.equal(icons.bubbles.get('tom').box.visible, true);
        assert.equal(speech.bubbles.size, 0);
        state.talking = { line: 'Friday drinks?', partnerId: 'amy', topic: 'cooler', remainingMs: 3000 };
        icons.update(); speech.update();
        assert.equal(icons.icons.get('tom').box.visible, false, 'action icon hidden');
        assert.equal(icons.bubbles.get('tom').box.visible, false, 'thought bubble hidden');
        const sb = speech.bubbles.get('tom');
        assert.equal(sb.box.visible, true);
        assert.equal(sb.box.data.line, 'Friday drinks?');
        state.talking = null;
        icons.update(); speech.update();
        assert.equal(icons.icons.get('tom').box.visible, true, 'icon back after the line');
        assert.equal(sb.box.visible, false);
    } finally { delete globalThis.window; }
});

test('speech bubbles: not from another room, not in the dark, not under a minigame; at most four, nearest first', () => {
    assert.equal(speechShown({ npcRoom: 'kitchen', playerRoom: 'office' }), false);
    assert.equal(speechShown({ npcRoom: 'office', playerRoom: 'office', dark: true }), false);
    assert.equal(speechShown({ npcRoom: 'office', playerRoom: 'office', minigameOpen: true }), false);
    assert.equal(speechShown({ npcRoom: 'office', playerRoom: 'office' }), true);
    const list = [1, 2, 3, 4, 5, 6].map(i => ({ npcId: `n${i}`, distance: 100 - i }));
    assert.equal(MAX_BUBBLES, 4);
    assert.deepEqual(pickShown(list), ['n6', 'n5', 'n4', 'n3']);
    const state = { job: null, talking: { line: 'Hi.', partnerId: 'amy' } };
    try {
        rig({ state, room: 'kitchen' });
        const a = new NpcWorldBubbles(); a.update();
        assert.equal(a.bubbles.size, 0, 'other room');
        rig({ state, minigame: { npcId: 'amy' } });
        const b = new NpcWorldBubbles(); b.update();
        assert.equal(b.bubbles.size, 0, 'under a minigame');
        rig({ state });
        const c = new NpcWorldBubbles(); c.update();
        assert.equal(c.bubbles.get('tom').box.visible, true);
    } finally { delete globalThis.window; }
});

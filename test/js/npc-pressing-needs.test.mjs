// Office life slice 3b (OFFICE_LIFE_PLAN 9): the npc-* icon defaults, print/file/blocked/noticed
// mappings, getState().pressing and the pressing-need thought bubble.
// Run with: bin/test-js test/js/npc-pressing-needs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    DEFAULT_ICONS, NPC_ICON_NAMES, pickIcon, pickIconEntry, stateIconEntry, pressingBubble, isPrinter,
    firstIcon, NpcActionIcons, bubblePosition, bubbleDots, BUBBLE_GAP_X
} from '../../public/break_escape/js/systems/npc-action-icons.js';
import { NPCNeedsSystem, NEEDS_TICK_MS, NOTICED_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

// ── defaults and lookup ──────────────────────────────────────────────────

test('defaults: every npc-* icon by name; fallback stays the text dot', () => {
    assert.equal(NPC_ICON_NAMES.length, 14);
    for (const n of NPC_ICON_NAMES) assert.equal(DEFAULT_ICONS[n], `icon:npc-${n}`, n);
    assert.equal(DEFAULT_ICONS.fallback, '•');
    assert.equal(pickIcon({ kind: 'use', need: 'hunger' }, {}, { id: 'fridge', satisfies: 'hunger' }), 'icon:npc-hunger');
    assert.equal(pickIcon({ kind: 'use', need: 'rest' }, {}, null), 'icon:npc-rest');
    assert.equal(pickIcon({ kind: 'carry', itemId: 'p', tag: 'printout' }, {}, null), 'icon:npc-printout');
});

test('a scenario entry wins over every default, for any key (the lab\'s glyphs stay)', () => {
    const lab = { coffee_station: '☕', caffeine: '☕', staff_pc: '🖥', work: '🖥', curiosity: '?', fallback: '•' };
    assert.equal(pickIcon({ kind: 'use', need: 'caffeine' }, lab, { id: 'coffee_station', satisfies: 'caffeine' }), '☕');
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, lab, { id: 'staff_pc', satisfies: 'work' }), '🖥');
    // the scenario's need entry beats the default "print" for a copier use
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, lab, { id: 'copier', type: 'photocopier1', print: true }), '🖥');
    assert.equal(pickIcon({ kind: 'carry', itemId: 'x', tag: 'post' }, lab, null), '?');
    // a type entry in the scenario beats the default for the need
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, { pc: 'P' }, { id: 'a', type: 'pc' }), 'P');
    assert.deepEqual(firstIcon(['nope'], {}), { key: 'fallback', value: '•' });
    assert.equal(firstIcon(['nope'], {}, { fallback: false }), null);
});

test('print: a copier or printer target, or a use whose onUse reveals output', () => {
    assert.equal(isPrinter({ type: 'photocopier1' }), true);
    assert.equal(isPrinter({ type: 'laser_printer' }), true);
    assert.equal(isPrinter({ type: 'pc', preset: 'copier' }), true);
    assert.equal(isPrinter({ type: 'pc', officeType: 'copier' }), true);
    assert.equal(isPrinter({ type: 'pc' }), false);
    assert.equal(pickIconEntry({ kind: 'use', need: null }, {}, { id: 'office_copier', type: 'photocopier1', print: true }).key, 'print');
    const sanjay = pickIconEntry({ kind: 'use', need: 'work', prints: true }, {}, { id: 'sanjay_pc', satisfies: 'work', type: 'pc', print: false });
    assert.deepEqual(sanjay, { key: 'print', value: 'icon:npc-print' });
    assert.equal(pickIconEntry({ kind: 'use', need: 'work' }, {}, { id: 'sanjay_pc', satisfies: 'work' }).key, 'work');
    // an object-id entry still beats print
    assert.equal(pickIcon({ kind: 'use', need: 'work', prints: true }, { sanjay_pc: 'S' }, { id: 'sanjay_pc' }), 'S');
});

test('file: a slot carried to a stow target; otherwise the tag', () => {
    assert.equal(pickIconEntry({ kind: 'carry', itemId: 'out_a', tag: 'printout', files: true }).key, 'file');
    assert.equal(pickIconEntry({ kind: 'carry', itemId: 'out_a', tag: 'printout', files: false }).key, 'printout');
});

test('noticed and blocked: no-job icons, only when opted in or listed by the scenario', () => {
    const noticed = { job: null, noticed: true, blockedNeed: 'thirst' };
    const blocked = { job: null, noticed: false, blockedNeed: 'thirst' };
    assert.equal(stateIconEntry(noticed, {}, false), null, 'off by default');
    assert.deepEqual(stateIconEntry(noticed, {}, true), { key: 'noticed', value: 'icon:npc-noticed' });
    assert.deepEqual(stateIconEntry(blocked, {}, true), { key: 'blocked', value: 'icon:npc-blocked' });
    assert.deepEqual(stateIconEntry(blocked, { blocked: 'X' }, false), { key: 'blocked', value: 'X' }, 'an explicit entry opts in');
    assert.equal(stateIconEntry({ job: { kind: 'use' }, noticed: true }, {}, true), null, 'a job shows the job');
    assert.equal(stateIconEntry({ job: null }, {}, true), null);
    assert.equal(DEFAULT_ICONS.queue, 'icon:npc-queue');
});

// ── pressing needs in the needs system ───────────────────────────────────

function world(needs, extra = {}) {
    const cfg = {
        npcs: { tom: { pos: { x: 100, y: 100 }, rec: { id: 'tom', needsHome: 'tom_pc', needs, ...extra.rec } } },
        objects: [
            { id: 'tom_pc', x: 100, y: 68, affordance: { useSeconds: 5 } },
            ...(extra.objects || [])
        ]
    };
    const w = makeWorld(cfg);
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    return { w, sys };
}

test('pressing: lowest level/urgentAt among urgent needs, ties by name; null when nothing is urgent', () => {
    const { sys } = world({
        thirst: { decayPerMin: 1, urgentAt: 40, initial: 20, jitterPct: 0 },     // 0.5
        hunger: { decayPerMin: 1, urgentAt: 60, initial: 30, jitterPct: 0 },     // 0.5, sorts first
        rest: { decayPerMin: 1, urgentAt: 50, initial: 45, jitterPct: 0 },       // 0.9
        work: { decayPerMin: 1, urgentAt: 30, initial: 90, jitterPct: 0 }        // not urgent
    });
    const s = sys.states.get('tom');
    assert.deepEqual(sys.getState('tom').pressing, { need: 'hunger', ratio: 0.5 });
    s.levels.thirst = 10;
    assert.deepEqual(sys.getState('tom').pressing, { need: 'thirst', ratio: 0.25 });
    for (const k of Object.keys(s.levels)) s.levels[k] = 95;
    assert.equal(sys.getState('tom').pressing, null);
});

test('pressing: clears when a job for that need starts, and the next urgent need takes its place', () => {
    const { sys } = world({
        caffeine: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 },
        thirst: { decayPerMin: 1, urgentAt: 50, initial: 40, jitterPct: 0 }
    }, { objects: [{ id: 'coffee', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 30 } }] });
    assert.equal(sys.getState('tom').pressing.need, 'caffeine');
    sys.step(NEEDS_TICK_MS);
    const st = sys.getState('tom');
    assert.equal(st.job?.need, 'caffeine', 'went for coffee');
    assert.equal(st.pressing.need, 'thirst', 'the job\'s need is never the bubble');
    // Only one urgent need: the bubble clears as the job starts
    const one = world({ caffeine: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } },
        { objects: [{ id: 'coffee', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 30 } }] });
    assert.ok(one.sys.getState('tom').pressing);
    one.sys.step(NEEDS_TICK_MS);
    assert.ok(one.sys.getState('tom').job);
    assert.equal(one.sys.getState('tom').pressing, null);
});

test('blockedNeed: an urgent need whose only target a room rule forbids; job.prints from onUse revealOutput', () => {
    const { sys } = world({ thirst: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } }, {
        rec: { needsAvoidRooms: ['lounge'] },
        objects: [{ id: 'lounge_cooler', roomId: 'lounge', x: 300, y: 100, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 5 } }]
    });
    sys.step(NEEDS_TICK_MS * 2);
    const st = sys.getState('tom');
    assert.equal(st.job, null);
    assert.equal(st.blockedNeed, 'thirst');
    assert.deepEqual(st.pressing, { need: 'thirst', ratio: st.pressing.ratio });
    sys.states.get('tom').levels.thirst = 90;
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('tom').blockedNeed, null, 'clears once no longer urgent');

    const p = world({ work: { decayPerMin: 1, urgentAt: 50, initial: 20, jitterPct: 0 } }, {
        rec: { onUse: { tom_pc: { revealOutput: 'copier' } } },
        objects: [{ id: 'tom_pc2', x: 400, y: 400, affordance: { satisfies: 'work', restores: 50, useSeconds: 30 } }]
    });
    p.w.objs.find(o => o.id === 'tom_pc').affordance = { satisfies: 'work', restores: 50, useSeconds: 30 };
    p.sys.step(NEEDS_TICK_MS);
    const job = p.sys.getState('tom').job;
    assert.equal(job?.targetId, 'tom_pc');
    assert.equal(job.prints, true);
    assert.equal(job.files, false);
});

test('job.files: a slot carried to an onDeliver stow target, set from the job start (wind-up included)', () => {
    const mk = onDeliver => {
        const cfg = {
            npcs: { amara: { pos: { x: 100, y: 100 }, rec: { id: 'amara', needsHome: 'amara_pc', interests: { printout: { weight: 2 } } } } },
            objects: [
                { id: 'amara_pc', x: 100, y: 68, affordance: { accepts: ['printout'], useSeconds: 5, ...(onDeliver ? { onDeliver } : {}) } },
                { id: 'out_a', x: 200, y: 100, needsTag: 'printout', slot: true }
            ]
        };
        const w = makeWorld(cfg);
        w.world.windupMs = () => 5000;
        const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
        w.attach(sys);
        sys.registerAll();
        sys.step(NEEDS_TICK_MS);
        return sys.getState('amara').job;
    };
    const stow = mk('stow');
    assert.equal(stow.windingUp, true, 'still winding up');
    assert.equal(stow.files, true);
    assert.equal(mk(null).files, false, 'placed, not filed');
});

test('noticed: true for NOTICED_MS after npc_caught_at_post, then false', () => {
    const { w, sys } = world({ caffeine: { decayPerMin: 8, urgentAt: 30, initial: 32, jitterPct: 0 } },
        { objects: [{ id: 'coffee', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 10 } }] });
    w.world.playerAtPost = () => ({ distance: 10, inMinigame: false });
    let t = 0;
    while (!w.calls.emits.some(e => e.name === 'npc_caught_at_post:tom') && t < 20 * 60000) { sys.step(NEEDS_TICK_MS); t += NEEDS_TICK_MS; }
    assert.ok(w.calls.emits.some(e => e.name === 'npc_caught_at_post:tom'), 'caught');
    assert.equal(sys.getState('tom').noticed, true);
    sys.step(NOTICED_MS);
    assert.equal(sys.getState('tom').noticed, false);
});

// ── the bubble ───────────────────────────────────────────────────────────

test('pressingBubble: off by default; the need\'s icon; pulse below half urgentAt; scenario entry wins', () => {
    const st = { job: null, pressing: { need: 'thirst', ratio: 0.4 } };
    assert.equal(pressingBubble(st, {}, false), null, 'showPressingNeeds off');
    assert.deepEqual(pressingBubble(st, {}, true), { need: 'thirst', ratio: 0.4, pulse: true, key: 'thirst', value: 'icon:npc-thirst' });
    assert.equal(pressingBubble({ ...st, pressing: { need: 'thirst', ratio: 0.8 } }, {}, true).pulse, false);
    assert.equal(pressingBubble(st, { thirst: 'W' }, true).value, 'W');
    assert.equal(pressingBubble({ job: { need: 'thirst' }, pressing: st.pressing }, {}, true), null, 'never the job\'s need');
    assert.equal(pressingBubble({ job: null, pressing: null }, {}, true), null);
});

test('bubble geometry: right of the head anchor, clear of a 22 px action icon; dots trail toward the head', () => {
    const at = { x: 200, y: 136 };
    const p = bubblePosition(at, 22, 22);
    assert.equal(p.x - 11, 200 + BUBBLE_GAP_X);
    assert.ok(p.x - 11 > 200 + 11, 'left edge clear of a 22 px action icon');
    const [a, b] = bubbleDots(22, 22);
    assert.ok(b.x < a.x && b.y > a.y && b.r < a.r, 'smaller dot nearer the head');
});

/** A fake scene with graphics, for NpcActionIcons.update with the bubble. */
function rig({ scenario, state }) {
    const objs = [];
    const mk = (kind) => {
        const o = { kind, x: 0, y: 0, visible: true, data: {}, scene: null, calls: [],
            setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
            setSize(w, h) { o.w = w; o.h = h; return o; }, setTexture(k) { o.key = k; o.width = 16; o.height = 16; return o; },
            setText(t) { o.text = t; o.width = 10; o.height = 14; return o; }, setDepth() { return o; }, setScale(s) { o.scale = s; return o; },
            setData(k, v) { o.data[k] = v; return o; },
            clear() { o.calls = []; return o; }, fillStyle() { return o; }, lineStyle() { return o; },
            fillRoundedRect(...a) { o.calls.push(['rrect', ...a]); return o; }, strokeRoundedRect() { return o; },
            fillCircle(...a) { o.calls.push(['dot', ...a]); return o; }, strokeCircle() { return o; } };
        objs.push(o);
        return o;
    };
    const scene = {
        add: {
            rectangle: () => mk('bg'), text: () => mk('text'), image: () => mk('img'), graphics: () => mk('g'),
            container: (x, y, kids) => { const c = mk('box'); c.kids = kids; c.scene = scene; return c; }
        },
        textures: { exists: () => true },
        load: { image() {}, once() {}, isLoading: () => true, start() {} }
    };
    const sprite = { x: 200, y: 163, scaleY: 1, active: true, visible: true, destroyed: false, scene,
        texture: { key: 'none' }, frame: null, getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    globalThis.window = {
        gameScenario: scenario, currentPlayerRoom: 'office', rooms: {},
        npcNeedsSystem: { states: new Map([['tom', {}]]), getState: () => state },
        npcBehaviorManager: { getBehavior: () => ({ sprite, roomId: 'office' }) }
    };
    return { objs };
}

test('update: no bubble and no state icon with showPressingNeeds off; both with it on', () => {
    const state = { job: null, noticed: false, blockedNeed: 'thirst', pressing: { need: 'thirst', ratio: 0.3 } };
    try {
        rig({ scenario: {}, state });
        const off = new NpcActionIcons();
        off.update();
        assert.equal(off.bubbles.size, 0);
        assert.ok(!off.icons.get('tom') || off.icons.get('tom').box.visible === false);

        rig({ scenario: { showPressingNeeds: true }, state });
        const on = new NpcActionIcons();
        on.update();
        const bb = on.bubbles.get('tom');
        assert.equal(bb.box.visible, true);
        assert.equal(bb.box.data.need, 'thirst');
        assert.equal(bb.box.data.icon, 's:icon:npc-thirst');
        assert.equal(bb.g.calls.filter(c => c[0] === 'dot').length, 2, 'two trailing dots');
        assert.equal(bb.g.calls.filter(c => c[0] === 'rrect').length, 1, 'one rounded backing');
        assert.equal(on.icons.get('tom').box.data.key, 'blocked');
        // the player leaves the room: both hide
        window.currentPlayerRoom = 'kitchen';
        on.update();
        assert.equal(bb.box.visible, false);
        assert.equal(on.icons.get('tom').box.visible, false);
    } finally { delete globalThis.window; }
});

test('update: the bubble hands over to the action icon when a job for that need starts', () => {
    const state = { job: null, pressing: { need: 'thirst', ratio: 0.3 } };
    try {
        rig({ scenario: { showPressingNeeds: true }, state });
        const icons = new NpcActionIcons();
        icons.update();
        assert.equal(icons.bubbles.get('tom').box.visible, true);
        state.job = { kind: 'use', need: 'thirst', targetId: 'cooler', windingUp: true };
        state.pressing = null;
        icons.update();
        assert.equal(icons.bubbles.get('tom').box.visible, false);
        assert.equal(icons.icons.get('tom').box.data.key, 'thirst');
    } finally { delete globalThis.window; }
});

// ── validator ────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
test('validator: the old showNpcIntentBubbles name warns; every npc-* default icon file exists', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const check = scenario => {
        const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
          puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop());
    };
    const old = check({ showNpcIntentBubbles: false, rooms: { office: { objects: [] } } });
    assert.ok(old.some(s => s.includes('showNpcIntentBubbles was renamed to showPressingNeeds')));
    const icons = Object.fromEntries(NPC_ICON_NAMES.map(n => [n, DEFAULT_ICONS[n]]));
    const now = check({ showPressingNeeds: true, actionIcons: icons, rooms: { office: { objects: [] } } });
    assert.deepEqual(now.filter(s => /showNpcIntentBubbles|showPressingNeeds|actionIcons/.test(s)), []);
    assert.ok(check({ showPressingNeeds: 'yes', rooms: { office: { objects: [] } } }).some(s => s.includes('showPressingNeeds must be true or false')));
});

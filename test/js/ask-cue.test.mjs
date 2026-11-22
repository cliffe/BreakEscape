// Step-away ask cue (systems/ask-cue.js): perceivable gate, toast and marker, the mapping hold in
// npc-manager.js, the shared 45 s reply window in every shell, and a bark held behind a minigame.
// Copy list: ask-cue.js (no imports), npc-manager.js (npc-los, phone-chat-speaker), npc-barks.js (imports stubbed).
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const sys = join(js, 'systems');
const rd = (p) => readFileSync(join(js, p), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'ask-cue-test-'));
writeFileSync(join(dir, 'ask-cue.mjs'), rd('systems/ask-cue.js'));
writeFileSync(join(dir, 'npc-los.mjs'), rd('systems/npc-los.js'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), rd('minigames/phone-chat/phone-chat-speaker.js'));
writeFileSync(join(dir, 'npc-manager.mjs'), rd('systems/npc-manager.js').replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(dir, 'npc-barks.mjs'), `
const ASSETS_PATH = '', overlayDepth = () => 0, displayDashes = (s) => s, releaseHeldBarks = () => {};
const workstationPopupOpen = () => false, phoneThreadOpenFor = () => false, openPhoneThread = () => null, threadTextKey = () => '';
const dialogLayerOpen = () => false;
const barkSource = ({ npcType, channel }) => channel || (npcType === 'phone' ? 'phone' : 'speech');
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, inventoryBlockedByForcedMinigame = () => false;
const phoneBarkText = (s) => s;
class TTSManager {}
` + rd('systems/npc-barks.js').replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));

globalThis.window = { gameState: { globalVariables: {} } };
const { askPerceivable, askToastText, AskCue, DEFAULT_REPLY_MS, MARKER, markerPosition, headRowsFor } = await import(pathToFileURL(join(dir, 'ask-cue.mjs')).href);
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);

test('perceivable: not while a minigame is open; needs the colleague on camera or in the player room', () => {
    const f = { hasSprite: true, npcRoom: 'r1', playerRoom: 'r1', minigameOpen: false, onCamera: true };
    assert.equal(askPerceivable(f), true);
    assert.equal(askPerceivable({ ...f, minigameOpen: true }), false, 'a conversation or minigame is open');
    assert.equal(askPerceivable({ ...f, onCamera: false, playerRoom: 'r2' }), false, 'off camera, another room');
    assert.equal(askPerceivable({ ...f, onCamera: false }), true, 'off camera but the same room');
    assert.equal(askPerceivable({ ...f, hasSprite: false }), false, 'no sprite');
    assert.equal(askPerceivable(null), true, 'no bubble layer to ask');
});

test('the toast is built from the display name, and the default window is 45 s', () => {
    assert.equal(askToastText('Darren Price'), 'Darren Price is asking you something');
    assert.equal(askToastText(''), 'Someone is asking you something');
    assert.equal(DEFAULT_REPLY_MS, 45000);
});

test('fire: a toast naming the colleague and a marker that goes on the conversation closing, and hides under a minigame', () => {
    const handlers = new Map(); const toasts = []; const gfx = [];
    const g = { setDepth() { return g; }, setPosition() { return g; }, setVisible(v) { g.vis = v; return g; }, destroy() { g.dead = true; },
        fillStyle() { return g; }, fillRect() { return g; } };
    gfx.push(g);
    const sprite = { x: 100, y: 200, depth: 5, displayHeight: 48, active: true, scene: { add: { graphics: () => g },
        events: { on: (n, f) => handlers.set(n, f), off: (n) => handlers.delete(n) }, time: { now: 0 } } };
    const bus = new Map();
    Object.assign(window, { npcManager: { getNPC: () => ({ displayName: 'Darren Price' }) }, npcBehaviorManager: { getBehavior: () => ({ sprite }) },
        showNotification: (m, t, ti) => toasts.push([m, t, ti]),
        eventDispatcher: { on: (n, f) => bus.set(n, f), off: (n) => bus.delete(n) } });
    const cue = new AskCue();
    assert.equal(cue.fire('kit_darren_price'), 'Darren Price is asking you something');
    assert.equal(toasts[0][0], 'Darren Price is asking you something');
    assert.ok(cue.markers.has('kit_darren_price'));
    window.MinigameFramework = { currentMinigame: {} };
    handlers.get('postupdate')();
    assert.equal(g.vis, false, 'hidden while a panel is open');
    delete window.MinigameFramework;
    handlers.get('postupdate')();
    assert.equal(g.vis, true);
    bus.get('conversation_closed:kit_darren_price')();
    assert.equal(g.dead, true);
    assert.equal(cue.markers.size, 0);
    for (const k of ['npcManager', 'npcBehaviorManager', 'showNotification', 'eventDispatcher']) delete window[k];
});

function setupMapping(mapping) {
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    const handlers = [];
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m.npcs.set('d', { id: 'd', npcType: 'person' });
    m._handleEventMapping = (npcId, pattern) => handlers.push(pattern);
    m._setupEventMappings('d', [mapping]);
    return { m, timers, handlers, restore() { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; delete window.askCue; delete window.MinigameFramework; } };
}
const mk = (cfg) => ({ eventPattern: 'x_there', onceOnly: true, delayMs: 5500, ...cfg });

test('clock start: a whenPerceivable ask waits (retrying every 500 ms) until it can be noticed, then fires; a plain delayed mapping does not wait', () => {
    window.askCue = { perceivable: () => false };
    const t = setupMapping(mk({ whenPerceivable: true, askCue: true, setGlobal: { kit_x_asked: true } }));
    try {
        const cfg = t.m._buildMappingConfig(mk({ whenPerceivable: true, askCue: true }), 0);
        assert.equal(cfg.whenPerceivable, true); assert.equal(cfg.askCue, true);
        t.m._scheduleDelayedMapping('d', 'x_there', cfg, {});
        const run = () => { const due = t.timers.filter(x => x.live); due.forEach(x => { x.live = false; x.cb(); }); };
        run();
        assert.equal(t.handlers.length, 0, 'not perceivable: held');
        assert.ok(t.timers.some(x => x.live && x.ms === NPCManager.DELAYED_MAPPING_RETRY_MS), 'checks again');
        window.askCue.perceivable = () => true;
        run();
        assert.equal(t.handlers.length, 1, 'fires once perceivable');
    } finally { t.restore(); }
    const p = setupMapping(mk({}));
    try {
        window.askCue = { perceivable: () => false };
        p.m._scheduleDelayedMapping('d', 'x_there', p.m._buildMappingConfig(mk({}), 0), {});
        p.timers.filter(x => x.live).forEach(x => x.cb());
        assert.equal(p.handlers.length, 1, 'no flag, no wait');
    } finally { p.restore(); }
});

test('a mapping with askCue fires the cue with the NPC when it runs', () => {
    const fired = [];
    window.askCue = { fire: (id) => fired.push(id), perceivable: () => true };
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m.npcs.set('d', { id: 'd', npcType: 'person', displayName: 'Darren' });
    try {
        m._handleEventMapping('d', 'x_there', m._buildMappingConfig({ eventPattern: 'x_there', setGlobal: { kit_x_asked: true }, askCue: true }, 0), {});
        assert.deepEqual(fired, ['d']);
    } finally { delete window.askCue; }
});

test('a bark due while a minigame is open is held, not lost, and waits for the close', () => {
    const b = Object.create(NPCBarkSystem.prototype);
    b.container = {}; b.deferredBarkQueue = []; b.barkQueue = []; b.isDrainingDeferred = false;
    b._refreshPhoneUnread = () => {}; b._watchDialogHold = () => {}; b._processBarkQueue = () => { b.processed = true; };
    window.currentConversationMinigameType = 'person-chat';
    try {
        b.showBark({ npcId: 'd', text: 'Password is in. Fine to say yes?' });
        assert.equal(b.deferredBarkQueue.length, 1, 'held');
        assert.equal(b.barkQueue.length, 0);
    } finally { delete window.currentConversationMinigameType; }
});

test('every shell with a step-away reply timer: 45 s default window, and the ask mapping carries the cue and the perceivable gate', () => {
    const root = join(here, '../../scenarios');
    let n = 0;
    for (const name of readdirSync(root).filter(d => /^ca\d\d_/.test(d))) {
        let sc;
        try { sc = JSON.parse(readFileSync(join(root, name, 'scenario.json.erb'), 'utf8')); } catch (e) { continue; }
        const timers = (sc.timers || []).filter(t => /_asked$/.test(t.startOnGlobal || '') && Object.keys(t.setGlobal || {}).some(k => /_choice$/.test(k)));
        for (const t of timers) {
            n++;
            assert.ok(t.delayMs >= DEFAULT_REPLY_MS, `${name} ${t.id}: window ${t.delayMs}`);
            const maps = Object.values(sc.rooms || {}).flatMap(r => (r.npcs || []).flatMap(x => x.eventMappings || []));
            const ask = maps.filter(m => m.setGlobal && t.startOnGlobal in m.setGlobal);
            assert.ok(ask.length && ask.every(m => m.askCue === true && m.whenPerceivable === true && m.delayMs >= 1), `${name}: ask mapping has the cue`);
        }
    }
    assert.equal(n, 11, `found ${n} step-away reply timers`);
});

test('the success overlay counts as a panel for bubbles (so a bark under it is handed on and held, not played unseen)', () => {
    const src = readFileSync(join(sys, 'npc-world-bubbles.js'), 'utf8');
    const m = /export function successOverlayUp[\s\S]*?\n}\n/.exec(src);
    assert.ok(m, 'helper exists');
    const fn = new Function(`${m[0].replace('export ', '')}; return successOverlayUp;`)();
    assert.equal(fn({ getElementById: () => null }), false);
    assert.equal(fn({ getElementById: () => ({ style: {} }) }), true);
    assert.equal(fn({ getElementById: () => ({ style: { display: 'none' } }) }), false);
    assert.match(src, /return !!\(m && !m\._ending\) \|\| successOverlayUp\(\);/, 'minigameOpenNow reads it');
});

// ---- fix round 1: the real condition re-check, the quiet-flag race, reload re-arm, scene-end cancel ----
// These run the real ca05 shell mappings through the real _scheduleDelayedMapping / _handleEventMapping
// (no stubbed handler), with a small dispatcher that both the manager and its setGlobal emits share.
const ca05 = JSON.parse(readFileSync(join(here, '../../scenarios/ca05_signin_pages/scenario.json.erb'), 'utf8'));
const darrenMaps = () => Object.values(ca05.rooms).flatMap(r => r.npcs || []).find(n => n.id === 'kit_darren_price').eventMappings;
const ID = 'kit_darren_price';

function realRig(globals, { perceivable = () => true } = {}) {
    const bus = new Map();
    const dispatcher = {
        on(n, f) { if (!bus.has(n)) bus.set(n, []); bus.get(n).push(f); },
        off(n, f) { bus.set(n, (bus.get(n) || []).filter(x => x !== f)); },
        emit(n, d) { [...(bus.get(n) || [])].forEach(f => f(d)); },
    };
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    window.eventDispatcher = dispatcher;
    window.gameState = { globalVariables: { ...globals } };
    const cues = [];
    window.askCue = { perceivable: () => perceivable(), fire: (id, o) => cues.push({ id, ...o }) };
    const barks = [];
    const m = new NPCManager(dispatcher, { showBark: (o) => barks.push(o), answersInView: () => true });
    m.npcs.set(ID, { id: ID, npcType: 'person', displayName: 'Darren Price', storyPath: 'x' });
    // all of the colleague's mappings, the bark twins included (a recording bark system stands in for the real one)
    m._setupEventMappings(ID, darrenMaps());
    const g = window.gameState.globalVariables;
    const set = (k, v) => { const old = g[k]; g[k] = v; dispatcher.emit(`global_variable_changed:${k}`, { name: k, value: v, oldValue: old }); };
    // run every live timer once (a held ask re-arms itself with a new one)
    const run = () => { const due = timers.filter(x => x.live); due.forEach(x => { x.live = false; x.cb(); }); return due.length; };
    return { m, g, set, run, cues, barks, dispatcher, timers,
        restore() { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear;
            for (const k of ['eventDispatcher', 'gameState', 'askCue', 'MinigameFramework']) delete window[k]; } };
}
const live = { kit_ca05_out: true, kit_quiet: true, kit_ca05_prompt_choice: '', kit_ca05_done: false };

test('kit_quiet race: Look up, reopen the kiosk, close it (kit_quiet false) while the ask is held: the ask still fires and starts the reply clock', () => {
    let seen = false;
    const t = realRig(live, { perceivable: () => seen });
    try {
        t.set('kit_ca05_there', true);        // the ask is scheduled
        t.run();                              // delay up, not perceivable: held
        assert.equal(t.g.kit_ca05_asked, undefined, 'held');
        t.set('kit_quiet', false);            // the debrief was reopened and closed
        t.run();
        assert.equal(t.g.kit_ca05_asked, undefined, 'still held');
        seen = true;
        t.run();
        assert.equal(t.g.kit_ca05_asked, true, 'the real re-check kept the ask');
        assert.equal(t.cues.length, 1);
        assert.equal(t.cues[0].until, 'kit_ca05_prompt_choice');
        assert.equal(t.cues[0].ms, 45000, 'the marker lasts the reply window');
    } finally { t.restore(); }
});

test('an ask held while the colleague is answered directly, or the beat ends, is dropped by the real re-check', () => {
    for (const [k, v] of [['kit_ca05_prompt_choice', 'stop'], ['kit_ca05_prompt_choice', 'silent'], ['kit_ca05_done', true]]) {
        let seen = false;
        const t = realRig(live, { perceivable: () => seen });
        try {
            t.set('kit_ca05_there', true);
            t.run();
            t.set(k, v);
            seen = true;
            t.run();
            assert.equal(t.g.kit_ca05_asked, undefined, `${k}=${v}: no "is asking you something" after the answer`);
            assert.equal(t.cues.length, 0);
        } finally { t.restore(); }
    }
});

test('reload re-arm: the trigger is already true and nobody was asked, so game_loaded asks (and shows the cue)', () => {
    const t = realRig({ ...live, kit_ca05_there: true });
    try {
        t.dispatcher.emit('game_loaded', { restored: true });
        t.run(); t.run();
        assert.equal(t.g.kit_ca05_asked, true, 'asked after the reload');
        assert.equal(t.cues.length, 1);
        assert.ok(!t.cues[0].quiet, 'a first ask after a reload still toasts');
        assert.ok(t.barks.length >= 1, 'the bark twin of the re-arm ran through the real path');
    } finally { t.restore(); }
});

test('reload re-arm: already asked and unanswered shows only the marker again; answered, done or not yet there asks nothing', () => {
    const cases = [
        [{ ...live, kit_ca05_there: true, kit_ca05_asked: true }, 1, 'marker back'],
        [{ ...live, kit_ca05_there: true, kit_ca05_asked: true, kit_ca05_prompt_choice: 'silent' }, 0, 'answered'],
        [{ ...live, kit_ca05_there: true, kit_ca05_done: true }, 0, 'done'],
        [{ ...live, kit_ca05_there: false }, 0, 'not there yet (the timer resumes by itself)'],
        [{ kit_quiet: true, kit_ca05_prompt_choice: '' }, 0, 'no beat'],
    ];
    for (const [globals, cues, why] of cases) {
        const t = realRig(globals);
        try {
            const before = { ...t.g };
            t.dispatcher.emit('game_loaded', {});
            t.run(); t.run();
            assert.equal(t.cues.length, cues, why);
            if (cues) { assert.equal(t.g.kit_ca05_asked, before.kit_ca05_asked, `${why}: asked unchanged`); assert.equal(t.cues[0].quiet, true, `${why}: no second toast`); assert.equal(t.barks.length, 0, `${why}: no second ask bark`); }
            if (!cues) assert.equal(t.g.kit_ca05_asked, before.kit_ca05_asked, why);
        } finally { t.restore(); }
    }
});

test('scene end: removing the colleague cancels a held ask, so nothing fires later', () => {
    const t = realRig(live, { perceivable: () => false });
    try {
        t.set('kit_ca05_there', true);
        t.run();
        assert.ok(t.timers.some(x => x.live), 'a held ask is waiting');
        t.m._removeEventMappingListeners(ID);
        assert.equal(t.timers.filter(x => x.live).length, 0, 'cancelled with the NPC');
        window.askCue.perceivable = () => true;
        t.run();
        assert.equal(t.g.kit_ca05_asked, undefined);
        assert.equal(t.cues.length, 0);
    } finally { t.restore(); }
});

test('marker: 18x24 box, 2 px border, "!" bars inside the fill, drawn from rectangles in whole pixels', () => {
    assert.equal(MARKER.w, 18);
    assert.equal(MARKER.h, 24);
    assert.equal(MARKER.border, 2);
    const rects = [];
    const g = { setDepth() { return g; }, setPosition() { return g; }, setVisible() { return g; }, destroy() {}, fillStyle() { return g; },
        fillRect(...a) { rects.push(a); return g; } };
    const sprite = { x: 40, y: 60, depth: 0, displayHeight: 48, active: true, scene: { add: { graphics: () => g },
        events: { on() {}, off() {} }, time: { now: 0 } } };
    Object.assign(window, { npcManager: { getNPC: () => ({ displayName: 'D' }) }, npcBehaviorManager: { getBehavior: () => ({ sprite }) },
        showNotification() {}, gameState: { globalVariables: {} }, eventDispatcher: { on() {}, off() {} } });
    const realSet = globalThis.setTimeout; globalThis.setTimeout = () => 0;
    try { new AskCue().fire('n'); } finally { globalThis.setTimeout = realSet; }
    assert.deepEqual(rects[0], [0, 0, 18, 24], 'border box');
    assert.deepEqual(rects[1], [2, 2, 14, 20], 'fill inside the 2 px border');
    assert.equal(rects.length, 2 + MARKER.bars.length);
    for (const [x, y, w, h] of MARKER.bars) {
        assert.ok(Number.isInteger(x + y + w + h) && x >= 2 && y >= 2 && x + w <= 16 && y + h <= 22, 'bar inside the fill');
    }
});

test('marker: lasts the given reply window, stays through an unanswered conversation, goes when the choice global is answered', () => {
    const handlers = new Map(); const bus = new Map(); const timeouts = [];
    const realSet = globalThis.setTimeout; globalThis.setTimeout = (cb, ms) => { const t = { cb, ms }; timeouts.push(t); return t; };
    const g = { setDepth() { return g; }, setPosition() { return g; }, setVisible() { return g; }, destroy() { g.dead = true; }, fillStyle() { return g; }, fillRect() { return g; } };
    const sprite = { x: 1, y: 2, depth: 0, displayHeight: 48, active: true, scene: { add: { graphics: () => g },
        events: { on: (n, f) => handlers.set(n, f), off: (n) => handlers.delete(n) }, time: { now: 0 } } };
    Object.assign(window, { npcManager: { getNPC: () => ({ displayName: 'D' }) }, npcBehaviorManager: { getBehavior: () => ({ sprite }) },
        showNotification() {}, gameState: { globalVariables: { c: '' } },
        eventDispatcher: { on: (n, f) => bus.set(n, f), off: (n) => bus.delete(n) } });
    try {
        const cue = new AskCue();
        cue.fire('n', { ms: 60000, until: 'c' });
        assert.equal(timeouts.at(-1).ms, 60000, 'the piece\'s own reply window, not 45 s');
        assert.equal(bus.has('conversation_closed:n'), false, 'a closed conversation does not clear it');
        bus.get('global_variable_changed:c')({ value: '' });
        assert.ok(cue.markers.has('n'), 'still unanswered');
        bus.get('global_variable_changed:c')({ value: 'silent' });
        assert.equal(cue.markers.size, 0);
        window.gameState.globalVariables.c = 'stop';
        cue.fire('n', { until: 'c' });
        assert.equal(cue.markers.size, 0, 'already answered: no marker');
    } finally { globalThis.setTimeout = realSet; for (const k of ['npcManager', 'npcBehaviorManager', 'showNotification', 'gameState', 'eventDispatcher']) delete window[k]; }
});

test('every step-away shell: backstop from out, ask free of kit_quiet and gated on not done / not answered, re-arm appended last', () => {
    const root = join(here, '../../scenarios');
    let n = 0;
    for (const name of readdirSync(root).filter(d => /^ca\d\d_/.test(d))) {
        let sc;
        try { sc = JSON.parse(readFileSync(join(root, name, 'scenario.json.erb'), 'utf8')); } catch (e) { continue; }
        const ts = sc.timers || [];
        const tail = ts.find(t => /_asked$/.test(t.startOnGlobal || '') && Object.keys(t.setGlobal || {}).some(k => /_choice$/.test(k)));
        if (!tail) continue;
        n++;
        const doneT = ts.find(t => /_t_done$/.test(t.id));
        const outT = ts.find(t => t.id === `${doneT.id}_out`);
        assert.ok(outT, `${name}: _t_done_out exists`);
        assert.match(outT.startOnGlobal, /_out$/);
        assert.deepEqual(outT.setGlobal, doneT.setGlobal);
        assert.ok(outT.condition.includes(`globalVars.${tail.startOnGlobal} !== true`), `${name}: the backstop never cuts an asked beat`);
        assert.ok(outT.delayMs >= doneT.delayMs + 60000, `${name}: backstop is later than the ask-based timer`);
        for (const npc of Object.values(sc.rooms).flatMap(r => r.npcs || [])) {
            const maps = npc.eventMappings || [];
            const asks = maps.filter(m => m.setGlobal && tail.startOnGlobal in m.setGlobal && m.eventPattern !== 'game_loaded');
            if (!asks.length) continue;
            const done = Object.keys(doneT.setGlobal)[0], choice = Object.keys(tail.setGlobal)[0];
            for (const a of asks) {
                assert.ok(!/kit_quiet/.test(a.condition), `${name}: ask does not wait on kit_quiet`);
                assert.ok(a.condition.includes(`!globalVars.${done}`) && a.condition.includes(`globalVars.${choice} === ''`), `${name}: ask is gated`);
            }
            const rearm = maps.filter(m => m.eventPattern === 'game_loaded');
            assert.ok(rearm.length >= 2, `${name}: re-arm mappings`);
            assert.ok(rearm.filter(m => m.askCue && m.askCueQuiet === true).length === 1 && rearm.every(m => !m.askCue || m.askCueQuiet === true || m.setGlobal), `${name}: only the marker-only copy is quiet`);
            assert.ok(maps.slice(maps.length - rearm.length).every(m => m.eventPattern === 'game_loaded'), `${name}: re-arm mappings are last`);
        }
    }
    assert.equal(n, 11, `checked ${n} shells`);
});

test('AskCue.fire quiet: the marker is drawn again but the toast is not shown twice (reload while asked)', () => {
    const toasts = []; const timeouts = [];
    const realSet = globalThis.setTimeout; globalThis.setTimeout = (cb, ms) => { const t = { cb, ms }; timeouts.push(t); return t; };
    const g = { setDepth() { return g; }, setPosition() { return g; }, setVisible() { return g; }, destroy() {}, fillStyle() { return g; }, fillRect() { return g; } };
    const sprite = { x: 1, y: 2, depth: 0, displayHeight: 48, active: true, scene: { add: { graphics: () => g },
        events: { on() {}, off() {} }, time: { now: 0 } } };
    Object.assign(window, { npcManager: { getNPC: () => ({ displayName: 'D' }) }, npcBehaviorManager: { getBehavior: () => ({ sprite }) },
        showNotification: (t) => toasts.push(t), gameState: { globalVariables: { c: '' } }, eventDispatcher: { on() {}, off() {} } });
    try {
        const cue = new AskCue();
        cue.fire('n', { ms: 45000, until: 'c', quiet: true });
        assert.equal(toasts.length, 0, 'no toast');
        assert.ok(cue.markers.has('n'), 'marker back');
        cue.fire('n', { ms: 45000, until: 'c' });
        assert.equal(toasts.length, 1, 'a normal ask still toasts');
    } finally { globalThis.setTimeout = realSet; for (const k of ['npcManager', 'npcBehaviorManager', 'showNotification', 'gameState', 'eventDispatcher']) delete window[k]; }
});

// The scenario timers of a real shell, run on a tiny clock: a timer starts when its startOnGlobal is true,
// fires delayMs later, and sets its globals if its condition holds then (scenario-timer-dispatcher.js).
function runTimers(sc, events, until) {
    const globals = {};
    for (const t of sc.timers || []) for (const k of Object.keys(t.setGlobal || {})) globals[k] = /_choice$/.test(k) ? '' : false;
    const timers = (sc.timers || []).filter(t => t.startOnGlobal);
    const started = new Map(); const log = [];
    const queue = events.map(([t, k, v]) => ({ t: t * 1000, k, v }));
    const holds = (c) => !c || new Function('globalVars', `return (${c});`)(globals);
    const setG = (t, k, v) => { globals[k] = v; log.push([t / 1000, k, v]);
        for (const tm of timers) if (tm.startOnGlobal === k && v && !started.has(tm.id)) { started.set(tm.id, t); queue.push({ t: t + tm.delayMs, timer: tm }); } };
    while (queue.length) {
        queue.sort((a, b) => a.t - b.t);
        const e = queue.shift();
        if (e.t > until * 1000) break;
        if (e.timer) { if (holds(e.timer.condition)) for (const [k, v] of Object.entries(e.timer.setGlobal || {})) setG(e.t, k, v); }
        else setG(e.t, e.k, e.v);
    }
    return { globals, log };
}

test('backstop: an ask held for 100+ s after `out` still gets its whole window and its follow-through; a beat never asked still reaches done', () => {
    const root = join(here, '../../scenarios');
    let n = 0;
    for (const name of readdirSync(root).filter(d => /^ca\d\d_/.test(d))) {
        let sc;
        try { sc = JSON.parse(readFileSync(join(root, name, 'scenario.json.erb'), 'utf8')); } catch (e) { continue; }
        const ts = sc.timers || [];
        const tail = ts.find(t => /_asked$/.test(t.startOnGlobal || '') && Object.keys(t.setGlobal || {}).some(k => /_choice$/.test(k)));
        if (!tail) continue;
        n++;
        const doneT = ts.find(t => /_t_done$/.test(t.id));
        const done = Object.keys(doneT.setGlobal)[0], choice = Object.keys(tail.setGlobal)[0], out = ts.find(t => t.id === `${doneT.id}_out`).startOnGlobal;
        // held: out at 0, the ask lands at 100 s (colleague off camera, player in a minigame)
        const held = runTimers(sc, [[0, out, true], [100, tail.startOnGlobal, true]], 600);
        const at = (log, k, v) => (log.find(([, key, val]) => key === k && val === v) || [])[0];
        const silentAt = at(held.log, choice, tail.setGlobal[choice]), doneAt = at(held.log, done, true);
        assert.ok(silentAt !== undefined && silentAt >= 100 + tail.delayMs / 1000 - 0.001, `${name}: the full reply window ran (silent at ${silentAt})`);
        assert.ok(doneAt > silentAt, `${name}: done (${doneAt}) lands after silent (${silentAt}), so the follow-through can play`);
        // never asked: done still arrives, from the backstop
        const never = runTimers(sc, [[0, out, true]], 600);
        assert.ok(at(never.log, done, true) > 0, `${name}: never asked still reaches done`);
        assert.equal(at(never.log, choice, tail.setGlobal[choice]), undefined);
    }
    assert.equal(n, 11);
});

test('marker hangs just above the top of the asker\'s frame, not half a frame higher', () => {
    // 80 px frame, origin 0.5, centre y 185: the frame top is 145
    const sprite = { x: 400, y: 185, displayHeight: 80, originY: 0.5 };
    const p = markerPosition(sprite);
    assert.equal(p.y + MARKER.h, 145 - 2, 'bottom edge 2 px above the frame top');
    assert.equal(p.x, 400 - MARKER.w / 2, 'centred on the asker');
    assert.equal(markerPosition(sprite, 2).y, p.y + 2, 'the bob moves it by its own amount only');
    // origin at the feet (originY 1): the frame top is y - displayHeight
    assert.equal(markerPosition({ x: 0, y: 200, displayHeight: 80, originY: 1 }).y + MARKER.h, 120 - 2);
    // headInset moves it down onto a figure that sits lower in its frame (seated)
    assert.equal(markerPosition(sprite, 0, { headInset: 16 }).y, p.y + 16);
    // the live path measures the inset and passes it
    assert.match(rd('systems/ask-cue.js'), /markerPosition\(sprite, bob, \{ headInset:/);
});

test('headRowsFor counts the empty rows above the figure, once per frame, and falls back to 0', () => {
    let calls = 0;
    const alpha = (x, y) => { calls++; return (y >= 16 && x === 40) ? 255 : 0; };
    const sprite = { texture: { key: 'npc_a' }, frame: { name: 'sit_south_frame_000', width: 80, height: 80 } };
    assert.equal(headRowsFor(sprite, alpha), 16);
    const first = calls;
    assert.equal(headRowsFor(sprite, alpha), 16, 'cached');
    assert.equal(calls, first, 'no second scan');
    assert.equal(headRowsFor({ texture: { key: 'npc_b' }, frame: { name: 'f', width: 4, height: 4 } }, () => 0), 0, 'empty frame keeps the frame top');
    assert.equal(headRowsFor(sprite, null), 0, 'no texture manager: frame top');
});

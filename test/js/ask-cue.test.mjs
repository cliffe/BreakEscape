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
const { askPerceivable, askToastText, AskCue, DEFAULT_REPLY_MS } = await import(pathToFileURL(join(dir, 'ask-cue.mjs')).href);
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
        const timers = (sc.timers || []).filter(t => /_asked$/.test(t.startOnGlobal || '') && Object.values(t.setGlobal || {}).includes('silent'));
        for (const t of timers) {
            n++;
            assert.ok(t.delayMs >= DEFAULT_REPLY_MS, `${name} ${t.id}: window ${t.delayMs}`);
            const maps = Object.values(sc.rooms || {}).flatMap(r => (r.npcs || []).flatMap(x => x.eventMappings || []));
            const ask = maps.filter(m => m.setGlobal && t.startOnGlobal in m.setGlobal);
            assert.ok(ask.length && ask.every(m => m.askCue === true && m.whenPerceivable === true && m.delayMs >= 1), `${name}: ask mapping has the cue`);
        }
    }
    assert.ok(n >= 9, `found ${n} step-away reply timers`);
});

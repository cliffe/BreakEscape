// The other launch routes for a minigame, and the starter registry behind all three:
//  - object: interactions.js dispatches case-file, osint-workstation, triage-workstation,
//    authenticator-device, kiosk, page-builder, report-workstation, mail_terminal and
//    exercise-station through systems/minigame-registry.js, with today's alerts when a
//    starter is missing and the report workstation's stage gate unchanged;
//  - event mapping: an `openMinigame` action opens a registry type once nothing else is open,
//    honours onceOnly / cooldown / condition like the other actions, and is saved for a reload
//    only once the minigame closes normally;
//  - timedConversation: videoCall (or conversationMode "video-call"), videoLabel and
//    participantTag reach person-chat, for a phone NPC too; absent, nothing changes.
// Run with: node --test test/js/minigame-launch-routes.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'minigame-launch-routes-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

globalThis.window = { gameState: { globalVariables: {} } };

// ── the registry, with the exercise-station starter stubbed ───────────────────────
const stationCalls = [];
globalThis.__stationCalls = stationCalls;
writeFileSync(join(dir, 'station-stub.mjs'),
    'export function startExerciseStation(obj, options) { globalThis.__stationCalls.push({ obj, options }); }\n');
copy('systems/minigame-registry.js', 'minigame-registry.mjs',
    (s) => s.replace("'./exercise-station-starter.js'", "'./station-stub.mjs'"));
const registry = await import(pathToFileURL(join(dir, 'minigame-registry.mjs')).href);

// ── interactions.js with its imports stubbed (as examine-minigame.test.mjs does) ──
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const stubs = {
    '../utils/constants.js': dataUrl('export const INTERACTION_RANGE = 64, INTERACTION_RANGE_SQ = 4096, INTERACTION_CHECK_INTERVAL = 100, DOOR_INTERACTION_RANGE_SQ = 4096; export const overlayDepth = (d) => d;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    '../core/player.js': dataUrl('export function facePlayerToward() {}'),
    './unlock-system.js': dataUrl('export function handleUnlock() {}'),
    './doors.js': dataUrl('export function handleDoorInteraction() {}'),
    './biometrics.js': dataUrl('export function collectFingerprint() { return null; } export function handleBiometricScan() {}'),
    './inventory.js': dataUrl('export function addToInventory() {} export function createItemIdentifier(d) { return d?.id; }'),
    './ui-sounds.js': dataUrl('export function playUISound() {} export function playGameSound() {}'),
    './apply-actions.js': dataUrl('export function applyActions() {}'),
    '../utils/conditional-text.js': dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8')),
    '../utils/flag-lock.js': dataUrl(readFileSync(join(js, 'utils/flag-lock.js'), 'utf8')),
    './npc-reach.js': dataUrl('export function npcReachDistSq() { return 0; }'),
    './examine.js': dataUrl('export function shouldExamine() { return false; } export function startExamine() {}'),
    './combat-input.js': dataUrl(readFileSync(join(js, 'systems/combat-input.js'), 'utf8')),
    './consumables.js': dataUrl(readFileSync(join(js, 'systems/consumables.js'), 'utf8')),
    './interaction-walls.js': dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8')),
    './interaction-reach.js': dataUrl(readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8')),
    './minigame-registry.js': pathToFileURL(join(dir, 'minigame-registry.mjs')).href
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);

const alerts = [];
const calls = [];
Object.assign(window, {
    MinigameFramework: { currentMinigame: null, registeredScenes: {}, startMinigame() {} },
    inventory: { items: [] },
    player: { x: 0, y: 0, direction: 'down' },
    gameAlert: (msg, type, title) => alerts.push([msg, type, title]),
    gameDisplay: () => {},
    lockRef: () => null,
    npcManager: { getNPC: () => ({}) }
});
const { handleObjectInteraction } = await import(dataUrl(src));

const sprite = (data) => ({ name: data.type, objectId: data.id, x: 0, y: 8, scenarioData: data,
    texture: { key: data.type }, frame: { name: '__BASE', cutWidth: 32, cutHeight: 24 } });
const STARTERS = {
    'case-file': 'startIntelBoardMinigame',
    'osint-workstation': 'startOsintBrowserMinigame',
    'triage-workstation': 'startInboxTriageMinigame',
    'authenticator-device': 'startAuthenticatorDevice',
    'kiosk': 'startEpisodeRunner',
    'page-builder': 'startLandingPageBuilder',
    'report-workstation': 'startEngagementReport',
    'mail_terminal': 'startMailClientMinigame'
};
function reset() {
    alerts.length = 0; calls.length = 0; stationCalls.length = 0;
    window.gameState = { globalVariables: {} };
    for (const fn of Object.values(STARTERS)) delete window[fn];
}

test('registry: the object types, wrapping a bare object-like, and unknown types', () => {
    assert.deepEqual([...registry.listMinigameTypes()].sort(), [...Object.keys(STARTERS), 'exercise-station'].sort());
    assert.equal(registry.hasMinigameStarter('nope'), false);
    reset();
    assert.equal(registry.startRegisteredMinigame('nope', {}), false, 'an unknown type reports false and opens nothing');
    window.startMailClientMinigame = (obj, options) => calls.push(['mail', obj, options]);
    assert.equal(registry.startRegisteredMinigame('mail_terminal', { name: 'Desk', minigameData: { accountIds: ['a'] } }, { x: 1 }), true);
    assert.deepEqual(calls[0][1].scenarioData, { type: 'mail_terminal', name: 'Desk', minigameData: { accountIds: ['a'] } });
    assert.deepEqual(calls[0][2], { x: 1 });
    const real = { scenarioData: { type: 'mail_terminal', minigameData: {} } };
    registry.startRegisteredMinigame('mail_terminal', real);
    assert.equal(calls[1][1], real, 'a real object is passed as it is');
});

for (const [type, fn] of Object.entries(STARTERS)) {
    test(`object route: ${type} opens through ${fn}`, () => {
        reset();
        window[fn] = (s) => calls.push([fn, s.scenarioData.id]);
        handleObjectInteraction(sprite({ type, id: 'o1', name: 'Thing', takeable: false, minigameData: {} }));
        assert.deepEqual(calls, [[fn, 'o1']]);
        assert.deepEqual(alerts, []);
    });
    test(`object route: ${type} with no starter loaded alerts instead`, () => {
        reset();
        handleObjectInteraction(sprite({ type, id: 'o2', name: 'Thing', takeable: false, minigameData: {} }));
        assert.equal(alerts.length, 1);
        assert.match(alerts[0][0], /unavailable/);
        assert.equal(alerts[0][1], 'error');
    });
}

test('object route: the report workstation keeps its stage gate', () => {
    reset();
    window.startEngagementReport = () => calls.push('report');
    const data = { type: 'report-workstation', id: 'r1', name: 'Report', takeable: false,
        minigameData: { requiresGlobal: 'sends_done', lockedMessage: 'Not yet.' } };
    handleObjectInteraction(sprite(data));
    assert.deepEqual(calls, []);
    assert.equal(alerts[0][0], 'Not yet.');
    window.gameState.globalVariables.sends_done = true;
    handleObjectInteraction(sprite(data));
    assert.deepEqual(calls, ['report']);
});

test('object route: exercise-station reaches the station starter with the object', () => {
    reset();
    const data = { type: 'exercise-station', id: 'st1', name: 'Drill', takeable: false,
        minigameData: { scene: 'sort-drill', exerciseId: 'sort_basic' } };
    handleObjectInteraction(sprite(data));
    assert.equal(stationCalls.length, 1);
    assert.equal(stationCalls[0].obj.scenarioData.minigameData.exerciseId, 'sort_basic');
    assert.deepEqual(alerts, []);
});

// ── event mapping: openMinigame ────────────────────────────────────────────────────
copy('systems/mapping-minigame.js', 'mapping-minigame.mjs', (s) => s.replace("'./minigame-registry.js'", "'./minigame-registry.mjs'"));
const mapping = await import(pathToFileURL(join(dir, 'mapping-minigame.mjs')).href);

copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs',
    (s) => s.replace("'./npc-los.js'", "'./npc-los.mjs'").replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter((f) => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach((cb) => cb(data)); }
    };
}

function setup() {
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    const opened = [];
    const fw = {
        currentMinigame: null,
        opened,
        startMinigame(type, container, params) {
            const mg = { type, params, _ending: false };
            this.currentMinigame = mg;
            opened.push({ type, params });
            return mg;
        },
        endMinigame() { if (this.currentMinigame) this.currentMinigame._ending = true; this.currentMinigame = null; }
    };
    window.MinigameFramework = fw;
    window.gameState = { globalVariables: {} };
    window.openMinigameFromMapping = mapping.openMinigameFromMapping;
    window.startMailClientMinigame = (obj, options) => { opened.push({ type: 'mail-client', obj, options }); };
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('reed', { id: 'reed', npcType: 'person', displayName: 'Reed', currentKnot: 'start' });
    m.npcs.set('ghost', { id: 'ghost', npcType: 'phone', displayName: 'Ghost', phoneId: 'player_phone', currentKnot: 'start' });
    const runDue = () => {
        const due = timers.filter((t) => t.live);
        due.forEach((t) => { t.live = false; t.cb(); });
        return due.length;
    };
    const runAll = (max = 20) => { for (let i = 0; i < max && runDue(); i++); };
    return { m, fw, opened, timers, runAll, restore() { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; delete window.MinigameFramework; delete window.openMinigameFromMapping; delete window.startMailClientMinigame; } };
}
const fire = (m, config) => m._handleEventMapping('reed', 'test_event', { cooldown: 0, handlerIndex: 0, ...config }, {});

test('mapping: a registry type opens after the short delay, once nothing else is open', () => {
    const t = setup();
    try {
        fire(t.m, { openMinigame: { type: 'mail_terminal', minigameData: { accountIds: ['a'] }, name: 'Desk' } });
        assert.equal(t.opened.length, 0, 'not at the event itself');
        t.runAll();
        assert.equal(t.opened.length, 1);
        assert.equal(t.opened[0].type, 'mail-client');
        assert.deepEqual(t.opened[0].obj.scenarioData.minigameData, { accountIds: ['a'] });
        assert.equal(t.opened[0].obj.scenarioData.name, 'Desk');
    } finally { t.restore(); }
});

test('mapping: a bare string is a type with empty minigameData', () => {
    const t = setup();
    try {
        fire(t.m, { openMinigame: 'mail_terminal' });
        t.runAll();
        assert.deepEqual(t.opened[0].obj.scenarioData.minigameData, {});
    } finally { t.restore(); }
});

test('mapping: it waits while another minigame is open, and opens after it closes', () => {
    const t = setup();
    try {
        t.fw.currentMinigame = { type: 'person-chat', _ending: false, params: {} };
        fire(t.m, { openMinigame: 'mail_terminal' });
        t.runAll(4);
        assert.equal(t.opened.length, 0, 'waits behind the open conversation');
        t.fw.currentMinigame = null;
        t.runAll();
        assert.equal(t.opened.length, 1);
    } finally { t.restore(); }
});

test('mapping: an unknown type warns and opens nothing; the rest of the mapping still runs', () => {
    const t = setup();
    try {
        fire(t.m, { openMinigame: 'no-such-type', setGlobal: { seen: true } });
        t.runAll();
        assert.equal(t.opened.length, 0);
        assert.equal(window.gameState.globalVariables.seen, true);
    } finally { t.restore(); }
});

test('mapping: onceOnly and condition are applied as for any action', () => {
    const t = setup();
    try {
        const config = { openMinigame: 'mail_terminal', once: true, condition: 'value === true' };
        t.m._handleEventMapping('reed', 'g', config, { value: false });
        t.runAll();
        assert.equal(t.opened.length, 0, 'the condition did not hold');
        t.m._handleEventMapping('reed', 'g', config, { value: true });
        t.m._handleEventMapping('reed', 'g', config, { value: true });
        t.runAll();
        assert.equal(t.opened.length, 1, 'onceOnly: the second event opens nothing');
    } finally { t.restore(); }
});

test('mapping: a onceOnly open is saved for a reload only once the minigame closes normally', () => {
    const t = setup();
    try {
        fire(t.m, { openMinigame: 'mail_terminal', once: true });
        t.runAll();
        assert.deepEqual(Object.keys(t.m.exportTriggeredEvents()), [], 'not saved while the minigame is open');
        const options = t.opened[0].options;
        options.onComplete(false, { aborted: true });
        assert.deepEqual(Object.keys(t.m.exportTriggeredEvents()), [], 'an abort is not a finish');
        options.onComplete(true, {});
        assert.deepEqual(Object.keys(t.m.exportTriggeredEvents()), ['reed:test_event:0']);
    } finally { t.restore(); }
});

// ── timedConversation: video calls ─────────────────────────────────────────────────
function timed(m, npcId, extra = {}) {
    m.scheduleTimedConversation({ npcId, targetKnot: 'briefing', delay: 0, ...extra });
    const conv = m.timedConversations[m.timedConversations.length - 1];
    conv.delivered = true;
    m._deliverTimedConversation(conv);
}

test('timedConversation videoCall: person-chat opens as a video call with its label and tag', () => {
    const t = setup();
    try {
        timed(t.m, 'reed', { videoCall: true, videoLabel: 'Brightwell Meet', participantTag: 'External' });
        t.runAll();
        assert.equal(t.opened[0].type, 'person-chat');
        assert.equal(t.opened[0].params.videoCall, true);
        assert.equal(t.opened[0].params.videoLabel, 'Brightwell Meet');
        assert.equal(t.opened[0].params.participantTag, 'External');
        assert.equal(t.m.getNPC('reed').currentKnot, 'briefing');
    } finally { t.restore(); }
});

test('timedConversation video call: a phone NPC is called as a person-chat, as an event mapping does', () => {
    const t = setup();
    try {
        timed(t.m, 'ghost', { videoCall: true });
        t.runAll();
        assert.equal(t.opened[0].type, 'person-chat');
        assert.equal(t.opened[0].params.videoCall, true);
        assert.equal(t.opened[0].params.videoLabel, null);
        assert.equal(t.opened[0].params.participantTag, null);
    } finally { t.restore(); }
});

test('timedConversation without a video call is unchanged', () => {
    const t = setup();
    try {
        timed(t.m, 'reed', {});
        timed(t.m, 'ghost', {});
        t.runAll();
        const person = t.opened.find((o) => o.params.npcId === 'reed');
        assert.equal('videoCall' in person.params, false);
        assert.equal('videoLabel' in person.params, false);
        t.fw.endMinigame();
        t.runAll();
        const phone = t.opened.find((o) => o.params.npcId === 'ghost');
        assert.equal(phone.type, 'phone-chat');
        assert.equal('videoCall' in phone.params, false);
    } finally { t.restore(); }
});

test('timedConversation: the NPC entry\'s videoCall / conversationMode reach the schedule', () => {
    const t = setup();
    try {
        const entries = [];
        t.m.scheduleTimedConversation = (opts) => entries.push(opts);
        t.m.registerNPC({ id: 'caller', npcType: 'person', displayName: 'Caller', storyPath: 'x.json', currentKnot: 'start',
            timedConversation: { delay: 0, targetKnot: 'call', conversationMode: 'video-call', videoLabel: 'Meet', participantTag: 'Guest' } });
        t.m.registerNPC({ id: 'plain', npcType: 'person', displayName: 'Plain', storyPath: 'x.json', currentKnot: 'start',
            timedConversation: { delay: 0, targetKnot: 'hello' } });
        const call = entries.find((e) => e.npcId === 'caller');
        assert.equal(call.videoCall, true);
        assert.equal(call.videoLabel, 'Meet');
        assert.equal(call.participantTag, 'Guest');
        const plain = entries.find((e) => e.npcId === 'plain');
        assert.equal(plain.videoCall, false);
        assert.equal(plain.videoLabel, null);
    } finally { t.restore(); }
});

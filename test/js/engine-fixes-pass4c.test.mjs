// Engine fixes from the sis01 pass-4 playtests (2026-10-03):
//  - D14: scenario timers resume after a reload (game clock + saved timer state)
//  - N2: NPC visibility set by setVisible survives a reload
//  - D8/D9/D10/D15: command board stamps entries with game time, in order, and
//    says the right thing on each path
//  - D2: event-triggered conversations keep the NPC's saved story state
// Run with: node --test test/js/engine-fixes-pass4c.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));

globalThis.window = { gameState: { globalVariables: {} } };

const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Load browser module source, swapping its relative imports for the given URLs
async function load(rel, imports = {}) {
    let src = readFileSync(join(js, rel), 'utf8');
    for (const [spec, url] of Object.entries(imports)) {
        src = src.split(`'${spec}'`).join(`'${url}'`);
    }
    return import(dataUrl(src));
}

const conditionUrl = dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8'));
const { GameClock, parseGameClockStart } = await load('systems/game-clock.js');
const { ScenarioTimerDispatcher } = await load('ui/scenario-timer-dispatcher.js', {
    '../systems/apply-actions.js': dataUrl('export function applyActions() {}')
});
const { ScenarioTimerUI } = await load('ui/scenario-timer.js', {
    '../utils/display-dashes.js': dataUrl('export const displayDashes = (s) => s;')
});
const timeline = await load('minigames/command-board/command-board-timeline.js', {
    '../../utils/global-condition.js': conditionUrl
});
const { startEventConversation } = await load('minigames/person-chat/person-chat-event-start.js');
const { default: NPCManager } = await load('systems/npc-manager.js', {
    './npc-los.js': dataUrl(readFileSync(join(js, 'systems/npc-los.js'), 'utf8')),
    '../minigames/phone-chat/phone-chat-speaker.js':
        dataUrl(readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'))
});
const stateManagerSrc = readFileSync(join(js, 'systems/npc-conversation-state.js'), 'utf8');
const stateManagerSingleton = (await import(dataUrl(stateManagerSrc))).default;

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) {
            (listeners.get(name) || []).slice().forEach(cb => cb(data));
            for (const [key, arr] of listeners) {
                if (key.endsWith('*') && name.startsWith(key.slice(0, -1))) arr.slice().forEach(cb => cb(data, name));
            }
        }
    };
}

function resetWindow(globals = {}) {
    globalThis.window = { gameState: { globalVariables: { ...globals } }, eventDispatcher: makeDispatcher() };
}

// ── D14: timers ─────────────────────────────────────────────────────────────

const sisTimers = () => ({
    timers: [
        { id: 'bed4_1', delayMs: 480000, setGlobal: { patient_bed4_state: 'distressed' }, showCountdown: true, label: 'Patient Deterioration' },
        { id: 'bed4_3', delayMs: 1320000, setGlobal: { patient_bed4_deceased: true, patient_bed4_state: 'deceased' }, showCountdown: true, label: 'Critical Event' },
        { id: 'ico', delayMs: 2700000, condition: '!globalVars.ico_notified', setGlobal: { ico_deadline_missed: true }, showCountdown: true, label: 'ICO Notification Deadline' },
        { id: 'bed2', delayMs: 180000, startOnGlobal: 'pump_dose_error', setGlobal: { patient_bed2_deceased: true }, showCountdown: false }
    ]
});

test('timers resume from the saved elapsed time instead of restarting at zero', () => {
    resetWindow();
    const t0 = Date.now() - 1404000;       // started 23:24 of game time ago
    const before = new ScenarioTimerDispatcher(sisTimers(), { startTime: t0 });
    before.update(t0 + 500000);            // bed4_1 fires at 480 s
    window.gameState.globalVariables.pump_dose_error = true;
    window.eventDispatcher.emit('global_variable_changed:pump_dose_error', { value: true });
    const saved = JSON.parse(JSON.stringify(before.exportState()));
    assert.ok(Math.abs(saved.elapsedMs - 1404000) < 1000);
    assert.deepEqual(saved.fired, ['bed4_1']);
    assert.ok(saved.started.bed2 >= 0 && saved.started.bed2 < 1000);

    // Reload (the page was closed for a while): game time carries on from the save
    window.gameState.globalVariables.patient_bed4_state = 'distressed';
    const clock = new GameClock({ saved: { elapsedMs: saved.elapsedMs + 60000 } });   // a minute later
    const after = new ScenarioTimerDispatcher(sisTimers(), { startTime: clock.startTime, saved: { ...saved, started: { bed2: 60000 } } });
    const now = Date.now();
    assert.ok(Math.abs(after.exportState(now).elapsedMs - 1464000) < 1000);

    const ico = after.timers.find(t => t.id === 'ico');
    const icoLeft = ico.delayMs - (now - after.getTimerStartTime(ico));
    assert.ok(Math.abs(icoLeft - 1236000) < 1000, `ICO clock resumes at 20:36, not 45:00 (got ${icoLeft})`);
    assert.ok(after.isDone('bed4_1'), 'a fired timer stays fired');

    // bed2 had run 60 s before the reload: it resumes with 120 s left
    const bed2 = after.timers.find(t => t.id === 'bed2');
    assert.ok(Math.abs((now - after.getTimerStartTime(bed2)) - 60000) < 1000);
});

test('a fired timer does not refire or come back on the HUD after a reload', () => {
    resetWindow({ patient_bed4_state: 'deceased', patient_bed4_deceased: true });
    // Saved: bed4_1 fired earlier; its setGlobal no longer matches (state moved on), so
    // the old "setGlobal already set" check alone would have restarted it
    const saved = { elapsedMs: 1400000, fired: ['bed4_1', 'bed4_3'], cancelled: [], started: {} };
    window.scenarioTimerUI = null;
    globalThis.document = {
        getElementById: () => null,
        createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {} }),
        body: { appendChild() {} }
    };
    const ui = new ScenarioTimerUI(null, sisTimers());
    clearInterval(ui.tickInterval);
    const d = new ScenarioTimerDispatcher(sisTimers(), { saved, startTime: Date.now() - 1400000 });
    window.scenarioTimerDispatcher = d;
    let fired = 0;
    window.eventDispatcher.on('global_variable_changed:patient_bed4_state', () => fired++);
    d.update(Date.now());
    assert.equal(fired, 0);
    // The widget shows the ICO deadline, not a deterioration countdown for a dead patient
    assert.equal(ui._getNextPendingTimer().id, 'ico');
    delete window.scenarioTimerDispatcher;
    delete globalThis.document;
});

test('an older save without timer state still starts (no crash, previous behaviour)', () => {
    resetWindow({ pump_dose_error: true });
    const now = Date.now();
    const d = new ScenarioTimerDispatcher(sisTimers(), { saved: null });
    const bed2 = d.timers.find(t => t.id === 'bed2');
    assert.ok(now - 1000 <= d.getTimerStartTime(bed2));
    assert.ok(d.startTime >= now - 1000);
});

test('a cancelled timer stays cancelled across a reload', () => {
    resetWindow();
    const d = new ScenarioTimerDispatcher(sisTimers(), { saved: { elapsedMs: 10, fired: [], cancelled: ['ico'], started: {} } });
    assert.ok(d.isDone('ico'));
});

// ── Game clock ──────────────────────────────────────────────────────────────

test('in-game clock: start plus elapsed time, rolling over the day', () => {
    assert.deepEqual(parseGameClockStart({ start: 'Tue 07:30' }), { dayIndex: 2, seconds: 27000 });
    assert.deepEqual(parseGameClockStart('Monday 22:38:10'), { dayIndex: 1, seconds: 81490 });
    assert.equal(parseGameClockStart('07:30').dayIndex, null);
    assert.equal(parseGameClockStart('Blursday 07:30'), null);
    assert.equal(parseGameClockStart({}), null);

    const c = new GameClock({ config: { start: 'Tue 07:30' }, saved: { elapsedMs: 12 * 60000 }, now: 0 });
    assert.ok(c.configured);
    assert.equal(c.formatStamp(c.elapsedMs(0)), 'Tue 07:42');
    assert.equal(c.formatClock(c.elapsedMs(5000), true), '07:42:05');
    assert.equal(c.formatStamp(17 * 3600 * 1000), 'Wed 00:30');

    const plain = new GameClock({ now: 0 });
    assert.equal(plain.configured, false);
});

// ── N2: NPC visibility ──────────────────────────────────────────────────────

test('setVisible is saved and applied when the NPC registers after a reload', () => {
    resetWindow();
    const before = new NPCManager(makeDispatcher(), null);
    before.registerNPC({ id: 'hamza', npcType: 'person', behavior: { initiallyHidden: true } });
    before.recordNpcVisibility('hamza', true);         // revealed with the sprite present
    assert.equal(before.getNPC('hamza').isVisible, true);
    const saved = JSON.parse(JSON.stringify(before.exportNpcVisibility()));
    assert.deepEqual(saved, { hamza: true });

    const after = new NPCManager(makeDispatcher(), null);
    after.restoreNpcVisibility(saved);
    // Room data still says hidden; the saved reveal wins over initiallyHidden
    const entry = after.registerNPC({ id: 'hamza', npcType: 'person', behavior: { initiallyHidden: true } });
    assert.equal(entry.isVisible, true);
    // and a hide is kept too
    after.recordNpcVisibility('priya', false);
    assert.equal(after.registerNPC({ id: 'priya', npcType: 'person', isVisible: true }).isVisible, false);
});

test('a visibility change this session wins over the restored one', () => {
    const m = new NPCManager(makeDispatcher(), null);
    m.recordNpcVisibility('x', false);
    m.restoreNpcVisibility({ x: true, y: true, junk: 'yes' });
    assert.deepEqual(m.exportNpcVisibility(), { x: false, y: true });
});

// ── Command board ───────────────────────────────────────────────────────────

const defs = timeline.BUILTIN_TIMELINE;

// A recorder driven by a fake game clock; set(k, v, t) changes a global at game time t,
// as an event would, whether or not the board is open
function recorderHarness({ initial = {}, saved = [], config = {} } = {}) {
    const g = { ...initial };
    let now = 0;
    const dispatcher = makeDispatcher();
    const rec = new timeline.CommandBoardRecorder({ config, saved, initialGlobals: initial, now: () => now });
    rec.attach(dispatcher, () => g);
    return {
        rec, g,
        set(k, v, t) {
            now = t; g[k] = v;
            dispatcher.emit(`global_variable_changed:${k}`, { name: k, value: v });
        },
        at(t) { now = t; }
    };
}
const ids = (list) => list.map(e => e.id);

test('board entries are stamped when they happened and in time order (D8, D10)', () => {
    const h = recorderHarness();
    h.set('pump_dose_correct', true, 60000);
    h.set('safety_claim_hc001_assessed', true, 120000);
    h.set('network_isolation_authorised', true, 300000);
    h.set('network_isolated', true, 310000);
    const recorded = h.rec.entries(h.g);
    assert.deepEqual(ids(recorded), ['pump_dose_correct', 'safety_claim_hc001_assessed', 'network_isolated_authorised']);
    assert.deepEqual(recorded.map(d => d.t), [60000, 120000, 310000]);

    const clock = new GameClock({ config: 'Tue 07:30', now: 0 });
    const entries = timeline.buildEntries([], recorded, (t) => clock.formatStamp(t), timeline.DEFAULT_PRESEED);
    assert.deepEqual(entries.map(e => e.timestamp), ['Tue 07:35', 'Tue 07:32', 'Tue 07:31', 'Mon 22:38']);
    assert.equal(entries.at(-1).source, 'preseed');
});

test('fatal pump path: no "double-check caught", and the death is logged (D15)', () => {
    const h = recorderHarness({ initial: { patient_bed2_state: 'stable' } });
    h.set('pump_dose_error', true, 100000);
    h.set('patient_bed2_state', 'sedated', 100001);
    h.set('patient_bed2_state', 'critical', 190000);
    h.set('patient_bed2_state', 'deceased', 280000);
    h.set('patient_bed2_deceased', true, 280000);
    h.set('drug_library_compromised', true, 400000);
    h.set('drug_library_verified', true, 500000);
    h.set('drug_library_restored', true, 500000);
    h.at(600000);
    h.rec.reconcile(h.g);   // the board opening later adds nothing wrong
    const got = ids(h.rec.entries(h.g));
    assert.ok(!got.includes('pump_dose_error_caught'));
    // settled as not happening, and that survives a reload
    const after = new timeline.CommandBoardRecorder({ saved: JSON.parse(JSON.stringify(h.rec.exportLog())), now: () => 700000 });
    after.reconcile(h.g);
    assert.ok(!ids(after.entries(h.g)).includes('pump_dose_error_caught'));
    assert.deepEqual(got, ['pump_dose_entered_unchecked', 'patient_bed2_critical', 'patient_bed2_deceased',
        'drug_library_tampered', 'drug_library_restored']);
    assert.match(defs.find(d => d.id === 'patient_bed2_deceased').text, /called the prescribed dose too low/);
});

test('a wrong rate after the restore is "caught"; the restore clears COMPROMISED (D9)', () => {
    const h = recorderHarness();
    h.set('drug_library_compromised', true, 1000);
    h.set('drug_library_restored', true, 2000);
    h.set('pump_dose_error', true, 3000);
    assert.deepEqual(ids(h.rec.entries(h.g)), ['drug_library_tampered', 'drug_library_restored', 'pump_dose_error_caught']);
    const fleet = timeline.computeBuiltinStatuses(h.g).find(r => r.label === 'FLEET CONSOLE');
    assert.equal(fleet.status.label, 'VERIFIED');
    const fleetBefore = timeline.computeBuiltinStatuses({ drug_library_compromised: true }).find(r => r.label === 'FLEET CONSOLE');
    assert.equal(fleetBefore.status.label, 'COMPROMISED');
});

test('transient states are kept: Bed 4 critical then dead gives two entries', () => {
    const h = recorderHarness({ initial: { patient_bed4_state: 'stable' } });
    h.set('patient_bed4_state', 'critical', 900000);
    h.set('patient_bed4_state', 'deceased', 1320000);
    assert.deepEqual(h.rec.entries(h.g).map(d => [d.id, d.t]), [['patient_bed4_critical', 900000], ['patient_bed4_deceased', 1320000]]);
});

test('a reload keeps the stamps; only {id, t} is saved', () => {
    const h = recorderHarness();
    h.set('ncsc_notified', true, 42000);
    const saved = JSON.parse(JSON.stringify(h.rec.exportLog()));
    assert.deepEqual(saved, [{ id: 'ncsc_notified', t: 42000 }]);

    const after = new timeline.CommandBoardRecorder({ saved, initialGlobals: {}, now: () => 99000 });
    after.reconcile({ ncsc_notified: true });
    assert.deepEqual(after.exportLog(), [{ id: 'ncsc_notified', t: 42000 }], 'reconcile does not restamp');
});

test('old saves and changes after the last sync: true now but unrecorded gets stamped at load', () => {
    // A save from before the board kept its own log: no saved entries, globals already set
    const rec = new timeline.CommandBoardRecorder({ saved: [], initialGlobals: { ncsc_notified: true }, now: () => 300000 });
    rec.reconcile({ ncsc_notified: true, siem_escalated: true, drug_library_compromised: true });
    // ncsc_notified was true at the start: the starting situation, not an entry
    assert.deepEqual(rec.exportLog(), [{ id: 'drug_library_tampered', t: 300000 }, { id: 'siem_escalated', t: 300000 }]);
});

test('older saved boards: only manual entries are kept from the board state', () => {
    const saved = [
        { timestamp: 'Fri 22:40', text: 'DRUG LIBRARY TAMPERED - old', type: 'security', source: 'auto', eventKey: 'event:drug_library_verified' },
        { timestamp: 'Fri 22:41', text: 'my note', type: 'decision', source: 'manual', eventKey: 'manual:1', atMs: 50 },
        { timestamp: 'Mon 22:38', text: 'MAJOR INCIDENT DECLARED', type: 'security', source: 'preseed', eventKey: 'preseed:x' }
    ];
    const recorded = [{ id: 'drug_library_tampered', t: 10, text: 'DRUG LIBRARY TAMPERED - new', type: 'security' }];
    const out = timeline.buildEntries(saved, recorded, () => 'Tue 07:30', timeline.DEFAULT_PRESEED);
    assert.deepEqual(out.map(e => e.eventKey), ['manual:1', 'event:drug_library_tampered', 'preseed:0']);
});

test('a scenario can give its own timeline, status rows and preseed', () => {
    const config = {
        timeline: [{ id: 'grid', condition: "globalVars.grid_state === 'saved' || globalVars.forced", text: 'GRID SAVED', type: 'response' }],
        statusRows: [{ label: 'GRID', states: [{ condition: 'globalVars.forced', state: 'degraded', label: 'FORCED' }], default: { state: 'operational', label: 'OK' } }]
    };
    const d = timeline.timelineDefinitions(config);
    assert.equal(d.length, 1);
    assert.deepEqual(d[0].watch, ['grid_state', 'forced']);
    const h = recorderHarness({ config });
    h.set('unrelated', 1, 3);
    h.set('forced', true, 5);
    assert.deepEqual(h.rec.entries(h.g).map(x => [x.id, x.t, x.text]), [['grid', 5, 'GRID SAVED']]);
    assert.deepEqual(timeline.computeStatusRows(config, { forced: true }), [{ label: 'GRID', status: { key: 'DEGRADED', label: 'FORCED' } }]);
    assert.equal(timeline.timelineDefinitions({}).length, defs.length);
    assert.equal(timeline.timelineDefinitions({ timeline: config.timeline, extendBuiltIn: true }).length, defs.length + 1);
});

// ── D2: event-triggered conversations keep story state ──────────────────────

const fixtureJson = readFileSync(join(here, 'fixtures/event_restore.json'), 'utf8').replace(/^﻿/, '');

function storyFor() {
    return new inkjs.Story(fixtureJson);
}

function play(story) {
    let text = '';
    while (story.canContinue) text += story.Continue();
    return { text, choices: story.currentChoices.map(c => c.text) };
}

function fakeConversation(story) {
    return { storyEnded: true, goToKnot(k) { story.ChoosePathString(k); } };
}

test('event knot after restore keeps ink-local VARs and used once-only topics', () => {
    window.gameState.globalVariables = { network_isolated: false };
    const manager = new stateManagerSingleton.constructor();

    // First talk: meet Helen, use the once-only ransom topic, leave from the hub
    const s1 = storyFor();
    s1.ChoosePathString('start');
    assert.match(play(s1).text, /Hello, I'm Helen/);
    s1.ChooseChoiceIndex(0);
    const r = play(s1);
    assert.deepEqual(r.choices, ['Leave.']);
    manager.saveNPCState('helen', s1);

    // Cutscene: a fresh story, then the event knot
    const s2 = storyFor();
    const conv = fakeConversation(s2);
    const restored = startEventConversation({ npcId: 'helen', story: s2, conversation: conv, startKnot: 'isolation_event', stateManager: manager });
    assert.ok(restored);
    assert.equal(conv.storyEnded, false);
    const ev = play(s2);
    assert.match(ev.text, /As I told you before/);
    assert.deepEqual(ev.choices, ['Leave.'], 'the used ransom topic stays used');
});

test('control: jumping to the event knot without restoring loses them', () => {
    const s = storyFor();
    s.ChoosePathString('isolation_event');
    const ev = play(s);
    assert.match(ev.text, /Who are you/);
    assert.deepEqual(ev.choices, ['Ask about the ransom.', 'Leave.']);
});

test('first-ever event conversation (nothing saved) still plays the knot', () => {
    const manager = new stateManagerSingleton.constructor();
    const s = storyFor();
    const conv = fakeConversation(s);
    const restored = startEventConversation({ npcId: 'nobody', story: s, conversation: conv, startKnot: 'isolation_event', stateManager: manager });
    assert.equal(restored, false);
    assert.match(play(s).text, /Who are you\? The network is cut/);
});

test('after a reload only the saved variables exist: they are applied before the knot', () => {
    window.gameState.globalVariables = { network_isolated: false };
    const manager = new stateManagerSingleton.constructor();
    manager.importNpcInkVariables({ helen: { met_player: true } });
    const s = storyFor();
    const conv = fakeConversation(s);
    assert.equal(startEventConversation({ npcId: 'helen', story: s, conversation: conv, startKnot: 'isolation_event', stateManager: manager }), 'variables-only');
    assert.match(play(s).text, /As I told you before/);
});

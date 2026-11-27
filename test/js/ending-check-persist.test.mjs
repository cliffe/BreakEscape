// A held ending must survive a page reload (systems/ending-check.js). When the player chooses
// "Keep going" at the point of no return — or reloads while the warning is still open — a
// descriptor of the held trigger is kept in the saved globals (`__ending_held`). On load it is
// turned back into the action that runs the ending, the hold is re-established (panel button +
// the auto-run once nothing optional is open), and the record is cleared when the ending runs.
// This covers the real soft-lock: the onceOnly mapping fires on a global that is already set, so
// it never fires again after a reload; only the restored hold ends the mission.
// Real systems/ending-check.js and systems/npc-manager.js run together in jsdom.
// Run with: node --test test/js/ending-check-persist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'ending-check-persist-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/ending-check.js', 'utils/display-dashes.js',
    'systems/npc-los.js', 'minigames/phone-chat/phone-chat-speaker.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
// npc-manager imports two relative modules copied above.
writeFileSync(join(dir, 'systems/npc-manager.js'),
    readFileSync(join(js, 'systems/npc-manager.js'), 'utf8')
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'../minigames/phone-chat/phone-chat-speaker.js'"));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
window.gameState = { globalVariables: {} };

const imp = (rel) => import(pathToFileURL(join(dir, rel)).href);
const E = await imp('systems/ending-check.js');            // sets window.endingCheck
const { default: NPCManager } = await imp('systems/npc-manager.js');

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(n, cb) { listeners.set(n, [...(listeners.get(n) || []), cb]); },
        off(n, cb) { listeners.set(n, (listeners.get(n) || []).filter((f) => f !== cb)); },
        emit(n, d) { (listeners.get(n) || []).slice().forEach((cb) => cb(d)); }
    };
}

// The debrief NPC, as a mission places it in the start room: one endingCheck mapping that opens
// the debrief (here: sets a global we can watch) on mission_complete becoming true.
const DEBRIEF_MAPPING = { eventPattern: 'global_variable_changed:mission_complete',
    onceOnly: true, endingCheck: true, setGlobal: { debrief_ran: true } };

function makeManager() {
    const m = new NPCManager(makeDispatcher(), null);   // constructor registers the 'mapping' rebuilder
    m.npcs.set('debrief', { id: 'debrief', npcType: 'person', currentKnot: 'start',
        eventMappings: [DEBRIEF_MAPPING] });
    return m;
}

// A minimal objectives manager: one visible optional task, listeners, and a way to settle it.
function makeObjectives() {
    const listeners = [];
    const aims = [{ status: 'active', tasks: [{ taskId: 'opt1', title: 'Optional', optional: true, status: 'active' }] }];
    return {
        aims, _listeners: listeners,
        addListener(fn) { listeners.push(fn); },
        notifyListeners() { listeners.slice().forEach((f) => f()); },
        settleOptional() { aims[0].tasks[0].status = 'completed'; this.notifyListeners(); }
    };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const overlay = () => document.getElementById(E.ENDING_CHECK_ID);
const click = (id) => document.getElementById(id)?.click();
const fireMapping = (m, eventData) => {
    const config = m._buildMappingConfig(DEBRIEF_MAPPING, 0);
    config.endingCheck = true;
    m._handleEventMapping('debrief', 'global_variable_changed:mission_complete', config, eventData);
};
// Simulate a reload: a fresh module state and a fresh manager, with the saved globals restored.
function reload(savedGlobals) {
    E._resetEndingCheck();
    window.gameState.globalVariables = { ...savedGlobals };
    const m = makeManager();                 // re-registers the rebuilder against this manager
    window.objectivesManager = makeObjectives();
    return m;
}

test.beforeEach(() => {
    E._resetEndingCheck();
    window.breakEscapeConfig = {};
    window.player = { disableMovement: false };
    window.gameState = { globalVariables: {} };
    window.objectivesManager = makeObjectives();
});

test('Keep going records the hold in the saved globals', async () => {
    const m = makeManager();
    window.gameState.globalVariables.mission_complete = true;
    fireMapping(m, { value: true });
    await tick();
    assert.ok(overlay(), 'the warning is shown');
    click('ending-check-keep');     // Keep going
    await tick();
    const rec = window.gameState.globalVariables.__ending_held;
    assert.ok(rec, 'a hold record was written to the saved globals');
    assert.deepEqual(rec, { reason: 'mapping', npcId: 'debrief',
        eventPattern: 'global_variable_changed:mission_complete', handlerIndex: 0 });
    assert.equal(E.hasHeldEnding(), true, 'the ending is held in memory too');
    assert.equal(window.gameState.globalVariables.debrief_ran, undefined, 'the debrief did not run');
});

test('reload restores the button and the auto-run; the ending runs once; the record is cleared', async () => {
    const m = makeManager();
    window.gameState.globalVariables.mission_complete = true;
    fireMapping(m, { value: true });
    await tick();
    click('ending-check-keep');
    await tick();
    const saved = { ...window.gameState.globalVariables };   // what the server would persist

    // Reload: in-memory hold gone, mission_complete already true so the mapping can't re-fire.
    reload(saved);
    assert.equal(E.hasHeldEnding(), false, 'nothing held yet right after the reload');
    const restored = E.restoreHeldEnding({ manager: window.objectivesManager, config: window.breakEscapeConfig });
    assert.equal(restored, true, 'the hold was restored');
    assert.equal(E.hasHeldEnding(), true, 'the panel button is back (hasHeld)');
    assert.ok(window.endingCheck.heldRecord(), 'the record is still kept while held');
    assert.equal(window.gameState.globalVariables.debrief_ran, undefined, 'the debrief has not run on its own');

    // Finishing the last optional objective ends the mission by itself, exactly once.
    window.objectivesManager.settleOptional();
    await tick();
    assert.equal(window.gameState.globalVariables.debrief_ran, true, 'the held ending ran');
    assert.equal(E.hasHeldEnding(), false, 'the hold is spent');
    assert.equal(window.gameState.globalVariables.__ending_held, undefined, 'the record was cleared');

    // No second run if the objectives notify again.
    window.gameState.globalVariables.debrief_ran = false;
    window.objectivesManager.notifyListeners();
    await tick();
    assert.equal(window.gameState.globalVariables.debrief_ran, false, 'the ending did not run a second time');
});

test('reload then the panel button ends the mission', async () => {
    const m = makeManager();
    window.gameState.globalVariables.mission_complete = true;
    fireMapping(m, { value: true });
    await tick();
    click('ending-check-keep');
    await tick();
    const saved = { ...window.gameState.globalVariables };

    reload(saved);
    E.restoreHeldEnding({ manager: window.objectivesManager, config: window.breakEscapeConfig });
    assert.equal(E.hasHeldEnding(), true);
    // The objectives panel's "End the mission" button calls endHeld.
    E.endHeldEnding();
    await tick();
    assert.equal(window.gameState.globalVariables.debrief_ran, true, 'the debrief ran from the panel button');
    assert.equal(window.gameState.globalVariables.__ending_held, undefined, 'the record was cleared');
});

test('a reload backstop that re-emits the global does not run a second ending or ask again', async () => {
    const m = makeManager();
    window.gameState.globalVariables.mission_complete = true;
    fireMapping(m, { value: true });
    await tick();
    click('ending-check-keep');
    await tick();
    const saved = { ...window.gameState.globalVariables };

    // Reload: restore the hold FIRST (as main.js does, before the scenario's backstops run).
    const m2 = reload(saved);
    E.restoreHeldEnding({ manager: window.objectivesManager, config: window.breakEscapeConfig });
    assert.equal(E.hasHeldEnding(), true);

    // A game_loaded / room backstop re-emits the global: the mapping fires again and must stand
    // down (an ending is already held), neither asking nor running the debrief.
    fireMapping(m2, { value: true });
    await tick();
    assert.equal(overlay(), null, 'no second warning while an ending is held');
    assert.equal(window.gameState.globalVariables.debrief_ran, undefined, 'the backstop did not run the debrief');

    // Ending still runs exactly once when the optional objective is settled.
    window.objectivesManager.settleOptional();
    await tick();
    assert.equal(window.gameState.globalVariables.debrief_ran, true);
});

test('a reload while the warning is still open restores the hold instead of soft-locking', async () => {
    const m = makeManager();
    window.gameState.globalVariables.mission_complete = true;
    fireMapping(m, { value: true });
    await tick();
    assert.ok(overlay(), 'the warning is open');
    // The record is written the moment the warning shows, before any answer.
    const saved = { ...window.gameState.globalVariables };
    assert.ok(saved.__ending_held, 'the hold record exists while the modal is open');

    // The player reloads without answering.
    reload(saved);
    const restored = E.restoreHeldEnding({ manager: window.objectivesManager, config: window.breakEscapeConfig });
    assert.equal(restored, true, 'the hold is restored on load — no soft-lock');
    assert.equal(E.hasHeldEnding(), true);
    window.objectivesManager.settleOptional();
    await tick();
    assert.equal(window.gameState.globalVariables.debrief_ran, true, 'the mission can still end');
});

test('a concluded game drops a stale record and does not restore', async () => {
    const saved = { __ending_held: { reason: 'mapping', npcId: 'debrief',
        eventPattern: 'global_variable_changed:mission_complete', handlerIndex: 0 }, mission_complete: true };
    reload(saved);
    const restored = E.restoreHeldEnding({ manager: window.objectivesManager, config: { missionConcludedAt: '2026-01-01T00:00:00Z' } });
    assert.equal(restored, false, 'nothing restored on a concluded game');
    assert.equal(window.gameState.globalVariables.__ending_held, undefined, 'the stale record was dropped');
});

test('restore is a no-op when there is no record', () => {
    reload({ mission_complete: true });
    assert.equal(E.restoreHeldEnding({ manager: window.objectivesManager, config: {} }), false);
    assert.equal(E.hasHeldEnding(), false);
});

// eventMappings `delayMs`: the handler fires that long after its event, re-checking its
// condition when the delay is up (m08 E15). Run with: node test/js/npc-mapping-delay.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-delay-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

// A manager whose _handleEventMapping records what reached it, with controllable timers.
function setup(mapping) {
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('mole', { id: 'mole', npcType: 'person' });
    const fired = [];
    const realHandle = m._handleEventMapping.bind(m);
    m._handleEventMapping = (npcId, pattern, config, data) => {
        const check = m._mappingWouldFire(npcId, pattern, config, data);
        if (check.fire) { check.triggered.count++; check.triggered.lastTime = check.now; m.triggeredEvents.set(check.eventKey, check.triggered); fired.push(pattern); }
    };
    m._setupEventMappings('mole', [mapping]);
    const runDue = () => { const due = timers.filter(t => t.live); due.forEach(t => { t.live = false; t.cb(); }); return due; };
    const restore = () => { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; delete window.MinigameFramework; };
    return { m, timers, fired, runDue, restore, realHandle };
}

const base = { eventPattern: 'room_entered:interrogation_room', onceOnly: true, cooldown: 0, targetKnot: 'confront', delayMs: 8000 };

test('a delayed mapping does not fire at once, then fires when the delay is up', () => {
    const t = setup({ ...base });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        assert.equal(t.fired.length, 0);
        assert.equal(t.timers.filter(x => x.live).length, 1);
        assert.equal(t.timers[0].ms, 8000);
        t.runDue();
        assert.deepEqual(t.fired, [base.eventPattern]);
    } finally { t.restore(); }
});

test('the condition is re-checked when the delay is up', () => {
    window.gameState.globalVariables = { ready: true };
    const t = setup({ ...base, condition: 'globalVars.ready === true' });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        assert.equal(t.timers.filter(x => x.live).length, 1, 'scheduled while the condition holds');
        window.gameState.globalVariables.ready = false;
        t.runDue();
        assert.equal(t.fired.length, 0, 'dropped: the condition stopped holding');
        // Event again once it holds: fires
        window.gameState.globalVariables.ready = true;
        t.m.eventDispatcher.emit(base.eventPattern, {});
        t.runDue();
        assert.equal(t.fired.length, 1);
    } finally { t.restore(); }
});

test('nothing is scheduled when the condition fails at the event', () => {
    window.gameState.globalVariables = { ready: false };
    const t = setup({ ...base, condition: 'globalVars.ready === true' });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        assert.equal(t.timers.length, 0);
    } finally { t.restore(); }
});

test('a repeat of the event while one is pending schedules nothing more', () => {
    const t = setup({ ...base, onceOnly: false });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        t.m.eventDispatcher.emit(base.eventPattern, {});
        assert.equal(t.timers.filter(x => x.live).length, 1);
        t.runDue();
        assert.equal(t.fired.length, 1);
    } finally { t.restore(); }
});

test('it waits for an open minigame to close instead of cutting it off', () => {
    const t = setup({ ...base });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        window.MinigameFramework = { currentMinigame: { name: 'lockpicking' } };
        t.runDue();
        assert.equal(t.fired.length, 0);
        const retry = t.timers.filter(x => x.live);
        assert.equal(retry.length, 1);
        assert.equal(retry[0].ms, NPCManager.DELAYED_MAPPING_RETRY_MS);
        window.MinigameFramework.currentMinigame = null;
        t.runDue();
        assert.equal(t.fired.length, 1);
    } finally { t.restore(); }
});

test('re-registering the NPC cancels a pending delay', () => {
    const t = setup({ ...base });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        t.m._removeEventMappingListeners('mole');
        assert.equal(t.timers.filter(x => x.live).length, 0);
    } finally { t.restore(); }
});

test('a mapping without delayMs still fires at once', () => {
    const t = setup({ ...base, delayMs: undefined });
    try {
        t.m.eventDispatcher.emit(base.eventPattern, {});
        assert.equal(t.fired.length, 1);
        assert.equal(t.timers.length, 0);
    } finally { t.restore(); }
});

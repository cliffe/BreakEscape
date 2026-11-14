// eventMappings `barkDelay`: the bark shows that many ms after its event, not before, and
// a delay that is cancelled (NPC re-registered, knocked out, moved, hidden, condition gone)
// never shows, and one that comes due while the player talks to that NPC waits for the chat. Run with: node test/js/npc-bark-delay.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-bark-delay-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

// npc-barks.js with its imports stubbed, for _dropStaleVisibleBarks only.
writeFileSync(join(dir, 'npc-barks.mjs'), `
const ASSETS_PATH = '', overlayDepth = () => 0, displayDashes = (s) => s, releaseHeldBarks = () => {}, HELD_BARK_VOICE_CAP_MS = 30000;
const workstationPopupOpen = () => false, phoneThreadOpenFor = () => false, openPhoneThread = () => null, threadTextKey = () => '';
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, inventoryBlockedByForcedMinigame = () => false;
const phoneBarkText = (s) => s;
class TTSManager {}
` + readFileSync(join(sys, 'npc-barks.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

// A manager with a recording bark system, a fake clock and the real _handleEventMapping.
function setup(mappings, npcExtra = {}) {
    const timers = [];
    let clock = 0;
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout, realNow = Date.now;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, due: clock + (ms || 0), live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    Date.now = () => 1_000_000 + clock;
    const barks = [];
    const barkSystem = { showBark: (p) => barks.push({ at: clock, npcId: p.npcId, text: p.message }) };
    const m = new NPCManager(makeDispatcher(), barkSystem);
    m.npcs.set('nurse', { id: 'nurse', npcType: 'person', displayName: 'Nurse', roomId: 'ward', ...npcExtra });
    m.npcs.set('doctor', { id: 'doctor', npcType: 'person', displayName: 'Doctor', roomId: 'ward' });
    m._setupEventMappings('nurse', mappings.nurse || mappings);
    if (mappings.doctor) m._setupEventMappings('doctor', mappings.doctor);
    // Advance the fake clock to `ms`, running every live timer due by then, in order.
    const advance = (ms) => {
        for (;;) {
            const next = timers.filter(t => t.live && t.due <= ms).sort((a, b) => a.due - b.due)[0];
            if (!next) break;
            clock = next.due; next.live = false; next.cb();
        }
        clock = ms;
    };
    const live = () => timers.filter(t => t.live).length;
    const restore = () => {
        globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; Date.now = realNow;
        delete window.npcHostileSystem; delete window.npcBehaviorManager;
        delete window.currentConversationMinigameType; delete window.currentConversationNPCId;
        window.gameState.globalVariables = {};
    };
    return { m, barks, advance, live, restore };
}

const ev = 'global_variable_changed:alarm';
const base = { eventPattern: ev, onceOnly: true, bark: 'Alarm on the ward!', barkDelay: 1500 };

test('the mapping config carries barkDelay', () => {
    const m = new NPCManager(makeDispatcher(), null);
    assert.equal(m._buildMappingConfig({ ...base }, 0).barkDelay, 1500);
    assert.equal(m._buildMappingConfig({ ...base, barkDelay: undefined }, 0).barkDelay, 0);
    assert.equal(m._buildMappingConfig({ ...base, barkDelay: -5 }, 0).barkDelay, 0);
});

test('a bark with barkDelay shows after the delay and not before', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.barks.length, 0, 'nothing at the event');
        t.advance(1499);
        assert.equal(t.barks.length, 0, 'nothing 1 ms before the delay is up');
        t.advance(1500);
        assert.deepEqual(t.barks, [{ at: 1500, npcId: 'nurse', text: base.bark }]);
        assert.equal(t.m.getConversationHistory('nurse').length, 1, 'history written when it shows');
    } finally { t.restore(); }
});

test('staggered barks from two NPCs on one event land in delay order', () => {
    const t = setup({
        nurse: [{ ...base, barkDelay: 2500, bark: 'second' }],
        doctor: [{ ...base, barkDelay: 500, bark: 'first' }]
    });
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(5000);
        assert.deepEqual(t.barks.map(b => [b.at, b.text]), [[500, 'first'], [2500, 'second']]);
    } finally { t.restore(); }
});

test('onceOnly applies at the event: a repeat after the default cooldown schedules nothing', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(6000);   // the bark has landed and the default 5000 ms cooldown has run out
        assert.equal(t.barks.length, 1);
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.live(), 0, 'no second timer');
        t.advance(20000);
        assert.equal(t.barks.length, 1);
    } finally { t.restore(); }
});

test('the same repeat barks again without onceOnly (control for the test above)', () => {
    const t = setup([{ ...base, onceOnly: false }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(6000);
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(20000);
        assert.deepEqual(t.barks.map(b => b.at), [1500, 7500]);
    } finally { t.restore(); }
});

test('cooldown runs from the event, not from when the bark lands', () => {
    const t = setup([{ ...base, onceOnly: false, cooldown: 10000 }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(9000);
        t.m.eventDispatcher.emit(ev, { value: true });   // inside the cooldown from either 0 or 1500
        t.advance(10200);
        // 10200 ms after the event the cooldown has run out; measured from the landing
        // (1500) it would still have 1300 ms to go.
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(30000);
        assert.deepEqual(t.barks.map(b => b.at), [1500, 11700]);
    } finally { t.restore(); }
});

test('a cancelled delay never fires: NPC re-registered or removed', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.live(), 1);
        t.m._removeEventMappingListeners('nurse');
        assert.equal(t.live(), 0, 'timer cleared');
        t.advance(10000);
        assert.equal(t.barks.length, 0);
        assert.equal(t.m.getConversationHistory('nurse').length, 0);
    } finally { t.restore(); }
});

test('a cancelled delay never fires: manager destroyed', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.m.destroy();
        assert.equal(t.live(), 0);
    } finally { t.restore(); }
});

test('dropped when the NPC is knocked out during the delay', () => {
    const t = setup([{ ...base }]);
    try {
        const ko = new Set();
        window.npcHostileSystem = { isNPCKO: (id) => ko.has(id) };
        t.m.eventDispatcher.emit(ev, { value: true });
        ko.add('nurse');
        t.advance(5000);
        assert.equal(t.barks.length, 0);
    } finally { t.restore(); }
});

test('dropped when the NPC changes room during the delay', () => {
    const t = setup([{ ...base }]);
    try {
        const beh = { roomId: 'ward' };
        window.npcBehaviorManager = { getBehavior: (id) => (id === 'nurse' ? beh : null) };
        t.m.eventDispatcher.emit(ev, { value: true });
        beh.roomId = 'corridor';
        t.advance(5000);
        assert.equal(t.barks.length, 0);
    } finally { t.restore(); }
});

test('dropped when the NPC is hidden during the delay', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.m.getNPC('nurse').isVisible = false;
        t.advance(5000);
        assert.equal(t.barks.length, 0);
    } finally { t.restore(); }
});

test('dropped when its condition stops holding during the delay', () => {
    window.gameState.globalVariables = { alarm: true };
    const t = setup([{ ...base, condition: 'globalVars.alarm === true' }]);
    try {
        window.gameState.globalVariables = { alarm: true };
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.live(), 1);
        window.gameState.globalVariables.alarm = false;
        t.advance(5000);
        assert.equal(t.barks.length, 0);
    } finally { t.restore(); }
});

test('due during a person-chat with that NPC: handed to showBark to hold, not dropped', () => {
    const t = setup({
        nurse: [{ ...base, bark: 'nurse line', condition: 'globalVars.alarm === true' }],
        doctor: [{ ...base, bark: 'doctor line' }]
    });
    try {
        const held = [];
        t.m.barkSystem.showBark = (p) => held.push(p);
        window.gameState.globalVariables = { alarm: true };
        window.currentConversationMinigameType = 'person-chat';
        window.currentConversationNPCId = 'nurse';
        t.m.eventDispatcher.emit(ev, { value: true });   // set inside the chat with the nurse
        t.advance(5000);
        // Both reach showBark, whose hold policy keeps them until the chat closes
        // (npc-barks.js _shouldDefer: any person-chat) and re-checks stillValid then.
        assert.deepEqual(held.map(p => p.message).sort(), ['doctor line', 'nurse line']);
        const nurse = held.find(p => p.npcId === 'nurse');
        assert.equal(nurse.stillValid(), true, 'still shown on release while the condition holds');
        window.gameState.globalVariables.alarm = false;
        assert.equal(nurse.stillValid(), false, 'dropped on release if the condition lapsed');
    } finally { t.restore(); }
});

test('held during a chat: stale on release if the NPC is hidden or knocked out, kept if it only moved', () => {
    for (const change of ['hidden', 'ko', 'room']) {
        const t = setup([{ ...base }]);   // no condition: only the NPC checks can make it stale
        try {
            const ko = new Set();
            const beh = { roomId: 'ward' };
            window.npcHostileSystem = { isNPCKO: (id) => ko.has(id) };
            window.npcBehaviorManager = { getBehavior: (id) => (id === 'nurse' ? beh : null) };
            const held = [];
            t.m.barkSystem.showBark = (p) => held.push(p);
            window.currentConversationMinigameType = 'person-chat';
            window.currentConversationNPCId = 'nurse';
            t.m.eventDispatcher.emit(ev, { value: true });
            t.advance(1500);
            assert.equal(held.length, 1, `${change}: handed to showBark to hold`);
            assert.equal(typeof held[0].stillValid, 'function', `${change}: carries stillValid`);
            assert.equal(held[0].stillValid(), true, `${change}: valid while nothing has changed`);
            if (change === 'hidden') t.m.getNPC('nurse').isVisible = false;
            if (change === 'ko') ko.add('nurse');
            if (change === 'room') beh.roomId = 'corridor';
            // The room check runs only when the delay ends: a patroller that crosses rooms
            // behind a minigame keeps its bark.
            if (change === 'room') assert.equal(held[0].stillValid(), true, 'room: kept on release');
            else assert.equal(held[0].stillValid(), false, `${change}: stale on release`);
        } finally { t.restore(); }
    }
});

test('a delayed toast already on screen closes when its NPC is hidden; one being removed is skipped', () => {
    const t = setup([{ ...base }]);   // no condition: only the NPC checks can make it stale
    try {
        let payload = null;
        t.m.barkSystem.showBark = (p) => { payload = p; };
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(1500);
        assert.equal(typeof payload?.stillValid, 'function');
        // The toast as npc-barks.js renders it: el._stillValid = payload.stillValid.
        const shown = { textContent: payload.message, _stillValid: payload.stillValid };
        let leavingChecks = 0;
        const leaving = { textContent: 'leaving', _removing: true, _stillValid: () => { leavingChecks++; return false; } };
        const removed = [];
        const bark = Object.create(NPCBarkSystem.prototype);
        bark.container = { querySelectorAll: () => [shown, leaving] };
        bark._removeBark = (el) => removed.push(el);
        bark._dropStaleVisibleBarks();
        assert.deepEqual(removed, [], 'nothing closes while the NPC is unchanged');
        t.m.getNPC('nurse').isVisible = false;
        bark._dropStaleVisibleBarks();
        assert.deepEqual(removed, [shown], 'closed as stale once its NPC is hidden');
        assert.equal(leavingChecks, 0, 'a toast already being removed is not checked again');
    } finally { t.restore(); }
});

test('a bark with no delay carries only its condition', () => {
    const t = setup([{ ...base, barkDelay: 0 }]);   // no condition
    try {
        let payload = null;
        t.m.barkSystem.showBark = (p) => { payload = p; };
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.ok(payload, 'barked at once');
        assert.equal(payload.stillValid, undefined, 'no condition, no stillValid');
        t.m.getNPC('nurse').isVisible = false;
        assert.equal(payload.stillValid, undefined, 'hiding the NPC changes nothing');
    } finally { t.restore(); }

    const t2 = setup([{ ...base, barkDelay: 0, condition: 'globalVars.alarm === true' }]);
    try {
        let payload = null;
        t2.m.barkSystem.showBark = (p) => { payload = p; };
        window.gameState.globalVariables = { alarm: true };
        t2.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(typeof payload?.stillValid, 'function');
        t2.m.getNPC('nurse').isVisible = false;
        assert.equal(payload.stillValid(), true, 'hidden NPC: the condition alone decides');
        window.gameState.globalVariables.alarm = false;
        assert.equal(payload.stillValid(), false);
    } finally { t2.restore(); }
});

test('a delayed knot bark waits too, carries stillValid, and is cancelled with the NPC', () => {
    const knotMapping = { eventPattern: ev, onceOnly: true, knot: 'on_alarm', barkDelay: 1500,
        condition: 'globalVars.alarm === true' };
    const t = setup([knotMapping], { storyPath: 'nurse.json' });
    try {
        const calls = [];
        t.m._showBarkFromKnot = (npcId, npc, knot, pattern, stillValid) =>
            calls.push({ at: Date.now() - 1_000_000, npcId, knot, stillValid });
        window.gameState.globalVariables = { alarm: true };
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(1499);
        assert.equal(calls.length, 0, 'not before the delay');
        t.advance(1500);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].at, 1500);
        assert.equal(calls[0].knot, 'on_alarm');
        assert.equal(typeof calls[0].stillValid, 'function');
        assert.equal(calls[0].stillValid(), true);
        window.gameState.globalVariables.alarm = false;
        assert.equal(calls[0].stillValid(), false);
        window.gameState.globalVariables.alarm = true;
        t.m.getNPC('nurse').isVisible = false;
        assert.equal(calls[0].stillValid(), false, 'the knot bark also goes stale if the NPC is hidden');
    } finally { t.restore(); }

    const t2 = setup([knotMapping], { storyPath: 'nurse.json' });
    try {
        let called = 0;
        t2.m._showBarkFromKnot = () => { called++; };
        window.gameState.globalVariables = { alarm: true };
        t2.m.eventDispatcher.emit(ev, { value: true });
        t2.m._removeEventMappingListeners('nurse');
        t2.advance(10000);
        assert.equal(called, 0, 'NPC removed during the delay');
    } finally { t2.restore(); }
});

test('the bark carries stillValid so the hold queue can re-check it', () => {
    const t = setup([{ ...base, condition: 'globalVars.alarm === true' }]);
    try {
        let payload = null;
        t.m.barkSystem.showBark = (p) => { payload = p; };
        window.gameState.globalVariables = { alarm: true };
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(1500);
        assert.equal(typeof payload?.stillValid, 'function');
        assert.equal(payload.stillValid(), true);
        window.gameState.globalVariables.alarm = false;
        assert.equal(payload.stillValid(), false);
    } finally { t.restore(); }
});

test('a mapping with barkDelay 0 or none barks at once', () => {
    const t = setup([{ ...base, barkDelay: 0 }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.barks.length, 1);
        assert.equal(t.live(), 0);
    } finally { t.restore(); }
});

test('only the bark waits: the mapping\'s setGlobal runs at the event', () => {
    const t = setup([{ ...base, setGlobal: { nurse_reacted: true } }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(window.gameState.globalVariables.nurse_reacted, true);
        assert.equal(t.barks.length, 0);
    } finally { t.restore(); }
});

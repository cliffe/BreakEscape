// eventMappings `barkDelay`: the bark shows that many ms after its event, not before, and
// a delay that is cancelled (NPC re-registered, knocked out, moved, hidden, condition gone,
// player talking to the NPC) never shows. Run with: node test/js/npc-bark-delay.test.mjs

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

test('onceOnly applies at the event: a repeat during the delay schedules nothing', () => {
    const t = setup([{ ...base }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.m.eventDispatcher.emit(ev, { value: true });
        assert.equal(t.live(), 1);
        t.advance(5000);
        assert.equal(t.barks.length, 1);
    } finally { t.restore(); }
});

test('cooldown applies at the event', () => {
    const t = setup([{ ...base, onceOnly: false, cooldown: 10000 }]);
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        t.advance(2000);
        t.m.eventDispatcher.emit(ev, { value: true });   // inside the cooldown
        t.advance(20000);
        assert.equal(t.barks.length, 1);
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

test('dropped when the player is in a person-chat with that NPC; kept for another NPC', () => {
    const t = setup({
        nurse: [{ ...base, bark: 'nurse line' }],
        doctor: [{ ...base, bark: 'doctor line' }]
    });
    try {
        t.m.eventDispatcher.emit(ev, { value: true });
        window.currentConversationMinigameType = 'person-chat';
        window.currentConversationNPCId = 'nurse';
        t.advance(5000);
        // The doctor's bark goes to showBark, whose hold policy keeps it behind the chat.
        assert.deepEqual(t.barks.map(b => b.text), ['doctor line']);
    } finally { t.restore(); }
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

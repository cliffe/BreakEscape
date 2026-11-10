// Mappings on one NPC for the same event run in array order, and a global set by an
// earlier mapping is visible to the condition of a later one in the same dispatch
// (the lab_physical_pentest fix 9900a396e relies on this: the passive-surf capture
// must run before the warning). Run with: node test/js/event-mapping-order.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'event-mapping-order-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const quiet = console.log;
console.log = () => {};
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
console.log = quiet;

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}
const tick = () => new Promise(r => setTimeout(r, 0));

async function fire(mappings, globals = {}) {
    window.gameState = { globalVariables: { ...globals } };
    const closed = [];
    window.doorGates = { closeNow: (room) => { closed.push(room); return true; } };
    const warn = console.warn;
    console.log = () => {}; console.warn = () => {};
    try {
        const m = new NPCManager(makeDispatcher(), null);
        m.npcs.set('len', { id: 'len', npcType: 'person' });
        m._setupEventMappings('len', mappings);
        m.eventDispatcher.emit('ping', {});
        for (let i = 0; i < 3; i++) await tick();
    } finally { console.log = quiet; console.warn = warn; delete window.doorGates; }
    return { closed, globals: window.gameState.globalVariables };
}

test('two mappings on one event run in array order', async () => {
    const r = await fire([
        { eventPattern: 'ping', closeDoor: 'first' },
        { eventPattern: 'ping', closeDoor: 'second' },
        { eventPattern: 'ping', closeDoor: 'third' }
    ]);
    assert.deepEqual(r.closed, ['first', 'second', 'third']);
});

test('a global set by an earlier mapping is seen by the condition of a later one', async () => {
    const r = await fire([
        { eventPattern: 'ping', setGlobal: { surfed: true } },
        { eventPattern: 'ping', condition: 'globalVars.surfed', closeDoor: 'secure_area', setGlobal: { warned: true } }
    ]);
    assert.deepEqual(r.closed, ['secure_area']);
    assert.equal(r.globals.warned, true);
});

test('the same two mappings in the opposite order: the condition is not yet true, so the later one does not fire its effect', async () => {
    const r = await fire([
        { eventPattern: 'ping', condition: 'globalVars.surfed', closeDoor: 'secure_area' },
        { eventPattern: 'ping', setGlobal: { surfed: true } }
    ]);
    assert.deepEqual(r.closed, []);
    assert.equal(r.globals.surfed, true);
});

test('an earlier mapping can switch a later one off by clearing a global', async () => {
    const r = await fire([
        { eventPattern: 'ping', setGlobal: { armed: false } },
        { eventPattern: 'ping', condition: 'globalVars.armed', closeDoor: 'vault' }
    ], { armed: true });
    assert.deepEqual(r.closed, []);
});

test('mappings given as an object keyed by event still run (one per key)', async () => {
    const r = await fire({ ping: { closeDoor: 'only' } });
    assert.deepEqual(r.closed, ['only']);
});

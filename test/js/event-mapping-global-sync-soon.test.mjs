// An eventMapping setGlobal that changes a global asks StateSync for a sync soon
// (requestSoon), so the global is saved within about 1.5 s instead of at the next 30 s
// sync. Before this, a mapping's setVisible reached the server at once (update_npc_state)
// while its setGlobal waited, so a tab killed before the sync (no pagehide flush) came back
// with the effect and without the global. The soon-sync is the normal delta sync: it sends
// only the changed key, never the whole state, and a pagehide after it lands does not send
// that key again. Run with: node test/js/event-mapping-global-sync-soon.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'event-mapping-sync-soon-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

function listenerHost(extra = {}) {
    const listeners = {};
    return Object.assign({
        listeners,
        addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
        removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter(f => f !== fn); },
        fire(type) { for (const fn of [...(listeners[type] || [])]) fn({ type }); }
    }, extra);
}
globalThis.window = listenerHost({
    breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' },
    gameState: { globalVariables: {} }
});
globalThis.document = listenerHost({ querySelector: () => null, visibilityState: 'visible' });

const loud = { log: console.log, warn: console.warn, error: console.error };
const hush = () => Object.assign(console, { log: () => {}, warn: () => {}, error: () => {} });
const unhush = () => Object.assign(console, loud);
hush();
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { StateSync, REQUEST_SOON_MAX_MS } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
unhush();

let requests = [];
globalThis.fetch = async (url, init) => {
    requests.push({ url, init, body: JSON.parse(init.body) });
    return { ok: true, status: 200, statusText: '', json: async () => ({ success: true }) };
};
const tick = () => new Promise(r => setTimeout(r, 0));
const wait = ms => new Promise(r => setTimeout(r, ms));

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function managerWith(mappings) {
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('len', { id: 'len', npcType: 'person' });
    m._setupEventMappings('len', mappings);
    return m;
}

async function fireWithStub(mappings, globals) {
    let soon = 0;
    window.gameState = { globalVariables: { ...globals } };
    window.stateSync = { requestSoon: () => { soon++; } };
    hush();
    try {
        const m = managerWith(mappings);
        m.eventDispatcher.emit('ping', {});
        for (let i = 0; i < 3; i++) await tick();
    } finally { unhush(); delete window.stateSync; }
    return soon;
}

test('a mapping whose setGlobal changes a global asks for one sync soon', async () => {
    assert.equal(await fireWithStub([{ eventPattern: 'ping', setGlobal: { entered: true, seen: 2 } }], { entered: false }), 1,
        'one request for the mapping, however many keys it sets');
});

test('a setGlobal that writes the value already held asks for nothing', async () => {
    assert.equal(await fireWithStub([{ eventPattern: 'ping', setGlobal: { entered: true } }], { entered: true }), 0);
});

test('a mapping with no setGlobal asks for nothing', async () => {
    assert.equal(await fireWithStub([{ eventPattern: 'ping', closeDoor: 'x' }], {}), 0);
});

test('with no StateSync (a test harness or a page before main.js) the mapping still sets the global', async () => {
    window.gameState = { globalVariables: { entered: false } };
    delete window.stateSync;
    hush();
    try {
        const m = managerWith([{ eventPattern: 'ping', setGlobal: { entered: true } }]);
        m.eventDispatcher.emit('ping', {});
        await tick();
    } finally { unhush(); }
    assert.equal(window.gameState.globalVariables.entered, true);
});

test('the real StateSync sends only the changed global within the soon window, and a pagehide after it does not resend it', async () => {
    Object.assign(window, {
        gameState: { globalVariables: { server_room_entered: false, other: 'kept', count: 3 }, notes: [] },
        currentPlayerRoom: 'lobby',
        gameClock: { exportState: () => ({ elapsedMs: 1000 }) },
        scenarioTimerDispatcher: null,
        npcManager: null,
        npcHostileSystem: null
    });
    hush();
    const sync = new StateSync(60 * 60 * 1000);
    window.stateSync = sync;
    try {
        sync.start();
        // The first sync after load: everything the page holds, then confirmed.
        assert.equal(await sync.sync(), true);
        requests = [];

        const m = managerWith([{ eventPattern: 'room_entered:server_room', onceOnly: true, setGlobal: { server_room_entered: true } }]);
        m.eventDispatcher.emit('room_entered:server_room', {});
        await tick();
        assert.equal(requests.length, 0, 'debounced: nothing is sent in the same tick');

        await wait(REQUEST_SOON_MAX_MS + 200);
        for (let i = 0; i < 5; i++) await tick();
        assert.equal(requests.length, 1, 'one sync within the soon window');
        const body = requests[0].body;
        assert.equal(requests[0].init.method, 'PUT');
        assert.match(requests[0].url, /\/sync_state$/);
        assert.deepEqual(body.globalVariables, { server_room_entered: true }, 'only the changed key, not the whole map');
        assert.equal(typeof body.clientTs, 'number');

        // The page goes away after the soon-sync landed: the global is confirmed, so the
        // pagehide flush (which forces the clock) does not carry it again.
        requests = [];
        window.fire('pagehide');
        await tick();
        for (const r of requests) assert.equal(r.body.globalVariables, undefined, 'the pagehide flush does not resend the global');
    } finally {
        sync.stop();
        delete window.stateSync;
        unhush();
    }
});

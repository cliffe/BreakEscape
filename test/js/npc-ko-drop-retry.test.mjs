// Friendface phone review R3 m2: a KO drop must not be lost to one failed request. The KO sync
// and each dropped item's add are retried with a bounded backoff (npc-hostile.js
// withSyncRetries), and after a reload a KO'd NPC whose drop never landed drops the items the
// server lists as koDropPending again (redropPending).
// Run with: node --test test/js/npc-ko-drop-retry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const quiet = async (fn) => {
    const saved = [console.log, console.warn, console.error];
    console.log = console.warn = console.error = () => {};
    try { return await fn(); } finally { [console.log, console.warn, console.error] = saved; }
};

const rooms = { office: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 320 }, objects: {} } };
globalThis.window = { rooms };

const swap = (src) => src
    .split("'../config/combat-config.js'").join(`'${dataUrl(read('config/combat-config.js'))}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(read('systems/interaction-walls.js'))}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl(read('events/combat-events.js'))}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const hostile = await import(dataUrl(swap(read('systems/npc-hostile.js'))));
const waits = [];
hostile.setRetryWait(async (ms) => { waits.push(ms); });
const sys = await quiet(() => hostile.initNPCHostileSystem());

const npcs = new Map();
function setup(id, items, { koSync = [], add = [] } = {}) {
    const calls = [];
    const sprite = () => {
        const s = { x: 0, y: 0, texture: {}, setOrigin() { return s; }, setInteractive() { return s; }, setDepth() { return s; } };
        return s;
    };
    const body = { center: { x: 120, y: 180 }, setVelocity() {}, checkCollision: {} };
    npcs.set(id, { id, roomId: 'office', itemsHeld: items.map(i => ({ ...i })),
        _sprite: { npcId: id, x: 120, y: 150, body, once() {}, anims: {}, play() {} } });
    const answers = { koSync: [...koSync], add: [...add] };
    Object.assign(window, {
        game: { textures: { exists: () => true }, add: { sprite } },
        npcManager: { getNPC: (n) => npcs.get(n) || null },
        npcBehaviorManager: { getBehavior: () => null },
        eventDispatcher: { emit() {} },
        gameState: { globalVariables: {} },
        RoomStateSync: {
            // Each call takes the next scripted answer; true once the script runs out
            updateNpcState: async (room, npcId) => { calls.push(['ko', npcId]); return answers.koSync.length ? answers.koSync.shift() : true; },
            addItemToRoom: async (room, item, opts) => { calls.push(['add', item.id, opts.sourceType]); return answers.add.length ? answers.add.shift() : true; }
        }
    });
    return calls;
}
const settle = () => new Promise(r => setTimeout(r, 30));

test('a KO sync that fails once is retried, and the drop is sent after it lands', async () => {
    const calls = setup('derek', [{ id: 'entropy_launch_device', type: 'launch-device', name: 'Launch device' }], { koSync: [false] });
    await quiet(async () => { sys.setNPCHostile('derek', true); sys.damageNPC('derek', 10_000); await settle(); });
    assert.deepEqual(calls, [['ko', 'derek'], ['ko', 'derek'], ['add', 'entropy_launch_device', 'npc_defeated']]);
});

test('a drop that fails is retried until the server takes it', async () => {
    const calls = setup('kevin', [{ id: 'lockpick_1', type: 'lockpick', name: 'Lockpick' }], { add: [false, false] });
    await quiet(async () => { sys.setNPCHostile('kevin', true); sys.damageNPC('kevin', 10_000); await settle(); });
    assert.deepEqual(calls.filter(c => c[0] === 'add').length, 3);
    assert.ok(rooms.office.objects.lockpick_1, 'the item lies in the room meanwhile');
});

test('retries are bounded: at most four requests per KO sync and per item, with growing waits', async () => {
    waits.length = 0;
    const calls = setup('relay', [{ id: 'master_card', type: 'keycard', name: 'Master card' }],
        { koSync: [false, false, false, false, false], add: [false, false, false, false, false] });
    await quiet(async () => { sys.setNPCHostile('relay', true); sys.damageNPC('relay', 10_000); await settle(); });
    assert.equal(calls.filter(c => c[0] === 'ko').length, 1 + hostile.SYNC_RETRY_DELAYS_MS.length);
    assert.equal(calls.filter(c => c[0] === 'add').length, 1 + hostile.SYNC_RETRY_DELAYS_MS.length);
    assert.deepEqual(waits, [...hostile.SYNC_RETRY_DELAYS_MS, ...hostile.SYNC_RETRY_DELAYS_MS]);
});

test('after a reload a KO\'d NPC drops again only the items the server lists as koDropPending', async () => {
    const calls = setup('patricia', [
        { id: 'briefcase_key', type: 'key', name: 'Key' },
        { id: 'patricia_badge', type: 'id_badge', name: 'Badge' }
    ]);
    hostile.restoreHostility({ patricia: { hostile: true, ko: true } });
    npcs.get('patricia').koDropPending = ['briefcase_key'];
    const dropped = await quiet(async () => { const n = sys.redropPending('patricia'); await settle(); return n; });
    assert.equal(dropped, 1);
    assert.deepEqual(calls, [['add', 'briefcase_key', 'npc_defeated']]);
    assert.ok(rooms.office.objects.briefcase_key);
    assert.equal(rooms.office.objects.patricia_badge, undefined);
    assert.deepEqual(npcs.get('patricia').itemsHeld.map(i => i.id), ['patricia_badge']);
    // Once only, and never for an NPC that is not KO'd
    assert.equal(sys.redropPending('patricia'), 0);
    setup('greg', [{ id: 'greg_key', type: 'key', name: 'Key' }]);
    npcs.get('greg').koDropPending = ['greg_key'];
    assert.equal(sys.redropPending('greg'), 0);
});

test('npc-sprites.js asks for the re-drop when it lays down a KO\'d NPC with koDropPending', () => {
    const src = read('systems/npc-sprites.js');
    assert.match(src, /npc\.koDropPending\.length > 0[\s\S]{0,120}redropPending\?\.\(npc\.id\)/);
});

test('review R4 n1: a definite refusal (4xx) is not retried; the drop asks for refusals to be reported', async () => {
    waits.length = 0;
    const calls = setup('gary', [{ id: 'gary_keycard', type: 'keycard', name: 'Keycard' }],
        { koSync: [hostile.SYNC_REFUSED], add: [hostile.SYNC_REFUSED] });
    let addOpts = null;
    const add = window.RoomStateSync.addItemToRoom;
    window.RoomStateSync.addItemToRoom = async (room, item, opts) => { addOpts = opts; return add(room, item, opts); };
    await quiet(async () => { sys.setNPCHostile('gary', true); sys.damageNPC('gary', 10_000); await settle(); });
    assert.equal(calls.filter(c => c[0] === 'ko').length, 1);
    assert.equal(calls.filter(c => c[0] === 'add').length, 1);
    assert.deepEqual(waits, []);
    assert.equal(addOpts.reportRefusal, true);
    assert.equal(hostile.SYNC_REFUSED, 'refused');
});

test('review R4 n1: room-state-sync answers SYNC_REFUSED for a 4xx only when asked, and false otherwise', async () => {
    const sync = await import(dataUrl(read('systems/room-state-sync.js')));
    assert.equal(sync.SYNC_REFUSED, hostile.SYNC_REFUSED);
    const saved = { config: window.breakEscapeConfig, doc: globalThis.document, fetch: globalThis.fetch };
    window.breakEscapeConfig = { gameId: 7 };
    globalThis.document = { querySelector: () => null };
    let status = 422;
    globalThis.fetch = async () => ({ status, json: async () => ({ success: false, message: 'no' }) });
    try {
        await quiet(async () => {
            assert.equal(await sync.addItemToRoom('office', { type: 'key' }, { reportRefusal: true }), 'refused');
            assert.equal(await sync.addItemToRoom('office', { type: 'key' }, {}), false);
            assert.equal(await sync.updateNpcState('office', 'gary', { isKO: true }, { reportRefusal: true }), 'refused');
            status = 429;
            assert.equal(await sync.addItemToRoom('office', { type: 'key' }, { reportRefusal: true }), false);
            status = 500;
            assert.equal(await sync.updateNpcState('office', 'gary', { isKO: true }, { reportRefusal: true }), false);
        });
    } finally {
        window.breakEscapeConfig = saved.config;
        globalThis.document = saved.doc;
        globalThis.fetch = saved.fetch;
    }
});

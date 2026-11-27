// A conversation that meets a fight is held, and the hold survives a reload (a KO and Restart).
// A voiced call goes to the ringer, which saves it as a pending call; a text thread, a person chat
// and a video call are saved as a short browser-local list of mapping keys and rebuilt on game_loaded.
// Run with: node test/js/phone-defer-combat-ring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const phoneNpc = { id: 'caller', displayName: 'Caller One', npcType: 'phone' };
const personNpc = { id: 'guard', displayName: 'Guard', npcType: 'person' };
const mapping = (extra = {}) => ({ eventPattern: 'room_entered', targetKnot: 'start_call', conversationMode: 'phone-chat', onceOnly: true, cooldown: 0, ...extra });

const store = new Map();
function setStorage(w) {
    Object.defineProperty(w.win, 'localStorage', {
        configurable: true,
        value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    });
    w.win.breakEscapeConfig = { gameId: 7 };
}
const heldKey = 'be_held_conversations:7';
const worldWith = (npcs, { fighting = true } = {}) => {
    store.clear();
    delete globalThis.window.npcHostileSystem;
    const w = makeWorld({ npcs });
    setStorage(w);
    w.fight = { on: fighting };
    w.win.playerInCombat = () => w.fight.on;
    w.toasts = [];
    w.win.showNotification = (...a) => w.toasts.push(a[0]);
    return w;
};
const rebuild = (w, npcs, extra = {}) => {
    delete globalThis.window.npcHostileSystem;
    const w2 = makeWorld({ npcs });
    setStorage(w2);
    w2.fight = { on: extra.fighting !== false };
    w2.win.playerInCombat = () => w2.fight.on;
    w2.toasts = [];
    w2.win.showNotification = (...a) => w2.toasts.push(a[0]);
    return w2;
};
const register = (w, npcId, mappings) => {
    const npc = w.nm.npcs.get(npcId);
    npc.eventMappings = mappings;
    w.nm._setupEventMappings(npcId, mappings);
};
const saveOf = (w) => JSON.parse(JSON.stringify(w.nm.exportPhoneState()));
const loaded = async (w, ms = 1500) => { w.dispatcher.emit('game_loaded', {}); await w.advance(ms); };

test('voiced call met in a fight: no banner, saved as a pending call, one toast; rings after the fight', async () => {
    const w = worldWith([phoneNpc]);
    try {
        const m = mapping({ voiced: true });
        register(w, 'caller', [m]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(2000);
        assert.equal(w.banner(), null, 'no banner mid-fight');
        assert.equal(w.calls.started.length, 0);
        assert.ok(saveOf(w).caller?.pendingCall, 'saved as a pending call');
        assert.equal(w.toasts.filter((t) => /is calling/.test(t)).length, 1, 'one toast');
        assert.ok(w.nm.exportTriggeredEvents()['caller:room_entered:0'] > 0, 'trigger persisted like a ring');
        w.fight.on = false;
        await w.advance(2000);
        assert.ok(w.banner(), 'rings once the fight is over');
    } finally { w.restore(); }
});

test('voiced call met with no fight rings straight away', async () => {
    const w = worldWith([phoneNpc], { fighting: false });
    try {
        register(w, 'caller', [mapping({ voiced: true, ring: true })]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1000);
        assert.ok(w.banner());
    } finally { w.restore(); }
});

test('voiced call held in a fight, then a reload: the call arrives after the reload', async () => {
    const w = worldWith([phoneNpc]);
    let saved;
    try {
        register(w, 'caller', [mapping({ voiced: true, setGlobal: { gallery_call_deferred: false }, disableClose: true })]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1500);
        saved = saveOf(w);
        assert.equal(w.banner(), null);
    } finally { w.restore(); }
    const w2 = rebuild(w, [phoneNpc]);
    try {
        w2.win.gameState.globalVariables.gallery_call_deferred = false;
        w2.nm.restorePhoneState(saved);
        register(w2, 'caller', [mapping({ voiced: true, setGlobal: { gallery_call_deferred: false }, disableClose: true })]);
        await loaded(w2, 3000);
        assert.equal(w2.banner(), null, 'a fight still on after the reload holds it again');
        w2.fight.on = false;
        await w2.advance(3000);
        assert.ok(w2.banner(), 'the forced call comes back after the reload');
    } finally { w2.restore(); }
});

test('text phone-chat held in a fight is saved as a small record, cleared on delivery', async () => {
    const w = worldWith([phoneNpc]);
    try {
        register(w, 'caller', [mapping()]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1500);
        assert.equal(w.calls.started.length, 0, 'held');
        const rec = JSON.parse(store.get(heldKey));
        assert.ok(Number.isFinite(rec[0].at), 'stamped with when it was held');
        delete rec[0].at;   // once: the mapping is onceOnly, so the hold is kept across a long break (R3 m3)
        assert.deepEqual(rec, [{ npcId: 'caller', eventPattern: 'room_entered', handlerIndex: 0, once: true, sceneType: 'phone-chat' }]);
        assert.equal(JSON.stringify(saveOf(w)).includes('room_entered'), false, 'nothing added to the synced phone state');
        w.fight.on = false;
        await w.advance(2500);
        assert.equal(w.calls.started.length, 1, 'delivered after the fight');
        assert.equal(store.has(heldKey), false, 'record cleared on delivery');
    } finally { w.restore(); }
});

test('text phone-chat held in a fight survives a reload and opens once the fight is over', async () => {
    const w = worldWith([phoneNpc]);
    try {
        register(w, 'caller', [mapping({ targetKnot: 'text_knot' })]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1500);
        assert.ok(store.has(heldKey));
    } finally { w.restore(); }
    const w2 = rebuild(w, [phoneNpc]);   // storage kept: the same browser
    try {
        register(w2, 'caller', [mapping({ targetKnot: 'text_knot' })]);
        await loaded(w2, 1500);
        assert.equal(w2.calls.started.length, 0, 'a fight is still on after the reload: held again');
        assert.ok(store.has(heldKey), 'still saved');
        w2.fight.on = false;
        await w2.advance(2500);
        assert.equal(w2.calls.started.length, 1);
        assert.equal(w2.calls.started[0].type, 'phone-chat');
        assert.equal(w2.calls.started[0].params.startKnot, 'text_knot');
        assert.equal(store.has(heldKey), false);
    } finally { w2.restore(); }
});

test('person-chat and video-call held in a fight survive a reload', async () => {
    for (const mode of ['person-chat', 'video-call']) {
        const m = mapping({ conversationMode: mode, targetKnot: 'talk_knot' });
        const w = worldWith([personNpc]);
        try {
            register(w, 'guard', [m]);
            w.dispatcher.emit('room_entered', {});
            await w.advance(1500);
            assert.equal(w.calls.started.length, 0, `${mode} held`);
            assert.equal(JSON.parse(store.get(heldKey))[0].sceneType, 'person-chat');
        } finally { w.restore(); }
        const w2 = rebuild(w, [personNpc]);
        try {
            register(w2, 'guard', [m]);
            await loaded(w2, 500);
            w2.fight.on = false;
            await w2.advance(2500);
            assert.equal(w2.calls.started.length, 1, `${mode} delivered after the reload`);
            assert.equal(w2.calls.started[0].type, 'person-chat');
            assert.equal(w2.calls.started[0].params.startKnot, 'talk_knot');
            assert.equal(!!w2.calls.started[0].params.videoCall, mode === 'video-call');
        } finally { w2.restore(); }
    }
});

test('a held record is dropped when its NPC was knocked out before the reload', async () => {
    const m = mapping({ conversationMode: 'person-chat', targetKnot: 'talk_knot' });
    const w = worldWith([personNpc]);
    try {
        register(w, 'guard', [m]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1500);
        assert.ok(store.has(heldKey), 'held and saved before the reload');
    } finally { w.restore(); }
    const w2 = rebuild(w, [personNpc]);
    try {
        register(w2, 'guard', [m]);
        w2.win.npcHostileSystem = { isNPCKO: () => true, isNPCHostile: () => false };
        await loaded(w2, 300);
        w2.fight.on = false;
        await w2.advance(2500);
        assert.equal(w2.calls.started.length, 0, 'the knocked-out guard does not talk');
        assert.equal(store.has(heldKey), false, 'and the record is gone');
    } finally { w2.restore(); }
});

test('a held record for an NPC that registers after game_loaded is resumed then', async () => {
    const m = mapping({ conversationMode: 'person-chat', targetKnot: 'talk_knot' });
    const w = worldWith([personNpc]);
    try {
        register(w, 'guard', [m]);
        w.dispatcher.emit('room_entered', {});
        await w.advance(1500);
    } finally { w.restore(); }
    const w2 = rebuild(w, []);
    try {
        await loaded(w2, 300);
        assert.ok(store.has(heldKey), 'kept while the NPC is not registered');
        w2.nm.registerNPC({ ...personNpc, eventMappings: [m], npcType: 'person' });
        w2.fight.on = false;
        await w2.advance(2500);
        assert.equal(w2.calls.started.length, 1);
    } finally { w2.restore(); }
});

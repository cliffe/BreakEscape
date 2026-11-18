// R2: a phone-chat or person-chat EVENT MAPPING held by a fight is re-checked before it is
// delivered (a voiced call through its ringWhile, a text thread through the queue's re-check),
// a held forced call stays forced, a dropped onceOnly challenge gets its trigger back, and an
// old saved hold is dropped on resume. The m10 breach call is the model: a voiced onceOnly
// mapping guarded by `!globalVars.hax_jammed`, whose knot sets breach_call_done.
// Run with: node test/js/phone-defer-combat-mapping.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const phoneNpc = { id: 'hax', displayName: 'Agent HaX', npcType: 'phone' };
const guardNpc = { id: 'guard', displayName: 'Guard', npcType: 'person' };
const breach = (extra = {}) => ({
    eventPattern: 'global_variable_changed:breach_open', condition: 'value === true && !globalVars.hax_jammed && !globalVars.breach_call_done',
    onceOnly: true, cooldown: 0, conversationMode: 'phone-chat', targetKnot: 'breach_call', voiced: true, ...extra,
});

const store = new Map();
const heldKey = 'be_held_conversations:9';
function world(npcs, { fighting = true } = {}) {
    store.clear();
    delete globalThis.window.npcHostileSystem;
    const w = makeWorld({ npcs });
    Object.defineProperty(w.win, 'localStorage', {
        configurable: true,
        value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    });
    w.win.breakEscapeConfig = { gameId: 9 };
    w.fight = { on: fighting };
    w.win.playerInCombat = () => w.fight.on;
    w.win.showNotification = () => {};
    return w;
}
const register = (w, id, mappings) => { w.nm.npcs.get(id).eventMappings = mappings; w.nm._setupEventMappings(id, mappings); };
const breachOpens = (w) => w.dispatcher.emit('global_variable_changed:breach_open', { name: 'breach_open', value: true });
const rings = (w) => w.win.document.querySelectorAll('#phone-ring-layer .incoming-call').length;

test('voiced call held in a fight: the condition goes false during the fight, so it never rings', async () => {
    const w = world([phoneNpc]);
    try {
        register(w, 'hax', [breach()]);
        breachOpens(w);
        await w.advance(1500);
        assert.equal(rings(w), 0, 'held');
        w.win.gameState.globalVariables.hax_jammed = true;
        w.fight.on = false;
        await w.advance(4000);
        assert.equal(rings(w), 0, 'no ring');
        assert.equal(w.calls.started.length, 0, 'no call opened');
    } finally { w.restore(); }
});

test('voiced call held in a fight: the condition still holds, so it rings once and does not deliver twice', async () => {
    const w = world([phoneNpc]);
    try {
        register(w, 'hax', [breach()]);
        breachOpens(w);
        await w.advance(1500);
        w.fight.on = false;
        await w.advance(3000);
        assert.equal(rings(w), 1, 'rings after the fight');
        breachOpens(w);   // the event again (a re-emit): onceOnly keeps it from a second delivery
        await w.advance(3000);
        assert.equal(rings(w), 1, 'still one ring');
        w.win.document.querySelector('#phone-ring-layer .incoming-call [data-action="answer"], #phone-ring-layer .incoming-call button')?.click();
        await w.advance(3000);
        assert.ok(w.calls.started.length <= 1, 'at most one call opened');
    } finally { w.restore(); }
});

test('the mapping\'s own latch does not make a held call drop itself', async () => {
    const w = world([phoneNpc]);
    try {
        register(w, 'hax', [breach({ setGlobal: { breach_call_done: true } })]);
        breachOpens(w);
        await w.advance(1500);
        w.fight.on = false;
        await w.advance(3000);
        assert.equal(rings(w), 1, 'its own breach_call_done write is not a reason to drop it');
    } finally { w.restore(); }
});

test('an unforced held voiced call rings until answered, it does not time out to a missed call', async () => {
    const w = world([phoneNpc]);
    try {
        register(w, 'hax', [breach()]);
        breachOpens(w);
        await w.advance(1500);
        w.fight.on = false;
        await w.advance(3000);
        await w.advance(60000);
        assert.equal(rings(w), 1, 'still ringing a minute later');
        const rows = (w.nm.getNPC('hax').storyState && w.nm.exportPhoneState().hax?.messages || []).filter((m) => m.callEvent === 'missed');
        assert.equal(rows.length, 0, 'no missed call row');
    } finally { w.restore(); }
});

test('a held FORCED voiced call stays forced: it answers itself after the fight', async () => {
    const w = world([phoneNpc]);
    try {
        register(w, 'hax', [breach({ disableClose: true })]);
        breachOpens(w);
        await w.advance(1500);
        assert.equal(w.calls.started.length, 0);
        w.fight.on = false;
        await w.advance(30000);
        assert.equal(w.calls.started.length, 1, 'opened without a click');
        assert.equal(w.calls.started[0].type, 'phone-chat');
        assert.equal(w.calls.started[0].params.disableClose, true);
    } finally { w.restore(); }
});

test('text phone-chat mapping held in a fight: condition false at the end of the fight, not delivered; true, delivered once', async () => {
    for (const stillHolds of [false, true]) {
        const w = world([phoneNpc]);
        try {
            register(w, 'hax', [breach({ voiced: false })]);
            breachOpens(w);
            await w.advance(1500);
            assert.equal(w.calls.started.length, 0, 'held');
            assert.ok(store.has(heldKey));
            if (!stillHolds) w.win.gameState.globalVariables.hax_jammed = true;
            w.fight.on = false;
            await w.advance(3000);
            assert.equal(w.calls.started.length, stillHolds ? 1 : 0);
            breachOpens(w);
            await w.advance(3000);
            assert.equal(w.calls.started.length, stillHolds ? 1 : 0, 'no second delivery');
            assert.equal(store.has(heldKey), false);
        } finally { w.restore(); }
    }
});

test('a onceOnly challenge dropped in a fight gets its trigger back and fires after the fight', async () => {
    const w = world([guardNpc]);
    try {
        const rearmed = [];
        w.win.sightChallengeWatcher = { rearm: (id) => rearmed.push(id) };
        register(w, 'guard', [{ eventPattern: 'player_spotted:guard', onceOnly: true, cooldown: 0, conversationMode: 'person-chat', targetKnot: 'tunnel' }]);
        w.dispatcher.emit('player_spotted:guard', {});
        await w.advance(1500);
        assert.equal(w.calls.started.length, 0, 'dropped in the fight');
        assert.deepEqual(rearmed, ['guard']);
        w.fight.on = false;
        w.dispatcher.emit('player_spotted:guard', {});   // the re-armed sighting
        await w.advance(1500);
        assert.equal(w.calls.started.length, 1, 'delivered after the fight');
        w.dispatcher.emit('player_spotted:guard', {});
        await w.advance(1500);
        assert.equal(w.calls.started.length, 1, 'and only once');
    } finally { w.restore(); }
});

test('player_spotted outside a fight is queued, not dropped, when the player is busy', async () => {
    const w = world([guardNpc], { fighting: false });
    try {
        const seen = [];
        const orig = w.nm._queueScriptedConversation.bind(w.nm);
        w.nm._queueScriptedConversation = (c) => { seen.push(c); return orig(c); };
        register(w, 'guard', [
            { eventPattern: 'player_spotted:guard', cooldown: 0, conversationMode: 'person-chat', targetKnot: 'a' },
            { eventPattern: 'player_in_view:guard', cooldown: 0, conversationMode: 'person-chat', targetKnot: 'b' },
        ]);
        w.dispatcher.emit('player_spotted:guard', {});
        w.dispatcher.emit('player_in_view:guard', {});
        await w.advance(200);
        const a = seen.find((c) => c.label === 'player_spotted:guard');
        const b = seen.find((c) => c.label === 'player_in_view:guard');
        assert.equal(a.dropIfBusy, false);
        assert.equal(a.dropInFight, true);
        assert.equal(b.dropIfBusy, true);
    } finally { w.restore(); }
});

test('a saved hold older than the age cap is dropped on resume; a fresh one is resumed', async () => {
    const m = { eventPattern: 'room_entered', onceOnly: true, cooldown: 0, conversationMode: 'person-chat', targetKnot: 'talk' };
    for (const [age, expected] of [[11 * 60 * 1000, 0], [30 * 1000, 1]]) {
        const w = world([guardNpc], { fighting: false });
        try {
            store.set(heldKey, JSON.stringify([{ npcId: 'guard', eventPattern: 'room_entered', handlerIndex: 0, sceneType: 'person-chat', at: Date.now() - age }]));
            w.nm._heldRecordsPending = true;
            register(w, 'guard', [m]);
            w.dispatcher.emit('game_loaded', {});
            w.nm.resumeHeldConversations();
            await w.advance(3000);
            assert.equal(w.calls.started.length, expected, `age ${age}`);
        } finally { w.restore(); }
    }
});

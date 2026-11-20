// Engine sweep review R2 probe of ring.ringWhile edge cases (queued drop, onceOnly restore, a self-triggering
// restore, a later write clobbered by the restore, forced exemption). Output: ringwhile_edges_out.txt.
// Real npc-manager + phone-ringer-dom on the shared ring harness.
import assert from 'node:assert/strict';
import { makeWorld } from '../../../../../test/js/phone-ring-harness.mjs';   // run from the repo root: node docs/agents/phone_calls/proofs/ENGINE_SWEEP_R2/ringwhile_edges.mjs

const out = [];
const log = (k, v) => out.push(`${k}: ${JSON.stringify(v)}`);
const npc = { id: 'hax', displayName: 'HaX', avatar: 'assets/x.png' };
const cfg = (extra = {}) => ({ handlerIndex: 0, knot: 'ring_call', targetKnot: 'ring_call', conversationMode: 'phone-chat',
    ring: { onMissed: 'callback', ringWhile: 'globalVars.live !== true' }, once: true, cooldown: 0, ...extra });
const phoneEvents = (w) => w.dispatcher.emitted.map(([n]) => n).filter((n) => /^phone_call_|^conversation_closed/.test(n));

// 1. A queued ringWhile offer (behind a conversation) is dropped from the queue, never rings, leaves nothing.
{
    const w = makeWorld({ npcs: [npc] });
    try {
        const g = w.win.gameState.globalVariables; g.live = false;
        w.fw.startMinigame('person-chat', null, { npcId: 'someone' });
        await w.advance(200);
        w.nm._handleEventMapping('hax', 'ev_a', cfg({ setGlobal: { hax_rang: true } }), {});
        await w.advance(500);
        log('1 queued behind a conversation', w.ringer.stateOf('hax'));
        g.live = true;
        await w.advance(1000);
        log('1 after ringWhile fails (queued)', { state: w.ringer.stateOf('hax'), banner: !!w.banner(), hax_rang: g.hax_rang,
            rows: (w.nm.conversationHistory.get('hax') || []).length, callback: w.ringer.callbackFor('hax'), phoneEvents: phoneEvents(w) });
        w.fw.endMinigame(true, null);
        await w.advance(25000);
        log('1 after the conversation ends + 25 s', { state: w.ringer.stateOf('hax'), banner: !!w.banner(), phoneEvents: phoneEvents(w) });
    } finally { w.restore(); }
}

// 2. onceOnly: the restore re-emits global_variable_changed:<latch>; a listener re-running the same mapping is refused.
{
    const w = makeWorld({ npcs: [npc] });
    try {
        const g = w.win.gameState.globalVariables; g.live = true;   // ringWhile already false when it fires
        let calls = 0;
        const c = cfg({ setGlobal: { hax_rang: true }, condition: 'globalVars.hax_rang !== true' });
        w.dispatcher.on('global_variable_changed:hax_rang', () => { calls++; if (calls < 20) w.nm._handleEventMapping('hax', 'ev_b', c, {}); });
        w.nm._handleEventMapping('hax', 'ev_b', c, {});
        log('2 right after the fire', { state: w.ringer.stateOf('hax'), banner: !!w.banner(), hax_rang: g.hax_rang });
        await w.advance(3000);
        log('2 onceOnly after 3 s', { state: w.ringer.stateOf('hax'), hax_rang: g.hax_rang, latchEvents: calls,
            ringsShown: w.dispatcher.emitted.filter(([n]) => /^phone_call_ringing/.test(n)).length });
    } finally { w.restore(); }
}

// 3. Not onceOnly, mapping on its own latch's change event (pathological): does the restore loop?
{
    const w = makeWorld({ npcs: [npc] });
    try {
        const g = w.win.gameState.globalVariables; g.live = true;
        let fires = 0;
        const c = cfg({ once: false, setGlobal: { hax_rang: true }, condition: 'globalVars.hax_rang !== true' });
        w.dispatcher.on('global_variable_changed:hax_rang', () => { if (fires < 200) { fires++; w.nm._handleEventMapping('hax', 'ev_c', c, {}); } });
        w.nm._handleEventMapping('hax', 'ev_c', c, {});
        log('3 handler runs before any clock tick (synchronous)', fires);
        await w.advance(3000);
        log('3 not onceOnly, self-triggering, after 3 s', { handlerRuns: fires, hax_rang: g.hax_rang, state: w.ringer.stateOf('hax') });
    } finally { w.restore(); }
}

// 4. The restore overwrites a later write to the same global (by something else) between offer and drop.
{
    const w = makeWorld({ npcs: [npc] });
    try {
        const g = w.win.gameState.globalVariables; g.live = false; g.stage = 1;
        w.nm._handleEventMapping('hax', 'ev_d', cfg({ setGlobal: { stage: 2 } }), {});
        await w.advance(500);
        g.stage = 3;   // e.g. ink moves the same global on while the call rings
        g.live = true;
        await w.advance(1000);
        log('4 later write then drop', { state: w.ringer.stateOf('hax'), stage: g.stage });
    } finally { w.restore(); }
}

// 5. Forced call with ringWhile: never dropped.
{
    const w = makeWorld({ npcs: [npc] });
    try {
        const g = w.win.gameState.globalVariables; g.live = false;
        w.nm._handleEventMapping('hax', 'ev_e', cfg({ disableClose: true }), {});
        await w.advance(500);
        g.live = true;
        await w.advance(3000);
        log('5 forced + ringWhile false', w.ringer.stateOf('hax'));
    } finally { w.restore(); }
}
process.stdout.write(out.join('\n') + '\n');

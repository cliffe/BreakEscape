// Office life slice 19 (OFFICE_LIFE_PLAN 12.5, OQ37-39, OQ48, OQ53, OQ55): desk-phone calls. A ring
// (desk_phone_ring:<phoneId>) rings `rings` times, one every 3 s of the needs clock. The owner at its
// post answers as a call overlay (s.call), not a job: no move, no npc_left_post, no selection during
// the call. Away (walking, in its wind-up, in a chat) it misses the call. From the second ring an
// answersPhones colleague, idle at its post in the room and compatible with the owner, walks over (a
// real leave, the call chosen at the claim); the owner arriving first turns it back (`answered`), a
// ring-out turns it back (`rang_out`). Calls are half-conversations: the speaker's own knot lines,
// voiced only with the player in earshot, heard once (heard_<knot>); a chat with the speaker hangs up.
// Run with: bin/test-js test/js/npc-desk-phone.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    NPCNeedsSystem, NEEDS_TICK_MS, RING_MS, PICKUP_MS, EXCHANGE_MAX_MS, CALL_GAP_MS, exchangeLineMs, requiredGlobalsHold
} from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const T = 32;
const calm = () => ({ thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 95 } });
const SUPPLIER = ['Yes, Tuesday is fine.', 'No, the big boxes.', 'Lovely, thanks. Bye.'];
const MESSAGE = ["Tom's phone. He's stepped out.", 'Can I take a message?'];

// Tom's desk (100, 100), his home cell (100, 132); his phone 30 px to the side. Amara's desk (300, 100).
function office({ tom = {}, amara = {}, rosa = null, phone = {}, globals = {}, chatter = {}, lines = null, arrive = true, hears = true } = {}) {
    const objects = [
        { id: 'tom_pc', x: 100, y: 100, affordance: { satisfies: ['work'], restores: 30, useSeconds: 60 } },
        { id: 'amara_pc', x: 300, y: 100, affordance: { satisfies: ['work'], restores: 30, useSeconds: 60 } },
        { id: 'kettle', x: 600, y: 100, affordance: { satisfies: ['thirst'], restores: 60, useSeconds: 10 } },
        { id: 'tom_phone', x: 130, y: 100, phoneOwner: 'tom', affordance: { useSeconds: 0, capacity: 1, seat: 'stand' }, ...phone }
    ];
    const npcs = {
        tom: { pos: { x: 100, y: 132 }, rec: { id: 'tom', needsHome: 'tom_pc', needs: calm(), phoneCalls: [{ knot: 'call_supplier' }], ...tom } },
        amara: { pos: { x: 300, y: 132 }, rec: { id: 'amara', needsHome: 'amara_pc', needs: calm(), answersPhones: true, phoneCalls: [{ knot: 'call_take_message' }], ...amara } }
    };
    if (rosa) npcs.rosa = { pos: { x: 200, y: 132 }, rec: { id: 'rosa', needsHome: { room: 'office', x: 200 / T, y: 132 / T }, needs: calm(), answersPhones: true, ...rosa } };
    const w = makeWorld({ npcs, objects, arrive });
    const spoken = [];
    const cancelled = [];
    const knots = lines || { tom: { call_supplier: SUPPLIER }, amara: { call_take_message: MESSAGE } };
    w.world.globalHolds = cond => requiredGlobalsHold(cond, globals);
    w.world.setGlobal = (name, v) => { globals[name] = v; };
    w.world.chatterConfig = () => chatter;
    w.world.playerProximity = () => ({ nearby: false, distance: null });
    const ear = { on: hears };
    w.world.playerHears = () => ({ overheard: ear.on, distance: ear.on ? 64 : null });
    w.world.exchangeLines = (id, knot) => {
        const k = knots[id]?.[knot];
        if (k === 'pending') return null;
        return k ? k.map(text => ({ speakerId: id, text })) : [];
    };
    w.world.cancelSpeech = id => cancelled.push(id);
    const sys = new NPCNeedsSystem(w.world, { seed: 11, manualClock: true });
    w.world.speak = (id, line, info) => spoken.push({ id, line, info, at: sys.clockMs });
    w.attach(sys);
    sys.registerAll();
    const log = ev => sys.getLog().filter(e => e.ev === ev);
    const emitted = p => w.calls.emits.filter(e => e.name.startsWith(p));
    const ticks = n => { for (let i = 0; i < n; i++) sys.tick(); };
    const until = (fn, max = 400) => { for (let i = 0; i < max && !fn(); i++) sys.tick(); return fn(); };
    const ring = () => sys.onPhoneRing('tom_phone');
    return { w, sys, log, emitted, ticks, until, ring, spoken, cancelled, globals, ear, st: id => sys.states.get(id) };
}

const callMs = (texts, sys, id) => sys.states.get(id).call ? sys.states.get(id).call.until - sys.clockMs : 0;

test('the owner idle at its post answers after the first ring, without moving: no npc_left_post, the post stop kept', () => {
    const o = office();
    o.ticks(2);
    const moves = o.w.calls.moves.length;
    o.ring();
    o.ticks(1);
    assert.deepEqual(o.emitted('desk_phone_ringing:').map(e => e.data.ring), [1]);
    assert.equal(o.st('tom').call, null, 'not before one ring is heard');
    o.ticks(PICKUP_MS / NEEDS_TICK_MS);
    const tom = o.st('tom');
    assert.equal(tom.call?.phoneId, 'tom_phone');
    assert.deepEqual(o.emitted('desk_phone_answered:').map(e => [e.data.ownerId, e.data.answeredBy, e.data.knot]), [['tom', 'tom', 'call_supplier']]);
    assert.equal(o.emitted('npc_left_post:').length, 0);
    assert.equal(o.w.calls.moves.length, moves, 'no move');
    assert.equal(tom.mode, 'idle');
    assert.ok(tom.atPost);
    assert.equal(o.sys.getState('tom').call.phoneId, 'tom_phone');
    assert.ok(o.sys.getState('tom').call.remainingMs > 0);
    o.until(() => !o.st('tom').call);
    assert.equal(o.emitted('desk_phone_ringing:').length, 1, 'one ring');
    assert.equal(o.emitted('npc_left_post:').length, 0);
    assert.equal(o.sys.getState('tom').call, null);
});

test('half a call: the owner\'s own lines in order, one per bubble with listening gaps of 1.5 to 3 s, voiced (overheard); heard_<knot> and npc_call_heard once', () => {
    const o = office();
    o.ring();
    o.until(() => o.log('call_ended').length > 0);
    assert.deepEqual(o.spoken.map(s => s.line), SUPPLIER);
    assert.ok(o.spoken.every(s => s.id === 'tom' && s.info.overheard === true && s.info.knot === 'call_supplier' && s.info.call === true));
    for (let i = 1; i < o.spoken.length; i++) {
        const gap = o.spoken[i].at - (o.spoken[i - 1].at + exchangeLineMs(SUPPLIER[i - 1]));
        assert.ok(gap >= CALL_GAP_MS[0] - NEEDS_TICK_MS && gap <= CALL_GAP_MS[1] + NEEDS_TICK_MS, `gap ${gap}`);
    }
    assert.equal(o.globals.heard_call_supplier, true);
    assert.deepEqual(o.emitted('npc_call_heard:').map(e => e.name), ['npc_call_heard:call_supplier']);
    assert.equal(o.emitted('npc_overheard:tom').length, 3);
    // the next call uses the owner's phone pool, then pictures; the knot is not replayed
    const p = office({ globals: { heard_call_supplier: true }, chatter: { phone: ['Hello, Tom speaking.'] } });
    p.ring();
    p.until(() => p.log('call_ended').length > 0);
    assert.deepEqual(p.spoken.map(s => s.line), ['Hello, Tom speaking.']);
    assert.equal(p.emitted('npc_call_heard:').length, 0);
    const q = office({ globals: { heard_call_supplier: true } });
    q.ring();
    q.until(() => q.log('call_ended').length > 0);
    assert.equal(q.spoken.length, 0);
    assert.deepEqual(q.log('call_line').map(e => e.line), ['picture:phone', 'picture:phone', 'picture:phone']);
});

test('with nobody in earshot the call still happens as phone pictures, with no TTS, and the knot stays unplayed', () => {
    const o = office({ hears: false });
    o.ring();
    o.until(() => o.log('call_ended').length > 0);
    assert.equal(o.spoken.length, 0);
    assert.deepEqual(o.log('call_line').map(e => e.heard), [false, false, false]);
    assert.equal(o.globals.heard_call_supplier, undefined);
    assert.equal(o.emitted('npc_call_heard:').length, 0);
    assert.equal(o.log('call_ended')[0].heard, false);
});

test('the speech lock is held through a listening gap only while the player is in earshot', () => {
    const o = office();
    o.ring();
    o.until(() => o.spoken.length === 1);
    o.until(() => !o.sys._talking('tom'));   // first line over: in the gap
    assert.ok(!o.sys._speechFree(), 'held in the gap');
    o.ear.on = false;
    o.ticks(1);
    assert.ok(o.sys._speechFree(), 'released at once');
});

test('an own-desk use is extended by the call, not aborted; the typing state is off during the call', async () => {
    const o = office({ tom: { needs: { work: { decayPerMin: 1, urgentAt: 50, initial: 49 } } } });
    o.until(() => o.st('tom').job?.phase === 'using');
    const before = o.st('tom').job.useUntil;
    o.ring();
    o.until(() => !!o.st('tom').call);
    const job = o.st('tom').job;
    assert.equal(job.targetId, 'tom_pc');
    assert.equal(job.useUntil - before, o.st('tom').call.until - o.sys.clockMs);
    const { isTyping, typingBob } = await seatingPure();
    assert.equal(isTyping(o.st('tom')), false);
    assert.equal(typingBob(o.st('tom'), 600), 0);
    assert.equal(o.log('job_aborted').length, 0);
});

test('the owner away misses it: unanswered once, after the last ring; also in its wind-up and in a chat', () => {
    // walking to the kettle (moves never arrive); nobody else answers
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, amara: { answersPhones: false }, arrive: false });
    o.ticks(1);
    assert.equal(o.st('tom').job?.targetId, 'kettle');
    o.ring();
    o.ticks((4 * RING_MS + RING_MS) / NEEDS_TICK_MS + 2);
    assert.deepEqual(o.emitted('desk_phone_ringing:').map(e => e.data.ring), [1, 2, 3, 4]);
    assert.equal(o.emitted('desk_phone_unanswered:').length, 1);
    assert.equal(o.emitted('desk_phone_answered:').length, 0);
    // in a chat with the player
    const p = office({ amara: { answersPhones: false } });
    p.w.setChat('tom');
    p.ring();
    p.ticks(25 * 4);
    assert.equal(p.emitted('desk_phone_unanswered:').length, 1);
    assert.equal(p.emitted('desk_phone_answered:').length, 0);
});

test('the owner in its wind-up misses the call', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, amara: { answersPhones: false }, arrive: false });
    o.w.world.windupMs = () => 60000;   // a long wind-up: it has decided to go
    o.ticks(1);
    assert.ok(o.st('tom').job?.windupUntil);
    o.ring();
    o.ticks(20 * 4);
    assert.equal(o.emitted('desk_phone_unanswered:').length, 1);
    assert.equal(o.emitted('desk_phone_answered:').length, 0);
});

test('a ring while ringing or in a call is ignored (no ring on a busy line)', () => {
    const o = office();
    assert.equal(o.ring(), true);
    assert.equal(o.ring(), false);
    o.until(() => !!o.st('tom').call);
    assert.equal(o.ring(), false);
    assert.deepEqual(o.log('ring_ignored').map(e => e.reason), ['ringing', 'call']);
});

test('the ring pauses with the needs clock (no ticks, no rings)', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, arrive: false });
    o.ticks(1);
    o.ring();
    o.ticks(1);
    const n = o.emitted('desk_phone_ringing:').length;
    // update() with the VM open does not tick; here no tick is simply no ring
    o.w.world.isVmActive = () => true;
    o.sys.manualClock = false;
    o.sys.update(); o.sys.update();
    assert.equal(o.emitted('desk_phone_ringing:').length, n);
});

test('a colleague answers only from the second ring, idle and in the room: a real leave at the call\'s length, standing at the phone', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, arrive: false });
    o.ticks(1);
    o.ring();
    o.ticks(1);
    assert.equal(o.st('amara').job, null, 'not on the first ring');
    o.until(() => o.emitted('desk_phone_ringing:').length === 2);
    const job = o.st('amara').job;
    assert.equal(job?.targetId, 'tom_phone');
    assert.ok(job.phone);
    const left = o.emitted('npc_left_post:amara');
    assert.equal(left.length, 1);
    assert.equal(left[0].data.expectedAwayMs >= job.callMs, true);
    assert.equal(o.log('phone_claimed')[0].knot, 'call_take_message');
    // the phone keeps ringing while she walks (moves never arrive), past its four rings
    o.ticks(3.5 * RING_MS / NEEDS_TICK_MS);
    assert.ok(o.emitted('desk_phone_ringing:').length >= 5);
    assert.equal(o.emitted('desk_phone_unanswered:').length, 0);
    // she arrives: picks up, the use lasts the call
    o.w.pos.amara.x = 130; o.w.pos.amara.y = 132;
    o.sys.onArrived('amara', 'needs');
    o.ticks(1);
    const j = o.st('amara').job;
    assert.equal(j.phase, 'using');
    assert.equal(j.useUntil - o.sys.clockMs, j.callMs);
    assert.deepEqual(o.emitted('desk_phone_answered:').map(e => e.data.answeredBy), ['amara']);
    assert.equal(o.st('amara').call.phoneId, 'tom_phone');
    o.until(() => !o.st('amara').job);
    assert.deepEqual(o.spoken.map(s => [s.id, s.line]), MESSAGE.map(l => ['amara', l]));
    assert.equal(o.globals.heard_call_take_message, true);
});

test('no colleague who is busy, avoids the owner, lacks answersPhones, is on its own call or in another room', () => {
    const away = { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } };
    for (const amara of [{ needsCompany: { avoids: ['tom'] } }, { answersPhones: false }]) {
        const o = office({ tom: away, amara, arrive: false });
        o.ticks(1);
        o.ring();
        o.ticks(25 * 4);
        assert.equal(o.log('phone_claimed').length, 0);
        assert.equal(o.emitted('desk_phone_unanswered:').length, 1);
    }
    const o = office({ tom: away, arrive: false });
    o.w.pos.amara.roomId = 'lounge';
    o.ticks(1);
    o.ring();
    o.ticks(25 * 4);
    assert.equal(o.log('phone_claimed').length, 0);
    // on a call of her own
    const p = office({ tom: away, arrive: false });
    p.ticks(1);
    p.st('amara').call = { phoneId: 'x', until: 1e9 };
    p.ring();
    p.ticks(25 * 4);
    assert.equal(p.log('phone_claimed').length, 0);
});

test('the owner arriving first wins: the colleague on the way turns back `answered`, no grumble, straight home', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, arrive: false });
    o.ticks(1);
    o.ring();
    o.until(() => !!o.st('amara').job);
    // Tom gets back to his desk first
    o.st('tom').job = null; o.st('tom').mode = 'returning'; o.st('tom').atPost = false; o.st('tom').levels.thirst = 95;
    o.w.pos.tom.x = 100; o.w.pos.tom.y = 132;
    o.sys.onArrived('tom', 'needs');
    o.ticks(2);
    assert.equal(o.st('tom').call?.phoneId, 'tom_phone');
    const tb = o.emitted('npc_turned_back:amara');
    assert.deepEqual(tb.map(e => e.data.reason), ['answered']);
    assert.equal(o.st('amara').saying, null, 'no grumble');
    assert.equal(o.st('amara').job, null, 'straight home, no fallback');
    assert.deepEqual(o.emitted('desk_phone_answered:').map(e => e.data.answeredBy), ['tom']);
});

test('ring-out turns every answerer back with rang_out; one fires unanswered or answered, never both', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, arrive: false, phone: { rings: 2 } });
    o.ticks(1);
    o.ring();
    o.until(() => !!o.st('amara').job);
    // she is frozen in a chat on the way: she no longer keeps it ringing
    o.w.setChat('amara');
    o.until(() => o.emitted('desk_phone_unanswered:').length > 0, 100);
    assert.equal(o.emitted('desk_phone_unanswered:').length, 1);
    assert.equal(o.emitted('desk_phone_answered:').length, 0);
    assert.deepEqual(o.emitted('npc_turned_back:amara').map(e => e.data.reason), ['rang_out']);
    assert.equal(o.st('amara').job, null);
    assert.equal(o.st('amara').prevMode, 'returning');
    const moves = o.w.calls.moves.filter(m => m.id === 'amara').length;
    o.ticks(4);
    assert.equal(o.w.calls.moves.filter(m => m.id === 'amara').length, moves, 'no move during the chat');
    o.w.pos.amara.x = 140;   // she had walked part of the way
    o.w.setChat(null);
    o.ticks(1);
    assert.equal(o.st('amara').mode, 'returning');
    assert.equal(o.w.calls.moves.filter(m => m.id === 'amara').length, moves + 1, 'home after the chat');
    assert.equal(o.spoken.length, 0, 'no call lines');
});

test('a chat opened with the speaker hangs up: rest dropped, lock released, line stopped, knot unplayed, desk_phone_hung_up player', () => {
    const o = office();
    o.ring();
    o.until(() => o.spoken.length === 2);
    o.w.setChat('tom');
    o.ticks(1);
    assert.deepEqual(o.emitted('desk_phone_hung_up:').map(e => [e.data.speakerId, e.data.reason]), [['tom', 'player']]);
    assert.ok(o.sys._speechFree());
    assert.deepEqual(o.cancelled, ['tom']);
    assert.equal(o.st('tom').call, null);
    assert.equal(o.globals.heard_call_supplier, undefined);
    assert.equal(o.emitted('npc_call_heard:').length, 0);
    o.w.setChat(null);
    o.ticks(40);
    assert.equal(o.spoken.length, 2, 'no more lines');
});

test('a colleague hung up mid-call by a chat has no remainder: home after the chat, not standing at the phone', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } } });
    o.ticks(1);
    o.ring();
    o.until(() => o.spoken.length === 1);
    assert.equal(o.spoken[0].id, 'amara');
    o.w.setChat('amara');
    o.ticks(1);
    assert.equal(o.st('amara').job.useRemaining, 0);
    o.w.setChat(null);
    o.ticks(3);
    assert.equal(o.st('amara').job, null);
    assert.equal(o.emitted('desk_phone_hung_up:')[0].data.reason, 'player');
});

test('a speaker turned KO or script-suspended ends the call with reason unavailable', () => {
    const o = office();
    o.ring();
    o.until(() => o.spoken.length === 1);
    o.w.world.npcStatus = id => (id === 'tom' ? { ko: true } : {});
    o.ticks(1);
    assert.deepEqual(o.emitted('desk_phone_hung_up:').map(e => e.data.reason), ['unavailable']);
    assert.equal(o.st('tom').call, null);
    const p = office();
    p.ring();
    p.until(() => p.spoken.length === 1);
    p.sys.control('tom', 'suspend');
    p.ticks(1);
    assert.deepEqual(p.emitted('desk_phone_hung_up:').map(e => e.data.reason), ['unavailable']);
});

test('no selection during a call: an urgent need waits and starts on the first select after it', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 60, urgentAt: 50, initial: 60 } } } });
    o.ring();
    o.until(() => !!o.st('tom').call);
    o.until(() => o.st('tom').levels.thirst < 50, 200);
    o.ticks(4);
    assert.ok(o.st('tom').call, 'still on the call');
    assert.equal(o.st('tom').job, null);
    assert.equal(o.emitted('npc_left_post:tom').length, 0);
    o.until(() => !o.st('tom').call);
    o.ticks(1);
    assert.equal(o.st('tom').job?.targetId, 'kettle');
});

test('the call is chosen at the claim; a story still loading falls to the phone_message pool for that call', () => {
    const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } }, arrive: false,
        lines: { amara: { call_take_message: 'pending' } }, chatter: { phone_message: ['Can I take a message?'] } });
    o.ticks(1);
    o.ring();
    o.until(() => !!o.st('amara').job);
    const job = o.st('amara').job;
    assert.equal(job.call.knot, null);
    assert.deepEqual(job.call.items.map(i => i.text), ['Can I take a message?']);
    assert.ok(job.callMs > 0 && job.callMs <= EXCHANGE_MAX_MS);
});

test('call speakers are in the speakers list for seated colleagues to look round at', () => {
    const o = office();
    o.ring();
    o.until(() => o.spoken.length === 1);
    assert.ok(o.sys.speakers.some(s => s.npcId === 'tom' && s.until > o.sys.clockMs));
    o.until(() => !o.sys._talking('tom'));
    assert.ok(o.sys.speakers.some(s => s.npcId === 'tom'), 'in the listening gap too');
});

test('determinism: the same seed gives the same call log', () => {
    const run = () => {
        const o = office({ tom: { needs: { thirst: { decayPerMin: 0.1, urgentAt: 20, initial: 10 } } } });
        o.ticks(1);
        o.ring();
        o.ticks(200);
        return JSON.stringify(o.sys.getLog());
    };
    assert.equal(run(), run());
});

async function seatingPure() {
    globalThis.window = globalThis.window || {};
    const m = await import('../../public/break_escape/js/systems/seating.js');
    return { isTyping: m.isTyping, typingBob: m.typingBob };
}

test('chatter voice: preload loads the story of an NPC with phoneCalls', async () => {
    const { NpcChatterVoice } = await import('../../public/break_escape/js/systems/npc-needs-chatter.js');
    const loads = [];
    const v = new NpcChatterVoice({
        allNpcs: () => [{ id: 'tom', phoneCalls: [{ knot: 'call_supplier' }] }, { id: 'sam' }],
        storyJson: () => null, loadStory: async npc => { loads.push(npc.id); return {}; }
    });
    v.preload();
    assert.deepEqual(loads, ['tom']);
});

test('chatter voice: cancel stops the line in flight, skips that NPC\'s queued lines, and later speakers do not wait out the clip', async () => {
    const { NpcChatterVoice } = await import('../../public/break_escape/js/systems/npc-needs-chatter.js');
    const played = [], stopped = [];
    const v = new NpcChatterVoice({
        getNpc: id => ({ id, voice: {} }), muted: () => false, npcRoom: () => 'office', playerRoom: () => 'office', distance: () => 0,
        makeTts: id => ({ play: async (npcId, line) => { played.push([npcId, line, Date.now()]); return 5000; }, stop: () => stopped.push(id) })
    });
    const t0 = Date.now();
    v.say('tom', 'Yes, Tuesday is fine.');
    v.say('tom', 'No, the big boxes.');
    const last = v.say('amara', 'Is it Friday yet?');
    await new Promise(r => setTimeout(r, 30));
    v.cancel('tom');
    await Promise.race([last, new Promise(r => setTimeout(r, 4000))]);
    await new Promise(r => setTimeout(r, 30));
    v.cancel('amara');
    await last;
    assert.deepEqual(played.map(p => p.slice(0, 2)), [['tom', 'Yes, Tuesday is fine.'], ['amara', 'Is it Friday yet?']]);
    assert.ok(played[1][2] - t0 < 1000, 'amara did not wait out the cancelled clip');
    assert.deepEqual(stopped, ['tom', 'amara']);
    assert.ok(v.log.some(e => e.npcId === 'tom' && e.text === 'No, the big boxes.' && e.reason === 'cancelled'));
});

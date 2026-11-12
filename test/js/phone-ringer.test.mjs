// A2a: the ringer as a pure module (phone calls plan 2.2, 2.3). Tests are named by
// row number of the 2.3 state table so a reviewer can tick them off. A fake clock and a
// recording adapter stand in for the window; no real timers.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ringer.js'), 'utf8');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const R = await import(dataUrl(src));
const {
    createPhoneRinger, RING_TIMEOUT_MS, UNTIL_ANSWERED_NUDGE_MS, AUTO_ANSWER_MS,
    HIT_QUIET_MS, HOLD_MAX_MS, SCRIPTED_CALL_START_MS, TICK_MS, RERING_AFTER_LOAD_MS, CALL_GONE_AFTER_MS,
} = R;

// ---- fakes -------------------------------------------------------------------------

function fakeClock() {
    let t = 1000;
    let seq = 0;
    let timers = [];
    let deferred = [];
    const clock = {
        now: () => t,
        setTimeout(fn, ms) { const id = ++seq; timers.push({ id, at: t + ms, fn }); return id; },
        clearTimeout(id) { timers = timers.filter((x) => x.id !== id); },
        defer(fn) { deferred.push(fn); },
        flush() { const d = deferred; deferred = []; d.forEach((f) => f()); },
        advance(ms) {
            const end = t + ms;
            for (;;) {
                timers.sort((a, b) => a.at - b.at || a.id - b.id);
                const next = timers[0];
                if (!next || next.at > end) break;
                timers.shift();
                t = Math.max(t, next.at);
                next.fn();
                clock.flush();
            }
            t = end;
        },
        /** A jump of the clock with no timer firing in it: a hidden tab's throttled timers, sleep, a clock change. */
        jump(ms) { t += ms; },
        pending: () => timers.length,
    };
    return clock;
}

function setup(over = {}, patch = null) {
    const clock = fakeClock();
    const log = [];
    const w = {
        ringBlocked: false, openBlocked: false, conversationOpen: false, minigameOpen: false,
        knockedOut: false, paused: false, lastHitAt: null, outgoing: false,
        callOpen: false, openResult: true, scriptedQueued: false, popup: null, ringerCallId: null, names: { ceo: 'The CEO' },
        ...over,
    };
    const adapter = {
        ringBlocked: () => w.ringBlocked,
        openBlocked: (info) => w.openBlocked || (w.scriptedQueued && !(info && info.second)),
        conversationOpen: () => w.conversationOpen,
        minigameOpen: () => w.minigameOpen,
        knockedOut: () => w.knockedOut,
        isPaused: () => w.paused,
        lastHitAt: () => w.lastHitAt,
        outgoingActive: () => w.outgoing,
        callMinigameOpen: () => w.callOpen,
        openCallId: () => w.ringerCallId,
        openCall(offer, info) {
            log.push(['openCall', offer.npcId, offer.knot, info]);
            if (w.openResult) { w.callOpen = true; w.ringerCallId = info.ringerCall.id; }
            return w.openResult ? { started: true } : null;
        },
        putAside() { const p = w.popup; if (p) { log.push(['putAside', p]); w.popup = null; } return p; },
        reopen(d) { log.push(['reopen', d]); },
        showBanner(v) { log.push(['showBanner', v]); },
        hideBanner() { log.push(['hideBanner']); },
        showPill(v) { log.push(['showPill', v]); },
        hidePill() { log.push(['hidePill']); },
        ringtone(on) { log.push(['ringtone', on]); },
        vibrate() { log.push(['vibrate']); },
        toast(text) { log.push(['toast', text]); },
        displayName: (id) => w.names[id],
        emit(name, data) { log.push(['emit', name, data]); },
        setGlobal(m) { log.push(['setGlobal', m]); },
        persistTrigger(o) { log.push(['persistTrigger', o.npcId, o.knot]); },
        savePendingCall(id, rec) { log.push(['save', id, rec]); },
        onOutcome(kind, o, extra) { log.push(['outcome', kind, o.npcId, extra]); },
    };
    const ctx = { w, log, clock, ringer: null };
    if (patch) patch(adapter, ctx);
    const ringer = createPhoneRinger({ adapter, clock });
    ctx.ringer = ringer;
    const events = () => log.filter((e) => e[0] === 'emit').map((e) => e[1]);
    const count = (name) => log.filter((e) => e[0] === name).length;
    const last = (name) => [...log].reverse().find((e) => e[0] === name);
    return { clock, log, w, ringer, events, count, last };
}

const offer = (extra = {}) => ({ npcId: 'ceo', knot: 'call_a', ...extra });
/** Finish the call opening: the 500 ms start wait. */
const connect = (s) => s.clock.advance(SCRIPTED_CALL_START_MS);
/** The adapter's end hook: report the end of the last call opened, then let the deferred re-check run. */
const endCall = (s, info = {}, npcId = 'ceo') => {
    const r = s.ringer.callEnded(npcId, { id: s.last('openCall')[3].ringerCall.id, ...info });
    s.clock.flush();
    return r;
};

// ---- Offers arriving ----------------------------------------------------------------

test('row 1: an offer with nothing blocking rings, applies setGlobalOnStart; it never persists the trigger (the caller does)', () => {
    const s = setup();
    assert.equal(s.ringer.offer(offer({ setGlobalOnStart: { call_started: true } })), 'ringing');
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.deepEqual(s.last('setGlobal')[1], { call_started: true });
    assert.equal(s.count('persistTrigger'), 0, 'the trigger is persisted by npc-manager, not the ringer');
    assert.equal(s.last('showBanner')[1].npcId, 'ceo');
    assert.deepEqual(s.last('ringtone'), ['ringtone', true]);
});

test('row 1: setGlobalOnStart is applied once, at the first ring, not when requeued', () => {
    const s = setup();
    s.ringer.offer(offer({ setGlobalOnStart: { g: 1 } }));
    s.w.ringBlocked = true; s.ringer.tick();             // back to queued (row 23)
    s.w.ringBlocked = false; s.ringer.tick();            // rings again
    assert.equal(s.count('setGlobal'), 1);
});

test('row 2: an offer while ringBlocked() is queued at the tail, and the ringtone stays off', () => {
    const s = setup({ ringBlocked: true });
    assert.equal(s.ringer.offer(offer()), 'queued');
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.count('showBanner'), 0);
    assert.equal(s.count('setGlobal'), 0);
    assert.equal(s.count('persistTrigger'), 0);
});

test('row 3: a second offer with the same knot is dropped', () => {
    const s = setup();
    s.ringer.offer(offer());
    assert.equal(s.ringer.offer(offer()), 'dropped');
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.equal(s.ringer.queueLength(), 0);
    const w2 = setup({ ringBlocked: true });
    w2.ringer.offer(offer());
    assert.equal(w2.ringer.offer(offer()), 'dropped', 'also while queued');
    assert.equal(w2.ringer.queueLength(), 1);
});

test('row 4 (★): a different knot replaces a ringing call and restarts its ring, with no row and no event', () => {
    const s = setup();
    s.ringer.offer(offer({ knot: 'T1' }));
    s.clock.advance(8000);
    assert.equal(s.ringer.offer(offer({ knot: 'T5' })), 'replaced');
    assert.equal(s.ringer.current().knot, 'T5');
    assert.equal(s.ringer.current().ringMs, 0);
    assert.equal(s.ringer.queueLength(), 0);
    assert.deepEqual(s.events(), []);
    assert.equal(s.count('outcome'), 0);
    // the restarted ring times out 20 s after the replacement, not the original
    s.clock.advance(RING_TIMEOUT_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 4 (★): replacing a queued call keeps its place in the queue', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer({ npcId: 'a', knot: 'k1' });
    s.ringer.offer({ npcId: 'b', knot: 'k1' });
    s.ringer.offer({ npcId: 'a', knot: 'k2' });
    s.w.ringBlocked = false;
    s.ringer.tick();
    assert.equal(s.ringer.current().npcId, 'a');
    assert.equal(s.ringer.current().knot, 'k2');
    assert.equal(s.ringer.stateOf('b'), 'queued');
});

test('row 4 (★): replacing a held call keeps the hold, the hold time and answerSeconds', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ knot: 'T1' }));
    s.clock.advance(7000);
    s.ringer.answer('ceo');
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(30000);
    const heldFor = s.ringer.current().holdMs;
    assert.ok(heldFor >= 29000);
    assert.equal(s.ringer.offer(offer({ knot: 'T5', setGlobalOnStart: { t5: true } })), 'replaced');
    const cur = s.ringer.current();
    assert.equal(cur.state, 'held');
    assert.equal(cur.knot, 'T5');
    assert.equal(cur.answerSeconds, 7);
    assert.equal(cur.holdMs, heldFor);
    assert.deepEqual(s.events(), []);
    // no ring again: the ringtone never turns back on after the answer
    const tones = s.log.filter((e) => e[0] === 'ringtone').map((e) => e[1]);
    assert.equal(tones[tones.length - 1], false);
    // the hold time carries on towards HOLD_MAX_MS from where it was
    s.clock.advance(HOLD_MAX_MS - heldFor - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(2 * TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 5: an offer for a contact whose call is connected queues behind it and rings when it ends', () => {
    const s = setup();
    s.ringer.offer(offer({ knot: 'A' }));
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.ringer.offer(offer({ knot: 'B' })), 'queued');
    assert.equal(s.ringer.queueLength(), 1);
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.ringer.current().knot, 'B');
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
});

test('row 6 (★): another contact ringing, held or connected queues the offer, first in first out', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    assert.equal(s.ringer.offer({ npcId: 'b', knot: 'k' }), 'queued');
    assert.equal(s.ringer.offer({ npcId: 'c', knot: 'k' }), 'queued');
    s.ringer.decline('a');
    assert.equal(s.ringer.current().npcId, 'b', 'b before c');
    s.ringer.decline('b');
    assert.equal(s.ringer.current().npcId, 'c');
    // held and connected block too
    const h = setup({ minigameOpen: true, openBlocked: true });
    h.ringer.offer({ npcId: 'a', knot: 'k' }); h.ringer.answer('a');
    assert.equal(h.ringer.offer({ npcId: 'b', knot: 'k' }), 'queued');
    const k = setup();
    k.ringer.offer({ npcId: 'a', knot: 'k' }); k.ringer.answer('a'); connect(k);
    assert.equal(k.ringer.offer({ npcId: 'b', knot: 'k' }), 'queued');
});

test('row 8 (★): the head of the queue rings when ringBlocked() turns false, on a hook and on the tick', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer());
    s.w.ringBlocked = false;
    s.ringer.onMinigameEnded();
    assert.equal(s.ringer.stateOf('ceo'), 'queued', 'the hook defers its re-check');
    s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    const t = setup({ ringBlocked: true });
    t.ringer.offer(offer());
    t.w.ringBlocked = false;
    t.clock.advance(TICK_MS);
    assert.equal(t.ringer.stateOf('ceo'), 'ringing', 'the backstop tick finds it');
});

test('row 8: ringBlocked() also holds while an outgoing call is up, and once the ringer is closed', () => {
    const s = setup({ outgoing: true });
    s.ringer.offer(offer());
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.ringer.ringBlocked(), true);
    s.w.outgoing = false;
    s.ringer.tick();
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
});

// ---- Answering ----------------------------------------------------------------------

test('row 9 (★): answer with nothing open emits phone_call_answered, opens after 500 ms, second check passes', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(12000);
    assert.equal(s.ringer.answer('ceo'), true);
    assert.deepEqual(s.events(), ['phone_call_answered:ceo']);
    assert.equal(s.last('emit')[2].answerSeconds, 12);
    assert.equal(s.count('openCall'), 0, 'not yet: the start wait');
    assert.equal(s.ringer.callActive(), true, 'active inside the open delay');
    s.clock.advance(SCRIPTED_CALL_START_MS - 1);
    assert.equal(s.count('openCall'), 0);
    s.clock.advance(1);
    assert.equal(s.count('openCall'), 1);
    const info = s.last('openCall')[3];
    assert.equal(info.answerSeconds, 12);
    assert.equal(info.ringerCall.direction, 'incoming');
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.deepEqual(s.last('hideBanner'), ['hideBanner']);
});

test('row 9: answer only works on a ringing offer', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer());
    assert.equal(s.ringer.answer('ceo'), false, 'queued');
    assert.equal(s.ringer.answer('nobody'), false);
});

test('row 11 (★): a workstation popup is put aside when the call opens and reopened when it ends', () => {
    const s = setup({ popup: { kind: 'lab', src: 'http://x/sheet' } });
    s.ringer.offer(offer());
    s.ringer.answer('ceo');
    assert.equal(s.count('putAside'), 0, 'the popup stays up through the 500 ms delay');
    connect(s);
    assert.equal(s.count('putAside'), 1);
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.deepEqual(s.last('reopen')[1], { kind: 'lab', src: 'http://x/sheet' });
});

test('row 12 (★): answer over a non-conversation minigame holds the call, shows the pill, stops the ringtone', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer());
    s.clock.advance(5000);
    s.ringer.answer('ceo');
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.count('openCall'), 0);
    assert.deepEqual(s.events(), [], 'answered is emitted when the call opens');
    const pill = s.last('showPill')[1];
    assert.equal(pill.canHangUp, true);
    assert.deepEqual(s.last('hideBanner'), ['hideBanner']);
    assert.deepEqual(s.last('ringtone'), ['ringtone', false]);
    assert.equal(s.ringer.current().answerSeconds, 5);
    s.clock.advance(60000);
    assert.equal(s.ringer.stateOf('ceo'), 'held', 'no ring timeout on a held call');
    assert.equal(s.count('openCall'), 0);
});

test('row 12: a forced call over a minigame shows a pill with no Hang up', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.last('showPill')[1].canHangUp, false);
    assert.equal(s.ringer.hangUp('ceo'), false);
});

// ---- On hold ------------------------------------------------------------------------

function held(extra) {
    const s = setup({ minigameOpen: true, openBlocked: true, ...(extra || {}) });
    s.ringer.offer(offer());
    s.ringer.answer('ceo');
    return s;
}
const closeMinigame = (s) => { s.w.minigameOpen = false; s.w.openBlocked = false; s.ringer.onMinigameEnded(); s.clock.flush(); };

test('row 13 (★): the minigame closing opens the call after 500 ms, with the second openBlocked() check', () => {
    const s = held();
    closeMinigame(s);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.count('openCall'), 0);
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1);
    assert.deepEqual(s.events(), ['phone_call_answered:ceo']);
});

test('row 13 (★): if the second check fails the call goes back to held, never rings again, and is retried', () => {
    const s = held();
    closeMinigame(s);
    // a minigame opens inside the 500 ms wait
    s.w.minigameOpen = true; s.w.openBlocked = true;
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 0);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.ringer.callActive(), false);
    const tonesOn = s.log.filter((e) => e[0] === 'ringtone' && e[1] === true).length;
    assert.equal(tonesOn, 1, 'only the first ring ever played the tone');
    assert.equal(s.last('showPill') !== undefined, true);
    closeMinigame(s);
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1);
    assert.equal(s.events().filter((e) => e === 'phone_call_answered:ceo').length, 1, 'answered emitted once');
});

test('row 13: a popup closing is a hook too (onPopupClosed)', () => {
    const s = held();
    s.w.minigameOpen = false; s.w.openBlocked = false;
    s.ringer.onPopupClosed(); s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
});

test('row 14 (★): a different non-conversation minigame open when the hook runs keeps the call held, pill up, timer running', () => {
    const s = held();
    s.clock.advance(10000);
    const before = s.ringer.current().holdMs;
    // the closing minigame's onComplete opened another one: still blocked at the hook
    s.ringer.onMinigameEnded(); s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(5000);
    assert.ok(s.ringer.current().holdMs >= before + 4750, 'hold timer keeps running');
    closeMinigame(s);
    assert.equal(s.ringer.stateOf('ceo'), 'connected', 'row 13 runs when that one closes');
});

test('row 15 (★): a conversation opening hides the pill and pauses the hold timer; it never rings again', () => {
    const s = held();
    s.clock.advance(20000);
    // a legacy mapping opens a scripted scene: conversation open, the minigame gone
    s.w.conversationOpen = true; s.w.minigameOpen = false; s.w.openBlocked = true;
    s.ringer.onMinigameStarted(); s.clock.flush();
    assert.deepEqual(s.last('hidePill'), ['hidePill']);
    const used = s.ringer.current().holdMs;
    s.clock.advance(HOLD_MAX_MS * 2);
    assert.equal(s.ringer.stateOf('ceo'), 'held', 'no hold limit while a conversation is on screen');
    assert.equal(s.ringer.current().holdMs, used);
    assert.equal(s.count('showBanner'), 1, 'never rings again');
    // when it is over, row 13 opens the call
    s.w.conversationOpen = false; s.w.openBlocked = false;
    s.ringer.onMinigameEnded(); s.clock.flush();
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1);
});

test('row 15: the hold time used before the conversation counts towards HOLD_MAX_MS afterwards', () => {
    const s = held();
    s.clock.advance(HOLD_MAX_MS - 1000);
    s.w.conversationOpen = true; s.w.minigameOpen = false; s.w.openBlocked = true;
    s.ringer.onMinigameStarted(); s.clock.flush();
    s.clock.advance(60000);
    s.w.conversationOpen = false; s.w.minigameOpen = true; s.w.openBlocked = true;   // back over a puzzle
    s.ringer.onMinigameEnded(); s.clock.flush();
    s.clock.advance(1500);
    assert.equal(s.ringer.stateOf('ceo'), null, 'rang off after 1 s more');
});

test('row 16 (★): a hit keeps a held call held until HIT_QUIET_MS has passed, then row 13 runs', () => {
    const s = held();
    s.w.minigameOpen = false; s.w.openBlocked = false;
    s.w.lastHitAt = s.clock.now();
    s.ringer.onMinigameEnded(); s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(HIT_QUIET_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.count('openCall'), 0);
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1);
});

test('row 16: a hit inside the 500 ms wait fails the second check and the call waits again', () => {
    const s = held();
    closeMinigame(s);
    s.clock.advance(200);
    s.w.lastHitAt = s.clock.now();
    s.clock.advance(SCRIPTED_CALL_START_MS - 200);
    assert.equal(s.count('openCall'), 0);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
});

test('row 17: Hang up from hold acts as Decline; a forced call has no Hang up', () => {
    const s = held();
    assert.equal(s.ringer.hangUp('ceo'), true);
    assert.deepEqual(s.events(), ['phone_call_declined:ceo']);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.deepEqual(s.last('hidePill'), ['hidePill']);
});

test('row 18 (★): the hold limit rings off a non-forced call: missed event and toast', () => {
    const s = held();
    s.clock.advance(HOLD_MAX_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.deepEqual(s.events(), ['phone_call_missed:ceo']);
    assert.equal(s.last('toast')[1], 'The CEO rang off. Call back from the thread.');
    assert.equal(s.last('outcome')[1], 'rang_off');
});

test('row 18: a withheld caller rang off, with no name', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ withheld: true })); s.ringer.answer('ceo');
    s.clock.advance(HOLD_MAX_MS);
    assert.equal(s.last('toast')[1], 'The caller rang off.');
});

test('row 18: a forced call has no hold limit; paused time does not count', () => {
    const f = setup({ minigameOpen: true, openBlocked: true });
    f.ringer.offer(offer({ disableClose: true }));
    f.clock.advance(AUTO_ANSWER_MS);
    f.clock.advance(HOLD_MAX_MS * 3);
    assert.equal(f.ringer.stateOf('ceo'), 'held');
    const p = held();
    p.w.paused = true;
    p.clock.advance(HOLD_MAX_MS * 2);
    assert.equal(p.ringer.stateOf('ceo'), 'held');
    p.w.paused = false;
    p.clock.advance(HOLD_MAX_MS - TICK_MS);
    assert.equal(p.ringer.stateOf('ceo'), 'held');
});

test('row 18: with onMissed voicemail the rang-off toast is not shown (the voicemail toast comes in A6)', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ onMissed: 'voicemail', voicemailKnot: 'vm' })); s.ringer.answer('ceo');
    s.clock.advance(HOLD_MAX_MS);
    assert.equal(s.count('toast'), 0);
    assert.deepEqual(s.events(), ['phone_call_missed:ceo']);
});

// ---- Opening and missing ------------------------------------------------------------

test('row 19 (★): startMinigame returning null puts the call back to held, never connected with nothing on screen', () => {
    const s = setup({ openResult: false });
    s.ringer.offer(offer());
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.count('openCall'), 1);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.ringer.callActive(), false);
    assert.equal(s.ringer.callVariablesFor('ceo', 'phone-chat').call_answer_seconds, 0);
    // not hammered: the tick waits before it tries again; a hook retries at once
    s.clock.advance(1000);
    assert.equal(s.count('openCall'), 1);
    s.w.openResult = true;
    s.ringer.onMinigameEnded(); s.clock.flush();
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 2);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.count('showBanner'), 1, 'it never rang again');
});

test('row 19: the second openBlocked() check failing at the open delay sends it back to held', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.answer('ceo');
    s.w.openBlocked = true;                // a scripted scene queued inside the 500 ms
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 0);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
});

test('row 20 (★): Decline emits phone_call_declined and clears the offer', () => {
    const s = setup();
    s.ringer.offer(offer());
    assert.equal(s.ringer.decline('ceo'), true);
    assert.deepEqual(s.events(), ['phone_call_declined:ceo']);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.deepEqual(s.last('save'), ['save', 'ceo', null]);
    assert.deepEqual(s.last('hideBanner'), ['hideBanner']);
    assert.deepEqual(s.last('ringtone'), ['ringtone', false]);
    assert.equal(s.last('outcome')[1], 'declined');
    assert.equal(s.count('toast'), 0);
});

test('row 20: a forced call cannot be declined', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    assert.equal(s.ringer.decline('ceo'), false);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
});

test('row 21 (★): a ring that goes unanswered for RING_TIMEOUT_MS is missed', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(RING_TIMEOUT_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.deepEqual(s.events(), ['phone_call_missed:ceo']);
    assert.equal(s.count('toast'), 0);
    assert.equal(s.last('outcome')[1], 'missed');
});

test('row 21 (★): paused time and queued time do not count towards the ring timeout', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(15000);
    s.w.ringBlocked = true; s.ringer.tick();         // requeued
    s.clock.advance(60000);
    s.w.ringBlocked = false; s.ringer.tick();
    s.w.paused = true;
    s.clock.advance(60000);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.w.paused = false;
    s.clock.advance(5000 - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 21 (★): untilAnswered never times out; after 20 s the tone stops looping and it vibrates every 10 s', () => {
    const s = setup();
    s.ringer.offer(offer({ untilAnswered: true }));
    s.clock.advance(RING_TIMEOUT_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.deepEqual(s.last('ringtone'), ['ringtone', false]);
    assert.equal(s.count('vibrate'), 1, 'the first buzz is when the loop stops (choice 4)');
    s.clock.advance(UNTIL_ANSWERED_NUDGE_MS);
    assert.equal(s.count('vibrate'), 2);
    s.clock.advance(UNTIL_ANSWERED_NUDGE_MS * 3);
    assert.equal(s.count('vibrate'), 5);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing', 'the banner stays up');
    assert.equal(s.ringer.decline('ceo'), true, 'Decline still works');
});

test('row 21: untilAnswered answered late records the wait; the hold limit still applies once answered', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ untilAnswered: true }));
    s.clock.advance(95000);
    s.ringer.answer('ceo');
    assert.equal(s.ringer.current().answerSeconds, 95);
    s.clock.advance(HOLD_MAX_MS);
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 22 (★): a forced call has no timeout and answers itself after AUTO_ANSWER_MS (answerSeconds 6)', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS - TICK_MS);
    assert.equal(s.count('emit'), 0);
    s.clock.advance(TICK_MS);
    assert.deepEqual(s.events(), ['phone_call_answered:ceo']);
    connect(s);
    assert.equal(s.last('openCall')[3].answerSeconds, 6);
    assert.equal(s.last('showBanner')[1].forced, true);
});

test('row 22 (★): a hit in the last HIT_QUIET_MS delays the auto-answer, and answerSeconds is still 6', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS - 1000);
    s.w.lastHitAt = s.clock.now();
    s.clock.advance(HIT_QUIET_MS - TICK_MS);
    assert.equal(s.count('emit'), 0);
    s.clock.advance(TICK_MS + TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    connect(s);
    assert.equal(s.last('openCall')[3].answerSeconds, 6);
});

test('row 22: auto-answer over a non-conversation minigame is row 12 (held)', () => {
    const s = setup({ minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
});

test('row 23 (★): a conversation opening sends a ringing call back to the head of the queue, timers kept', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    s.clock.advance(9000);
    s.w.ringBlocked = true; s.w.conversationOpen = true;
    s.ringer.onMinigameStarted(); s.clock.flush();
    assert.equal(s.ringer.stateOf('a'), 'queued');
    assert.deepEqual(s.last('hideBanner'), ['hideBanner']);
    s.clock.advance(60000);
    assert.equal(s.ringer.stateOf('a'), 'queued', 'queued calls do not time out');
    s.w.ringBlocked = false; s.w.conversationOpen = false;
    s.ringer.onMinigameEnded(); s.clock.flush();
    assert.equal(s.ringer.current().npcId, 'a', 'a, not b: it went back to the head');
    assert.equal(s.ringer.current().ringMs, 9000);
    s.clock.advance(11000 - TICK_MS);
    assert.equal(s.ringer.stateOf('a'), 'ringing');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('a'), null, 'missed after the remaining 11 s');
});

test('row 24: knocked out sends a ringing call to the queue head; a held call stays held with the pill hidden and the hold paused', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.w.ringBlocked = true; s.w.knockedOut = true; s.ringer.tick();
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    const h = held();
    h.clock.advance(10000);
    h.w.knockedOut = true; h.ringer.tick();
    assert.equal(h.ringer.stateOf('ceo'), 'held');
    assert.deepEqual(h.last('hidePill'), ['hidePill']);
    const used = h.ringer.current().holdMs;
    h.clock.advance(HOLD_MAX_MS);
    assert.equal(h.ringer.current().holdMs, used);
    h.w.knockedOut = false; h.ringer.tick();
    assert.equal(h.last('showPill') !== undefined, true);
});

// ---- Calls in progress and their end ------------------------------------------------

function connectedCall(extra) {
    const s = setup(extra);
    s.ringer.offer(offer(extra && extra.offer));
    s.ringer.answer('ceo'); connect(s);
    return s;
}

test('row 25 (★): every own-path end (End, back arrow, #exit_conversation, story end) clears the offer, the saved call and the vars', () => {
    for (const info of [{ endedByCall: true }, { callFinished: true }]) {
        const s = connectedCall();
        assert.equal(s.ringer.callVariablesFor('ceo', 'phone-chat').call_answer_seconds, 0);
        s.w.callOpen = false;
        assert.equal(endCall(s, info), true);
        assert.equal(s.ringer.stateOf('ceo'), null);
        assert.deepEqual(s.last('save'), ['save', 'ceo', null]);
        assert.equal(s.last('outcome')[1], 'ended');
        assert.equal(s.ringer.callActive(), false);
        assert.equal(s.count('reopen'), 0, 'nothing was displaced');
        assert.equal(s.events().filter((e) => e.startsWith('phone_call_missed')).length, 0);
    }
});

test('row 25 (★): the reopen happens only when openBlocked() is false; a queued scripted beat drops it', () => {
    const a = setup({ popup: { kind: 'laptop' } });
    a.ringer.offer(offer()); a.ringer.answer('ceo'); connect(a);
    a.w.callOpen = false;
    endCall(a, { endedByCall: true });
    assert.equal(a.count('reopen'), 1);
    const b = setup({ popup: { kind: 'laptop' } });
    b.ringer.offer(offer()); b.ringer.answer('ceo'); connect(b);
    b.w.callOpen = false;
    b.w.openBlocked = true;              // a scripted debrief is queued and opens next
    endCall(b, { endedByCall: true });
    assert.equal(b.count('reopen'), 0);
    const c = setup({ popup: { kind: 'laptop' } });
    c.ringer.offer(offer()); c.ringer.answer('ceo'); connect(c);
    c.w.callOpen = false;
    c.w.lastHitAt = c.clock.now();
    endCall(c, { endedByCall: true });
    assert.equal(c.count('reopen'), 0, 'not in the middle of a fight');
});

test('row 25: the next queued call rings after the end', () => {
    const s = connectedCall();
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    assert.equal(s.ringer.stateOf('b'), 'queued');
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.ringer.stateOf('b'), 'ringing');
});

test('row 26 (★): forced call, hit, rings again after the quiet time with the saved answerSeconds', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true, resume: true }));
    s.clock.advance(AUTO_ANSWER_MS);
    connect(s);
    assert.equal(s.count('openCall'), 1);
    s.w.callOpen = false;
    s.w.lastHitAt = s.clock.now();
    endCall(s, {});                    // closed by the hit, story not finished
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.last('save')[2].state, 'connected', 'pendingCall kept as connected');
    assert.equal(s.events().filter((e) => e.startsWith('phone_call_missed')).length, 0);
    s.clock.advance(HIT_QUIET_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 2);
    const info = s.last('openCall')[3];
    assert.equal(info.resume, true);
    assert.equal(info.answerSeconds, 6);
    assert.equal(s.count('setGlobal'), 0);
    assert.equal(s.events().filter((e) => e === 'phone_call_answered:ceo').length, 1);
});

test('row 26: a forced call whose story had ended is a normal end (row 25), not a re-ring', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.w.callOpen = false;
    endCall(s, { callFinished: true });
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 28: the ending closes the ringer: queued, ringing and held offers go with no rows and no events; new offers are refused', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    s.ringer.close();
    assert.equal(s.ringer.stateOf('a'), null);
    assert.equal(s.ringer.stateOf('b'), null);
    assert.deepEqual(s.events(), []);
    assert.equal(s.count('outcome'), 0);
    assert.equal(s.ringer.offer({ npcId: 'c', knot: 'k' }), 'refused');
    assert.equal(s.ringer.openBlocked(), true);
    assert.equal(s.ringer.ringBlocked(), true);
    const h = held();
    h.ringer.close();
    assert.equal(h.ringer.stateOf('ceo'), null);
    assert.deepEqual(h.events(), []);
});

test('row 28: a call already connected finishes normally', () => {
    const s = connectedCall();
    s.ringer.close();
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.ringer.callActive(), true);
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.ringer.stateOf('ceo'), null);
});

test('row 29: while paused the ring timer and the auto-answer stop, the ringtone is silent and the banner stays', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(10000);
    s.w.paused = true;
    s.clock.advance(TICK_MS);
    assert.deepEqual(s.last('ringtone'), ['ringtone', false]);
    s.clock.advance(RING_TIMEOUT_MS * 2);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.equal(s.count('hideBanner'), 0);
    s.w.paused = false;
    s.clock.advance(TICK_MS);
    assert.deepEqual(s.last('ringtone'), ['ringtone', true]);
    const f = setup({ paused: true });
    f.ringer.offer(offer({ disableClose: true }));
    f.clock.advance(AUTO_ANSWER_MS * 3);
    assert.equal(f.count('emit'), 0, 'a forced call does not auto-answer while paused');
});

test('row 30: hasOpeningOffer is true while an opening offer is queued, ringing or held, and false after', () => {
    const q = setup({ ringBlocked: true });
    assert.equal(q.ringer.hasOpeningOffer(), false);
    q.ringer.offer(offer({ opening: true }));
    assert.equal(q.ringer.hasOpeningOffer(), true, 'queued');
    const r = setup();
    r.ringer.offer(offer({ opening: true }));
    assert.equal(r.ringer.hasOpeningOffer(), true, 'ringing');
    r.ringer.decline('ceo');
    assert.equal(r.ringer.hasOpeningOffer(), false);
    const h = setup({ minigameOpen: true, openBlocked: true });
    h.ringer.offer(offer({ opening: true })); h.ringer.answer('ceo');
    assert.equal(h.ringer.hasOpeningOffer(), true, 'held');
    const n = setup();
    n.ringer.offer(offer({ opening: false }));
    assert.equal(n.ringer.hasOpeningOffer(), false);
    const c = connectedCall({});
    assert.equal(c.ringer.hasOpeningOffer(), false);
});

test('row 32 (★): a call closed by something else is missed with no toast and no reopen', () => {
    const s = connectedCall({ popup: { kind: 'laptop' } });
    s.w.callOpen = false;
    endCall(s, {});                    // another minigame's startMinigame ended it
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.deepEqual(s.events().filter((e) => e.startsWith('phone_call_')), ['phone_call_answered:ceo', 'phone_call_missed:ceo']);
    assert.equal(s.count('toast'), 0);
    assert.equal(s.count('reopen'), 0);
    assert.equal(s.last('outcome')[1], 'dropped');
});

test('row 32: the knockout close of a forced call is row 26', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.w.callOpen = false;
    s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
});

// ---- callActive, the connecting record and the VARs (2.2, 2.11) -----------------------

test('callActive: true inside the open delay, then read live from the framework; false once the minigame ended', () => {
    const s = setup();
    s.ringer.offer(offer());
    assert.equal(s.ringer.callActive(), false, 'ringing is not a call');
    s.ringer.answer('ceo');
    assert.equal(s.ringer.callActive(), true, 'inside the delay');
    connect(s);
    assert.equal(s.ringer.callActive(), true);
    s.w.callOpen = false;                             // endMinigame nulled currentMinigame; callEnded not yet seen
    assert.equal(s.ringer.callActive(), false);
});

test('callActive: an outgoing call counts', () => {
    const s = setup({ outgoing: true });
    assert.equal(s.ringer.callActive(), true);
});

test('2.11: callVariablesFor gives answerSeconds on the call minigame, the defaults on every other channel or contact, and clears at the end', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(12500);
    s.ringer.answer('ceo'); connect(s);
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-chat'), { call_answer_seconds: 12, call_is_callback: false });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'person-chat'), { call_answer_seconds: 0, call_is_callback: false });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-preload'), { call_answer_seconds: 0, call_is_callback: false });
    assert.deepEqual(s.ringer.callVariablesFor('other', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false });
    s.w.ringerCallId = 'someone-elses';               // the contact list's preview, not the call
    assert.equal(s.ringer.callVariablesFor('ceo', 'phone-chat').call_answer_seconds, 0);
    s.w.ringerCallId = s.last('openCall')[3].ringerCall.id;
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.ringer.callVariablesFor('ceo', 'phone-chat').call_answer_seconds, 0);
});

test('2.11: answerSeconds counts only unpaused ringing: not queued time, paused time or hold time', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer());
    s.clock.advance(5000);                            // queued: not counted
    s.w.ringBlocked = false; s.ringer.tick();
    s.clock.advance(2000);                            // ringing
    s.w.paused = true; s.clock.advance(7000); s.w.paused = false;
    s.clock.advance(1000);                            // ringing, 3 s so far
    s.w.minigameOpen = true; s.w.openBlocked = true;
    s.ringer.answer('ceo');
    s.clock.advance(40000);                           // hold time: not counted
    s.w.minigameOpen = false; s.w.openBlocked = false;
    s.ringer.onMinigameEnded(); s.clock.flush();
    s.clock.advance(SCRIPTED_CALL_START_MS);
    assert.equal(s.last('openCall')[3].answerSeconds, 3);
});

test('2.11: answerSeconds rounds down', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(4999);
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.last('openCall')[3].answerSeconds, 4);
});

// ---- Hooks, guards and malformed input -----------------------------------------------

test('hooks re-check after the swap: with a deferring clock the state changes only on the flush', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer());
    s.w.ringBlocked = false;
    s.ringer.onMinigameEnded();
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
});

test('malformed offers are refused without throwing', () => {
    const s = setup();
    for (const bad of [null, undefined, {}, { npcId: 'a' }, { knot: 'k' }, { npcId: 3, knot: 'k' }, 'x']) {
        assert.equal(s.ringer.offer(bad), 'refused');
    }
    assert.equal(s.count('persistTrigger'), 0);
});

test('an adapter with no methods at all does not throw', () => {
    const clock = fakeClock();
    const r = createPhoneRinger({ adapter: {}, clock });
    assert.equal(r.offer({ npcId: 'a', knot: 'k' }), 'ringing');
    r.answer('a');
    clock.advance(SCRIPTED_CALL_START_MS);
    assert.ok(['held', 'connected'].includes(r.stateOf('a')));
    r.close(); r.tick();
});

test('no timers are left running when idle', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    s.clock.advance(TICK_MS * 2);
    assert.equal(s.clock.pending(), 0);
});

// ---- Review round 1 (REVIEW_A2a_R1) --------------------------------------------------

/** Silence the logged adapter errors for a test that throws on purpose. */
function quietly(fn) {
    const orig = console.error;
    const seen = [];
    console.error = (...args) => seen.push(args);
    try { return fn(seen); } finally { console.error = orig; }
}
const saves = (s, id = 'ceo') => s.log.filter((e) => e[0] === 'save' && e[1] === id).map((e) => e[2]);

test('M1: an openCall that throws is a refusal (row 19): back to held, not connected for ever', () => quietly((seen) => {
    const s = setup({}, (ad, ctx) => { ad.openCall = () => { throw new Error('init failed'); }; });
    s.ringer.offer(offer());
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.ringer.callActive(), false, 'a scripted beat is not made to wait behind nothing');
    assert.equal(s.ringer.current().opened, false);
    assert.equal(seen.length, 1);
}));

test('M1: a throwing showBanner or emit does not stop the tick or the state machine', () => quietly(() => {
    const s = setup({}, (ad) => {
        ad.showBanner = () => { throw new Error('dom'); };
        ad.emit = () => { throw new Error('bus'); };
    });
    s.ringer.offer(offer());
    s.clock.advance(RING_TIMEOUT_MS);
    assert.equal(s.ringer.stateOf('ceo'), null, 'the ring still times out');
    assert.equal(s.clock.pending(), 0);
    assert.equal(s.count('outcome'), 1);
}));

test('M2: the second check ignores a scripted beat queued during the open delay; the call still opens', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.answer('ceo');
    s.w.scriptedQueued = true;                   // a mapping on phone_call_answered queued a beat
    connect(s);
    assert.equal(s.count('openCall'), 1);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.ringer.openBlocked(), true, 'the public check still yields to the queue');
});

test('M3: a refusal that never clears is given up on: missed, dropped, and the next call rings', () => quietly(() => {
    const s = setup({ openResult: false });
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    s.ringer.answer('a');
    s.clock.advance(12000);
    assert.equal(s.ringer.stateOf('a'), null);
    assert.ok(s.events().includes('phone_call_missed:a'));
    assert.ok(s.log.some((e) => e[0] === 'outcome' && e[1] === 'dropped' && e[2] === 'a'));
    assert.equal(saves(s, 'a').pop(), null);
    assert.equal(s.ringer.stateOf('b'), 'ringing');
    assert.equal(s.count('openCall') >= 5, true);
    assert.ok(s.count('openCall') < 12, 'retries are paced');
}));

test('M3: a forced call is given up on the same way', () => {
    const s = setup({ openResult: false });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS + 60000);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.ok(s.events().includes('phone_call_missed:ceo'));
});

test('M4: a 60 s jump of the clock (hidden tab, sleep) is not ringing time', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.advance(5000);
    s.clock.jump(60000);
    s.ringer.tick();
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.ok(s.ringer.current().ringMs < 7000);
    s.clock.advance(RING_TIMEOUT_MS - 5000 - TICK_MS * 2);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing', 'the ring still has its real time left');
});

test('M4: a 60 s jump is not hold time or answerSeconds either', () => {
    const s = held();
    s.clock.advance(1000);
    s.clock.jump(120000);
    s.ringer.tick();
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.ok(s.ringer.current().holdMs < HOLD_MAX_MS / 2);
    const r = setup();
    r.ringer.offer(offer());
    r.clock.advance(1000);
    r.clock.jump(60000);
    r.ringer.answer('ceo'); connect(r);
    assert.ok(r.last('openCall')[3].answerSeconds <= 1);
});

test('M5: callEnded does its bookkeeping at once but re-checks (next call, reopen) after the swap', () => {
    const s = setup({ popup: { kind: 'lab' } });
    s.ringer.offer({ npcId: 'ceo', knot: 'A' });
    s.ringer.offer({ npcId: 'b', knot: 'B' });
    s.ringer.answer('ceo'); connect(s);
    s.w.callOpen = false;
    const id = s.last('openCall')[3].ringerCall.id;
    assert.equal(s.ringer.callEnded('ceo', { id, endedByCall: true }), true);
    assert.equal(s.ringer.callActive(), false, 'bookkeeping is immediate');
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.ringer.stateOf('b'), 'queued', 'the next call does not ring mid-swap');
    assert.equal(s.count('reopen'), 0);
    assert.equal(s.count('showBanner'), 1, 'only the first banner so far');
    s.clock.flush();
    assert.equal(s.ringer.stateOf('b'), 'ringing');
    assert.equal(s.count('reopen'), 1);
});

test('M5: if the swap ends up opening a minigame, the deferred check sees it and the reopen is dropped', () => {
    const s = setup({ popup: { kind: 'lab' } });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    s.w.callOpen = false;
    const id = s.last('openCall')[3].ringerCall.id;
    s.ringer.callEnded('ceo', { id, endedByCall: true });
    s.w.openBlocked = true; s.w.minigameOpen = true;      // the new minigame is installed
    s.clock.flush();
    assert.equal(s.count('reopen'), 0);
});

test('M6: an end report for another call, an unknown id, none, or from inside the open delay is ignored', () => {
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    assert.equal(s.ringer.callEnded('ceo', { id: 'call-1', endedByCall: true }), false, 'in the open delay');
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    connect(s);
    assert.equal(s.ringer.callEnded('ceo', { id: 'call-99', endedByCall: true }), false);
    assert.equal(s.ringer.callEnded('ceo', { endedByCall: true }), false);
    assert.equal(s.ringer.callEnded('ceo'), false);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(endCall(s, { endedByCall: true }), true);
    assert.equal(endCall(s, { endedByCall: true }), false, 'a duplicate report');
});

test('M6: a stale end report after a row 19 back-to-held does not close the held call', () => {
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.w.openBlocked = true;                                // the second check fails
    connect(s);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.ringer.callEnded('ceo', { id: 'call-1', endedByCall: true }), false);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
});

test('M7: a second offer for the contact does not overwrite the saved slot of its connected call', () => {
    const s = connectedCall();
    s.ringer.offer(offer({ knot: 'call_b' }));
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.ringer.queueLength(), 1);
    const rec = saves(s).pop();
    assert.equal(rec.knot, 'call_a');
    assert.equal(rec.state, 'connected');
});

test('M7: when the connected call ends, the slot holds the queued one, which then rings', () => {
    const s = connectedCall();
    s.ringer.offer(offer({ knot: 'call_b' }));
    s.w.callOpen = false;
    s.ringer.callEnded('ceo', { id: s.last('openCall')[3].ringerCall.id, endedByCall: true });
    const rec = saves(s).pop();
    assert.equal(rec.knot, 'call_b');
    assert.equal(rec.state, 'queued');
    s.clock.flush();
    assert.equal(s.ringer.current().knot, 'call_b');
    assert.equal(saves(s).pop().state, 'ringing');
    s.ringer.decline('ceo');
    assert.equal(saves(s).pop(), null);
});

test('M7: a forced call waiting to re-ring keeps the slot against a queued offer for the same contact', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.ringer.offer(offer({ knot: 'call_b' }));
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    const rec = saves(s).pop();
    assert.equal(rec.knot, 'call_a');
    assert.equal(rec.state, 'connected');
});

test('M7: close() leaves the connected call its slot and clears the queued one', () => {
    const s = connectedCall();
    s.ringer.offer(offer({ knot: 'call_b' }));
    s.ringer.close();
    const rec = saves(s).pop();
    assert.equal(rec.knot, 'call_a');
    assert.equal(rec.state, 'connected');
});

test('restore (A4): re-rings after RERING_AFTER_LOAD_MS with resume and the saved answerSeconds, without setGlobal, a second answered event or a trigger', () => {
    const s = setup();
    const rec = { knot: 'call_a', state: 'connected', disableClose: true, resume: true, answerSeconds: 4,
        onMissed: 'callback', setGlobalOnStart: { never: true } };
    assert.equal(s.ringer.restore('ceo', rec), 'queued');
    s.clock.advance(RERING_AFTER_LOAD_MS - TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS);
    const info = s.last('openCall')[3];
    assert.equal(info.resume, true);
    assert.equal(info.answerSeconds, 4);
    assert.equal(s.count('setGlobal'), 0);
    assert.equal(s.events().filter((e) => e.startsWith('phone_call_answered')).length, 0);
    assert.equal(s.count('persistTrigger'), 0);
    assert.equal(s.ringer.restore('x', {}), 'refused');
});

test('choice 2 (m1): once the ringer is closed a finished call does not reopen the popup', () => {
    const s = setup({ popup: { kind: 'lab' } });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    assert.equal(s.count('putAside'), 1);
    s.ringer.close();
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.count('reopen'), 0);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(saves(s).pop(), null);
});

test('choice 3 (row 28): a call in its 500 ms open delay when the ending starts still opens, and finishes normally', () => {
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.ringer.close();
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.ringer.callActive(), true);
    connect(s);
    assert.equal(s.count('openCall'), 1, 'connected includes opening (plan 2.2)');
    assert.equal(s.ringer.callActive(), true);
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.ringer.callActive(), false);
});

test('choice 3: a held call is dropped by close(), with no event; an opening call that cannot open is dropped silently', () => {
    const h = held();
    h.ringer.close();
    assert.equal(h.ringer.stateOf('ceo'), null);
    assert.deepEqual(h.events().filter((e) => e.startsWith('phone_call_missed')), []);
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.ringer.close();
    s.w.knockedOut = true; s.w.openBlocked = true;                // the second check fails after the ending began
    connect(s);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.count('openCall'), 0);
    assert.deepEqual(s.events().filter((e) => e.startsWith('phone_call_missed')), []);
    assert.equal(saves(s).pop(), null);
});

test('m2: a forced call closed by a hit after close() is finished and its save cleared, not requeued for ever', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.ringer.close();
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.ringer.queueLength(), 0);
    assert.equal(saves(s).pop(), null);
    s.clock.advance(HIT_QUIET_MS * 2);
    assert.equal(s.count('openCall'), 1);
    assert.equal(s.clock.pending(), 0);
});

test('m3: a phone_call_answered handler that ends the mission leaves a consistent state (re-entrant emit)', () => {
    const s = setup({}, (ad, ctx) => {
        ad.emit = (name, data) => { ctx.log.push(['emit', name, data]); if (name.startsWith('phone_call_answered')) ctx.ringer.close(); };
    });
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    assert.equal(s.ringer.isClosed(), true);
    connect(s);
    assert.equal(s.count('openCall'), 1);
    assert.equal(saves(s).pop().state, 'connected', 'the slot matches the call that is on the line');
    s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    assert.equal(saves(s).pop(), null);
    s.clock.advance(TICK_MS);
    assert.equal(s.clock.pending(), 0);
});

test('re-entrant adapter: emit calling offer from missed and declined events, and showBanner calling decline', () => {
    const s = setup({}, (ad, ctx) => {
        ad.emit = (name, data) => {
            ctx.log.push(['emit', name, data]);
            if (name === 'phone_call_missed:a') ctx.ringer.offer({ npcId: 'c', knot: 'k' });
            if (name === 'phone_call_declined:b') ctx.ringer.offer({ npcId: 'd', knot: 'k' });
        };
    });
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    s.clock.advance(RING_TIMEOUT_MS);
    assert.equal(s.ringer.stateOf('b'), 'ringing');
    assert.equal(s.ringer.stateOf('c'), 'queued');
    s.ringer.decline('b');
    assert.equal(s.ringer.stateOf('c'), 'ringing');
    assert.equal(s.ringer.stateOf('d'), 'queued');
    const t = setup({}, (ad, ctx) => {
        ad.showBanner = (v) => { ctx.log.push(['showBanner', v]); ctx.ringer.decline(v.npcId); };
    });
    t.ringer.offer(offer());
    assert.equal(t.ringer.stateOf('ceo'), null);
    assert.equal(t.count('showBanner'), 1);
    assert.equal(t.count('hideBanner'), 1, 'the nested render saw the banner already recorded and hid it');
});

test('re-entrant adapter: openCall ending the call, or offering another call, synchronously', () => {
    const s = setup({}, (ad, ctx) => {
        const base = ad.openCall;
        ad.openCall = (o, info) => {
            const r = base(o, info);
            ctx.ringer.offer({ npcId: 'b', knot: 'k' });
            ctx.w.callOpen = false;
            ctx.ringer.callEnded(o.npcId, { id: info.ringerCall.id, endedByCall: true });
            return r;
        };
    });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    s.clock.flush();
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.ringer.stateOf('b'), 'ringing');
    assert.equal(s.ringer.callActive(), false);
    assert.equal(saves(s).pop(), null);
});

test('re-entrant adapter: a forced call dropped by a hit from inside openCall is requeued, not marked opened', () => {
    const s = setup({}, (ad, ctx) => {
        const base = ad.openCall;
        ad.openCall = (o, info) => {
            const r = base(o, info);
            ctx.w.callOpen = false; ctx.w.lastHitAt = ctx.clock.now();
            ctx.ringer.callEnded(o.npcId, { id: info.ringerCall.id });
            return r;
        };
    });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.ringer.queueLength(), 1);
    assert.equal(s.ringer.callActive(), false);
});

test('m4: ringing time on a replaced knot still counts towards call_answer_seconds, the new ring keeps its own timeout', () => {
    const s = setup();
    s.ringer.offer(offer({ knot: 'T5' }));
    s.clock.advance(15000);
    s.ringer.offer(offer({ knot: 'T1' }));
    s.clock.advance(5000);
    assert.equal(s.ringer.current().ringMs, 5000);
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.last('openCall')[3].answerSeconds, 20);
});

test('m5: a popup stays up while the call is only answered, and comes back when the call is given up on', () => quietly(() => {
    const s = setup({ popup: { kind: 'lab' }, openResult: false });
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    assert.equal(s.count('putAside'), 0);
    s.clock.advance(60000);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.equal(s.count('reopen'), 1, 'what the refused opens displaced comes back');
}));

test('m5: a held call that is hung up never touched the popup', () => {
    const s = setup({ popup: { kind: 'lab' }, minigameOpen: true, openBlocked: true });
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.ringer.hangUp('ceo');
    assert.equal(s.count('putAside'), 0);
    assert.equal(s.count('reopen'), 0);
});

test('m8: the pause menu opening during the 500 ms delay holds the open until it closes', () => {
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.w.paused = true;
    connect(s);
    assert.equal(s.count('openCall'), 0);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    s.clock.advance(5000);
    assert.equal(s.count('openCall'), 0);
    s.w.paused = false;
    s.clock.advance(TICK_MS * 2 + SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1);
});

test('m10: a forced call answered by hand at 3 s keeps answerSeconds 3 when it rings again (kills an overwrite on re-answer)', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(3000);
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.last('openCall')[3].answerSeconds, 3);
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    s.clock.advance(HIT_QUIET_MS + AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS + TICK_MS);
    assert.equal(s.count('openCall'), 2);
    assert.equal(s.last('openCall')[3].answerSeconds, 3);
});

// ---- Round 2 ------------------------------------------------------------------------

/** A forced call, auto-answered and open, then closed by a hit: it waits to ring again (row 26). */
function forcedHit(over = {}) {
    const s = setup(over);
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    return s;
}

test('R2 M1: a forced call waiting to ring again is never replaced; a different knot queues behind it with its own timing', () => {
    const s = forcedHit();
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.queueLength(), 2);
    assert.equal(saves(s).pop().knot, 'call_a', 'the slot still holds the forced call');
    assert.equal(saves(s).pop().state, 'connected');
    assert.equal(s.ringer.offer(offer({ knot: 'call_a' })), 'dropped', 'the same knot is dropped');
    s.clock.advance(HIT_QUIET_MS + TICK_MS);
    assert.equal(s.ringer.current().knot, 'call_a');
    s.clock.advance(AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS);
    assert.equal(s.last('openCall')[3].answerSeconds, 6, 'its own answerSeconds is kept');
    s.w.lastHitAt = null; s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.current().knot, 'call_b');
    assert.equal(s.ringer.current().ringMs < TICK_MS * 2, true, 'no ringing time carries over');
    s.clock.advance(2000);
    s.ringer.answer('ceo');
    assert.equal(s.ringer.current().answerSeconds, 2, 'call_answer_seconds counts only the new call');
});

test('R2 M1: row 4 still replaces a non-forced offer that is queued behind a connected call', () => {
    const s = connectedCall();
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.offer(offer({ knot: 'call_c' })), 'replaced');
    assert.equal(s.ringer.queueLength(), 1);
    assert.equal(s.ringer.offer(offer({ knot: 'call_c' })), 'dropped');
});

test('R2 m1: restore() queues a forced call ahead of the contact\'s other offer and never leaves two unconnected offers; it keeps opening', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer({ knot: 'call_b' }));
    assert.equal(s.ringer.restore('ceo', { knot: 'call_a', disableClose: true, opening: true, answerSeconds: 3 }), 'queued');
    assert.equal(s.ringer.queueLength(), 2);
    assert.equal(saves(s).pop().knot, 'call_a');
    assert.equal(saves(s).pop().state, 'connected');
    assert.equal(saves(s).pop().opening, true);
    assert.equal(s.ringer.hasOpeningOffer(), true, 'the Mission Brief is still held for it');
    assert.equal(s.ringer.restore('ceo', { knot: 'call_c', disableClose: true }), 'dropped');
    assert.equal(s.ringer.queueLength(), 2);
    s.w.ringBlocked = false;
    s.clock.advance(RERING_AFTER_LOAD_MS + TICK_MS);
    assert.equal(s.ringer.current().knot, 'call_a', 'the restored forced call rings first');
});

test('R2 m1: a restored forced call is not replaced by a later offer for the contact', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.restore('ceo', { knot: 'call_a', disableClose: true });
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.queueLength(), 2);
    assert.equal(saves(s).pop().knot, 'call_a');
});

test('R2 M2: an end report that never comes ends the call after CALL_GONE_AFTER_MS (row 32); the next call rings', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'a', knot: 'k' });
    s.ringer.answer('a'); connect(s);
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    assert.equal(s.ringer.stateOf('b'), 'queued');
    s.w.callOpen = false;                                  // the minigame is gone, no callEnded
    s.clock.advance(CALL_GONE_AFTER_MS - TICK_MS * 2);
    assert.equal(s.ringer.stateOf('a'), 'connected', 'not at once: a swap between minigames is not an end');
    s.clock.advance(TICK_MS * 4);
    assert.equal(s.ringer.stateOf('a'), null);
    assert.ok(s.events().includes('phone_call_missed:a'));
    assert.ok(s.log.some((e) => e[0] === 'outcome' && e[1] === 'dropped' && e[2] === 'a'));
    assert.equal(saves(s, 'a').pop(), null);
    assert.equal(s.count('reopen'), 0);
    assert.equal(s.ringer.stateOf('b'), 'ringing');
});

test('R2 M2: a call minigame that is gone only briefly (a swap) is not ended', () => {
    const s = connectedCall();
    s.w.callOpen = false;
    s.clock.advance(CALL_GONE_AFTER_MS - TICK_MS * 2);
    s.w.callOpen = true;
    s.clock.advance(CALL_GONE_AFTER_MS);
    s.w.callOpen = false;
    s.clock.advance(CALL_GONE_AFTER_MS - TICK_MS * 2);
    assert.equal(s.ringer.stateOf('ceo'), 'connected', 'the gone timer restarted when the call was seen open');
});

test('R2 M2: during the 500 ms open delay the backstop does not run', () => {
    const s = setup();
    s.ringer.offer(offer()); s.ringer.answer('ceo');
    s.clock.advance(SCRIPTED_CALL_START_MS - 1);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
    assert.equal(s.count('emit') >= 1, true);
    assert.equal(s.ringer.callActive(), true);
});

test('R2 M2: a forced call whose end report is lost is row 26: it waits to ring again, not dropped', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    s.w.callOpen = false;
    s.clock.advance(CALL_GONE_AFTER_MS + TICK_MS * 2);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing', 'it rings again at once, with no hit in the way');
    assert.equal(s.ringer.current().resumeCall, true);
    assert.equal(s.events().includes('phone_call_missed:ceo'), false);
});

test('R2 m2: a popup put aside comes back when the call is hung up after a refused open', () => quietly(() => {
    const s = setup({ popup: { kind: 'lab' }, openResult: false });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.count('putAside'), 1);
    s.ringer.hangUp('ceo');
    assert.equal(s.count('reopen'), 1);
    assert.deepEqual(s.last('reopen')[1], { kind: 'lab' });
}));

test('R2 m2: a popup put aside comes back when a held call rings off', () => quietly(() => {
    const s = setup({ popup: { kind: 'lab' }, openResult: false }, (ad, ctx) => {
        ad.toast = () => { ctx.w.openBlocked = false; };     // by the time of the toast the world is free
    });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    s.w.openBlocked = true; s.w.minigameOpen = true;         // the pill shows, the hold clock runs
    s.clock.advance(HOLD_MAX_MS + 1000);
    assert.equal(s.ringer.stateOf('ceo'), null);
    assert.ok(s.events().includes('phone_call_missed:ceo'));
    assert.equal(s.count('reopen'), 1);
}));

test('R2 m2: after close() the popup stays closed on hang-up', () => quietly(() => {
    const s = setup({ popup: { kind: 'lab' }, openResult: false });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    s.ringer.close();
    assert.equal(s.count('reopen'), 0);
}));

test('R2 m2: a forced call that put a popup aside and was hit keeps it; it comes back when the call ends', () => {
    const s = setup({ popup: { kind: 'lab' } });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    assert.equal(s.count('putAside'), 1);
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    assert.equal(s.count('reopen'), 0, 'not while it waits to ring again');
    s.clock.advance(HIT_QUIET_MS + AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS + TICK_MS * 2);
    assert.equal(s.count('openCall'), 2);
    s.w.lastHitAt = null;
    endCall(s, { endedByCall: true });
    assert.equal(s.count('reopen'), 1);
    assert.deepEqual(s.last('reopen')[1], { kind: 'lab' });
});

test('R2 m3: a hit stamped in the future is not a hit', () => {
    const s = setup({ lastHitAt: 1000 + 60000 });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS);
    assert.equal(s.count('openCall'), 1, 'the forced call auto-answers and opens');
    const t = setup({ lastHitAt: 1000 + 60000 });
    t.ringer.offer(offer()); t.ringer.answer('ceo'); connect(t);
    assert.equal(t.count('openCall'), 1);
});

test('R2 m4: five quick refusals from hooks do not give up before GIVE_UP_AFTER_MS', () => quietly(() => {
    const s = setup({ openResult: false });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    for (let i = 0; i < 4; i++) { s.ringer.onMinigameEnded(); s.clock.flush(); connect(s); }
    assert.equal(s.count('openCall'), 5);
    assert.equal(s.ringer.stateOf('ceo'), 'held', 'five refusals in 2 s are not enough');
    s.clock.advance(12000);
    assert.equal(s.ringer.stateOf('ceo'), null, 'still given up on once the time has passed');
}));

test('R2 m4: a successful open clears the refusal count, so a later refusal is not the fifth', () => quietly(() => {
    const s = setup({ openResult: false });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS); connect(s);
    for (let i = 0; i < 3; i++) { s.ringer.onMinigameEnded(); s.clock.flush(); connect(s); }
    assert.equal(s.count('openCall'), 4);
    s.w.openResult = true;
    s.ringer.onMinigameEnded(); s.clock.flush(); connect(s);
    assert.equal(s.count('openCall'), 5);
    s.w.callOpen = false; s.w.lastHitAt = s.clock.now();
    endCall(s, {});
    s.w.openResult = false;
    for (let i = 0; i < 100 && s.count('openCall') < 6; i++) s.clock.advance(TICK_MS);
    assert.equal(s.count('openCall'), 6);
    assert.equal(s.ringer.stateOf('ceo'), 'held', 'one refusal after the success is the first');
}));

test('R2 m4: two refusals a long time apart are not given up on (the count is needed as well as the time)', () => quietly(() => {
    const s = setup({ openResult: false });
    s.ringer.offer(offer()); s.ringer.answer('ceo'); connect(s);
    assert.equal(s.count('openCall'), 1);
    s.w.paused = true;
    s.clock.advance(20000);
    s.w.paused = false;
    s.ringer.onMinigameEnded(); s.clock.flush(); connect(s);
    assert.equal(s.count('openCall'), 2);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
}));

// ---- Round 3 ------------------------------------------------------------------------

test('R3 M1: a forced call ringing again is never replaced; no ringing time or answerSeconds carries over', () => {
    const s = forcedHit();
    s.clock.advance(HIT_QUIET_MS + TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.clock.advance(1500);
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.current().knot, 'call_a');
    assert.equal(s.ringer.offer(offer({ knot: 'call_a' })), 'dropped');
    assert.equal(saves(s).pop().knot, 'call_a');
    s.clock.advance(AUTO_ANSWER_MS + SCRIPTED_CALL_START_MS);
    assert.equal(s.last('openCall')[2], 'call_a');
    assert.equal(s.last('openCall')[3].answerSeconds, 6);
    s.w.lastHitAt = null; s.w.callOpen = false;
    endCall(s, { endedByCall: true });
    s.clock.advance(TICK_MS);
    assert.equal(s.ringer.current().knot, 'call_b');
    s.clock.advance(1000);
    s.ringer.answer('ceo');
    assert.equal(s.ringer.current().answerSeconds, 1, 'call_b counts only its own ringing');
});

test('R3 M1: a re-rung forced call sent back by a conversation (row 23) is still never replaced', () => {
    const s = forcedHit();
    s.clock.advance(HIT_QUIET_MS + TICK_MS);
    s.w.ringBlocked = true; s.ringer.tick();
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.queueLength(), 2);
    assert.equal(s.ringer.offer(offer({ knot: 'call_a' })), 'dropped');
    assert.equal(saves(s).pop().knot, 'call_a');
    s.w.ringBlocked = false;
    s.clock.advance(TICK_MS * 2);
    assert.equal(s.ringer.current().knot, 'call_a', 'the forced call rings first');
});

test('R3 M1: a re-rung forced call answered into hold is never replaced and keeps its answerSeconds', () => {
    const s = forcedHit();
    s.clock.advance(HIT_QUIET_MS + TICK_MS);
    s.w.openBlocked = true;
    s.clock.advance(AUTO_ANSWER_MS + TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    const answered = () => s.events().filter((e) => e.startsWith('phone_call_answered')).length;
    const before = answered();
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.current().knot, 'call_a');
    s.w.openBlocked = false;
    s.clock.advance(TICK_MS * 2 + SCRIPTED_CALL_START_MS);
    assert.equal(s.last('openCall')[2], 'call_a');
    assert.equal(s.last('openCall')[3].answerSeconds, 6);
    assert.equal(answered(), before);
});

test('R3 M1: a restored forced call that is ringing is never replaced', () => {
    const s = setup();
    s.ringer.restore('ceo', { knot: 'call_a', disableClose: true, answerSeconds: 3 });
    s.clock.advance(RERING_AFTER_LOAD_MS + TICK_MS);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.current().knot, 'call_a');
});

test('R3 m1: a restored forced call keeps the save slot when the contact\'s other offer connects', () => {
    const s = setup();
    s.ringer.offer(offer({ knot: 'call_b' }));
    s.ringer.restore('ceo', { knot: 'call_a', disableClose: true, answerSeconds: 3 });
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.last('openCall')[2], 'call_b');
    const rec = saves(s).pop();
    assert.equal(rec.knot, 'call_a');
    assert.equal(rec.state, 'connected');
});

test('R3 M2: an end report with endedByCall on a non-forced call is row 25 (hang-up), never a miss', () => {
    const s = connectedCall();
    endCall(s, { endedByCall: true });
    assert.equal(s.events().some((e) => e.startsWith('phone_call_missed')), false);
    assert.equal(s.last('outcome')[1], 'ended');
});

test('R4 M1: a forced offer ringing for the first time is never replaced', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(3000);
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.current().knot, 'call_a');
    assert.equal(s.ringer.current().disableClose, true);
});

test('R4 M1: a forced offer queued behind a conversation is never replaced', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer(offer({ disableClose: true }));
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.queueLength(), 2);
    s.w.ringBlocked = false;
    s.clock.advance(TICK_MS * 2);
    assert.equal(s.ringer.current().knot, 'call_a', 'the forced call rings first');
});

test('R4 M1: a forced offer auto-answered into hold is never replaced and keeps its answerSeconds', () => {
    const s = setup({ openBlocked: true });
    s.ringer.offer(offer({ disableClose: true }));
    s.clock.advance(AUTO_ANSWER_MS + 300);
    assert.equal(s.ringer.stateOf('ceo'), 'held');
    assert.equal(s.ringer.offer(offer({ knot: 'call_b' })), 'queued');
    assert.equal(s.ringer.current().knot, 'call_a');
    assert.equal(s.ringer.current().disableClose, true);
    assert.equal(s.ringer.hangUp('ceo'), false, 'a forced call cannot be hung up');
});

test('R4 m1: a forced call queued behind a connected non-forced call keeps the save slot', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'ceo', knot: 'chat' });
    s.ringer.answer('ceo'); connect(s);
    assert.equal(s.ringer.offer(offer({ disableClose: true })), 'queued');
    assert.equal(saves(s).pop().knot, 'call_a');
});

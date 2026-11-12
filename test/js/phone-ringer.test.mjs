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
    HIT_QUIET_MS, HOLD_MAX_MS, SCRIPTED_CALL_START_MS, TICK_MS,
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
                t = next.at;
                next.fn();
                clock.flush();
            }
            t = end;
        },
        pending: () => timers.length,
    };
    return clock;
}

function setup(over = {}) {
    const clock = fakeClock();
    const log = [];
    const w = {
        ringBlocked: false, openBlocked: false, conversationOpen: false, minigameOpen: false,
        knockedOut: false, paused: false, lastHitAt: null, outgoing: false,
        callOpen: false, openResult: true, popup: null, ringerCallId: null, names: { ceo: 'The CEO' },
        ...over,
    };
    const adapter = {
        ringBlocked: () => w.ringBlocked,
        openBlocked: () => w.openBlocked,
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
    const ringer = createPhoneRinger({ adapter, clock });
    const events = () => log.filter((e) => e[0] === 'emit').map((e) => e[1]);
    const count = (name) => log.filter((e) => e[0] === name).length;
    const last = (name) => [...log].reverse().find((e) => e[0] === name);
    return { clock, log, w, ringer, events, count, last };
}

const offer = (extra = {}) => ({ npcId: 'ceo', knot: 'call_a', ...extra });
/** Finish the call opening: the 500 ms start wait. */
const connect = (s) => s.clock.advance(SCRIPTED_CALL_START_MS);

// ---- Offers arriving ----------------------------------------------------------------

test('row 1: an offer with nothing blocking rings, applies setGlobalOnStart, persists the trigger', () => {
    const s = setup();
    assert.equal(s.ringer.offer(offer({ setGlobalOnStart: { call_started: true } })), 'ringing');
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.deepEqual(s.last('setGlobal')[1], { call_started: true });
    assert.equal(s.count('persistTrigger'), 1);
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
    assert.equal(s.count('persistTrigger'), 1, 'persisted at offer even though queued');
});

test('row 3: a second offer with the same knot is dropped; the trigger was persisted at offer', () => {
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
    s.ringer.callEnded('ceo', { endedByCall: true });
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

test('row 11 (★): a workstation popup is put aside at answer and reopened when the call ends', () => {
    const s = setup({ popup: { kind: 'lab', src: 'http://x/sheet' } });
    s.ringer.offer(offer());
    s.ringer.answer('ceo');
    assert.equal(s.count('putAside'), 1);
    connect(s);
    s.w.callOpen = false;
    s.ringer.callEnded('ceo', { endedByCall: true });
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
    assert.equal(s.count('vibrate'), 0);
    s.clock.advance(UNTIL_ANSWERED_NUDGE_MS);
    assert.equal(s.count('vibrate'), 1);
    s.clock.advance(UNTIL_ANSWERED_NUDGE_MS * 3);
    assert.equal(s.count('vibrate'), 4);
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
        assert.equal(s.ringer.callEnded('ceo', info), true);
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
    a.ringer.callEnded('ceo', { endedByCall: true });
    assert.equal(a.count('reopen'), 1);
    const b = setup({ popup: { kind: 'laptop' } });
    b.ringer.offer(offer()); b.ringer.answer('ceo'); connect(b);
    b.w.callOpen = false;
    b.w.openBlocked = true;              // a scripted debrief is queued and opens next
    b.ringer.callEnded('ceo', { endedByCall: true });
    assert.equal(b.count('reopen'), 0);
    const c = setup({ popup: { kind: 'laptop' } });
    c.ringer.offer(offer()); c.ringer.answer('ceo'); connect(c);
    c.w.callOpen = false;
    c.w.lastHitAt = c.clock.now();
    c.ringer.callEnded('ceo', { endedByCall: true });
    assert.equal(c.count('reopen'), 0, 'not in the middle of a fight');
});

test('row 25: the next queued call rings after the end', () => {
    const s = connectedCall();
    s.ringer.offer({ npcId: 'b', knot: 'k' });
    assert.equal(s.ringer.stateOf('b'), 'queued');
    s.w.callOpen = false;
    s.ringer.callEnded('ceo', { endedByCall: true });
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
    s.ringer.callEnded('ceo', {});                    // closed by the hit, story not finished
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
    s.ringer.callEnded('ceo', { callFinished: true });
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
    s.ringer.callEnded('ceo', { endedByCall: true });
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
    s.ringer.callEnded('ceo', {});                    // another minigame's startMinigame ended it
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
    s.ringer.callEnded('ceo', {});
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
    s.ringer.callEnded('ceo', { endedByCall: true });
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

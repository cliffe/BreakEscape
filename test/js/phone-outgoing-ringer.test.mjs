// A5: the ringer's side of an outgoing call (phone calls plan 2.3 row 31, 2.5, 2.11): dial(),
// outgoingConnected(), the end of the call, and what a dial leaves alone. A fake clock and a
// recording adapter stand in for the window, as in phone-ringer.test.mjs.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ringer.js'), 'utf8');
const { createPhoneRinger, HIT_QUIET_MS } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

function setup(over = {}) {
    let t = 1000;
    let deferred = [];
    const clock = {
        now: () => t, setTimeout: () => 1, clearTimeout() {}, defer: (f) => deferred.push(f),
        flush() { const d = deferred; deferred = []; d.forEach((f) => f()); },
        advance(ms) { t += ms; },
    };
    const log = [];
    const w = { openBlocked: false, ringBlocked: false, knockedOut: false, lastHitAt: null, callOpen: false, openResult: true,
        ringerCallId: null, aside: { kind: 'phone', thread: 'ceo' }, ...over };
    const adapter = {
        ringBlocked: () => w.ringBlocked,
        openBlocked: (info) => { log.push(['openBlockedAsked', info]); return w.openBlocked || w.knockedOut; },
        conversationOpen: () => false, minigameOpen: () => false, knockedOut: () => w.knockedOut,
        isPaused: () => false, lastHitAt: () => w.lastHitAt, outgoingActive: () => false,
        callMinigameOpen: () => w.callOpen, openCallId: () => w.ringerCallId,
        openCall(offer, info) {
            log.push(['openCall', offer.npcId, offer.knot, info]);
            if (w.openResult) { w.callOpen = true; w.ringerCallId = info.ringerCall.id; }
            return w.openResult;
        },
        putAside(npcId) { log.push(['putAside', npcId]); return w.aside; },
        reopen(d) { log.push(['reopen', d]); },
        dropDisplaced(d) { log.push(['dropDisplaced', d]); },
        showBanner(v) { log.push(['showBanner', v]); }, hideBanner() { log.push(['hideBanner']); },
        showPill() {}, hidePill() {}, ringtone(on) { log.push(['ringtone', on]); }, vibrate() {},
        toast() {}, displayName: () => 'The CEO',
        emit(name, data) { log.push(['emit', name, data]); }, setGlobal() {},
        savePendingCall(id, slot) { log.push(['saveSlot', id, slot]); },
        onOutcome(kind, o, extra) { log.push(['outcome', kind, o.npcId, o.direction, extra]); },
    };
    const ringer = createPhoneRinger({ adapter, clock });
    const last = (n) => [...log].reverse().find((e) => e[0] === n);
    const count = (n) => log.filter((e) => e[0] === n).length;
    return { ringer, clock, log, w, last, count };
}
const entry = (extra = {}) => ({ knot: 'desk_call', callLabel: 'Desk line', ...extra });
const endOutgoing = (s, info) => {
    const r = s.ringer.callEnded('ceo', { id: s.w.ringerCallId, ...info });
    s.clock.flush();
    return r;
};

test('dial opens the call at once with direction outgoing, the callback flag and the dial data; the phone is put aside first', () => {
    const s = setup();
    assert.equal(s.ringer.dial('ceo', entry(), { callback: false, dial: { when: 'globalVars.x' } }), 'dialling');
    const open = s.last('openCall');
    assert.equal(open[2], 'desk_call');
    assert.equal(open[3].ringerCall.direction, 'outgoing');
    assert.equal(open[3].ringerCall.callback, false);
    assert.deepEqual(open[3].dial, { when: 'globalVars.x' });
    assert.equal(open[3].resume, false);
    assert.ok(s.log.findIndex((e) => e[0] === 'putAside') < s.log.findIndex((e) => e[0] === 'openCall'), 'phone closed before the call opens');
    assert.equal(s.ringer.callActive(), true, 'a busy rule applies from the dial');
    assert.equal(s.ringer.current().direction, 'outgoing');
});

test('call_answer_seconds is 0 and call_is_callback follows the dial for an outgoing call (2.11)', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), { callback: true });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: true });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-preload'), { call_answer_seconds: 0, call_is_callback: false });
    endOutgoing(s, { endedByCall: true });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false });
});

test('nothing rings during an outgoing call: an offer queues behind it and rings when it ends (row 5)', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    assert.equal(s.ringer.offer({ npcId: 'other', knot: 'k' }), 'queued');
    assert.equal(s.count('showBanner'), 0);
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    s.w.callOpen = false;
    endOutgoing(s, { endedByCall: true });
    assert.equal(s.ringer.stateOf('other'), 'ringing', 'the queued call rings once the outgoing call is over');
});

test('refused: a connected or held call, the ending, a hit within the quiet time, a blocking scene', () => {
    const a = setup();
    a.ringer.offer({ npcId: 'other', knot: 'k' });
    a.ringer.answer('other');                                   // connecting
    assert.equal(a.ringer.dial('ceo', entry(), {}), 'refused');
    const b = setup();
    b.ringer.close();
    assert.equal(b.ringer.dial('ceo', entry(), {}), 'refused');
    const c = setup({ lastHitAt: 1000 - 100 });
    assert.equal(c.ringer.dial('ceo', entry(), {}), 'refused', `a hit within ${HIT_QUIET_MS} ms`);
    const d = setup({ openBlocked: true });
    assert.equal(d.ringer.dial('ceo', entry(), {}), 'refused');
    const e = setup({ knockedOut: true });
    assert.equal(e.ringer.dial('ceo', entry(), {}), 'refused');
    const f = setup();
    assert.equal(f.ringer.dial('', entry(), {}), 'refused');
    assert.equal(f.ringer.dial('ceo', { knot: '' }, {}), 'refused');
    assert.equal(f.ringer.dial('ceo', null, {}), 'refused');
    assert.equal(f.count('openCall'), 0, 'a refused dial never opens a call');
});

test('row 19: a call that cannot open leaves nothing behind, no row, and the phone comes back', () => {
    const s = setup({ openResult: false });
    assert.equal(s.ringer.dial('ceo', entry(), {}), 'refused');
    assert.equal(s.ringer.current(), null);
    assert.equal(s.ringer.callActive(), false);
    assert.deepEqual(s.last('reopen')[1], { kind: 'phone', thread: 'ceo' });
    assert.equal(s.count('outcome'), 0);
    assert.equal(s.ringer.offer({ npcId: 'ceo', knot: 'k' }), 'ringing', 'the ringer is free again');
});

test('row 31: when the call connects, a queued offer of this contact on the same knot is dropped with no row and no event', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer({ npcId: 'ceo', knot: 'desk_call' });         // queued
    s.ringer.offer({ npcId: 'ceo', knot: 'other_knot' });        // replaces it (row 4): the old one is gone
    assert.equal(s.ringer.queueLength(), 1);
    s.w.ringBlocked = false;
    s.ringer.dial('ceo', entry({ knot: 'other_knot' }), {});
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    assert.equal(s.ringer.queueLength(), 0, 'the player rang first');
    assert.equal(s.log.filter((e) => e[0] === 'emit').length, 0, 'no event');
    assert.equal(s.count('outcome'), 0, 'no row');
});

test('row 31: another knot stays queued, and a ringing offer goes back to the queue at the dial and rings after the call', () => {
    const s = setup();
    s.ringer.offer({ npcId: 'ceo', knot: 'incoming_k' });        // rings
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    s.ringer.dial('ceo', entry({ knot: 'desk_call' }), {});
    assert.equal(s.ringer.queueLength(), 1, 'the ringing offer waits');
    assert.ok(s.log.some((e) => e[0] === 'hideBanner'), 'its banner goes');
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    assert.equal(s.ringer.queueLength(), 1, 'another knot is not dropped');
    s.w.callOpen = false;
    endOutgoing(s, { endedByCall: true });
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
});

test('row 31: a ringing offer on the same knot is dropped when the call connects, but a ring-out leaves it queued', () => {
    const rang = setup();
    rang.ringer.offer({ npcId: 'ceo', knot: 'desk_call' });
    rang.ringer.dial('ceo', entry(), {});
    rang.ringer.outgoingConnected('ceo', rang.w.ringerCallId);
    assert.equal(rang.ringer.queueLength(), 0);
    const out = setup();
    out.ringer.offer({ npcId: 'ceo', knot: 'desk_call' });
    out.ringer.dial('ceo', entry(), {});
    // no connect: it rang out
    out.w.callOpen = false;
    endOutgoing(out, { endedByCall: true, noAnswer: true });
    assert.equal(out.ringer.stateOf('ceo'), 'ringing', 'the offer is still there and rings now');
});

test('a forced incoming offer is never dropped by row 31', () => {
    const s = setup({ ringBlocked: true });
    s.ringer.offer({ npcId: 'ceo', knot: 'desk_call', disableClose: true });
    s.w.ringBlocked = false;
    // a forced offer is queued and protected; the dial goes ahead of it
    s.ringer.dial('ceo', entry(), {});
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    assert.equal(s.ringer.queueLength(), 1);
});

test('own end of a connected call: row "ended" for the outgoing direction, reopen the phone, no event, no callback', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    s.clock.advance(12000);
    s.w.callOpen = false;
    endOutgoing(s, { endedByCall: true });
    const out = s.last('outcome');
    assert.deepEqual([out[1], out[3]], ['ended', 'outgoing']);
    assert.equal(out[4].seconds, 12);
    assert.deepEqual(s.last('reopen')[1], { kind: 'phone', thread: 'ceo' });
    assert.equal(s.log.filter((e) => e[0] === 'emit').length, 0);
    assert.equal(s.ringer.current(), null);
});

test('no answer: a no_answer outcome, no ended row, the phone comes back, nothing is saved as a pending call', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    s.w.callOpen = false;
    endOutgoing(s, { endedByCall: true, noAnswer: true });
    const kinds = s.log.filter((e) => e[0] === 'outcome').map((e) => e[1]);
    assert.deepEqual(kinds, ['no_answer']);
    assert.equal(s.last('reopen')[1].thread, 'ceo');
    const slots = s.log.filter((e) => e[0] === 'saveSlot').map((e) => e[2]);
    assert.ok(slots.every((x) => x === null), 'an outgoing call is never saved: a reload mid-call is not a missed call');
});

test('End while dialling (never connected) adds no row but reopens the phone', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    s.w.callOpen = false;
    endOutgoing(s, { endedByCall: true });
    assert.equal(s.count('outcome'), 0);
    assert.ok(s.last('reopen'));
});

test('row 32 for an outgoing call: another minigame closing it is an ended call with no callback, no reopen, the thread owed its close event', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    s.clock.advance(5000);
    s.w.callOpen = false;
    endOutgoing(s, {});                                          // not endedByCall
    assert.equal(s.last('outcome')[1], 'ended');
    assert.equal(s.count('reopen'), 0, 'no reopen');
    assert.equal(s.count('dropDisplaced'), 1, 'the closed phone owes its conversation_closed');
    assert.equal(s.log.filter((e) => e[0] === 'emit').length, 0, 'no phone_call_missed');
    assert.equal(s.ringer.current(), null);
});

test('a stale or other call id is ignored', () => {
    const s = setup();
    s.ringer.dial('ceo', entry(), {});
    assert.equal(s.ringer.callEnded('ceo', { id: 'call-999', endedByCall: true }), false);
    assert.equal(s.ringer.outgoingConnected('ceo', 'call-999'), false);
    assert.equal(s.ringer.outgoingConnected('someone', s.w.ringerCallId), false);
    assert.equal(s.ringer.callActive(), true);
});

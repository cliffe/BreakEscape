// A6: the ringer's side of callbacks and voicemail (phone calls plan 2.3 rows 7, 17, 18, 20, 21, 32,
// 2.6, 2.7, 2.11): what each way of missing a call leaves, row 7, the callback dial, the saved slot,
// and the A4 R2 m2 test (suspend(false) empties the kept list). A fake clock with working timers and
// a recording adapter stand in for the window, as in phone-outgoing-ringer.test.mjs.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ringer.js'), 'utf8');
const { createPhoneRinger, RING_TIMEOUT_MS, HOLD_MAX_MS } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

function setup(over = {}) {
    let t = 1000;
    let seq = 0;
    let timers = [];
    let deferred = [];
    const clock = {
        now: () => t,
        setTimeout(fn, ms) { const id = ++seq; timers.push({ id, at: t + ms, fn }); return id; },
        clearTimeout(id) { timers = timers.filter((x) => x.id !== id); },
        defer: (f) => deferred.push(f),
        flush() { const d = deferred; deferred = []; d.forEach((f) => f()); },
        /** Step in 250 ms slices so advance() credits every one of them. */
        run(ms) {
            let left = ms;
            while (left > 0) {
                const step = Math.min(250, left);
                t += step; left -= step;
                for (;;) {
                    const due = timers.filter((x) => x.at <= t).sort((a, b) => a.at - b.at)[0];
                    if (!due) break;
                    timers = timers.filter((x) => x !== due);
                    due.fn();
                }
                clock.flush();
            }
        },
    };
    const log = [];
    const w = { openBlocked: false, ringBlocked: false, minigame: false, callOpen: false, ringerCallId: null,
        aside: null, names: { ceo: 'The CEO', other: 'Other' }, ...over };
    const adapter = {
        ringBlocked: () => w.ringBlocked,
        openBlocked: () => w.openBlocked,
        conversationOpen: () => false, minigameOpen: () => w.minigame, knockedOut: () => false,
        isPaused: () => false, lastHitAt: () => null, outgoingActive: () => false,
        callMinigameOpen: () => w.callOpen, openCallId: () => w.ringerCallId,
        openCall(offer, info) {
            log.push(['openCall', offer.npcId, offer.knot, info]);
            w.callOpen = true; w.ringerCallId = info.ringerCall.id;
            return true;
        },
        putAside(npcId) { log.push(['putAside', npcId]); return w.aside; },
        reopen(d) { log.push(['reopen', d]); },
        dropDisplaced(d) { log.push(['dropDisplaced', d]); },
        showBanner() {}, hideBanner() {}, showPill() {}, hidePill() {}, ringtone() {}, vibrate() {},
        toast(text) { log.push(['toast', text]); },
        displayName: (id) => w.names[id] || null,
        emit(name, data) { log.push(['emit', name, data]); }, setGlobal() {},
        savePendingCall(id, slot) { log.push(['saveSlot', id, slot ? JSON.parse(JSON.stringify(slot)) : null]); },
        onOutcome(kind, o, extra) { log.push(['outcome', kind, o.npcId, extra]); },
        voicemail(o, opts) { log.push(['voicemail', o.npcId, o.voicemailKnot, opts]); },
        callbackChanged(id) { log.push(['callbackChanged', id]); },
    };
    const ringer = createPhoneRinger({ adapter, clock });
    const all = (n) => log.filter((e) => e[0] === n);
    const lastSlot = (id) => [...log].reverse().find((e) => e[0] === 'saveSlot' && e[1] === id)?.[2];
    return { ringer, clock, log, w, all, lastSlot, last: (n) => all(n).pop() };
}
const offer = (extra = {}) => ({ npcId: 'ceo', knot: 'ring_call', callLabel: 'Boss', ...extra });
const endCall = (s, info) => { const r = s.ringer.callEnded('ceo', { id: s.w.ringerCallId, ...info }); s.clock.flush(); s.w.callOpen = false; return r; };
const answered = (s, extra) => {
    s.ringer.offer(offer(extra));
    s.ringer.answer('ceo');
    s.clock.run(600);
    assert.equal(s.ringer.stateOf('ceo'), 'connected');
};

test('onMissed callback (the default): Decline leaves a callback on the call knot, with its label', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    assert.deepEqual(s.ringer.callbackFor('ceo'), { knot: 'ring_call', callLabel: 'Boss' });
    assert.equal(s.all('voicemail').length, 0);
    assert.ok(s.all('callbackChanged').length >= 1, 'the adapter is told');
    assert.ok(s.log.findIndex((e) => e[0] === 'outcome') < s.log.findIndex((e) => e[0] === 'callbackChanged'), 'the row first, then the callback');
});

test('onMissed callback: ringing out (row 21) leaves a callback', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.clock.run(RING_TIMEOUT_MS + 500);
    assert.equal(s.all('emit').filter((e) => e[1] === 'phone_call_missed:ceo').length, 1);
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_call');
});

test('onMissed callback: Hang up from hold (row 17) and the hold limit (row 18) leave a callback; the toast is the callback one', () => {
    const a = setup();
    a.w.minigame = true; a.w.openBlocked = true;
    a.ringer.offer(offer());
    a.ringer.answer('ceo');
    assert.equal(a.ringer.stateOf('ceo'), 'held');
    assert.equal(a.ringer.hangUp('ceo'), true);
    assert.equal(a.ringer.callbackFor('ceo').knot, 'ring_call');

    const b = setup();
    b.w.minigame = true; b.w.openBlocked = true;
    b.ringer.offer(offer());
    b.ringer.answer('ceo');
    b.clock.run(HOLD_MAX_MS + 1000);
    assert.equal(b.ringer.callbackFor('ceo').knot, 'ring_call');
    assert.equal(b.last('toast')[1], 'The CEO rang off. Call back from the thread.');
});

test('a withheld caller leaves no callback (it cannot be rung back)', () => {
    const s = setup();
    s.ringer.offer(offer({ withheld: true }));
    s.ringer.decline('ceo');
    assert.equal(s.ringer.callbackFor('ceo'), null);
    assert.equal(s.all('voicemail').length, 0);
});

test('onMissed voicemail: Decline, ring-out and the hold limit run the voicemail knot and leave no callback', () => {
    for (const how of ['decline', 'timeout', 'hold']) {
        const s = setup();
        s.w.minigame = how === "hold"; s.w.openBlocked = how === "hold";
        s.ringer.offer(offer({ onMissed: 'voicemail', voicemailKnot: 'ring_vm', withheld: how === 'decline' }));
        if (how === 'decline') s.ringer.decline('ceo');
        else if (how === 'timeout') s.clock.run(RING_TIMEOUT_MS + 500);
        else { s.ringer.answer('ceo'); s.clock.run(HOLD_MAX_MS + 1000); }
        const [, id, knot, opts] = s.last('voicemail');
        assert.equal(id, 'ceo', how);
        assert.equal(knot, 'ring_vm', how);
        assert.deepEqual(opts, { quiet: false }, how);
        assert.equal(s.ringer.callbackFor('ceo'), null, `${how}: no callback`);
        if (how === 'hold') assert.equal(s.all('toast').length, 0, 'the voicemail toast replaces the rang-off one (the runner shows it)');
    }
});

test('onMissed voicemail without a voicemail knot falls back to a callback', () => {
    const s = setup();
    s.ringer.offer(offer({ onMissed: 'voicemail' }));
    s.ringer.decline('ceo');
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_call');
});

test('a forced call is never missed: no callback and no voicemail', () => {
    const s = setup();
    s.ringer.offer(offer({ disableClose: true, onMissed: 'voicemail', voicemailKnot: 'ring_vm' }));
    assert.equal(s.ringer.decline('ceo'), false);
    s.clock.run(10000);
    assert.equal(s.ringer.callbackFor('ceo'), null);
    assert.equal(s.all('voicemail').length, 0);
});

test('row 32: a non-forced call closed by something else leaves a callback on its own knot, whatever its onMissed', () => {
    for (const extra of [{}, { onMissed: 'voicemail', voicemailKnot: 'ring_vm' }]) {
        const s = setup();
        answered(s, extra);
        endCall(s, { endedByCall: false });
        assert.deepEqual(s.ringer.callbackFor('ceo'), { knot: 'ring_call', callLabel: 'Boss' }, JSON.stringify(extra));
        assert.equal(s.all('voicemail').length, 0, 'never a voicemail once answered');
    }
});

test('row 32: a withheld caller closed by something else leaves nothing; an own-path End leaves nothing', () => {
    const s = setup();
    answered(s, { withheld: true });
    endCall(s, { endedByCall: false });
    assert.equal(s.ringer.callbackFor('ceo'), null);
    const t = setup();
    answered(t, {});
    endCall(t, { endedByCall: true });
    assert.equal(t.ringer.callbackFor('ceo'), null, 'a call the player ended is no missed call');
});

test('row 7: a callback stays while the new offer is queued, and is cleared when it starts ringing', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    assert.ok(s.ringer.callbackFor('ceo'));
    s.w.ringBlocked = true;
    s.ringer.offer(offer({ knot: 'ring_again' }));
    assert.equal(s.ringer.stateOf('ceo'), 'queued');
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_call', 'kept while queued');
    s.w.ringBlocked = false;
    s.clock.run(500);
    assert.equal(s.ringer.stateOf('ceo'), 'ringing');
    assert.equal(s.ringer.callbackFor('ceo'), null, 'cleared at the first ring');
    assert.equal(s.lastSlot('ceo').live.knot, 'ring_again');
    assert.equal(s.lastSlot('ceo').live.state, 'ringing');
});

test('row 7: the new offer\'s own outcome decides what is left (answered: nothing; missed: its own callback)', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    s.ringer.offer(offer({ knot: 'ring_again' }));
    s.ringer.decline('ceo');
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_again', 'one callback, the newer knot');

    const t = setup();
    t.ringer.offer(offer());
    t.ringer.decline('ceo');
    t.ringer.offer(offer({ knot: 'ring_again' }));
    t.ringer.answer('ceo');
    t.clock.run(600);
    endCall(t, { endedByCall: true });
    assert.equal(t.ringer.callbackFor('ceo'), null);
});

test('the saved slot carries the callback (state "missed"), and every later save keeps it (A4 R2 n5)', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    assert.deepEqual(s.lastSlot('ceo'), { forced: [], live: { knot: 'ring_call', state: 'missed', onMissed: 'callback', callLabel: 'Boss' } });
    // a forced offer for the same contact queues behind other work: its save still carries the callback
    s.w.ringBlocked = true;
    s.ringer.offer(offer({ knot: 'forced_k', disableClose: true }));
    const slot = s.lastSlot('ceo');
    assert.equal(slot.forced.length, 1);
    assert.equal(slot.live.state, 'missed', 'the callback rides beside the forced offer');
    s.ringer.refreshSave('ceo');
    assert.equal(s.lastSlot('ceo').live.state, 'missed', 'refreshSave keeps it too');
});

test('restoreCallback hands a saved callback back (the button and the VAR survive a reload); a live offer outranks it', () => {
    const s = setup();
    assert.equal(s.ringer.restoreCallback('ceo', { knot: 'ring_call', state: 'missed', callLabel: 'Boss' }), 'kept');
    assert.equal(s.ringer.callbackFor('ceo').callLabel, 'Boss');
    assert.equal(s.lastSlot('ceo').live.state, 'missed', 'saved again, so the slot is not lost');
    assert.equal(s.ringer.restoreCallback('ceo', { state: 'missed' }), 'refused');
    const t = setup();
    t.w.ringBlocked = true;
    t.ringer.offer(offer());
    assert.equal(t.ringer.restoreCallback('ceo', { knot: 'old', state: 'missed' }), 'dropped');
    assert.equal(t.ringer.callbackFor('ceo'), null);
});

test('missedOffline (row 27): a live call becomes its onMissed with no toast; a call that was connected leaves a callback', () => {
    const s = setup();
    s.ringer.missedOffline('ceo', { knot: 'ring_call', state: 'ringing', callLabel: 'Boss' });
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_call');
    const v = setup();
    v.ringer.missedOffline('ceo', { knot: 'ring_call', state: 'ringing', onMissed: 'voicemail', voicemailKnot: 'ring_vm' });
    assert.deepEqual(v.last('voicemail').slice(1), ['ceo', 'ring_vm', { quiet: true }]);
    assert.equal(v.ringer.callbackFor('ceo'), null);
    const c = setup();
    c.ringer.missedOffline('ceo', { knot: 'ring_call', state: 'connected', onMissed: 'voicemail', voicemailKnot: 'ring_vm' });
    assert.equal(c.ringer.callbackFor('ceo').knot, 'ring_call', 'it was answered, so a callback');
    assert.equal(c.all('voicemail').length, 0);
    assert.equal(c.all('toast').length, 0);
    const w = setup();
    w.ringer.missedOffline('ceo', { knot: 'ring_call', state: 'ringing', withheld: true });
    assert.equal(w.ringer.callbackFor('ceo'), null);
});

test('a callback dial: call_is_callback is true while it is open, the connect clears the callback and emits answered with callback true', () => {
    const s = setup();
    s.ringer.offer(offer());
    s.ringer.decline('ceo');
    const cb = s.ringer.callbackFor('ceo');
    assert.equal(s.ringer.dial('ceo', { knot: cb.knot, callLabel: cb.callLabel }, { callback: true, dial: { when: null } }), 'dialling');
    const open = s.last('openCall');
    assert.equal(open[3].ringerCall.callback, true);
    assert.equal(open[3].isCallback, true);
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: true });
    assert.ok(s.ringer.callbackFor('ceo'), 'kept until it connects (a refused or cancelled dial leaves it)');
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    assert.equal(s.ringer.callbackFor('ceo'), null, 'cleared when it connects');
    const answeredEvent = s.all('emit').find((e) => e[1] === 'phone_call_answered:ceo');
    assert.equal(answeredEvent[2].callback, true);
    assert.equal(s.lastSlot('ceo'), null, 'nothing left in the saved slot');
    endCall(s, { endedByCall: true });
    assert.deepEqual(s.ringer.callVariablesFor('ceo', 'phone-chat'), { call_answer_seconds: 0, call_is_callback: false });
    assert.equal(s.ringer.callbackFor('ceo'), null, 'after the call the button reads "Call" again (or is gone)');
});

test('a plain outgoing call emits no answered event; a callback cut off by something else is left again', () => {
    const s = setup();
    s.ringer.dial('ceo', { knot: 'desk_call' }, { callback: false });
    s.ringer.outgoingConnected('ceo', s.w.ringerCallId);
    assert.equal(s.all('emit').filter((e) => e[1].startsWith('phone_call_answered')).length, 0);

    const t = setup();
    t.ringer.offer(offer());
    t.ringer.decline('ceo');
    t.ringer.dial('ceo', { knot: 'ring_call', callLabel: 'Boss' }, { callback: true });
    t.ringer.outgoingConnected('ceo', t.w.ringerCallId);
    assert.equal(t.ringer.callbackFor('ceo'), null);
    endCall(t, { endedByCall: false });
    assert.equal(t.ringer.callbackFor('ceo').knot, 'ring_call', 'cut off by a knockout: the player can ring again');
});

test('A4 R2 m2: suspend(false) reopens a kept descriptor once and empties the list, so a later close() drops nothing', () => {
    const s = setup({ aside: { kind: 'phone', thread: 'ceo' } });
    answered(s, {});
    s.ringer.suspend(true);
    endCall(s, { endedByCall: true });
    assert.equal(s.all('reopen').length, 0, 'kept while the conclude is pending');
    s.ringer.suspend(false);
    s.clock.flush();
    assert.equal(s.all('reopen').length, 1, 'reopened when the server refused the ending');
    s.ringer.close();
    assert.equal(s.all('dropDisplaced').length, 0, 'the list was emptied: close() does not give the same phone up again');
    s.ringer.suspend(true);
    s.ringer.suspend(false);
    assert.equal(s.all('reopen').length, 1, 'and a second cycle does not reopen it a second time');
});

test('n3: a voicemail left by a miss clears an older callback (an offer missed without ringing, e.g. lost to a reload)', () => {
    const s = setup();
    s.ringer.restoreCallback('ceo', { knot: 'old_call' });
    assert.equal(s.ringer.callbackFor('ceo').knot, 'old_call');
    s.ringer.missedOffline('ceo', { knot: 'ring_call', onMissed: 'voicemail', voicemailKnot: 'ring_vm', state: 'ringing' });
    assert.equal(s.ringer.callbackFor('ceo'), null, 'the stale callback is gone');
    assert.equal(s.all('voicemail').length, 1);
    assert.equal(s.lastSlot('ceo'), null, 'and the slot is empty');
});

test('n5: the hold limit with onMissed voicemail but no voicemail knot falls back to a callback and keeps the "rang off" toast', () => {
    const s = setup();
    s.w.minigame = true; s.w.openBlocked = true;
    s.ringer.offer(offer({ onMissed: 'voicemail' }));
    s.ringer.answer('ceo');
    s.clock.run(HOLD_MAX_MS + 1000);
    assert.equal(s.ringer.callbackFor('ceo').knot, 'ring_call');
    assert.equal(s.last('toast')[1], 'The CEO rang off. Call back from the thread.', 'the player is told, since no voicemail comes');
});

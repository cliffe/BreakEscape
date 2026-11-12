/**
 * The ringer: a pure state machine for incoming phone calls (phone calls plan 2.2, 2.3).
 *
 * No imports, so node tests load it on its own. Every effect goes through an injected
 * adapter and every timer through an injected clock. The module holds the offer queue,
 * the pause rule and the behaviour of the rows of the 2.3 state table that A2a and A2b
 * (slice column "A2a/b") and A2c build. Rows built later (A3 phone-in-phone, A4 thread
 * rows and reload, A5 outgoing, A6 callbacks and voicemail) are marked as such below.
 *
 * Clock (all of it injected):
 *   { now(): ms, setTimeout(fn, ms): id, clearTimeout(id), defer?(fn) }
 *   `defer` runs a hook's re-check after the swap in progress (the adapter passes
 *   queueMicrotask); without it a hook re-checks at once.
 *
 * Adapter (every method optional; a missing predicate is false, a missing effect a no-op,
 * except openCall, which must exist for a call to open):
 *   Predicates (the world half; the ringer adds its own state to them)
 *     ringBlocked()      a conversation is open, a scripted scene is starting or open or
 *                        queued, the player is knocked out (A2b: any minigame or popup)
 *     openBlocked(info)  a minigame is open, the scripted-scene term, knocked out. `info` is
 *                        { second: true } at the check after the 500 ms open delay: that check
 *                        must ignore the queued-scripted-beat term, because the call is already
 *                        answered and a beat queued during the delay waits behind it (2.1 P4).
 *     conversationOpen() a conversation minigame is open or the scripted-scene term is true
 *     minigameOpen()     a non-conversation minigame is open
 *     knockedOut()       the player is knocked out
 *     isPaused()         the session overlay, pause menu, Mission Brief or a hidden tab
 *     lastHitAt()        clock time of the last hit on the player, or null
 *     outgoingActive()   an outgoing call is dialling or connected (A5)
 *     callMinigameOpen() the connected call's minigame is the open minigame and not ending
 *     openCallId()       the open minigame's params.ringerCall.id, or null
 *   Effects
 *     openCall(offer, info)  start the call's phone-chat; returns falsy when it did not open.
 *                            info = { ringerCall: {id, direction, callback}, resume,
 *                            answerSeconds, isCallback }
 *     putAside()         close an open workstation popup, returning a descriptor, else null (row 11)
 *     reopen(descriptor) reopen what the call displaced (row 25)
 *     showBanner(view) / hideBanner()   the ringing banner (also called to refresh it)
 *     showPill(view) / hidePill()       the hold pill
 *     ringtone(on)       start or stop the looped ringtone
 *     vibrate()          one vibrate (the untilAnswered nudge)
 *     toast(text)        a short notification
 *     displayName(npcId) the contact's display name, for the toast
 *     emit(name, data)   an engine event, name complete ("phone_call_missed:ceo")
 *     setGlobal(map)     apply a `setGlobalOnStart`
 *     savePendingCall(npcId, slot|null)   the contact's saved pendingCall (A4 persists it): one
 *                        slot per contact, { forced: [record, ...], live: record }: every forced
 *                        offer in play order plus the most live non-forced one (see syncSave),
 *                        or null when the contact has no offer
 *     onOutcome(kind, offer, extra)   a call's outcome, for the thread rows (A4) and callbacks
 *                                     (A6). kind: declined, missed, rang_off, ended, dropped.
 *
 * The trigger (the mapping's onceOnly flag, plan 2.7) is NOT persisted here. The owner is
 * npc-manager's _handleEventMapping (A2b), which sets triggered.persist before it calls
 * offer(): it holds the mapping key, the ringer does not; and restore() (a reload) must
 * never persist a trigger a second time.
 *
 * One clock: lastHitAt() must be on the same clock as clock.now() (pass performance.now and
 * stamp hits with it; player-damage-interrupt.js's Date.now stamp must be converted in the
 * adapter). A hit stamped ahead of now() is ignored, never counted as a hit for ever.
 *
 * Every adapter call is guarded: a throw is logged and counts as "returned nothing". A throw
 * from openCall is therefore a refusal (row 19). The ringer is re-entrant: an adapter effect
 * may call offer, answer, decline, callEnded or close synchronously.
 *
 * The end hook (A2b): minigame-manager passes the ending minigame to onMinigameEnded; the
 * adapter reads params.ringerCall.id, _endedByCall and _callFinished off it and calls
 * callEnded(npcId, { id, endedByCall, callFinished }). The ringer ignores a report whose id
 * is not the call it opened. callEnded does its bookkeeping at once and defers its re-check
 * (and any reopen) through clock.defer, because the end hook runs mid-swap (row 32).
 * minigame-manager must call the hook from a `finally`, so a throwing onComplete cannot skip
 * it. As a backstop, an opened call whose callMinigameOpen() stays false for
 * CALL_GONE_AFTER_MS is treated as ended without an own-path flag (row 26 if forced, else row 32).
 */

export const RING_TIMEOUT_MS = 20000;
export const UNTIL_ANSWERED_NUDGE_MS = 10000;
export const AUTO_ANSWER_MS = 6000;
export const RERING_AFTER_LOAD_MS = 3000;
export const HIT_QUIET_MS = 4000;
export const HOLD_MAX_MS = 90000;
export const DIAL_MS = 2500;
export const RING_OUT_MS = 6000;
export const SCRIPTED_CALL_START_MS = 500;
/** After startMinigame refused a call, the tick waits this long before trying again (a hook retries at once). */
export const RETRY_OPEN_MS = 2000;
/** How often the backstop tick re-checks and advances the timers. */
export const TICK_MS = 250;
/** Longest span advance() credits to one step. A longer gap (hidden-tab timer throttling, sleep, a clock change) is dropped as paused time. */
export const MAX_ADVANCE_MS = 4 * TICK_MS;
/** A refused open is given up on after this many refusals and this long since the first (row 19, M3). */
export const MAX_OPEN_REFUSALS = 5;
export const GIVE_UP_AFTER_MS = 4 * RETRY_OPEN_MS;
/** A call that has opened, but whose minigame the adapter has reported gone for this long with no end report, is treated as ended (M2 backstop). */
export const CALL_GONE_AFTER_MS = 6 * TICK_MS;

const DEFAULT_VARS = Object.freeze({ call_answer_seconds: 0, call_is_callback: false });

export function createPhoneRinger({ adapter, clock } = {}) {
    const a = adapter || {};
    const c = clock || {};
    const call = (name, ...args) => {
        if (typeof a[name] !== 'function') return undefined;
        try {
            return a[name](...args);
        } catch (err) {
            if (typeof console !== 'undefined' && console.error) console.error(`phone-ringer: adapter.${name} threw`, err);
            return undefined;
        }
    };
    const now = () => c.now();

    let closed = false;
    /** The one offer that is ringing, held or connected, or null. */
    let active = null;
    /** Offers in `queued` state, first in first out. */
    let queue = [];
    /** { id, npcId, answerSeconds, isCallback } from just before startMinigame to the call's end (2.11). */
    let connecting = null;
    let callSeq = 0;
    let lastAdvance = c.now ? c.now() : 0;
    let tickId = null;
    let running = false;
    let again = false;
    let ui = { kind: null, key: null };
    let ringtoneOn = false;

    // ---- small helpers -------------------------------------------------------------

    const isPaused = () => !!call('isPaused');
    const hitWithin = (ms) => {
        const t = call('lastHitAt');
        if (typeof t !== 'number') return false;
        // A timestamp ahead of the clock (another clock, a clock change) is not a hit (R2 m3).
        const d = now() - t;
        return d >= 0 && d < ms;
    };

    /** The world's half of "a call may not open now" (2.2): the adapter and the hit quiet time. */
    function worldOpenBlocked(second) {
        return !!call('openBlocked', second ? { second: true } : undefined) || hitWithin(HIT_QUIET_MS);
    }

    /** Everything that stops a call opening, the ringer's own state included (2.2). */
    function openBlocked() {
        return closed || worldOpenBlocked(false);
    }

    /** The check the ringer itself uses before it opens: also holds while paused (the pause menu is no minigame). */
    function cannotOpenNow(second) {
        return isPaused() || worldOpenBlocked(second);
    }

    /** Everything that stops an offer starting to ring (2.2). */
    function ringBlocked() {
        if (closed) return true;
        if (active) return true;
        if (call('outgoingActive')) return true;
        return !!call('ringBlocked');
    }

    function pillShowing(o) {
        return !!o && o.state === 'held' && !!call('minigameOpen')
            && !call('conversationOpen') && !call('knockedOut');
    }

    function record(o) {
        return {
            knot: o.knot,
            state: o.saveAs || o.state,
            disableClose: o.disableClose,
            resume: o.resume,
            onMissed: o.onMissed,
            voicemailKnot: o.voicemailKnot,
            withheld: o.withheld,
            untilAnswered: o.untilAnswered,
            callLabel: o.callLabel,
            opening: o.opening,
            answerSeconds: o.answerSeconds,
            // A call that never rang has not applied this yet; a restored one must (R5 M2).
            setGlobalOnStart: o.started ? undefined : o.setGlobalOnStart || undefined,
        };
    }
    /** Higher is more live. A connected call (or a forced one waiting to re-ring) outranks the rest. */
    // A forced call that has been connected (o.keep, R3 M1) outranks everything, a connected
    // non-forced call included, so a restored one keeps the save slot (R3 m1).
    const rank = (o) => (o.keep ? 4 : (o.state === 'connected' || o.saveAs === 'connected') ? 3
        : (o.state === 'ringing' || o.state === 'held') ? 2 : 1);

    /**
     * One saved slot per contact (2.7). R5 M2: the slot is
     *   { forced: [record, ...], live: record }
     * `forced` holds every forced (`keep`) offer of the contact in play order (the active one,
     * then the queue), so nothing is lost across a reload with two forced calls queued. `live` is
     * the contact's single most live non-forced offer (connected, then ringing or held, then
     * queued) and is left out when there is none. The whole slot is null when the contact has
     * no offer. Plain JSON. restore() re-queues the forced entries; A4 turns `live` into a
     * missed call.
     */
    function syncSave(npcId) {
        const mine = [];
        if (active && active.npcId === npcId) mine.push(active);
        for (const q of queue) if (q.npcId === npcId) mine.push(q);
        const forced = mine.filter((o) => o.keep);
        let best = null;
        for (const o of mine) if (!o.keep && (!best || rank(o) > rank(best))) best = o;
        let slot = null;
        if (forced.length || best) {
            slot = { forced: forced.map(record) };
            if (best) slot.live = record(best);
        }
        call('savePendingCall', npcId, slot);
    }
    const save = (o) => syncSave(o.npcId);

    function eventData(o, extra) {
        return { npcId: o.npcId, knot: o.knot, ...(extra || {}) };
    }

    function ringtone(on) {
        if (on === ringtoneOn) return;
        ringtoneOn = on;
        call('ringtone', on);
    }

    // ---- time ----------------------------------------------------------------------

    /** Bring the unpaused timers up to date. Runs first in every entry point. */
    function advance() {
        const t = now();
        const dt = t - lastAdvance;
        lastAdvance = t;
        if (dt <= 0 || dt > MAX_ADVANCE_MS || isPaused() || !active) return;
        if (active.state === 'ringing') active.ringMs += dt;
        else if (active.state === 'held' && pillShowing(active)) active.holdMs += dt;
    }

    function ensureTick() {
        if (tickId !== null || (closed && !active)) return;
        if (!active && queue.length === 0) return;
        tickId = c.setTimeout(() => {
            tickId = null;
            try {
                advance();
                run();
            } finally {
                ensureTick();
            }
        }, TICK_MS);
    }

    // ---- rendering -----------------------------------------------------------------

    function view(o, extra) {
        return {
            npcId: o.npcId,
            knot: o.knot,
            callLabel: o.callLabel,
            withheld: o.withheld,
            forced: o.disableClose,
            untilAnswered: o.untilAnswered,
            ...(extra || {}),
        };
    }

    function render() {
        const o = active;
        let want = null;
        if (o && o.state === 'ringing') {
            const over = !!call('minigameOpen');
            want = { kind: 'banner', key: `b:${o.npcId}:${o.knot}:${over}`, v: view(o, { overMinigame: over }) };
        } else if (o && pillShowing(o)) {
            want = { kind: 'pill', key: `p:${o.npcId}:${o.knot}`, v: view(o, { canHangUp: !o.disableClose }) };
        }
        // ui is updated before the adapter is called, so a re-entrant render sees the new state.
        const prev = ui;
        if (!want) {
            ui = { kind: null, key: null };
            if (prev.kind === 'banner') call('hideBanner');
            else if (prev.kind === 'pill') call('hidePill');
        } else if (want.key !== prev.key) {
            ui = { kind: want.kind, key: want.key };
            if (prev.kind && prev.kind !== want.kind) call(prev.kind === 'banner' ? 'hideBanner' : 'hidePill');
            call(want.kind === 'banner' ? 'showBanner' : 'showPill', want.v);
        }
        // Ringtone: loops while ringing and not paused; an untilAnswered call stops looping
        // after RING_TIMEOUT_MS (its nudges are vibrations, run()).
        const loud = !!o && o.state === 'ringing' && !isPaused()
            && !(o.untilAnswered && o.ringMs >= RING_TIMEOUT_MS);
        ringtone(loud);
    }

    // ---- the state machine ---------------------------------------------------------

    function startRinging(o) {
        o.state = 'ringing';
        active = o;
        if (o.rering) {
            // Row 26: a forced call rings again after a hit; answerSeconds is kept.
            o.rering = false;
            o.ringMs = 0;
            o.nextNudge = RING_TIMEOUT_MS;
            o.resumeCall = true;
        }
        o.saveAs = null;
        if (!o.started) {
            o.started = true;
            if (o.setGlobalOnStart) call('setGlobal', o.setGlobalOnStart);
        }
        save(o);
    }

    /** Back to the head of the queue with its elapsed time kept (rows 23, 24, 26). */
    function requeueHead(o, saveAs) {
        o.state = 'queued';
        o.saveAs = saveAs || null;
        active = null;
        queue.unshift(o);
        save(o);
    }

    /** The offer is over. The slot goes to the contact's other live offer, if it has one (M7). */
    function finishOffer(o) {
        if (active === o) active = null;
        queue = queue.filter((x) => x !== o);
        if (o.openTimer) { c.clearTimeout(o.openTimer); o.openTimer = null; }
        syncSave(o.npcId);
    }

    /** The call it displaced comes back, if the world allows it now (row 25; never once the ending has started, choice 2). */
    function reopenDisplaced(d) {
        if (d && !closed && !call('openBlocked') && !hitWithin(HIT_QUIET_MS)) call('reopen', d);
    }

    /** A popup the offer put aside comes back when the offer ends without the call (hang-up, rang off; R2 m2). */
    function takeDisplacedBack(o) {
        const d = o.displaced;
        o.displaced = null;
        reopenDisplaced(d);
    }

    /** Run a re-check after the swap in progress. */
    function afterSwap(fn) {
        if (typeof c.defer === 'function') c.defer(fn); else fn();
    }

    /** Rows 20, 17: declined, or hung up from hold. */
    function decline(npcId) {
        advance();
        const o = active;
        if (!o || o.npcId !== npcId || o.state !== 'ringing' || o.disableClose) return false;
        declineOffer(o);
        return true;
    }

    function hangUp(npcId) {
        advance();
        const o = active;
        if (!o || o.npcId !== npcId || o.state !== 'held' || o.disableClose) return false;
        declineOffer(o);
        return true;
    }

    function declineOffer(o) {
        finishOffer(o);
        call('emit', `phone_call_declined:${o.npcId}`, eventData(o));
        call('onOutcome', 'declined', o);
        takeDisplacedBack(o);
        run();
    }

    /** Row 21 (ring timeout) and row 18 (rang off after the hold limit). */
    function miss(o, cause) {
        finishOffer(o);
        call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
        if (cause === 'rang_off') {
            if (o.onMissed !== 'voicemail') {
                // With onMissed "voicemail" the voicemail toast (A6) replaces this one.
                const name = call('displayName', o.npcId);
                call('toast', o.withheld || !name
                    ? 'The caller rang off.'
                    : `${name} rang off. Call back from the thread.`);
            }
            call('onOutcome', 'rang_off', o);
        } else {
            call('onOutcome', 'missed', o);
        }
        takeDisplacedBack(o);
        run();
    }

    /** Answer: rows 9, 11, 12, 22 (and the A3 phone cases by what the adapter reports). */
    function answerOffer(o, auto) {
        advance();
        if (o.answerSeconds == null) {
            // answerMs is ringing carried over from calls this one replaced (row 4).
            const total = o.answerMs + o.ringMs;
            o.answerSeconds = Math.floor((auto ? Math.min(total, AUTO_ANSWER_MS) : total) / 1000);
        }
        ringtone(false);
        if (cannotOpenNow(false)) {
            // Row 12: held. The ring has stopped for good.
            o.state = 'held';
            save(o);
            render();
            return;
        }
        beginOpen(o);
    }

    function answer(npcId) {
        advance();
        const o = active;
        if (!o || o.npcId !== npcId || o.state !== 'ringing') return false;
        answerOffer(o, false);
        return true;
    }

    /** Rows 9 and 13: connected, opening after SCRIPTED_CALL_START_MS. */
    function beginOpen(o) {
        o.state = 'connected';
        o.opened = false;
        save(o);
        render();
        o.openTimer = c.setTimeout(() => finishOpen(o), SCRIPTED_CALL_START_MS);
        // Emit last, once the state is settled: a handler may re-enter the ringer.
        if (!o.answeredEmitted) {
            o.answeredEmitted = true;
            call('emit', `phone_call_answered:${o.npcId}`,
                eventData(o, { answerSeconds: o.answerSeconds, callback: false }));
        }
    }

    /** Back to held with the call never on screen (row 19). */
    function backToHeld(o) {
        o.state = 'held';
        o.opened = false;
        connecting = null;
        save(o);
        render();
    }

    /** An offer that can't be opened any more. Silent once the ending has started (row 28), else missed. */
    function giveUp(o) {
        finishOffer(o);
        connecting = null;
        if (!closed) {
            call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
            call('onOutcome', 'dropped', o);
            const d = o.displaced;
            o.displaced = null;
            reopenDisplaced(d);
        }
        run();
    }

    function finishOpen(o) {
        o.openTimer = null;
        if (active !== o || o.state !== 'connected') return;
        advance();
        // The second check, after the wait (rows 13, 19). It ignores the queued-scripted-beat
        // term and the ringer's own `closed`: the call is answered, so it is connected
        // (opening included, 2.2) and a beat or the ending waits for it. It does hold
        // while paused (m8).
        if (cannotOpenNow(true)) {
            if (closed) giveUp(o); else backToHeld(o);
            return;
        }
        const d = call('putAside');
        if (d && !o.displaced) o.displaced = d;
        const id = `call-${++callSeq}`;
        connecting = { id, npcId: o.npcId, answerSeconds: o.answerSeconds || 0, isCallback: false };
        const opened = call('openCall', o, {
            ringerCall: { id, direction: 'incoming', callback: false },
            resume: !!(o.resume || o.resumeCall),
            answerSeconds: o.answerSeconds || 0,
            isCallback: false,
        });
        // openCall may have re-entered (the call ended, the offer was dropped): act only if still ours.
        if (active !== o || o.state !== 'connected' || !connecting || connecting.id !== id) return;
        if (!opened) {
            // Row 19; a throw counts as a refusal. Give up on one that never clears (M3).
            if (!o.firstRefusalAt) o.firstRefusalAt = now();
            o.refusals += 1;
            if (closed || (o.refusals >= MAX_OPEN_REFUSALS && now() - o.firstRefusalAt >= GIVE_UP_AFTER_MS)) {
                giveUp(o);
                return;
            }
            o.retryAt = now() + RETRY_OPEN_MS;
            backToHeld(o);
            return;
        }
        o.opened = true;
        o.refusals = 0;
        o.firstRefusalAt = 0;
        run();
    }

    /**
     * The call's minigame has ended. The adapter's end hook reports which path it took:
     * endedByCall (End, back arrow, #exit_conversation, the story's end) and callFinished
     * (a ringer call's story had ended before the close). Rows 25, 26, 32.
     */
    function callEnded(npcId, info) {
        advance();
        const o = active;
        if (!o || o.npcId !== npcId || o.state !== 'connected') return false;
        // Only the end of the call this ringer opened counts (M6): a stale or duplicate
        // report, or one for another phone-chat of the contact, is ignored.
        if (!info || !connecting || info.id !== connecting.id) return false;
        return finishCall(o, !!(info.endedByCall || info.callFinished));
    }

    /**
     * The connected call is over (an end report, or the M2 backstop with own = false).
     * Own-path: row 25. Not own: row 26 for a forced call, row 32 otherwise.
     */
    function finishCall(o, own) {
        connecting = null;
        o.goneSince = 0;
        let reopenWhat = null;
        if (own) {
            // Row 25: the story position was reset inside the call already.
            reopenWhat = o.displaced;
            o.displaced = null;
            finishOffer(o);
            call('onOutcome', 'ended', o, { displaced: !!reopenWhat });
        } else if (o.disableClose && !closed) {
            // Row 26: rings again once there has been no hit for HIT_QUIET_MS. The popup it put
            // aside stays in o.displaced, so it comes back when the call finally ends (R2 m2).
            o.rering = true;
            o.keep = true;
            o.opened = false;
            requeueHead(o, 'connected');
        } else if (o.disableClose) {
            // A forced call hit after the ending began: it never rings again (row 28).
            o.displaced = null;
            finishOffer(o);
            call('onOutcome', 'dropped', o);
        } else {
            // Row 32: closed by something else. Missed, no toast; A6 adds the callback.
            o.displaced = null;
            finishOffer(o);
            call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
            call('onOutcome', 'dropped', o);
        }
        render();
        // The end hook runs inside another minigame's start (row 32): the re-check, and the
        // reopen decision, wait until that swap is done (M5).
        afterSwap(() => {
            reopenDisplaced(reopenWhat);
            advance();
            run();
        });
        return true;
    }

    /** Re-check everything; the body of every hook and of the tick. */
    function run() {
        if (running) { again = true; return; }
        running = true;
        try {
            do {
                again = false;
                runOnce();
            } while (again);
        } finally {
            running = false;
        }
        render();
        ensureTick();
    }

    /**
     * M2 backstop: an opened call whose minigame the adapter says is gone, and stays gone, had its
     * end report lost (a throwing onComplete, the stray guard). Treated as ended without an
     * own-path flag: row 26 for a forced call (the player did not choose to close it, so it must
     * come back), row 32 otherwise (we cannot know the story position was reset, so no row 25 and
     * no popup reopen). CALL_GONE_AFTER_MS spares the swap between two minigames.
     */
    function checkCallGone() {
        const o = active;
        if (!o || o.state !== 'connected' || !o.opened) return false;
        if (call('callMinigameOpen') !== false) { o.goneSince = 0; return false; }
        if (!o.goneSince) { o.goneSince = now(); return false; }
        if (now() - o.goneSince < CALL_GONE_AFTER_MS) return false;
        finishCall(o, false);
        return true;
    }

    function runOnce() {
        if (checkCallGone()) again = true;
        if (closed) return;
        const o = active;
        if (o && o.state === 'ringing') {
            if (call('ringBlocked')) {
                // Rows 23 and 24: a conversation opened, or the player was knocked out.
                requeueHead(o);
            } else if (o.disableClose) {
                // Row 22: a forced call answers itself.
                if (!isPaused() && o.ringMs >= AUTO_ANSWER_MS && !hitWithin(HIT_QUIET_MS)) {
                    answerOffer(o, true);
                    again = true;
                }
            } else if (!o.untilAnswered) {
                // Row 21.
                if (o.ringMs >= RING_TIMEOUT_MS) { miss(o, 'timeout'); again = true; }
            } else if (o.ringMs >= o.nextNudge) {
                // Row 21, untilAnswered: the ringtone stops looping; vibrate every nudge.
                while (o.ringMs >= o.nextNudge) o.nextNudge += UNTIL_ANSWERED_NUDGE_MS;
                call('vibrate');
            }
        } else if (o && o.state === 'held') {
            // Row 18: the hold limit, only while the pill shows (advance() counts only then).
            if (!o.disableClose && o.holdMs >= HOLD_MAX_MS) { miss(o, 'rang_off'); again = true; return; }
            // Rows 13 to 16: open once nothing blocks it; row 19 and the second check follow.
            if (!cannotOpenNow(false) && now() >= o.retryAt) { beginOpen(o); }
        }
        // Row 8: the head of the queue starts ringing.
        if (!active && queue.length > 0) {
            const head = queue[0];
            if (!ringBlocked() && !(head.rering && hitWithin(HIT_QUIET_MS)) && now() >= head.notBefore) {
                queue.shift();
                startRinging(head);
                again = true;
            }
        }
    }

    // ---- offers (rows 1 to 8) ------------------------------------------------------

    function makeOffer(raw) {
        const forced = !!raw.disableClose;
        return {
            npcId: raw.npcId,
            knot: raw.knot,
            disableClose: forced,
            resume: raw.resume || false,
            onMissed: raw.onMissed === 'voicemail' ? 'voicemail' : 'callback',
            voicemailKnot: typeof raw.voicemailKnot === 'string' ? raw.voicemailKnot : null,
            withheld: !!raw.withheld,
            untilAnswered: !!raw.untilAnswered && !forced,
            callLabel: typeof raw.callLabel === 'string' ? raw.callLabel : null,
            opening: !!raw.opening,
            setGlobalOnStart: raw.setGlobalOnStart && typeof raw.setGlobalOnStart === 'object'
                ? raw.setGlobalOnStart : null,
            ringMs: Number.isFinite(raw.ringMs) ? raw.ringMs : 0,
            answerSeconds: Number.isFinite(raw.answerSeconds) ? raw.answerSeconds : null,
            state: 'queued',
            holdMs: 0,
            started: false,
            rering: false,
            resumeCall: false,
            displaced: null,
            nextNudge: RING_TIMEOUT_MS,
            openTimer: null,
            opened: false,
            retryAt: 0,
            answeredEmitted: false,
            answerMs: 0,
            refusals: 0,
            firstRefusalAt: 0,
            notBefore: 0,
            goneSince: 0,
            saveAs: null,
            restored: false,
            keep: forced,       // R4 M1: a forced offer is protected from the moment it is offered, until it ends
        };
    }

    /**
     * Offer a call. Returns 'ringing', 'queued', 'dropped' (row 3), 'replaced' (row 4)
     * or 'refused' (closed, or malformed).
     */
    function offer(raw) {
        if (!raw || typeof raw.npcId !== 'string' || typeof raw.knot !== 'string' || !raw.npcId || !raw.knot) {
            return 'refused';
        }
        if (closed) return 'refused';
        advance();
        // The trigger is persisted by the caller before this (see the header), not here.
        // A forced offer is never replaced, from the moment it is offered until it ends (R4 M1):
        // a new offer for the contact queues behind it (row 5) and the same knot is dropped
        // (row 3). Row 4 replaces only the contact's ringing, held or queued non-forced offer.
        // The protection is the `keep` flag, set in makeOffer for a forced offer and in restore(),
        // whatever state the call is in (queued, ringing, held, connected, requeued by rows 23/24).
        // R5 M1: a knot already forced for this contact (any of its live offers, first or not) is
        // dropped. R5 m2: so is a non-forced offer for the knot that is connected right now.
        const mine = [active, ...queue].filter((x) => x && x.npcId === raw.npcId);
        if (mine.some((x) => x.keep && x.knot === raw.knot)) return 'dropped';
        if (!raw.disableClose && active && active.npcId === raw.npcId && active.state === 'connected'
            && active.knot === raw.knot) return 'dropped';
        const existing = queue.find((x) => x.npcId === raw.npcId && !x.keep)
            || (active && active.npcId === raw.npcId && !active.keep && active.state !== 'connected' ? active : null);
        if (existing) {
            if (existing.knot === raw.knot) return 'dropped';           // row 3
            replace(existing, makeOffer(raw));                           // row 4
            run();
            return 'replaced';
        }
        const o = makeOffer(raw);
        queue.push(o);                                                   // rows 2, 5, 6 by ringBlocked
        save(o);
        run();
        return o.state;
    }

    /**
     * Row 4: the new offer takes the old one's place and state. A ringing call restarts
     * its ring; a held call keeps its hold and its answerSeconds. No row, no event.
     */
    function replace(old, next) {
        // Ringing the player has already sat through still counts towards call_answer_seconds (2.11, m4).
        next.answerMs = old.answerMs + old.ringMs;
        if (old.state === 'queued') {
            queue[queue.indexOf(old)] = next;
            save(next);
            return;
        }
        if (old.state === 'ringing') {
            next.state = 'ringing';
            next.started = true;
            if (next.setGlobalOnStart) call('setGlobal', next.setGlobalOnStart);
            active = next;
            save(next);
            return;
        }
        // held
        next.state = 'held';
        next.holdMs = old.holdMs;
        next.answerSeconds = old.answerSeconds;
        next.answeredEmitted = old.answeredEmitted;
        next.displaced = old.displaced;
        next.started = true;
        if (next.setGlobalOnStart) call('setGlobal', next.setGlobalOnStart);
        active = next;
        save(next);
    }

    // ---- row 28 --------------------------------------------------------------------

    /** The ending starts: queued, ringing and held offers go with no rows and no events. */
    function close() {
        advance();
        closed = true;
        // A call that is connected, opening included (2.2), finishes normally (choice 3).
        const gone = queue.slice();
        queue = [];
        if (active && active.state !== 'connected') gone.push(active);
        for (const o of gone) {
            if (active === o) active = null;
            if (o.openTimer) { c.clearTimeout(o.openTimer); o.openTimer = null; }
        }
        for (const o of gone) syncSave(o.npcId);
        if (!active) connecting = null;
        render();
        if (!active && tickId !== null) { c.clearTimeout(tickId); tickId = null; }
    }

    /**
     * A reload (row 27, forced calls; A4 makes non-forced ones missed before it gets here).
     * Re-queues a saved pendingCall record to ring again RERING_AFTER_LOAD_MS from now, opening
     * with `resume` and the saved answerSeconds. It never applies setGlobalOnStart, never emits
     * phone_call_answered a second time once answerSeconds is set, and never persists a trigger.
     */
    function restore(npcId, rec) {
        if (closed || typeof npcId !== 'string' || !npcId || !rec || typeof rec !== 'object') return 'refused';
        // R5 M2: the saved slot is { forced: [...], live }. The old single-record shape (a record
        // with a knot) is one forced entry.
        const entries = (Array.isArray(rec.forced) ? rec.forced : [rec])
            .filter((e) => e && typeof e.knot === 'string' && e.knot);
        if (!entries.length) return 'refused';
        // A contact's connected call, or an earlier restore, is the one a reload brings back: a
        // second restore is dropped (R2 m1). A fresh forced offer on another knot does not block it
        // (R5 m1); it just waits behind the restored calls.
        const mine = () => [active, ...queue].filter((x) => x && x.npcId === npcId);
        if (mine().some((x) => x.restored || (x.state === 'connected' && x.npcId === npcId))) return 'dropped';
        advance();
        // Restored calls go ahead of any other offer queued for the contact, in saved order.
        let at = queue.findIndex((x) => x.npcId === npcId);
        let first = null;
        for (const e of entries) {
            if (mine().some((x) => x.knot === e.knot)) continue;
            const o = makeOffer({ ...e, disableClose: true, npcId, ringMs: 0 });
            o.keep = true;
            o.restored = true;
            o.notBefore = now() + RERING_AFTER_LOAD_MS;
            if (e.state !== 'queued') {
                // It was on the line (or ringing or held): it rings again with resume, no second
                // answered event, no setGlobalOnStart. A call that never rang is a fresh offer.
                o.started = true;
                o.answeredEmitted = o.answerSeconds != null;
                o.rering = true;
                o.saveAs = 'connected';
                o.setGlobalOnStart = null;
            }
            if (at >= 0) queue.splice(at++, 0, o); else queue.push(o);
            first = first || o;
        }
        if (!first) return 'dropped';
        save(first);
        run();
        return first.state;
    }

    // ---- hooks ---------------------------------------------------------------------

    function nudge() {
        const go = () => {
            advance();
            if (active) active.retryAt = 0;     // a hook retries a refused open at once
            run();
        };
        if (typeof c.defer === 'function') c.defer(go); else go();
    }

    // ---- queries -------------------------------------------------------------------

    /**
     * True while a call the ringer owns is connected: from the moment it decides to open
     * the call until the call's minigame has ended. Read live from the adapter once the
     * minigame has opened (2.2).
     */
    function callActive() {
        if (!!call('outgoingActive')) return true;
        const o = active;
        if (!o || o.state !== 'connected') return false;
        if (!o.opened) return true;
        const open = call('callMinigameOpen');
        return open === undefined ? true : !!open;
    }

    /** The two engine VARs for the caller's ink (2.11). */
    function callVariablesFor(npcId, channel) {
        if (channel === 'phone-chat' && connecting && connecting.npcId === npcId
            && call('openCallId') === connecting.id) {
            return { call_answer_seconds: connecting.answerSeconds, call_is_callback: connecting.isCallback };
        }
        return { ...DEFAULT_VARS };
    }

    /** Row 30: any offer marked `opening` that is still queued, ringing or held. */
    function hasOpeningOffer() {
        const all = active && active.state !== 'connected' ? [active, ...queue] : queue;
        return all.some((o) => o.opening);
    }

    function stateOf(npcId) {
        if (active && active.npcId === npcId) return active.state;
        const q = queue.find((o) => o.npcId === npcId);
        return q ? q.state : null;
    }

    return {
        offer,
        restore,
        answer,
        decline,
        hangUp,
        callEnded,
        close,
        tick() { advance(); run(); },
        onMinigameStarted: nudge,
        onMinigameEnded: nudge,
        onPopupClosed: nudge,
        onGameLoaded: nudge,
        callActive,
        ringBlocked,
        openBlocked,
        callVariablesFor,
        hasOpeningOffer,
        stateOf,
        isClosed: () => closed,
        queueLength: () => queue.length,
        /** The current offer (ringing, held or connected), for the adapter and tests. */
        current: () => (active ? { ...active, openTimer: undefined } : null),
    };
}

export default createPhoneRinger;

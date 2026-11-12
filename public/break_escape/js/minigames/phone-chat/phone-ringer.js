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
 *     openBlocked()      a minigame is open, the scripted-scene term, knocked out
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
 *     persistTrigger(offer)     persist the mapping's onceOnly trigger (2.7), at offer time
 *     savePendingCall(npcId, record|null)   the saved pendingCall (A4 persists it)
 *     onOutcome(kind, offer, extra)   a call's outcome, for the thread rows (A4) and callbacks
 *                                     (A6). kind: declined, missed, rang_off, ended, dropped.
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

const DEFAULT_VARS = Object.freeze({ call_answer_seconds: 0, call_is_callback: false });

export function createPhoneRinger({ adapter, clock } = {}) {
    const a = adapter || {};
    const c = clock || {};
    const call = (name, ...args) => (typeof a[name] === 'function' ? a[name](...args) : undefined);
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
        return typeof t === 'number' && now() - t < ms;
    };

    /** Everything that stops a call opening, the ringer's own state included (2.2). */
    function openBlocked() {
        return closed || !!call('openBlocked') || hitWithin(HIT_QUIET_MS);
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

    function record(o, stateOverride) {
        return {
            knot: o.knot,
            state: stateOverride || o.state,
            disableClose: o.disableClose,
            resume: o.resume,
            onMissed: o.onMissed,
            voicemailKnot: o.voicemailKnot,
            withheld: o.withheld,
            untilAnswered: o.untilAnswered,
            callLabel: o.callLabel,
            answerSeconds: o.answerSeconds,
        };
    }
    const save = (o, stateOverride) => call('savePendingCall', o.npcId, record(o, stateOverride));
    const clearSave = (o) => call('savePendingCall', o.npcId, null);

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
        if (dt <= 0 || isPaused() || !active) return;
        if (active.state === 'ringing') active.ringMs += dt;
        else if (active.state === 'held' && pillShowing(active)) active.holdMs += dt;
    }

    function ensureTick() {
        if (tickId !== null || (closed && !active)) return;
        if (!active && queue.length === 0) return;
        tickId = c.setTimeout(() => {
            tickId = null;
            advance();
            run();
            ensureTick();
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
        if (!want) {
            if (ui.kind === 'banner') call('hideBanner');
            else if (ui.kind === 'pill') call('hidePill');
            ui = { kind: null, key: null };
        } else if (want.key !== ui.key) {
            if (ui.kind && ui.kind !== want.kind) call(ui.kind === 'banner' ? 'hideBanner' : 'hidePill');
            call(want.kind === 'banner' ? 'showBanner' : 'showPill', want.v);
            ui = { kind: want.kind, key: want.key };
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
            o.nextNudge = RING_TIMEOUT_MS + UNTIL_ANSWERED_NUDGE_MS;
            o.resumeCall = true;
        }
        if (!o.started) {
            o.started = true;
            if (o.setGlobalOnStart) call('setGlobal', o.setGlobalOnStart);
        }
        save(o);
    }

    /** Back to the head of the queue with its elapsed time kept (rows 23, 24, 26). */
    function requeueHead(o, stateOverride) {
        o.state = 'queued';
        active = null;
        queue.unshift(o);
        save(o, stateOverride);
    }

    function finishOffer(o) {
        if (active === o) active = null;
        queue = queue.filter((x) => x !== o);
        clearSave(o);
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
        run();
    }

    /** Answer: rows 9, 11, 12, 22 (and the A3 phone cases by what the adapter reports). */
    function answerOffer(o, auto) {
        advance();
        if (o.answerSeconds == null) {
            const ms = auto ? Math.min(o.ringMs, AUTO_ANSWER_MS) : o.ringMs;
            o.answerSeconds = Math.floor(ms / 1000);
        }
        ringtone(false);
        if (openBlocked()) {
            // Row 12: held. The ring has stopped for good.
            o.state = 'held';
            save(o);
            render();
            return;
        }
        const d = call('putAside');
        if (d && !o.displaced) o.displaced = d;
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
        if (!o.answeredEmitted) {
            o.answeredEmitted = true;
            call('emit', `phone_call_answered:${o.npcId}`,
                eventData(o, { answerSeconds: o.answerSeconds, callback: false }));
        }
        save(o);
        render();
        o.openTimer = c.setTimeout(() => finishOpen(o), SCRIPTED_CALL_START_MS);
    }

    /** Back to held with the call never on screen (row 19). */
    function backToHeld(o) {
        o.state = 'held';
        o.opened = false;
        connecting = null;
        save(o);
        render();
    }

    function finishOpen(o) {
        o.openTimer = null;
        if (active !== o || o.state !== 'connected') return;
        advance();
        // The second check, after the wait (row 13, row 19).
        if (openBlocked()) { backToHeld(o); return; }
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
        if (!opened) { o.retryAt = now() + RETRY_OPEN_MS; backToHeld(o); return; }
        o.opened = true;
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
        if (o.openTimer) { c.clearTimeout(o.openTimer); o.openTimer = null; }
        connecting = null;
        const own = !!(info && (info.endedByCall || info.callFinished));
        if (own) {
            // Row 25: the story position was reset inside the call already.
            const displaced = o.displaced;
            o.displaced = null;
            finishOffer(o);
            call('onOutcome', 'ended', o, { displaced: !!displaced });
            if (displaced && !call('openBlocked') && !hitWithin(HIT_QUIET_MS)) {
                call('reopen', displaced);
            }
        } else if (o.disableClose) {
            // Row 26: rings again once there has been no hit for HIT_QUIET_MS.
            o.rering = true;
            o.opened = false;
            o.displaced = null;
            requeueHead(o, 'connected');
        } else {
            // Row 32: closed by something else. Missed, no toast; A6 adds the callback.
            finishOffer(o);
            call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
            call('onOutcome', 'dropped', o);
        }
        run();
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

    function runOnce() {
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
            if (!openBlocked() && now() >= o.retryAt) { beginOpen(o); }
        }
        // Row 8: the head of the queue starts ringing.
        if (!active && queue.length > 0) {
            const head = queue[0];
            if (!ringBlocked() && !(head.rering && hitWithin(HIT_QUIET_MS))) {
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
            nextNudge: RING_TIMEOUT_MS + UNTIL_ANSWERED_NUDGE_MS,
            openTimer: null,
            opened: false,
            retryAt: 0,
            answeredEmitted: false,
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
        // The trigger is persisted at offer time, before anything else decides (2.7).
        call('persistTrigger', raw);

        const existing = queue.find((x) => x.npcId === raw.npcId)
            || (active && active.npcId === raw.npcId && active.state !== 'connected' ? active : null);
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
        const gone = queue.slice();
        queue = [];
        if (active && active.state !== 'connected') gone.push(active);
        else if (active && active.state === 'connected' && !active.opened) gone.push(active);
        for (const o of gone) {
            if (o.openTimer) { c.clearTimeout(o.openTimer); o.openTimer = null; }
            if (active === o) active = null;
            clearSave(o);
        }
        if (!active) connecting = null;
        render();
        if (tickId !== null) { c.clearTimeout(tickId); tickId = null; }
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

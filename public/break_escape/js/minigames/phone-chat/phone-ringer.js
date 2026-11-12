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
 *     phoneHost(npcId)   (A3, row 10) true when the player's own phone is open and is the
 *                        caller's phone: the call rings inside it (view.inPhone) and opens over
 *                        it. ringBlocked(npcId), openBlocked({ npcId, second? }) and
 *                        minigameOpen(npcId) then treat that phone as no obstacle. Any other
 *                        open phone-chat (a desk phone, a DM app) is a minigame (row 12).
 *   Effects
 *     openCall(offer, info)  start the call's phone-chat; returns falsy when it did not open.
 *                            info = { ringerCall: {id, direction, callback}, resume,
 *                            answerSeconds, isCallback }
 *     putAside(npcId)    close an open workstation popup (row 11) or the player's phone (row 10),
 *                        returning a descriptor, else null
 *     reopen(descriptor) reopen what the call displaced (row 25)
 *     dropDisplaced(descriptor)  a descriptor that will not come back (a hit before End, row 32, a
 *                        queued beat, the ending, giveUp, a second descriptor): the adapter owes the
 *                        thread's skipped conversation_closed for a phone (A3 R1 M1)
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
 *     onOutcome(kind, offer, extra)   a call's outcome, for the thread rows (A4). kind: declined,
 *                                     missed, rang_off, ended, dropped, no_answer.
 *     voicemail(offer, { quiet })   (A6) run the offer's voicemail knot into the contact's thread;
 *                        `quiet` (a reload) shows no toast
 *     callbackChanged(npcId)   (A6) the contact's callback was set or cleared: refresh the call
 *                        button and the missed row's button
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
/** Sweep item 9: the longest a queued or ringing offer is held by an active tutorial step, in unpaused time. */
export const TUTORIAL_HOLD_MS = 20000;
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
    /** A3 R1 m5: an ending's conclude is pending. Nothing starts ringing or opens; offers stay as they are and the tick runs. */
    let suspended = false;
    /** Descriptors whose call ended during a suspension (A3 R2 n1), waiting for the server's answer. */
    let keptDisplaced = [];
    /** The one offer that is ringing, held or connected, or null. */
    let active = null;
    /** Offers in `queued` state, first in first out. */
    let queue = [];
    /** { id, npcId, answerSeconds, isCallback } from just before startMinigame to the call's end (2.11). */
    let connecting = null;
    /**
     * Pending callbacks, one per contact (A6, plan 2.6): { knot, callLabel }. What a missed call
     * leaves when onMissed is "callback". The ringer owns them so every slot it saves carries them
     * (A4 R2 n5) and a reload hands them back through restoreCallback.
     */
    const callbacks = new Map();
    // A voicemail that has not run yet (held behind the contact's open thread, or loading): npcId -> [{ knot, withheld }].
    // Saved in the slot as a missed call that owes a voicemail, so a reload still delivers it (A6 R1 M1).
    const voicemails = new Map();
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
    function worldOpenBlocked(second, npcId) {
        // `npcId` (A3): which contact is calling, so the adapter can tell the player's own phone
        // (the call opens over it, row 10) from a desk phone or a DM app (a minigame, row 12).
        const info = {};
        if (second) info.second = true;
        if (npcId) info.npcId = npcId;
        return !!call('openBlocked', Object.keys(info).length ? info : undefined) || hitWithin(HIT_QUIET_MS);
    }

    /** Everything that stops a call opening, the ringer's own state included (2.2). */
    function openBlocked() {
        return closed || suspended || worldOpenBlocked(false);
    }

    /** The check the ringer itself uses before it opens: also holds while paused (the pause menu is no minigame). */
    function cannotOpenNow(second, npcId) {
        return suspended || isPaused() || worldOpenBlocked(second, npcId);
    }

    /** Everything that stops an offer starting to ring (2.2). */
    function ringBlocked() {
        if (closed || suspended) return true;
        if (active) return true;
        if (call('outgoingActive')) return true;
        return !!call('ringBlocked', queue[0] && queue[0].npcId);
    }

    /**
     * Sweep item 9: should this offer still be held by the tutorial? Full hold while the opening
     * accept/skip modal is up (no timer runs). While a step panel shows, hold for at most
     * TUTORIAL_HOLD_MS of unpaused time from when the offer first met the step, or until the step
     * completes (its token changes) or the tutorial ends (no step), whichever first. advance() accrues
     * the unpaused time while `tutHolding` is set. Forced calls follow the same rule.
     */
    function tutorialHold(o) {
        if (call('tutorialPromptOpen') === true) { o.tutHolding = false; return true; }
        const step = call('tutorialStep');
        const hasStep = step !== null && step !== undefined && step !== false;
        if (!hasStep) { o.tutStep = undefined; o.tutHoldMs = 0; o.tutHolding = false; return false; }
        if (o.tutStep === undefined) o.tutStep = step;          // anchor on the first active step met
        if (step !== o.tutStep) { o.tutHolding = false; return false; }   // the step completed: ring
        if (o.tutHoldMs >= TUTORIAL_HOLD_MS) { o.tutHolding = false; return false; }   // 20 s up: ring
        o.tutHolding = true;
        return true;
    }

    function pillShowing(o) {
        return !!o && o.state === 'held' && !!call('minigameOpen', o.npcId)
            && !call('conversationOpen') && !call('knockedOut');
    }

    /**
     * A3 R1 m3, m4: an answered call on the player's own phone that has not opened yet (held, or
     * connected and waiting out SCRIPTED_CALL_START_MS). The phone is still the open minigame, so
     * the panel stays up in a "Connecting" state rather than leaving a live phone with no call on it.
     */
    function connectingInPhone(o) {
        return !!o && (o.state === 'held' || (o.state === 'connected' && !o.opened))
            && !!call('phoneHost', o.npcId);
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
        // An outgoing call is the player's own and never saved: a reload mid-call is no missed call (A5)
        if (active && active.npcId === npcId && active.direction !== 'outgoing') mine.push(active);
        for (const q of queue) if (q.npcId === npcId) mine.push(q);
        const forced = mine.filter((o) => o.keep);
        const vms = voicemails.get(npcId) || [];
        let best = null;
        for (const o of mine) if (!o.keep && (!best || rank(o) > rank(best))) best = o;
        let slot = null;
        const cb = callbacks.get(npcId);
        if (forced.length || best || cb || vms.length) {
            slot = { forced: forced.map(record) };
            if (best) slot.live = record(best);
            // Every voicemail still to run, in arrival order, beside whatever else the contact has (A6 R2 M1).
            if (vms.length) slot.voicemails = vms.map((v) => ({ knot: v.knot, withheld: v.withheld || undefined }));
            // A pending callback is saved as a live record with state "missed" (2.7) when it is alone. With
            // a live offer or a held voicemail it is saved beside them as `callback` (A6 R2 M1); a reload
            // turns the offer into its own outcome (row 7 and 27) and hands the callback back.
            if (cb) {
                const rec = { knot: cb.knot, state: 'missed', onMissed: 'callback', callLabel: cb.callLabel || undefined };
                if (best || vms.length) slot.callback = rec; else slot.live = rec;
            }
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
        if (dt <= 0 || dt > MAX_ADVANCE_MS || isPaused()) return;
        if (active) {
            if (active.state === 'ringing') active.ringMs += dt;
            else if (active.state === 'held' && (pillShowing(active) || connectingInPhone(active))) active.holdMs += dt;
        }
        // Sweep item 9: a queued head (or a ringing offer requeued behind the tutorial step) accrues its
        // tutorial-hold time while runOnce says it is holding. Only one offer holds at a time.
        const held = (!active ? queue[0] : (active.state === 'ringing' ? active : null));
        if (held && held.tutHolding) held.tutHoldMs += dt;
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
            const over = !!call('minigameOpen', o.npcId);
            // A3: the call rings inside the player's own phone when it is open (row 10)
            const inPhone = !!call('phoneHost', o.npcId);
            want = { kind: 'banner', key: `b:${o.npcId}:${o.knot}:${over}:${inPhone}`, v: view(o, { overMinigame: over, inPhone }) };
        } else if (connectingInPhone(o)) {
            want = { kind: 'banner', key: `c:${o.npcId}:${o.knot}:${o.state}`,
                v: view(o, { overMinigame: false, inPhone: true, connecting: true, canHangUp: o.state === 'held' && !o.disableClose }) };
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
        // Rows 1 and 7: a new offer ringing clears the contact's callback, so the call button never
        // dials a stale knot and a contact never has two callbacks
        dropCallback(o.npcId);
        save(o);
    }

    /**
     * Item 8: the ring mapping's condition no longer holds. A global that changed since the ring was
     * offered can make it stale (m04: the ESD goes live while HaX's dial ring is queued or ringing).
     * A forced call is never dropped. The adapter re-checks the condition (it owns the globals).
     */
    function ringStale(o) {
        return !o.disableClose && !!o.ringCondition && call('ringConditionHolds', o.ringCondition) === false;
    }

    /**
     * Item 8: drop a stale offer quietly, like a held bark dropped on release: no "Missed call" row,
     * no phone_call_missed, no callback or voicemail. A popup it had put aside comes back.
     */
    function dropQuietly(o) {
        const d = o.displaced;
        o.displaced = null;
        finishOffer(o);
        call('onOutcome', 'dropped', o);
        if (d) reopenDisplaced(d);
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

    /**
     * A displaced descriptor that will not come back (A3 R1 M1). A phone closed for a call skipped
     * its thread's conversation_closed (row 10: the reopen would fire it at the real close), so the
     * adapter owes that event now. Every place that gives a descriptor up goes through here.
     */
    function dropDisplaced(d) {
        if (d) call('dropDisplaced', d);
    }

    // ---- callbacks and voicemail (A6, plan 2.6) ----------------------------------------

    /** Forget a contact's callback without saving (the caller saves). Tells the adapter when one was there. */
    function dropCallback(npcId) {
        if (!callbacks.delete(npcId)) return false;
        call('callbackChanged', npcId);
        return true;
    }

    function setCallback(npcId, knot, callLabel, callbackWhen) {
        // callbackWhen is kept in memory only, and only when set: syncSave writes just
        // { knot, state, onMissed, callLabel } (2.7), so the save is unchanged and a reload restores
        // the callback with no condition (the re-check then passes, as before item 7).
        const rec = { knot, callLabel: typeof callLabel === 'string' && callLabel ? callLabel : null };
        if (typeof callbackWhen === 'string' && callbackWhen) rec.callbackWhen = callbackWhen;
        callbacks.set(npcId, rec);
        syncSave(npcId);
        call('callbackChanged', npcId);
    }

    /** True while an offer of this contact is ringing, held or connected: a callback would be stale beside it. */
    function contactLive(npcId) {
        return !!active && active.npcId === npcId;
    }

    /**
     * What a missed call leaves (plan 2.6): a voicemail (onMissed "voicemail", with a knot, for a call
     * that was never answered) or a callback on the call's own knot. `answered` is a call that was on
     * the line when it dropped (row 32, a call given up on after Answer): a voicemail makes no sense
     * there, so it is always a callback. A withheld caller can't be rung back, so a withheld call that
     * leaves no voicemail leaves nothing. A forced call is never missed. `quiet` (a reload) shows no toast.
     */
    function leaveMissed(o, { answered = false, quiet = false } = {}) {
        if (!o || !o.npcId || !o.knot || o.disableClose) return;
        if (!answered && o.onMissed === 'voicemail' && o.voicemailKnot) {
            dropCallback(o.npcId);
            syncSave(o.npcId);
            call('voicemail', o, { quiet });
            return;
        }
        if (o.withheld || contactLive(o.npcId)) return;
        setCallback(o.npcId, o.knot, o.callLabel, o.callbackWhen);
    }

    /** A voicemail is waiting to run for this contact (held or loading): the slot carries it until releaseVoicemail. */
    function holdVoicemail(npcId, { knot, withheld } = {}) {
        if (typeof npcId !== 'string' || !npcId || typeof knot !== 'string' || !knot) return null;
        const rec = { knot, withheld: withheld === true };
        voicemails.set(npcId, [...(voicemails.get(npcId) || []), rec]);
        syncSave(npcId);
        return rec;
    }

    /** The voicemail ran (or failed): forget it and save the slot again. */
    function releaseVoicemail(npcId, rec) {
        const left = (voicemails.get(npcId) || []).filter((r) => r !== rec);
        if (left.length) voicemails.set(npcId, left); else voicemails.delete(npcId);
        syncSave(npcId);
    }

    /** The call it displaced comes back, if the world allows it now (row 25; never once the ending has started, choice 2). */
    function reopenDisplaced(d) {
        if (!d) return;
        // An ending's conclude is pending: keep it until the server answers, so the phone does
        // not come back over the credits. suspend(false) reopens it, close() drops it (A3 R2 n1)
        if (suspended && !closed) { keptDisplaced.push(d); return; }
        if (!closed && !call('openBlocked') && !hitWithin(HIT_QUIET_MS)) call('reopen', d);
        else dropDisplaced(d);
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
        leaveMissed(o);
        takeDisplacedBack(o);
        run();
    }

    /** Row 21 (ring timeout) and row 18 (rang off after the hold limit). */
    function miss(o, cause) {
        finishOffer(o);
        call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
        if (cause === 'rang_off') {
            if (o.onMissed !== 'voicemail' || !o.voicemailKnot) {
                // With a voicemail to leave the voicemail toast (A6) replaces this one.
                const name = call('displayName', o.npcId);
                call('toast', o.withheld || !name
                    ? 'The caller rang off.'
                    : `${name} rang off. Call back from the thread.`);
            }
            call('onOutcome', 'rang_off', o);
        } else {
            call('onOutcome', 'missed', o);
        }
        leaveMissed(o);
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
        if (cannotOpenNow(false, o.npcId)) {
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
        const d = o.displaced;
        o.displaced = null;
        if (!closed) {
            call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
            call('onOutcome', 'dropped', o, { missed: true });
            leaveMissed(o, { answered: true });
        }
        reopenDisplaced(d);         // drops it (and owes the thread's event) when the ending has started
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
        if (cannotOpenNow(true, o.npcId)) {
            if (closed) giveUp(o); else backToHeld(o);
            return;
        }
        const d = call('putAside', o.npcId);
        if (d) {
            // A second descriptor (a forced call re-ringing into a phone the player opened again, row 26):
            // keep the newer, the screen the player was last on; the older one is given up (A3 R1 M1)
            if (o.displaced) dropDisplaced(o.displaced);
            o.displaced = d;
        }
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
        o.openedAt = now();
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
        if (o.direction === 'outgoing') o.noAnswer = !!info.noAnswer;
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
        let dropWhat = null;
        if (o.direction === 'outgoing') {
            // The player's own call (rows 25, 32 and A5): its row says how it went; no event, no callback
            const connectedFor = o.connectedAt ? Math.max(0, Math.floor((now() - o.connectedAt) / 1000)) : 0;
            if (own) { reopenWhat = o.displaced; } else { dropWhat = o.displaced; }
            o.displaced = null;
            finishOffer(o);
            // A callback that connected and was then cut off by something else is left again (A6)
            if (!own && o.callbackDial && o.connectedAt && !o.noAnswer && !contactLive(o.npcId)) setCallback(o.npcId, o.knot, o.callLabel, o.callbackWhen);
            if (o.noAnswer) call('onOutcome', 'no_answer', o);
            else if (o.connectedAt) call('onOutcome', 'ended', o, { displaced: !!reopenWhat, seconds: connectedFor });
        } else if (own) {
            // Row 25: the story position was reset inside the call already.
            reopenWhat = o.displaced;
            o.displaced = null;
            finishOffer(o);
            // Seconds on the line, from the call opening to its end (the thread row, A4)
            call('onOutcome', 'ended', o, {
                displaced: !!reopenWhat,
                seconds: o.openedAt ? Math.max(0, Math.floor((now() - o.openedAt) / 1000)) : 0,
            });
        } else if (o.disableClose && !closed) {
            // Row 26: rings again once there has been no hit for HIT_QUIET_MS. The popup it put
            // aside stays in o.displaced, so it comes back when the call finally ends (R2 m2).
            o.rering = true;
            o.keep = true;
            o.opened = false;
            requeueHead(o, 'connected');
        } else if (o.disableClose) {
            // A forced call hit after the ending began: it never rings again (row 28).
            dropWhat = o.displaced;
            o.displaced = null;
            finishOffer(o);
            call('onOutcome', 'dropped', o);
        } else {
            // Row 32: closed by something else. Missed, no toast; a callback on its own knot (it was
            // answered, so never a voicemail; a withheld caller can't be rung back and leaves nothing).
            dropWhat = o.displaced;
            o.displaced = null;
            finishOffer(o);
            call('emit', `phone_call_missed:${o.npcId}`, eventData(o));
            call('onOutcome', 'dropped', o, { missed: true });
            leaveMissed(o, { answered: true });
        }
        render();
        // The end hook runs inside another minigame's start (row 32): the re-check, and the
        // reopen decision, wait until that swap is done (M5).
        afterSwap(() => {
            reopenDisplaced(reopenWhat);
            dropDisplaced(dropWhat);
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
            if (ringStale(o)) {
                // Item 8: the mapping's condition stopped holding while it rang. Drop it quietly.
                dropQuietly(o);
                again = true;
            } else if (call('ringBlocked', o.npcId) || tutorialHold(o)) {
                // Rows 23 and 24: a conversation opened, or the player was knocked out. Sweep item 9:
                // a tutorial step that came up while it rang holds it too (it rings again within 20 s).
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
            // Item 8: a held (answered, not yet opened) call whose mapping condition has gone stale
            // is dropped quietly too, before the hold limit or the open.
            if (ringStale(o)) { dropQuietly(o); again = true; return; }
            // Row 18: the hold limit, only while the pill shows (advance() counts only then).
            if (!o.disableClose && o.holdMs >= HOLD_MAX_MS) { miss(o, 'rang_off'); again = true; return; }
            // Rows 13 to 16: open once nothing blocks it; row 19 and the second check follow.
            if (!cannotOpenNow(false, o.npcId) && now() >= o.retryAt) { beginOpen(o); }
        }
        // Row 8: the head of the queue starts ringing.
        if (!active && queue.length > 0) {
            const head = queue[0];
            if (ringStale(head)) {
                // Item 8: its condition went stale while it waited in the queue; drop it, don't ring.
                dropQuietly(head);
                again = true;
            } else if (tutorialHold(head)) {
                // Sweep item 9: the tutorial's opening modal (full hold) or an active step (up to 20 s of
                // unpaused time, or until the step completes / the tutorial ends) is holding the ring.
            } else if (!ringBlocked() && !(head.rering && hitWithin(HIT_QUIET_MS)) && now() >= head.notBefore) {
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
            callbackWhen: typeof raw.callbackWhen === 'string' && raw.callbackWhen ? raw.callbackWhen : null,
            ringCondition: typeof raw.ringCondition === 'string' && raw.ringCondition ? raw.ringCondition : null,
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
            // Sweep item 9: unpaused time this offer has been held by an active tutorial step, the step
            // token it was anchored to, and whether advance() should keep accruing that time.
            tutHoldMs: 0,
            tutStep: undefined,
            tutHolding: false,
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
            direction: 'incoming',
            connectedAt: 0,
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

    // ---- outgoing calls (A5, plan 2.5) --------------------------------------------------

    /**
     * The player places a call to `npcId` on `entry` ({ knot, callLabel? }): the header button,
     * `#place_call` or a callback. Opens the call's minigame at once (it shows "Calling..." and
     * decides at the end of the dial whether the call connects). `opts.callback` marks a callback
     * (2.11), `opts.dial` is passed to the minigame (the entry's `when`, whether the call rings out).
     * Returns 'dialling' or 'refused'.
     *
     * A call that is connected or on hold, the ending, a paused scene or a knockout refuse it. A
     * ringing offer (any contact's) goes back to the head of the queue and rings again afterwards
     * (row 23). Row 31 is at the connect: see outgoingConnected().
     */
    function dial(npcId, entry, opts) {
        const o_ = opts || {};
        if (closed || suspended || typeof npcId !== 'string' || !npcId
            || !entry || typeof entry.knot !== 'string' || !entry.knot) return 'refused';
        advance();
        if (active && (active.state === 'connected' || active.state === 'held')) return 'refused';
        if (cannotOpenNow(true, npcId)) return 'refused';
        const ringing = active && active.state === 'ringing' ? active : null;
        if (ringing) requeueHead(ringing);
        const o = makeOffer({ npcId, knot: entry.knot, callLabel: entry.callLabel });
        o.direction = 'outgoing';
        o.callbackDial = !!o_.callback;
        o.state = 'connected';
        o.opened = true;
        o.started = true;
        o.answeredEmitted = true;
        o.answerSeconds = 0;
        active = o;
        const d = call('putAside', npcId);
        if (d) o.displaced = d;
        const id = `call-${++callSeq}`;
        connecting = { id, npcId, answerSeconds: 0, isCallback: !!o_.callback };
        const opened = call('openCall', o, {
            ringerCall: { id, direction: 'outgoing', callback: !!o_.callback },
            resume: false,
            answerSeconds: 0,
            isCallback: !!o_.callback,
            dial: o_.dial || null,
        });
        if (active !== o || !connecting || connecting.id !== id) return 'dialling';   // re-entered: already ended
        if (!opened) {
            // Row 19: an outgoing call that can't open goes back to the thread's return state, no row
            active = null;
            connecting = null;
            o.displaced = null;
            reopenDisplaced(d);
            run();
            return 'refused';
        }
        render();
        return 'dialling';
    }

    /**
     * The dialled call has connected (the dial ended with `when` holding, or a callback). Row 31:
     * an incoming offer of this contact, queued or ringing-and-requeued, on the knot the call opened
     * on is dropped with no row and no event, because the player rang first. Another knot's offer
     * stays queued (row 5). Returns whether the id was the live outgoing call.
     */
    function outgoingConnected(npcId, id) {
        const o = active;
        if (!o || o.direction !== 'outgoing' || o.npcId !== npcId || !connecting || connecting.id !== id) return false;
        o.connectedAt = now();
        o.openedAt = o.connectedAt;
        // A callback connecting clears it (2.6) and counts as answered (3.4)
        if (o.callbackDial) {
            dropCallback(npcId);
            call('emit', `phone_call_answered:${npcId}`, eventData(o, { answerSeconds: 0, callback: true }));
        }
        for (const q of queue.slice()) {
            if (q.npcId === npcId && q.knot === o.knot && !q.keep) {
                queue = queue.filter((x) => x !== q);
                if (q.openTimer) { c.clearTimeout(q.openTimer); q.openTimer = null; }
            }
        }
        syncSave(npcId);
        return true;
    }

    // ---- row 28 --------------------------------------------------------------------

    /** The ending starts: queued, ringing and held offers go with no rows and no events. */
    function close() {
        advance();
        closed = true;
        // What a call that ended during the suspension displaced will not come back (A3 R2 n1)
        const kept = keptDisplaced;
        keptDisplaced = [];
        for (const d of kept) dropDisplaced(d);
        // A call that is connected, opening included (2.2), finishes normally (choice 3).
        const gone = queue.slice();
        queue = [];
        if (active && active.state !== 'connected') gone.push(active);
        for (const o of gone) {
            if (active === o) active = null;
            if (o.openTimer) { c.clearTimeout(o.openTimer); o.openTimer = null; }
            // A held offer's phone was put aside already and will not come back (A3 R1 M1)
            const d = o.displaced;
            o.displaced = null;
            dropDisplaced(d);
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

    /**
     * Hold the ringer while an ending's conclude is pending (A2c R3 m1, A3 R1 m5): ringBlocked() and
     * openBlocked() are true, so a queued offer does not start ringing and an answered or held one does
     * not open over the credits. Offers stay as they are and the tick keeps running. `suspend(false)`
     * (the server refused the ending) lets them go on; `close()` (it agreed) removes them.
     */
    function suspend(on) {
        const next = !!on;
        if (next === suspended) return;
        suspended = next;
        if (!suspended) {
            const kept = keptDisplaced;
            keptDisplaced = [];
            for (const d of kept) reopenDisplaced(d);
            run();
        }
    }

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

    /** The contact's pending callback `{ knot, callLabel, callbackWhen }`, or null (A6, plan 2.6). */
    function callbackFor(npcId) {
        const cb = callbacks.get(npcId);
        return cb ? { ...cb } : null;
    }

    /**
     * Item 7: a callback whose `ring.callbackWhen` no longer holds is cleared and the empty slot is
     * saved, so the "Call back" button never dials an out-of-date knot. The adapter evaluates the
     * condition (it owns the globals); the ringer only forgets and persists. Returns true when one went.
     */
    function clearStaleCallback(npcId) {
        if (!dropCallback(npcId)) return false;
        syncSave(npcId);
        return true;
    }

    /**
     * A saved callback comes back after a reload (state "missed", 2.7). A newer live offer outranks it.
     * Item 7 follow-up: the save never carried `callbackWhen` (the format is unchanged), so a restored
     * callback would lose its stale-clear condition. The caller (npc-manager) looks the ring config up
     * by knot and hands it back on `rec.callbackWhen`, so a stale callback still clears after a reload.
     */
    function restoreCallback(npcId, rec) {
        if (closed || typeof npcId !== 'string' || !npcId || !rec || typeof rec.knot !== 'string' || !rec.knot) return 'refused';
        if (contactLive(npcId) || queue.some((q) => q.npcId === npcId)) return 'dropped';
        setCallback(npcId, rec.knot, rec.callLabel,
            typeof rec.callbackWhen === 'string' && rec.callbackWhen ? rec.callbackWhen : undefined);
        return 'kept';
    }

    /**
     * A call that was live when the game was saved is missed on load (row 27): the adapter has
     * written the row; this runs `onMissed` for it. `rec` is the saved record
     * ({ knot, state, onMissed, voicemailKnot, withheld, callLabel }). A call that was on the line
     * (state "connected") leaves a callback, as row 32 does. No toast.
     */
    function missedOffline(npcId, rec) {
        if (closed || typeof npcId !== 'string' || !npcId || !rec || typeof rec.knot !== 'string' || !rec.knot) return false;
        leaveMissed({
            npcId, knot: rec.knot, onMissed: rec.onMissed === 'voicemail' ? 'voicemail' : 'callback',
            voicemailKnot: typeof rec.voicemailKnot === 'string' ? rec.voicemailKnot : null,
            withheld: !!rec.withheld, callLabel: typeof rec.callLabel === 'string' ? rec.callLabel : null,
            disableClose: false,
        }, { answered: rec.state === 'connected', quiet: true });
        return true;
    }

    /** Write the contact's slot out again (the reload resume changed what it holds, A4 R2 m1). */
    function refreshSave(npcId) { syncSave(npcId); }

    function stateOf(npcId) {
        if (active && active.npcId === npcId) return active.state;
        const q = queue.find((o) => o.npcId === npcId);
        return q ? q.state : null;
    }

    return {
        offer,
        dial,
        outgoingConnected,
        restore,
        answer,
        decline,
        hangUp,
        callEnded,
        close,
        suspend,
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
        callbackFor,
        clearStaleCallback,
        restoreCallback,
        holdVoicemail,
        releaseVoicemail,
        missedOffline,
        refreshSave,
        stateOf,
        isClosed: () => closed,
        isSuspended: () => suspended,
        queueLength: () => queue.length,
        /** The current offer (ringing, held or connected), for the adapter and tests. */
        current: () => (active ? { ...active, openTimer: undefined } : null),
    };
}

export default createPhoneRinger;

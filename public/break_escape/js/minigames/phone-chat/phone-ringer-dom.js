/**
 * The ringer's adapter: wires the pure state machine (phone-ringer.js) to the window.
 * Phone calls plan 2.2 (checks), 2.4 (layer, banner), 2.9 (hooks), 2.11 (call VARs).
 *
 * `installPhoneRinger(win)` is called once, right after window.npcManager exists
 * (js/main.js), and leaves the ringer on `win.phoneRinger`. Everything it touches is read
 * from `win` when it is used, so tests can pass a fake window.
 *
 * Slice A2c: a non-conversation minigame or a workstation popup no longer blocks ringing. The
 * call rings over it; Answer over a minigame holds the call (the hold pill) until it closes, and
 * Answer over a popup puts the popup aside and restores it when the call ends (rows 11 to 16).
 * A person-chat, a video call, a voiced or forced phone-chat and a scripted scene are
 * conversations and still block ringing.
 *
 * Slice A3 (row 10): the player's own phone (a text phone-chat that registers itself through
 * `registerPhone`) is not an obstacle. A call for a contact on that phone rings inside it, as a
 * panel over the phone's content, and Answer closes the phone (no `conversation_closed` for the
 * thread it was on) and reopens it on the same screen when the call ends. Any other open
 * phone-chat (a desk phone, a DM app) is a non-conversation minigame, as before (row 12).
 */
import { createPhoneRinger } from './phone-ringer.js';
import { normaliseRing, normaliseCall, pickButtonCall, pickPlacedCall } from './phone-ring-config.js';

const POPUP_IDS = ['laptop-popup', 'lab-popup'];
const SLOT_SYNC_DEBOUNCE_MS = 500;

export function installPhoneRinger(win = window) {
    // The slot last handed to savePendingCall per contact, and the pending debounced sync (m1)
    const slotSent = new Map();
    let syncTimer = null;
    const doc = win.document;

    // ---- the layer ---------------------------------------------------------------
    let layer = doc.getElementById('phone-ring-layer');
    if (!layer) {
        layer = doc.createElement('div');
        layer.id = 'phone-ring-layer';
        layer.setAttribute('role', 'region');
        layer.setAttribute('aria-live', 'assertive');
        layer.setAttribute('aria-label', 'Incoming calls');
        doc.body.appendChild(layer);
    }

    const fw = () => win.MinigameFramework;
    const nm = () => win.npcManager;
    const openMinigame = () => {
        const m = fw()?.currentMinigame;
        return m && !m._ending ? m : null;
    };
    const popupOpen = () => POPUP_IDS.some((id) => {
        const el = doc.getElementById(id);
        return !!el && !!el.style && el.style.display !== '' && el.style.display !== 'none';
    });
    const sceneActive = () => !!nm()?.scriptedConversationActive?.();
    const queuedBeats = () => (nm()?._scriptedCallQueue?.length || 0) > 0;
    const knockedOut = () => !!win.playerIsKnockedOut?.();
    /** The tutorial prompt or an active tutorial step: its panel (SKIP TUTORIAL, step counter) must stay visible, so nothing rings (M8 R1 M2). */
    const tutorialShowing = () => {
        try {
            const t = win.getTutorialManager?.();
            return !!t && (t.active === true || t.promptOpen === true);
        } catch (e) { return false; }
    };
    /** A conversation minigame: a person-chat (a video call is one: conversationMode "video-call"), or a phone-chat showing a call (2.2). */
    const isConversation = (m) => !!m && (m._sceneType === 'person-chat'
        || (m._sceneType === 'phone-chat' && (m.params?.voiced === true || m.params?.disableClose === true)));

    // ---- the player's phone (A3) -------------------------------------------------
    /** The text phone-chat that registered itself (phone-chat-minigame.js `init`), or null. */
    let registeredPhone = null;
    const callerPhoneId = (npcId) => nm()?.getNPC?.(npcId)?.phoneId || 'player_phone';
    /** The open minigame when it is the registered phone and the caller's own phone (row 10), else null. */
    const hostPhone = (npcId) => {
        const m = openMinigame();
        if (!m || m !== registeredPhone || m._sceneType !== 'phone-chat') return null;
        if (!m.gameState?.isActive) return null;
        return (m.phoneId || 'player_phone') === callerPhoneId(npcId) ? m : null;
    };

    // ---- banner and pill ---------------------------------------------------------
    let ownedCallId = null;
    /** True while putAside() runs: the popup's close hook must not nudge the ringer (plan 2.9). */
    let settingAside = false;

    function clearLayer() {
        while (layer.firstChild) layer.removeChild(layer.firstChild);
    }

    /** Take the in-phone panel down, wherever it is (the phone it was in may be gone already). */
    function hidePhonePanel() {
        try { registeredPhone?.hideIncomingCall?.(); } catch (e) { /* the phone is being torn down */ }
    }

    function el(tag, className, text) {
        const e = doc.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function avatarSrc(npc) {
        // A relative asset path is served under /break_escape/ (as npc-barks.js resolves it)
        const a = String(npc.avatar);
        return (a.startsWith('/') || a.startsWith('http')) ? a : `/break_escape/${a.replace(/^\/+/, '')}`;
    }

    /** Row 10: the same call, drawn inside the open phone instead of the top-centre layer. */
    function showPhonePanel(view, npc, name) {
        const phone = hostPhone(view.npcId);
        if (!phone?.showIncomingCall) return false;
        clearLayer();
        phone.showIncomingCall({
            npcId: view.npcId,
            name,
            caption: (!view.withheld && view.callLabel) ? view.callLabel : '',
            avatar: (!view.withheld && npc?.avatar) ? avatarSrc(npc) : null,
            withheld: !!view.withheld,
            forced: !!view.forced,
            connecting: !!view.connecting,
            onAnswer: () => win.phoneRinger?.answer(view.npcId),
            onDecline: () => win.phoneRinger?.decline(view.npcId),
            // A3 R1 m3: an answered call that has not opened yet can still be hung up from hold
            ...(view.connecting && view.canHangUp ? { onHangUp: () => win.phoneRinger?.hangUp(view.npcId) } : {}),
        });
        return true;
    }

    function showBanner(view) {
        const npc = nm()?.getNPC?.(view.npcId);
        if (view.inPhone) {
            const phoneName = view.withheld ? 'No caller ID' : (npc?.displayName || view.npcId);
            if (showPhonePanel(view, npc, phoneName)) return;
        }
        hidePhonePanel();
        clearLayer();
        const name = view.withheld ? 'No caller ID' : (npc?.displayName || view.npcId);
        const box = el('div', 'incoming-call');
        box.dataset.npcId = view.npcId;
        const avatar = el('div', 'incoming-call-avatar');
        if (!view.withheld && npc?.avatar) {
            const img = doc.createElement('img');
            img.alt = '';
            img.src = avatarSrc(npc);
            avatar.appendChild(img);
        } else {
            avatar.textContent = '☎';   // a plain handset glyph
        }
        box.appendChild(avatar);
        const body = el('div', 'incoming-call-body');
        body.appendChild(el('div', 'incoming-call-name', name));
        if (!view.withheld && view.callLabel) body.appendChild(el('div', 'incoming-call-caption', view.callLabel));
        body.appendChild(el('div', 'incoming-call-status',
            view.overMinigame ? 'Incoming call · Answer puts them on hold until you close this' : 'Incoming call'));
        box.appendChild(body);
        const buttons = el('div', 'incoming-call-buttons');
        const answer = el('button', 'incoming-call-answer', 'Answer');
        answer.type = 'button';
        answer.setAttribute('aria-label', `Answer call from ${name}`);
        answer.addEventListener('click', () => win.phoneRinger?.answer(view.npcId));
        buttons.appendChild(answer);
        if (!view.forced) {
            const decline = el('button', 'incoming-call-decline', 'Decline');
            decline.type = 'button';
            decline.setAttribute('aria-label', 'Decline call');
            decline.addEventListener('click', () => win.phoneRinger?.decline(view.npcId));
            buttons.appendChild(decline);
        }
        box.appendChild(buttons);
        layer.appendChild(box);
    }

    function showPill(view) {
        hidePhonePanel();
        clearLayer();
        const npc = nm()?.getNPC?.(view.npcId);
        const name = view.withheld ? 'Caller' : (npc?.displayName || view.npcId);
        const box = el('div', 'incoming-call incoming-call-hold');
        box.dataset.npcId = view.npcId;
        box.appendChild(el('div', 'incoming-call-status', `${name} · on hold · close this to talk`));
        if (view.canHangUp) {
            const hang = el('button', 'incoming-call-decline', 'Hang up');
            hang.type = 'button';
            hang.setAttribute('aria-label', 'Hang up');
            hang.addEventListener('click', () => win.phoneRinger?.hangUp(view.npcId));
            box.appendChild(hang);
        }
        layer.appendChild(box);
    }

    // ---- sound -------------------------------------------------------------------
    // phone_ringtone (A8) loops through the sound manager's notification volume while the call
    // rings. If it failed to load, fall back to phone_vibrate every 2 s as before.
    let ringTimer = null;
    let ringtonePlaying = false;
    function startRingtone() {
        const sm = win.soundManager;
        if (!sm?.play) return;
        try {
            if (sm.sounds?.phone_ringtone) {
                sm.play('phone_ringtone', { loop: true });
                ringtonePlaying = true;
            } else {
                sm.play('phone_vibrate');
                ringTimer = win.setInterval(() => { try { sm.play('phone_vibrate'); } catch (e) { /* ignore */ } }, 2000);
            }
        } catch (e) { /* a missing sound must never break a call */ }
    }
    function stopRingtone() {
        if (ringTimer) { win.clearInterval(ringTimer); ringTimer = null; }
        if (ringtonePlaying) {
            ringtonePlaying = false;
            try { win.soundManager?.stop?.('phone_ringtone'); } catch (e) { /* ignore */ }
        }
    }

    // ---- the adapter -------------------------------------------------------------
    const adapter = {
        // A non-conversation minigame or a popup does not block: the call rings over it
        // An active tutorial (or its prompt) does block: the ring waits until it ends or is skipped
        // The player's own phone does not block either: the call rings inside it (row 10)
        ringBlocked() {
            return isConversation(openMinigame()) || sceneActive() || queuedBeats() || knockedOut() || tutorialShowing();
        },
        // A popup does not block opening either: row 11 puts it aside; the caller's own phone is
        // closed for the call (row 10)
        openBlocked(info) {
            const open = openMinigame();
            if (open && open !== hostPhone(info?.npcId)) return true;
            if (sceneActive() || knockedOut()) return true;
            return !(info && info.second) && queuedBeats();
        },
        phoneHost: (npcId) => !!hostPhone(npcId),
        conversationOpen() {
            return isConversation(openMinigame()) || sceneActive();
        },
        minigameOpen(npcId) {
            const m = openMinigame();
            return !!m && !isConversation(m) && m !== hostPhone(npcId);
        },
        knockedOut,
        isPaused() {
            if (win.breakEscapeSessionOverlayShowing) return true;
            if (doc.hidden) return true;
            if (doc.querySelector('.game-menu-overlay.visible')) return true;
            const m = fw()?.currentMinigame;
            return !!m && m._sceneType === 'notes' && m.params?.title === 'Mission Brief';
        },
        // player-damage-interrupt.js stamps every hit on the performance clock, the ringer's clock
        lastHitAt: () => {
            const t = win.lastPlayerHitAt?.();
            return typeof t === 'number' ? t : null;
        },
        outgoingActive: () => false,             // the ringer owns the outgoing call as its active offer (A5)
        callMinigameOpen() {
            const m = fw()?.currentMinigame;
            return !!m && !m._ending && !!ownedCallId && m.params?.ringerCall?.id === ownedCallId;
        },
        openCallId() {
            const m = fw()?.currentMinigame;
            return m?.params?.ringerCall?.id || null;
        },
        openCall(offer, info) {
            const npc = nm()?.getNPC?.(offer.npcId);
            if (!npc || !fw()?.startMinigame) return false;
            // The same toast hold that _queueScriptedConversation puts up (F24)
            win.holdRecentNotifications?.();
            win.expectPanelWithin?.(1000);
            const id = info.ringerCall.id;
            ownedCallId = id;
            let started = null;
            // The call knot is the contact's position only while the call is open; the thread
            // reads currentKnot, so a ring that is declined or missed never moved it (R2 M1)
            // (put back if the open is refused or throws, so a refusal leaves no moved knot)
            // An outgoing call moves it at the connect (goToKnot), after the dial has decided
            // whether anyone answers (A5).
            const outgoing = info.ringerCall.direction === 'outgoing';
            const previousKnot = npc.currentKnot;
            if (offer.knot && !outgoing) npc.currentKnot = offer.knot;
            try {
                started = fw().startMinigame('phone-chat', null, {
                    npcId: offer.npcId,
                    phoneId: npc.phoneId || 'player_phone',
                    // resume: a re-ring of an unfinished call restores the saved story
                    startKnot: (!outgoing && info.resume && npc.storyState) ? null : offer.knot,
                    title: npc.displayName || 'Phone',
                    theme: npc.phoneTheme,
                    disableClose: !!offer.disableClose,
                    voiced: true,
                    callLabel: offer.callLabel || null,
                    showCancel: false,
                    ringerCall: { id, direction: info.ringerCall.direction, callback: !!info.ringerCall.callback },
                    // An outgoing call: the entry's `when` is checked as it connects (A5)
                    ...(outgoing ? { dial: { when: info.dial?.when || null, callback: !!info.ringerCall.callback } } : {})
                });
            } catch (err) {
                console.error('phone ringer: the call failed to open', err);
                // startMinigame installs the minigame before init/start: end a half-built call
                const half = fw().currentMinigame;
                if (half && half.params?.ringerCall?.id === id && !half._ending) {
                    try { fw().endMinigame(false, null); } catch (e) { /* nothing more to do */ }
                }
                ownedCallId = null;
                npc.currentKnot = previousKnot;
                return false;
            }
            if (!started) { ownedCallId = null; npc.currentKnot = previousKnot; }
            return !!started;
        },
        // Row 11: close the open workstation popup with its own close function (state kept,
        // plan 1.3) and say which one it was. The lab frame's `src` property is saved, never the
        // attribute: openLabWorkstation compares the property, and a different string would reload
        // the sheet and lose its scroll position.
        putAside(npcId) {
            // Row 10: close the player's phone with _closingForCall (its cleanup then emits no
            // conversation_closed for the thread it was on) and remember its screen
            const phone = hostPhone(npcId);
            if (phone) {
                const state = phone.callReopenState?.() || { params: { ...phone.params }, thread: null };
                phone.params = phone.params || {};
                phone.params._closingForCall = true;
                try {
                    fw().endMinigame(false, null);
                } catch (err) {
                    console.error('phone ringer: closing the phone for a call failed', err);
                }
                // The close threw and the phone is still open (A3 R1 n2): it must not keep the flag, or a
                // later real close would skip its thread's conversation_closed. Nothing was put aside.
                if (fw().currentMinigame === phone && !phone._ending) {
                    delete phone.params._closingForCall;
                    return null;
                }
                return { kind: 'phone', ...state };
            }
            if (openMinigame()) return null;
            const laptop = doc.getElementById('laptop-popup');
            const lab = doc.getElementById('lab-popup');
            const shown = (e) => !!e && !!e.style && e.style.display !== '' && e.style.display !== 'none';
            let d = null;
            settingAside = true;
            try {
                if (shown(laptop)) {
                    d = { kind: 'laptop' };
                    win.closeLaptop?.();
                } else if (shown(lab)) {
                    d = { kind: 'lab', src: doc.getElementById('lab-frame')?.src || null };
                    win.closeLabWorkstation?.();
                }
            } finally { settingAside = false; }
            return d;
        },
        // A3 R1 M1: a descriptor that will not come back. A phone closed for a call skipped its thread's
        // conversation_closed; it is emitted here, once, for the thread it was on (not for the list).
        dropDisplaced(d) {
            if (d?.kind !== 'phone' || !d.thread) return;
            win.eventDispatcher?.emit?.(`conversation_closed:${d.thread}`, { npcId: d.thread, timestamp: Date.now() });
        },
        // Rows 11, 25: the popup comes back as it was, unless something else is open by then
        reopen(d) {
            if (!d) return;
            if (openMinigame() || popupOpen()) { adapter.dropDisplaced(d); return; }
            if (d.kind === 'laptop') win.openCryptoWorkstation?.();
            else if (d.kind === 'lab') win.openLabWorkstation?.(d.src);
            else if (d.kind === 'phone') {
                // The phone as it was opened, on the thread it was on (or its contact list). A
                // reopen is not the first open: no startKnot, nothing re-run (as returnToPhoneAfterNotes).
                const params = { ...(d.params || {}) };
                delete params.startKnot;
                delete params._closingForCall;
                if (d.thread) params.npcId = d.thread; else delete params.npcId;
                let started = null;
                try { started = fw()?.startMinigame('phone-chat', null, params); } catch (err) { console.error('phone ringer: reopening the phone failed', err); }
                if (!started) adapter.dropDisplaced(d);
            }
        },
        showBanner,
        hideBanner() { hidePhonePanel(); clearLayer(); },
        showPill,
        hidePill: clearLayer,
        ringtone(on) {
            stopRingtone();
            if (on) startRingtone();
        },
        vibrate() {
            try { win.soundManager?.play?.('phone_vibrate'); } catch (e) { /* ignore */ }
        },
        toast(text) { win.showNotification?.(text, 'info', 'Phone'); },
        displayName: (npcId) => nm()?.getNPC?.(npcId)?.displayName || null,
        emit(name, data) { win.eventDispatcher?.emit?.(name, data); },
        setGlobal(map) {
            const globals = win.gameState?.globalVariables;
            if (!globals || !map) return;
            for (const [name, value] of Object.entries(map)) {
                const oldValue = globals[name];
                globals[name] = value;
                win.npcConversationStateManager?.broadcastGlobalVariableChange?.(name, value, null);
                win.eventDispatcher?.emit?.(`global_variable_changed:${name}`, { name, value, oldValue });
            }
        },
        // Kept on the NPC; exportPhoneState saves it with the thread (plan 2.7)
        savePendingCall(npcId, slot) {
            const npc = nm()?.getNPC?.(npcId);
            if (npc) npc.pendingCall = slot || null;
            // A changed slot goes to the server at once (debounced). The unload flush can drop
            // phoneState when it is over its size limit while the trigger or timed mark that
            // belongs to the call still goes, which would strand the call (A4 R1 m1)
            const key = JSON.stringify(slot || null);
            if (slotSent.get(npcId) === key) return;
            slotSent.set(npcId, key);
            if (syncTimer) win.clearTimeout(syncTimer);
            syncTimer = win.setTimeout(() => {
                syncTimer = null;
                try { Promise.resolve(win.stateSync?.sync?.()).catch(() => {}); } catch (e) { /* ignore */ }
            }, SLOT_SYNC_DEBOUNCE_MS);
        },
        // A6: run the offer's voicemail knot into the contact's thread
        voicemail(offer, { quiet } = {}) {
            try {
                Promise.resolve(nm()?.runVoicemail?.(offer.npcId, offer.voicemailKnot,
                    { withheld: offer.withheld === true, quiet: !!quiet })).catch(() => {});
            } catch (e) { console.error('phone ringer: voicemail failed', e); }
        },
        // A6: a callback was set or cleared: the open thread's call button and the missed row's button follow
        callbackChanged(npcId) {
            const m = fw()?.currentMinigame;
            if (m && m._sceneType === 'phone-chat' && m.currentNPCId === npcId && !m._ending) {
                try { m._refreshCallButton?.(npcId); } catch (e) { /* the thread is going */ }
            }
        },
        // The thread rows (A4, plan 2.6)
        onOutcome(kind, offer, extra) {
            const mgr = nm();
            if (!mgr?.addCallRow || !offer) return;
            const withheld = offer.withheld === true;
            if (kind === 'declined' || kind === 'missed' || kind === 'rang_off'
                || (kind === 'dropped' && extra && extra.missed)) {
                mgr.addCallRow(offer.npcId, 'missed', { withheld });
            } else if (kind === 'no_answer') {
                mgr.addCallRow(offer.npcId, 'no_answer');
            } else if (kind === 'ended') {
                mgr.addCallRow(offer.npcId, offer.direction === 'outgoing' ? 'outgoing' : 'incoming',
                    { seconds: extra && extra.seconds, withheld });
            }
        },
    };

    const clock = {
        now: () => win.performance.now(),
        setTimeout: (fn, ms) => win.setTimeout(fn, ms),
        clearTimeout: (id) => win.clearTimeout(id),
        defer: (fn) => (win.queueMicrotask || queueMicrotask)(fn),
    };

    const ringer = createPhoneRinger({ adapter, clock });

    const phoneRinger = {
        ...ringer,
        /** An offer as npc-manager builds it: `ring` (true or an object) is normalised here. */
        offer(raw) {
            const ring = normaliseRing(raw?.ring, { forced: !!raw?.disableClose });
            return ringer.offer({
                ...raw,
                onMissed: ring ? ring.onMissed : raw?.onMissed,
                voicemailKnot: ring ? ring.voicemailKnot : raw?.voicemailKnot,
                withheld: ring ? ring.withheld : raw?.withheld,
                untilAnswered: ring ? ring.untilAnswered : raw?.untilAnswered,
            });
        },
        /**
         * The header button's state for `npcId` in this phone (A5, plan 2.5): `{ label, ariaLabel }`
         * or null when the button is hidden. Only the caller's own phone shows it, never a pretext
         * contact (`callId`) or a phone opened with `disableClose`; the contact needs a `call` entry
         * that applies now, or a pending callback ("Call back", A6).
         */
        callButtonFor(npcId, phone) {
            if (ringer.isClosed()) return null;
            const npc = nm()?.getNPC?.(npcId);
            if (!npc || npc.callId || !phone || phone.params?.disableClose || phone.params?.ringerCall) return null;
            if (hostPhone(npcId) !== phone) return null;
            const entries = normaliseCall(npc.call);
            const callback = ringer.callbackFor(npcId);
            // A pending callback shows the button even when the contact has no `call` block (A6, 2.6)
            if (!entries.length && !callback) return null;
            const pick = pickButtonCall(entries, (w) => !!nm()?.callConditionHolds?.(w), callback);
            if (!pick) return null;
            const name = npc.displayName || npc.id;
            if (pick.kind === 'callback') return { label: 'Call back', ariaLabel: `Call ${name} back`, kind: 'callback' };
            return { label: 'Call', ariaLabel: `Call ${name}`, kind: pick.kind };
        },
        /**
         * Place a call to `npcId` from the open thread: the header button (no knot) or `#place_call`
         * (`knot` null or the entry's knot). Returns true when the call is dialling. Not callable: a
         * `callId` contact, a phone opened with `disableClose`, a call screen.
         */
        placeCall(npcId, { knot = null } = {}) {
            const npc = nm()?.getNPC?.(npcId);
            if (!npc || npc.callId) return false;
            const open = openMinigame();
            if (!open || open.params?.disableClose || open.params?.ringerCall) return false;
            const entries = normaliseCall(npc.call);
            const holds = (w) => !!nm()?.callConditionHolds?.(w);
            const callback = ringer.callbackFor(npcId);
            const pick = knot ? pickPlacedCall(entries, holds, knot, callback) : pickButtonCall(entries, holds, callback);
            if (!pick) return false;
            const result = ringer.dial(npcId,
                { knot: pick.entry.knot,
                    callLabel: (pick.kind === 'callback' && callback?.callLabel) || (typeof npc.callLabel === 'string' ? npc.callLabel : null) },
                { callback: pick.kind === 'callback', dial: { when: pick.kind === 'callback' ? null : pick.entry.when } });
            return result === 'dialling';
        },
        /** minigame-manager's end hook: report a ringer call's end, then re-check (row 25, 32). */
        onMinigameEnded(ending) {
            const rc = ending?.params?.ringerCall;
            if (rc && rc.id) {
                ringer.callEnded(ending.params.npcId, {
                    id: rc.id,
                    endedByCall: ending._endedByCall === true,
                    callFinished: ending._callFinished === true,
                    noAnswer: ending._noAnswer === true,
                });
            }
            ringer.onMinigameEnded();
        },
        /** The workstation popups' close hook; the ringer's own close for row 11 is not a player close. */
        onPopupClosed() {
            // Keeps a refused open's retry wait: without the guard the put-aside's deferred nudge zeroes
            // retryAt and a second open follows at once (test/js/phone-ring-aside.test.mjs, A2c R2 m3).
            if (settingAside) return;
            ringer.onPopupClosed();
        },
        /**
         * A text phone-chat opened as a phone (phone-chat-minigame.js `init`) registers here and
         * unregisters in `cleanup`. The ringer then rings inside it when it is the caller's phone.
         */
        registerPhone(minigame) { registeredPhone = minigame || null; },
        unregisterPhone(minigame) {
            if (registeredPhone === minigame) registeredPhone = null;
        },
        layer,
    };
    win.phoneRinger = phoneRinger;

    // ---- engine VARs (2.11) and the load hook -----------------------------------
    let writerRegistered = false;
    function registerWriter() {
        if (writerRegistered) return;
        const mgr = win.npcConversationStateManager;
        if (!mgr?.registerEngineVariableWriter) return;
        mgr.registerEngineVariableWriter('phone-call', ({ npcId, channel }) => win.phoneRinger.callVariablesFor(npcId, channel));
        writerRegistered = true;
    }
    registerWriter();
    win.eventDispatcher?.on?.('game_loaded', () => {
        registerWriter();
        // A reload (row 27): forced calls ring again, other saved calls are missed
        try { win.npcManager?.resumePendingCalls?.(); } catch (e) { console.error('[phone-ringer] resumePendingCalls failed', e); }
        phoneRinger.onGameLoaded();
    });
    // The manager may be created later than the ringer: keep trying until it is there
    if (!writerRegistered) {
        const retry = win.setInterval(() => {
            registerWriter();
            if (writerRegistered) win.clearInterval(retry);
        }, 500);
    }
    return phoneRinger;
}

export default installPhoneRinger;

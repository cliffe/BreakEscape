/**
 * The ringer's adapter: wires the pure state machine (phone-ringer.js) to the window.
 * Phone calls plan 2.2 (checks), 2.4 (layer, banner), 2.9 (hooks), 2.11 (call VARs).
 *
 * `installPhoneRinger(win)` is called once, right after window.npcManager exists
 * (js/main.js), and leaves the ringer on `win.phoneRinger`. Everything it touches is read
 * from `win` when it is used, so tests can pass a fake window.
 *
 * Slice A2b (phone closed): any open minigame or workstation popup blocks ringing, and there
 * is no hold pill yet (minigameOpen() reports false), so a call is always answered with nothing
 * on screen. A2c relaxes both; A3 adds the player's phone.
 */
import { createPhoneRinger } from './phone-ringer.js';
import { normaliseRing } from './phone-ring-config.js';

const POPUP_IDS = ['laptop-popup', 'lab-popup'];

export function installPhoneRinger(win = window) {
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

    // ---- banner and pill ---------------------------------------------------------
    let ownedCallId = null;

    function clearLayer() {
        while (layer.firstChild) layer.removeChild(layer.firstChild);
    }

    function el(tag, className, text) {
        const e = doc.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function showBanner(view) {
        clearLayer();
        const npc = nm()?.getNPC?.(view.npcId);
        const name = view.withheld ? 'No caller ID' : (npc?.displayName || view.npcId);
        const box = el('div', 'incoming-call');
        box.dataset.npcId = view.npcId;
        const avatar = el('div', 'incoming-call-avatar');
        if (!view.withheld && npc?.avatar) {
            const img = doc.createElement('img');
            img.alt = '';
            // A relative asset path is served under /break_escape/ (as npc-barks.js resolves it)
            const a = String(npc.avatar);
            img.src = (a.startsWith('/') || a.startsWith('http')) ? a : `/break_escape/${a.replace(/^\/+/, '')}`;
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
    // phone_ringtone arrives in A8; until it is loaded the cycle is phone_vibrate every 2 s.
    let ringTimer = null;
    function playRingCycle() {
        const sm = win.soundManager;
        if (!sm?.play) return;
        const name = sm.sounds?.phone_ringtone ? 'phone_ringtone' : 'phone_vibrate';
        try { sm.play(name); } catch (e) { /* a missing sound must never break a call */ }
    }

    // ---- the adapter -------------------------------------------------------------
    const adapter = {
        ringBlocked() {
            return !!openMinigame() || popupOpen() || sceneActive() || queuedBeats() || knockedOut();
        },
        openBlocked(info) {
            if (openMinigame() || popupOpen() || sceneActive() || knockedOut()) return true;
            return !(info && info.second) && queuedBeats();
        },
        conversationOpen() {
            const m = openMinigame();
            if (m && (m._sceneType === 'person-chat'
                || (m._sceneType === 'phone-chat' && (m.params?.voiced === true || m.params?.disableClose === true)))) return true;
            return sceneActive();
        },
        // A2b: no hold pill yet (A2c), so no non-conversation minigame is reported open.
        minigameOpen: () => false,
        knockedOut,
        isPaused() {
            if (win.breakEscapeSessionOverlayShowing) return true;
            if (doc.hidden) return true;
            if (doc.querySelector('.game-menu-overlay.visible')) return true;
            const m = fw()?.currentMinigame;
            return !!m && m._sceneType === 'notes' && m.params?.title === 'Mission Brief';
        },
        lastHitAt: () => null,                   // A2c: the hit stamp, on the performance clock
        outgoingActive: () => false,             // A5
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
            try {
                started = fw().startMinigame('phone-chat', null, {
                    npcId: offer.npcId,
                    phoneId: npc.phoneId || 'player_phone',
                    // resume: a re-ring of an unfinished call restores the saved story
                    startKnot: (info.resume && npc.storyState) ? null : offer.knot,
                    title: npc.displayName || 'Phone',
                    theme: npc.phoneTheme,
                    disableClose: !!offer.disableClose,
                    voiced: true,
                    callLabel: offer.callLabel || null,
                    showCancel: false,
                    ringerCall: { id, direction: info.ringerCall.direction, callback: !!info.ringerCall.callback }
                });
            } catch (err) {
                console.error('phone ringer: the call failed to open', err);
                // startMinigame installs the minigame before init/start: end a half-built call
                const half = fw().currentMinigame;
                if (half && half.params?.ringerCall?.id === id && !half._ending) {
                    try { fw().endMinigame(false, null); } catch (e) { /* nothing more to do */ }
                }
                ownedCallId = null;
                return false;
            }
            if (!started) ownedCallId = null;
            return !!started;
        },
        putAside: () => null,                    // A2c
        reopen: () => {},                        // A2c / A3
        showBanner,
        hideBanner: clearLayer,
        showPill,
        hidePill: clearLayer,
        ringtone(on) {
            if (ringTimer) { win.clearInterval(ringTimer); ringTimer = null; }
            if (on) {
                playRingCycle();
                ringTimer = win.setInterval(playRingCycle, 2000);
            }
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
        // A4 persists this; until then it only lives on the NPC (plan 2.7)
        savePendingCall(npcId, slot) {
            const npc = nm()?.getNPC?.(npcId);
            if (npc) npc.pendingCall = slot || null;
        },
        onOutcome() {},                          // A4 rows, A6 callbacks
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
        /** minigame-manager's end hook: report a ringer call's end, then re-check (row 25, 32). */
        onMinigameEnded(ending) {
            const rc = ending?.params?.ringerCall;
            if (rc && rc.id) {
                ringer.callEnded(ending.params.npcId, {
                    id: rc.id,
                    endedByCall: ending._endedByCall === true,
                    callFinished: ending._callFinished === true,
                });
            }
            ringer.onMinigameEnded();
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

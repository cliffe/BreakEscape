// What counts as a full-screen panel the HUD toasts and barks should not cover:
// an open minigame (conversations, locks, the phone) or one of the workstation
// popups (CyberChef "Crypto Workstation", lab sheets), which are plain DOM popups
// rather than minigames. No imports, so node tests can load it on its own.

const POPUP_IDS = ['laptop-popup', 'lab-popup'];

/** True while the CyberChef or lab-sheet workstation popup is showing. */
export function workstationPopupOpen(doc = (typeof document !== 'undefined' ? document : null)) {
    if (!doc) return false;
    return POPUP_IDS.some((id) => {
        const el = doc.getElementById(id);
        return !!el && !!el.style && el.style.display !== '' && el.style.display !== 'none';
    });
}

/** True while a minigame (not already closing) or a workstation popup is open. */
export function fullScreenPanelOpen(win = (typeof window !== 'undefined' ? window : {}), doc) {
    const m = win.MinigameFramework?.currentMinigame;
    if (m && !m._ending) return true;
    return workstationPopupOpen(doc);
}

/**
 * True while the phone is open on this NPC's own thread (m04 confirmation N1: HaX's
 * bark toast sat beside HaX's open chat). The phone otherwise keeps barks on top,
 * since a bark there flags another contact's thread; a bark from the open thread's
 * contact is held until the phone closes instead.
 */
export function phoneThreadOpenFor(npcId, win = (typeof window !== 'undefined' ? window : {})) {
    if (!npcId) return false;
    const m = win.MinigameFramework?.currentMinigame;
    if (!m || m._ending || m._sceneType !== 'phone-chat') return false;
    if (m.currentNPCId !== npcId) return false;
    const view = m.ui?.getCurrentView?.();
    return view === undefined || view === 'conversation';
}

/** Text reduced to lower-case letters and digits, so dashes, quotes and spacing don't matter. */
export function threadTextKey(text) {
    return String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * The open phone thread: { npcId, keys } where keys is a Set of threadTextKey() for
 * every line drawn in it, or null when the phone isn't open on a conversation.
 * Reads the drawn thread (not the stored history), so a text that arrived while
 * the thread was open, and isn't drawn in it, doesn't count (m06 confirmation R4 M2).
 */
export function openPhoneThread(win = (typeof window !== 'undefined' ? window : {}),
    doc = (typeof document !== 'undefined' ? document : null)) {
    const m = win.MinigameFramework?.currentMinigame;
    if (!m || m._ending || m._sceneType !== 'phone-chat' || !m.currentNPCId) return null;
    const view = m.ui?.getCurrentView?.();
    if (view !== undefined && view !== 'conversation') return null;
    const box = m.ui?.elements?.messagesContainer || doc?.getElementById?.('messages-container');
    const keys = new Set();
    if (box && typeof box.querySelectorAll === 'function') {
        for (const el of box.querySelectorAll('.message-text, .transcript, .message-narration')) {
            const k = threadTextKey(el.textContent);
            if (k) keys.add(k);
        }
    }
    return { npcId: m.currentNPCId, keys };
}

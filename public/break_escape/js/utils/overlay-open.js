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

/**
 * HUD Info Label
 * Shows the door_sign, item observations, or NPC name/observation for the
 * interactable E would act on (interaction-reach.js pickInteractable, the same pick
 * tryInteractWithNearest makes).
 */

import { INTERACTION_RANGE, INTERACTION_RANGE_SQ } from '../utils/constants.js';
import { resolveObjectField } from '../utils/conditional-text.js';
import { worldObservations } from '../utils/pc-observations.js';
import { displayDashes } from '../utils/display-dashes.js';
import { interactionLineClear } from '../systems/interaction-walls.js';
import { pickInteractable } from '../systems/interaction-reach.js';
import { npcReachDistSq } from '../systems/npc-reach.js';

let labelEl       = null;
let lastUpdate    = 0;
let displayedText = null; // what is currently shown — avoids redundant DOM writes
let proximityText = null; // text from nearest world object (updated on interval)
let hoverText     = null; // text from HUD element hover (takes priority)
const UPDATE_INTERVAL = 100; // ms

// A screen that can't hover (a phone, a tablet) fires mouseenter on a tap and never the
// mouseleave, so a hover label would stick under the HUD buttons (UX slice 16 R1 m13).
function cannotHover() {
    try {
        return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
            window.matchMedia('(hover: none)').matches;
    } catch (e) {
        return false;
    }
}

// On a screen that can't hover, a tap still shows the label (the only name an icon-only
// button or a one-action tray item has), but only briefly: it clears after TOUCH_LABEL_MS
// or on the next tap anywhere (UX slice 16 R2 m1). The tap's own mouseenter comes after
// its pointerdown, so the listener added here waits for the next tap.
export const TOUCH_LABEL_MS = 1500;
let touchTimer = null;
let touchTapOff = null;

function stopTouchLabel() {
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (touchTapOff) {
        try { document.removeEventListener('pointerdown', touchTapOff, true); } catch (e) { /* no document */ }
        touchTapOff = null;
    }
}

function showTouchLabel(text) {
    stopTouchLabel();
    hoverText = text;
    _applyText(hoverText);
    const end = () => {
        stopTouchLabel();
        if (hoverText === text) hoverText = null;
        _applyText(hoverText ?? proximityText);
    };
    touchTimer = setTimeout(end, TOUCH_LABEL_MS);
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        touchTapOff = end;
        document.addEventListener('pointerdown', touchTapOff, true);
    }
}

/** Called by HUD elements on mouseenter to override the proximity label. */
export function setHudLabel(text) {
    if (text && cannotHover()) { showTouchLabel(text); return; }
    stopTouchLabel();
    hoverText = text || null;
    _applyText(hoverText ?? proximityText);
}

/** Called by HUD elements on mouseleave to restore the proximity label. */
export function clearHudLabel() {
    stopTouchLabel();
    hoverText = null;
    _applyText(proximityText);
}

/**
 * True while something the player must answer covers the world: a confirm dialog, the
 * object or tray action menu, or a minigame. The world caption then says nothing, so it
 * cannot describe the jacket on the floor under a dialog about the vest (UX devices R1).
 */
export function worldCaptionCovered(w = typeof window !== 'undefined' ? window : {}, doc = typeof document !== 'undefined' ? document : null) {
    if (w.MinigameFramework && w.MinigameFramework.currentMinigame) return true;
    if (typeof w.isInteractionMenuOpen === 'function' && w.isInteractionMenuOpen()) return true;
    return !!(doc && typeof doc.querySelector === 'function' && doc.querySelector('.game-confirm-overlay'));
}

export function createInfoLabel() {
    if (document.getElementById('hud-info-label')) return;

    labelEl = document.createElement('div');
    labelEl.id = 'hud-info-label';
    labelEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(labelEl);
}

export function updateInfoLabel() {
    if (!labelEl) return;

    const now = performance.now();
    if (now - lastUpdate < UPDATE_INTERVAL) return;
    lastUpdate = now;

    const player = window.player;
    const rooms  = window.rooms;
    if (!player || !rooms || worldCaptionCovered()) {
        proximityText = null;
        if (!hoverText) _applyText(null);
        return;
    }

    // What E would act on: the same pick, from the one helper (interaction-reach.js pickInteractable), so the
    // label cannot name one thing while E opens another. The text is then read off that target.
    const pick = pickInteractable(player, { rooms, range: INTERACTION_RANGE, rangeSq: INTERACTION_RANGE_SQ, npcReachDistSq, lineClear: interactionLineClear });
    proximityText = pick ? targetText(pick) : null;
    if (!hoverText) _applyText(proximityText);
}

/** The line for what E would act on: an object's observations, a door's sign, an NPC's observations or name. */
function targetText(pick) {
    const t = pick.target;
    if (pick.kind === 'door') return t.doorProperties.door_sign || 'A door with no sign';
    if (pick.kind === 'npc') {
        const npc = t.npcId && window.npcManager ? window.npcManager.getNPC(t.npcId) : null;
        return npc?.observations || npc?.displayName || null;
    }
    let text = resolveObjectField(
        t.scenarioData,
        'observations',
        t.observations || t.scenarioData?.name || t.name || null
    );
    // An unlocked PC stops repeating its "password locked" line: its name instead
    if (worldObservations(t.scenarioData, text, window.pcSessions) === null) {
        text = t.scenarioData?.name || t.name || null;
    }
    // A sign-in PC with a sticky note picture says so (slice 9.2 B)
    if (window.postitMarks?.label) text = window.postitMarks.label(t.scenarioData?.id, text);
    return text;
}

function _applyText(text) {
    if (!labelEl || text === displayedText) return;
    displayedText = text;
    if (text) {
        labelEl.textContent = displayDashes(text);
        labelEl.classList.add('visible');
    } else {
        labelEl.classList.remove('visible');
    }
}

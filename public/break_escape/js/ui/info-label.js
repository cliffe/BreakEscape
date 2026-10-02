/**
 * HUD Info Label
 * Shows the door_sign, item observations, or NPC name/observation for the
 * nearest interactable within reach, using the same scoring logic as
 * tryInteractWithNearest.
 */

import { INTERACTION_RANGE, INTERACTION_RANGE_SQ } from '../utils/constants.js';
import { resolveObjectField } from '../utils/conditional-text.js';
import { displayDashes } from '../utils/display-dashes.js';

const SIDE_DOOR_RANGE_SQ  = INTERACTION_RANGE_SQ * 4;  // 2× radius for E/W doors
const SIDE_DOOR_Y_OFFSET  = INTERACTION_RANGE / 2;

let labelEl       = null;
let lastUpdate    = 0;
let displayedText = null; // what is currently shown — avoids redundant DOM writes
let proximityText = null; // text from nearest world object (updated on interval)
let hoverText     = null; // text from HUD element hover (takes priority)
const UPDATE_INTERVAL = 100; // ms

/** Called by HUD elements on mouseenter to override the proximity label. */
export function setHudLabel(text) {
    hoverText = text || null;
    _applyText(hoverText ?? proximityText);
}

/** Called by HUD elements on mouseleave to restore the proximity label. */
export function clearHudLabel() {
    hoverText = null;
    _applyText(proximityText);
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
    if (!player || !rooms) {
        proximityText = null;
        if (!hoverText) _applyText(null);
        return;
    }

    const px = player.x;
    const py = player.y;

    const playerDirection = player.direction || 'down';
    const facingAngle = _directionToAngle(playerDirection);

    function angularDiff(ox, oy) {
        let angle = Math.atan2(oy - py, ox - px) * 180 / Math.PI;
        angle = (angle + 360) % 360;
        let diff = Math.abs(facingAngle - angle);
        if (diff > 180) diff = 360 - diff;
        return diff;
    }

    let bestScore = Infinity;
    let bestText  = null;

    function consider(ox, oy, text, rangeSq) {
        if (!text) return;
        const dx = ox - px;
        const dy = oy - py;
        if (dx * dx + dy * dy > rangeSq) return;
        const score = angularDiff(ox, oy) * 1000 + Math.sqrt(dx * dx + dy * dy);
        if (score < bestScore) {
            bestScore = score;
            bestText  = text;
        }
    }

    Object.values(rooms).forEach(room => {
        // Items
        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (!obj.active || !obj.interactable || !obj.visible) return;
                const text = resolveObjectField(
                    obj.scenarioData,
                    'observations',
                    obj.observations || obj.scenarioData?.name || obj.name || null
                );
                consider(obj.x, obj.y, text, INTERACTION_RANGE_SQ);
            });
        }

        // Doors
        if (room.doorSprites) {
            Object.values(room.doorSprites).forEach(door => {
                if (!door.active || !door.doorProperties) return;
                const text = door.doorProperties.door_sign || 'A door with no sign';
                const dir = door.doorProperties.direction;
                if (dir === 'east' || dir === 'west') {
                    consider(door.x, door.y + SIDE_DOOR_Y_OFFSET, text, SIDE_DOOR_RANGE_SQ);
                } else {
                    consider(door.x, door.y, text, INTERACTION_RANGE_SQ);
                }
            });
        }

        // NPCs
        if (room.npcSprites) {
            const koCheck = window.npcHostileSystem;
            room.npcSprites.forEach(sprite => {
                if (!sprite.active || !sprite.visible) return;
                if (koCheck && sprite.npcId && koCheck.isNPCKO(sprite.npcId)) return;
                const npc = sprite.npcId && window.npcManager ? window.npcManager.getNPC(sprite.npcId) : null;
                const text = npc?.observations || npc?.displayName || null;
                consider(sprite.x, sprite.y, text, INTERACTION_RANGE_SQ);
            });
        }
    });

    proximityText = bestText;
    if (!hoverText) _applyText(proximityText);
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

function _directionToAngle(dir) {
    switch (dir) {
        case 'right':      return 0;
        case 'down-right': return 45;
        case 'down':       return 90;
        case 'down-left':  return 135;
        case 'left':       return 180;
        case 'up-left':    return 225;
        case 'up':         return 270;
        case 'up-right':   return 315;
        default:           return 90;
    }
}

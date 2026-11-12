/**
 * OBJECT ACTION MENU
 * ==================
 *
 * When an object offers more than one thing the player could do with it right
 * now, a tap shows the existing interaction-menu overlay (ui/interaction-menu.js)
 * listing the ACTIONS, instead of acting straight away. It reuses the same look,
 * the same DOM classes and the same busy-dismiss behaviour as the tap
 * disambiguation menu, so the window.__test bridge drives it with the same
 * chooseInteractionMenu() it already uses.
 *
 * Two sources of actions:
 *   - Built-in: a keycard lying in the world (takeable, not yet held) while the
 *     player carries an RFID cloner — "Copy it with the card copier" (the cloner's own
 *     name, as the inventory shows it; clone in place,
 *     the card stays) or "Take it" (the normal pickup).
 *   - Experimental, author-declared: an object's `actions: [{ label, detail?, do: [actions] }]`
 *     array. Each entry's `do` is a normal applyActions list. Documented as
 *     experimental in NPC_NEEDS_SYSTEM.md §3.3b.
 *
 * No static imports: everything is reached through window, so this module stays
 * off the engine's static graph (no test-harness copy list needs it) and node
 * tests import it directly with a stubbed window.
 */

/** True when the player is carrying an RFID cloner. */
function playerHasCloner() {
    const items = (typeof window !== 'undefined' && window.inventory && window.inventory.items) || [];
    return items.some(it => it && it.scenarioData && it.scenarioData.type === 'rfid_cloner');
}

/** The cloner's name inside a sentence, as the inventory shows it: "card copier". The rule
 *  is rfid-ui.js clonerNameInSentence, reached through window (this module has no static
 *  imports); before that module loads, the default name. */
export function clonerLabel() {
    const items = (typeof window !== 'undefined' && window.inventory && window.inventory.items) || [];
    if (typeof window !== 'undefined' && typeof window.clonerNameInSentence === 'function') {
        return window.clonerNameInSentence(items);
    }
    return 'card copier';
}

/** True when this sprite is an inventory copy, not a world object. */
function isInventoryItem(sprite) {
    const data = sprite && sprite.scenarioData;
    if (!data) return false;
    if (data.takeable === false) return true;
    return typeof sprite.objectId === 'string' && sprite.objectId.startsWith('inventory_');
}

/**
 * Build the list of actions this object offers right now. Returns
 * [{ label, detail?, onSelect }]. An empty or single-entry list means "no menu":
 * the caller runs the object's normal interaction instead.
 */
export function objectActions(sprite) {
    const data = (sprite && sprite.scenarioData) || null;
    if (!data) return [];
    const actions = [];

    // Experimental author-declared actions.
    if (Array.isArray(data.actions)) {
        for (const a of data.actions) {
            if (!a || !a.label) continue;
            const list = Array.isArray(a.do) ? a.do : (Array.isArray(a.actions) ? a.actions : []);
            actions.push({
                label: a.label,
                detail: a.detail,
                onSelect: () => { try { window.applyActions?.(list, { source: 'action_menu' }); } catch (e) { console.error('[ActionMenu] action failed:', e); } }
            });
        }
    }

    // Built-in: a world keycard the player could clone or take, cloner in hand.
    if (data.type === 'keycard' && data.takeable === true && !isInventoryItem(sprite) && playerHasCloner()) {
        const device = clonerLabel();
        actions.push({
            label: `Copy it with the ${device}`,
            detail: `Read the card and save a copy on the ${device}. The card stays where it is.`,
            onSelect: () => {
                if (window.startRFIDMinigame) {
                    // A world keycard copied in place: its stamped id is the clone source, so the
                    // copy is recorded and listed (SYNC_DELTAS_PLAN 5.2).
                    window.startRFIDMinigame(null, null, { mode: 'clone', cardToClone: data, cloneFrom: 'world' });
                } else {
                    window.gameAlert?.('RFID minigame not available', 'error', 'Error', 3000);
                }
            }
        });
        actions.push({
            label: 'Take it',
            detail: 'Pick the card up and carry it. The owner will notice it gone.',
            onSelect: () => runDefaultInteraction(sprite)
        });
    }

    return actions;
}

/** Run the object's normal interaction, bypassing the action menu so it can't recurse. */
function runDefaultInteraction(sprite) {
    try {
        sprite._beActionMenuBypass = true;
        window.handleObjectInteraction?.(sprite);
    } finally {
        delete sprite._beActionMenuBypass;
    }
}

/**
 * If this object offers more than one action, show the action menu and return
 * true (the caller stops). Otherwise return false (run the normal interaction).
 * Busy-guarded: never opens over a chat, a minigame, or an already-open menu.
 */
export function maybeShowObjectActionMenu(sprite) {
    if (!sprite || sprite._beActionMenuBypass) return false;
    const actions = objectActions(sprite);
    if (actions.length < 2) return false;

    // Busy guard: don't stack over an open minigame/chat or another menu.
    if (window.MinigameFramework && window.MinigameFramework.currentMinigame) return false;
    if (window.isInteractionMenuOpen && window.isInteractionMenuOpen()) return false;
    if (!window.showInteractionMenu) return false;

    window.showInteractionMenu(actions, undefined, undefined, 'Choose an action…');
    return true;
}

if (typeof window !== 'undefined') {
    window.objectActions = objectActions;
    window.maybeShowObjectActionMenu = maybeShowObjectActionMenu;
}

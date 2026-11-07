/**
 * LEFT-CARD CONSEQUENCE
 * =====================
 *
 * Scenario-driven reaction to a left-behind item the player took. The needs
 * system (npc-needs.js, the office-life session — not edited here) emits
 * `npc_left_item_gone:<ownerId>` { npcId, itemId, ... } once, when an NPC comes
 * back to its post and finds an item it had left is gone (NPC_NEEDS_SYSTEM.md
 * §3.3b). This module consumes that event: it finds the scenario object whose id
 * is `itemId` and, if it declares `onOwnerNoticesMissing: [actions]`, runs that
 * list through applyActions.
 *
 *   "onOwnerNoticesMissing": [ { "type": "revoke_card", "card_id": "clerk_card" } ]
 *
 * The owner's spoken reaction stays a TTS-voiceable scenario bark on the owner
 * NPC's eventMappings (`npc_left_item_gone:<owner>`), never engine text.
 *
 * Reached through window (applyActions), so no static import; loaded dynamically
 * in core/game.js beside the needs system.
 */

/** Find the declared scenario object with this id (first match across all rooms). */
function findScenarioObjectById(id) {
    if (id == null) return null;
    const rooms = (window.gameScenario && window.gameScenario.rooms) || {};
    for (const room of Object.values(rooms)) {
        const objs = room && room.objects;
        if (!Array.isArray(objs)) continue;
        const hit = objs.find(o => o && o.id === id);
        if (hit) return hit;
    }
    return null;
}

export function installLeftCardConsequence() {
    const dispatcher = window.eventDispatcher;
    if (!dispatcher || typeof dispatcher.on !== 'function') {
        console.warn('[LeftCard] no event dispatcher; consequence not installed');
        return;
    }
    const seen = new Set(); // one reaction per item, defensively

    dispatcher.on('npc_left_item_gone:*', (data) => {
        const itemId = data && data.itemId;
        if (!itemId || seen.has(itemId)) return;
        const obj = findScenarioObjectById(itemId);
        const actions = obj && obj.onOwnerNoticesMissing;
        if (!Array.isArray(actions) || actions.length === 0) return;
        seen.add(itemId);
        console.log('[LeftCard] owner noticed', itemId, 'gone; running onOwnerNoticesMissing');
        try {
            window.applyActions?.(actions, { source: 'owner_notices_missing' });
        } catch (e) {
            console.error('[LeftCard] onOwnerNoticesMissing failed:', e);
        }
    });

    console.log('✅ Left-card consequence installed');
}

if (typeof window !== 'undefined') window.installLeftCardConsequence = installLeftCardConsequence;

/**
 * LEFT-CARD CONSEQUENCE
 * =====================
 *
 * Scenario-driven reaction to a left-behind item the player took. The needs
 * system (npc-needs.js, the office-life session — not edited here) emits
 * `npc_left_item_gone:<ownerId>` { npcId, itemId, ... } once, when an NPC comes
 * back to its post and finds an item it had left is gone (NPC_NEEDS_SYSTEM.md
 * §3.3b). This module consumes that event: it runs the taken object's
 * `onOwnerNoticesMissing: [actions]` list through applyActions.
 *
 *   "onOwnerNoticesMissing": [ { "type": "revoke_card", "card_id": "clerk_card" } ]
 *
 * The owner's spoken reaction stays a TTS-voiceable scenario bark on the owner
 * NPC's eventMappings (`npc_left_item_gone:<owner>`), never engine text.
 *
 * The server strips object definitions from the scenario it sends the client, so
 * the config lives only on the live sprite's `scenarioData`, which is destroyed
 * when the player takes the item. So the config is cached while the sprite still
 * exists — at the left-behind reveal (`object_revealed:<itemId>`) and on install
 * — keyed by item id, and read back when the owner notices it gone.
 *
 * Reached through window (applyActions), so no static import; loaded dynamically
 * in core/game.js beside the needs system.
 */

export function installLeftCardConsequence() {
    const dispatcher = window.eventDispatcher;
    if (!dispatcher || typeof dispatcher.on !== 'function') {
        console.warn('[LeftCard] no event dispatcher; consequence not installed');
        return;
    }

    const configByItem = new Map(); // itemId -> onOwnerNoticesMissing actions
    const reacted = new Set();      // one reaction per item

    // Remember a live object's onOwnerNoticesMissing while its sprite still exists.
    const remember = (sprite) => {
        const data = sprite && sprite.scenarioData;
        const id = data && data.id;
        const actions = data && data.onOwnerNoticesMissing;
        if (id && Array.isArray(actions) && actions.length) configByItem.set(id, actions);
    };

    // Sweep every loaded room's objects (cheap; objects maps are small).
    const sweep = () => {
        const rooms = window.rooms || {};
        for (const room of Object.values(rooms)) {
            const objs = room && room.objects;
            if (!objs) continue;
            for (const sp of Object.values(objs)) remember(sp);
        }
    };

    sweep();

    // A left-behind item is shown by object_revealed:<itemId> { objectId, leftBehindBy }.
    // Cache its config the moment it appears, before the player can take it.
    dispatcher.on('object_revealed:*', (data) => {
        const id = data && (data.objectId || data.itemId);
        if (!id) return;
        const sp = findLoadedObject(id);
        if (sp) remember(sp);
    });

    dispatcher.on('npc_left_item_gone:*', (data) => {
        const itemId = data && data.itemId;
        if (!itemId || reacted.has(itemId)) return;
        let actions = configByItem.get(itemId);
        if (!actions) { sweep(); actions = configByItem.get(itemId); } // last chance
        if (!Array.isArray(actions) || actions.length === 0) return;
        reacted.add(itemId);
        console.log('[LeftCard] owner noticed', itemId, 'gone; running onOwnerNoticesMissing');
        try {
            window.applyActions?.(actions, { source: 'owner_notices_missing' });
        } catch (e) {
            console.error('[LeftCard] onOwnerNoticesMissing failed:', e);
        }
    });

    console.log('✅ Left-card consequence installed');
}

/** Find a loaded world object sprite by its scenario id across all loaded rooms. */
function findLoadedObject(id) {
    const rooms = window.rooms || {};
    for (const room of Object.values(rooms)) {
        const objs = room && room.objects;
        if (objs && objs[id]) return objs[id];
    }
    return null;
}

if (typeof window !== 'undefined') window.installLeftCardConsequence = installLeftCardConsequence;

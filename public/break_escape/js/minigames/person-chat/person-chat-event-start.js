/**
 * Start an event-triggered conversation (a cutscene, a video call, a mapping's knot)
 * without losing the NPC's story state.
 *
 * Event conversations used to jump straight to their knot in a freshly loaded story,
 * skipping the saved state. The NPC's ink-local VARs and visit counts were reset, so
 * once-only and sticky choices came back (sis01 D2: Helen's exhausted topics returned
 * after a cutscene), and the save on close then overwrote the good state.
 *
 * Now: restore what was saved (the full state if there is one, else the saved
 * variables), then go to the event's knot. Globals and inventory are synced by the
 * caller afterwards, as for any conversation.
 *
 * @param {Object} opts
 * @param {string} opts.npcId
 * @param {Object} opts.story - the loaded inkjs Story
 * @param {Object} opts.conversation - has goToKnot(knot) and a storyEnded flag
 * @param {string} opts.startKnot
 * @param {Object} [opts.stateManager] - npcConversationStateManager
 * @returns {boolean|string} what restoreNPCState returned (false when nothing was saved)
 */
export function startEventConversation({ npcId, story, conversation, startKnot, stateManager }) {
    let restored = false;
    try {
        restored = stateManager?.restoreNPCState?.(npcId, story) || false;
    } catch (e) {
        console.warn(`⚠️ Could not restore ${npcId}'s story state before the event knot:`, e);
        restored = false;
    }
    conversation.goToKnot(startKnot);
    // A restored full state may have been at END; the jump gives it a position again
    conversation.storyEnded = false;
    return restored;
}

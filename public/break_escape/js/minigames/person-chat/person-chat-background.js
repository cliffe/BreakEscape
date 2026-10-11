/**
 * Which background a person-chat conversation opens with.
 *
 * Precedence, highest first:
 *   1. Background[...] lines in the ink. These run during the conversation and
 *      replace whatever this picks (PersonChatPortraits.setBackground), so they
 *      always win and are not handled here.
 *   2. An explicit background passed to the minigame: a timed conversation's
 *      `background`, an event mapping's `background`, or the phone-to-person
 *      transition. "none" means no background, with no room fallback.
 *   3. The NPC's own `chatBackground` (a bedside view for a patient in bed,
 *      say), wherever the conversation happens.
 *   4. The `chatBackground` of the room the conversation happens in: the NPC's
 *      live room (it may have walked), else its assigned room, else the
 *      player's current room.
 *   5. None: the plain frame.
 *
 * Video calls keep today's behaviour: the caller is somewhere else, so the
 * room fallback does not apply.
 */

/**
 * Pure resolution, no globals.
 * @param {Object} o
 * @param {string|null} [o.explicit] - background passed to the minigame
 * @param {string|null} [o.npcBackground] - the NPC's own chatBackground
 * @param {boolean} [o.videoCall] - conversation is a video call
 * @param {Array<string|null|undefined>} [o.roomIds] - candidate rooms, best first
 * @param {Object} [o.rooms] - scenario rooms by id
 * @returns {string|null} image path, or null for no background
 */
export function resolvePersonChatBackground({ explicit = null, npcBackground = null, videoCall = false, roomIds = [], rooms = {} } = {}) {
    if (typeof explicit === 'string' && explicit.trim()) {
        return explicit.trim().toLowerCase() === 'none' ? null : explicit.trim();
    }
    if (videoCall) return null;
    if (typeof npcBackground === 'string' && npcBackground.trim()) return npcBackground.trim();
    const roomId = roomIds.find(id => id && id !== 'unknown' && rooms && rooms[id]);
    const bg = roomId ? rooms[roomId].chatBackground : null;
    return typeof bg === 'string' && bg.trim() ? bg.trim() : null;
}

/**
 * Candidate rooms for an NPC's conversation, best first: the NPC's live room
 * from its behaviour (updated as it moves), its assigned room, the player's room.
 * @param {string} npcId
 * @param {Object} [w] - the window (injectable for tests)
 * @returns {Array<string|null>}
 */
export function conversationRoomIds(npcId, w = (typeof window !== 'undefined' ? window : {})) {
    const behaviourRoom = w.npcBehaviorManager?.getBehavior?.(npcId)?.roomId || null;
    const npcRoom = w.npcManager?.getNPC?.(npcId)?.roomId || null;
    const playerRoom = w.currentPlayerRoom || null;
    return [behaviourRoom, npcRoom, playerRoom];
}

/**
 * The background a person-chat should open with, reading live game state.
 * @param {Object} params - the minigame params (npcId, background, videoCall)
 * @param {Object} [w] - the window (injectable for tests)
 * @returns {string|null}
 */
export function personChatBackgroundFor(params, w = (typeof window !== 'undefined' ? window : {})) {
    return resolvePersonChatBackground({
        explicit: params?.background ?? null,
        npcBackground: w.npcManager?.getNPC?.(params?.npcId)?.chatBackground ?? null,
        videoCall: !!params?.videoCall,
        roomIds: conversationRoomIds(params?.npcId, w),
        rooms: w.gameScenario?.rooms || {}
    });
}

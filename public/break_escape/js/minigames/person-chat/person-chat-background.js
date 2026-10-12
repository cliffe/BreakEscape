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
 *      player's current room. A wide room, or one whose NPCs stand in
 *      different places, can give a list of views by the NPC's position:
 *        "chatBackground": [
 *          { "x": [0, 0.5], "image": "assets/backgrounds/rooms/<name>_left_blended.png" },
 *          { "x": [0.5, 1], "image": "assets/backgrounds/rooms/<name>_blended.png" }
 *        ]
 *      x is the share of the room's width (0 = left wall, 1 = right wall). The
 *      view whose range holds the NPC's x when the chat starts wins; with no
 *      position known, or no range matching, the first entry is used.
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
 * @param {Object<string, number>} [o.npcX] - the NPC's x as a share of each candidate room's width (0-1), by room id
 * @returns {string|null} image path, or null for no background
 */
export function resolvePersonChatBackground({ explicit = null, npcBackground = null, videoCall = false, roomIds = [], rooms = {}, npcX = {} } = {}) {
    if (typeof explicit === 'string' && explicit.trim()) {
        return explicit.trim().toLowerCase() === 'none' ? null : explicit.trim();
    }
    if (videoCall) return null;
    if (typeof npcBackground === 'string' && npcBackground.trim()) return npcBackground.trim();
    const roomId = roomIds.find(id => id && id !== 'unknown' && rooms && rooms[id]);
    return roomId ? pickRoomBackground(rooms[roomId].chatBackground, npcX?.[roomId]) : null;
}

/**
 * A room's chatBackground: a path, or a list of views by the NPC's x (share of the room's width).
 * @param {string|Array<{x: number[], image: string}>} bg
 * @param {number} [x] - the NPC's x as a share of the room's width
 * @returns {string|null}
 */
export function pickRoomBackground(bg, x) {
    if (typeof bg === 'string') return bg.trim() || null;
    if (!Array.isArray(bg)) return null;
    const views = bg.filter(v => v && typeof v.image === 'string' && v.image.trim());
    if (!views.length) return null;
    const hit = Number.isFinite(x) && views.find(v => Array.isArray(v.x) && x >= v.x[0] && x <= v.x[1]);
    return (hit || views[0]).image.trim();
}

/**
 * Where the NPC stands across a room, as a share of the room's width (0-1): its live sprite if
 * the room is drawn, else its placed position (tiles) against the room's map width.
 * @param {string} npcId
 * @param {string} roomId
 * @param {Object} [w] - the window (injectable for tests)
 * @returns {number|undefined}
 */
export function npcShareAcrossRoom(npcId, roomId, w = (typeof window !== 'undefined' ? window : {})) {
    const room = w.rooms?.[roomId];
    const width = room?.map?.widthInPixels;
    if (!room || !width) return undefined;
    const npc = w.npcManager?.getNPC?.(npcId);
    const sprite = (npc?._sprite || npc?.sprite || room.npcSprites?.find?.(s => s.npcId === npcId));
    const tile = room.map.tileWidth || 32;
    const left = room.position?.x || 0;
    let px;
    if (sprite && sprite.active !== false && Number.isFinite(sprite.x) && sprite.x >= left && sprite.x <= left + width) {
        px = sprite.x - left;     // the sprite is in this room now (it may have walked)
    } else if (npc?.roomId === roomId && Number.isFinite(npc?.position?.x)) {
        px = npc.position.x * tile;
    }
    return px === undefined ? undefined : Math.min(1, Math.max(0, px / width));
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
    const roomIds = conversationRoomIds(params?.npcId, w);
    const npcX = {};
    for (const id of roomIds) {
        if (id && !(id in npcX)) npcX[id] = npcShareAcrossRoom(params?.npcId, id, w);
    }
    return resolvePersonChatBackground({
        explicit: params?.background ?? null,
        npcBackground: w.npcManager?.getNPC?.(params?.npcId)?.chatBackground ?? null,
        videoCall: !!params?.videoCall,
        roomIds,
        rooms: w.gameScenario?.rooms || {},
        npcX
    });
}

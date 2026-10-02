/**
 * LOCKPICK CATCH GATE
 * ===================
 *
 * One gate for every way a player starts picking a lock: the direct pick path
 * (no keys, lockpick only) and "Switch to Lockpicking" from the key minigame.
 * If an NPC in the room can see the player and has a lockpick_used_in_view
 * person-chat mapping that would fire now, the pick is stopped and the event
 * is emitted so the NPC's conversation opens.
 *
 * Returns the catching NPC, or null when nobody is watching (pick goes ahead).
 * `beforeEmit` runs after the decision and before the event, so a caller can
 * close an open minigame first (the conversation must not open on top of it).
 */
export function catchLockpickInView(lockable, { beforeEmit } = {}) {
    const npcManager = window.npcManager;
    const roomIds = lockpickWatchRooms(lockable);
    if (!npcManager || roomIds.length === 0) return null;

    const player = window.player;
    const playerPos = player?.sprite?.getCenter
        ? player.sprite.getCenter()
        : { x: player?.x || 0, y: player?.y || 0 };

    const npc = npcManager.shouldInterruptLockpickingWithPersonChat(roomIds, playerPos);
    if (!npc) return null;
    // The catcher's room, so a handler can tell which watcher this event is for
    const roomId = npc.roomId;

    console.log(`🚫 LOCKPICKING INTERRUPTED: Triggering person-chat with NPC "${npc.id}"`);
    if (beforeEmit) beforeEmit(npc);
    npcManager.eventDispatcher?.emit('lockpick_used_in_view', {
        npcId: npc.id,
        roomId,
        lockable,
        timestamp: Date.now()
    });
    return npc;
}

/**
 * Rooms whose NPCs may catch a pick of this lockable: the player's room
 * (window.currentPlayerRoom; window.currentRoomId is never set) and the room the
 * lock belongs to (a door's roomId, or the room a container sprite was loaded
 * in). Line of sight then decides who actually sees the player.
 */
export function lockpickWatchRooms(lockable) {
    const rooms = [
        window.currentPlayerRoom,
        lockable?.doorProperties?.roomId,
        lockable?.roomId
    ].filter(r => typeof r === 'string' && r.length > 0);
    return [...new Set(rooms)];
}

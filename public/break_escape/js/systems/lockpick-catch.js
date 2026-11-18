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
import KeyCutCalculator from '../utils/key-cut-calculator.js';

// A catch holds for a moment: a second attempt on the same lock straight after
// (one click reaching two handlers, before the catch conversation has opened)
// must not find the mapping on cooldown and let the pick through. The repeat
// gets the same catcher back and emits nothing.
export const CATCH_HOLD_MS = 1000;
const recentCatches = new WeakMap();

export function catchLockpickInView(lockable, { beforeEmit } = {}) {
    const now = Date.now();
    const npcManager = window.npcManager;
    const roomIds = lockpickWatchRooms(lockable);
    if (!npcManager || roomIds.length === 0) return null;

    const recent = lockable && typeof lockable === 'object' ? recentCatches.get(lockable) : null;
    if (recent && now - recent.at < CATCH_HOLD_MS && recent.manager === npcManager &&
        npcManager.npcs?.get?.(recent.npc.id) === recent.npc && roomIds.includes(recent.npc.roomId)) {
        console.log(`🚫 LOCKPICKING STILL BLOCKED: "${recent.npc.id}" caught this lock ${now - recent.at}ms ago`);
        return recent.npc;
    }

    const player = window.player;
    const playerPos = player?.sprite?.getCenter
        ? player.sprite.getCenter()
        : { x: player?.x || 0, y: player?.y || 0 };

    const npc = npcManager.shouldInterruptLockpickingWithPersonChat(roomIds, playerPos, lockable);
    if (!npc) return null;
    // The catcher's room, so a handler can tell which watcher this event is for
    const roomId = npc.roomId;

    console.log(`🚫 LOCKPICKING INTERRUPTED: Triggering person-chat with NPC "${npc.id}"`);
    if (lockable && typeof lockable === 'object') recentCatches.set(lockable, { npc, manager: npcManager, at: now });
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

/**
 * The lock's pin heights as key mode reads them (startKeySelectionMinigame): the
 * door's keyPins, else the item's scenarioData.keyPins, else keyPins on the lockable
 * itself. Undefined when none is set (the minigame then falls back to a preset).
 */
export function lockKeyPinsOf(lockable) {
    const pins = lockable?.doorProperties?.keyPins || lockable?.scenarioData?.keyPins || lockable?.keyPins;
    return Array.isArray(pins) ? pins : undefined;
}

/**
 * Could any key the player holds open a lock with these pin heights? Mirrors the key
 * minigame exactly: a key's cuts are its `cuts`, else its keyPins (or key.keyPins)
 * run through KeyCutCalculator.calculateCutDepthsRounded; the lock's cuts come from
 * the same call on the lock's pins; the cut lists must be the same length and each
 * cut within 5px. A key that carries no cut or pin data is treated as "might fit"
 * (we cannot tell), so only a hand that is provably all wrong keys returns false.
 * Used to open a key-holding player straight in lockpicking mode when no held
 * key matches (m01 blind playtest, item 4).
 */
export function anyKeyMightFitLock(playerKeys, lockKeyPins) {
    if (!Array.isArray(lockKeyPins) || lockKeyPins.length === 0) return true;
    if (!Array.isArray(playerKeys) || playerKeys.length === 0) return false;
    const TOL = 5;
    const lockCuts = KeyCutCalculator.calculateCutDepthsRounded(lockKeyPins);
    const close = (a) => Array.isArray(a) && a.length === lockCuts.length &&
        a.every((v, i) => Math.abs(v - lockCuts[i]) <= TOL);
    return playerKeys.some(key => {
        const d = key?.scenarioData || {};
        if (Array.isArray(d.cuts)) return close(d.cuts);
        const pins = d.keyPins || key?.keyPins;
        if (Array.isArray(pins)) return close(KeyCutCalculator.calculateCutDepthsRounded(pins));
        return true;
    });
}

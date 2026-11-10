/**
 * How loud a room's sounds are where the player is: the player's own room 1, a room joined to
 * it by a door 0.4, anywhere else 0. Shared by the lighting system (tube clicks) and the NPC
 * office visuals (use sounds, OFFICE_LIFE_PLAN 2.12); a helper because window.lightingSystem
 * is null in a scenario without lighting. No imports, so test harness copies stay simple.
 */
export const THROUGH_DOOR = 0.4;

export function hearingLevel(roomId,
    playerRoom = (typeof window !== 'undefined' ? window.currentPlayerRoom : undefined),
    rooms = (typeof window !== 'undefined' ? window.rooms : undefined)) {
    if (!roomId || roomId === playerRoom) return 1;
    const doors = rooms?.[playerRoom]?.doorSprites || [];
    return doors.some(d => d.doorProperties?.connectedRoom === roomId) ? THROUGH_DOOR : 0;
}

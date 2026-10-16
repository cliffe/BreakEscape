/**
 * The leash on a hostile NPC's chase (7.1a; m06 D8, m07 U10, m08 E11).
 *
 * A hostile NPC used to follow the player through doors and across the map for
 * as long as the player stayed within its aggro distance. Now it chases only
 * while the player is
 *   - within `chaseRange` px of the NPC's post (where it stood, or the point of
 *     its patrol, when the chase began), and
 *   - in the room the NPC started the chase in, unless the scenario sets
 *     behavior.hostile.chaseAcrossRooms: true.
 * Past either limit it gives up and goes back to its post: a stationary NPC
 * walks home (npc-behavior.js checkAndHandleHomePush), a patroller resumes
 * its patrol. It chases again if the player comes back inside the leash.
 *
 * Kept free of imports so it can be tested in isolation.
 *
 * @param {object} p
 * @param {{x:number,y:number}} p.playerPos - player's feet
 * @param {string|null} p.playerRoomId - window.currentPlayerRoom
 * @param {{x:number,y:number,roomId?:string}|null} p.anchor - the NPC's post
 * @param {number} p.chaseRange - px from the post
 * @param {boolean} [p.acrossRooms=false] - follow the player through doors
 * @returns {boolean} true if the NPC may keep chasing
 */
export function hostileMayChase({ playerPos, playerRoomId, anchor, chaseRange, acrossRooms = false }) {
  if (!playerPos || !anchor) return true;
  if (!acrossRooms && anchor.roomId && playerRoomId && playerRoomId !== anchor.roomId) {
    return false;
  }
  if (typeof chaseRange === 'number' && chaseRange > 0) {
    const dx = playerPos.x - anchor.x;
    const dy = playerPos.y - anchor.y;
    if (dx * dx + dy * dy > chaseRange * chaseRange) return false;
  }
  return true;
}

/**
 * The scenario's chase range for an NPC: behavior.hostile.chaseRange when it is
 * a positive number, otherwise the combat-config.js default.
 */
export function resolveChaseRange(configured, fallback) {
  return (typeof configured === 'number' && configured > 0) ? configured : fallback;
}

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

/**
 * How far past its attack range a chasing NPC steps straight at the player
 * instead of following a path (m04 confirmation N2, 2026-10-17).
 */
export const CLOSE_IN_MARGIN = 48;

/**
 * True when a chasing NPC is just out of reach and should walk straight at the
 * player. A knockback that left the player 33 px from Cipher (range 32) used to
 * end his attacks: at that distance the NPC's and the player's grid cells are
 * the same or next to each other, the path came back empty or as a waypoint he
 * was already on, and he stood still until the player walked back in.
 * Only with a clear line, so it never walks into a wall or desk.
 * @param {object} p
 * @param {number} p.distance - px, NPC body centre to player
 * @param {number} p.attackRange - px
 * @param {boolean} p.lineOfSight - nothing solid between them
 * @returns {boolean}
 */
export function shouldCloseInDirectly({ distance, attackRange, lineOfSight }) {
  if (!lineOfSight || !Number.isFinite(distance) || !Number.isFinite(attackRange)) return false;
  return distance > attackRange && distance <= attackRange + CLOSE_IN_MARGIN;
}

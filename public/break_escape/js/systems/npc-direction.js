// Facing direction read from an NPC animation key, and the pose a knocked-out NPC is
// drawn in after a reload (npc-sprites.js). No imports, so node tests can load it.

const DIRECTION_SUFFIX = /-((?:up|down)-(?:left|right)|up|down|left|right)$/;

/**
 * "npc-sarah-idle-down" -> "down", "npc-sarah-walk-up-left" -> "up-left".
 * Keys with no direction, such as the legacy "npc-sarah-idle" every sprite starts on,
 * give null (splitting on "-" used to return "idle" there).
 */
export function directionFromAnimKey(key) {
  const m = DIRECTION_SUFFIX.exec(String(key || ''));
  return m ? m[1] : null;
}

/**
 * The death animation to show a knocked-out NPC lying in: its facing direction if that
 * exists, else facing down, else any direction it has. null when it has no death
 * animation at all.
 * @param {string} npcId
 * @param {string} direction
 * @param {(key:string)=>boolean} exists  scene.anims.exists
 */
export function koPoseAnimKey(npcId, direction, exists) {
  const order = [direction, 'down', 'up', 'left', 'right', 'down-left', 'down-right', 'up-left', 'up-right'];
  for (const d of order) {
    if (!d) continue;
    const key = `npc-${npcId}-death-${d}`;
    if (exists(key)) return key;
  }
  return null;
}

// The live death animation lowers the body by shifting originY down by this much over
// its frames (npc-hostile.js playNPCDeathAnimation); a restored body gets the same shift.
export const KO_ORIGIN_SHIFT = 0.5;

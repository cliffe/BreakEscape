/**
 * Fight styles and the small rules behind blocking, the punch combo and
 * fleeing. A scenario picks a style per NPC with behavior.hostile.fightStyle:
 *
 *   brawler (default) - walks up, telegraphs, throws a cross. What every NPC
 *                       did before fight styles existed.
 *   guarded (boss)    - guards whenever it isn't swinging: punches into the
 *                       guard do a fifth of their damage and don't push it
 *                       back. It is open while it winds up, swings and
 *                       recovers, and while it walks in. Hits during the
 *                       windup don't stop the swing (it has armour then).
 *   slugger           - a long, clear telegraph, then a heavy cross and a
 *                       long recovery. Never guards: easy once its timing is
 *                       learned.
 *   cower             - runs from the player and only throws quick jabs when
 *                       cornered or caught.
 *
 * Kept free of imports so it can be tested in isolation.
 */

export const DEFAULT_FIGHT_STYLE = 'brawler';

export const FIGHT_STYLES = {
  brawler: {
    attack: 'cross',      // NPC animation: 'cross' (cross-punch) or 'jab' (lead-jab)
    windupMs: 500,        // telegraph shown before the swing
    recoveryMs: 0,        // open after the swing before guarding again
    guards: false,        // guards while not winding up or recovering
    guardDamageScale: 1,  // share of a punch's damage that gets through the guard
    armouredWindup: false, // player hits during the windup don't push it back
    flees: false          // keeps its distance; attacks only when the player is close
  },
  guarded: {
    attack: 'cross',
    windupMs: 650,
    recoveryMs: 1000,     // room for the full jab, jab, cross (about 0.8 s) after blocking the swing
    guards: true,
    guardDamageScale: 0.2,
    armouredWindup: true,
    flees: false
  },
  slugger: {
    attack: 'cross',
    windupMs: 900,
    recoveryMs: 1200,
    guards: false,
    guardDamageScale: 1,
    armouredWindup: false,
    flees: false
  },
  cower: {
    attack: 'jab',
    windupMs: 250,
    recoveryMs: 0,
    guards: false,
    guardDamageScale: 1,
    armouredWindup: false,
    flees: true,
    fleeDistance: 150     // px it tries to keep between itself and the player (aggroDistance is 160)
  }
};

/** The style's settings; an unknown or missing name gives the brawler. */
export function resolveFightStyle(name) {
  const key = typeof name === 'string' && FIGHT_STYLES[name] ? name : DEFAULT_FIGHT_STYLE;
  return { name: key, ...FIGHT_STYLES[DEFAULT_FIGHT_STYLE], ...FIGHT_STYLES[key] };
}

/**
 * Whether an NPC of this style has its guard up: never while it winds up or
 * swings, nor before `openUntil` (its recovery), nor while it walks.
 */
export function npcIsGuarding({ style, attacking, moving, now, openUntil = 0 }) {
  if (!style?.guards) return false;
  if (attacking || moving) return false;
  return now >= openUntil;
}

/** Damage that gets through a guard or a block: at least 1 if any was dealt. */
export function blockedDamage(damage, scale) {
  if (!(damage > 0)) return 0;
  const s = typeof scale === 'number' && scale >= 0 ? scale : 1;
  return Math.max(1, Math.round(damage * s));
}

const FACING_DEGREES = {
  'right': 0, 'down-right': 45, 'down': 90, 'down-left': 135,
  'left': 180, 'up-left': 225, 'up': 270, 'up-right': 315
};

/**
 * Whether a defender facing `direction` covers an attacker at (dx, dy) from it:
 * the attacker is within `halfAngle` degrees of the way it faces. A block
 * only stops punches from the front.
 */
export function facingCovers(direction, dx, dy, halfAngle = 70) {
  if (dx === 0 && dy === 0) return true;
  const facing = FACING_DEGREES[direction] ?? 90;
  const target = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  let diff = Math.abs(target - facing);
  if (diff > 180) diff = 360 - diff;
  return diff <= halfAngle;
}

/** The eight-way facing ('down-left' etc.) that points along (dx, dy). */
export function directionToward(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax > ay * 2) return dx > 0 ? 'right' : 'left';
  if (ay > ax * 2) return dy > 0 ? 'down' : 'up';
  if (dy > 0) return dx > 0 ? 'down-right' : 'down-left';
  return dx > 0 ? 'up-right' : 'up-left';
}

// The player's punch combo: three presses in a row give jab, jab, cross.
export const PUNCH_COMBO = ['jab', 'jab', 'cross'];
// A press within this long of the last punch ending carries the combo on.
export const COMBO_WINDOW_MS = 700;

/**
 * Which step of the combo the next press throws.
 * @param {number} lastStep - index of the last punch thrown, or -1 for none
 * @param {number} msSinceLastEnded - time since that punch finished
 */
export function nextComboStep(lastStep, msSinceLastEnded, windowMs = COMBO_WINDOW_MS) {
  if (lastStep < 0 || lastStep >= PUNCH_COMBO.length - 1) return 0;
  if (!(msSinceLastEnded <= windowMs)) return 0;
  return lastStep + 1;
}

/**
 * Pick a way to run from the player: the open heading that points most
 * directly away. `isClear(ux, uy)` says whether a short run that way is free
 * of walls. Returns a unit vector { x, y }, or null when every way out is
 * blocked or leads back towards the player (cornered).
 * @param {number} awayX - NPC x minus player x
 * @param {number} awayY - NPC y minus player y
 */
export function pickFleeHeading(awayX, awayY, isClear) {
  const len = Math.hypot(awayX, awayY);
  const ax = len > 0 ? awayX / len : 0;
  const ay = len > 0 ? awayY / len : 1;
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const score = ux * ax + uy * ay;
    // Sideways is fine (slipping along a wall); back towards the player isn't
    if (score < -0.2) continue;
    if (score <= bestScore) continue;
    if (!isClear(ux, uy)) continue;
    best = { x: ux, y: uy };
    bestScore = score;
  }
  return best;
}

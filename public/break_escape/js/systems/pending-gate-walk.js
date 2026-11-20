/**
 * PENDING GATE WALK
 * =================
 *
 * A far click on an open gate (game.js scene pointerdown) walks the player to the near side
 * first. Once he is in reach of the door, the gate is asked again: still open to him, he walks
 * on through; shut, or barring him now, he stays on the near side, as a far click on a shut
 * gate leaves him. Dropped if he stops short (a wall, another walk), after PENDING_GATE_WALK_MS,
 * for a destroyed door, or when a minigame opens on the way (a sight challenge, a scripted
 * call): he does not walk through under the panel or when it closes (lab UX review R2 n1).
 *
 * No imports, so the node tests load this file on its own; game.js passes the engine pieces.
 */

export const PENDING_GATE_WALK_MS = 10000;
const STOPPED_SHORT_MS = 400;   // not moving this long after the click: he stopped short

/**
 * @param {object} deps
 * @param {function(): ?{x:number,y:number}} deps.player - the player sprite now
 * @param {function(object, {x:number,y:number}): ?{x:number,y:number}} deps.walkThroughTarget - doorGates.walkThroughTarget
 * @param {function(number, number): void} deps.moveTo - movePlayerToPoint
 * @param {function(): boolean} deps.isMoving - the player is on a click-to-move path
 * @param {function(object): {x:number,y:number}} deps.feet - playerFeet
 * @param {number} deps.range - DOOR_INTERACTION_RANGE
 * @param {function(): boolean} [deps.minigameOpen] - a minigame is open now
 */
export function createPendingGateWalk(deps) {
    let pending = null;
    return {
        /** A far click on an open gate: walk on through once in reach, if it still lets him by. */
        arm(door, at = Date.now()) { pending = door ? { door, at } : null; },
        /** Any new click, a key press or a minigame: forget it. */
        clear() { pending = null; },
        get() { return pending; },
        /** Run from the scene's update(). */
        update(now = Date.now()) {
            const p = pending;
            if (!p) return;
            const player = deps.player();
            if (!player) return;
            if (now - p.at > PENDING_GATE_WALK_MS || p.door?.destroyed) { pending = null; return; }
            if (deps.minigameOpen?.()) { pending = null; return; }
            const d = Math.hypot(p.door.x - player.x, p.door.y - player.y);
            if (d <= deps.range) {
                pending = null;
                const through = deps.walkThroughTarget(p.door, deps.feet(player));
                if (through) deps.moveTo(through.x, through.y);
                return;
            }
            if (now - p.at > STOPPED_SHORT_MS && !deps.isMoving()) pending = null;
        }
    };
}

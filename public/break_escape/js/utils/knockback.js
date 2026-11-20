/**
 * Knockback Utility
 * Handles pushing entities away when hit
 */

const KNOCKBACK_CONFIG = {
  player: {
    strength: 200,    // Knockback velocity when player is hit
    duration: 200     // How long knockback lasts (ms)
  },
  npc: {
    strength: 250,    // Knockback velocity when NPC is hit
    duration: 250
  }
};

const TILE = 32;          // utils/constants.js TILE_SIZE
const EDGE_MARGIN = 8;    // extra gap kept inside the floor rectangle

/**
 * The part of a room a knocked-back body may be pushed within: the floor,
 * minus the wall rows/columns (where the doorways and door frames are) and a
 * small margin. Keeps a hit from carrying the player through a doorway into
 * the next room, or into a wall or door frame (m03 F2, m06 R4).
 * @param {{position:{x:number,y:number}, map:{widthInPixels:number,heightInPixels:number}}} room
 * @returns {{left:number,right:number,top:number,bottom:number}|null}
 */
export function knockbackSafeRect(room) {
  if (!room?.position || !room?.map) return null;
  const x = room.position.x;
  const y = room.position.y;
  return {
    left: x + TILE + EDGE_MARGIN,
    right: x + room.map.widthInPixels - TILE - EDGE_MARGIN,
    top: y + TILE * 2 + EDGE_MARGIN,
    bottom: y + room.map.heightInPixels - TILE - EDGE_MARGIN
  };
}

/**
 * How far a point may travel along the unit vector (ux, uy) before it leaves
 * the rectangle, capped at maxDist. 0 if the point is already outside it
 * (standing in a doorway: no push at all).
 */
export function clampKnockbackDistance(px, py, ux, uy, maxDist, rect) {
  if (!rect) return maxDist;
  if (px < rect.left || px > rect.right || py < rect.top || py > rect.bottom) return 0;
  let t = maxDist;
  if (ux > 0) t = Math.min(t, (rect.right - px) / ux);
  if (ux < 0) t = Math.min(t, (rect.left - px) / ux);
  if (uy > 0) t = Math.min(t, (rect.bottom - py) / uy);
  if (uy < 0) t = Math.min(t, (rect.top - py) / uy);
  return Math.max(0, t);
}

// Feet point of a physics body (what room detection uses)
function feetOf(target) {
  const b = target.body;
  return { x: b.x + b.width / 2, y: b.y + b.height };
}

function roomRectFor(target, isPlayer) {
  const roomId = isPlayer
    ? window.currentPlayerRoom
    : window.npcBehaviorManager?.getBehavior?.(target.npcId)?.roomId;
  return roomId ? knockbackSafeRect(window.rooms?.[roomId]) : null;
}

/**
 * Apply knockback to a sprite
 * @param {Phaser.GameObjects.Sprite} target - The sprite to knockback
 * @param {number} sourceX - X position of the attacker
 * @param {number} sourceY - Y position of the attacker
 * @param {number} strength - Knockback force (default based on target type)
 * @param {number} duration - How long knockback lasts in ms
 */
export function applyKnockback(target, sourceX, sourceY, strength = null, duration = null) {
  if (!target || !target.body) {
    console.warn('⚠️ Cannot apply knockback - invalid target or no physics body');
    return;
  }

  // Determine default strength and duration based on target type
  const isPlayer = target === window.player;
  const config = isPlayer ? KNOCKBACK_CONFIG.player : KNOCKBACK_CONFIG.npc;
  
  if (strength === null) strength = config.strength;
  if (duration === null) duration = config.duration;

  // Calculate knockback direction (from source to target)
  const angle = Phaser.Math.Angle.Between(sourceX, sourceY, target.x, target.y);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  // Cap the push so it stays inside the room's floor (never through a doorway,
  // into a wall or a door frame). A slow frame runs several physics steps at
  // this velocity, so the distance is enforced per step, not left to timing.
  const start = feetOf(target);
  const limit = clampKnockbackDistance(start.x, start.y, ux, uy,
    strength * duration / 1000, roomRectFor(target, isPlayer));

  if (target.knockbackStep) {
    target.knockbackStep();
  }
  if (target.knockbackTimer) {
    target.knockbackTimer.remove();
    target.knockbackTimer = null;
  }
  if (limit < 2) {
    return; // at an edge or in a doorway: no push
  }

  // Apply knockback velocity
  target.body.setVelocity(ux * strength, uy * strength);

  const scene = target.scene;
  const world = scene.physics?.world;
  if (world) {
    const watchUntil = scene.time.now + duration * 2;
    const onStep = () => {
      if (!target.body || scene.time.now > watchUntil ||
          (target.body.velocity.x === 0 && target.body.velocity.y === 0)) {
        stopWatching();
        return;
      }
      const f = feetOf(target);
      if ((f.x - start.x) * ux + (f.y - start.y) * uy >= limit) {
        target.body.setVelocity(0, 0);
        stopWatching();
      }
    };
    const stopWatching = () => {
      world.off('worldstep', onStep);
      if (target.knockbackStep === stopWatching) target.knockbackStep = null;
    };
    world.on('worldstep', onStep);
    target.knockbackStep = stopWatching;
  }

  // The watcher outlives the timer: it also caps the slowed drift below.
  target.knockbackTimer = scene.time.delayedCall(duration, () => {
    // Reduce velocity gradually rather than stopping abruptly
    if (target.body) {
      target.body.setVelocity(
        target.body.velocity.x * 0.3,
        target.body.velocity.y * 0.3
      );
    }
    target.knockbackTimer = null;
  });

  console.log(`💥 Knockback applied: ${target.name || 'sprite'} pushed away (strength: ${strength})`);
}

/**
 * Check if sprite is currently in knockback state
 * @param {Phaser.GameObjects.Sprite} sprite
 * @returns {boolean}
 */
export function isInKnockback(sprite) {
  return sprite && sprite.knockbackTimer !== null && sprite.knockbackTimer !== undefined;
}

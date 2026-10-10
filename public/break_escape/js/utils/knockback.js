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
  const velocityX = Math.cos(angle) * strength;
  const velocityY = Math.sin(angle) * strength;

  // Apply knockback velocity
  target.body.setVelocity(velocityX, velocityY);

  // Store original velocities to restore after knockback
  const originalVelX = target.body.velocity.x;
  const originalVelY = target.body.velocity.y;

  // Clear knockback after duration
  if (target.knockbackTimer) {
    target.knockbackTimer.remove();
  }

  const scene = target.scene;
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

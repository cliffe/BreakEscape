/**
 * Sprite Effects System
 * Handles sprite tinting, flashing, and visual effects for combat
 */

export class SpriteEffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeTints = new Map(); // Track active tint tweens

    console.log('✅ Sprite effects system initialized');
  }

  /**
   * Flash sprite with a tint color
   * @param {Phaser.GameObjects.Sprite} sprite - Sprite to flash
   * @param {number} color - Tint color
   * @param {number} duration - Flash duration in ms
   */
  flashTint(sprite, color = 0xff0000, duration = 200) {
    if (!sprite || !sprite.active) return;

    // Store original tint
    const originalTint = sprite.tint;

    // Apply tint
    sprite.setTint(color);

    // Clear any existing tween for this sprite
    const existingTween = this.activeTints.get(sprite);
    if (existingTween) {
      existingTween.remove();
    }

    // Fade back to original
    const tween = this.scene.tweens.add({
      targets: sprite,
      duration: duration,
      onComplete: () => {
        sprite.clearTint();
        if (originalTint !== 0xffffff) {
          sprite.setTint(originalTint);
        }
        this.activeTints.delete(sprite);
      }
    });

    this.activeTints.set(sprite, tween);
  }

  /**
   * Flash sprite red (damage)
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  flashDamage(sprite) {
    this.flashTint(sprite, 0xff0000, 200);
  }

  /**
   * Flash sprite white (hit landed)
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  flashHit(sprite) {
    this.flashTint(sprite, 0xffffff, 150);
  }

  /**
   * Apply red tint for attack animation
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  applyAttackTint(sprite) {
    if (!sprite || !sprite.active) return;
    sprite.setTint(0xff0000);
  }

  /**
   * Clear attack tint
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  clearAttackTint(sprite) {
    if (!sprite || !sprite.active) return;
    sprite.clearTint();
  }

  /**
   * Make sprite semi-transparent (KO state)
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} alpha - Alpha value (0-1)
   */
  setKOAlpha(sprite, alpha = 0.5) {
    if (!sprite || !sprite.active) return;
    sprite.setAlpha(alpha);
  }

  /**
   * Pulse animation (for telegraphing attacks)
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} duration - Pulse duration
   */
  pulse(sprite, duration = 500) {
    if (!sprite || !sprite.active) return;

    this.scene.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.1,
      scaleY: sprite.scaleY * 1.1,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Knockback animation
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} directionX - X direction (-1 or 1)
   * @param {number} directionY - Y direction (-1 or 1)
   * @param {number} distance - Knockback distance in pixels
   */
  knockback(sprite, directionX, directionY, distance = 10) {
    if (!sprite || !sprite.active) return;

    const startX = sprite.x;
    const startY = sprite.y;

    this.scene.tweens.add({
      targets: sprite,
      x: startX + (directionX * distance),
      y: startY + (directionY * distance),
      duration: 100,
      ease: 'Cubic.easeOut',
      yoyo: true
    });
  }

  /**
   * Clean up system
   */
  destroy() {
    // Stop all active tweens
    this.activeTints.forEach(tween => {
      if (tween) tween.remove();
    });
    this.activeTints.clear();
  }
}

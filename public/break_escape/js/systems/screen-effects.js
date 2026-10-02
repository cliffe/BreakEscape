/**
 * Screen Effects System
 * Handles screen flash and shake effects for combat feedback
 */

export class ScreenEffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;

    // Flash overlay - full screen colored rectangle
    this.flashOverlay = scene.add.rectangle(
      0, 0,
      scene.cameras.main.width * 2,
      scene.cameras.main.height * 2,
      0xff0000,
      0
    );
    this.flashOverlay.setDepth(10000); // Above everything
    this.flashOverlay.setScrollFactor(0); // Fixed to camera
    this.flashOverlay.setOrigin(0, 0);

    // Shake state
    this.isShaking = false;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeStartTime = 0;

    console.log('✅ Screen effects system initialized');
  }

  /**
   * Flash the screen with a color
   * @param {number} color - Hex color (e.g., 0xff0000 for red)
   * @param {number} duration - Duration in ms
   * @param {number} maxAlpha - Maximum alpha value (0-1)
   */
  flash(color = 0xff0000, duration = 200, maxAlpha = 0.3) {
    this.flashOverlay.setFillStyle(color, maxAlpha);

    // Fade out animation
    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut'
    });
  }

  /**
   * Shake the camera
   * @param {number} intensity - Shake intensity (pixel displacement)
   * @param {number} duration - Duration in ms
   */
  shake(intensity = 4, duration = 300) {
    this.camera.shake(duration, intensity / 1000); // Phaser uses intensity as fraction
  }

  /**
   * Flash red (damage taken)
   */
  flashDamage() {
    this.flash(0xff0000, 200, 0.3);
  }

  /**
   * Flash green (heal)
   */
  flashHeal() {
    this.flash(0x00ff00, 200, 0.2);
  }

  /**
   * Screen shake for player taking damage
   */
  shakePlayerHit() {
    this.shake(6, 300);
  }

  /**
   * Screen shake for NPC taking damage
   */
  shakeNPCHit() {
    this.shake(3, 200);
  }

  /**
   * Clean up system
   */
  destroy() {
    if (this.flashOverlay) {
      this.flashOverlay.destroy();
    }
  }
}

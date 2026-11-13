/**
 * Attack Telegraph System
 * Visual indicators for incoming attacks to give players fair warning
 */

import { pixelText, placePixelText, setPixelScale } from '../utils/pixel-text.js';

// GNF '!' from the outlined bitmap sheet (q105): x3 (21 px tall, like the 24 px bold Arial),
// pulsing in whole steps to x4 and back every PULSE_MS instead of a smooth 1.3 scale tween
const MARK_SCALE = 3;
const PULSE_MS = 250;

export class AttackTelegraphSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeTelegraphs = new Map();

    console.log('✅ Attack telegraph system initialized');
  }

  /**
   * Show telegraph indicator for an NPC about to attack
   * @param {string} npcId - NPC identifier
   * @param {Phaser.GameObjects.Sprite} npcSprite - NPC sprite
   * @param {number} duration - Telegraph duration in ms
   */
  show(npcId, npcSprite, duration = 500) {
    if (!npcSprite || !npcSprite.active) return;

    // Remove existing telegraph if any
    this.hide(npcId);

    // Create visual indicator - exclamation mark above NPC
    const indicator = pixelText(this.scene, npcSprite.x, npcSprite.y - 50, '!', {
      scale: MARK_SCALE, outline: true, color: 0xff0000, origin: [0.5, 0.5], depth: 900
    });

    // Create danger zone circle around NPC
    const dangerCircle = this.scene.add.circle(
      npcSprite.x,
      npcSprite.y,
      60, // Attack range radius
      0xff0000,
      0.15
    );
    dangerCircle.setStrokeStyle(2, 0xff0000, 0.5);
    dangerCircle.setDepth(1);

    // Pulse animation for circle
    this.scene.tweens.add({
      targets: dangerCircle,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.3,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Store references
    this.activeTelegraphs.set(npcId, {
      indicator,
      dangerCircle,
      npcSprite,
      startTime: Date.now(),
      duration
    });

    // Auto-hide after duration
    this.scene.time.delayedCall(duration, () => {
      this.hide(npcId);
    });
  }

  /**
   * Hide telegraph indicator
   * @param {string} npcId
   */
  hide(npcId) {
    const telegraph = this.activeTelegraphs.get(npcId);
    if (!telegraph) return;

    // Destroy visual elements
    if (telegraph.indicator) {
      telegraph.indicator.destroy();
    }
    if (telegraph.dangerCircle) {
      telegraph.dangerCircle.destroy();
    }

    this.activeTelegraphs.delete(npcId);
  }

  /**
   * Update telegraph positions to follow NPCs
   * Called from game update loop
   */
  update() {
    this.activeTelegraphs.forEach((telegraph, npcId) => {
      if (!telegraph.npcSprite || !telegraph.npcSprite.active) {
        // NPC sprite is gone, clean up
        this.hide(npcId);
        return;
      }

      // Update positions to follow NPC
      if (telegraph.indicator) {
        // Stepped pulse: x3, x4, x3 ... (whole-number scales only)
        const step = Math.floor((Date.now() - telegraph.startTime) / PULSE_MS) % 2;
        setPixelScale(telegraph.indicator, MARK_SCALE + step);
        placePixelText(telegraph.indicator, telegraph.npcSprite.x, telegraph.npcSprite.y - 50);
      }
      if (telegraph.dangerCircle) {
        telegraph.dangerCircle.setPosition(
          telegraph.npcSprite.x,
          telegraph.npcSprite.y
        );
      }
    });
  }

  /**
   * Check if NPC has active telegraph
   * @param {string} npcId
   * @returns {boolean}
   */
  isActive(npcId) {
    return this.activeTelegraphs.has(npcId);
  }

  /**
   * Clean up system
   */
  destroy() {
    // Hide all telegraphs
    this.activeTelegraphs.forEach((_, npcId) => {
      this.hide(npcId);
    });
    this.activeTelegraphs.clear();
  }
}

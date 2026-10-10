/**
 * Attack Telegraph System
 * Visual indicators for incoming attacks to give players fair warning
 */

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
    const indicator = this.scene.add.text(
      npcSprite.x,
      npcSprite.y - 50,
      '!',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    indicator.setOrigin(0.5, 0.5);
    indicator.setDepth(900);

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

    // Pulse animation for indicator
    this.scene.tweens.add({
      targets: indicator,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

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
        telegraph.indicator.setPosition(
          telegraph.npcSprite.x,
          telegraph.npcSprite.y - 50
        );
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

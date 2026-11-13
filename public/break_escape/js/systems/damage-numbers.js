/**
 * Damage Numbers System
 * Displays floating damage numbers above entities using object pooling
 */

import { overlayDepth } from '../utils/constants.js';
import { pixelText, setPixelText, placePixelText } from '../utils/pixel-text.js';

// GNF from its outlined bitmap sheet at x2 (q105): the 14 px figures the bold Arial drew,
// on whole pixels, with the 1 px font outline (2 px at x2) in place of the stroke
const DAMAGE_SCALE = 2;
const COLOURS = { damage: 0xff4444, heal: 0x44ff44, blocked: 0xbbbbbb };

export class DamageNumbersSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.poolSize = 20;

    // Pre-create pool of text objects
    for (let i = 0; i < this.poolSize; i++) {
      const text = pixelText(scene, 0, 0, '', { scale: DAMAGE_SCALE, outline: true, color: COLOURS.damage });
      text.setVisible(false);
      text.setDepth(overlayDepth(1000)); // Above everything
      this.pool.push(text);
    }

    console.log('✅ Damage numbers system initialized');
  }

  /**
   * Show damage number at position
   * @param {number} x - World x position
   * @param {number} y - World y position
   * @param {number} amount - Damage amount
   * @param {string} type - 'damage', 'heal' or 'blocked'
   */
  show(x, y, amount, type = 'damage') {
    // Get object from pool
    const text = this.pool.pop();
    if (!text) {
      console.warn('Damage number pool exhausted');
      return;
    }

    // Configure text
    text.pixelAnchor = { x, y };
    setPixelText(text, `${Math.round(amount)}`);
    text.setVisible(true);

    // Colour by type: red for damage, green for heal, grey for what got through a guard or block
    const colour = COLOURS[type] ?? COLOURS.damage;
    if (text.pixelFallback) text.setColor?.(`#${colour.toString(16).padStart(6, '0')}`);
    else text.setTint?.(colour);

    // Add to active list
    this.active.push({
      text,
      startY: y,
      startTime: Date.now(),
      duration: 1000
    });
  }

  /**
   * Update all active damage numbers
   * Called from game update loop
   */
  update() {
    const now = Date.now();

    for (let i = this.active.length - 1; i >= 0; i--) {
      const item = this.active[i];
      const elapsed = now - item.startTime;
      const progress = elapsed / item.duration;

      if (progress >= 1) {
        // Animation complete - return to pool
        item.text.setVisible(false);
        this.pool.push(item.text);
        this.active.splice(i, 1);
      } else {
        // Update position and opacity
        const riseDistance = 50;
        const newY = item.startY - (riseDistance * progress);
        placePixelText(item.text, item.text.pixelAnchor.x, newY);

        // Fade out
        const alpha = 1 - progress;
        item.text.setAlpha(alpha);
      }
    }
  }

  /**
   * Clean up system
   */
  destroy() {
    // Destroy all text objects
    [...this.pool, ...this.active.map(a => a.text)].forEach(text => {
      if (text) text.destroy();
    });
    this.pool = [];
    this.active = [];
  }
}

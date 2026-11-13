/**
 * Damage Numbers System
 * Displays floating damage numbers above entities using object pooling
 */

import { overlayDepth } from '../utils/constants.js';
import { pixelText, setPixelText, placePixelText, setPixelColour } from '../utils/pixel-text.js';

// GNF at x2 (q105): the 14 px figures the bold Arial drew, on whole pixels, with a black shadow
// sheet under a tinted fill: one outline round the whole number (2 px at x2), drawn once
const DAMAGE_SCALE = 2;
export const DAMAGE_COLOURS = { damage: 0xff4444, heal: 0x44ff44, blocked: 0xd8d8d8 };
export const DAMAGE_MS = 1000;
export const RISE_PX = 50;

/**
 * Pure: the stepped fade (q105 R1 M1). Full colour to 70% of the time, half brightness for the
 * next 15%, then hidden. Half brightness is the fill's colour halved at full alpha: a partial
 * alpha would show the sprite under it and darken again where two glyphs' shadows overlap.
 * Returns { visible, colour }.
 */
export function damageFadeStep(progress, colour) {
  if (progress < 0.7) return { visible: true, colour };
  if (progress < 0.85) return { visible: true, colour: (colour >> 1) & 0x7f7f7f };
  return { visible: false, colour };
}

export class DamageNumbersSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.poolSize = 20;

    // Pre-create pool of text objects
    for (let i = 0; i < this.poolSize; i++) {
      const text = pixelText(scene, 0, 0, '', { scale: DAMAGE_SCALE, outline: true, color: DAMAGE_COLOURS.damage });
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

    // Configure text: red for damage, green for heal, grey for what got through a guard or block
    const colour = DAMAGE_COLOURS[type] ?? DAMAGE_COLOURS.damage;
    setPixelText(text, `${Math.round(amount)}`, { x, y });
    setPixelColour(text, colour);
    text.setVisible(true);

    // Add to active list
    this.active.push({
      text,
      x,
      startY: y,
      colour,
      startTime: Date.now(),
      duration: DAMAGE_MS
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
        // Rise in whole pixels; fade in steps, never by alpha
        const newY = item.startY - (RISE_PX * progress);
        placePixelText(item.text, item.x, newY);
        const step = damageFadeStep(progress, item.colour);
        setPixelColour(item.text, step.colour);
        item.text.setVisible(step.visible);
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

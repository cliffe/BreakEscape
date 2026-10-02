/**
 * Damage Numbers System
 * Displays floating damage numbers above entities using object pooling
 */

export class DamageNumbersSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.poolSize = 20;

    // Pre-create pool of text objects
    for (let i = 0; i < this.poolSize; i++) {
      const text = scene.add.text(0, 0, '', {
        fontSize: '20px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      text.setVisible(false);
      text.setDepth(1000); // Above everything
      this.pool.push(text);
    }

    console.log('✅ Damage numbers system initialized');
  }

  /**
   * Show damage number at position
   * @param {number} x - World x position
   * @param {number} y - World y position
   * @param {number} amount - Damage amount
   * @param {string} type - 'damage' or 'heal'
   */
  show(x, y, amount, type = 'damage') {
    // Get object from pool
    const text = this.pool.pop();
    if (!text) {
      console.warn('Damage number pool exhausted');
      return;
    }

    // Configure text
    text.setText(`${Math.round(amount)}`);
    text.setPosition(x, y);
    text.setVisible(true);

    // Set color based on type
    if (type === 'damage') {
      text.setColor('#ff4444'); // Red for damage
    } else if (type === 'heal') {
      text.setColor('#44ff44'); // Green for heal
    }

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
        item.text.setY(newY);

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

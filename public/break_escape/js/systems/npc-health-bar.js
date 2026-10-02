/**
 * NPC Health Bar System
 * Renders health bars above hostile NPCs in the Phaser scene
 * 
 * @module npc-health-bar
 */

export class NPCHealthBarManager {
  constructor(scene) {
    this.scene = scene;
    this.healthBars = new Map(); // npcId -> graphics object
    this.barConfig = {
      width: 40,
      height: 6,
      offsetY: -50,  // pixels above NPC
      borderWidth: 1,
      colors: {
        background: 0x1a1a1a,
        border: 0xcccccc,
        health: 0x00ff00,
        damage: 0xff0000
      }
    };

    console.log('✅ NPC Health Bar Manager initialized');
  }

  /**
   * Create a health bar for an NPC
   * @param {string} npcId - The NPC ID
   * @param {Object} npc - The NPC object with sprite and health properties
   */
  createHealthBar(npcId, npc) {
    if (this.healthBars.has(npcId)) {
      console.warn(`Health bar already exists for NPC ${npcId}`);
      return;
    }

    // Get NPC current HP from hostile system
    const hostileState = window.npcHostileSystem?.getNPCHostileState(npcId);
    if (!hostileState) {
      console.warn(`No hostile state found for NPC ${npcId}`);
      return;
    }

    const maxHP = hostileState.maxHP;
    const currentHP = hostileState.currentHP;

    // Create graphics object for the health bar
    const graphics = this.scene.make.graphics({
      x: npc.sprite.x,
      y: npc.sprite.y + this.barConfig.offsetY,
      add: true
    });

    // Set depth so bar appears above NPC
    graphics.setDepth(npc.sprite.depth + 1);

    // Draw the health bar
    this.drawHealthBar(graphics, currentHP, maxHP);

    // Store reference
    this.healthBars.set(npcId, {
      graphics,
      npcId,
      maxHP,
      currentHP,
      lastHP: currentHP
    });

    console.log(`🏥 Created health bar for NPC ${npcId}`);
  }

  /**
   * Draw the health bar graphics
   * @param {Object} graphics - Phaser Graphics object
   * @param {number} currentHP - Current HP value
   * @param {number} maxHP - Maximum HP value
   */
  drawHealthBar(graphics, currentHP, maxHP) {
    const { width, height, borderWidth, colors } = this.barConfig;

    // Clear previous draw
    graphics.clear();

    // Draw background
    graphics.fillStyle(colors.background, 1);
    graphics.fillRect(-width / 2, -height / 2, width, height);

    // Draw border
    graphics.lineStyle(borderWidth, colors.border, 1);
    graphics.strokeRect(-width / 2, -height / 2, width, height);

    // Draw health fill
    const healthRatio = Math.max(0, Math.min(1, currentHP / maxHP));
    const healthWidth = width * healthRatio;

    graphics.fillStyle(colors.health, 1);
    graphics.fillRect(-width / 2, -height / 2, healthWidth, height);

    // Draw damage (red overlay if not full)
    if (healthRatio < 1) {
      graphics.fillStyle(colors.damage, 0.3);
      graphics.fillRect(-width / 2 + healthWidth, -height / 2, width - healthWidth, height);
    }
  }

  /**
   * Update health bar position and health value
   * @param {string} npcId - The NPC ID
   * @param {Object} npc - The NPC object with current position
   * @param {number} currentHP - Current HP (optional, will fetch from hostile system if not provided)
   */
  updateHealthBar(npcId, npc, currentHP = null) {
    const barData = this.healthBars.get(npcId);
    if (!barData) {
      console.warn(`Health bar not found for NPC ${npcId}`);
      return;
    }

    // Get current HP from hostile system if not provided
    if (currentHP === null) {
      const hostileState = window.npcHostileSystem?.getNPCHostileState(npcId);
      if (!hostileState) return;
      currentHP = hostileState.currentHP;
    }

    // Update position to follow NPC
    barData.graphics.setPosition(
      npc.sprite.x,
      npc.sprite.y + this.barConfig.offsetY
    );

    // Update depth to keep above NPC
    barData.graphics.setDepth(npc.sprite.depth + 1);

    // Update health if changed
    if (currentHP !== barData.currentHP) {
      barData.currentHP = currentHP;
      this.drawHealthBar(barData.graphics, currentHP, barData.maxHP);
    }
  }

  /**
   * Update all health bars (call from game update loop)
   */
  updateAllHealthBars() {
    for (const [npcId, barData] of this.healthBars) {
      const npc = window.npcManager?.getNPC(npcId);
      if (npc && npc.sprite) {
        this.updateHealthBar(npcId, npc);
      }
    }
  }

  /**
   * Show a health bar (make it visible)
   * @param {string} npcId - The NPC ID
   */
  showHealthBar(npcId) {
    const barData = this.healthBars.get(npcId);
    if (barData) {
      barData.graphics.setVisible(true);
    }
  }

  /**
   * Hide a health bar (make it invisible)
   * @param {string} npcId - The NPC ID
   */
  hideHealthBar(npcId) {
    const barData = this.healthBars.get(npcId);
    if (barData) {
      barData.graphics.setVisible(false);
    }
  }

  /**
   * Remove a health bar completely
   * @param {string} npcId - The NPC ID
   */
  removeHealthBar(npcId) {
    const barData = this.healthBars.get(npcId);
    if (barData) {
      barData.graphics.destroy();
      this.healthBars.delete(npcId);
      console.log(`🗑️ Removed health bar for NPC ${npcId}`);
    }
  }

  /**
   * Remove all health bars
   */
  removeAllHealthBars() {
    for (const [npcId, barData] of this.healthBars) {
      barData.graphics.destroy();
    }
    this.healthBars.clear();
    console.log('🗑️ Removed all health bars');
  }

  /**
   * Get health bar for an NPC
   * @param {string} npcId - The NPC ID
   * @returns {Object|null} Health bar data or null
   */
  getHealthBar(npcId) {
    return this.healthBars.get(npcId) || null;
  }

  /**
   * Check if health bar exists for NPC
   * @param {string} npcId - The NPC ID
   * @returns {boolean}
   */
  hasHealthBar(npcId) {
    return this.healthBars.has(npcId);
  }

  /**
   * Destroy the manager and clean up
   */
  destroy() {
    this.removeAllHealthBars();
    console.log('🗑️ NPC Health Bar Manager destroyed');
  }
}

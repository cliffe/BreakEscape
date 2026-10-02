/**
 * NPC Health Bars System
 * Displays health bars above hostile NPCs
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';

export class NPCHealthBars {
  constructor(scene) {
    this.scene = scene;
    this.healthBars = new Map(); // npcId -> { background, bar, npcSprite }

    this.setupEventListeners();

    console.log('✅ NPC health bars initialized');
  }

  setupEventListeners() {
    if (!window.eventDispatcher) {
      console.warn('Event dispatcher not found');
      return;
    }

    console.log('🏥 NPCHealthBars: Setting up event listeners for', CombatEvents.NPC_HOSTILE_CHANGED);

    // Listen for NPC hostile state changes
    window.eventDispatcher.on(CombatEvents.NPC_HOSTILE_CHANGED, (data) => {
      console.log('🏥 NPCHealthBars: Received NPC_HOSTILE_CHANGED event', { npcId: data.npcId, isHostile: data.isHostile });
      if (data.isHostile) {
        this.createHealthBar(data.npcId);
      } else {
        this.removeHealthBar(data.npcId);
      }
    });

    // Listen for NPC KO
    window.eventDispatcher.on(CombatEvents.NPC_KO, (data) => {
      console.log('🏥 NPCHealthBars: Received NPC_KO event', data);
      this.removeHealthBar(data.npcId);
    });
  }

  createHealthBar(npcId) {
    // Don't create duplicate
    if (this.healthBars.has(npcId)) {
      return;
    }

    // Get NPC sprite
    const npcSprite = this.getNPCSprite(npcId);
    if (!npcSprite) {
      console.warn(`Cannot create health bar for ${npcId}: sprite not found`);
      return;
    }

    // Get NPC health state
    if (!window.npcHostileSystem) {
      console.warn(`Cannot create health bar for ${npcId}: npcHostileSystem not found`);
      return;
    }
    
    const state = window.npcHostileSystem.getState(npcId);
    if (!state) {
      console.warn(`Cannot create health bar for ${npcId}: no hostile state found`);
      return;
    }

    console.log(`🏥 Creating health bar for ${npcId}, state:`, state);

    const width = COMBAT_CONFIG.ui.healthBarWidth;
    const height = COMBAT_CONFIG.ui.healthBarHeight;
    const offsetY = COMBAT_CONFIG.ui.healthBarOffsetY;

    // Create background (dark gray)
    const background = this.scene.add.rectangle(
      npcSprite.x,
      npcSprite.y + offsetY,
      width,
      height,
      0x333333
    );
    background.setDepth(850);
    background.setStrokeStyle(1, 0x000000);

    // Create health bar (red to green gradient based on HP)
    const bar = this.scene.add.rectangle(
      npcSprite.x,
      npcSprite.y + offsetY,
      width,
      height,
      0x00ff00
    );
    bar.setDepth(851);

    this.healthBars.set(npcId, {
      background,
      bar,
      npcSprite
    });

    // Initial update
    this.updateHealthBar(npcId);
  }

  updateHealthBar(npcId) {
    const healthBar = this.healthBars.get(npcId);
    if (!healthBar) return;

    // Get NPC health state
    if (!window.npcHostileSystem) return;
    const state = window.npcHostileSystem.getState(npcId);
    if (!state) {
      console.warn(`🏥 No state for ${npcId}`);
      return;
    }

    // Calculate HP percentage
    const hpPercent = Math.max(0, state.currentHP / state.maxHP);
    console.log(`🏥 Updating ${npcId}: HP=${state.currentHP}/${state.maxHP} (${Math.round(hpPercent * 100)}%)`);

    // Update bar width - shrinks from right side, stays anchored to left
    const maxWidth = COMBAT_CONFIG.ui.healthBarWidth;
    const currentWidth = maxWidth * hpPercent;
    healthBar.bar.setSize(currentWidth, COMBAT_CONFIG.ui.healthBarHeight);

    // Position bar so it stays left-aligned with background
    // Background is centered at its position, so offset the bar by half the difference
    const bgX = healthBar.background.x;
    const bgLeftEdge = bgX - (maxWidth / 2);
    const barCenterX = bgLeftEdge + (currentWidth / 2);
    
    healthBar.bar.setPosition(barCenterX, healthBar.background.y);

    // Always use red for NPC health bar
    healthBar.bar.setFillStyle(0xff0000); // Red
  }

  removeHealthBar(npcId) {
    const healthBar = this.healthBars.get(npcId);
    if (!healthBar) return;

    // Destroy graphics
    if (healthBar.background) healthBar.background.destroy();
    if (healthBar.bar) healthBar.bar.destroy();

    this.healthBars.delete(npcId);
  }

  update() {
    // Update positions to follow NPCs
    this.healthBars.forEach((healthBar, npcId) => {
      if (!healthBar.npcSprite || !healthBar.npcSprite.active) {
        // NPC sprite is gone, clean up
        this.removeHealthBar(npcId);
        return;
      }

      const offsetY = COMBAT_CONFIG.ui.healthBarOffsetY;

      // Update positions
      healthBar.background.setPosition(
        healthBar.npcSprite.x,
        healthBar.npcSprite.y + offsetY
      );

      // Update health bar (it will recalculate position)
      this.updateHealthBar(npcId);
    });
  }

  getNPCSprite(npcId) {
    // Search all rooms for this NPC's sprite
    if (window.rooms) {
      for (const roomId in window.rooms) {
        const room = window.rooms[roomId];
        if (room.npcSprites) {
          for (const sprite of room.npcSprites) {
            if (sprite.npcId === npcId) {
              console.log(`🏥 Found NPC sprite for ${npcId} in room ${roomId}`);
              return sprite;
            }
          }
        }
      }
    }

    console.warn(`🏥 Could not find sprite for NPC: ${npcId}`);
    return null;
  }

  destroy() {
    // Remove all health bars
    this.healthBars.forEach((_, npcId) => {
      this.removeHealthBar(npcId);
    });
    this.healthBars.clear();
  }
}

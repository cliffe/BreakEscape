/**
 * NPC Health Bars System
 * Displays health bars above hostile NPCs
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { overlayDepth } from '../utils/constants.js';
import { CombatEvents } from '../events/combat-events.js';
import { healthBarColours } from './theme-colours.js';

export class NPCHealthBars {
  constructor(scene) {
    this.scene = scene;
    this.healthBars = new Map(); // npcId -> { graphics, npcSprite, drawnHP }
    this.colours = healthBarColours();

    this.setupEventListeners();

    // The player can change theme from the menu; redraw in the new colours
    window.addEventListener('be:display-settings-changed', () => {
      this.colours = healthBarColours();
      this.healthBars.forEach(hb => { hb.drawnHP = null; });
    });

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

    const offsetY = COMBAT_CONFIG.ui.healthBarOffsetY;

    // One pixel-art gauge in game pixels, drawn around (0, 0) and moved with the NPC
    const graphics = this.scene.add.graphics();
    graphics.setDepth(overlayDepth(850));
    graphics.setPosition(Math.round(npcSprite.x), Math.round(npcSprite.y + offsetY));
    // A hidden NPC (initiallyHidden, hidden by a mapping) shows no bar (m10 R3 G2)
    graphics.setVisible(npcSprite.visible !== false);

    this.healthBars.set(npcId, {
      graphics,
      npcSprite,
      drawnHP: null
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
    // update() calls this every frame; logging each call stalls the game with DevTools open
    if (healthBar.loggedHP !== state.currentHP) {
      healthBar.loggedHP = state.currentHP;
      console.log(`🏥 Updating ${npcId}: HP=${state.currentHP}/${state.maxHP} (${Math.round(hpPercent * 100)}%)`);
    }

    if (healthBar.drawnHP === state.currentHP) return;
    healthBar.drawnHP = state.currentHP;
    NPCHealthBars.drawGauge(healthBar.graphics, hpPercent, this.colours);
  }

  /**
   * The gauge, in the theme's colours (css/ui-themes.css --ui-bar-*): a dark
   * outline with its corners knocked off, a 1px rim in the theme's accent, the
   * track, and the fill (shrinking from the right) with a lighter top row.
   * Drawn around (0, 0) in whole game pixels.
   */
  static drawGauge(g, hpPercent, c) {
    const w = COMBAT_CONFIG.ui.healthBarWidth;
    const h = COMBAT_CONFIG.ui.healthBarHeight;
    const x0 = -Math.round(w / 2) - 2;
    const y0 = -Math.round(h / 2) - 2;
    const W = w + 4;
    const H = h + 4;

    g.clear();
    g.fillStyle(c.outline, 1);
    g.fillRect(x0 + 1, y0, W - 2, H);
    g.fillRect(x0, y0 + 1, W, H - 2);
    g.fillStyle(c.frame, 1);
    g.fillRect(x0 + 1, y0 + 1, W - 2, H - 2);
    g.fillStyle(c.track, 1);
    g.fillRect(x0 + 2, y0 + 2, w, h);

    const fillW = Math.round(w * hpPercent);
    if (fillW > 0) {
      g.fillStyle(c.fill, 1);
      g.fillRect(x0 + 2, y0 + 2, fillW, h);
      g.fillStyle(c.fillHi, 1);
      g.fillRect(x0 + 2, y0 + 2, fillW, 1);
    }
  }

  removeHealthBar(npcId) {
    const healthBar = this.healthBars.get(npcId);
    if (!healthBar) return;

    // Destroy graphics
    if (healthBar.graphics) healthBar.graphics.destroy();

    this.healthBars.delete(npcId);
  }

  /**
   * Hostile, standing NPCs that should carry a bar but have none: the hostile
   * event found no sprite yet, or the sprite was rebuilt (m07 blind M4: Park
   * fought with no bar). Pure, for tests.
   * @param {Object} record - npcHostileSystem.exportHostility()
   * @param {Set|Map} existing - ids that already have a bar
   */
  static missingBars(record, existing) {
    return Object.entries(record || {})
      .filter(([id, e]) => e && e.hostile === true && e.ko !== true && !existing.has(id))
      .map(([id]) => id);
  }

  _findSpriteQuiet(npcId) {
    for (const room of Object.values(window.rooms || {})) {
      const sprite = (room.npcSprites || []).find(s => s.npcId === npcId);
      if (sprite) return sprite;
    }
    return null;
  }

  update() {
    // Twice a second, give any hostile NPC without a bar its bar
    const now = this.scene?.time?.now ?? Date.now();
    if (!this._lastMissingCheck || now - this._lastMissingCheck > 500) {
      this._lastMissingCheck = now;
      const record = window.npcHostileSystem?.exportHostility?.();
      for (const npcId of NPCHealthBars.missingBars(record, this.healthBars)) {
        const sprite = this._findSpriteQuiet(npcId);
        if (sprite && sprite.active && sprite.visible !== false) this.createHealthBar(npcId);
      }
    }

    // Update positions to follow NPCs
    this.healthBars.forEach((healthBar, npcId) => {
      if (!healthBar.npcSprite || !healthBar.npcSprite.active) {
        // NPC sprite is gone, clean up
        this.removeHealthBar(npcId);
        return;
      }

      const offsetY = COMBAT_CONFIG.ui.healthBarOffsetY;

      // Follow the NPC, on whole game pixels so the gauge stays crisp
      healthBar.graphics.setPosition(
        Math.round(healthBar.npcSprite.x),
        Math.round(healthBar.npcSprite.y + offsetY)
      );
      // Follow the NPC's visibility too: an initiallyHidden hostile's bar drew over the
      // room while the NPC itself was hidden, giving the ambush away (m10 R3 G2)
      healthBar.graphics.setVisible(healthBar.npcSprite.visible !== false);

      // Redraws only when the HP (or theme) changed
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

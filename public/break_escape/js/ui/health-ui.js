/**
 * Health UI System
 * Displays player health as hearts above the inventory
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';

export class HealthUI {
  constructor() {
    this.container = null;
    this.hearts = [];
    this.currentHP = COMBAT_CONFIG.player.maxHP;
    this.maxHP = COMBAT_CONFIG.player.maxHP;
    this.isVisible = false;
    this.heartbeatSound = null;
    this.heartbeatPlaying = false;

    this.createUI();
    this.setupEventListeners();

    console.log('✅ Health UI initialized');
  }

  createUI() {
    // Create main container div
    this.container = document.createElement('div');
    this.container.id = 'health-ui-container';

    // Create hearts container
    const heartsContainer = document.createElement('div');
    heartsContainer.id = 'health-ui';
    heartsContainer.className = 'health-ui-display';

    // Create 5 heart slots
    for (let i = 0; i < COMBAT_CONFIG.ui.maxHearts; i++) {
      const heart = document.createElement('img');
      heart.className = 'health-heart';
      heart.src = '/break_escape/assets/icons/heart.png';
      heart.alt = 'HP';
      heartsContainer.appendChild(heart);
      this.hearts.push(heart);
    }

    this.container.appendChild(heartsContainer);
    document.body.appendChild(this.container);

    // Always show hearts (changed from MVP requirement)
    this.show();
  }

  setupEventListeners() {
    if (!window.eventDispatcher) {
      console.warn('Event dispatcher not found, health UI will not update automatically');
      return;
    }

    // Listen for HP changes
    window.eventDispatcher.on(CombatEvents.PLAYER_HP_CHANGED, (data) => {
      this.updateHP(data.hp, data.maxHP);
    });

    // Listen for player KO
    window.eventDispatcher.on(CombatEvents.PLAYER_KO, () => {
      this.show(); // Always show when KO
      this.stopHeartbeat();
    });
  }

  updateHP(hp, maxHP) {
    this.currentHP = hp;
    this.maxHP = maxHP;

    // Always keep hearts visible (changed from MVP requirement)
    this.show();

    // Heartbeat sound when HP <= 25%
    if (hp > 0 && hp / maxHP <= 0.25) {
      this.startHeartbeat();
    } else {
      this.stopHeartbeat();
    }

    // Update heart visuals
    const heartsPerHP = maxHP / COMBAT_CONFIG.ui.maxHearts; // 20 HP per heart (100 / 5)
    const fullHearts = Math.floor(hp / heartsPerHP);
    const remainder = hp % heartsPerHP;
    const halfHeart = remainder >= (heartsPerHP / 2);

    this.hearts.forEach((heart, index) => {
      if (index < fullHearts) {
        // Full heart
        heart.src = '/break_escape/assets/icons/heart.png';
        heart.style.opacity = '1';
      } else if (index === fullHearts && halfHeart) {
        // Half heart
        heart.src = '/break_escape/assets/icons/heart-half.png';
        heart.style.opacity = '1';
      } else {
        // Empty heart
        heart.src = '/break_escape/assets/icons/heart.png';
        heart.style.opacity = '0.2';
      }
    });
  }

  show() {
    if (!this.isVisible) {
      this.container.style.display = 'flex';
      this.isVisible = true;
    }
  }

  startHeartbeat() {
    if (this.heartbeatPlaying) return;
    try {
      if (window.game && window.game.sound) {
        if (!this.heartbeatSound) {
          this.heartbeatSound = window.game.sound.get('heartbeat') || window.game.sound.add('heartbeat');
        }
        this.heartbeatSound.play({ loop: true, volume: 0.6 });
        this.heartbeatPlaying = true;
      }
    } catch (e) {
      // Sound not available
    }
  }

  stopHeartbeat() {
    if (!this.heartbeatPlaying) return;
    try {
      if (this.heartbeatSound && this.heartbeatSound.isPlaying) {
        this.heartbeatSound.stop();
      }
    } catch (e) {
      // Sound not available
    }
    this.heartbeatPlaying = false;
  }

  hide() {
    if (this.isVisible) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

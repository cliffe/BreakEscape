/**
 * Health UI System
 * Player health as hearts or a bar (the player picks in the menu's Display
 * page; css/ui-themes.css shows one). Both sit at the bottom right of the
 * player portrait, inside #player-hud-buttons, once the HUD has built it.
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

    // The bar alternative: a track with a fill whose width is the HP
    this.bar = document.createElement('div');
    this.bar.className = 'health-bar';
    this.bar.setAttribute('role', 'meter');
    this.bar.setAttribute('aria-label', 'Health');
    this.bar.setAttribute('aria-valuemin', '0');
    this.bar.innerHTML = '<div class="health-bar-track"><div class="health-bar-fill"></div></div>';
    this.barFill = this.bar.querySelector('.health-bar-fill');

    this.container.appendChild(heartsContainer);
    this.container.appendChild(this.bar);
    document.body.appendChild(this.container);
    this.mountBesidePortrait();

    // Always show hearts (changed from MVP requirement)
    this.show();
  }

  /** Move into the portrait group once the HUD has created it. */
  mountBesidePortrait(tries = 0) {
    const group = document.getElementById('player-hud-buttons');
    if (group) {
      group.appendChild(this.container);
    } else if (tries < 100) {
      setTimeout(() => this.mountBesidePortrait(tries + 1), 100);
    }
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
      this.show(true); // Always show when KO
      this.stopHeartbeat();
    });
  }

  updateHP(hp, maxHP) {
    this.currentHP = hp;
    this.maxHP = maxHP;

    // Always keep hearts visible (changed from MVP requirement)
    this.show();

    // At a quarter health or less: heartbeat, and the hearts or bar pulse
    const low = hp > 0 && hp / maxHP <= 0.25;
    this.container.classList.toggle('health-low', low);
    if (low) {
      this.startHeartbeat();
    } else {
      this.stopHeartbeat();
    }

    // Bar
    const percent = maxHP > 0 ? Math.max(0, Math.min(100, (hp / maxHP) * 100)) : 0;
    this.barFill.style.width = `${percent}%`;
    this.bar.setAttribute('aria-valuemax', String(maxHP));
    this.bar.setAttribute('aria-valuenow', String(hp));

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

  /**
   * Hearts mean nothing in a scenario with no combat ("disableAttacks": true, e.g. the awareness
   * training room and the SIS games) while the player is unhurt, so the HUD stays hidden there
   * (P3 N21). Any damage or a KO still shows it.
   */
  hiddenForNoCombat() {
    if (window.gameScenario?.disableAttacks !== true) return false;
    const hp = this.currentHP, max = this.maxHP;
    return !(Number.isFinite(hp) && Number.isFinite(max) && hp < max);
  }

  show(force = false) {
    if (!force && this.hiddenForNoCombat()) {
      if (this.container) this.container.style.display = 'none';
      this.isVisible = false;
      return;
    }
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

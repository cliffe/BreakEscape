/**
 * HUD (Heads-Up Display) System
 * Manages the player's HUD: the avatar button, and the Punch and Block
 * buttons for touch (and mouse) play. Click and tap always move or interact;
 * the old three-way mode toggle is gone.
 */

import { setHudLabel, clearHudLabel } from './info-label.js';
import { attacksDisabled } from '../systems/player-combat.js';

export class PlayerHUD {
  constructor(scene) {
    this.scene = scene;
    this.isInitialized = false; // Prevent multiple initialization attempts
    
    // HTML elements
    this.avatarButton = null;
    this.avatarImg = null;
    this.combatButtons = null;
    this.punchButton = null;
    this.blockButton = null;

    console.log('✅ Player HUD initialized');
  }

  /**
   * Create HUD elements
   */
  create() {
    // Prevent multiple initialization
    if (this.isInitialized) {
      return;
    }

    // Get or create HUD elements in the inventory container
    const inventoryContainer = document.getElementById('inventory-container');
    
    if (!inventoryContainer) {
      console.error('❌ Inventory container not found, retrying in 100ms...');
      setTimeout(() => this.create(), 100);
      return;
    }

    console.log('✅ Inventory container found, adding HUD elements...');
    this.isInitialized = true;

    // Create HUD container if it doesn't exist
    let hudContainer = document.getElementById('player-hud-buttons');
    if (!hudContainer) {
      hudContainer = document.createElement('div');
      hudContainer.id = 'player-hud-buttons';
      hudContainer.style.cssText = 'display: flex; gap: 8px; margin-right: 16px;';
      inventoryContainer.insertBefore(hudContainer, inventoryContainer.firstChild);
    }

    // Create avatar button
    this.avatarButton = document.createElement('div');
    this.avatarButton.id = 'hud-avatar-button';
    this.avatarButton.className = 'hud-button';
    this.avatarButton.addEventListener('mouseenter', () => setHudLabel('Player Settings'));
    this.avatarButton.addEventListener('mouseleave', () => clearHudLabel());
    
    this.avatarImg = document.createElement('img');
    this.avatarImg.id = 'hud-avatar-img';
    this.avatarImg.alt = 'Player';
    this.avatarImg.style.imageRendering = 'pixelated';
    this.avatarImg.style.imageRendering = '-moz-crisp-edges';
    this.avatarImg.style.imageRendering = 'crisp-edges';
    this.avatarButton.appendChild(this.avatarImg);
    hudContainer.appendChild(this.avatarButton);

    // Set up avatar button
    this.setupAvatarButton();

    // Punch and Block buttons (none in scenarios without combat)
    if (!attacksDisabled()) {
      this.createCombatButtons();
    }

    console.log('✅ HUD created');
  }

  /**
   * Set up avatar button with player headshot
   */
  setupAvatarButton() {
    // Get player sprite selection from config or default
    const playerSprite = this.getPlayerSprite();
    const headshotPath = this.getHeadshotPath(playerSprite);
    
    this.avatarImg.src = headshotPath;
    this.avatarImg.alt = playerSprite || 'Player';

    // Click handler to open player preferences
    this.avatarButton.addEventListener('click', () => {
      this.openPlayerPreferences();
    });

    console.log(`👤 Avatar button set up with sprite: ${playerSprite}`);
  }

  /**
   * Get player sprite from config or scene data
   */
  getPlayerSprite() {
    // Try to get from breakEscapeConfig
    if (window.breakEscapeConfig?.playerSprite) {
      return window.breakEscapeConfig.playerSprite;
    }
    
    // Try to get from player sprite texture key (Phaser standard property)
    if (window.player?.texture?.key) {
      return window.player.texture.key;
    }
    
    // Try to get from scenario player data
    if (window.gameScenario?.player?.spriteSheet) {
      return window.gameScenario.player.spriteSheet;
    }
    
    // Default fallback
    return 'male_hacker_hood_v2';
  }

  /**
   * Get headshot image path for a sprite
   */
  getHeadshotPath(spriteKey) {
    const assetsPath = window.breakEscapeConfig?.assetsPath || 'public/break_escape/assets';
    return `${assetsPath}/characters/${spriteKey}_headshot.png`;
  }

  /**
   * Open player preferences modal
   */
  openPlayerPreferences() {
    console.log('🎮 Opening player preferences modal');
    
    // Check if player preferences modal exists in the DOM
    const preferencesModal = document.getElementById('player-preferences-modal');
    if (preferencesModal) {
      // Initialize the sprite preview when opening
      if (typeof window.initPlayerPreferencesModal === 'function') {
        window.initPlayerPreferencesModal();
      }
      
      // Show the modal
      preferencesModal.style.display = 'flex';

      // Pause keyboard so WASD doesn't move the player while typing
      if (window.pauseKeyboardInput) {
        window.pauseKeyboardInput();
      }

      // Pause the game while modal is open
      if (this.scene && this.scene.scene.isPaused() === false) {
        this.scene.scene.pause();
      }
    } else {
      console.error('❌ Player preferences modal not found in DOM');
      alert('Player preferences modal is not available. Please refresh the page.');
    }
  }

  /**
   * Close player preferences modal
   */
  closePlayerPreferences() {
    console.log('🎮 Closing player preferences modal');
    
    const preferencesModal = document.getElementById('player-preferences-modal');
    if (preferencesModal) {
      preferencesModal.style.display = 'none';

      // Re-enable keyboard input
      if (window.resumeKeyboardInput) {
        window.resumeKeyboardInput();
      }

      // Resume the game
      if (this.scene && this.scene.scene.isPaused() === true) {
        this.scene.scene.resume();
      }
    }
  }

  /**
   * Update avatar sprite to a new sprite
   * @param {string} newSpriteKey - The key of the new sprite to display
   */
  updateAvatarSprite(newSpriteKey) {
    console.log('👤 Updating avatar sprite to:', newSpriteKey);
    
    if (!this.avatarImg) {
      console.error('❌ Avatar image element not found');
      return;
    }
    
    // Update the avatar image
    const headshotPath = this.getHeadshotPath(newSpriteKey);
    this.avatarImg.src = headshotPath;
    this.avatarImg.alt = newSpriteKey;
    
    console.log('✅ Avatar updated to:', newSpriteKey);
  }

  /**
   * The Punch and Block buttons, bottom right above the phone: Punch throws
   * the next punch of the combo (jab, jab, cross), Block guards while held.
   * Touch handlers call preventDefault so Phaser doesn't also take the touch
   * as a tap on the game (which would walk there); a finger on the canvas can
   * keep walking meanwhile.
   */
  createCombatButtons() {
    const box = document.createElement('div');
    box.id = 'combat-buttons';

    this.blockButton = this.makeCombatButton('hud-block-button', 'Block', 'Block — hold Q');
    this.punchButton = this.makeCombatButton('hud-punch-button', 'Punch', 'Punch — F or right-click; press again for jab, jab, cross');
    box.appendChild(this.blockButton);
    box.appendChild(this.punchButton);
    document.body.appendChild(box);
    this.combatButtons = box;

    const punch = (e) => {
      e.preventDefault();
      window.playerCombat?.attack();
    };
    this.punchButton.addEventListener('touchstart', punch, { passive: false });
    this.punchButton.addEventListener('mousedown', (e) => { if (e.button === 0) punch(e); });

    const blockOn = (e) => {
      e.preventDefault();
      if (window.playerCombat?.startBlock()) this.blockButton.classList.add('held');
    };
    const blockOff = (e) => {
      e?.preventDefault?.();
      window.playerCombat?.endBlock();
      this.blockButton.classList.remove('held');
    };
    this.blockButton.addEventListener('touchstart', blockOn, { passive: false });
    this.blockButton.addEventListener('touchend', blockOff, { passive: false });
    this.blockButton.addEventListener('touchcancel', blockOff, { passive: false });
    this.blockButton.addEventListener('mousedown', (e) => { if (e.button === 0) blockOn(e); });
    this.blockButton.addEventListener('mouseup', blockOff);
    this.blockButton.addEventListener('mouseleave', () => {
      if (this.blockButton.classList.contains('held')) blockOff();
    });
    // Q (player.js) ends a block too: keep the button's look in step
    this._syncBlockLook = () => {
      if (!window.playerCombat?.isBlocking) this.blockButton.classList.remove('held');
    };
  }

  makeCombatButton(id, text, label) {
    const button = document.createElement('div');
    button.id = id;
    button.className = 'combat-button';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', text);
    const icon = document.createElement('span');
    icon.className = 'combat-button-icon';
    button.appendChild(icon);
    const caption = document.createElement('span');
    caption.className = 'combat-button-label';
    caption.textContent = text;
    button.appendChild(caption);
    button.addEventListener('mouseenter', () => setHudLabel(label));
    button.addEventListener('mouseleave', () => clearHudLabel());
    button.addEventListener('contextmenu', (e) => e.preventDefault());
    return button;
  }

  /**
   * Update HUD (called every frame)
   */
  update() {
    this._syncBlockLook?.();
    // No fight buttons over the knockout screen
    if (this.combatButtons) {
      const hide = window.playerHealth?.isKO?.() === true;
      if (this._combatHidden !== hide) {
        this._combatHidden = hide;
        this.combatButtons.style.display = hide ? 'none' : '';
      }
    }

    // Check if player sprite has changed and update avatar if needed
    if (window.player?.texture?.key) {
      const currentSprite = this.avatarImg.alt;
      const newSprite = window.player.texture.key;
      
      if (currentSprite !== newSprite) {
        const headshotPath = this.getHeadshotPath(newSprite);
        this.avatarImg.src = headshotPath;
        this.avatarImg.alt = newSprite;
        console.log(`👤 Avatar updated to: ${newSprite}`);
      }
    }
  }

  /**
   * Clean up HUD when scene shuts down
   */
  destroy() {
    // Remove event listeners
    if (this.avatarButton) {
      this.avatarButton.replaceWith(this.avatarButton.cloneNode(true));
    }
    if (this.combatButtons) {
      this.combatButtons.remove();
      this.combatButtons = null;
    }

    console.log('🗑️  HUD destroyed');
  }
}

// Export singleton instance creator
export function createPlayerHUD(scene) {
  const hud = new PlayerHUD(scene);
  
  // Store reference globally for easy access
  window.playerHUD = hud;
  
  return hud;
}

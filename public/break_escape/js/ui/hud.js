/**
 * HUD (Heads-Up Display) System
 * Manages the player's HUD including avatar button and interaction mode toggle
 * Uses HTML elements with a small Phaser canvas for hand animations
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { setHudLabel, clearHudLabel } from './info-label.js';

export class PlayerHUD {
  constructor(scene) {
    this.scene = scene;
    this.currentModeIndex = 0; // Start with 'interact' mode
    this.isAnimating = false;
    this.isInitialized = false; // Prevent multiple initialization attempts
    
    // HTML elements
    this.avatarButton = null;
    this.avatarImg = null;
    this.modeToggleButton = null;
    this.modeLabel = null;
    this.handCanvas = null;
    
    // Phaser elements for hand animation
    this.handPhaserGame = null;
    this.handSprite = null;
    this.handScene = null;

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

    // Create mode toggle button
    this.modeToggleButton = document.createElement('div');
    this.modeToggleButton.id = 'hud-mode-toggle-button';
    this.modeToggleButton.className = 'hud-button';
    this.modeToggleButton.addEventListener('mouseenter', () => setHudLabel(`${this.getCurrentMode()} mode — Q to toggle`));
    this.modeToggleButton.addEventListener('mouseleave', () => clearHudLabel());
    
    this.handCanvas = document.createElement('canvas');
    this.handCanvas.id = 'hud-hand-canvas';
    this.handCanvas.width = 64;
    this.handCanvas.height = 64;
    this.handCanvas.style.imageRendering = 'pixelated';
    this.handCanvas.style.imageRendering = '-moz-crisp-edges';
    this.handCanvas.style.imageRendering = 'crisp-edges';
    this.modeToggleButton.appendChild(this.handCanvas);
    
    this.modeLabel = document.createElement('span');
    this.modeLabel.id = 'hud-mode-label';
    this.modeLabel.textContent = 'INTERACT';
    this.modeToggleButton.appendChild(this.modeLabel);
    hudContainer.appendChild(this.modeToggleButton);

    // Set up avatar button
    this.setupAvatarButton();
    
    // Set up mode toggle button
    this.setupModeToggleButton();
    
    // Initialize Phaser for hand animations
    this.initializeHandPhaser();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

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
   * Set up mode toggle button
   */
  setupModeToggleButton() {
    const currentMode = this.getCurrentMode();
    this.updateButtonStyle(currentMode);
    this.modeLabel.textContent = currentMode.toUpperCase();

    // Click handler (desktop) and touchend handler (mobile — avoids 300ms delay
    // and works even when the Phaser canvas is consuming touchstart events).
    this.modeToggleButton.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.cycleMode();
      }
    });
    this.modeToggleButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.isAnimating) {
        this.cycleMode();
      }
    });

    console.log(`🎮 Mode toggle button set up (mode: ${currentMode})`);
  }

  /**
   * Initialize Phaser for hand sprite animations
   */
  initializeHandPhaser() {
    const HUD_HAND_SCENE_KEY = 'HUDHandScene';
    
    class HUDHandScene extends Phaser.Scene {
      constructor() {
        super({ key: HUD_HAND_SCENE_KEY });
      }

      preload() {
        // Load hand frames spritesheet
        const assetsPath = window.breakEscapeConfig?.assetsPath || 'public/break_escape/assets';
        this.load.spritesheet('hand_frames', `${assetsPath}/icons/hand_frames.png`, {
          frameWidth: 32,
          frameHeight: 32
        });
      }

      create() {
        // Create hand sprite in center of canvas - scale 2x for pixel-perfect rendering
        const handSprite = this.add.sprite(32, 32, 'hand_frames', 0);
        handSprite.setOrigin(0.5);
        handSprite.setScale(2); // Exact 2x scale: 32px → 64px (pixel-perfect)
        
        // Create animations for transitions
        this.createHandAnimations();
        
        // Store reference
        if (window.playerHUD) {
          window.playerHUD.handSprite = handSprite;
          window.playerHUD.handScene = this;
          
          // Set initial frame based on current mode
          const mode = window.playerHUD.getCurrentMode();
          const modeConfig = COMBAT_CONFIG.interactionModes[mode];
          handSprite.setFrame(modeConfig.frame);
        }
      }

      createHandAnimations() {
        // Animation: interact (0) to jab (6)
        if (!this.anims.exists('hand_interact_to_jab')) {
          this.anims.create({
            key: 'hand_interact_to_jab',
            frames: this.anims.generateFrameNumbers('hand_frames', { start: 1, end: 6 }),
            frameRate: 20,
            repeat: 0
          });
        }

        // Animation: jab (6) to cross (11)
        if (!this.anims.exists('hand_jab_to_cross')) {
          this.anims.create({
            key: 'hand_jab_to_cross',
            frames: this.anims.generateFrameNumbers('hand_frames', { start: 7, end: 11 }),
            frameRate: 20,
            repeat: 0
          });
        }

        // Animation: cross (11) to interact (0)
        if (!this.anims.exists('hand_cross_to_interact')) {
          this.anims.create({
            key: 'hand_cross_to_interact',
            frames: this.anims.generateFrameNumbers('hand_frames', { start: 12, end: 14 }).concat([{ key: 'hand_frames', frame: 0 }]),
            frameRate: 20,
            repeat: 0
          });
        }
      }
    }

    const config = {
      type: Phaser.CANVAS,
      canvas: this.handCanvas,
      width: 64,
      height: 64,
      transparent: true,
      scene: [HUDHandScene],
      scale: {
        mode: Phaser.Scale.NONE
      },
      render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
      }
    };

    this.handPhaserGame = new Phaser.Game(config);
    console.log('✨ Phaser hand animation initialized');
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Q key to toggle mode
      if (e.key === 'q' || e.key === 'Q') {
        // Don't trigger if typing in an input field
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
          return;
        }
        if (!this.isAnimating) {
          this.cycleMode();
        }
      }
    });

    console.log('⌨️  Keyboard shortcuts set up: Q = toggle mode');
  }

  /**
   * Get current interaction mode
   * @returns {string}
   */
  getCurrentMode() {
    return COMBAT_CONFIG.modeOrder[this.currentModeIndex];
  }

  /**
   * Cycle to next interaction mode
   */
  cycleMode() {
    if (this.isAnimating) return; // Prevent rapid clicking

    const oldMode = this.getCurrentMode();
    
    // Increment mode index (with wrap-around)
    this.currentModeIndex = (this.currentModeIndex + 1) % COMBAT_CONFIG.modeOrder.length;
    const newMode = this.getCurrentMode();
    
    console.log(`🔄 Cycling mode: ${oldMode} → ${newMode}`);

    // Animate the transition
    this.animateTransition(oldMode, newMode);

    // Update combat system
    if (window.playerCombat) {
      window.playerCombat.setInteractionMode(newMode);
    }

    // Notify tutorial when player switches into a combat mode
    if ((newMode === 'jab' || newMode === 'cross') && window.getTutorialManager) {
      window.getTutorialManager().notifyCombatModeToggled();
    }

    // Play click sound (if available)
    if (window.playUISound) {
      window.playUISound('click');
    }
  }

  /**
   * Animate transition between modes
   * @param {string} oldMode - The previous mode
   * @param {string} newMode - The new mode to transition to
   */
  animateTransition(oldMode, newMode) {
    this.isAnimating = true;
    
    // Add animating class for CSS animation
    this.modeToggleButton.classList.add('animating');

    // Determine which animation to play
    let animKey = null;
    if (oldMode === 'interact' && newMode === 'jab') {
      animKey = 'hand_interact_to_jab';
    } else if (oldMode === 'jab' && newMode === 'cross') {
      animKey = 'hand_jab_to_cross';
    } else if (oldMode === 'cross' && newMode === 'interact') {
      animKey = 'hand_cross_to_interact';
    }

    // Play Phaser animation if available
    if (this.handSprite && this.handScene && animKey && this.handScene.anims.exists(animKey)) {
      this.handSprite.play(animKey);
      
      // Wait for animation to complete
      this.handSprite.once('animationcomplete', () => {
        this.finishTransition(newMode);
      });
    } else {
      // Fallback: instant frame change
      const modeConfig = COMBAT_CONFIG.interactionModes[newMode];
      if (this.handSprite) {
        this.handSprite.setFrame(modeConfig.frame);
      }
      
      // Finish after short delay
      setTimeout(() => {
        this.finishTransition(newMode);
      }, 200);
    }
  }

  /**
   * Finish mode transition
   */
  finishTransition(newMode) {
    // Update button style and label
    this.updateButtonStyle(newMode);
    this.modeLabel.textContent = newMode.toUpperCase();
    
    // Remove animating class
    this.modeToggleButton.classList.remove('animating');
    
    this.isAnimating = false;
  }

  /**
   * Update button style based on current mode
   */
  updateButtonStyle(mode) {
    // Remove all mode classes
    this.modeToggleButton.classList.remove('mode-interact', 'mode-jab', 'mode-cross');
    
    // Add current mode class
    this.modeToggleButton.classList.add(`mode-${mode}`);

    console.log(`🎨 Button style updated: ${mode}`);
  }

  /**
   * Update HUD (called every frame)
   */
  update() {
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
    // Destroy Phaser hand game
    if (this.handPhaserGame) {
      this.handPhaserGame.destroy(true);
      this.handPhaserGame = null;
    }
    
    // Remove event listeners
    if (this.avatarButton) {
      this.avatarButton.replaceWith(this.avatarButton.cloneNode(true));
    }
    if (this.modeToggleButton) {
      this.modeToggleButton.replaceWith(this.modeToggleButton.cloneNode(true));
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

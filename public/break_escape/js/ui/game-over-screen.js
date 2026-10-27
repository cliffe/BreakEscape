/**
 * Game Over Screen
 * Displayed when player is knocked out (0 HP)
 */

import { CombatEvents } from '../events/combat-events.js';

export class GameOverScreen {
  constructor() {
    this.overlay = null;
    this.isShowing = false;

    this.createUI();
    this.setupEventListeners();

    console.log('✅ Game over screen initialized');
  }

  createUI() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'game-over-screen';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      flex-direction: column;
      gap: 30px;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'KNOCKED OUT';
    title.style.cssText = `
      color: #ff0000;
      font-size: 48px;
      font-family: 'Press Start 2P', monospace;
      font-weight: normal;
      margin: 0;
      text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
      animation: pulse 2s infinite;
    `;

    // Message
    const message = document.createElement('p');
    message.textContent = 'You have been defeated';
    message.style.cssText = `
      color: #ffffff;
      font-size: 24px;
      font-family: 'VT323', monospace;
      margin: 0;
    `;

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 20px;
    `;

    // Restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Restart';
    restartBtn.style.cssText = `
      padding: 15px 40px;
      font-size: 20px;
      font-family: 'VT323', monospace;
      background: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
      transition: background 0.3s;
    `;
    restartBtn.onmouseover = () => restartBtn.style.background = '#45a049';
    restartBtn.onmouseout = () => restartBtn.style.background = '#4CAF50';
    restartBtn.onclick = () => this.restart();

    // Main menu button
    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Main Menu';
    menuBtn.style.cssText = `
      padding: 15px 40px;
      font-size: 20px;
      font-family: 'VT323', monospace;
      background: #555;
      color: white;
      border: none;
      cursor: pointer;
      transition: background 0.3s;
    `;
    menuBtn.onmouseover = () => menuBtn.style.background = '#666';
    menuBtn.onmouseout = () => menuBtn.style.background = '#555';
    menuBtn.onclick = () => this.mainMenu();

    buttonsContainer.appendChild(restartBtn);
    buttonsContainer.appendChild(menuBtn);

    this.overlay.appendChild(title);
    this.overlay.appendChild(message);
    this.overlay.appendChild(buttonsContainer);

    // Add CSS animation for pulse
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.overlay);
  }

  setupEventListeners() {
    if (!window.eventDispatcher) {
      console.warn('Event dispatcher not found');
      return;
    }

    // Listen for player KO
    window.eventDispatcher.on(CombatEvents.PLAYER_KO, () => {
      // Add 1 second delay before showing game over screen
      setTimeout(() => {
        this.show();
      }, 1000);
    });
  }

  show() {
    if (!this.isShowing) {
      this.overlay.style.display = 'flex';
      this.isShowing = true;

      // Close anything opened in the second since the knockout, so nothing
      // runs under this screen (m04 confirmation R2 N1)
      window.closeMinigameForKnockout?.();

      // Disable player movement
      if (window.player) {
        window.player.disableMovement = true;
      }
    }
  }

  hide() {
    if (this.isShowing) {
      this.overlay.style.display = 'none';
      this.isShowing = false;
    }
  }

  async restart() {
    // Full health, saved with the reset below, so the reload doesn't bring back
    // the HP from before the knockout (m05 E6)
    if (window.playerHealth) {
      window.playerHealth.reset();
    }

    // Hostile NPCs that aren't knocked out calm down and go back to their posts
    // (7.1d): the reset is saved before the reload, so the player doesn't wake
    // up beside an NPC still swinging at them
    try {
      window.npcHostileSystem?.resetHostilesForRespawn?.();
      if (window.stateSync?.sync) {
        await Promise.race([
          window.stateSync.sync(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      }
    } catch (err) {
      console.warn('Respawn hostility reset failed:', err);
    }

    // Re-enable player movement
    if (window.player) {
      window.player.disableMovement = false;
    }

    // Hide game over screen
    this.hide();

    // Reload the page to restart. skip_resume=1 stops show.html.erb opening the
    // "Resume session?" / "Other sessions" overlay: the player just chose Restart, and
    // a plain reload has saved progress, so the overlay would otherwise appear.
    const url = new URL(window.location.href);
    url.searchParams.set('skip_resume', '1');
    window.location.href = url.toString();
  }

  mainMenu() {
    // Navigate to scenario select or main menu
    window.location.href = '/break_escape/missions';
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

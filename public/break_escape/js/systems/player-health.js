import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';

let state = null;

function createInitialState() {
  return {
    currentHP: COMBAT_CONFIG.player.maxHP,
    maxHP: COMBAT_CONFIG.player.maxHP,
    isKO: false
  };
}

export function initPlayerHealth() {
  state = createInitialState();
  console.log('✅ Player health system initialized');

  return {
    getHP: () => state.currentHP,
    getMaxHP: () => state.maxHP,
    isKO: () => state.isKO,
    damage: (amount) => damagePlayer(amount),
    heal: (amount) => healPlayer(amount),
    reset: () => { state = createInitialState(); }
  };
}

function damagePlayer(amount) {
  if (!state) {
    console.error('Player health not initialized');
    return false;
  }

  if (typeof amount !== 'number' || amount < 0) {
    console.error('Invalid damage amount:', amount);
    return false;
  }

  const oldHP = state.currentHP;
  state.currentHP = Math.max(0, state.currentHP - amount);

  // Emit HP changed event
  if (window.eventDispatcher) {
    window.eventDispatcher.emit(CombatEvents.PLAYER_HP_CHANGED, {
      hp: state.currentHP,
      maxHP: state.maxHP,
      delta: -amount
    });
  }

  // Check for KO
  if (state.currentHP <= 0 && !state.isKO) {
    state.isKO = true;

    // Play death animation
    if (window.player) {
      playPlayerDeathAnimation();
    }

    // Play KO sounds: Wilhelm scream then body fall
    if (window.soundManager) {
      window.soundManager.play('wilhelm_scream');
      window.soundManager.play('body_fall', { delay: 400 });
    }

    if (window.eventDispatcher) {
      window.eventDispatcher.emit(CombatEvents.PLAYER_KO, {});
    }
  }

  console.log(`Player HP: ${oldHP} → ${state.currentHP}`);
  return true;
}

/**
 * Play death animation for player
 */
function playPlayerDeathAnimation() {
  const player = window.player;
  if (!player || !player.scene) return;

  // Get player's last facing direction
  const direction = player.lastDirection || 'down';
  
  // Check if player uses atlas-based animations
  const texture = player.scene.textures.get(player.texture.key);
  const frames = texture ? texture.getFrameNames() : [];
  const isAtlas = frames.length > 0 && typeof frames[0] === 'string' && frames[0].includes('_frame_');
  
  if (isAtlas) {
    // Try atlas-based death animations
    // Convert player direction to atlas compass direction
    const compassMap = {
      'down': 'south',
      'up': 'north',
      'left': 'west',
      'right': 'east',
      'down-left': 'south-west',
      'down-right': 'south-east',
      'up-left': 'north-west',
      'up-right': 'north-east'
    };
    
    const compassDir = compassMap[direction] || 'south';
    const deathAnimKey = `falling-back-death_${compassDir}`;
    
    if (player.scene.anims.exists(deathAnimKey)) {
      // Store original origin for visual shift
      const originalOriginY = player.originY;
      
      // Add animation update listener to progressively shift visual display downward
      player.on('animationupdate', (anim, frame) => {
        if (anim.key === deathAnimKey) {
          // Calculate progress through animation (0 to 1)
          const totalFrames = anim.getTotalFrames();
          const currentFrame = frame.index;
          const progress = currentFrame / totalFrames;
          
          // Shift player's visual display downward by adjusting origin
          // Decrease originY by ~0.4 to shift texture down (~32px for 80px sprite)
          const originOffset = progress * 0.4;
          player.setOrigin(player.originX, originalOriginY - originOffset);
        }
      });
      
      // Clean up listener when animation completes
      player.once('animationcomplete', (anim) => {
        if (anim.key === deathAnimKey) {
          player.off('animationupdate');
          // Origin stays shifted - defeated player appears lower but depth unchanged
        }
      });
      
      player.play(deathAnimKey);
      console.log(`💀 Playing player death animation: ${deathAnimKey}`);
    } else {
      console.warn(`⚠️ Death animation not found: ${deathAnimKey}`);
      // Log available death animations for debugging
      const deathAnims = Object.keys(player.scene.anims.anims.entries)
        .filter(key => key.includes('falling-back-death'));
      if (deathAnims.length > 0) {
        console.log(`   Available death animations: ${deathAnims.join(', ')}`);
      }
    }
  }
  
  // Disable player physics body to prevent further movement
  if (player.body) {
    player.body.setVelocity(0, 0);
    // Don't disable body entirely to keep collision detection for NPCs
  }
}

function healPlayer(amount) {
  if (!state) return false;

  const oldHP = state.currentHP;
  state.currentHP = Math.min(state.maxHP, state.currentHP + amount);

  if (window.eventDispatcher) {
    window.eventDispatcher.emit(CombatEvents.PLAYER_HP_CHANGED, {
      hp: state.currentHP,
      maxHP: state.maxHP,
      delta: amount
    });
  }

  console.log(`Player HP: ${oldHP} → ${state.currentHP}`);
  return true;
}

/**
 * NPC Combat System
 * Handles NPC attacks on the player
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { applyKnockback } from '../utils/knockback.js';
import { getNPCDirection } from './npc-sprites.js';

export class NPCCombat {
  constructor(scene) {
    this.scene = scene;
    this.npcAttackTimers = new Map(); // npcId -> last attack time
    this.npcAttacking = new Set(); // Track NPCs currently in attack animation

    console.log('✅ NPC combat system initialized');
  }

  /**
   * Check if NPC can attack player
   * @param {string} npcId
   * @returns {boolean}
   */
  canAttack(npcId) {
    if (!window.npcHostileSystem) return false;

    const state = window.npcHostileSystem.getState(npcId);
    if (!state || !state.isHostile || state.isKO) {
      // If NPC is KO, make sure they're not stuck in attacking state
      if (state && state.isKO) {
        this.npcAttacking.delete(npcId);
      }
      return false;
    }

    // Don't attack if already attacking
    if (this.npcAttacking.has(npcId)) {
      console.log(`🥊 ${npcId} already attacking, skipping`);
      return false;
    }

    // Don't attack while a minigame is active (conversation, combat, etc.)
    if (window.MinigameFramework && window.MinigameFramework.currentMinigame) {
      return false;
    }

    // Check cooldown
    const lastAttackTime = this.npcAttackTimers.get(npcId) || 0;
    const now = Date.now();
    const timeSinceLast = now - lastAttackTime;

    return timeSinceLast >= state.attackCooldown;
  }

  /**
   * Attempt NPC attack on player
   * Called by hostile behavior when NPC is in range
   * @param {string} npcId
   * @param {Phaser.GameObjects.Sprite} npcSprite
   * @returns {boolean} - True if attack was initiated
   */
  attemptAttack(npcId, npcSprite) {
    if (!this.canAttack(npcId)) {
      return false;
    }

    if (!window.player) {
      return false;
    }

    const state = window.npcHostileSystem.getState(npcId);
    if (!state) return false;

    // Check if player is in range
    const distance = Phaser.Math.Distance.Between(
      npcSprite.x,
      npcSprite.y,
      window.player.x,
      window.player.y
    );

    if (distance > state.attackRange) {
      return false;
    }

    // Start attack sequence
    this.performAttack(npcId, npcSprite, state);
    return true;
  }

  /**
   * Perform attack sequence
   * @param {string} npcId
   * @param {Phaser.GameObjects.Sprite} npcSprite
   * @param {Object} state - NPC hostile state
   */
  performAttack(npcId, npcSprite, state) {
    // Mark NPC as attacking
    this.npcAttacking.add(npcId);
    console.log(`🥊 ${npcId} starting attack sequence, added to attacking set (size: ${this.npcAttacking.size})`);
    
    // Update attack timer
    this.npcAttackTimers.set(npcId, Date.now());

    // Show telegraph
    if (window.attackTelegraph) {
      window.attackTelegraph.show(npcId, npcSprite, COMBAT_CONFIG.npc.attackWindupDuration);
    }

    // Play attack animation after windup
    this.scene.time.delayedCall(COMBAT_CONFIG.npc.attackWindupDuration, () => {
      this.startAttackAnimation(npcId, npcSprite, state);
    });
  }

  /**
   * Start attack animation and setup damage application
   * @param {string} npcId
   * @param {Phaser.GameObjects.Sprite} npcSprite
   * @param {Object} state - NPC hostile state
   */
  startAttackAnimation(npcId, npcSprite, state) {
    if (!window.player || !window.playerHealth) {
      this.npcAttacking.delete(npcId);
      return;
    }

    // Check if NPC is still valid and not destroyed
    if (!npcSprite || npcSprite.destroyed) {
      console.log(`${npcId} sprite destroyed during attack`);
      this.npcAttacking.delete(npcId);
      return;
    }

    // Check if NPC became KO during windup
    if (window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npcId)) {
      console.log(`${npcId} became KO during attack windup`);
      this.npcAttacking.delete(npcId);
      return;
    }

    // Check if player is still in range
    const distance = Phaser.Math.Distance.Between(
      npcSprite.x,
      npcSprite.y,
      window.player.x,
      window.player.y
    );

    if (distance > state.attackRange) {
      console.log(`${npcId} attack missed - player moved out of range`);
      this.npcAttacking.delete(npcId);
      return;
    }

    // Play attack animation
    this.playAttackAnimation(npcSprite, npcId, state);
  }

  /**
   * Apply damage to player (called when attack animation completes)
   * @param {string} npcId
   * @param {Phaser.GameObjects.Sprite} npcSprite
   * @param {Object} state - NPC hostile state
   */
  applyAttackDamage(npcId, npcSprite, state) {
    // Clear attacking flag - must be first to ensure it's always cleared
    this.npcAttacking.delete(npcId);
    console.log(`🥊 ${npcId} applying attack damage, cleared attacking flag`);
    
    if (!window.player || !window.playerHealth) {
      console.log(`⚠️ ${npcId} attack aborted - no player or health system`);
      return;
    }

    // Check if sprite is still valid
    if (!npcSprite || npcSprite.destroyed) {
      console.log(`⚠️ ${npcId} attack aborted - sprite invalid`);
      return;
    }

    // Check if player is still in range (they might have moved during animation)
    const distance = Phaser.Math.Distance.Between(
      npcSprite.x,
      npcSprite.y,
      window.player.x,
      window.player.y
    );

    if (distance > state.attackRange * 1.5) { // 1.5x range for leniency during animation
      console.log(`${npcId} attack missed - player moved away during animation`);
      return;
    }

    // Apply damage to player
    const damage = state.attackDamage;
    window.playerHealth.damage(damage);

    // Play hit animation if available
    this.playHitAnimation(window.player);

    // Visual + audio feedback on hit
    if (window.spriteEffects) {
      window.spriteEffects.flashDamage(window.player);
    }
    if (window.soundManager) {
      window.soundManager.play('hit_impact');
      // Play gender-matched grunt for the player being hit
      const playerSheet = window.breakEscapeConfig?.playerSprite
        || window.gameScenario?.player?.spriteSheet
        || 'male_hacker_hood_v2';
      const isPlayerFemale = playerSheet.startsWith('female_');
      const hpAfter = window.playerHealth?.getHP() ?? Infinity;
      const maxHP   = window.playerHealth?.getMaxHP() ?? 100;
      const isHeavyHit = damage > 5 || hpAfter / maxHP <= 0.25;
      const gruntKey = isPlayerFemale
        ? (isHeavyHit ? 'grunt_female_heavy' : 'grunt_female_soft')
        : (isHeavyHit ? 'grunt_male_heavy'   : 'grunt_male_soft');
      window.soundManager.play(gruntKey);
    }

    // Damage numbers
    if (window.damageNumbers) {
      window.damageNumbers.show(window.player.x, window.player.y - 30, damage, 'damage');
    }

    // Knockback
    if (window.player) {
      applyKnockback(window.player, npcSprite.x, npcSprite.y);
    }

    // Screen effects
    if (window.screenEffects) {
      window.screenEffects.flashDamage();
      window.screenEffects.shakePlayerHit();
    }

    console.log(`${npcId} dealt ${damage} damage to player`);
  }

  /**
   * Play hit/taking-punch animation on a sprite
   * @param {Phaser.GameObjects.Sprite} sprite - The sprite taking damage
   */
  playHitAnimation(sprite) {
    if (!sprite || !sprite.scene) return;

    // Get sprite's current direction
    const direction = sprite.lastDirection || 'down';
    
    // Check if this is player or NPC
    const isPlayer = sprite === window.player;
    
    if (isPlayer) {
      // Player hit animations use atlas compass directions
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
      const hitAnimKey = `taking-punch_${compassDir}`;
      
      if (sprite.scene.anims.exists(hitAnimKey)) {
        sprite.play(hitAnimKey);
      }
    } else {
      // NPC hit animations
      const npcId = sprite.npcId;
      if (npcId) {
        const hitAnimKey = `npc-${npcId}-hit-${direction}`;
        
        if (sprite.scene.anims.exists(hitAnimKey)) {
          sprite.play(hitAnimKey);
        }
      }
    }
  }

  /**
   * Play attack animation
   * @param {Phaser.GameObjects.Sprite} npcSprite
   * @param {string} npcId
   * @param {Object} state - NPC hostile state
   */
  playAttackAnimation(npcSprite, npcId, state) {
    if (!npcSprite || !npcId) {
      this.npcAttacking.delete(npcId);
      return;
    }

    const direction = getNPCDirection(npcId, npcSprite);
    const attackAnimKey = `npc-${npcId}-attack-${direction}`;
    
    console.log(`🥊 NPC ${npcId} attempting attack animation: ${attackAnimKey}`);
    
    // Try to play cross-punch animation
    if (npcSprite.scene.anims.exists(attackAnimKey)) {
      // Stop any current animation
      if (npcSprite.anims.isPlaying) {
        npcSprite.anims.stop();
      }
      
      npcSprite.play(attackAnimKey);
      console.log(`🥊 Playing NPC attack animation: ${attackAnimKey}`);
      
      // Safety timeout to ensure flag is cleared even if animation doesn't complete
      const maxAttackDuration = 2000; // 2 seconds max
      const safetyTimeout = this.scene.time.delayedCall(maxAttackDuration, () => {
        if (this.npcAttacking.has(npcId)) {
          console.warn(`⚠️ Attack animation timeout for ${npcId}, clearing flag`);
          this.npcAttacking.delete(npcId);
        }
      });
      
      // Apply damage when animation completes, then return to idle
      npcSprite.once('animationcomplete', (anim) => {
        // Cancel safety timeout if animation completes properly
        if (safetyTimeout) {
          safetyTimeout.remove();
        }
        
        if (anim.key === attackAnimKey && !npcSprite.destroyed) {
          // Apply damage on animation complete
          this.applyAttackDamage(npcId, npcSprite, state);
          
          const idleAnimKey = `npc-${npcId}-idle-${direction}`;
          if (npcSprite.scene.anims.exists(idleAnimKey)) {
            npcSprite.play(idleAnimKey);
          }
        } else if (this.npcAttacking.has(npcId)) {
          // Animation was different or sprite destroyed, clear flag
          this.npcAttacking.delete(npcId);
        }
      });
    } else {
      console.warn(`⚠️ Attack animation not found: ${attackAnimKey}, using fallback`);
      
      // Fallback: red tint + delayed damage
      console.log(`🥊 Using fallback attack for ${npcId}`);
      if (window.spriteEffects) {
        window.spriteEffects.applyAttackTint(npcSprite);
      }

      // Safety timeout to ensure flag is cleared
      const maxAttackDuration = 2000;
      const safetyTimeout = this.scene.time.delayedCall(maxAttackDuration, () => {
        if (this.npcAttacking.has(npcId)) {
          console.warn(`⚠️ Fallback attack timeout for ${npcId}, clearing flag`);
          this.npcAttacking.delete(npcId);
        }
      });

      // Apply damage and remove tint after animation duration
      this.scene.time.delayedCall(COMBAT_CONFIG.player.punchAnimationDuration, () => {
        // Cancel safety timeout
        if (safetyTimeout) {
          safetyTimeout.remove();
        }
        
        this.applyAttackDamage(npcId, npcSprite, state);
        
        if (window.spriteEffects && npcSprite && !npcSprite.destroyed) {
          window.spriteEffects.clearAttackTint(npcSprite);
        }
      });
    }
  }

  /**
   * Called from game update loop for NPCs in hostile behavior
   * @param {string} npcId
   * @param {Phaser.GameObjects.Sprite} npcSprite
   */
  update(npcId, npcSprite) {
    // Attempt attack if possible
    this.attemptAttack(npcId, npcSprite);
  }
}

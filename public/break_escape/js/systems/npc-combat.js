/**
 * NPC Combat System
 * Handles NPC attacks on the player
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { applyKnockback } from '../utils/knockback.js';
import { getNPCDirection } from './npc-sprites.js';
import { playerCanBeAttacked, attacksPausedByUI, minigameBlocksAttacks, ATTACK_RESUME_GRACE_MS } from './npc-attack-guard.js';
import { resolveFightStyle, npcIsGuarding, blockedDamage, facingCovers } from './fight-styles.js';

export class NPCCombat {
  constructor(scene) {
    this.scene = scene;
    this.npcAttackTimers = new Map(); // npcId -> last attack time
    this.npcAttacking = new Set(); // Track NPCs currently in attack animation
    this.lastMinigameOpenAt = 0; // When a minigame was last seen open (7.1b grace)
    this.npcOpenUntil = new Map(); // npcId -> time its recovery ends (guards again after)

    console.log('✅ NPC combat system initialized');
  }

  /**
   * The NPC's fight style (fight-styles.js), from behavior.hostile.fightStyle.
   * @param {string} npcId
   */
  styleFor(npcId) {
    const name = window.npcBehaviorManager?.getBehavior?.(npcId)?.config?.hostile?.fightStyle;
    return resolveFightStyle(name);
  }

  /**
   * Whether the NPC has its guard up: a guarding style that is hostile,
   * standing (not walking in), not winding up or swinging, and past its recovery.
   * @param {string} npcId
   */
  isGuarding(npcId) {
    const style = this.styleFor(npcId);
    if (!style.guards) return false;
    const state = window.npcHostileSystem?.getState?.(npcId);
    if (!state?.isHostile || state.isKO) return false;
    const behavior = window.npcBehaviorManager?.getBehavior?.(npcId);
    return npcIsGuarding({
      style,
      attacking: this.npcAttacking.has(npcId),
      moving: behavior?.isMoving === true,
      now: Date.now(),
      openUntil: this.npcOpenUntil.get(npcId) || 0
    });
  }

  /** Whether the NPC is winding up or swinging with armour: hits don't stop it. */
  isArmoured(npcId) {
    return this.npcAttacking.has(npcId) && this.styleFor(npcId).armouredWindup === true;
  }

  /** The attack is over (landed, missed or called off): open for its recovery. */
  endAttack(npcId) {
    if (this.npcAttacking.delete(npcId)) {
      this.npcOpenUntil.set(npcId, Date.now() + this.styleFor(npcId).recoveryMs);
    }
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
        this.endAttack(npcId);
      }
      return false;
    }

    // Don't start an attack on a knocked-out player (CF-D)
    if (!playerCanBeAttacked()) {
      return false;
    }

    // Don't attack if already attacking
    if (this.npcAttacking.has(npcId)) {
      console.log(`🥊 ${npcId} already attacking, skipping`);
      return false;
    }

    // Don't attack while a minigame is active (conversation, lock, etc.), nor
    // for a moment after it closes, so the player can step away (7.1b). The
    // phone is the exception: attacks carry on and a hit doesn't close it
    // (m07 U12), so it is no free shield.
    if (minigameBlocksAttacks()) {
      this.lastMinigameOpenAt = Date.now();
      return false;
    }
    if (Date.now() - this.lastMinigameOpenAt < ATTACK_RESUME_GRACE_MS) {
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

    // Show telegraph, as long as the NPC's style winds up for
    const windup = this.styleFor(npcId).windupMs || COMBAT_CONFIG.npc.attackWindupDuration;
    if (window.attackTelegraph) {
      window.attackTelegraph.show(npcId, npcSprite, windup);
    }

    // Play attack animation after windup
    this.scene.time.delayedCall(windup, () => {
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
      this.endAttack(npcId);
      return;
    }

    // Check if NPC is still valid and not destroyed
    if (!npcSprite || npcSprite.destroyed) {
      console.log(`${npcId} sprite destroyed during attack`);
      this.endAttack(npcId);
      return;
    }

    // The player was knocked out during the windup: stand down (CF-D)
    if (!playerCanBeAttacked()) {
      if (window.attackTelegraph && typeof window.attackTelegraph.hide === 'function') {
        window.attackTelegraph.hide(npcId);
      }
      this.endAttack(npcId);
      return;
    }

    // A conversation or a cutscene opened during the windup: the swing
    // doesn't land, so the hit doesn't close it (7.1b)
    if (attacksPausedByUI()) {
      if (window.attackTelegraph && typeof window.attackTelegraph.hide === 'function') {
        window.attackTelegraph.hide(npcId);
      }
      this.endAttack(npcId);
      return;
    }

    // Check if NPC became KO during windup
    if (window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npcId)) {
      console.log(`${npcId} became KO during attack windup`);
      this.endAttack(npcId);
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
      this.endAttack(npcId);
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
    this.endAttack(npcId);
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

    // A conversation or a cutscene opened mid-swing: no damage (7.1b)
    if (attacksPausedByUI()) {
      console.log(`${npcId} attack held - conversation or cutscene open`);
      return;
    }

    // The player's block (Q or the block button) takes a punch from the front
    const player = window.player;
    const blocked = window.playerCombat?.isBlocking === true &&
      facingCovers(player.lastDirection || 'down', npcSprite.x - player.x, npcSprite.y - player.y,
                   COMBAT_CONFIG.block.coverHalfAngle);
    if (blocked) {
      const through = blockedDamage(state.attackDamage, COMBAT_CONFIG.block.damageScale);
      window.playerHealth.damage(through);
      window.playerCombat.showBlockedHit?.(player, through);
      console.log(`🛡️ Player blocked ${npcId}: ${through} of ${state.attackDamage} damage got through`);
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
      this.endAttack(npcId);
      return;
    }

    const direction = getNPCDirection(npcId, npcSprite);
    // 'attack' is the cross-punch; a jabbing style uses lead-jab when the sprite has it
    let attackAnimKey = `npc-${npcId}-attack-${direction}`;
    if (this.styleFor(npcId).attack === 'jab' && npcSprite.scene.anims.exists(`npc-${npcId}-jab-${direction}`)) {
      attackAnimKey = `npc-${npcId}-jab-${direction}`;
    }
    
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
          this.endAttack(npcId);
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
          this.endAttack(npcId);
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
          this.endAttack(npcId);
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

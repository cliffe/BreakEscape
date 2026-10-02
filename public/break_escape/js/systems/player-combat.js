/**
 * Player Combat System
 * Handles player punch attacks on hostile NPCs
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { applyKnockback } from '../utils/knockback.js';

export class PlayerCombat {
  constructor(scene) {
    this.scene = scene;
    this.lastPunchTime = 0;
    this.isPunching = false;
    this.currentMode = 'interact'; // Default to interact mode

    console.log('✅ Player combat system initialized');
  }

  /**
   * Set interaction mode (interact, jab, cross)
   * @param {string} mode - The mode to set ('interact', 'jab', or 'cross')
   */
  setInteractionMode(mode) {
    if (!COMBAT_CONFIG.interactionModes[mode]) {
      console.error(`Invalid interaction mode: ${mode}`);
      return;
    }
    this.currentMode = mode;
    console.log(`🥊 Interaction mode set to: ${mode}`);
  }

  /**
   * Get current interaction mode
   * @returns {string}
   */
  getInteractionMode() {
    return this.currentMode;
  }

  /**
   * Get current mode configuration
   * @returns {object}
   */
  getCurrentModeConfig() {
    return COMBAT_CONFIG.interactionModes[this.currentMode];
  }

  /**
   * Check if player can punch (cooldown check)
   * @returns {boolean}
   */
  canPunch() {
    const modeConfig = this.getCurrentModeConfig();
    
    // Can't punch in interact mode
    if (!modeConfig.canPunch) {
      return false;
    }

    const now = Date.now();
    const timeSinceLast = now - this.lastPunchTime;
    const cooldown = modeConfig.cooldown || COMBAT_CONFIG.player.punchCooldown;
    return timeSinceLast >= cooldown;
  }

  /**
   * Perform punch attack
   * This is called when player interacts with a hostile NPC
   * Damage applies to ALL NPCs in punch range and facing direction
   */
  punch() {
    if (this.isPunching) {
      console.log('🥊 Punch blocked - already punching');
      return false;
    }
    
    if (!this.canPunch()) {
      console.log('🥊 Punch blocked - on cooldown');
      return false;
    }

    if (!window.player) {
      console.error('Player not found');
      return false;
    }

    this.isPunching = true;
    this.lastPunchTime = Date.now();
    
    console.log(`🥊 Player starting punch, isPunching set to true`);

    // Play punch animation and wait for completion
    this.playPunchAnimation();

    return true;
  }

  /**
   * Map player directions to atlas compass directions
   */
  mapDirectionToCompass(direction) {
    const directionMap = {
      'right': 'east',
      'left': 'west',
      'up': 'north',
      'down': 'south',
      'up-right': 'north-east',
      'up-left': 'north-west',
      'down-right': 'south-east',
      'down-left': 'south-west'
    };
    return directionMap[direction] || 'south';
  }

  /**
   * Play punch animation - uses current mode's animation (lead-jab or cross-punch)
   */
  playPunchAnimation() {
    if (!window.player) return;

    const player = window.player;
    const direction = player.lastDirection || 'down';
    const compassDir = this.mapDirectionToCompass(direction);
    
    // Get current mode's animation key
    const modeConfig = this.getCurrentModeConfig();
    const animationBase = modeConfig.animationKey; // 'lead-jab' or 'cross-punch'
    
    if (!animationBase) {
      console.log('⚠️ Current mode has no punch animation');
      return;
    }
    
    const animKey = `${animationBase}_${compassDir}`;
    
    console.log(`🥊 Punch attempt: mode=${this.currentMode}, direction=${direction}, compass=${compassDir}`);
    console.log(`  - Trying: ${animKey} (exists: ${this.scene.anims.exists(animKey)})`);
    
    let animPlayed = false;
    
    // Try to play the mode's animation
    if (this.scene.anims.exists(animKey)) {
      console.log(`  ✓ Found ${animKey}, playing...`);
      player.anims.play(animKey, true);
      animPlayed = true;

      // Play swipe sound at the moment the arm swings
      if (window.soundManager) {
        const swipeSound = animationBase === 'lead-jab' ? 'punch_swipe_jab' : 'punch_swipe_cross';
        window.soundManager.play(swipeSound);
      }
      console.log(`  - After play: currentAnim=${player.anims.currentAnim?.key}, visible=${player.visible}, alpha=${player.alpha}`);
    }
    
    if (animPlayed) {
      console.log(`🥊 Playing punch animation: ${animKey}`);
      
      // Safety timeout to ensure flag is cleared even if animation is interrupted
      const maxAttackDuration = 2000; // 2 seconds max
      const safetyTimeout = this.scene.time.delayedCall(maxAttackDuration, () => {
        if (this.isPunching) {
          console.warn(`⚠️ Player punch animation timeout, clearing isPunching flag`);
          this.isPunching = false;
        }
      });
      
      // Animation will complete naturally
      // Apply damage when animation completes, then return to idle
      player.once('animationcomplete', (anim) => {
        // Cancel safety timeout if animation completes properly
        if (safetyTimeout) {
          safetyTimeout.remove();
        }
        
        // Check if the completed animation is a punch/jab animation
        if (anim.key.includes('punch') || anim.key.includes('jab')) {
          console.log(`🥊 Player punch animation completed: ${anim.key}`);
          // Apply damage on animation complete
          this.checkForHits();
          this.isPunching = false;
          
          const idleKey = `idle-${direction}`;
          if (player.anims && player.anims.exists && this.scene.anims.exists(idleKey)) {
            player.anims.play(idleKey, true);
          }
        } else if (this.isPunching) {
          // Animation was different (interrupted), just clear the flag
          console.warn(`⚠️ Player punch interrupted - animation changed to: ${anim.key}`);
          this.isPunching = false;
        }
      });
    } else {
      // Fallback: red tint + walk animation
      console.log(`⚠️ No punch animation found (tried ${animKey}), using fallback (red tint)`);
      if (window.soundManager) {
        const swipeSound = animationBase === 'lead-jab' ? 'punch_swipe_jab' : 'punch_swipe_cross';
        window.soundManager.play(swipeSound);
      }
      
      // Apply red tint
      if (window.spriteEffects) {
        window.spriteEffects.applyAttackTint(player);
      }

      // Play walk animation if not already playing
      if (!player.anims.isPlaying) {
        const walkKey = `walk-${direction}`;
        if (this.scene.anims.exists(walkKey)) {
          player.play(walkKey, true);
        }
      }

      // Safety timeout to ensure flag is cleared
      const maxAttackDuration = 2000;
      const safetyTimeout = this.scene.time.delayedCall(maxAttackDuration, () => {
        if (this.isPunching) {
          console.warn(`⚠️ Player fallback punch timeout, clearing isPunching flag`);
          this.isPunching = false;
        }
      });

      // Apply damage and remove tint after animation duration (fallback)
      this.scene.time.delayedCall(COMBAT_CONFIG.player.punchAnimationDuration, () => {
        // Cancel safety timeout
        if (safetyTimeout) {
          safetyTimeout.remove();
        }
        
        console.log(`🥊 Player fallback punch completed`);
        this.checkForHits();
        this.isPunching = false;
        
        if (window.spriteEffects && player && !player.destroyed) {
          window.spriteEffects.clearAttackTint(player);
        }
        // Stop animation
        if (player && player.anims && !player.destroyed) {
          player.anims.stop();
        }
      });
    }
  }

  /**
   * Check for hits on NPCs in range and direction
   * Applies AOE damage to all NPCs in punch range AND facing direction.
   *
   * Origin is the player's foot / collision-box centre (not the sprite centre):
   *   Atlas 80x80  → body.setOffset(31, 66), size 18x10  → foot centre Y = sprite.y + 31
   *   Legacy 64x64 → body.setOffset(25, 50), size 15x10  → foot centre Y = sprite.y + 23
   */
  checkForHits() {
    if (!window.player) {
      return;
    }

    const isAtlas = window.player.isAtlas;
    // Foot-centre offset from sprite pivot (sprite uses 0.5 anchor = centre)
    const footOffsetY = isAtlas ? 31 : 23;

    const playerX = window.player.x;          // Horizontally centred
    const playerY = window.player.y + footOffsetY; // Feet position
    const punchRange = COMBAT_CONFIG.player.punchRange;
    
    // Get damage from current mode
    const modeConfig = this.getCurrentModeConfig();
    const punchDamage = modeConfig.damage || COMBAT_CONFIG.player.punchDamage;

    // Get player facing direction
    const direction = window.player.lastDirection || 'down';

    // Draw debug hit area (only when debug mode is on)
    if (window.breakEscapeDebug) {
      this.drawPunchHitbox(playerX, playerY, punchRange, direction);
    } else if (this.hitboxGraphics) {
      this.hitboxGraphics.clear(); // ensure no stale overlay if debug was just toggled off
    }

    // Get all NPCs from rooms
    let hitCount = 0;
    
    if (window.rooms) {
      for (const roomId in window.rooms) {
        const room = window.rooms[roomId];
        if (!room.npcSprites) continue;

        room.npcSprites.forEach(npcSprite => {
          if (!npcSprite || !npcSprite.npcId) return;

          const npcId = npcSprite.npcId;
          const isHostile = window.npcHostileSystem.isNPCHostile(npcId);

          // Don't damage NPCs that are invisible (not yet revealed)
          if (!npcSprite.visible) {
            return;
          }

          // Don't damage NPCs that are already KO
          if (window.npcHostileSystem.isNPCKO(npcId)) {
            return;
          }

          if (!this.bodyOverlapsCone(npcSprite.body, playerX, playerY, direction, punchRange)) {
            return; // Outside cone
          }

          // Hit detected!
          // If NPC is not hostile, convert them to hostile
          if (!isHostile) {
            console.log(`💢 Player attacked non-hostile NPC ${npcId} - converting to hostile!`);
            window.npcHostileSystem.setNPCHostile(npcId, true);
            // NPC behavior system automatically detects hostile state changes

            // Emit specific event so handler NPCs (e.g. Agent 0x99) can react
            if (window.eventDispatcher) {
              window.eventDispatcher.emit(`npc_attacked:${npcId}`, { npcId, wasFriendly: true });
            }
          }

          // Damage the NPC (now hostile or was already hostile)
          this.applyDamage(npcId, punchDamage);
          hitCount++;
        });
      }
    }

    // Check for chairs in range and direction
    let chairsHit = 0;
    if (window.chairs && window.chairs.length > 0) {
      window.chairs.forEach(chair => {
        // Only kick swivel chairs with physics bodies
        if (!chair.isSwivelChair || !chair.body) {
          return;
        }

        if (!this.bodyOverlapsCone(chair.body, playerX, playerY, direction, punchRange)) {
          return; // Outside cone
        }

        // Hit landed! Kick the chair
        this.kickChair(chair);
        chairsHit++;
      });
    }

    if (hitCount > 0) {
      console.log(`Player punch hit ${hitCount} NPC(s)`);
    }
    if (chairsHit > 0) {
      console.log(`Player punch hit ${chairsHit} chair(s)`);
    }
    if (hitCount === 0 && chairsHit === 0) {
      console.log('Player punch missed');
    }
  }

  /**
   * Check if a target falls inside the player's punch cone.
   * The cone extends `range` px from the punch origin and spans ±45° around the
   * facing direction.  All 8 movement directions are supported.
   *
   * @param {number} originX  - Punch origin X (foot centre)
   * @param {number} originY  - Punch origin Y (foot centre)
   * @param {number} targetX  - Target X
   * @param {number} targetY  - Target Y
   * @param {string} direction - Player last direction (e.g. 'down', 'up-right')
   * @param {number} range    - Max reach in pixels
   * @returns {boolean}
   */
  isInCone(originX, originY, targetX, targetY, direction, range) {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const distSq = dx * dx + dy * dy;
    if (distSq > range * range) return false;

    // Facing angle in degrees (Phaser / canvas: right=0°, clockwise positive)
    const facingAngles = {
      'right':      0,
      'down-right': 45,
      'down':       90,
      'down-left':  135,
      'left':       180,
      'up-left':    225,
      'up':         270,
      'up-right':   315
    };

    const facingDeg = facingAngles[direction] ?? 90; // default: down
    const targetDeg = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;

    // Angular difference (shortest path around the circle)
    let diff = Math.abs(targetDeg - facingDeg);
    if (diff > 180) diff = 360 - diff;

    return diff <= 30; // ±30° half-angle = 60° total cone
  }

  /**
   * Check whether a Phaser Arcade physics body's bounding box overlaps the punch cone.
   * Samples the 4 corners and centre of the body AABB — if any sample falls inside
   * the cone (correct distance AND angle) the body counts as hit.
   *
   * Also returns true when the punch origin is inside the body itself (zero-distance
   * edge case where atan2 is unreliable).
   *
   * @param {Phaser.Physics.Arcade.Body} body
   * @param {number} originX  - Punch origin X (player foot centre)
   * @param {number} originY  - Punch origin Y (player foot centre)
   * @param {string} direction
   * @param {number} range
   * @returns {boolean}
   */
  bodyOverlapsCone(body, originX, originY, direction, range) {
    if (!body) return false;

    // If the punch origin is inside the body, always count as a hit
    if (originX >= body.left && originX <= body.right &&
        originY >= body.top  && originY <= body.bottom) {
      return true;
    }

    // Sample the 4 AABB corners + centre
    const cx = body.left + body.width  * 0.5;
    const cy = body.top  + body.height * 0.5;
    const samples = [
      { x: body.left,  y: body.top },
      { x: body.right, y: body.top },
      { x: body.left,  y: body.bottom },
      { x: body.right, y: body.bottom },
      { x: cx,         y: cy }
    ];

    return samples.some(p => this.isInCone(originX, originY, p.x, p.y, direction, range));
  }

  /**
   * Draw the punch hit area for debugging.
   * Shows a filled cone at the foot-centre origin for ~500 ms.
   *
   * @param {number} originX
   * @param {number} originY
   * @param {number} range
   * @param {string} direction
   */
  drawPunchHitbox(originX, originY, range, direction) {
    if (!this.scene) return;

    // Reuse or create the graphics layer
    if (!this.hitboxGraphics) {
      this.hitboxGraphics = this.scene.add.graphics();
      this.hitboxGraphics.setDepth(9999);
      this.hitboxGraphics.setScrollFactor(1);
    }
    this.hitboxGraphics.clear();

    const facingAngles = {
      'right':      0,
      'down-right': 45,
      'down':       90,
      'down-left':  135,
      'left':       180,
      'up-left':    225,
      'up':         270,
      'up-right':   315
    };

    const facingDeg = facingAngles[direction] ?? 90;
    const facingRad = facingDeg * (Math.PI / 180);
    const halfAngle = 30 * (Math.PI / 180); // ±30° cone
    const steps = 24;

    // --- Filled cone ---
    this.hitboxGraphics.fillStyle(0xff4400, 0.25);
    this.hitboxGraphics.beginPath();
    this.hitboxGraphics.moveTo(originX, originY);
    for (let i = 0; i <= steps; i++) {
      const a = (facingRad - halfAngle) + (i / steps) * halfAngle * 2;
      this.hitboxGraphics.lineTo(
        originX + Math.cos(a) * range,
        originY + Math.sin(a) * range
      );
    }
    this.hitboxGraphics.closePath();
    this.hitboxGraphics.fillPath();

    // --- Cone outline ---
    this.hitboxGraphics.lineStyle(2, 0xff2200, 0.9);
    this.hitboxGraphics.beginPath();
    this.hitboxGraphics.moveTo(originX, originY);
    for (let i = 0; i <= steps; i++) {
      const a = (facingRad - halfAngle) + (i / steps) * halfAngle * 2;
      this.hitboxGraphics.lineTo(
        originX + Math.cos(a) * range,
        originY + Math.sin(a) * range
      );
    }
    this.hitboxGraphics.closePath();
    this.hitboxGraphics.strokePath();

    // --- Origin dot ---
    this.hitboxGraphics.fillStyle(0xffff00, 1);
    this.hitboxGraphics.fillCircle(originX, originY, 4);

    // Auto-clear after 500 ms
    if (this._hitboxClearTimer) this._hitboxClearTimer.remove();
    this._hitboxClearTimer = this.scene.time.delayedCall(500, () => {
      if (this.hitboxGraphics) this.hitboxGraphics.clear();
    });
  }

  /**
   * Apply damage to NPC
   * @param {string|Object} npcIdOrNPC - NPC ID string or NPC object
   * @param {number} damage - Damage amount
   */
  applyDamage(npcIdOrNPC, damage) {
    if (!window.npcHostileSystem) return;

    // Get npcId
    let npcId;
    let npcSprite = null;
    
    if (typeof npcIdOrNPC === 'string') {
      npcId = npcIdOrNPC;
      // Find the sprite for this NPC
      if (window.rooms) {
        for (const roomId in window.rooms) {
          const room = window.rooms[roomId];
          if (!room.npcSprites) continue;
          for (const sprite of room.npcSprites) {
            if (sprite.npcId === npcId) {
              npcSprite = sprite;
              break;
            }
          }
          if (npcSprite) break;
        }
      }
    } else {
      npcId = npcIdOrNPC.id;
      npcSprite = npcIdOrNPC.sprite;
    }

    // Apply damage
    window.npcHostileSystem.damageNPC(npcId, damage);

    // Check if NPC is now KO (after damage)
    const isKO = window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npcId);

    // Play hit animation if available (only if not KO - death anim takes priority)
    if (npcSprite && !isKO) {
      this.playHitAnimation(npcSprite, npcId);
    }

    // Visual + audio feedback on hit
    if (npcSprite && window.spriteEffects) {
      window.spriteEffects.flashDamage(npcSprite);
    }
    if (!isKO && window.soundManager) {
      window.soundManager.play('hit_impact');
      // Play gender-matched grunt for the NPC being hit
      const npcData = window.npcManager?.getNPC(npcId);
      const isFemale = npcData?.spriteSheet?.startsWith('female_');
      const isHeavyHit = damage > 5;
      const gruntKey = isFemale
        ? (isHeavyHit ? 'grunt_female_heavy' : 'grunt_female_soft')
        : (isHeavyHit ? 'grunt_male_heavy'   : 'grunt_male_soft');
      window.soundManager.play(gruntKey);
    }

    // Damage numbers
    if (npcSprite && window.damageNumbers) {
      window.damageNumbers.show(npcSprite.x, npcSprite.y - 30, damage, 'damage');
    }

    // Knockback (only if NPC is not KO)
    if (npcSprite && window.player && !isKO) {
      applyKnockback(npcSprite, window.player.x, window.player.y);
    }

    // Screen shake (light)
    if (window.screenEffects) {
      window.screenEffects.shakeNPCHit();
    }

    console.log(`Dealt ${damage} damage to ${npcId}`);
  }

  /**
   * Play hit/taking-punch animation on NPC sprite
   * @param {Phaser.GameObjects.Sprite} sprite - The NPC sprite
   * @param {string} npcId - The NPC ID
   */
  playHitAnimation(sprite, npcId) {
    if (!sprite || !sprite.scene || !npcId) return;

    // Get NPC's current direction from behavior or animation
    let direction = 'down';
    
    if (window.npcBehaviorManager) {
      const behavior = window.npcBehaviorManager.getBehavior(npcId);
      if (behavior && behavior.direction) {
        direction = behavior.direction;
      }
    }
    
    // If no behavior direction, try to extract from current animation
    if (!direction && sprite.anims && sprite.anims.currentAnim) {
      const animKey = sprite.anims.currentAnim.key;
      const parts = animKey.split('-');
      if (parts.length >= 3) {
        direction = parts[parts.length - 1];
      }
    }
    
    const hitAnimKey = `npc-${npcId}-hit-${direction}`;
    
    if (sprite.scene.anims.exists(hitAnimKey)) {
      sprite.play(hitAnimKey);
    }
  }

  /**
   * Apply kick velocity to chair
   * @param {Phaser.GameObjects.Sprite} chair - Chair sprite
   */
  kickChair(chair) {
    if (!chair || !chair.body || !window.player) {
      return;
    }

    // Calculate direction from player to chair
    const dx = chair.x - window.player.x;
    const dy = chair.y - window.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize the direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Apply a strong kick velocity
      const kickForce = 1200; // Pixels per second
      chair.body.setVelocity(dirX * kickForce, dirY * kickForce);

      // Trigger spin direction calculation for visual rotation
      if (window.calculateChairSpinDirection) {
        window.calculateChairSpinDirection(window.player, chair);
      }

      // Visual feedback - flash the chair
      if (window.spriteEffects) {
        window.spriteEffects.flashHit(chair);
      }

      // Light screen shake
      if (window.screenEffects) {
        window.screenEffects.shake(2, 150);
      }

      console.log('CHAIR KICKED', {
        chairName: chair.name,
        velocity: { x: dirX * kickForce, y: dirY * kickForce }
      });
    }
  }
}

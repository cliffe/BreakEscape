/**
 * Player Combat System
 * Handles player punch attacks on hostile NPCs
 */

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { applyKnockback } from '../utils/knockback.js';
import { wallClearFrom, playerFeet } from './interaction-walls.js';
import { nextComboStep, PUNCH_COMBO, directionToward, blockedDamage } from './fight-styles.js';

/**
 * True when the scenario turns player attacks off (top-level
 * "disableAttacks": true, e.g. the SIS serious games). The player stays in
 * interact mode: no punching, no mode toggle, no combat tutorial step.
 */
export function attacksDisabled() {
  return window.gameScenario?.disableAttacks === true;
}

/** Half-angle of the punch cone in degrees (combat-config.js, 7.1h). */
export function punchConeHalfAngle() {
  const a = COMBAT_CONFIG.player.punchConeHalfAngle;
  return (typeof a === 'number' && a > 0 && a <= 90) ? a : 40;
}

const CLICK_KICK_SLACK = 16; // px of extra reach for a chair the player clicked

export class PlayerCombat {
  constructor(scene) {
    this.scene = scene;
    this.lastPunchTime = 0;
    this.isPunching = false;
    // The punch being thrown: 'jab' or 'cross' (COMBAT_CONFIG.interactionModes)
    this.currentPunch = 'jab';
    // The combo (fight-styles.js PUNCH_COMBO): the step last thrown, when it
    // ended, and a press made mid-punch that is thrown as soon as it can be
    this.comboStep = -1;
    this.lastPunchEndedAt = 0;
    this.queuedPress = false;
    this.isBlocking = false;

    console.log('✅ Player combat system initialized');
  }

  /**
   * Click and tap always move or interact now; the old toggle's modes are
   * gone. Kept so older callers and the test bridge still get an answer.
   * @returns {string}
   */
  getInteractionMode() {
    return 'interact';
  }

  /** The settings (damage, cooldown, animation) of the punch being thrown. */
  getCurrentModeConfig() {
    return COMBAT_CONFIG.interactionModes[this.currentPunch] || COMBAT_CONFIG.interactionModes.jab;
  }

  /**
   * Check if the player can throw a punch of this kind now (cooldown)
   * @param {string} [kind] - 'jab' or 'cross'
   * @returns {boolean}
   */
  canPunch() {
    if (attacksDisabled() || this.isBlocking) {
      return false;
    }
    return Date.now() - this.lastPunchTime >= this.recoveryAfterLastPunch();
  }

  /**
   * A punch's cooldown is the recovery after it: a jab is quickly followed,
   * a cross holds the player for longer. (Measuring the next punch's own
   * cooldown made the cross wait so long the combo window closed first.)
   */
  recoveryAfterLastPunch() {
    if (!this.lastPunchTime) return 0;
    const modeConfig = COMBAT_CONFIG.interactionModes[this.currentPunch] || COMBAT_CONFIG.interactionModes.jab;
    return modeConfig.cooldown || COMBAT_CONFIG.player.punchCooldown;
  }

  /**
   * Fists stay down while a minigame or overlay is open (the title screen,
   * a conversation, the phone): click and tap don't reach the game then either.
   */
  fightingPaused() {
    return !!window.MinigameFramework?.currentMinigame || window.playerHealth?.isKO?.() === true;
  }

  /**
   * The punch button, F and right-click: throws the next punch of the combo
   * (jab, jab, cross for three presses in a row). A press while a punch is
   * still playing is kept and thrown when it ends, so quick presses aren't lost.
   * @param {{x:number, y:number}} [toward] - world point to face (right-click);
   *   without it the player turns to the nearest hostile in reach, if any
   * @returns {boolean} true if a punch was thrown or queued
   */
  attack(toward = null) {
    if (attacksDisabled() || this.isBlocking || !window.player) return false;
    if (this.fightingPaused()) return false;

    if (this.isPunching) {
      this.queuedPress = true;
      return true;
    }

    const step = nextComboStep(this.comboStep, Date.now() - this.lastPunchEndedAt);
    const kind = PUNCH_COMBO[step];
    if (!this.canPunch()) {
      this.queuedPress = true;
      this.scheduleQueuedPress();
      return true;
    }

    if (toward) {
      window.player.lastDirection = directionToward(toward.x - window.player.x, toward.y - window.player.y);
      window.player.direction = window.player.lastDirection;
    } else {
      this.faceNearestHostile(COMBAT_CONFIG.player.punchRange + 32);
    }

    this.comboStep = step;
    const thrown = this.punch(kind);
    if (thrown && window.getTutorialManager) window.getTutorialManager().notifyAttackedInCombatMode();
    return thrown;
  }

  /** Throw a queued press once the cooldown of the next punch allows it. */
  scheduleQueuedPress() {
    if (this._queuedTimer) return;
    const wait = Math.max(0, this.recoveryAfterLastPunch() - (Date.now() - this.lastPunchTime));
    this._queuedTimer = this.scene.time.delayedCall(wait, () => {
      this._queuedTimer = null;
      if (this.queuedPress && !this.isPunching) {
        this.queuedPress = false;
        this.attack();
      }
    });
  }

  /** A punch finished (or was cut short): note it, then throw any queued press. */
  finishPunch() {
    this.isPunching = false;
    this.lastPunchEndedAt = Date.now();
    if (this.comboStep >= PUNCH_COMBO.length - 1) this.comboStep = -1; // cross ends the combo
    if (this.queuedPress) {
      this.scheduleQueuedPress();
    }
  }

  /**
   * The nearest visible, standing hostile NPC within `range` px of the player,
   * or null. Used to turn the player towards a fight on a punch or a block.
   */
  nearestHostile(range) {
    const player = window.player;
    if (!player || !window.rooms || !window.npcHostileSystem) return null;
    let best = null;
    let bestDist = range;
    for (const roomId in window.rooms) {
      for (const sprite of window.rooms[roomId]?.npcSprites || []) {
        if (!sprite?.npcId || !sprite.visible || sprite.destroyed) continue;
        if (!window.npcHostileSystem.isNPCHostile(sprite.npcId)) continue;
        if (window.npcHostileSystem.isNPCKO(sprite.npcId)) continue;
        const d = Math.hypot(sprite.x - player.x, sprite.y - player.y);
        if (d <= bestDist) {
          // Don't turn to face a hostile through a wall, or in another room
          if (!wallClearFrom(playerFeet(player), sprite, { combat: true })) continue;
          best = sprite;
          bestDist = d;
        }
      }
    }
    return best;
  }

  faceNearestHostile(range) {
    const target = this.nearestHostile(range);
    if (!target || !window.player) return false;
    const dir = directionToward(target.x - window.player.x, target.y - window.player.y);
    window.player.lastDirection = dir;
    window.player.direction = dir;
    return true;
  }

  /**
   * Raise the guard (Q held, or the block button held). The player stands in
   * guard, turned to the nearest hostile, and can't walk or punch until
   * endBlock(). Hits from the front do a fifth of their damage (npc-combat.js).
   */
  startBlock() {
    if (attacksDisabled() || this.isBlocking || !window.player) return false;
    if (this.fightingPaused()) return false;
    this.isBlocking = true;
    this.queuedPress = false;
    window.cancelClickToMove?.();
    window.player.body?.setVelocity(0, 0);
    window.player.isMoving = false;
    this.faceNearestHostile(COMBAT_CONFIG.block.autoFaceRange);
    this.showGuardPose();
    window.getTutorialManager?.()?.notifyBlocked?.();
    return true;
  }

  endBlock() {
    if (!this.isBlocking) return false;
    this.isBlocking = false;
    const player = window.player;
    if (player?.anims && !window.playerHealth?.isKO?.()) {
      const idleKey = `idle-${player.lastDirection || 'down'}`;
      if (this.scene.anims.exists(idleKey)) player.anims.play(idleKey, true);
    }
    return true;
  }

  /**
   * Hold the guard pose: the first frame of lead-jab (fists up, knees bent)
   * in the way the player faces. Called each frame while blocking, so a hit
   * from behind (which plays taking-punch) returns to guard afterwards.
   */
  showGuardPose() {
    const player = window.player;
    if (!player?.anims || player.destroyed) return;
    // A punch thrown just before the guard went up finishes (and lands) first
    if (this.isPunching) return;
    const current = player.anims.currentAnim?.key || '';
    if (player.anims.isPlaying && current.includes('taking-punch')) return;
    const jab = this.scene.anims.get(`lead-jab_${this.mapDirectionToCompass(player.lastDirection || 'down')}`);
    const frame = jab?.frames?.[0];
    if (!frame) return;
    if (player.anims.isPlaying) player.anims.stop();
    if (player.frame?.name !== frame.textureFrame || player.texture?.key !== frame.textureKey) {
      player.setTexture(frame.textureKey, frame.textureFrame);
    }
  }

  /**
   * Throw one punch of the given kind in the way the player faces.
   * Damage applies to all NPCs in punch range and facing direction.
   * @param {string} [kind] - 'jab' (default) or 'cross'
   */
  punch(kind = 'jab') {
    if (attacksDisabled()) {
      return false;
    }

    if (this.isPunching) {
      console.log('🥊 Punch blocked - already punching');
      return false;
    }

    if (!this.canPunch()) {
      console.log('🥊 Punch blocked - on cooldown or blocking');
      return false;
    }

    if (!window.player) {
      console.error('Player not found');
      return false;
    }

    this.currentPunch = COMBAT_CONFIG.interactionModes[kind] ? kind : 'jab';
    this.isPunching = true;
    this.lastPunchTime = Date.now();

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
   * After a punch, walk on if the player is still moving (click-to-move or a
   * held key), else stand idle. The movement code only starts the walk cycle
   * when movement starts or turns, so it won't restart it by itself.
   * @param {string} idleDirection - the way the punch was thrown
   */
  resumeMovementAnimation(idleDirection) {
    const player = window.player;
    if (!player?.anims || player.destroyed) return;
    if (player.isMoving) {
      const dir = player.direction || idleDirection;
      // Legacy sprites have no left walks; they flip the right one instead
      const walkKey = [`walk-${dir}`, `walk-${dir.replace('left', 'right')}`]
        .find(key => this.scene.anims.exists(key));
      if (walkKey) {
        player.anims.play(walkKey, true);
        player.lastDirection = dir;
        return;
      }
    }
    const idleKey = `idle-${idleDirection}`;
    if (this.scene.anims.exists(idleKey)) player.anims.play(idleKey, true);
  }

  /**
   * Play punch animation for the punch being thrown (lead-jab or cross-punch)
   */
  playPunchAnimation() {
    if (!window.player) return;

    const player = window.player;
    const direction = player.lastDirection || 'down';
    const compassDir = this.mapDirectionToCompass(direction);

    const modeConfig = this.getCurrentModeConfig();
    const animationBase = modeConfig.animationKey; // 'lead-jab' or 'cross-punch'
    const animKey = `${animationBase}_${compassDir}`;

    if (window.soundManager) {
      window.soundManager.play(animationBase === 'lead-jab' ? 'punch_swipe_jab' : 'punch_swipe_cross');
    }

    if (this.scene.anims.exists(animKey)) {
      player.anims.play(animKey, true);

      // Safety timeout to ensure flag is cleared even if animation is interrupted
      const safetyTimeout = this.scene.time.delayedCall(2000, () => {
        if (this.isPunching) {
          console.warn(`⚠️ Player punch animation timeout, clearing isPunching flag`);
          this.finishPunch();
        }
      });

      // Apply damage when the animation completes, then return to idle
      player.once('animationcomplete', (anim) => {
        if (safetyTimeout) {
          safetyTimeout.remove();
        }

        if (anim.key.includes('punch') || anim.key.includes('jab')) {
          this.checkForHits();
          this.finishPunch();
          if (!this.isBlocking) this.resumeMovementAnimation(direction);
        } else if (this.isPunching) {
          // Animation was different (interrupted), just clear the flag
          console.warn(`⚠️ Player punch interrupted - animation changed to: ${anim.key}`);
          this.finishPunch();
        }
      });
    } else {
      // Fallback: red tint, then damage after the usual punch duration
      console.log(`⚠️ No punch animation found (tried ${animKey}), using fallback (red tint)`);
      if (window.spriteEffects) {
        window.spriteEffects.applyAttackTint(player);
      }

      this.scene.time.delayedCall(COMBAT_CONFIG.player.punchAnimationDuration, () => {
        this.checkForHits();
        this.finishPunch();
        if (window.spriteEffects && player && !player.destroyed) {
          window.spriteEffects.clearAttackTint(player);
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
    const feet = playerFeet(window.player) || { x: playerX, y: playerY };

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

          // "koImmune": true NPCs can't be fought: the punch passes over them
          // without turning them hostile or emitting npc_attacked
          if (window.npcHostileSystem.isNPCKOImmune?.(npcId)) {
            return;
          }

          if (!this.bodyOverlapsCone(npcSprite.body, playerX, playerY, direction, punchRange)) {
            return; // Outside cone
          }

          // Nobody punches through a wall, or from behind a back wall into the room below
          if (!wallClearFrom(feet, npcSprite, { combat: true })) {
            return;
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

        const clicked = chair === this.clickedChair && Date.now() < this.clickedChairUntil;
        if (!this.bodyOverlapsCone(chair.body, playerX, playerY, direction, punchRange) &&
            !(clicked && this.nearBody(chair.body, playerX, playerY, punchRange + CLICK_KICK_SLACK))) {
          return; // Outside cone
        }

        if (!wallClearFrom(feet, chair, { combat: true })) {
          return; // another room, or a wall in the way
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
   * The cone extends `range` px from the punch origin and spans
   * ±COMBAT_CONFIG.player.punchConeHalfAngle (40°) around the
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

    return diff <= punchConeHalfAngle(); // ±40° by default (7.1h)
  }

  /** True when the point is within `range` px of the body's box (0 inside it). */
  nearBody(body, x, y, range) {
    if (!body) return false;
    const dx = Math.max(body.left - x, 0, x - body.right);
    const dy = Math.max(body.top - y, 0, y - body.bottom);
    return Math.hypot(dx, dy) <= range;
  }

  /**
   * A click on a chair in reach: face it (feet to its body, which sits well below
   * the sprite centre) and let the next punch land on it whatever the cone says.
   */
  aimAtChair(chair) {
    const player = window.player;
    const feet = playerFeet(player);
    if (!chair?.body || !feet) return;
    const bc = chair.body.center;
    const dir = directionToward(bc.x - feet.x, bc.y - feet.y);
    player.lastDirection = dir;
    player.direction = dir;
    this.clickedChair = chair;
    this.clickedChairUntil = Date.now() + 1500;
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
    const halfAngle = punchConeHalfAngle() * (Math.PI / 180); // same cone as isInCone
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

    // A guarded fighter (fight-styles.js) takes a fifth of the punch on its
    // guard and isn't pushed back; one that is armoured in its windup takes
    // the full punch but carries on with its swing
    const guarded = window.npcCombat?.isGuarding?.(npcId) === true;
    const armoured = !guarded && window.npcCombat?.isArmoured?.(npcId) === true;
    if (guarded) {
      damage = blockedDamage(damage, window.npcCombat.styleFor(npcId).guardDamageScale);
    }

    // Apply damage
    window.npcHostileSystem.damageNPC(npcId, damage);

    // Check if NPC is now KO (after damage)
    const isKO = window.npcHostileSystem && window.npcHostileSystem.isNPCKO(npcId);

    if (guarded && !isKO) {
      this.showBlockedHit(npcSprite, damage);
      console.log(`🛡️ ${npcId} blocked the punch: ${damage} damage got through`);
      return;
    }

    // Play hit animation if available (only if not KO - death anim takes
    // priority; not while armoured, which would cut its swing short)
    if (npcSprite && !isKO && !armoured) {
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

    // Knockback (only if NPC is not KO, nor armoured in its windup)
    if (npcSprite && window.player && !isKO && !armoured) {
      applyKnockback(npcSprite, window.player.x, window.player.y);
    }

    // Screen shake (light)
    if (window.screenEffects) {
      window.screenEffects.shakeNPCHit();
    }

    console.log(`Dealt ${damage} damage to ${npcId}`);
  }

  /**
   * A punch that landed on a guard: a dull knock, a grey number, a small
   * shake and no knockback. Used for NPC guards here and the player's own
   * block in npc-combat.js.
   * @param {Phaser.GameObjects.Sprite} sprite - the one who blocked
   * @param {number} damage - what got through
   */
  showBlockedHit(sprite, damage) {
    if (window.soundManager) window.soundManager.play('hit_impact', { volume: 0.3 });
    if (sprite && window.spriteEffects) window.spriteEffects.flashTint(sprite, 0xbbbbbb, 120);
    if (sprite && window.damageNumbers) window.damageNumbers.show(sprite.x, sprite.y - 30, damage, 'blocked');
    if (window.screenEffects) window.screenEffects.shake?.(1, 80);
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

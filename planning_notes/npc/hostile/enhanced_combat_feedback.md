# Enhanced Combat Feedback Implementation

## Overview

This document details the implementation of strong visual and audio feedback for combat actions, addressing the primary UX concern of clarity and responsiveness.

## Visual Feedback System

### 1. Damage Numbers

**File**: `/js/systems/damage-numbers.js` (NEW)

Floating damage numbers that appear when entities take damage:

```javascript
import { COMBAT_CONFIG } from '../config/combat-config.js';

class DamageNumberPool {
  constructor(scene, poolSize = 20) {
    this.scene = scene;
    this.pool = [];
    this.active = [];

    // Pre-create pool
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createDamageNumber());
    }
  }

  createDamageNumber() {
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setVisible(false);
    text.setDepth(1000); // Above everything
    return text;
  }

  show(x, y, damage, isCritical = false, isMiss = false) {
    // Get from pool or create new
    let text = this.pool.pop() || this.createDamageNumber();

    if (isMiss) {
      // Miss display
      text.setText('MISS');
      text.setColor('#888888');
      text.setScale(1);
    } else {
      // Damage number
      text.setText(`-${Math.floor(damage)}`);
      text.setColor(isCritical ? '#ff0000' : '#ffffff');
      text.setScale(isCritical ? 1.5 : 1);
    }

    text.setPosition(x - text.width / 2, y);
    text.setVisible(true);
    text.setAlpha(1);

    this.active.push(text);

    // Animate up and fade
    this.scene.tweens.add({
      targets: text,
      y: y - COMBAT_CONFIG.ui.damageNumberRise,
      alpha: 0,
      duration: COMBAT_CONFIG.ui.damageNumberDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.recycle(text);
      }
    });
  }

  recycle(text) {
    text.setVisible(false);
    const index = this.active.indexOf(text);
    if (index > -1) {
      this.active.splice(index, 1);
    }
    if (this.pool.length < 20) { // Max pool size
      this.pool.push(text);
    } else {
      text.destroy(); // Pool full, destroy excess
    }
  }

  destroy() {
    [...this.pool, ...this.active].forEach(text => text.destroy());
    this.pool = [];
    this.active = [];
  }
}

// Initialize
export function initDamageNumbers(scene) {
  const pool = new DamageNumberPool(scene);

  // Add to window for global access
  window.damageNumbers = {
    show: (x, y, damage, isCritical, isMiss) => {
      pool.show(x, y, damage, isCritical, isMiss);
    },
    destroy: () => pool.destroy()
  };

  return pool;
}
```

**Usage**:
```javascript
// When damage applied
window.damageNumbers?.show(npc.sprite.x, npc.sprite.y, 20, false, false);

// When attack misses
window.damageNumbers?.show(npc.sprite.x, npc.sprite.y, 0, false, true);
```

---

### 2. Screen Flash Effect

**File**: `/js/systems/screen-effects.js` (NEW)

Screen flash for player damage feedback:

```javascript
export function initScreenEffects(scene) {
  // Create overlay for flashes
  const overlay = scene.add.rectangle(
    0, 0,
    scene.cameras.main.width,
    scene.cameras.main.height,
    0xff0000, // Red
    0 // Initially invisible
  );
  overlay.setOrigin(0, 0);
  overlay.setDepth(999); // Below damage numbers, above game
  overlay.setScrollFactor(0); // Fixed to camera

  window.screenEffects = {
    flashDamage() {
      if (!COMBAT_CONFIG.feedback.enableScreenFlash) return;

      overlay.setAlpha(0.3);
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: COMBAT_CONFIG.ui.screenFlashDuration,
        ease: 'Cubic.easeOut'
      });
    },

    flashHeal() {
      overlay.fillColor = 0x00ff00; // Green
      overlay.setAlpha(0.2);
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          overlay.fillColor = 0xff0000; // Back to red
        }
      });
    },

    flashWarning() {
      overlay.fillColor = 0xffaa00; // Orange
      overlay.setAlpha(0.2);
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          overlay.fillColor = 0xff0000; // Back to red
        }
      });
    }
  };

  return window.screenEffects;
}
```

**Usage**:
```javascript
// When player takes damage
window.screenEffects?.flashDamage();

// When player heals
window.screenEffects?.flashHeal();

// When hostile NPC attacks (wind-up)
window.screenEffects?.flashWarning();
```

---

### 3. Screen Shake Effect

**File**: `/js/systems/screen-effects.js` (ADD TO ABOVE)

Add to the same file:

```javascript
// Add to window.screenEffects object
window.screenEffects.shake = function(intensity = null) {
  if (!COMBAT_CONFIG.feedback.enableScreenShake) return;

  const shakeAmount = intensity || COMBAT_CONFIG.ui.screenShakeIntensity;

  scene.cameras.main.shake(100, shakeAmount / 1000); // Duration ms, intensity 0-1
};

// Shake with different intensities
window.screenEffects.shakeLight = function() {
  this.shake(2);
};

window.screenEffects.shakeMedium = function() {
  this.shake(4);
};

window.screenEffects.shakeHeavy = function() {
  this.shake(6);
};
```

**Usage**:
```javascript
// Light damage
window.screenEffects?.shakeLight();

// Medium damage
window.screenEffects?.shakeMedium();

// Heavy damage / KO
window.screenEffects?.shakeHeavy();
```

---

### 4. Sprite Flash Effects

**File**: `/js/systems/sprite-effects.js` (NEW)

Reusable sprite visual effects:

```javascript
export function flashSprite(sprite, color = 0xffffff, duration = 100) {
  if (!sprite) return;

  const originalTint = sprite.tintTopLeft;

  sprite.setTint(color);

  sprite.scene.time.delayedCall(duration, () => {
    sprite.clearTint();
    if (originalTint !== 0xffffff) {
      sprite.setTint(originalTint);
    }
  });
}

export function flashSpriteRepeat(sprite, color = 0xff0000, times = 3, duration = 100) {
  if (!sprite) return;

  let count = 0;
  const interval = sprite.scene.time.addEvent({
    delay: duration * 2,
    callback: () => {
      flashSprite(sprite, color, duration);
      count++;
      if (count >= times) {
        interval.destroy();
      }
    },
    repeat: times - 1
  });
}

export function shakeSprite(sprite, intensity = 5, duration = 100) {
  if (!sprite) return;

  const originalX = sprite.x;
  const originalY = sprite.y;

  sprite.scene.tweens.add({
    targets: sprite,
    x: originalX + Phaser.Math.Between(-intensity, intensity),
    y: originalY + Phaser.Math.Between(-intensity, intensity),
    duration: duration / 4,
    yoyo: true,
    repeat: 3,
    onComplete: () => {
      sprite.setPosition(originalX, originalY);
    }
  });
}
```

**Usage**:
```javascript
import { flashSprite, shakeSprite } from './sprite-effects.js';

// When NPC hit
flashSprite(npc.sprite, 0xffffff, 100);

// When player hit
flashSprite(window.player, 0xff0000, 300);

// When NPC KO'd
flashSpriteRepeat(npc.sprite, 0x666666, 3, 150);
```

---

### 5. Attack Telegraph Visuals

**File**: `/js/systems/attack-telegraph.js` (NEW)

Visual indicators for NPC attacks:

```javascript
export class AttackTelegraph {
  constructor(scene, npc) {
    this.scene = scene;
    this.npc = npc;

    // Create exclamation mark
    this.icon = scene.add.text(0, 0, '!', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 3
    });
    this.icon.setOrigin(0.5, 1);
    this.icon.setVisible(false);
    this.icon.setDepth(100);

    // Create attack range indicator
    this.rangeCircle = scene.add.circle(0, 0, 50, 0xff0000, 0.2);
    this.rangeCircle.setStrokeStyle(2, 0xff0000, 0.8);
    this.rangeCircle.setVisible(false);
    this.rangeCircle.setDepth(1);
  }

  show() {
    this.updatePosition();
    this.icon.setVisible(true);
    this.rangeCircle.setVisible(true);

    // Pulse animation
    this.scene.tweens.add({
      targets: this.icon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: -1 // Infinite while showing
    });

    // Range circle expand
    this.scene.tweens.add({
      targets: this.rangeCircle,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.4,
      duration: 250,
      yoyo: true,
      repeat: -1
    });
  }

  hide() {
    this.icon.setVisible(false);
    this.rangeCircle.setVisible(false);
    this.scene.tweens.killTweensOf(this.icon);
    this.scene.tweens.killTweensOf(this.rangeCircle);
    this.icon.setScale(1);
    this.rangeCircle.setScale(1);
  }

  updatePosition() {
    if (this.npc.sprite) {
      const x = this.npc.sprite.x;
      const y = this.npc.sprite.y - 50; // Above NPC

      this.icon.setPosition(x, y);
      this.rangeCircle.setPosition(this.npc.sprite.x, this.npc.sprite.y);
    }
  }

  destroy() {
    this.icon.destroy();
    this.rangeCircle.destroy();
  }
}

// Create for NPC
export function createAttackTelegraph(scene, npc) {
  return new AttackTelegraph(scene, npc);
}
```

**Usage**:
```javascript
// In NPC hostile state initialization
npc.attackTelegraph = createAttackTelegraph(scene, npc);

// When NPC begins attack wind-up
npc.attackTelegraph.show();

// During wind-up, update position
npc.attackTelegraph.updatePosition();

// When attack executes or cancelled
npc.attackTelegraph.hide();
```

---

## Audio Feedback System

### 6. Sound Effect Manager

**File**: `/js/systems/combat-sounds.js` (NEW)

Manage combat sound effects:

```javascript
export class CombatSounds {
  constructor(scene) {
    this.scene = scene;
    this.enabled = COMBAT_CONFIG.feedback.enableSounds;

    // Preload sound effects (assuming they're loaded in scene preload)
    this.sounds = {
      playerPunch: null,
      npcPunch: null,
      hit: null,
      miss: null,
      playerHurt: null,
      playerKO: null,
      npcKO: null,
      warning: null
    };
  }

  init() {
    // Load or reference sounds
    // Assuming sounds are already loaded in scene
    try {
      this.sounds.playerPunch = this.scene.sound.add('punch');
      this.sounds.npcPunch = this.scene.sound.add('punch');
      this.sounds.hit = this.scene.sound.add('hit');
      this.sounds.miss = this.scene.sound.add('whoosh');
      this.sounds.playerHurt = this.scene.sound.add('hurt');
      this.sounds.playerKO = this.scene.sound.add('ko');
      this.sounds.npcKO = this.scene.sound.add('ko');
      this.sounds.warning = this.scene.sound.add('warning');
    } catch (e) {
      console.warn('Some combat sounds not loaded:', e);
    }
  }

  playPlayerPunch() {
    if (this.enabled && this.sounds.playerPunch) {
      this.sounds.playerPunch.play({ volume: 0.5 });
    }
  }

  playNPCPunch() {
    if (this.enabled && this.sounds.npcPunch) {
      this.sounds.npcPunch.play({ volume: 0.5 });
    }
  }

  playHit() {
    if (this.enabled && this.sounds.hit) {
      this.sounds.hit.play({ volume: 0.6 });
    }
  }

  playMiss() {
    if (this.enabled && this.sounds.miss) {
      this.sounds.miss.play({ volume: 0.3 });
    }
  }

  playPlayerHurt() {
    if (this.enabled && this.sounds.playerHurt) {
      this.sounds.playerHurt.play({ volume: 0.7 });
    }
  }

  playPlayerKO() {
    if (this.enabled && this.sounds.playerKO) {
      this.sounds.playerKO.play({ volume: 0.8 });
    }
  }

  playNPCKO() {
    if (this.enabled && this.sounds.npcKO) {
      this.sounds.npcKO.play({ volume: 0.6 });
    }
  }

  playWarning() {
    if (this.enabled && this.sounds.warning) {
      this.sounds.warning.play({ volume: 0.5 });
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export function initCombatSounds(scene) {
  const sounds = new CombatSounds(scene);
  sounds.init();

  window.combatSounds = sounds;

  return sounds;
}
```

**Sound Asset Loading** (in scene preload):
```javascript
// Add to scene preload() method
preload() {
  // Placeholder sounds (replace with actual assets)
  // You can use free sound effects or generate placeholder audio
  this.load.audio('punch', 'assets/sounds/punch.mp3');
  this.load.audio('hit', 'assets/sounds/hit.mp3');
  this.load.audio('whoosh', 'assets/sounds/whoosh.mp3');
  this.load.audio('hurt', 'assets/sounds/hurt.mp3');
  this.load.audio('ko', 'assets/sounds/ko.mp3');
  this.load.audio('warning', 'assets/sounds/warning.mp3');
}
```

**Note**: For MVP, sound effects can be skipped or use placeholder sounds. The system is built to gracefully handle missing sounds.

---

## Integration into Combat Systems

### 7. Enhanced Player Combat

**Update**: `/js/systems/player-combat.js`

Add feedback to player punching:

```javascript
export async function playerPunch(targetNPC) {
  if (!canPlayerPunch()) return;

  // Play punch sound
  window.combatSounds?.playPlayerPunch();

  // Get direction
  const direction = getPlayerFacingDirection();

  // Play punch animation
  await playPlayerPunchAnimation(scene, player, direction);

  // Check if NPC still in range
  const distance = Phaser.Math.Distance.Between(
    window.player.x, window.player.y,
    targetNPC.sprite.x, targetNPC.sprite.y
  );

  if (distance <= COMBAT_CONFIG.player.punchRange) {
    // HIT
    const damage = COMBAT_CONFIG.player.punchDamage;

    window.combatSounds?.playHit();
    window.npcHostileSystem.damageNPC(targetNPC.id, damage);

    // Visual feedback
    flashSprite(targetNPC.sprite, 0xffffff, 100);
    shakeSprite(targetNPC.sprite, 5, 100);
    window.damageNumbers?.show(
      targetNPC.sprite.x,
      targetNPC.sprite.y - 20,
      damage,
      false,
      false
    );
  } else {
    // MISS
    window.combatSounds?.playMiss();
    window.damageNumbers?.show(
      targetNPC.sprite.x,
      targetNPC.sprite.y - 20,
      0,
      false,
      true
    );
  }

  // Start cooldown
  startPunchCooldown();
}
```

---

### 8. Enhanced NPC Combat

**Update**: `/js/systems/npc-combat.js`

Add feedback to NPC attacking:

```javascript
export async function npcAttack(npcId, npc) {
  const state = window.npcHostileSystem.getNPCHostileState(npcId);
  if (!state) return;

  // Show attack telegraph
  if (npc.attackTelegraph) {
    npc.attackTelegraph.show();
  }

  // Play warning
  window.combatSounds?.playWarning();
  window.screenEffects?.flashWarning();

  // Wind-up delay (gives player time to react)
  await new Promise(resolve =>
    setTimeout(resolve, COMBAT_CONFIG.npc.attackWindupDuration)
  );

  // Hide telegraph
  if (npc.attackTelegraph) {
    npc.attackTelegraph.hide();
  }

  // Play attack sound
  window.combatSounds?.playNPCPunch();

  // Play attack animation
  const direction = getNPCFacingDirection(npc);
  await playNPCPunchAnimation(scene, npc, direction);

  // Check if player still in range
  const playerPos = { x: window.player.x, y: window.player.y };
  const distance = Phaser.Math.Distance.Between(
    npc.sprite.x, npc.sprite.y,
    playerPos.x, playerPos.y
  );

  if (distance <= state.attackRange) {
    // HIT
    window.combatSounds?.playHit();
    window.combatSounds?.playPlayerHurt();

    window.playerHealth.damagePlayer(state.attackDamage);

    // Strong feedback for player damage
    window.screenEffects?.flashDamage();
    window.screenEffects?.shakeMedium();
    flashSprite(window.player, 0xff0000, 300);

    window.damageNumbers?.show(
      window.player.x,
      window.player.y - 30,
      state.attackDamage,
      false,
      false
    );
  } else {
    // MISS
    window.combatSounds?.playMiss();
  }

  // Update cooldown
  state.lastAttackTime = Date.now();
}
```

---

## Feedback Integration Checklist

When integrating feedback systems:

- [ ] Create damage numbers pool
- [ ] Create screen flash overlay
- [ ] Add screen shake support
- [ ] Create sprite flash functions
- [ ] Create attack telegraph graphics
- [ ] Load sound effects (or skip for MVP)
- [ ] Add feedback calls to player punch
- [ ] Add feedback calls to NPC attack
- [ ] Add feedback to damage functions
- [ ] Test all feedback types
- [ ] Add accessibility toggles for effects
- [ ] Verify performance impact acceptable

## Accessibility Settings

Add to game settings:

```javascript
const feedbackSettings = {
  screenFlash: true,
  screenShake: true,
  damageNumbers: true,
  sounds: true,
  attackTelegraphs: true
};

// Apply settings
COMBAT_CONFIG.feedback.enableScreenFlash = feedbackSettings.screenFlash;
COMBAT_CONFIG.feedback.enableScreenShake = feedbackSettings.screenShake;
COMBAT_CONFIG.feedback.enableDamageNumbers = feedbackSettings.damageNumbers;
COMBAT_CONFIG.feedback.enableSounds = feedbackSettings.sounds;

// Settings UI
/*
Combat Feedback Settings
[ ] Screen Flash Effects
[ ] Screen Shake
[ ] Damage Numbers
[ ] Sound Effects
[ ] Attack Warnings
*/
```

## Summary

Enhanced feedback makes combat feel responsive and clear. Priority order:

1. **Damage numbers** - Critical for understanding combat
2. **Screen flash** - Clear player damage feedback
3. **Sprite flash** - Visual hit confirmation
4. **Attack telegraph** - Fairness (player can react)
5. **Sound effects** - Polish (can be added later)
6. **Screen shake** - Polish (optional)

Implement in this order for best ROI on development time.

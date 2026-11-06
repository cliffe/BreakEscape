export const COMBAT_CONFIG = {
  // Interaction modes - defines how the player interacts with objects/NPCs
  interactionModes: {
    interact: {
      name: 'Interact',
      icon: 'hand_frames', // Frame 0 (open hand)
      frame: 0,
      canPunch: false,
      description: 'Normal interaction mode - talk, examine, use items'
    },
    jab: {
      name: 'Jab',
      icon: 'hand_frames', // Frame 6 (fist)
      frame: 6,
      canPunch: true,
      damage: 10,
      cooldown: 400,
      animationKey: 'lead-jab',
      description: 'Fast, weak punch attack'
    },
    cross: {
      name: 'Cross',
      icon: 'hand_frames', // Frame 11 (punch fist)
      frame: 11,
      canPunch: true,
      damage: 25,
      cooldown: 1100,
      animationKey: 'cross-punch',
      description: 'Slow, powerful punch attack'
    }
  },

  // The cycle order the old mode toggle used. The toggle is gone (click and
  // tap always move or interact; punches have their own button and keys),
  // but jab and cross above still give each punch its damage and cooldown.
  modeOrder: ['interact', 'jab', 'cross'],

  // Holding block (Q, or the on-screen block button): the player stands in
  // guard and can't walk or punch. A hit from the front does this share of
  // its damage and doesn't knock the player back.
  block: {
    damageScale: 0.2,
    coverHalfAngle: 70,  // degrees either side of facing that the guard covers
    autoFaceRange: 96    // on raising the guard, turn to a hostile this close
  },

  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 32,
    punchCooldown: 1000,
    // Half-angle of the punch cone either side of the facing direction (7.1h:
    // widened from 30°, which missed an attacker standing a little off-axis)
    punchConeHalfAngle: 40,
    punchAnimationDuration: 500,
    // Slow regen out of combat (player-regen.js): once nothing has hurt the
    // player for delayMs, +hpPerTick every tickMs, up to capFraction of max
    // HP. A scenario's top-level playerRegen overrides any of these, or turns
    // it off with false. Kept low so coffee and snacks still matter.
    regen: {
      delayMs: 10000,
      tickMs: 2000,
      hpPerTick: 1,
      capFraction: 0.5
    }
  },
  npc: {
    defaultMaxHP: 100,
    defaultPunchDamage: 10,
    defaultPunchRange: 32,
    defaultAttackCooldown: 2000,
    attackWindupDuration: 500,
    chaseSpeed: 120,
    chaseRange: 400,
    attackStopDistance: 32
  },
  ui: {
    maxHearts: 5,
    healthBarWidth: 60,
    healthBarHeight: 6,
    healthBarOffsetY: -40,
    damageNumberDuration: 1000,
    damageNumberRise: 50
  },
  feedback: {
    enableScreenFlash: true,
    enableScreenShake: true,
    enableDamageNumbers: true,
    enableSounds: true
  },

  validate() {
    console.log('✅ Combat config loaded');
    return true;
  }
};

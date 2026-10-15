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
      cooldown: 500,
      animationKey: 'lead-jab',
      description: 'Fast, weak punch attack'
    },
    cross: {
      name: 'Cross',
      icon: 'hand_frames', // Frame 11 (punch fist)
      frame: 11,
      canPunch: true,
      damage: 25,
      cooldown: 1500,
      animationKey: 'cross-punch',
      description: 'Slow, powerful punch attack'
    }
  },

  // Define the cycle order for the toggle button
  modeOrder: ['interact', 'jab', 'cross'],

  player: {
    maxHP: 100,
    punchDamage: 20,
    punchRange: 32,
    punchCooldown: 1000,
    punchAnimationDuration: 500
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

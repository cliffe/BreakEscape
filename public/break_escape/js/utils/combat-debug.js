/**
 * Debug utilities for combat system
 * Access via window.CombatDebug in browser console
 */

export function initCombatDebug() {
  window.CombatDebug = {
    // Player health testing
    testPlayerHealth() {
      console.log('=== Testing Player Health ===');
      if (!window.playerHealth) {
        console.error('Player health system not initialized');
        return;
      }

      console.log('Initial HP:', window.playerHealth.getHP());
      window.playerHealth.damage(20);
      console.log('After 20 damage:', window.playerHealth.getHP());
      window.playerHealth.damage(50);
      console.log('After 50 more damage:', window.playerHealth.getHP());
      window.playerHealth.heal(30);
      console.log('After 30 heal:', window.playerHealth.getHP());
      window.playerHealth.reset();
      console.log('After reset:', window.playerHealth.getHP());
    },

    // NPC hostile testing
    testNPCHostile(npcId = 'security_guard') {
      console.log(`=== Testing NPC Hostile (${npcId}) ===`);
      if (!window.npcHostileSystem) {
        console.error('NPC hostile system not initialized');
        return;
      }

      window.npcHostileSystem.setNPCHostile(npcId, true);
      console.log('Is hostile:', window.npcHostileSystem.isNPCHostile(npcId));

      window.npcHostileSystem.damageNPC(npcId, 30);
      const state = window.npcHostileSystem.getState(npcId);
      console.log('NPC HP:', state.currentHP, '/', state.maxHP);
      console.log('Is KO:', state.isKO);
    },

    // Get player HP
    getPlayerHP() {
      if (!window.playerHealth) {
        console.error('Player health system not initialized');
        return null;
      }
      return window.playerHealth.getHP();
    },

    // Set player HP
    setPlayerHP(hp) {
      if (!window.playerHealth) {
        console.error('Player health system not initialized');
        return;
      }
      const current = window.playerHealth.getHP();
      const delta = hp - current;
      if (delta > 0) {
        window.playerHealth.heal(delta);
      } else if (delta < 0) {
        window.playerHealth.damage(-delta);
      }
      console.log(`Player HP set to ${hp}`);
    },

    // Make NPC hostile
    makeHostile(npcId) {
      if (!window.npcHostileSystem) {
        console.error('NPC hostile system not initialized');
        return;
      }
      window.npcHostileSystem.setNPCHostile(npcId, true);
      console.log(`${npcId} is now hostile`);
    },

    // Make NPC peaceful
    makePeaceful(npcId) {
      if (!window.npcHostileSystem) {
        console.error('NPC hostile system not initialized');
        return;
      }
      window.npcHostileSystem.setNPCHostile(npcId, false);
      console.log(`${npcId} is now peaceful`);
    },

    // Get NPC state
    getNPCState(npcId) {
      if (!window.npcHostileSystem) {
        console.error('NPC hostile system not initialized');
        return null;
      }
      return window.npcHostileSystem.getState(npcId);
    },

    // Damage NPC
    damageNPC(npcId, amount) {
      if (!window.npcHostileSystem) {
        console.error('NPC hostile system not initialized');
        return;
      }
      window.npcHostileSystem.damageNPC(npcId, amount);
      const state = window.npcHostileSystem.getState(npcId);
      console.log(`${npcId} HP: ${state.currentHP}/${state.maxHP}`);
    },

    // Show all systems status
    status() {
      console.log('=== Combat Systems Status ===');
      console.log('Player Health:', window.playerHealth ? '✅' : '❌');
      console.log('NPC Hostile System:', window.npcHostileSystem ? '✅' : '❌');
      console.log('Player Combat:', window.playerCombat ? '✅' : '❌');
      console.log('NPC Combat:', window.npcCombat ? '✅' : '❌');
      console.log('Event Dispatcher:', window.eventDispatcher ? '✅' : '❌');

      if (window.playerHealth) {
        console.log('Player HP:', window.playerHealth.getHP());
      }
    },

    // Run all tests
    runAll() {
      this.testPlayerHealth();
      console.log('');
      this.testNPCHostile();
      console.log('');
      this.status();
    }
  };

  console.log('✅ Combat debug utilities loaded');
  console.log('Use window.CombatDebug.runAll() to run all tests');
  console.log('Use window.CombatDebug.status() to check system status');
}

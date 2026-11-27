# Quick Testing Commands

Use these commands in the browser console (F12) to test NPC interactions.

## 1. Verify System Initialization

```javascript
// Check if everything is loaded
console.log('✅ System Status:');
console.log('  NPCManager:', window.npcManager ? '✓' : '✗');
console.log('  Player:', window.player ? '✓' : '✗');
console.log('  MinigameFramework:', window.MinigameFramework ? '✓' : '✗');
console.log('  checkNPCProximity:', window.checkNPCProximity ? '✓' : '✗');
console.log('  tryInteractWithNearest:', window.tryInteractWithNearest ? '✓' : '✗');
```

## 2. List All NPCs

```javascript
console.log('NPCs Registered:');
window.npcManager.npcs.forEach((npc, id) => {
  console.log(`  - ${npc.displayName} (${id})`);
  console.log(`    Type: ${npc.npcType}, Room: ${npc.roomId}`);
  if (npc._sprite) {
    console.log(`    Sprite: YES at (${npc._sprite.x}, ${npc._sprite.y})`);
  }
});
console.log(`Total: ${window.npcManager.npcs.size} NPCs`);
```

## 3. Get Current Player Position

```javascript
const p = window.player;
console.log(`Player at: (${p.x}, ${p.y}), Facing: ${p.direction}`);
```

## 4. Check Distance to All NPCs

```javascript
const p = window.player;
console.log('Distances to NPCs:');
window.npcManager.npcs.forEach((npc, id) => {
  if (npc._sprite) {
    const dx = npc._sprite.x - p.x;
    const dy = npc._sprite.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const inRange = distance <= 64 ? '✓ IN RANGE' : '✗ out of range';
    console.log(`  - ${npc.displayName}: ${distance.toFixed(0)}px ${inRange}`);
  }
});
```

## 5. Manually Run Proximity Check

```javascript
console.log('Running proximity check...');
window.checkNPCProximity();
const prompt = document.getElementById('npc-interaction-prompt');
if (prompt) {
  console.log('✓ Prompt created:', prompt.querySelector('.prompt-text').textContent);
} else {
  console.log('✗ No prompt created');
}
```

## 6. Check Current Interaction Prompt

```javascript
const prompt = document.getElementById('npc-interaction-prompt');
if (prompt) {
  console.log('Current Prompt:');
  console.log(`  NPC ID: ${prompt.dataset.npcId}`);
  console.log(`  Text: ${prompt.querySelector('.prompt-text').textContent}`);
  console.log(`  Element ID: ${prompt.id}`);
} else {
  console.log('No prompt currently visible');
}
```

## 7. Verify E-Key Handler is Connected

```javascript
const npc = Array.from(window.npcManager.npcs.values())[0];
if (npc) {
  console.log(`Testing with NPC: ${npc.displayName}`);
  console.log('Creating prompt...');
  window.updateNPCInteractionPrompt(npc);
  console.log('Now press E key...');
  console.log('(Or run: window.tryInteractWithNearest())');
}
```

## 8. Manually Trigger Interaction (Simulate E-Key Press)

```javascript
console.log('Simulating E-key press...');
window.tryInteractWithNearest();
// Watch console for "🎭 Interacting with NPC:" message
```

## 9. Check MinigameFramework Registration

```javascript
console.log('Registered Minigames:');
window.MinigameFramework.scenes.forEach((scene) => {
  console.log(`  - ${scene.name}`);
});
console.log('Looking for:', window.MinigameFramework.scenes.some(s => s.name === 'person-chat') ? '✓ person-chat found' : '✗ person-chat NOT found');
```

## 10. Manually Start Conversation

```javascript
const npc = window.npcManager.getNPC('test_npc_front');
if (npc) {
  console.log(`Starting conversation with ${npc.displayName}...`);
  window.MinigameFramework.startMinigame('person-chat', {
    npcId: npc.id,
    title: npc.displayName
  });
} else {
  console.log('NPC not found');
}
```

## 11. Full Interaction Test (All Steps)

```javascript
// Step 1: Verify system
console.log('=== FULL INTERACTION TEST ===\n1. Checking system...');
if (!window.npcManager || !window.player) {
  console.log('❌ System not ready. Load game first.');
} else {
  console.log('✓ System ready\n');
  
  // Step 2: Get first NPC
  const npcs = Array.from(window.npcManager.npcs.values());
  if (npcs.length === 0) {
    console.log('❌ No NPCs registered');
  } else {
    const npc = npcs[0];
    console.log(`2. Found NPC: ${npc.displayName}`);
    
    // Step 3: Check distance
    const dx = npc._sprite.x - window.player.x;
    const dy = npc._sprite.y - window.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    console.log(`3. Distance: ${distance.toFixed(0)}px ${distance <= 64 ? '✓ IN RANGE' : '✗ OUT OF RANGE'}`);
    
    // Step 4: Test proximity check
    console.log('4. Running proximity check...');
    window.checkNPCProximity();
    const prompt = document.getElementById('npc-interaction-prompt');
    console.log(`   Prompt: ${prompt ? '✓ created' : '✗ not created'}`);
    
    // Step 5: Test E-key
    console.log('5. Simulating E-key press...');
    window.tryInteractWithNearest();
    
    console.log('\n✓ Test complete. Watch for conversation to open.');
  }
}
```

## 12. Debug Map Iteration

```javascript
// Verify the fix is working
console.log('Testing Map iteration (the fix):');

// Get the npcs Map
const npcMap = window.npcManager.npcs;

// ❌ Show what was broken
console.log('\n❌ Object.entries() on Map:');
console.log('  Result:', Object.entries(npcMap));
console.log('  Count:', Object.entries(npcMap).length);

// ✅ Show the fix
console.log('\n✓ .forEach() on Map:');
console.log('  Count:', npcMap.size);
let count = 0;
npcMap.forEach(npc => {
  console.log(`  - ${npc.displayName}`);
  count++;
});
console.log(`  Total: ${count}`);
```

## 13. Performance Check

```javascript
// Measure proximity check performance
console.log('Performance Test: checkNPCProximity()');

const iterations = 100;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  window.checkNPCProximity();
}
const elapsed = performance.now() - start;
const avgMs = (elapsed / iterations).toFixed(3);

console.log(`${iterations} iterations: ${elapsed.toFixed(2)}ms`);
console.log(`Average: ${avgMs}ms per call`);
console.log(avgMs < 1 ? '✓ Good performance' : '⚠️ Slow performance');
```

## 14. Clear and Reset

```javascript
// Remove all prompts and reset state
console.log('Clearing NPC interaction state...');
document.getElementById('npc-interaction-prompt')?.remove();
console.log('✓ Prompt cleared');

// Restart proximity check
window.checkNPCProximity();
console.log('✓ Proximity check restarted');
```

## 15. Show All Debug Info

```javascript
console.log('=== COMPLETE DEBUG INFO ===\n');

console.log('1. SYSTEM');
console.log(`  npcManager: ${window.npcManager ? '✓' : '✗'}`);
console.log(`  player: ${window.player ? '✓' : '✗'}`);
console.log(`  MinigameFramework: ${window.MinigameFramework ? '✓' : '✗'}`);

console.log('\n2. NPCs');
console.log(`  Count: ${window.npcManager?.npcs.size || 0}`);
window.npcManager?.npcs.forEach(npc => {
  console.log(`  - ${npc.displayName} (${npc.npcType})`);
});

console.log('\n3. PLAYER');
const p = window.player;
console.log(`  Position: (${p.x}, ${p.y})`);
console.log(`  Direction: ${p.direction}`);

console.log('\n4. PROMPT');
const prompt = document.getElementById('npc-interaction-prompt');
console.log(`  Visible: ${prompt ? '✓' : '✗'}`);
if (prompt) {
  console.log(`  NPC ID: ${prompt.dataset.npcId}`);
  console.log(`  Text: ${prompt.querySelector('.prompt-text')?.textContent}`);
}

console.log('\n5. HANDLERS');
console.log(`  E-key: ${window.tryInteractWithNearest ? '✓' : '✗'}`);
console.log(`  Proximity: ${window.checkNPCProximity ? '✓' : '✗'}`);
console.log(`  Prompt update: ${window.updateNPCInteractionPrompt ? '✓' : '✗'}`);

console.log('\n=== END DEBUG INFO ===');
```

---

## Copy-Paste Quickstarts

### Just loaded the game?
```javascript
// Copy and paste this entire block
console.clear();
console.log('Checking system...');
console.log('NPCs:', window.npcManager.npcs.size);
window.npcManager.npcs.forEach(npc => console.log(`  - ${npc.displayName}`));
console.log('Player position:', window.player.x, window.player.y);
console.log('\nWalk near an NPC, then run proximity check:');
console.log('window.checkNPCProximity()');
```

### Prompt not showing?
```javascript
// Copy and paste this entire block
console.clear();
const npcs = Array.from(window.npcManager.npcs.values());
console.log('NPCs found:', npcs.length);
if (npcs.length > 0) {
  const npc = npcs[0];
  console.log(`Testing with: ${npc.displayName}`);
  console.log('Proximity:', Math.sqrt(
    Math.pow(npc._sprite.x - window.player.x, 2) +
    Math.pow(npc._sprite.y - window.player.y, 2)
  ).toFixed(0), 'px');
  window.checkNPCProximity();
  console.log('Prompt:', document.getElementById('npc-interaction-prompt') ? 'Created' : 'Not created');
}
```

### E-key not working?
```javascript
// Copy and paste this entire block
console.clear();
console.log('Testing E-key...');
const prompt = document.getElementById('npc-interaction-prompt');
if (!prompt) {
  console.log('No prompt visible. Create one first.');
  const npc = Array.from(window.npcManager.npcs.values())[0];
  if (npc) window.updateNPCInteractionPrompt(npc);
} else {
  console.log('Prompt found. Simulating E-key...');
  window.tryInteractWithNearest();
}
```

---

**Tip:** Paste these one at a time and watch the console output carefully!

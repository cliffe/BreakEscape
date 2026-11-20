# NPC Interaction Debugging Guide

## Issue: Prompt Shows But E-Key Doesn't Trigger Conversation

### Root Cause Fixed ✅
The `checkNPCProximity()` function was using `Object.entries()` on a `Map` object, which doesn't work.

**Fixed:** Changed to use `.forEach()` method on the Map directly.

```javascript
// BEFORE (❌ doesn't work on Map)
Object.entries(window.npcManager.npcs).forEach(([npcId, npc]) => {

// AFTER (✅ works on Map)
window.npcManager.npcs.forEach((npc) => {
```

## Testing Checklist

### Step 1: Verify NPC Proximity Detection
Open browser console and run:

```javascript
// Check if npcManager is initialized
console.log('NPC Manager:', window.npcManager);
console.log('NPCs registered:', window.npcManager.npcs.size);

// List all NPCs
window.npcManager.npcs.forEach((npc, id) => {
  console.log(`NPC: ${id}`, npc);
  console.log(`  - Display Name: ${npc.displayName}`);
  console.log(`  - Type: ${npc.npcType}`);
  console.log(`  - Sprite: ${npc._sprite ? 'Yes' : 'No'}`);
  if (npc._sprite) {
    console.log(`    - Position: (${npc._sprite.x}, ${npc._sprite.y})`);
    console.log(`    - Active: ${npc._sprite.active}`);
  }
});
```

Expected output:
```
NPC Manager: NPCManager {...}
NPCs registered: 2
NPC: test_npc_front
  - Display Name: Front NPC
  - Type: person
  - Sprite: Yes
    - Position: (160, 96)
    - Active: true
NPC: test_npc_back
  - Display Name: Back NPC
  - Type: person
  - Sprite: Yes
    - Position: (192, 256)
    - Active: true
```

### Step 2: Check Proximity Calculation
Move player within 64px of an NPC and check console for messages:

```
✅ Created NPC interaction prompt: Front NPC (test_npc_front)
📝 Updated NPC prompt: Front NPC (test_npc_front)
```

If no prompt appears:
- Check player position: `console.log(window.player.x, window.player.y)`
- Check player distance calculation: `console.log(window.checkNPCProximity())`

### Step 3: Verify Prompt DOM Element
Check if prompt is in DOM:

```javascript
const prompt = document.getElementById('npc-interaction-prompt');
console.log('Prompt element:', prompt);
if (prompt) {
  console.log('  - NPC ID:', prompt.dataset.npcId);
  console.log('  - Text:', prompt.querySelector('.prompt-text').textContent);
}
```

Expected:
```
Prompt element: <div id="npc-interaction-prompt" class="npc-interaction-prompt">
  - NPC ID: test_npc_front
  - Text: Press E to talk to Front NPC
```

### Step 4: Test E-Key Handler
Manually trigger interaction:

```javascript
// This is what happens when E is pressed
window.tryInteractWithNearest();
```

Expected console output:
```
🎭 Interacting with NPC: Front NPC (test_npc_front)
🎭 Started conversation with Front NPC
```

If it fails with "NPC not found", the `dataset.npcId` may not be set correctly.

### Step 5: Check MinigameFramework
Verify minigame is registered:

```javascript
console.log('MinigameFramework:', window.MinigameFramework);
console.log('Registered scenes:', window.MinigameFramework.scenes);
```

Should include `person-chat` scene.

## Common Issues & Solutions

### Issue 1: No Prompt Appears
**Symptom:** Walk right next to NPC, no "Press E" prompt

**Diagnostics:**
```javascript
// Check if checkNPCProximity is being called
console.log('NPC proximity check:', window.checkNPCProximity ? 'Available' : 'Missing');

// Manually run it
window.checkNPCProximity();

// Check console for debug output:
// "📝 Updated NPC prompt: ..." should appear
```

**Solutions:**
1. Verify NPCs are registered: `window.npcManager.npcs.size > 0`
2. Verify NPCs have sprites: `npc._sprite` exists
3. Verify NPCs are `person` type: `npc.npcType === 'person'`
4. Check player is within 64px: Calculate distance manually

### Issue 2: Prompt Shows But E Doesn't Work
**Symptom:** "Press E to talk" appears, but pressing E does nothing

**Diagnostics:**
```javascript
// Check if E-key handler is set up
console.log('Handler available:', window.tryInteractWithNearest ? 'Yes' : 'No');

// Manually test
window.tryInteractWithNearest();

// Check console for output:
// "🎭 Interacting with NPC: ..." should appear
```

**Solutions:**
1. Check prompt dataset: `document.getElementById('npc-interaction-prompt').dataset.npcId`
2. Check NPC lookup: `window.npcManager.getNPC('test_npc_front')`
3. Check MinigameFramework: `window.MinigameFramework` must exist
4. Check E-key is bound: Look for "E" key handler in keydown listener

### Issue 3: Conversation Doesn't Start
**Symptom:** E works but minigame doesn't open

**Diagnostics:**
```javascript
// Check minigame is registered
window.MinigameFramework.scenes.forEach((scene) => {
  console.log(`Scene: ${scene.name}`);
});

// Try to start manually
window.MinigameFramework.startMinigame('person-chat', {
  npcId: 'test_npc_front',
  title: 'Front NPC'
});
```

**Solutions:**
1. Verify `person-chat` minigame is imported in `js/minigames/index.js`
2. Verify CSS is loaded: `<link rel="stylesheet" href="css/person-chat-minigame.css">`
3. Check Ink story file exists: `scenarios/ink/test-npc.json`

## Performance Monitoring

Monitor interaction system performance:

```javascript
// Measure proximity check time
const start = performance.now();
window.checkNPCProximity();
const elapsed = performance.now() - start;
console.log(`Proximity check took: ${elapsed.toFixed(2)}ms`);
// Should be < 1ms
```

## Expected Behavior Flowchart

```
Player walks near NPC
     ↓
[100ms interval] checkNPCProximity() runs
     ↓
Find closest person-type NPC within 64px
     ↓
Call updateNPCInteractionPrompt(npc)
     ↓
Create/update DOM prompt with "Press E to talk"
     ↓
Player presses E
     ↓
tryInteractWithNearest() called
     ↓
Check for npc-interaction-prompt in DOM
     ↓
Get npcId from prompt.dataset.npcId
     ↓
Call handleNPCInteraction(npc)
     ↓
Emit npc_interacted event
     ↓
Call MinigameFramework.startMinigame('person-chat', {...})
     ↓
PersonChatMinigame scene starts
     ↓
Display portraits, dialogue, choices
     ↓
Player completes conversation
     ↓
Game resumes
```

## Log Output Examples

### ✅ Everything Working Correctly
```
Creating 2 NPC sprites for room test_room
✅ NPC sprite created: test_npc_front at (160, 96)
✅ NPC collision created for test_npc_front
✅ NPC sprite created: test_npc_back at (192, 256)
✅ NPC collision created for test_npc_back

[Player walks near NPC]
✅ Created NPC interaction prompt: Front NPC (test_npc_front)

[Player presses E]
🎭 Interacting with NPC: Front NPC (test_npc_front)
🎭 Started conversation with Front NPC
```

### ❌ Proximity Not Working
```
Creating 2 NPC sprites for room test_room
✅ NPC sprite created: test_npc_front at (160, 96)
✅ NPC collision created for test_npc_front

[No prompt appears even when very close]
🔍 DEBUG: Object.entries() called on Map - returns empty!
```

### ❌ E-Key Not Working
```
✅ Created NPC interaction prompt: Front NPC (test_npc_front)

[Player presses E - no response]
Check: Is prompt in DOM? `document.getElementById('npc-interaction-prompt')`
Check: What's the npcId? `prompt.dataset.npcId`
Check: Is npcManager available? `window.npcManager`
```

## Quick Fixes

### Clear All Debug Output
```javascript
console.clear();
```

### Force Recalculate Proximity
```javascript
window.checkNPCProximity();
document.getElementById('npc-interaction-prompt')?.remove();
window.checkNPCProximity();
```

### Manually Start Conversation
```javascript
const npc = window.npcManager.getNPC('test_npc_front');
window.handleNPCInteraction(npc);
```

### Reset All State
```javascript
// Clear DOM
document.getElementById('npc-interaction-prompt')?.remove();

// Restart proximity check
window.checkNPCProximity();
```

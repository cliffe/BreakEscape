# Debugging Event Jump to Knot - Troubleshooting Guide

## What to Check

When an event fires during an active conversation and doesn't jump to the target knot:

### Step 1: Enable Console Logging

Open browser DevTools (F12) and check the Console tab. You should see detailed output.

### Step 2: Look for These Console Lines

#### If Jump is Detected:
```
🔍 Event jump check: {
  targetNpcId: "security_guard",
  currentConvNPCId: "security_guard",
  isConversationActive: true,
  activeMinigame: "PersonChatMinigame",
  isPersonChatActive: true,
  hasJumpToKnot: true
}
⚡ Active conversation detected with security_guard, attempting jump to knot: on_lockpick_used
🎯 PersonChatMinigame.jumpToKnot() - Starting jump to: on_lockpick_used
   Current NPC: security_guard
   Current knot before jump: hub
   Knot after jump: on_lockpick_used
   Hidden choice buttons
🎯 About to call showCurrentDialogue() to fetch new content...
✅ Successfully jumped to knot: on_lockpick_used
```

#### If Jump is NOT Detected:
```
🔍 Event jump check: {
  targetNpcId: "security_guard",
  currentConvNPCId: null,  // ← Problem: No active conversation!
  isConversationActive: false,
  ...
}
ℹ️ Not jumping: isConversationActive=false, isPersonChatActive=false
👤 Starting new person-chat conversation for NPC security_guard
```

## Common Issues and Fixes

### Issue 1: `currentConvNPCId` is null

**Problem:** `window.currentConversationNPCId` is not set when conversation starts

**Solution:** Check that PersonChatMinigame.start() is being called:
- Line 287 in person-chat-minigame.js should set: `window.currentConversationNPCId = this.npcId;`
- Check browser console to see if "🎭 PersonChatMinigame started" is logged

### Issue 2: `isPersonChatActive` is false

**Problem:** The active minigame is not a PersonChatMinigame

**Check:** 
```javascript
// In console:
window.MinigameFramework.currentMinigame?.constructor?.name
// Should output: "PersonChatMinigame"
```

**If not PersonChatMinigame:**
- Check what minigame is currently active
- Make sure you didn't switch to a different minigame (like lockpicking)

### Issue 3: Event is not firing at all

**Problem:** `lockpick_used_in_view` event never fires

**Check:**
1. Is NPC in line of sight of player during lockpicking?
   - Check NPC `los` config in scenario JSON
   - Verify `visualize: true` in `los` config to see the cone

2. Is eventMapping configured?
```json
"eventMappings": [
  {
    "eventPattern": "lockpick_used_in_view",
    "targetKnot": "on_lockpick_used",
    "conversationMode": "person-chat",
    "cooldown": 0
  }
]
```

3. Check if event is being listened:
```javascript
// In console:
window.npcManager.getNPC('security_guard')?.eventMappings
// Should show the lockpick_used_in_view mapping
```

### Issue 4: Jump happens but wrong dialogue shows

**Problem:** Jump is successful but dialogue shown is from wrong knot

**Check:**
1. Verify Ink JSON is compiled:
```bash
inklecate -ojv scenarios/ink/security-guard.json scenarios/ink/security-guard.ink
```

2. Check Ink file structure:
```ink
=== on_lockpick_used ===
# speaker:security_guard
Hey! What are you doing with that lock?
```
- Must start with `===` (three equals)
- Must have speaker tag
- Must have dialogue text

3. Clear browser cache:
- Ctrl+Shift+R (hard refresh)
- Or delete localStorage: `localStorage.clear()`

### Issue 5: `conversation.goToKnot()` returns false

**Problem:** The goToKnot call in PhoneChatConversation fails

**Check:** 
1. Story is loaded: `window.game.scene.scenes[0].conversation?.engine?.story` should exist
2. Knot name is valid: Check exact spelling in `on_lockpick_used` vs scenario JSON

3. In console, test manually:
```javascript
const minigame = window.MinigameFramework.currentMinigame;
const result = minigame.jumpToKnot('on_lockpick_used');
console.log('Jump result:', result);
```

## Test Steps

1. **Start test scenario:**
   - Open scenario_select.html
   - Select "npc-patrol-lockpick" scenario

2. **Start conversation:**
   - Click on security_guard NPC
   - Wait for person-chat to load

3. **Trigger event:**
   - Pick up lockpick item from the room
   - Move near security_guard while they're in view
   - Use lockpick on a locked door or object nearby

4. **Watch console:**
   - Should see jump detection logs
   - Should see dialogue from `on_lockpick_used` knot

5. **Expected result:**
   - Conversation jumps to: "Hey! What do you think you're doing with that lock?"
   - NPC gives choices to respond

## Console Commands for Manual Testing

```javascript
// Check if conversation is active
console.log('Active NPC:', window.currentConversationNPCId);
console.log('Is person-chat active:', window.MinigameFramework.currentMinigame?.constructor?.name);

// Check NPC event mappings
const npc = window.npcManager.getNPC('security_guard');
console.log('Event mappings:', npc?.eventMappings);

// Test jump manually
const minigame = window.MinigameFramework.currentMinigame;
console.log('Jump test:', minigame?.jumpToKnot('on_lockpick_used'));

// Check current story position
console.log('Current path:', minigame?.conversation?.engine?.story?.state?.currentPathString);

// Fire event manually
window.eventDispatcher?.emit('lockpick_used_in_view', {});
```

## If Still Not Working

1. Add more console.log statements in the actual code
2. Check browser DevTools Network tab to verify JSON files are loaded
3. Verify scenario JSON is valid JSON (no syntax errors)
4. Verify Ink file compiles without errors
5. Check that Ink tags are formatted correctly: `# speaker:npc_id` not `#speaker:npcid`

## Files to Check

- `scenarios/npc-patrol-lockpick.json` - Scenario with event mappings
- `scenarios/ink/security-guard.ink` - Ink file with target knot
- `scenarios/ink/security-guard.json` - Compiled Ink (auto-generated)
- `js/minigames/person-chat/person-chat-minigame.js` - Line 880+ jumpToKnot method
- `js/systems/npc-manager.js` - Line 410+ event jump detection
- `js/systems/npc-los.js` - LOS detection for event trigger

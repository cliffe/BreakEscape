# 🚀 Quick Start - Testing Phase 3

## What's Working Now

- ✅ Phase 1: NPC sprites in rooms
- ✅ Phase 2: Person-chat minigame
- ✅ Phase 3: Interaction system (E-key)

## How to Test

### Step 1: Start Game with Test Scenario
```
Open: http://localhost:8000/scenario_select.html
Load: "NPC Sprite Test" scenario
```

### Step 2: Approach NPC
```
Walk near the NPC sprites
Watch for blue prompt at bottom: "Press E to talk to [Name]"
```

### Step 3: Trigger Conversation
```
Press E key
PersonChatMinigame should open
Portraits should display
Dialogue should show
```

### Step 4: Interact
```
Read dialogue
Select choices
Watch story progress
Conversation should end cleanly
```

## Browser Console Test

```javascript
// Check if NPC system is loaded
console.log(window.npcManager)
console.log(window.MinigameFramework)

// Manual trigger (if needed)
const npc = window.npcManager.getNPC('test_npc_front');
window.handleNPCInteraction(npc);

// Listen for events
window.addEventListener('npc_interacted', (e) => {
    console.log('NPC interacted:', e.detail);
});
```

## Expected Flow

```
Game Running
    ↓
Walk near NPC
    ↓
See prompt: "Press E to talk to Alex"
    ↓
Press E
    ↓
PersonChatMinigame opens
    ├─ NPC portrait on left (zoomed)
    ├─ Player portrait on right (zoomed)
    ├─ Dialogue text in middle
    └─ Choice buttons below
    ↓
Select choices
    ↓
Story progresses
    ↓
Press "End Conversation"
    ↓
Game resumes

All Events Fired:
✓ npc_interacted
✓ npc_conversation_started
```

## Files Modified This Phase

```
js/systems/interactions.js        +150 lines (NPC system)
css/npc-interactions.css          74 lines (new)
index.html                         +1 line (CSS link)
```

## What Each File Does

### js/systems/interactions.js
- `checkNPCProximity()` - Finds nearest NPC every 100ms
- `updateNPCInteractionPrompt()` - Shows/hides prompt
- `handleNPCInteraction()` - Triggers minigame
- `emitNPCEvent()` - Dispatches events

### css/npc-interactions.css
- `.npc-interaction-prompt` - Prompt container
- Styles for "Press E" text and E key badge
- Slide-up animation
- Mobile responsive

### index.html
- Added CSS link for npc-interactions.css

## Troubleshooting

### Prompt Not Showing?
```javascript
// Check proximity detection is running
window.checkNPCProximity()

// Check if NPC has sprite
const npc = window.npcManager.getNPC('test_npc_front');
console.log(npc._sprite); // Should be sprite object, not null
```

### Minigame Won't Open?
```javascript
// Check MinigameFramework is available
console.log(window.MinigameFramework)

// Check NPC data is complete
const npc = window.npcManager.getNPC('test_npc_front');
console.log(npc.id, npc.displayName, npc.storyPath)
```

### No Portraits?
- Check PersonChatPortraits initialization in console
- Verify game.canvas exists
- Check NPC sprite is active (not destroyed)

## Next Phase (Phase 4)

**Dual Identity System**
- NPCs work in phone AND in-person modes
- Shared conversation history
- Context-aware dialogue

Ready in ~4-5 hours

---

**Status: 🟢 FULLY WORKING**
**Next: Phase 4 (Dual Identity)**

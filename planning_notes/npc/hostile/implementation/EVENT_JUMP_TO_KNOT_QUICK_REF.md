# Event Jump to Knot - Quick Reference

## What's New?

When an event fires during an active conversation with an NPC, the conversation **jumps to the target knot** instead of starting a new conversation.

## Key Concepts

### 1. Active Conversation Detection

The system checks:
```javascript
window.currentConversationNPCId === npcId          // Is this the NPC in the conversation?
activeMinigame?.constructor?.name === 'PersonChatMinigame'  // Is it a person-chat?
```

### 2. Jump vs. Start Decision

| Scenario | Action |
|----------|--------|
| In conversation with NPC X, event triggered for X | ⚡ **Jump** to targetKnot |
| Not in conversation, event triggered for X | 🆕 **Start** new conversation |
| In conversation with NPC Y, event triggered for X | 🆕 **Start** new conversation (close Y's first) |

### 3. How Jumping Works

```
Current Dialogue State:
  NPC: "What do you want?"
  Ink Position: =hub===
       
Event Fires:
  lockpick_used_in_view → targetKnot: on_lockpick_used
       
Jump Happens:
  InkEngine.goToKnot("on_lockpick_used")
  Clear pending timers
  Show current dialogue at new knot
       
New Dialogue State:
  NPC: "Hey! What are you doing with that lock?"
  Ink Position: =on_lockpick_used===
```

## Implementation Details

### PersonChatMinigame.jumpToKnot()

**Location:** `js/minigames/person-chat/person-chat-minigame.js:880`

**Signature:**
```javascript
jumpToKnot(knotName: string): boolean
```

**Returns:** `true` on success, `false` on failure

**Does:**
1. Validates knot name and ink engine exist
2. Calls `this.inkEngine.goToKnot(knotName)`
3. Clears auto-advance timer
4. Clears pending callbacks
5. Shows dialogue at new knot
6. Logs status

### NPCManager._handleEventMapping()

**Location:** `js/systems/npc-manager.js:412`

**Change:** Added conversation detection before starting new person-chat

**Logic:**
```javascript
if (config.conversationMode === 'person-chat' && npc.npcType === 'person') {
  // Check if already talking to this NPC
  if (isConversationActive && isPersonChatActive) {
    // Jump instead of starting new
    if (activeMinigame.jumpToKnot(config.knot)) {
      return;  // Success!
    }
  }
  
  // Fallback: Start new conversation
  window.MinigameFramework.startMinigame('person-chat', null, {
    npcId: npc.id,
    startKnot: config.knot,
    scenario: window.gameScenario
  });
}
```

## Usage in Scenarios

### JSON Format (Already Supported)

```json
{
  "id": "security_guard",
  "eventMappings": [
    {
      "eventPattern": "lockpick_used_in_view",
      "targetKnot": "on_lockpick_used",
      "conversationMode": "person-chat",
      "cooldown": 0
    }
  ]
}
```

### Ink Format (Already Supported)

```ink
=== on_lockpick_used ===
# speaker:security_guard
Hey! What are you doing?

* [Oops, sorry]
    -> apologize
* [Mind your business]
    -> hostile_response
```

## Debugging

### Enable Debug Logging

In console:
```javascript
window.npcManager.debug = true;
```

Then trigger an event and watch console:

```
🎯 Event triggered: lockpick_used_in_view for NPC: security_guard
✅ Event conditions passed, triggering NPC reaction
👤 Handling person-chat for event on NPC security_guard
⚡ Active conversation detected with security_guard, jumping to knot: on_lockpick_used
🎯 PersonChatMinigame.jumpToKnot() - Jumping to: on_lockpick_used
✅ Successfully jumped to knot: on_lockpick_used
```

### Common Issues

**Issue:** Jump not happening, new conversation started instead
- Check: `window.currentConversationNPCId` - Should equal the NPC ID
- Check: Active minigame type - Should be `PersonChatMinigame`
- Check: Event mapping has `"conversationMode": "person-chat"`

**Issue:** Dialogue shows old content after jump
- Check: Browser cache - Hard refresh (Ctrl+Shift+R)
- Check: Ink JSON compiled - Recompile `.ink` file: `inklecate -ojv story.json story.ink`

**Issue:** Jump method not found error
- Check: PersonChatMinigame loaded - Should be in `js/minigames/person-chat/`
- Check: Method exists at line 880

## Files Modified

- ✅ `js/minigames/person-chat/person-chat-minigame.js` - Added `jumpToKnot()` method
- ✅ `js/systems/npc-manager.js` - Updated `_handleEventMapping()` for detection
- ✅ `docs/EVENT_JUMP_TO_KNOT.md` - Full documentation (new)
- ✅ `docs/EVENT_JUMP_TO_KNOT_QUICK_REF.md` - This file (new)

## Testing Checklist

- [ ] Start conversation with NPC
- [ ] Trigger event while in conversation
- [ ] Verify dialogue jumps to targetKnot
- [ ] Make choices in target knot
- [ ] Verify conversation continues normally
- [ ] Test with multiple events
- [ ] Test without conversation active (should start new)
- [ ] Test switching between NPCs

---

**Status:** ✅ Implemented and ready to use

**Added:** 2025-11-14

**Related:** `npc-patrol-lockpick.json` scenario test

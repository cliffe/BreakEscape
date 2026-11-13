# Event-Triggered Conversation - Quick Reference

## Problem → Solution

| Problem | Root Cause | Solution | File | Line |
|---------|-----------|----------|------|------|
| Cooldown: 0 treated as falsy | `0 \|\| 5000` → 5000 | Explicit null/undefined check | npc-manager.js | 359 |
| Event response knot ignored | PersonChatMinigame didn't check startKnot param | Store startKnot and use it before state restoration | person-chat-minigame.js | 53, 315-340 |

## What Was Fixed

### Fix 1: Cooldown Default (npc-manager.js:359)

**Before:**
```javascript
const cooldown = config.cooldown || 5000;  // 0 becomes 5000 ❌
```

**After:**
```javascript
const cooldown = config.cooldown !== undefined && config.cooldown !== null 
    ? config.cooldown 
    : 5000;  // 0 becomes 0 ✅
```

### Fix 2: Event Start Knot (person-chat-minigame.js)

**Constructor (line 53):**
```javascript
this.startKnot = params.startKnot;  // Store for later
```

**startConversation() (lines 315-340):**
```javascript
if (this.startKnot) {
    // Jump directly to event knot, skip state restoration
    this.conversation.goToKnot(this.startKnot);
} else {
    // Normal flow: restore previous or start from beginning
    // ... existing logic ...
}
```

## Flow Diagram

```
Event: lockpick_used_in_view
  ↓
NPCManager: Validate cooldown ✓ (cooldown: 0 now works)
  ↓
NPCManager: Start person-chat with startKnot: 'on_lockpick_used'
  ↓
PersonChatMinigame: Store this.startKnot = 'on_lockpick_used'
  ↓
PersonChatMinigame.startConversation():
  - Check: this.startKnot exists? YES
  - Jump to knot (skip state restoration)
  ↓
Show event response dialogue ✓
```

## Console Log Indicators

**✅ Event working correctly:**
```
npc-manager.js:330 🎯 Event triggered: lockpick_used_in_view for NPC: security_guard
npc-manager.js:387 ✅ Event lockpick_used_in_view conditions passed
npc-manager.js:411 👤 Handling person-chat for event on NPC security_guard
person-chat-minigame.js:298 ⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
```

**❌ Event blocked by cooldown (OLD BUG):**
```
npc-manager.js:330 🎯 Event triggered: lockpick_used_in_view for NPC: security_guard
npc-manager.js:???   ⏸️ Event lockpick_used_in_view on cooldown (5000ms remaining)
```

**❌ Event ignored by minigame (OLD BUG):**
```
person-chat-minigame.js:X 🔄 Continuing previous conversation with security_guard
```
(Should see: `⚡ Event-triggered conversation` instead)

## Testing

### Quick Test
1. Open scenario: `npc-patrol-lockpick.json`
2. Navigate to `patrol_corridor`
3. Use lockpicking action
4. NPC should immediately respond with event dialogue
5. Check console for: `⚡ Event-triggered conversation`

### Expected Behavior

**Before Fixes:**
- Lockpicking event triggered → Console shows on cooldown OR ignores event knot
- Person-chat opens but shows old conversation state, not event response

**After Fixes:**
- Lockpicking event triggered → Immediately interrupts lockpicking
- Person-chat opens showing event response dialogue ("Hey! What do you think you're doing with that lock?")
- Console shows: `⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used`

## Files Modified

1. `js/systems/npc-manager.js` - Line 359
2. `js/minigames/person-chat/person-chat-minigame.js` - Lines 53, 315-340

## Documentation

- `docs/EVENT_START_KNOT_FIX.md` - Detailed explanation of Fix 2
- `docs/EVENT_FLOW_COMPLETE.md` - Complete flow diagram with all code paths
- `docs/COOLDOWN_ZERO_BUG_FIX.md` - Detailed explanation of Fix 1

## Key Insight

**State restoration was blocking event responses.**

The system was designed to restore previous conversation state (for conversation continuation), but this happened BEFORE checking if an event-triggered start knot was provided. By checking for `startKnot` FIRST, we ensure event responses take precedence over state restoration.

## Next Steps (Future Enhancement)

The current implementation starts a new conversation when an event fires. A future enhancement could:

1. While in conversation with NPC A, lockpick event happens with NPC A in view
2. Instead of starting new conversation, **jump to event knot within the current conversation**
3. Code location: `js/systems/npc-manager.js` lines 427-428

Current code:
```javascript
if (isConversationActive && isPersonChatActive) {
    // Jump logic (partially implemented)
} else {
    // Start new conversation (current behavior)
}
```

To enable same-NPC jumps, modify line 427 condition from:
```javascript
if (isConversationActive && isPersonChatActive)  // Only jumps if same NPC
```

To:
```javascript
if (isPersonChatActive)  // Jump for any active person-chat
```

But current behavior (closing and starting new) is safe and prevents state confusion.

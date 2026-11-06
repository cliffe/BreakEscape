# NPC Bark Improvements Summary

## Changes Made

### 1. Fixed Conversation History Issue
**Problem:** Barks were being added to conversation history, causing the phone to think there was already an active conversation and skip the intro message/choices.

**Solution:** 
- Added `isBark: true` flag to bark messages in conversation history
- Updated `phone-chat-minigame.js` to filter out bark-only messages when checking for conversation history
- Now distinguishes between real conversation messages and event-triggered barks

**Files Modified:**
- `js/systems/npc-manager.js` - Added `isBark: true` to bark metadata
- `js/minigames/phone-chat/phone-chat-minigame.js` - Filter barks when checking conversation state

### 2. Added Max Triggers Limit
**Problem:** Events could trigger unlimited barks, potentially spamming the player.

**Solution:** Added `maxTriggers` option to event mappings.

**Usage in scenario JSON:**
```json
{
    "eventPattern": "door_unlocked",
    "targetKnot": "on_door_unlocked",
    "cooldown": 8000,
    "maxTriggers": 3  // Will only trigger 3 times total
}
```

**Features:**
- `maxTriggers: N` - Event will trigger at most N times
- Works alongside `cooldown` and `onceOnly`
- `onceOnly: true` is equivalent to `maxTriggers: 1`

### 3. Reply to Barks Feature
**Already Working!** Clicking a bark opens the phone chat with the NPC at the appropriate knot. The bark system passes:
- `npcId` - Which NPC sent the bark
- `startKnot` - Which conversation knot to start from
- `phoneId` - Which phone to open

**User Flow:**
1. Event triggers → NPC sends bark notification
2. Player clicks bark → Phone opens to conversation
3. Conversation shows bark message in history + conversation choices
4. Player can respond to the NPC

## Event Mapping Options Reference

### Complete Event Mapping Configuration
```json
{
    "eventPattern": "event_name",           // Required: Event to listen for
    "targetKnot": "knot_name",              // Required: Ink knot to navigate to
    "cooldown": 5000,                       // Optional: Milliseconds between triggers (default: 5000)
    "maxTriggers": 3,                       // Optional: Max times this can trigger
    "onceOnly": true,                       // Optional: Only trigger once (= maxTriggers: 1)
    "condition": "data.itemType === 'key'", // Optional: JavaScript expression to evaluate
    "bark": "Custom message text"           // Optional: Override knot text with this
}
```

### Event Pattern Examples
```json
// Exact match
"eventPattern": "door_unlocked"

// Wildcard match
"eventPattern": "item_picked_up:*"

// Specific item
"eventPattern": "item_picked_up:lockpick"

// With condition
"eventPattern": "minigame_completed",
"condition": "data.minigameName && data.minigameName.includes('Lockpick')"
```

### Frequency Control Examples

#### One-Time Event
```json
{
    "eventPattern": "item_picked_up:special_key",
    "targetKnot": "found_special_key",
    "onceOnly": true
}
```

#### Limited Triggers with Cooldown
```json
{
    "eventPattern": "door_unlock_attempt",
    "targetKnot": "struggling_with_door",
    "cooldown": 30000,      // 30 seconds between barks
    "maxTriggers": 3        // Max 3 helpful hints
}
```

#### Frequent Encouragement (Early Game)
```json
{
    "eventPattern": "minigame_failed",
    "targetKnot": "encouragement",
    "cooldown": 10000,      // 10 seconds
    "maxTriggers": 5        // Stop after 5 failures
}
```

#### Rare Celebration
```json
{
    "eventPattern": "item_picked_up:*",
    "targetKnot": "nice_find",
    "cooldown": 60000,      // 1 minute between celebrations
    "maxTriggers": 10       // Max 10 per game
}
```

## How Barks Work Now

### Event Flow
1. **Event Emitted** - Game system emits event (e.g., `door_unlocked`)
2. **Event Received** - NPCManager checks registered mappings
3. **Conditions Checked**:
   - Has max triggers been reached?
   - Is cooldown active?
   - Does condition pass?
4. **Bark Loaded** - InkEngine loads story and navigates to knot
5. **Bark Shown** - Notification appears above inventory
6. **Player Clicks** - Phone opens to full conversation

### Bark Message Flow
```
Game Event → NPC Manager → Ink Engine → Bark System → Phone Chat
                ↓              ↓           ↓            ↓
         Check limits   Get text    Show popup   Full convo
```

### Conversation History Behavior
- **Barks**: Flagged with `isBark: true`, shown in history but don't affect state
- **Real Conversation**: Player choices and responses, affects Ink story state
- **First Open**: Shows intro and choices even if barks exist in history
- **Subsequent Opens**: Resumes from saved story state with choices

## Testing Recommendations

### Test Bark Limits
1. Set `maxTriggers: 2` on a common event (e.g., `item_picked_up:*`)
2. Pick up 3+ items
3. Verify bark only appears twice

### Test Conversation After Barks
1. Trigger a bark event (e.g., unlock door)
2. Don't click bark, let it dismiss
3. Open phone manually
4. Verify intro message and full conversation options appear
5. Have conversation, close phone
6. Open phone again
7. Verify conversation resumes where you left off

### Test Reply to Bark
1. Trigger a bark
2. Click bark notification
3. Verify phone opens
4. Verify bark message visible in conversation history
5. Verify conversation choices are available
6. Select a choice and verify conversation continues

## Known Behavior

### Cooldown vs Max Triggers
- **Cooldown**: Time-based limit (e.g., once per 30 seconds)
- **Max Triggers**: Count-based limit (e.g., max 3 times ever)
- **Combined**: "Max 5 times, but not more than once per minute"

### Bark Persistence
- Barks auto-dismiss after 5 seconds
- Clicking bark opens phone and removes notification
- Bark messages persist in conversation history
- Barks don't interfere with normal conversation flow

### Edge Cases
- If player receives bark while phone is open, bark appears but doesn't interrupt
- Multiple barks from different NPCs stack vertically
- Barks respect z-index (appear above inventory, below modals)

## Future Enhancements

### Possible Additions
- [ ] Bark priority system (interrupt vs. queue)
- [ ] Bark animations (shake, pulse, color)
- [ ] Bark sounds per NPC
- [ ] Context-aware bark timing (not during minigames)
- [ ] Bark chains (one bark triggers another)
- [ ] Bark achievements (respond to X barks)

### Scenario Design Tips
1. Use `maxTriggers` for tutorial hints (don't over-explain)
2. Use `cooldown` for ambient reactions (not spammy)
3. Use `onceOnly` for story moments (first discovery, plot twists)
4. Use `condition` for context-sensitive reactions (right place, right time)
5. Combine limits for natural feeling NPCs (helpful but not annoying)

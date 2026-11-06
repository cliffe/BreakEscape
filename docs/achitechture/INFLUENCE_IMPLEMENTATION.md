# NPC Influence System - Implementation Summary

## Overview

Added a standardized NPC influence system to Break Escape that provides visual feedback when player relationships with NPCs change.

## What Was Implemented

### 1. Tag Processing in `chat-helpers.js`

Added two new tag handlers:

- `# influence_increased` - Shows green "+" popup
- `# influence_decreased` - Shows red "-" popup

**Location**: `js/minigames/helpers/chat-helpers.js`

The tags automatically:
- Retrieve the current NPC's display name
- Show an animated popup notification
- Log the influence change to console

### 2. Visual Popup Function

Created `showInfluencePopup(npcName, direction)` function that:
- Displays at top-center of screen
- Uses pixel-art styling (sharp borders, VT323 font)
- Shows for 2 seconds with fade animations
- Color-coded: green for increases, red for decreases
- Non-intrusive (doesn't block gameplay)

### 3. Documentation

**`docs/NPC_INFLUENCE.md`** - Complete reference guide covering:
- Variable declaration in Ink
- Tag usage patterns
- Visual feedback details
- Example implementations
- Best practices

**`docs/INK_BEST_PRACTICES.md`** - Added new section:
- Overview of influence system
- Implementation steps
- Complete working example
- Conditional content based on influence
- Best practices and threshold recommendations

### 4. Demo Ink Story

**`scenarios/ink/influence-demo.ink`** - Working example featuring:
- Agent Carter NPC with dynamic relationship tracking
- 4 relationship tiers (distrustful → acquaintance → friend → trusted ally)
- Multiple influence-changing interactions
- Conditional dialogue options based on influence level
- Unlockable content at influence thresholds (5, 10+)

**Compiled**: `scenarios/compiled/influence-demo.json`

## Usage in Ink Stories

### Basic Pattern

```ink
VAR influence = 0

=== helpful_action ===
Thanks for helping!
~ influence += 1
# influence_increased
-> hub

=== rude_action ===
That wasn't cool.
~ influence -= 1
# influence_decreased
-> hub
```

### Advanced Pattern with Conditionals

```ink
VAR influence = 0

=== hub ===
{influence >= 5:
  + [Ask for classified info] -> classified
}
{influence >= 10:
  + [Request backup] -> backup
}
{influence < -5:
  NPC refuses to help anymore.
}
```

## Visual Feedback

When a tag is triggered, the player sees:

**Influence Increased**:
```
┌────────────────────────────┐
│  + Influence: Agent Carter │  ← Green
└────────────────────────────┘
```

**Influence Decreased**:
```
┌────────────────────────────┐
│  - Influence: Agent Carter │  ← Red
└────────────────────────────┘
```

## Technical Details

- **Auto-detects NPC**: Uses `window.currentConversationNPCId`
- **Name resolution**: `displayName` → `name` → `npcId` (fallback chain)
- **Non-blocking**: Uses fixed positioning with high z-index
- **Accessible**: Clear visual distinction between positive/negative
- **Consistent styling**: Matches game's pixel-art aesthetic

## Integration Points

The influence system integrates with:
1. **Phone-Chat Minigame** - Works automatically with phone NPCs
2. **Person-Chat Minigame** - Works automatically with in-person NPCs
3. **Tag Processing Pipeline** - Handled by `processGameActionTags()`
4. **NPC Manager** - Retrieves NPC data for display names

## Testing the System

1. Load a scenario with an NPC using the influence demo story
2. Make choices that increase/decrease influence
3. Observe popup notifications at top of screen
4. Check that influence variable persists across conversations
5. Verify conditional options appear at correct thresholds

## Files Modified

- `js/minigames/helpers/chat-helpers.js` (+42 lines)
- `docs/INK_BEST_PRACTICES.md` (+120 lines)

## Files Created

- `docs/NPC_INFLUENCE.md` (new complete reference)
- `scenarios/ink/influence-demo.ink` (demo story)
- `scenarios/compiled/influence-demo.json` (compiled demo)

## Benefits

1. **Clear Feedback**: Players immediately know when relationships change
2. **Standardized**: Consistent pattern across all NPCs
3. **Easy to Implement**: Just add tags to Ink stories
4. **Flexible**: Works with any influence scale or threshold system
5. **Non-intrusive**: Doesn't interrupt gameplay flow
6. **Persistent**: Influence tracked in Ink variables (auto-saved)

## Next Steps (Optional Enhancements)

- Add sound effect on influence change
- Create influence meter UI in NPC conversations
- Add particle effects for major influence milestones
- Track influence history/analytics
- Global influence system across all NPCs

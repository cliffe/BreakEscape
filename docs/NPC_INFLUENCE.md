# NPC Influence System

## Overview

Every NPC in Break Escape tracks an **influence** variable representing the player's relationship with them. Influence changes trigger visual feedback to show the player when they've improved or damaged a relationship.

## Ink Implementation

### Variable Declaration

In your Ink story, declare an `influence` variable for each NPC:

```ink
VAR influence = 0
VAR npc_name = "Agent Smith"
```

### Triggering Influence Changes

When the player does something that changes the relationship, modify the `influence` variable and add the corresponding tag:

#### Increasing Influence

```ink
=== helpful_choice ===
You helped me out. I won't forget that.
~ influence += 1
# influence_increased
-> hub
```

This displays: **"+ Influence: Agent Smith"** (green)

#### Decreasing Influence

```ink
=== rude_choice ===
That was uncalled for. I expected better from you.
~ influence -= 1
# influence_decreased
-> hub
```

This displays: **"- Influence: Agent Smith"** (red)

## Visual Feedback

The influence system automatically shows a popup notification:

- **Position**: Top center of screen
- **Duration**: 2 seconds
- **Appearance**: Pixel-art styled with sharp borders (no border-radius)
- **Colors**:
  - Green (#27ae60) for increases
  - Red (#e74c3c) for decreases

## Example Usage

```ink
VAR influence = 0
VAR trust_level = "stranger"

=== hub ===
{influence >= 5: ~ trust_level = "friend"}
{influence >= 10: ~ trust_level = "trusted ally"}
{influence <= -5: ~ trust_level = "suspicious"}

Hey there, {trust_level}.

+ [Ask for help]
    -> ask_help

+ [Be rude]
    -> be_rude

=== ask_help ===
Sure, I can help with that.
~ influence += 1
# influence_increased
-> hub

=== be_rude ===
Wow, okay. Forget I asked.
~ influence -= 2
# influence_decreased
-> hub
```

## Technical Details

- **Tags processed**: `# influence_increased` and `# influence_decreased`
- **Implementation**: `js/minigames/helpers/chat-helpers.js`
- **Popup function**: `showInfluencePopup(npcName, direction)`
- **NPC name source**: Uses `displayName` → `name` → `npcId` fallback

## Best Practices

1. **Use meaningful increments**: ±1 for small actions, ±2-3 for significant choices
2. **Track thresholds**: Use influence levels to unlock new dialogue options
3. **Show consequences**: Let NPCs react differently based on influence
4. **Balance carefully**: Avoid making influence too easy to maximize or minimize
5. **Be consistent**: Similar actions should have similar influence impacts

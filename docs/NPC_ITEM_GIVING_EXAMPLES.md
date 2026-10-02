# NPC Item Giving System - Usage Examples

This document demonstrates how to use the NPC item giving system with both immediate and container-based approaches.

## Setup

NPCs must declare `itemsHeld` array in the scenario JSON:

```json
{
  "id": "equipment_officer",
  "displayName": "Equipment Officer",
  "itemsHeld": [
    {
      "type": "lockpick",
      "name": "Lock Pick Kit",
      "takeable": true,
      "observations": "Professional lock picking set"
    },
    {
      "type": "workstation",
      "name": "Analysis Workstation",
      "takeable": true,
      "observations": "Portable workstation"
    }
  ]
}
```

## Ink Variables

Items are automatically synced to Ink variables:

```ink
VAR has_lockpick = false
VAR has_workstation = false
VAR has_phone = false
VAR has_keycard = false
```

Declare only the `has_*` variables you need for your NPC.

## Usage Pattern 1: Immediate Single Item Transfer

**Tag:** `#give_item:type`

**Use Case:** Give one specific item immediately without opening UI

**Ink Example:**
```ink
=== give_basic_item ===
Here's a lockpick set!
#give_item:lockpick
Good luck!
-> hub
```

**How it works:**
1. Player reads dialogue
2. Tag is processed
3. First `lockpick` from NPC's `itemsHeld` is added to inventory
4. Item is removed from NPC's inventory
5. Conversation continues

**Notes:**
- Only gives the first matching item type
- No UI overlay
- Fast and clean for single items

---

## Usage Pattern 2: Container UI - All Items

**Tag:** `#give_npc_inventory_items`

**Use Case:** Show all items the NPC is holding for player to choose from

**Ink Example:**
```ink
=== give_all_items ===
# speaker:npc
Here are all the tools I have available. Take what you need!
#give_npc_inventory_items
What else can I help with?
-> hub
```

**How it works:**
1. Tag is processed
2. Container minigame opens in "NPC mode"
3. Shows NPC's portrait and all items in `itemsHeld`
4. Player can take items from container
5. Each taken item is removed from NPC's inventory
6. Variables updated automatically
7. Conversation continues

**Container UI Features:**
- NPC portrait/avatar displayed
- "Equipment Officer offers you items" header
- Grid of available items
- Player can examine each item before taking

---

## Usage Pattern 3: Container UI - Filtered Items

**Tag:** `#give_npc_inventory_items:type1,type2`

**Use Case:** Show only specific item types from NPC's inventory

**Ink Example:**
```ink
=== give_tools_only ===
# speaker:npc
Here are the specialized tools we have. Choose what you need for the job.
#give_npc_inventory_items:lockpick,workstation
Let me know if you need anything else!
-> hub
```

**Comma-separated types:**
```ink
// Show lockpicks and keycards only
#give_npc_inventory_items:lockpick,keycard

// Show workstations only
#give_npc_inventory_items:workstation
```

**How it works:**
1. Tag parsed for filter types
2. Container UI opens showing only matching items
3. If NPC has 2 lockpicks, 1 workstation, 1 keycard:
   - With filter `lockpick,keycard`: shows 2 lockpicks + 1 keycard (not workstation)
4. Player can take from filtered list
5. Variables updated

---

## Advanced Example: Conditional Item Giving

**Ink Example:**
```ink
=== equipment_hub ===
What tools do you need?

{has_lockpick and has_workstation and has_keycard:
  + [I have all the tools I need]
    -> thanks_npc
}

{has_lockpick or has_workstation or has_keycard:
  + [Show me everything else you have]
    #give_npc_inventory_items
    -> equipment_hub
}

+ [I need specialized tools]
  -> show_tools

+ [I need security access]
  -> show_keycards

+ [I'm good for now]
  -> goodbye

=== show_tools ===
Here are our specialized tools:
#give_npc_inventory_items:lockpick,workstation
-> equipment_hub

=== show_keycards ===
Here are the access devices:
#give_npc_inventory_items:keycard
-> equipment_hub

=== thanks_npc ===
Perfect! Anything else?
-> equipment_hub

=== goodbye ===
Come back if you need anything!
-> END
```

---

## Complete Scenario Example

From `npc-sprite-test2.json`:

### Helper NPC (Immediate Item Transfer)
- Position: (5, 3)
- Story: `helper-npc.ink`
- Items: phone, workstation, lockpick
- Pattern: Uses `#give_item:type` for single items
- Demonstrates: Conditional dialogue that adapts to available items

### Equipment Officer (Container-Based UI)
- Position: (8, 5)
- Story: `equipment-officer.ink` 
- Items: 2 lockpicks (Basic & Advanced), 1 workstation, 1 keycard
- Pattern: Uses `#give_npc_inventory_items` to show container minigame
- Demonstrates:
  - Container UI with NPC portrait
  - Multiple items of same type
  - All items displayed in interactive grid
  - Items removed from NPC inventory as player takes them
  - Conversation continues after item selection

## Container Minigame UI Features (NPC Mode)

When `#give_npc_inventory_items` is used, the container minigame opens with:

1. **NPC Portrait/Avatar** - Displayed at top if available
2. **Custom Header** - "Equipment Officer offers you items" 
3. **Item Grid** - Interactive grid showing all held items (or filtered items)
4. **Item Details** - Click items to see observations/descriptions
5. **Take Items** - Player can take any/all items shown
6. **Automatic Updates** - NPC inventory decreases as items taken
7. **Variable Sync** - `has_*` variables update in real-time

Example dialogue flow:
```
Player: "Show me what you have available"
→ Container minigame opens with NPC's items
→ Player takes "Advanced Lock Pick Kit"
→ NPC inventory now has 1 lockpick instead of 2
→ has_lockpick variable remains true (still has items)
→ Conversation continues with "What else can I help with?"
```

---

## Event System

When items are given, the `npc_items_changed` event is emitted:

```javascript
window.eventDispatcher.emit('npc_items_changed', { npcId });
```

This automatically triggers:
1. Variables re-sync in Ink
2. Conditions re-evaluated
3. Conversation state updated

---

## Best Practices

1. **Declare all `has_*` variables** you'll check in Ink at the top of your story
2. **Use immediate giving** (`#give_item`) for story-critical single items
3. **Use container UI** when offering multiple items or choices
4. **Use filtered container UI** for specialized equipment categories
5. **Check variables** in conditions to adapt dialogue based on what's available
6. **Remove items as they're taken** - they're automatically removed from NPC inventory

---

## Testing

To test the NPC item giving system:

1. Load `npc-sprite-test2.json` scenario
2. Talk to "Helper NPC" (5, 3) - demonstrates immediate giving
3. Talk to "Equipment Officer" (8, 5) - demonstrates container UI
4. Try different dialogue paths to see variable updates
5. Verify items appear in player inventory
6. Check that NPC inventory decreases as items are taken


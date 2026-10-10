# Scenario Migration Guide: From Up-Front to Lazy-Loaded NPCs
## Step-by-Step Instructions for Content Designers

**Date**: November 6, 2025  
**Status**: Phase 2 Planning  

---

## Quick Reference

### Before (Current Format)
```json
{
  "npcs": [ ... all NPCs here ... ],
  "rooms": {
    "room1": { "objects": [...] }
  }
}
```

### After (New Format)
```json
{
  "npcs": [ ... phone NPCs only ... ],
  "rooms": {
    "room1": {
      "npcs": [ ... person NPCs only ... ],
      "objects": [...]
    }
  }
}
```

---

## Migration Checklist

### Step 1: Identify NPC Types

For each NPC in your scenario:

- [ ] **Phone NPC**: `"npcType": "phone"` or `"phoneId": "..."`
  - Has `phoneId` property
  - No sprite in world
  - Available from game start
  - **Action**: Keep in root `npcs` array

- [ ] **Person NPC**: `"npcType": "person"` or `spriteSheet` property
  - Has `spriteSheet`, `position`, `spriteTalk` properties
  - Visible as sprite in world
  - Tied to specific room via `roomId` or location
  - **Action**: Move to `rooms[roomId].npcs` array

- [ ] **Ambiguous**: No `npcType` specified
  - Check for `phoneId` → likely phone
  - Check for `spriteSheet` + `position` → likely person
  - Check existing `roomId` field → use that room
  - **Ask**: "Is this NPC a sprite or a phone contact?"

### Step 2: Create Room.NPCs Arrays

For each room that will have person NPCs:

```json
{
  "rooms": {
    "reception": {
      "type": "room_reception",
      "npcs": [],        // ← ADD THIS (empty initially)
      "connections": {...},
      "objects": [...]
    }
  }
}
```

### Step 3: Move Person NPCs to Rooms

For each person NPC:

1. Find its `roomId` field
2. Remove from root `npcs` array
3. Add to `rooms[roomId].npcs` array
4. **Keep all other fields identical**

**Example**:

**BEFORE** (in root `npcs`):
```json
{
  "id": "desk_clerk",
  "displayName": "Clerk",
  "npcType": "person",
  "roomId": "reception",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker-red",
  "storyPath": "scenarios/ink/clerk.json",
  "currentKnot": "start"
}
```

**AFTER** (in `rooms.reception.npcs`):
```json
{
  "id": "desk_clerk",
  "displayName": "Clerk",
  "npcType": "person",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker-red",
  "storyPath": "scenarios/ink/clerk.json",
  "currentKnot": "start"
}
```

**Note**: `roomId` is removed (implicit by array location).

### Step 4: Keep Phone NPCs at Root

Phone NPCs stay in root `npcs` array but may need updates:

```json
{
  "id": "neye_eve",
  "displayName": "Neye Eve",
  "npcType": "phone",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/neye-eve.json",
  "currentKnot": "start",
  "timedMessages": [...]
}
```

**Note**: Ensure `npcType: "phone"` is explicitly set for clarity.

### Step 5: Validate JSON Structure

Use JSON validator:

```bash
python3 -m json.tool scenarios/your_scenario.json > /dev/null
# If no error, JSON is valid
```

**Common errors**:
- Missing commas in arrays
- Duplicate property names
- Trailing commas
- Mismatched braces

### Step 6: Test in Game

1. Load scenario in `scenario_select.html`
2. Verify game starts (no load errors in console)
3. Move to each room
4. Check person NPCs appear in correct rooms
5. Check phone NPCs available in phone UI
6. Check no console errors

---

## Migration Examples

### Example 1: Simple Scenario (npc-sprite-test2.json)

**BEFORE**:
```json
{
  "npcs": [
    {
      "id": "test_npc_front",
      "roomId": "test_room",
      "npcType": "person",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker-red"
    },
    {
      "id": "test_npc_back",
      "roomId": "test_room",
      "npcType": "person",
      "position": { "x": 6, "y": 8 },
      "spriteSheet": "hacker"
    }
  ],
  "rooms": {
    "test_room": { "type": "room_office" }
  }
}
```

**AFTER**:
```json
{
  "npcs": [],  // No phone NPCs in this test
  "rooms": {
    "test_room": {
      "type": "room_office",
      "npcs": [
        {
          "id": "test_npc_front",
          "npcType": "person",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker-red"
        },
        {
          "id": "test_npc_back",
          "npcType": "person",
          "position": { "x": 6, "y": 8 },
          "spriteSheet": "hacker"
        }
      ]
    }
  }
}
```

### Example 2: Complex Scenario (ceo_exfil.json simplified)

**BEFORE**:
```json
{
  "npcs": [
    {
      "id": "helper_npc",
      "displayName": "Helpful Contact",
      "npcType": "phone",
      "phoneId": "player_phone",
      "storyPath": "scenarios/ink/helper-npc.json",
      "currentKnot": "start"
    },
    {
      "id": "desk_clerk",
      "displayName": "Clerk",
      "npcType": "person",
      "roomId": "reception",
      "position": { "x": 5, "y": 3 },
      "spriteSheet": "hacker-red",
      "storyPath": "scenarios/ink/clerk.json"
    }
  ],
  "rooms": {
    "reception": { "type": "room_reception" }
  }
}
```

**AFTER**:
```json
{
  "npcs": [
    {
      "id": "helper_npc",
      "displayName": "Helpful Contact",
      "npcType": "phone",
      "phoneId": "player_phone",
      "storyPath": "scenarios/ink/helper-npc.json",
      "currentKnot": "start"
    }
  ],
  "rooms": {
    "reception": {
      "type": "room_reception",
      "npcs": [
        {
          "id": "desk_clerk",
          "displayName": "Clerk",
          "npcType": "person",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker-red",
          "storyPath": "scenarios/ink/clerk.json"
        }
      ]
    }
  }
}
```

---

## Common Questions

### Q1: My NPC doesn't have `roomId`. How do I know which room it goes in?

**A**: Check for clues:
1. Look at `position` - pixel position usually suggests specific room
2. Look at `spriteSheet` - thematic fit (CEO office theme → CEO room)
3. Look at narrative - who should be where?
4. Ask content owner: "Where should this NPC appear?"
5. If truly unsure, choose a room and test in game

### Q2: What if an NPC needs to be in multiple rooms?

**A**: Not yet supported in lazy-loading model. Options:
1. Create separate NPC instances for each room (e.g., `clerk_reception` and `clerk_office`)
2. Keep as phone NPC (global access)
3. Discuss with team for Phase 4+ enhancement

### Q3: What if my scenario has no person NPCs?

**A**: That's fine! Just:
1. Add empty `npcs: []` to each room
2. Keep all phone NPCs in root `npcs`
3. Migration is simpler

### Q4: Do I need to move NPCs from all scenarios at once?

**A**: No! Migration can be gradual:
- Update one scenario at a time
- Test each before moving to next
- Backward compatibility maintained until end of Phase 3

### Q5: What about NPC event mappings?

**A**: Event mappings move with the NPC:

**BEFORE** (in root `npcs`):
```json
{
  "id": "helper_npc",
  "eventMappings": [
    { "eventPattern": "item_picked_up:lockpick", "targetKnot": "on_lockpick" }
  ]
}
```

**AFTER** (in `rooms[roomId].npcs` or still in root if phone NPC):
```json
{
  "id": "helper_npc",
  "eventMappings": [
    { "eventPattern": "item_picked_up:lockpick", "targetKnot": "on_lockpick" }
  ]
}
```

**No change needed** to event mapping structure!

### Q6: What about `timedMessages`?

**A**: Same as event mappings - move with the NPC:

**Phone NPCs** (root): Timed messages fire from game start
**Person NPCs** (in rooms): Timed messages fire when room is entered

---

## Automation Scripts

### Script 1: Python Migration Tool (TODO)

```python
# scripts/migrate_npcs.py

import json
import sys

def migrate_scenario(scenario_path):
    """
    Automatically migrate scenario from old to new format.
    """
    with open(scenario_path) as f:
        scenario = json.load(f)
    
    # Initialize room NPCs arrays
    for room_id in scenario['rooms']:
        scenario['rooms'][room_id]['npcs'] = []
    
    # Separate phone and person NPCs
    phone_npcs = []
    person_npcs = {}
    
    for npc in scenario.get('npcs', []):
        if npc.get('npcType') == 'phone' or npc.get('phoneId'):
            phone_npcs.append(npc)
        else:
            room_id = npc.get('roomId', 'unknown')
            if room_id not in person_npcs:
                person_npcs[room_id] = []
            
            # Remove roomId from NPC (implicit in array location)
            npc_copy = {k: v for k, v in npc.items() if k != 'roomId'}
            person_npcs[room_id].append(npc_copy)
    
    # Place person NPCs in their rooms
    for room_id, npcs in person_npcs.items():
        if room_id in scenario['rooms']:
            scenario['rooms'][room_id]['npcs'] = npcs
    
    # Update root NPCs to only phone NPCs
    scenario['npcs'] = phone_npcs
    
    # Write back
    with open(scenario_path, 'w') as f:
        json.dump(scenario, f, indent=2)
    
    print(f"✅ Migrated {scenario_path}")
    print(f"   - Phone NPCs at root: {len(phone_npcs)}")
    print(f"   - Person NPCs distributed: {len(person_npcs)} rooms")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python migrate_npcs.py <scenario.json>")
        sys.exit(1)
    
    migrate_scenario(sys.argv[1])
```

**Usage**:
```bash
cd scripts
python3 migrate_npcs.py ../scenarios/ceo_exfil.json
python3 migrate_npcs.py ../scenarios/biometric_breach.json
```

### Script 2: Validation Checker (TODO)

```bash
#!/bin/bash
# scripts/validate_migration.sh

for scenario in scenarios/*.json; do
  echo "Checking $scenario..."
  
  # Check valid JSON
  python3 -m json.tool "$scenario" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "  ❌ Invalid JSON"
    continue
  fi
  
  # Check structure
  npcs_at_root=$(python3 -c "import json; f=json.load(open('$scenario')); print(len(f.get('npcs', [])))")
  has_person_npcs=$(python3 -c "import json; f=json.load(open('$scenario')); print(any(n.get('roomId') for n in f.get('npcs', [])))")
  
  if [ "$has_person_npcs" = "True" ]; then
    echo "  ⚠️  Still has person NPCs at root (should be in rooms)"
  else
    echo "  ✅ Structure looks good"
  fi
done
```

---

## Backward Compatibility Mode

For the transition period, the code will support **both** formats:

### Legacy Detection Logic

```javascript
// In npc-lazy-loader.js:

async loadNPCsForRoom(roomId, roomData) {
  let npcs = [];
  
  // Try new format first
  if (roomData.npcs && Array.isArray(roomData.npcs)) {
    npcs = roomData.npcs;
    console.log(`✅ Found NPCs in room.npcs array (new format)`);
  }
  
  // Fall back to old format
  if (npcs.length === 0 && window.gameScenario?.npcs) {
    npcs = window.gameScenario.npcs
      .filter(npc => npc.roomId === roomId && npc.npcType === 'person')
      .map(npc => {
        // Ensure roomId is set (implicit in new format)
        npc.roomId = roomId;
        return npc;
      });
    
    if (npcs.length > 0) {
      console.log(`⚠️  Found NPCs in scenario.npcs (legacy format)`);
    }
  }
  
  // Load as usual...
}
```

**Timeline**: Backward compatibility maintained through end of Phase 3.

---

## Testing Your Migration

### Checklist for Each Migrated Scenario

- [ ] JSON is valid (use online validator or Python script)
- [ ] All person NPCs removed from root `npcs`
- [ ] All person NPCs in correct `rooms[roomId].npcs`
- [ ] All phone NPCs remain in root `npcs`
- [ ] Game loads without errors
- [ ] Person NPCs appear in correct rooms
- [ ] Phone NPCs available in phone UI
- [ ] Ink stories load correctly
- [ ] Event mappings still work
- [ ] Timed messages still work

### Console Checks

When game loads, look for:

**Good Signs**:
```
✅ Loaded NPC: desk_clerk → room reception
✅ Lazy-loaded NPC: desk_clerk in room reception
📖 Cached Ink story: scenarios/ink/clerk.json
```

**Bad Signs**:
```
❌ NPC roomId not found: desk_clerk
⚠️ NPC spriteSheet not found: hacker-red
```

---

## Migration Order

Recommended order (easiest to hardest):

1. `npc-sprite-test2.json` - Already set up for testing
2. `biometric_breach.json` - Likely has few NPCs
3. `scenario1.json`, `scenario2.json`, etc. - Check before migrating
4. `ceo_exfil.json` - Most complex, do last

---

## Appendix: Full Migration Template

Use this as a starting point for any scenario:

```json
{
  "scenario_brief": "Description",
  "startRoom": "start_room_id",
  
  "npcs": [
    {
      "id": "global_contact",
      "displayName": "Name",
      "npcType": "phone",
      "phoneId": "player_phone",
      "storyPath": "scenarios/ink/story.json",
      "currentKnot": "start",
      "timedMessages": [],
      "eventMappings": []
    }
  ],
  
  "startItemsInInventory": [...],
  
  "rooms": {
    "room_id": {
      "type": "room_type",
      "connections": {...},
      "npcs": [
        {
          "id": "room_npc",
          "displayName": "Name",
          "npcType": "person",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "sprite_name",
          "storyPath": "scenarios/ink/story.json",
          "currentKnot": "start"
        }
      ],
      "objects": [...]
    }
  }
}
```

---

## Next Steps

1. Review this guide with team
2. Create migration script(s)
3. Start with test scenarios
4. Create PR with first 2-3 migrated scenarios
5. Gather feedback before full migration

---

**Questions?** Refer to main plan: `01-lazy_load_plan.md`

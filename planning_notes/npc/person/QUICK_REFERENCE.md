# Person NPC Quick Reference

## TL;DR
Add in-person character NPCs to Break Escape that players can walk up to and talk to face-to-face. Same characters can also be phone contacts. Conversations use Ink stories with zoomed character portraits.

---

## Quick Start

### 1. Add NPC to Scenario
```json
{
  "npcs": [
    {
      "id": "guard",
      "displayName": "Security Guard",
      "npcType": "person",
      "roomId": "lobby",
      "position": { "x": 5, "y": 3 },
      "storyPath": "scenarios/ink/guard.json"
    }
  ]
}
```

### 2. Create Ink Story
```ink
// guard.ink
=== start ===
Hello there. Can I help you with something?
-> menu

=== menu ===
+ [Ask about security] -> security_info
+ [Say goodbye] -> END

=== security_info ===
The building is pretty secure. Stay out of trouble!
-> menu
```

### 3. Compile Ink
```bash
inklecate -j -o scenarios/ink/guard.json scenarios/ink/guard.ink
```

### 4. Play
Walk up to NPC, press E or click, conversation opens with zoomed portraits.

---

## NPC Types

| Type | Phone Contact | Physical Sprite | Use Case |
|------|--------------|----------------|----------|
| `"phone"` | ✅ Yes | ❌ No | Remote contacts only |
| `"person"` | ❌ No | ✅ Yes | In-person only |
| `"both"` | ✅ Yes | ✅ Yes | Can message AND meet |

---

## Configuration Cheatsheet

### Phone-Only NPC
```json
{
  "id": "tipster",
  "displayName": "Anonymous",
  "npcType": "phone",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/tipster.json"
}
```

### Person-Only NPC
```json
{
  "id": "guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "roomId": "lobby",
  "position": { "x": 5, "y": 3 },
  "storyPath": "scenarios/ink/guard.json"
}
```

### Dual-Identity NPC (Both)
```json
{
  "id": "alex",
  "displayName": "Alex",
  "npcType": "both",
  "phoneId": "player_phone",
  "roomId": "server1",
  "position": { "x": 8, "y": 5 },
  "storyPath": "scenarios/ink/alex.json"
}
```

---

## Position Formats

### Grid Coordinates (Tiles)
```json
"position": { "x": 5, "y": 3 }
```
- `x`: Tile X from room origin
- `y`: Tile Y from room origin

### Pixel Coordinates (Absolute)
```json
"position": { "px": 640, "py": 480 }
```
- `px`: Exact pixel X in world space
- `py`: Exact pixel Y in world space

---

## Animation Configuration

### Simple (Static Frame)
```json
"spriteConfig": {
  "idleFrame": 20
}
```

### Animated Idle
```json
"spriteConfig": {
  "idleFrameStart": 20,
  "idleFrameEnd": 23
}
```

### Full Animations
```json
"spriteConfig": {
  "idleFrameStart": 20,
  "idleFrameEnd": 23,
  "greetFrameStart": 24,
  "greetFrameEnd": 27,
  "talkFrameStart": 28,
  "talkFrameEnd": 31
}
```

---

## Dual-Identity Ink Pattern

```ink
// alex.ink
VAR trust_level = 0
VAR last_interaction_type = "none"
VAR has_greeted = false

=== start ===
{ has_greeted:
    -> main_menu
- else:
    Hi! I'm Alex, the sysadmin.
    ~ has_greeted = true
    -> main_menu
}

=== main_menu ===
+ [Ask for help] -> ask_help
+ [Goodbye] -> goodbye

=== ask_help ===
Sure, what do you need?
~ trust_level = trust_level + 1
-> main_menu

=== goodbye ===
{ last_interaction_type:
    - "phone": Talk later!
    - "person": See you around!
    - else: Take care!
}
-> END
```

---

## Event Barks for Person NPCs

### Configuration
```json
{
  "id": "alex",
  "npcType": "both",
  "eventMappings": [
    {
      "eventPattern": "room_entered:ceo",
      "targetKnot": "on_ceo_entered",
      "onceOnly": true
    }
  ]
}
```

### Ink Knot
```ink
=== on_ceo_entered ===
Hey! Be careful in the CEO's office!
-> main_menu
```

**Note:** Barks redirect to `main_menu`, not `start`, to avoid repeating greetings.

---

## Common Properties

| Property | Required For | Default | Description |
|----------|-------------|---------|-------------|
| `id` | All | - | Unique identifier |
| `displayName` | All | - | Display name |
| `npcType` | All | `"phone"` | Interaction mode |
| `storyPath` | All | - | Path to Ink JSON |
| `phoneId` | phone, both | - | Phone item ID |
| `roomId` | person, both | - | Room to appear in |
| `position` | person, both | - | {x,y} or {px,py} |
| `spriteSheet` | person, both | `"hacker"` | Texture key |
| `interactionDistance` | person, both | `80` | Range in pixels |
| `direction` | person, both | `"down"` | Facing direction |

---

## Validation Checklist

### For "phone" Type
- [ ] `id` present
- [ ] `displayName` present
- [ ] `phoneId` present
- [ ] `storyPath` present
- [ ] Phone exists in startItemsInInventory
- [ ] NPC listed in phone's `npcIds` array

### For "person" Type
- [ ] `id` present
- [ ] `displayName` present
- [ ] `roomId` present
- [ ] `position` present with x,y or px,py
- [ ] `storyPath` present
- [ ] Room exists in scenario

### For "both" Type
- [ ] All "phone" requirements
- [ ] All "person" requirements

---

## File Structure

### Planning Documents
```
planning_notes/npc/person/
├── 00_OVERVIEW.md              # System overview
├── 01_SPRITE_SYSTEM.md         # Sprite creation
├── 02_PERSON_CHAT_MINIGAME.md  # Conversation UI
├── 03_DUAL_IDENTITY.md         # Phone + person integration
├── 04_SCENARIO_SCHEMA.md       # JSON schema reference
└── 05_IMPLEMENTATION_PHASES.md # Development roadmap
```

### Implementation Files
```
js/
├── systems/
│   └── npc-sprites.js          # [NEW] Sprite management
├── minigames/
│   └── person-chat/            # [NEW] Person conversation
│       ├── person-chat-minigame.js
│       ├── person-chat-ui.js
│       ├── person-chat-portraits.js
│       └── person-chat-conversation.js
css/
└── person-chat-minigame.css    # [NEW] Conversation styling
```

---

## Quick Debugging

### NPC Not Appearing
1. Check `roomId` matches room in scenario
2. Check `position` has valid x,y or px,py
3. Check `npcType` is "person" or "both"
4. Check console for errors

### Conversation Not Opening
1. Check `storyPath` points to .json (not .ink)
2. Check Ink file compiled successfully
3. Check interaction distance (default 80px)
4. Check player is within range

### Portraits Not Rendering
1. Check sprite exists and has texture
2. Check sprite frame is valid
3. Check RenderTexture created successfully
4. Check canvas rendering in browser console

### State Not Persisting
1. Check using shared InkEngine from NPCManager
2. Check conversation history accessed correctly
3. Check metadata updates in both interfaces
4. Verify single NPC ID used consistently

---

## Performance Tips

### Optimize Portrait Rendering
- Update portraits only when sprite frame changes
- Cache RenderTexture dataURLs
- Use lower resolution for distant NPCs

### Optimize Sprite Count
- Unload NPCs when room not visible
- Use sprite pooling for many NPCs
- Limit animations when off-screen

### Optimize Collision
- Use simple rectangular bodies
- Disable collision for distant NPCs
- Use spatial partitioning for many NPCs

---

## Best Practices

### Scenario Design
- ✅ Use descriptive NPC IDs
- ✅ Position NPCs logically in rooms
- ✅ Give meaningful displayNames
- ✅ Set appropriate interaction distances
- ✅ Test with player movement

### Ink Stories
- ✅ Use `has_greeted` pattern for dual identity
- ✅ Redirect barks to `main_menu`, not `start`
- ✅ Use state variables for progression
- ✅ Reference interaction type in dialogue
- ✅ Keep barks brief (1-2 sentences)

### Code Organization
- ✅ Keep sprite logic in npc-sprites.js
- ✅ Keep conversation logic in person-chat modules
- ✅ Use NPCManager for all state access
- ✅ Emit events for game integration
- ✅ Clean up sprites on room unload

---

## Common Patterns

### Meet Contact in Person After Phone
```ink
VAR met_in_person = false

=== start ===
{ met_in_person:
    Good to see you again!
- else:
    Hey! Good to finally meet face-to-face.
    ~ met_in_person = true
}
-> menu
```

### Context-Aware Greeting
```ink
VAR last_interaction_type = "none"

=== start ===
{ last_interaction_type:
    - "phone": Got your message!
    - "person": Back again?
    - else: Hi there!
}
-> menu
```

### Progressive Trust System
```ink
VAR trust_level = 0

=== menu ===
+ [Ask basic question] -> basic_info
+ {trust_level >= 2} [Ask sensitive question] -> sensitive_info

=== basic_info ===
Sure, I can answer that.
~ trust_level = trust_level + 1
-> menu
```

---

## Testing Workflow

### 1. Create Minimal Scenario
```json
{
  "startRoom": "test",
  "npcs": [
    {
      "id": "test_npc",
      "displayName": "Test NPC",
      "npcType": "person",
      "roomId": "test",
      "position": { "x": 5, "y": 5 },
      "storyPath": "scenarios/ink/test.json"
    }
  ],
  "rooms": {
    "test": { "type": "room_office", "connections": {} }
  }
}
```

### 2. Create Minimal Ink
```ink
=== start ===
Test message!
+ [OK] -> END
```

### 3. Test Steps
1. Load scenario
2. Walk to NPC
3. Check proximity prompt
4. Press E to talk
5. Verify conversation opens
6. Verify portraits render
7. Select choice
8. Verify closes properly

---

## Resources

- **Full Docs:** `planning_notes/npc/person/`
- **NPC Integration Guide:** `docs/NPC_INTEGRATION_GUIDE.md`
- **Ink Documentation:** https://github.com/inkle/ink
- **Example Scenarios:** `scenarios/ceo_exfil.json`

---

## Support

### Issue: "NPC not found"
Check NPC registered in scenario's `npcs` array.

### Issue: "Room not found"
Check `roomId` matches key in scenario's `rooms` object.

### Issue: "Position invalid"
Use either `{x, y}` or `{px, py}`, not a mix.

### Issue: "Portrait blank"
Check sprite texture loaded and frame valid.

### Issue: "State not persisting"
Ensure single InkEngine accessed via NPCManager.

---

**Last Updated:** Phase planning complete, implementation pending.

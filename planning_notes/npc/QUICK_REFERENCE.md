# NPC System Quick Reference

## One-Page Cheat Sheet

### Key Components

```
Event → NPC Manager → Ink Engine → Phone Chat/Bark
```

### File Locations

| Component | Location |
|-----------|----------|
| Ink Scripts (source) | `scenarios/ink/*.ink` |
| Compiled Ink JSON | `scenarios/compiled/*.json` |
| Ink Engine | `js/systems/ink/ink-engine.js` |
| Event System | `js/systems/npc-events.js` |
| NPC Manager | `js/systems/npc-manager.js` |
| Bark System | `js/systems/npc-barks.js` |
| Phone Chat | `js/minigames/phone-chat/phone-chat-minigame.js` |

### Ink Basics

```ink
=== knot_name ===
# speaker: Alice
# type: bark|conversation
# trigger: event_name
Dialogue text here.
~ variable_name = true
+ [Choice 1] -> next_knot
+ [Choice 2] -> other_knot
-> END
```

### Event Emission (in game code)

```javascript
window.npcEvents.emit('event_type', {
  data: 'value',
  timestamp: Date.now()
});
```

### Common Event Types

| Event | Format | Example |
|-------|--------|---------|
| Room | `room_entered:{roomId}` | `room_entered:lab` |
| Item | `item_picked_up:{itemType}` | `item_picked_up:lockpick` |
| Door | `door_unlocked:{roomTo}` | `door_unlocked:server` |
| Minigame | `minigame_completed:{type}:{result}` | `minigame_completed:lockpicking:success` |
| Progress | `progress:{milestone}` | `progress:suspect_found` |

### Scenario JSON Structure

```json
{
  "npcs": {
    "alice": {
      "id": "alice",
      "name": "Alice Chen",
      "role": "Security Analyst",
      "avatar": "assets/npc/avatars/npc_alice.png",
      "inkFile": "scenarios/compiled/scenario_npcs.json",
      "initialKnot": "alice_intro",
      "eventMappings": {
        "room_entered:lab": "alice_room_lab",
        "item_picked_up:lockpick": "alice_item_lockpick"
      }
    }
  }
}
```

### Console Commands

```javascript
// Trigger knot
window.inkEngine.goToKnot('alice', 'alice_hub');

// Open phone
window.MinigameFramework.startMinigame('phone-chat', null, { npcId: 'alice' });

// Show bark
window.npcBarkSystem.showBark('alice', 'Test message', {});

// Emit event
window.npcEvents.emit('room_entered', { roomId: 'lab' });

// Check variable
window.inkEngine.getVariable('alice', 'trust_level');

// Set variable
window.inkEngine.setVariable('alice', 'trust_level', 5);

// Debug mode
window.npcEvents.debug = true;
```

### Ink External Functions

```ink
EXTERNAL give_item(item_type)
EXTERNAL unlock_door(door_id)
EXTERNAL show_notification(message)
EXTERNAL get_current_room()
EXTERNAL has_item(item_type)

// Usage
~ give_item("keycard")
~ unlock_door("door_lab")
~ show_notification("New objective!")
```

### Common Patterns

**Bark on first room entry:**
```ink
=== npc_room_lab ===
# speaker: Alice
# type: bark
{player_in_lab:
    Still searching the lab?
- else:
    You're in the lab! Be careful.
    ~ player_in_lab = true
}
-> END
```

**Conditional conversation choices:**
```ink
=== npc_hub ===
+ [General option] -> general_branch
+ {trust >= 5} [High trust option] -> trust_branch
+ {has_item("keycard")} [I have the keycard] -> keycard_branch
-> END
```

**Trust-based responses:**
```ink
=== npc_greeting ===
{trust >= 7: You've been great. What do you need?}
{trust >= 3 and trust < 7: What's up?}
{trust < 3: What do you want?}
-> END
```

### Compilation

```bash
# Compile Ink to JSON
cd scenarios/ink
inklecate script.ink -o ../compiled/script.json

# Verify
ls -lh ../compiled/script.json
```

### CSS Classes

| Element | Class |
|---------|-------|
| Bark notification | `.npc-bark-notification` |
| Bark avatar | `.npc-bark-avatar` |
| Bark name | `.npc-bark-name` |
| Bark message | `.npc-bark-message` |
| Contact list | `.phone-chat-contacts` |
| Contact item | `.phone-chat-contact` |
| Message thread | `.phone-chat-messages` |
| Message bubble | `.message-bubble` |
| Choice buttons | `.phone-chat-choice-button` |
| Phone button | `.phone-access-button` |

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Barks not appearing | Check `window.npcBarkSystem.init()` called |
| Events not firing | Enable debug: `window.npcEvents.debug = true` |
| Ink errors | Check compiled JSON exists and is valid |
| Phone not opening | Verify minigame registered in framework |
| Wrong dialogue | Check Ink knot name matches event mapping |
| Choices not working | Verify Ink story has choices at current point |

### File Size Reference

- Ink source: ~5-10 KB per scenario
- Compiled JSON: ~15-30 KB per scenario
- ink-js library: ~40 KB
- Total overhead: ~50-70 KB per scenario

### Performance Tips

1. Use cooldowns to limit bark frequency (10-30s)
2. Prioritize important events (progress > items > rooms)
3. Limit active barks to 3 max
4. Auto-dismiss barks after 5s
5. Compress avatar images
6. Cache Ink story instances

### Best Practices

✅ **DO:**
- Keep barks short (1-2 sentences)
- Provide meaningful dialogue choices
- Track important variables
- Use tags for metadata
- Comment complex logic
- Test all branches

❌ **DON'T:**
- Spam barks (use cooldowns)
- Create dead-end conversations
- Forget to compile Ink after edits
- Hardcode game state in Ink
- Ignore trust/relationship mechanics
- Skip testing edge cases

### Integration Points

Add event emissions at these locations:

| File | Function | Event Type |
|------|----------|------------|
| `rooms.js` | `updatePlayerRoom()` | `room_entered/exited` |
| `inventory.js` | `addToInventory()` | `item_picked_up` |
| `interactions.js` | `handleObjectInteraction()` | `object_interacted` |
| `doors.js` | `unlockDoor()` | `door_unlocked` |
| `base-minigame.js` | `complete()` | `minigame_completed` |

### Workflow Summary

1. **Write** `.ink` file
2. **Compile** to `.json`
3. **Configure** NPC in scenario JSON
4. **Map** events to knots
5. **Test** in game
6. **Iterate**

### Resources

- Ink Docs: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- ink-js: https://github.com/y-lohse/inkjs
- Planning Docs: `planning_notes/npc/`

---

**Print this page for quick reference while coding!**

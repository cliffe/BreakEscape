# Quick Reference: Line Prefix & Tag Enhancements
## Ink Writer Cheat Sheet

---

## Line Prefix Syntax

### Basic Speaker Prefix
```ink
SPEAKER_ID: Dialogue text
```

### Examples

**Player:**
```ink
Player: I need to investigate this room.
```

**Specific NPC:**
```ink
test_npc_back: Let me help you with that.
```

**Main NPC Shorthand:**
```ink
npc: This refers to whoever you're talking to.
```

**No Prefix (Defaults to Main NPC):**
```ink
=== greeting ===
Hello there! // Main conversation NPC
Player: Hi!
What brings you here? // Also main NPC
```

---

## Narrator Syntax

### Basic Narrator (No Portrait)
```ink
Narrator: The room falls silent.
Narrator: Outside, rain begins to fall.
```

### Narrator with Character in View
Show narrative text while keeping a specific character's portrait visible:

```ink
Narrator[test_npc_back]: The technician shifts nervously.
Narrator[Player]: You feel a sense of dread.
Narrator[security_guard]: The guard's hand moves toward his weapon.
```

### Narrator with Explicit No Portrait
```ink
Narrator[]: The hallway is completely empty.
```

**When to use each:**
- `Narrator:` - Default, no portrait (scene descriptions)
- `Narrator[character]:` - Focus on specific character during narration
- `Narrator[]` - Explicitly empty scene (same as default, more clear)

---

## NPC Behavior Tags

### Basic Syntax
```ink
# BEHAVIOR_TAG:TARGET_SPEC
```

### Target Specifications

#### 1. No Target (Main NPC)
```ink
test_npc_back: You betrayed me!
# hostile
// Makes test_npc_back hostile
```

#### 2. Single NPC
```ink
# hostile:security_guard
// Makes security_guard hostile
```

#### 3. Multiple NPCs (Comma-Separated)
```ink
# hostile:guard_1,guard_2,guard_3
// All three guards become hostile
```

#### 4. Wildcard Pattern
```ink
# hostile:guard_*
// All NPCs with IDs starting with "guard_"

# hostile:scientist_*,engineer_*
// Multiple patterns supported
```

#### 5. All NPCs in Room
```ink
# hostile:all
// Every NPC in the current room
```

### Behavior Tags

**`hostile`** - Make NPC(s) aggressive/hostile
```ink
# hostile
# hostile:npc_id
# hostile:npc1,npc2
# hostile:pattern_*
# hostile:all
```

**`friendly`** - Make NPC(s) non-aggressive/friendly
```ink
# friendly
# friendly:npc_id
# friendly:guard_*
```

**`influence`** - Modify relationship score
```ink
# influence:npc_id:+10
# influence:npc_id:-20
# influence:receptionist_*:+15
```

---

## Complete Examples

### Multi-Character Conversation with Narrator
```ink
=== tense_standoff ===
test_npc_back: We need to talk about what you did.
Narrator[test_npc_back]: His hand trembles slightly.
Player: I can explain.
Narrator[Player]: You feel the weight of their stares.
test_npc_front: Make it quick.
Narrator: The room holds its breath.
```

### Group Behavior Change
```ink
=== alarm_triggered ===
security_guard: INTRUDER ALERT!
Narrator: Klaxons blare throughout the facility.
# hostile:guard_*
Narrator[Player]: Every guard in the building is now hunting you.
Player: Time to run!
```

### Conditional Behavior
```ink
VAR insulted_scientists = false

=== lab_entrance ===
{insulted_scientists:
    lead_scientist: You're not welcome here anymore.
    # hostile:scientist_*
    Narrator: The entire research team glares at you.
- else:
    lead_scientist: Welcome to the lab!
    # friendly:scientist_*
    Narrator: The scientists smile warmly.
}
```

### Mixed Format (Backward Compatible)
```ink
=== old_and_new ===
# speaker:npc:test_npc_back
This line uses old tag-based format.
test_npc_back: This line uses new prefix format.
# unlock_door:ceo
test_npc_back: The door is now unlocked!
# hostile:security_*
Narrator[test_npc_back]: He realizes the alarm will trigger soon.
Player: We need to hurry!
```

---

## Best Practices

### ✅ DO

**Use prefixes for speaker clarity:**
```ink
test_npc_back: I'm the back office technician.
test_npc_front: And I'm the front desk technician.
Player: Nice to meet you both!
```

**Use narrator for scene descriptions:**
```ink
Narrator: Thunder rumbles in the distance.
Narrator: The lights flicker ominously.
```

**Use narrator with character for dramatic focus:**
```ink
Narrator[villain]: A cruel smile crosses their face.
```

**Use default speaker for simple conversations:**
```ink
=== simple_chat ===
Hey there, need some help? // Main NPC
Player: Yes, please!
What do you need? // Main NPC
```

**Use behavior tag enhancements for groups:**
```ink
# hostile:all // Simple and clear
# hostile:guard_1,guard_2,guard_3 // Explicit control
# hostile:guard_* // Pattern for flexibility
```

### ❌ DON'T

**Don't mix speaker prefix with speaker tag:**
```ink
# speaker:player
Player: This is redundant and confusing
```

**Don't use narrator for dialogue:**
```ink
// Wrong:
Narrator: "Hello," says the guard.

// Correct:
security_guard: Hello.
```

**Don't forget the space after colon:**
```ink
// Wrong:
Player:Hello!

// Correct:
Player: Hello!
```

---

## Debugging Tips

### Check Console Logs

**Speaker detection:**
```
🎯 Speaker detected from prefix: test_npc_back
```

**Narrator mode:**
```
📖 Narrator with character: test_npc_back
```

**NPC targeting:**
```
🎯 NPC target: pattern "guard_*"
🔍 Pattern "guard_*" matched: [guard_1, guard_2, guard_3]
```

**Block building:**
```
📦 Built 3 dialogue block(s) from 8 line(s)
📋 Displaying line 1/2 from block 2/3: test_npc_front
```

### Common Issues

**Portrait not showing during narrator:**
- Check character ID spelling: `Narrator[test_npc_back]:`
- Verify NPC exists in current room
- Check console for "Narrator character not found" warning

**Behavior tag not working:**
- Verify NPC ID is correct
- Check if NPC is in current room (for pattern matching)
- Look for "No NPCs found" warning in console

**Speaker not changing:**
- Verify prefix format: `SPEAKER: ` (note space after colon)
- Check for typos in speaker ID
- Ensure speaker ID matches NPC ID or "Player"

---

## Migration from Old Format

### Before (Tag-Based)
```ink
=== conversation ===
# speaker:npc:test_npc_back
Welcome!
# speaker:player
Hello!
# speaker:npc:test_npc_back
How can I help?
```

### After (Prefix-Based)
```ink
=== conversation ===
test_npc_back: Welcome!
Player: Hello!
test_npc_back: How can I help?
```

**Both formats work!** Choose what's clearest for your content.

---

## Version Compatibility

✅ **Backward Compatible** - All existing Ink files work unchanged
✅ **Forward Compatible** - New features work with existing system
✅ **Mix and Match** - Can use old and new syntax together

# Quick Reference: Line Prefix Speaker Format & Enhancements
## Ink Writer Cheat Sheet (Revised)

---

## Line Prefix Syntax

### Basic Speaker Prefix
```
SPEAKER_ID: Dialogue text
```

### Valid Speaker IDs
- `Player` - Player character (case-insensitive)
- `npc` - Main conversation NPC (shorthand)
- `test_npc_back` - Specific NPC by ID
- `Narrator` - Narrative passage (no portrait)

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

**No Prefix (Defaults to Current Speaker):**
```ink
=== greeting ===
Hello there! // Uses main NPC from previous context
Player: Hi!
What brings you here? // Also uses main NPC (speaker continuity)
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

### When to Use Each
- `Narrator:` - Default, no portrait (scene descriptions)
- `Narrator[character]:` - Focus on specific character during narration
- `Narrator[]` - Explicitly empty scene (same as `Narrator:`, more clear)

---

## NPC Behavior Tags

### Syntax
```
# BEHAVIOR_TAG:TARGET_SPEC
```

### Target Specifications

#### No Target (Main NPC Only)
```ink
test_npc_back: You betrayed me!
# hostile
// Makes test_npc_back hostile (automatically uses main NPC)
```

#### Single NPC
```ink
# hostile:security_guard
// Makes security_guard hostile
```

#### Multiple NPCs (Comma-Separated)
```ink
# hostile:guard_1,guard_2,guard_3
// All three guards become hostile
```

#### Wildcard Pattern
```ink
# hostile:guard_*
// All NPCs with IDs starting with "guard_"

# hostile:scientist_*,engineer_*
// Multiple patterns supported (scientist_* OR engineer_*)
```

#### All NPCs in Room
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
# influence::+10              // Main NPC +10 relationship
# influence:npc_id:+10        // Specific NPC +10
# influence:npc_id:-20        // Specific NPC -20
# influence:receptionist_*:+15 // All receptionists +15
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

### Mixed Format (Old Tags + New Prefixes)
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

### Speaker Continuity
```ink
=== continuity_test ===
test_npc_back: This is line one from this speaker.
This is line two, still from test_npc_back (no prefix needed).
Line three also continues with test_npc_back.
Player: Now the speaker changes.
This is from the player.
test_npc_back: Back to the technician.
```

### First Line Without Prefix
```ink
=== default_speaker ===
// First line with no prefix - uses main NPC (test_npc_back in this context)
Let me help you understand the system.
test_npc_front: I'm here too!
Player: Thanks both of you.
// Now without prefix - uses most recent (Player, from previous line)
I really appreciate this.
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
What do you need? // Main NPC (no prefix needed)
```

**Use behavior tag enhancements for groups:**
```ink
# hostile:all         // Simple and clear - affects whole room
# hostile:guard_1,guard_2,guard_3  // Explicit control - specific NPCs
# hostile:guard_*     // Pattern for flexibility - any NPC starting with "guard_"
```

**Leverage speaker continuity:**
```ink
=== efficient_dialogue ===
test_npc_back: I need to tell you something important.
It involves security and it can't wait.
The situation is getting worse.
// No need to repeat "test_npc_back:" for each line!
```

### ❌ DON'T

**Don't mix speaker prefix with speaker tag (redundant):**
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

**Don't use speaker ID that doesn't exist:**
```ink
// Wrong - nonexistent_npc doesn't exist:
nonexistent_npc: This won't work!

// Correct - use actual NPC ID:
test_npc_back: This will work.
```

**Don't rely on empty text after prefix:**
```ink
// This won't work:
Player:    (empty dialogue after colon)

// These work:
Player: Hello!
Hello!  (unprefixed, uses current speaker)
```

---

## Troubleshooting

### Speaker Not Showing/Changing

**Check for:**
1. Spelling of speaker ID (case-insensitive but must be exact otherwise)
2. NPC exists in current room
3. Space after colon: `Speaker: Text` (not `Speaker:Text`)
4. Console warnings about speaker not found

**Example Debug:**
```
❌ "test_npc_bak: Hello!" 
   (typo: should be "test_npc_back")

✅ "test_npc_back: Hello!"
```

### Narrator Not Showing/Wrong Character

**Check for:**
1. Character ID spelling exactly matches NPC ID
2. Character exists in current room (for Narrator[id]:)
3. Using correct syntax: `Narrator[character_id]:` not `Narrator(character_id):`

**Example Debug:**
```
❌ "Narrator[test_npc_Back]: Text"
   (case mismatch with actual ID: test_npc_back)

✅ "Narrator[test_npc_back]: Text"
```

### Behavior Tag Not Working

**Check for:**
1. NPC ID is correct (typos won't error, just won't match)
2. NPC exists in current room (for pattern matching and "all")
3. Wildcard pattern is correct (only * for any characters)
4. Using supported behavior tags (hostile, friendly, influence, suspicious)

**Example Debug:**
```
❌ "# hostile:guard_"
   (no wildcard - would need: guard_* to match multiple)

✅ "# hostile:guard_*"
   (matches: guard_1, guard_2, guard_front, etc.)
```

### Empty Line After Prefix

**Problem:**
```ink
Player: 
// Empty text after colon - won't be recognized as prefix
```

**Solution:**
If you want empty dialogue, use unprefixed:
```ink
Player: (Silence)  // Has content

// or just:
(Just use narrative description)
```

---

## Migration from Old Format

### Before (Tag-Based, 3 Knots)
```ink
=== conversation ===
# speaker:npc:test_npc_back
Welcome!

=== conversation_cont ===
# speaker:player
Hello!

=== conversation_response ===
# speaker:npc:test_npc_back
How can I help?
```

### After (Prefix-Based, 1 Knot)
```ink
=== conversation ===
test_npc_back: Welcome!
Player: Hello!
test_npc_back: How can I help?
```

### Comparison
| Aspect | Old Format | New Format |
|--------|-----------|-----------|
| Readability | Verbose, spread across knots | Natural screenplay format |
| Lines Written | 3 knots + 3 tags + 3 dialogue | 1 knot + 3 dialogue |
| Speaker Changes | Requires new knot | Just add next line |
| Learning Curve | Moderate | Intuitive |
| Backward Compatible | N/A | Yes! ✅ |

---

## Version & Compatibility

✅ **Backward Compatible** - All existing Ink files work unchanged  
✅ **Forward Compatible** - New features work with existing system  
✅ **Mix and Match** - Can use old and new syntax together  
✅ **No Writer Retraining** - New format is optional  
✅ **No Content Migration** - Existing conversations work as-is  

---

## Quick Syntax Reference

| Format | Usage | Example |
|--------|-------|---------|
| `Speaker: Text` | Standard dialogue | `Player: Hello!` |
| `npc: Text` | Main NPC shorthand | `npc: How can I help?` |
| `Narrator: Text` | Narrative, no portrait | `Narrator: The door slams.` |
| `Narrator[id]: Text` | Narrative with character | `Narrator[npc_back]: He nods.` |
| `Narrator[]: Text` | Narrative, explicit no portrait | `Narrator[]: Silence.` |
| `# hostile` | Main NPC hostile | `# hostile` |
| `# hostile:id` | Single NPC hostile | `# hostile:guard_1` |
| `# hostile:id1,id2` | Multiple NPCs | `# hostile:guard_1,guard_2` |
| `# hostile:pattern_*` | Pattern match | `# hostile:guard_*` |
| `# hostile:all` | All in room | `# hostile:all` |

---

## Resources

- **Implementation Plan:** `IMPLEMENTATION_PLAN_REVISED.md`
- **Overview:** `OVERVIEW_REVISED.md`  
- **Test File:** `scenarios/ink/test-line-prefix.ink`
- **For Developers:** `review/REVIEW1.md` for technical details

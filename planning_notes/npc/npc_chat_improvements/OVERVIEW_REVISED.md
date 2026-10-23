# Person-Chat Minigame: Line Prefix Speaker Format (Revised)

## Date
November 23, 2025

## Executive Summary

This document describes improvements to the person-chat minigame enabling cleaner per-line speaker specification using a natural dialogue prefix format (`Speaker: Text`). The design maintains 100% backward compatibility with existing tag-based conversations while providing significant quality-of-life improvements for content creators.

**Key Goals:**
1. ✅ Make multi-NPC conversations more readable and easier to write
2. ✅ Add native narrator/narrative passage support
3. ✅ Maintain full backward compatibility with existing content
4. ✅ Minimize performance impact
5. ✅ Improve code maintainability through refactoring

---

## Current System

### Tag-Based Speaker Detection

The current system uses Ink tags to specify speakers. Example from existing conversation:

```ink
=== colleague_introduction ===
# speaker:npc:test_npc_front
Nice to meet you! I'm the lead technician here.
-> player_question

=== player_question ===
# speaker:player
What kind of work do you both do here?
-> response
```

### How It Works
- **Tags Applied Per Knot:** Speaker tags mark the start of each Ink knot/stitch
- **Block-Level:** Tags apply to all text until the next tag is encountered  
- **Mixed Concerns:** Speaker tags coexist with game action tags (`# unlock_door:ceo`)
- **Speaker Detection:** `determineSpeaker()` method parses tags to find the most recent speaker tag
- **Defaults to Main NPC:** When no tags present, conversation defaults to the initiating NPC

### Supported Formats
- `# speaker:player` → Player character
- `# speaker:npc` → Main NPC (conversation initiator)
- `# speaker:npc:test_npc_back` → Specific NPC by ID
- `# player` → Shorthand for player
- `# npc` → Shorthand for main NPC

### Current Limitations
1. **Verbose for multi-speaker scenes** - Each speaker change requires a new knot/stitch with tag
2. **Mixed concerns** - Speaker identification mixed with game actions in tag system
3. **Not line-granular** - Difficult to have multiple speakers within a single knot
4. **No narrator support** - No dedicated way to write narrative-only passages
5. **Writer burden** - Authors must remember to add tags for every speaker change
6. **Maintenance issue** - `determineSpeaker()` method exists but isn't used; speaker detection is hardcoded in another function

---

## Proposed Solution: Line Prefix Format

### Core Concept

Parse each dialogue line for an optional `SPEAKER_ID: Text` prefix, enabling per-line speaker specification without requiring new Ink knots.

### Syntax

#### Basic Format
```
SPEAKER_ID: Dialogue text here
```

#### Examples

**Multi-NPC Conversation:**
```ink
=== group_meeting ===
test_npc_back: Agent, meet my colleague from the back office.
test_npc_front: Nice to meet you! I'm the lead technician here.
Player: What kind of work do you both do here?
test_npc_back: Well, I handle the front desk operations...
test_npc_front: I manage all the backend systems.
```

**Natural Speaker Changes:**
```ink
=== tense_moment ===
test_npc_back: I have something important to tell you.
Narrator: An awkward silence fills the room.
Player: What is it?
test_npc_back: The secure system has been compromised.
```

**Narrator with Character Portrait:**
```ink
=== character_focus ===
Narrator[test_npc_back]: The technician looks nervous as footsteps approach.
Narrator[]: The hallway falls silent.
Narrator[Player]: You feel a knot forming in your stomach.
```

**Shorthand for Main NPC:**
```ink
=== simple_chat ===
npc: Hey there! How can I help?
Player: I need some information.
npc: Sure, what do you need to know?
```

**Lines Without Prefix Inherit Previous Speaker:**
```ink
=== multi_line ===
test_npc_back: This is the first line from this speaker.
This line continues without a prefix, so it's still from test_npc_back.
test_npc_front: Now the speaker changes.
This is also from test_npc_front.
```

### Key Design Decisions

1. **Speaker ID Validation:** Speaker IDs must match existing characters or special keywords ('player', 'npc', 'narrator'). Invalid IDs are rejected - line is treated as unprefixed.

2. **Empty Text Rejection:** Lines like `"Player: "` (with empty text after colon) are rejected as invalid prefixes - treated as unprefixed lines.

3. **First Colon Only:** Multiple colons in dialogue don't break parsing. Example: `"Player: What time is it: 5pm?"` → speaker='player', text='What time is it: 5pm?'

4. **Case-Insensitive:** Speaker IDs normalize to lowercase for lookup. `"Player:"`, `"player:"`, `"PLAYER:"` all work identically.

5. **Prefix Priority:** If a line has a valid prefix, it takes priority over any tags. This allows mixing old and new formats safely.

6. **Default Speaker:** Lines without prefixes inherit the previous speaker. The first line without a prefix uses tag-based or default speaker (main NPC).

7. **Narrator Variants:**
   - `Narrator: Text` → Narrative passage, no portrait, centered styling
   - `Narrator[npc_id]: Text` → Narrative with specific character's portrait visible
   - `Narrator[]: Text` → Narrative explicitly with no portrait (same as basic)

### Parsing Logic

```
For each dialogue line:
  ↓
  1. Check for Narrator[character]: pattern → narrative with optional character
  2. Check for SPEAKER_ID: pattern → speaker detected
  3. If match found and speaker exists in character index → valid prefix
  4. If no match found or speaker doesn't exist → no prefix (unprefixed line)
  ↓
  If prefixed: Use parsed speaker and text
  If unprefixed:
    - If previous speaker exists: continue with that speaker
    - If no previous speaker: use tag-based or default (main NPC)
```

### Key Advantages

✅ **Natural Readability** - Ink source looks like screenplay/dialogue format  
✅ **Per-Line Granularity** - Change speaker every line without new knots  
✅ **100% Backward Compatible** - All existing tag-based conversations work unchanged  
✅ **Separation of Concerns** - Speaker identification in text, game actions in tags  
✅ **Narrator Support** - Native way to write narrative passages  
✅ **Intuitive for Writers** - Natural dialogue format, minimal learning curve  
✅ **Multi-NPC Friendly** - Perfect for group conversations  
✅ **Code Maintainability** - Enables refactoring to consolidate speaker detection  

### Integration with Existing Systems

**Tags Remain for Actions:**
```ink
=== unlocking_door ===
helper_npc: I can help you with that door.
# unlock_door:ceo
helper_npc: There you go! It's open now.
Player: Thanks!
```

**Choice Display Unchanged:**
```ink
=== decision_point ===
test_npc_back: What would you like to do?
+ [Ask about the mission] → ask_mission
+ [Leave] → leave
```

**State Variables Still Work:**
```ink
VAR has_keycard = false

=== check_keycard ===
{has_keycard:
  Player: I have the keycard now.
  npc: Great! You can access the secure area.
- else:
  Player: I need to find a keycard.
  npc: Check the security office.
}
```

---

## NPC Behavior Tag Enhancements

### Current Limitation

Behavior tags (like `# hostile:npc_id`) currently require explicit NPC IDs:

```ink
test_npc_back: You shouldn't have done that.
# hostile:test_npc_back
```

### Proposed Improvements

#### 1. Default to Main NPC (No ID Required)
```ink
test_npc_back: You shouldn't have done that.
# hostile
// Automatically affects test_npc_back (main conversation NPC)
```

#### 2. Multiple NPCs (Comma-Separated)
```ink
# hostile:guard_1,guard_2,guard_3
// All three guards become hostile
```

#### 3. Wildcard Patterns
```ink
# hostile:guard_*
// All NPCs with IDs starting with "guard_"

# friendly:receptionist_*,manager_*
// All receptionists and managers become friendly

# hostile:all
// Every NPC in current room
```

### Affected Tags
These behavior tags will support new formats:
- `hostile` - Make NPC(s) aggressive
- `friendly` - Make NPC(s) non-aggressive
- `influence` - Modify relationship with NPC(s)
- `suspicious` - Make NPC(s) wary
- Any future behavior-modifying tags

---

## Migration Guide

### For Existing Conversations
**No changes required.** All existing Ink files using tag-based speaker detection work exactly as before.

### For New Conversations
Writers can choose:
1. **Pure prefix format** (recommended for new content) - cleaner, more readable
2. **Pure tag format** (consistency with old content) - works fine
3. **Mixed format** (prefixes for speakers, tags for actions) - flexible approach

### Example Migration

**Before (Tags):**
```ink
=== conversation ===
# speaker:npc:test_npc_back
Welcome to the office.
-> next_part

=== next_part ===
# speaker:player
Thanks for having me.
-> response

=== response ===
# speaker:npc:test_npc_back
Let me show you around.
-> END
```

**After (Prefixes):**
```ink
=== conversation ===
test_npc_back: Welcome to the office.
Player: Thanks for having me.
test_npc_back: Let me show you around.
-> END
```

---

## Technical Considerations

### Performance
- **Line-by-line parsing:** Single regex check per line
- **Minimal overhead:** ~1ms for typical conversations (10-100 lines)
- **Cached speakers:** Current speaker tracked to avoid re-lookup
- **Lazy evaluation:** Only parse when dialogue text present

### Edge Cases Handled
1. **Colons in dialogue:** `Player: What time is it: 5pm?` → correctly parsed
2. **Empty lines:** Ignored/stripped before processing
3. **Multiline blocks:** Lines without prefix inherit current speaker
4. **Invalid speaker IDs:** Treated as unprefixed, no error
5. **Unknown characters:** Gracefully rejected, line treated as unprefixed
6. **Case sensitivity:** All speaker IDs normalized to lowercase for comparison

### Resource Considerations
- **Memory:** Minimal - no persistent data structures added
- **Parsing complexity:** O(n) where n = number of lines (expected)
- **Character lookup:** O(1) using hash map (characters index)

### Compatibility
- **Ink Compiler:** No changes needed (prefixes are just text)
- **inkjs Runtime:** No changes needed  
- **Existing Stories:** 100% backward compatible
- **Rails Backend:** No changes needed (serves pre-compiled JSON)
- **All 20 showDialogue() call sites:** Work unchanged with optional parameters

---

## Technical Limitations

1. **Speaker ID Format:** Must match regex `[A-Za-z_][A-Za-z0-9_]*` - no special characters allowed
2. **Maximum Line Length:** No hard limit, but performance degrades for 10,000+ character lines
3. **Narrator Character Validity:** Character must exist in current room context to display portrait
4. **Pattern Matching:** Simple wildcard support (`*` only), not full regex
5. **Room Context:** NPC behavior tags requiring room lookup depend on `window.currentRoom` being set

---

## Success Criteria

Implementation is successful when:

1. ✅ Existing tag-based conversations work without modification
2. ✅ New prefix-based conversations parse correctly
3. ✅ Speaker changes mid-dialogue block work smoothly
4. ✅ Narrator passages display correctly (no speaker name, special styling)
5. ✅ `Narrator[character]:` shows correct character portrait
6. ✅ Multi-NPC conversations (like test.ink) display perfectly
7. ✅ Performance remains acceptable (< 1ms per line parse)
8. ✅ All code comments updated with explanations
9. ✅ Writer guide created and tested
10. ✅ Zero regression in existing conversations

---

## Future Enhancements

### Emotion Variants
```ink
test_npc_back[angry]: I can't believe you did that!
test_npc_back[happy]: But I'm glad it worked out.
```

### Location Hints  
```ink
test_npc_back@lab: Let me show you the equipment here.
```

### Sound Effects Inline
```ink
Sound[door_slam.mp3]: The door slams shut.
test_npc_back: What was that?!
```

### Background Changes
```ink
Background[office_night.png]: The lights dim as evening falls.
test_npc_back: See? Everything changes at night.
```

---

## References

### Current Implementation
- **Main Minigame:** `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`
- **UI Rendering:** `public/break_escape/js/minigames/person-chat/person-chat-ui.js`
- **Tag Processing:** `public/break_escape/js/minigames/helpers/chat-helpers.js`
- **Styling:** `public/break_escape/css/person-chat-minigame.css`

### Test Cases
- **Multi-NPC Test:** `scenarios/ink/test.ink`
- **New Format Tests:** `scenarios/ink/test-line-prefix.ink` (to be created)

### Related Documentation
- **Writers Guide:** `QUICK_REFERENCE.md`
- **Implementation Plan:** `IMPLEMENTATION_PLAN_REVISED.md`
- **Code Review:** `review/REVIEW1.md`

---

## Conclusion

The proposed line prefix format provides significant quality-of-life improvements for content creators while maintaining complete backward compatibility and minimal performance impact. The feature is additive rather than replacement - existing content works unchanged, and new content can opt into the cleaner syntax.

The architectural refactoring (Phase 0) consolidates scattered speaker detection logic into a single `determineSpeaker()` method, improving maintainability and making it easier to add future speaker detection features.

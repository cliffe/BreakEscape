# Person-Chat Minigame: Line Prefix Speaker Format

## Date
November 23, 2025

## Overview
This document describes the planned improvements to the person-chat minigame to support cleaner per-line speaker specification using a line prefix format.

---

## Current Approach

### Tag-Based Speaker Detection
The current system uses Ink tags to specify who is speaking:

**Example from test.ink:**
```ink
=== colleague_introduction ===
# speaker:npc:test_npc_front
Nice to meet you! I'm the lead technician here. FRONT.
-> player_question

=== player_question ===
# speaker:player
What kind of work do you both do here?
-> front_npc_explains
```

### How It Currently Works
1. **Tags Applied Per Knot**: Speaker tags are placed at the start of each Ink knot/stitch
2. **Block-Level Concern**: Tags apply to all text until the next tag is encountered
3. **Mixed with Action Tags**: Speaker tags (`# speaker:player`) coexist with game action tags (`# unlock_door:ceo`, `# give_item:keycard`)
4. **Speaker Detection**: `determineSpeaker()` method in `person-chat-minigame.js` parses tags in reverse order to find the most recent speaker tag

**Supported Tag Formats:**
- `# speaker:player` → Player character
- `# speaker:npc` → Main NPC (defaults to conversation NPC)
- `# speaker:npc:test_npc_back` → Specific NPC by ID
- `# player` → Shorthand for player (fallback)
- `# npc` → Shorthand for main NPC (fallback)

### Current Limitations

1. **Writer Burden**: Ink authors must remember to add tags for every speaker change
2. **Verbose Multi-Speaker Scenes**: Each speaker change requires a new knot/stitch with a tag
3. **Mixed Concerns**: Speaker identification mixed with game actions in tag system
4. **Not Line-Granular**: Cannot easily have multiple speakers within a single knot without workarounds
5. **No Native Narrator Support**: No dedicated way to specify narrative-only passages (no character portrait)
6. **No Background Control**: Cannot change scene backgrounds mid-conversation

---

## Proposed Approach: Line Prefix Format (Option 1)

### Core Concept
Parse each dialogue line for an optional `SPEAKER_ID: Text` prefix at the start of the line.

### Syntax Examples

**Multi-NPC Conversation:**
```ink
=== group_meeting ===
test_npc_back: Agent, meet my colleague from the back office.
test_npc_front: Nice to meet you! I'm the lead technician here.
Player: What kind of work do you both do here?
test_npc_back: Well, I handle the front desk operations...
test_npc_front: I manage all the backend systems.
```

**Narrative Passages:**
```ink
=== tense_moment ===
test_npc_back: I have something important to tell you.
Narrator: An awkward silence fills the room.
Player: What is it?
```

**Shorthand for Main NPC:**
```ink
=== simple_chat ===
npc: Hey there! How can I help?
Player: I need some information.
npc: Sure, what do you need to know?
```

**Narrator with Character in View:**
```ink
=== character_focus ===
Narrator[test_npc_back]: The technician looks nervous as footsteps approach.
Narrator[Player]: You feel a knot forming in your stomach.
Narrator[]: The hallway falls silent.
```

**Background Changes (Future Enhancement):**
```ink
=== scene_transition ===
test_npc_back: Let me show you something.
Background=office_night.png: The lights dim as evening falls.
test_npc_back: See? Everything changes at night.
```

### Parsing Logic

1. **Line-by-Line Processing**: Each line of text is checked for the prefix pattern
2. **Regex Patterns**: 
   - Basic: `/^([A-Za-z_][A-Za-z0-9_]*|Narrator):\s+(.+)$/`
   - Narrator with character: `/^Narrator\[([A-Za-z_][A-Za-z0-9_]*|)\]:\s+(.+)$/`
   - Capture Group 1: Speaker ID (letters, numbers, underscores)
   - Special cases: "Narrator", "Narrator[character_id]", "Narrator[]"
   - Capture Group 2: Remaining dialogue text
3. **Speaker Lookup**:
   - If prefix matches NPC ID → Use that NPC's portrait/name
   - If prefix is "Player" (case-insensitive) → Use player character
   - If prefix is "npc" → Use main conversation NPC
   - If prefix is "Narrator" → Special narrative styling (no portrait, centered text)
   - If prefix is "Narrator[character_id]" → Narrative text with specified character's portrait
   - If prefix is "Narrator[]" → Narrative text with no portrait
   - If no prefix found → **Default to main NPC** (conversation initiator)
4. **Tag-Based Fallback**: If no prefix detected and within tag context, fall back to existing tag-based speaker detection

### Key Advantages

1. **✅ Natural Readability**: Ink source looks like natural dialogue/screenplay format
2. **✅ Per-Line Granularity**: Change speaker on every single line without new knots
3. **✅ Backward Compatible**: Existing tag-based conversations continue to work
4. **✅ Separation of Concerns**: Speaker identity in text, game actions in tags
5. **✅ Narrator Support**: Built-in way to write narrative passages
6. **✅ Easy to Write**: Intuitive for content creators
7. **✅ Multi-Speaker Friendly**: Perfect for group conversations (see test.ink)

### Integration with Existing Systems

**Tags Remain for Actions:**
```ink
=== unlocking_door ===
helper_npc: I can help you with that door.
# unlock_door:ceo
helper_npc: There you go! It's open now.
Player: Thanks!
```

**Choice Display Still Works:**
```ink
=== decision_point ===
test_npc_back: What would you like to do?
+ [Ask about the mission] -> ask_mission
+ [Leave] -> leave
```

**State Variables Still Function:**
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
NPC behavior tags (like `# hostile:npc_id`) currently **require** an NPC ID parameter:
```ink
test_npc_back: You shouldn't have done that.
# hostile:test_npc_back
```

### Proposed Improvements

#### 1. Default to Main NPC
If no NPC ID is provided, apply to the conversation's main NPC:
```ink
test_npc_back: You shouldn't have done that.
# hostile
// Automatically makes test_npc_back hostile (main conversation NPC)
```

#### 2. Multiple NPC IDs (Comma-Separated List)
Apply behavior to multiple NPCs at once:
```ink
# hostile:guard_1,guard_2,guard_3
// All three guards become hostile simultaneously
```

#### 3. NPC ID Wildcards/Patterns
Apply behavior to NPCs matching a pattern:
```ink
# hostile:guard_*
// All NPCs with IDs starting with "guard_" become hostile

# hostile:all
// All NPCs in the current room become hostile

# friendly:receptionist_*,manager_*
// All receptionists and managers become friendly
```

### Affected Tags
These tags will support the new formats:
- `hostile` - Make NPC(s) aggressive
- `friendly` - Make NPC(s) non-aggressive  
- `influence` - Modify relationship with NPC(s)
- `suspicious` - Make NPC(s) wary of player
- Any future behavior-modifying tags

### Implementation Location
Update `processGameActionTags()` in `js/minigames/helpers/chat-helpers.js` around line 220-240.

---

## Implementation Strategy

### Phase 1: Core Parsing
- Add `parseDialogueLine(text)` utility function
- Extract speaker and cleaned text from line prefix
- Integrate into `determineSpeaker()` method (check prefix first, then fall back to tags)

### Phase 2: Multi-Line Dialogue Handling
- Enhance `displayAccumulatedDialogue()` to detect speaker changes mid-block
- Split dialogue blocks by speaker when prefix changes
- Update `displayDialogueBlocksSequentially()` to handle prefix-based blocks

### Phase 3: Narrator Support
- Detect "Narrator" prefix
- Apply special styling (no portrait, centered/italic text)
- Update CSS for narrator-specific presentation

### Phase 4: Background Changes (Future)
- Parse `Background=path: text` format
- Trigger background image swap in UI
- Add fade/transition effects

### Phase 5: Testing & Documentation
- Test with existing tag-based conversations (backward compatibility)
- Test with new prefix-based conversations
- Test mixed format (tags + prefixes)
- Update documentation for Ink writers

---

## Migration Path

### Existing Conversations
**No changes required.** All existing Ink files using tag-based speaker detection will continue to work exactly as before.

### New Conversations
Writers can choose:
1. **Pure prefix format** (recommended for new content)
2. **Pure tag format** (for consistency with old content)
3. **Mixed format** (prefixes for speakers, tags for actions)

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
- **Minimal overhead**: Single regex check per line
- **Cached speakers**: Current speaker tracked to avoid re-lookup
- **Lazy parsing**: Only parse when dialogue text present

### Edge Cases
1. **Colons in dialogue**: `Player: What time is it: 5pm or 6pm?`
   - Solution: Prefix pattern only matches at line start + requires valid ID format
2. **Multiline dialogue blocks**: Lines without prefix inherit current speaker
3. **Empty lines**: Ignored/stripped before prefix parsing
4. **Invalid speaker IDs**: Fall back to current speaker or main NPC
5. **Case sensitivity**: "Player", "player", "PLAYER" all normalized to 'player'

### Compatibility
- **Ink Compiler**: No changes needed (prefixes are just text)
- **inkjs Runtime**: No changes needed
- **Existing Stories**: 100% backward compatible
- **Rails Backend**: No changes needed (serves pre-compiled JSON)

---

## Success Criteria

1. ✅ Existing tag-based conversations work without modification
2. ✅ New prefix-based conversations parse correctly
3. ✅ Speaker changes mid-dialogue block work smoothly
4. ✅ Narrator passages display without portraits
5. ✅ Multi-NPC conversations (like test.ink) display correctly
6. ✅ Performance remains acceptable (no noticeable lag)
7. ✅ Ink writers find the new format intuitive

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

### Sound Effects
```ink
Sound=door_slam.mp3: The door slams shut.
test_npc_back: What was that?!
```

---

## References

- **Current Implementation**: `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`
- **Test Case**: `scenarios/ink/test.ink` (multi-NPC conversation)
- **Tag Processing**: `public/break_escape/js/minigames/helpers/chat-helpers.js`
- **UI Rendering**: `public/break_escape/js/minigames/person-chat/person-chat-ui.js`

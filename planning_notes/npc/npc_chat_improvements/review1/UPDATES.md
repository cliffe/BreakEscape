# Implementation Plan Updates
## November 23, 2025

## Summary of Changes

This document describes the enhancements made to the original implementation plan based on new requirements.

---

## 1. Narrator with Character in View

### Problem
Original plan only supported narrator with NO portrait. Need ability to show narrative text while keeping a specific character's portrait visible.

### Solution
Extended narrator syntax to support character specification:

```ink
Narrator[character_id]: Narrative text with character's portrait
Narrator[]: Narrative text with no portrait (explicit)
Narrator: Narrative text with no portrait (default)
```

### Examples
```ink
Narrator[test_npc_back]: The technician looks nervous as footsteps approach.
Narrator[Player]: You feel a knot forming in your stomach.
Narrator[]: The hallway falls silent and empty.
```

### Implementation Changes
- **parseDialogueLine()**: Added regex pattern `/^Narrator\[([A-Za-z_][A-Za-z0-9_]*|)\]:\s+(.+)$/i`
- **Return object**: Added `narratorCharacter` property (string|null)
- **buildDialogueBlocks()**: Track `narratorCharacter` in blocks
- **showDialogue()**: New parameter `narratorCharacter` to show portrait during narrator mode
- **displayDialogueBlocksSequentially()**: Pass `narratorCharacter` to UI

### Use Cases
- **Character focus during narration**: Keep attention on specific NPC while describing scene
- **Internal thoughts**: Show player portrait during narrative internal monologue
- **Camera direction**: Direct player's attention to specific character
- **Emotional beats**: Describe character's emotional state while showing their portrait

---

## 2. Default to Main NPC Speaker

### Problem
Lines without a prefix had unclear default behavior. Should default to main conversation NPC for convenience.

### Solution
Changed default speaker from "no speaker" to "main conversation NPC":

```ink
=== greeting ===
Hello there! // Now defaults to main NPC (whoever you're talking to)
Player: Hi!
How can I help? // Also defaults to main NPC
```

### Implementation Changes
- **buildDialogueBlocks()**: When no prefix and no current block, use `this.npc.id` (main conversation NPC)
- **parseDialogueLine()**: Documentation clarified that null speaker means "use default"
- **Priority order**: Prefix → Current speaker → Main NPC

### Use Cases
- **Simple conversations**: Less verbose for basic NPC-player exchanges
- **Backward compatibility**: Works with existing Ink that doesn't use prefixes
- **Writer convenience**: Don't need prefix for every line in single-NPC conversations

---

## 3. NPC Behavior Tag Enhancements

### Problem
Current behavior tags (e.g., `# hostile:npc_id`) require explicit NPC ID. This is:
- Verbose for single-NPC conversations
- Can't affect multiple NPCs at once
- No pattern matching for groups of NPCs

### Solution
Enhanced tag parameter parsing to support:

#### A. No Parameter → Main NPC
```ink
test_npc_back: You shouldn't have done that.
# hostile
// Makes test_npc_back hostile (main conversation NPC)
```

#### B. Comma-Separated List
```ink
# hostile:guard_1,guard_2,guard_3
// All three guards become hostile simultaneously
```

#### C. Wildcard Patterns
```ink
# hostile:guard_*
// All NPCs with IDs starting with "guard_" become hostile

# hostile:receptionist_*,manager_*
// Multiple patterns supported
```

#### D. "All" Keyword
```ink
# hostile:all
// All NPCs in the current room become hostile
```

### Implementation Changes

**New Helper Functions** (in `chat-helpers.js`):

1. **`parseNPCTargets(param, mainNpcId, currentRoomId)`**
   - Parses tag parameter
   - Returns array of NPC IDs to affect
   - Handles empty, single, list, patterns

2. **`getAllNPCsInRoom(roomId)`**
   - Returns all NPC IDs in a specific room
   - Used for "all" keyword

3. **`getNPCsByPattern(pattern, roomId)`**
   - Converts wildcard pattern to regex
   - Returns matching NPC IDs
   - Searches current room or all NPCs

**Updated Tag Handlers**:
- `hostile`: Now uses `parseNPCTargets()`
- `friendly`: Same enhancement
- `influence`: Support multiple NPCs
- All behavior tags: Consistent parameter parsing

### Affected Tags
- `hostile` - Make NPC(s) aggressive
- `friendly` - Make NPC(s) non-aggressive
- `influence` - Modify relationship with NPC(s)
- `suspicious` - Make NPC(s) wary (future)
- Any behavior-modifying tags

### Use Cases

**Alarm System:**
```ink
=== alarm_triggered ===
security_guard: INTRUDER DETECTED!
# hostile:all
Narrator: Every guard in the building is now hunting you.
```

**Group Reaction:**
```ink
=== insult_everyone ===
Player: You're all idiots!
# influence:scientist_*:-20
Narrator: The entire research team turns hostile.
# hostile:scientist_*
```

**Selective Targeting:**
```ink
=== bribe_guards ===
Player: Here's some money for you two.
# influence:guard_1,guard_2:+30
guard_1: Thanks! We didn't see anything.
guard_2: Our lips are sealed.
```

---

## Testing Requirements

### Narrator with Character Tests
- [ ] `Narrator[npc_id]:` shows NPC portrait with narrative text
- [ ] `Narrator[Player]:` shows player portrait with narrative text
- [ ] `Narrator[]:` explicitly hides portrait
- [ ] `Narrator:` hides portrait (default)
- [ ] Invalid character ID falls back gracefully
- [ ] Narrator styling (italic, centered) applies correctly

### Default Speaker Tests
- [ ] Lines without prefix default to main NPC
- [ ] Mixed prefixed/unprefixed lines work correctly
- [ ] Player can still be specified with prefix
- [ ] Tag-based detection still works as fallback

### NPC Behavior Tag Tests
- [ ] `# hostile` (no ID) affects main conversation NPC
- [ ] `# hostile:npc1,npc2,npc3` affects all listed NPCs
- [ ] `# hostile:guard_*` matches pattern correctly
- [ ] `# hostile:all` affects all NPCs in room
- [ ] Invalid patterns fail gracefully
- [ ] Multiple patterns work: `# hostile:guard_*,scientist_*`
- [ ] Empty room handles "all" correctly

---

## Documentation Updates Needed

### Ink Writer Guide
- Add narrator with character syntax examples
- Document default speaker behavior
- Add NPC behavior tag enhancements section
- Include pattern matching examples
- Add "Common Patterns" section with use cases

### Code Comments
- Update `parseDialogueLine()` JSDoc
- Update `showDialogue()` JSDoc
- Document `parseNPCTargets()` thoroughly
- Add inline comments for pattern matching logic

### Architecture Docs
- Update NPC behavior tag format specification
- Document narrator character view system
- Add default speaker resolution flowchart

---

## Timeline Impact

**Original Estimate:** 8-13 hours
**New Estimate:** 10-16 hours

**Additional Time:**
- Phase 4 (Narrator): +0.5 hours (narrator character support)
- Phase 6 (NPC Tags): +2-3 hours (new phase)
- Phase 7 (Docs): +0.5 hours (additional documentation)

---

## Backward Compatibility

✅ **All changes are backward compatible:**

1. **Narrator**: Original `Narrator:` syntax still works
2. **Default Speaker**: Unprefixed lines still work (now defaults to main NPC instead of undefined)
3. **NPC Tags**: Existing tags with explicit IDs work unchanged

❌ **No breaking changes** - all existing Ink files will work exactly as before.

---

## Future Enhancements (Not in This Plan)

### Background Image Control
```ink
Background[office_night.png]: The lights dim as evening falls.
```

### Multiple Character Portraits
```ink
Group[test_npc_back,test_npc_front]: The two technicians exchange glances.
```

### Camera/Focus Control
```ink
Focus[test_npc_back]: The camera zooms in on their worried expression.
```

### Emotion/Expression Control
```ink
test_npc_back[worried]: I'm not sure this is a good idea.
```

These would require additional UI work and are deferred to future iterations.

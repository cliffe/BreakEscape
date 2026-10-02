# Corrections to Planning Documents

## Issue: Incorrect Ink Pattern Usage

### Problem

Several planning documents show examples using `-> END` after `#exit_conversation`, which is **incorrect** based on the existing codebase patterns.

### Correct Pattern

Based on existing Ink files (e.g., `helper-npc.ink`), the correct pattern is:

```ink
=== some_knot ===
# speaker:npc
Dialogue here...
# exit_conversation
-> hub
```

**NOT:**
```ink
=== some_knot ===
# speaker:npc
Dialogue here...
# exit_conversation
-> END
```

### Key Principle

**NEVER use `-> END`** in our Ink files. **ALWAYS use `-> hub`** to return to the hub, even after `#exit_conversation`.

The `#exit_conversation` tag tells the game engine to close the conversation UI, but the Ink flow still needs to resolve to a valid state (the hub).

---

## Exit Conversation Tag - Already Implemented ✅

**Good News**: The `#exit_conversation` tag is **already handled** in the codebase.

**Location**: `/js/minigames/person-chat/person-chat-minigame.js` line 537:
```javascript
const shouldExit = result?.tags?.some(tag => tag.includes('exit_conversation'));
```

When this tag is detected, the minigame:
1. Shows the NPC's final response
2. Schedules the conversation to close
3. Saves the NPC conversation state
4. Exits the minigame

**No additional handler needed** for `#exit_conversation` - it works out of the box.

---

## Hostile Tag - Needs Implementation ❌

**Required**: The `#hostile` tag needs to be added to the tag processing system.

**Location**: `/js/minigames/helpers/chat-helpers.js`

**Where to Add**: In the `processGameActionTags()` function switch statement (around line 60), add:

```javascript
case 'hostile': {
    const npcId = param || window.currentConversationNPCId;

    if (!npcId) {
        result.message = '⚠️ hostile tag missing NPC ID';
        console.warn(result.message);
        break;
    }

    console.log(`🔴 Processing hostile tag for NPC: ${npcId}`);

    // Set NPC to hostile state
    if (window.npcHostileSystem) {
        window.npcHostileSystem.setNPCHostile(npcId, true);
        result.success = true;
        result.message = `⚠️ ${npcId} is now hostile!`;
    } else {
        result.message = '⚠️ Hostile system not initialized';
        console.warn(result.message);
    }

    // Emit event for other systems
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('npc_became_hostile', { npcId });
    }

    break;
}
```

**Tag Format**:
- `#hostile:npcId` - Make specific NPC hostile
- `#hostile` - Make current conversation NPC hostile (uses `window.currentConversationNPCId`)

---

## Files Needing Correction

### 1. implementation_plan.md

**Lines 613, 623** - Example code shows:
```ink
# hostile:security_guard
# exit_conversation
-> END
```

**Should be:**
```ink
# hostile:security_guard
# exit_conversation
-> hub
```

**Line 627** - Instructions say:
> Replace `-> END` with either `-> hub` or `# exit_conversation` + `-> END`

**Should say:**
> Replace `-> END` with either `-> hub` (to continue conversation) or `# exit_conversation` + `-> hub` (to exit conversation)

---

### 2. phase0_foundation.md

**Test Ink File Example** - Shows:
```ink
=== test_hostile ===
# speaker:test_npc
This will trigger hostile mode!
# hostile:security_guard
# exit_conversation
You should now be in combat.
-> END

=== test_exit ===
# speaker:test_npc
This will exit cleanly.
# exit_conversation
Goodbye!
-> END
```

**Should be:**
```ink
=== test_hostile ===
# speaker:test_npc
Triggering hostile state for security guard!
Watch out - they're coming for you!
# hostile:security_guard
# exit_conversation
-> hub

=== test_exit ===
# speaker:test_npc
Exiting the conversation cleanly.
Goodbye, and good luck!
# exit_conversation
-> hub
```

**Note**: The dialogue should come BEFORE the `#exit_conversation` tag, as the conversation closes when that tag is processed. Text after the tag won't be shown.

---

### 3. implementation_roadmap.md

**Phase 7.2 section** - References exit_conversation tag handler needing to be added. This should be removed since it already exists.

---

## Corrected Security Guard Ink Pattern

Here's the correct pattern for updating `security-guard.ink`:

### Current (Incorrect)
```ink
=== hostile_response ===
# speaker:security_guard
~ influence -= 30
That's it. You just made a big mistake.
SECURITY! CODE VIOLATION IN THE CORRIDOR!
# display:guard-aggressive
-> END
```

### Corrected
```ink
=== hostile_response ===
# speaker:security_guard
~ influence -= 30
That's it. You just made a big mistake.
SECURITY! CODE VIOLATION IN THE CORRIDOR!
# display:guard-aggressive
# hostile:security_guard
# exit_conversation
-> hub
```

### Current (Incorrect)
```ink
=== escalate_conflict ===
# speaker:security_guard
~ influence -= 40
You've crossed the line! This is a lockdown!
INTRUDER ALERT! INTRUDER ALERT!
# display:guard-alarm
-> END
```

### Corrected
```ink
=== escalate_conflict ===
# speaker:security_guard
~ influence -= 40
You've crossed the line! This is a lockdown!
INTRUDER ALERT! INTRUDER ALERT!
# display:guard-alarm
# hostile:security_guard
# exit_conversation
-> hub
```

---

## Additional Security Guard Updates Needed

The current `security-guard.ink` file has **8 instances of `-> END`** that need to be addressed:

### Lines needing updates:
- Line 83: `explain_drop` (low influence path)
- Line 99: `claim_official` (low influence path)
- Line 119: `explain_situation` (low influence path)
- Line 134: `explain_files` (low influence path)
- Line 150: `explain_audit` (low influence path)
- Line 159: `hostile_response`
- Line 167: `escalate_conflict`
- Line 180: `back_down`

### Decision Matrix

For each `-> END`, decide:

1. **Should conversation continue?** → Use `-> hub`
2. **Should conversation exit cleanly?** → Use `# exit_conversation` + `-> hub`
3. **Should NPC become hostile?** → Use `# hostile:security_guard` + `# exit_conversation` + `-> hub`

### Recommendations

**Hostile paths (lines 159, 167)**:
- Add `# hostile:security_guard` tag
- Add `# exit_conversation` tag
- Change `-> END` to `-> hub`

**Negative outcome paths that should exit (lines 83, 99, 119, 134, 150)**:
- These are "you've been caught/failed" paths
- Add `# exit_conversation` tag
- Change `-> END` to `-> hub`
- Player can still re-talk to NPC if needed

**Back down path (line 180)**:
- This seems like it should exit conversation
- Add `# exit_conversation` tag
- Change `-> END` to `-> hub`

---

## Corrected Test Ink File

**File**: `/scenarios/ink/test-hostile.ink`

```ink
// test-hostile.ink
// Simple test for hostile tag system

VAR test_count = 0

=== start ===
# speaker:test_npc
~ test_count += 1
Welcome to the hostile tag test.
-> hub

=== hub ===
+ [Test hostile tag]
    -> test_hostile
+ [Test exit conversation]
    -> test_exit
+ [Loop back to start]
    -> start

=== test_hostile ===
# speaker:test_npc
This will trigger hostile mode for the security guard!
Watch out - they're coming for you!
# hostile:security_guard
# exit_conversation
-> hub

=== test_exit ===
# speaker:test_npc
This will exit the conversation cleanly.
Goodbye, and good luck!
# exit_conversation
-> hub
```

---

## Summary of Corrections

1. **Never use `-> END`** - Always use `-> hub`
2. **Exit pattern**: `# exit_conversation` followed by `-> hub` (already works!)
3. **Hostile pattern**: `# hostile:npcId` + `# exit_conversation` + `-> hub`
4. **Hub pattern**: All conversation paths eventually return to hub
5. **Multiple exits**: A conversation can have multiple exit points, all using the same pattern
6. **Exit conversation already implemented**: No need to add handler, it already exists in person-chat-minigame.js

---

## Why This Pattern?

From analyzing `helper-npc.ink` and `person-chat-minigame.js`:

- The hub acts as a central conversation state
- `#exit_conversation` is a **tag** that tells the game engine to close the UI
- This tag is **already detected** in person-chat-minigame.js
- The Ink story still needs to resolve to a valid state (the hub)
- Returning to hub after exit means the NPC state is properly saved
- If player talks to NPC again, conversation starts at `start` knot, not hub
- This pattern allows for proper state management and prevents Ink errors

---

## Action Items

When implementing:

1. ✅ Read this corrections document first
2. ✅ Never use `-> END` in any Ink file
3. ✅ Follow the corrected patterns above
4. ❌ **Don't add** exit_conversation handler - it already exists!
5. ✅ **Do add** hostile tag handler to chat-helpers.js
6. ✅ Test each conversation path thoroughly
7. ✅ Verify `#exit_conversation` closes the UI (should work already)
8. ✅ Verify returning to hub doesn't cause issues
9. ✅ Update security-guard.ink according to recommendations
10. ✅ Create test-hostile.ink with corrected pattern

---

## References

- **Good Example**: `/scenarios/ink/helper-npc.ink` - Perfect hub pattern usage
- **Needs Fixing**: `/scenarios/ink/security-guard.ink` - Has 8 `-> END` instances
- **Exit Tag Implementation**: `/js/minigames/person-chat/person-chat-minigame.js` line 537
- **Tag Processing**: `/js/minigames/helpers/chat-helpers.js` - Add hostile case here
- **Pattern Source**: Lines 68-71 of `helper-npc.ink`:
  ```ink
  + [Thanks, I'm good for now.]
    # speaker:npc
    Alright then. Let me know if you need anything else!
    #exit_conversation
    -> hub
  ```

This is the canonical pattern we should follow everywhere.

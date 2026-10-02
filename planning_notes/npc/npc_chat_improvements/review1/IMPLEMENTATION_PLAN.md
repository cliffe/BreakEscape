# Implementation Plan: Line Prefix Speaker Format
## Actionable Development Guide

**Target Files:**
- `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`
- `public/break_escape/js/minigames/person-chat/person-chat-ui.js`
- `public/break_escape/css/person-chat-minigame.css`
- `public/break_escape/js/minigames/helpers/chat-helpers.js`

**Critical Implementation Notes:**
1. **`determineSpeaker()` is currently unused** - The codebase has this method but doesn't call it. Speaker detection is hardcoded in `createDialogueBlocks()` (line 699). Phase 0 must refactor this.
2. **Function naming** - This plan calls the function `buildDialogueBlocks()` but the codebase has `createDialogueBlocks()`. Use the existing name to minimize breaking changes.
3. **Backward compatibility** - All method signatures use optional parameters with sensible defaults to maintain existing API.
4. **Performance** - Line-by-line parsing adds minimal overhead (~1ms for typical conversations). Caching is not needed initially.

---

## Phase 0: Pre-Implementation Refactoring (NEW)

### 0.1 Consolidate Speaker Detection Logic

**Goal:** Make `determineSpeaker()` the single source of truth for speaker detection

**Current State:**
- `determineSpeaker()` exists but is never called (lines 500-543)
- Speaker detection is hardcoded inline in `createDialogueBlocks()` (line 699)
- This inconsistency will cause maintenance issues

**Changes Required:**

1. **In `createDialogueBlocks()` - Replace inline detection with call to `determineSpeaker()`:**

```javascript
// OLD CODE (line 699):
let speaker = this.npc.id;
if (tag.includes('speaker:player')) {
    speaker = 'player';
} else if (tag.includes('speaker:npc:')) {
    // Extract NPC ID...
}

// NEW CODE:
// First pass through new logic below, then:
const speaker = this.determineSpeaker(result);
```

2. **Add state locking to prevent race conditions:**

```javascript
// Add to constructor:
this.isProcessingDialogue = false;

// Add to displayAccumulatedDialogue():
if (this.isProcessingDialogue) {
    console.log('⏳ Already processing dialogue, ignoring');
    return;
}
this.isProcessingDialogue = true;
// ... process dialogue ...
this.isProcessingDialogue = false;
```

3. **Fix memory leak in PersonChatUI:**

```javascript
// In destroy() or conversation end handler:
destroy() {
    if (this.charactersWithParallax) {
        this.charactersWithParallax.clear();
    }
    // ... other cleanup ...
}
```

**✅ TODO:**
- [ ] Refactor `createDialogueBlocks()` to call `determineSpeaker()` instead of inline logic
- [ ] Add dialogue processing state lock
- [ ] Add cleanup for `charactersWithParallax` Set
- [ ] Verify all existing conversations still work after refactoring
- [ ] No API changes - this is purely internal consolidation

---

## Phase 1: Core Parsing Function

### 1.1 Add parseDialogueLine() Utility

**Location:** `person-chat-minigame.js` (add as new method after `determineSpeaker()`)

**Design Notes:**
- Handles edge cases: empty text after colon, malformed prefixes, Unicode
- Case-insensitive for speaker IDs ("Player", "player", "PLAYER" all normalize to "player")
- Validates speaker IDs exist before accepting them as prefixes
- Returns consistent object structure for all inputs

```javascript
/**
 * Parse a dialogue line for speaker prefix format
 * Format: "SPEAKER_ID: Dialogue text here"
 * 
 * Examples:
 * - "test_npc_back: Hello there!" → { speaker: 'test_npc_back', text: 'Hello there!', hasPrefix: true }
 * - "Player: What's going on?" → { speaker: 'player', text: "What's going on?", hasPrefix: true }
 * - "Narrator: The room falls silent." → { speaker: 'narrator', text: 'The room falls silent.', hasPrefix: true, isNarrator: true, narratorCharacter: null }
 * - "Narrator[test_npc]: She looks worried." → { speaker: 'narrator', text: 'She looks worried.', hasPrefix: true, isNarrator: true, narratorCharacter: 'test_npc' }
 * - "Narrator[]: The hallway is empty." → { speaker: 'narrator', text: 'The hallway is empty.', hasPrefix: true, isNarrator: true, narratorCharacter: null }
 * - "Just regular text" → { speaker: null, text: 'Just regular text', hasPrefix: false }
 * - "Player: " (empty text) → { speaker: null, text: 'Player: ', hasPrefix: false } (ignored - not valid)
 * - "Player: Text with: multiple: colons" → { speaker: 'player', text: 'Text with: multiple: colons', hasPrefix: true } (first colon only)
 * 
 * @param {string} line - Single line of dialogue text
 * @returns {Object} Parsed result with speaker, text, hasPrefix, isNarrator, narratorCharacter
 */
parseDialogueLine(line) {
    if (!line || typeof line !== 'string') {
        return { speaker: null, text: line || '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // Trim the line
    const trimmed = line.trim();
    if (!trimmed) {
        return { speaker: null, text: '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // Check for Narrator with character specification: Narrator[character_id]: text
    const narratorWithCharPattern = /^Narrator\[([A-Za-z_][A-Za-z0-9_]*|)\]:\s+(.+)$/i;
    const narratorMatch = trimmed.match(narratorWithCharPattern);
    
    if (narratorMatch) {
        const characterId = narratorMatch[1] || null; // Empty brackets → null
        const dialogueText = narratorMatch[2];
        
        // Validate dialogue text is not empty
        if (!dialogueText || !dialogueText.trim()) {
            console.warn(`⚠️ Empty dialogue after Narrator prefix: "${trimmed}"`);
            return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
        }
        
        // Normalize character ID if provided
        let normalizedCharacter = null;
        if (characterId) {
            normalizedCharacter = this.normalizeSpeakerId(characterId);
            if (!normalizedCharacter) {
                console.warn(`⚠️ Narrator character not found: ${characterId}`);
                normalizedCharacter = null; // Invalid character - ignore
            }
        }
        
        return {
            speaker: 'narrator',
            text: dialogueText,
            hasPrefix: true,
            isNarrator: true,
            narratorCharacter: normalizedCharacter
        };
    }
    
    // Check for basic speaker prefix: SPEAKER_ID: text
    // Pattern: Word characters (letters, numbers, underscores) or "Narrator" followed by colon and text
    const prefixPattern = /^([A-Za-z_][A-Za-z0-9_]*):\s+(.+)$/i;
    const match = trimmed.match(prefixPattern);
    
    if (!match) {
        // No prefix found - return as-is
        return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // Extract speaker ID and remaining text
    const speakerId = match[1];
    const dialogueText = match[2];
    
    // Validate dialogue text is not empty
    if (!dialogueText || !dialogueText.trim()) {
        console.warn(`⚠️ Empty dialogue after speaker prefix "${speakerId}:"`);
        return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // Normalize speaker ID
    const normalizedSpeaker = this.normalizeSpeakerId(speakerId);
    
    // If speaker ID doesn't normalize to a valid character, reject the prefix
    if (!normalizedSpeaker) {
        return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    return {
        speaker: normalizedSpeaker,
        text: dialogueText,
        hasPrefix: true,
        isNarrator: false,
        narratorCharacter: null
    };
}

/**
 * Normalize speaker ID for consistent lookup
 * 
 * Valid speaker IDs:
 * - 'player' → 'player' (always valid)
 * - 'npc' → main NPC ID (conversation NPC)
 * - specific NPC ID → 'test_npc_back', 'test_npc_front', etc.
 * 
 * Invalid speaker IDs return null:
 * - '' (empty string)
 * - undefined/null
 * - Non-existent NPC IDs
 * 
 * @param {string} speakerId - Raw speaker ID from prefix
 * @returns {string|null} Normalized speaker ID or null if invalid
 */
normalizeSpeakerId(speakerId) {
    if (!speakerId) return null;
    
    const lower = speakerId.toLowerCase();
    
    // Special case: 'player' - always valid
    if (lower === 'player') {
        return 'player';
    }
    
    // Special case: 'npc' shorthand - use main conversation NPC
    if (lower === 'npc') {
        return this.npc?.id || null;
    }
    
    // Check if this character exists in our character index
    if (this.characters && this.characters[speakerId]) {
        return speakerId;
    }
    
    // Try case-insensitive lookup
    const keyLower = Object.keys(this.characters || {}).find(key => key.toLowerCase() === lower);
    if (keyLower) {
        return keyLower;
    }
    
    // Speaker not found
    console.warn(`⚠️ Speaker not found: ${speakerId}`);
    return null;
} Normalized speaker ID
 */
normalizeSpeakerId(speakerId) {
    if (!speakerId) return null;
    
    const lower = speakerId.toLowerCase();
    
    // Handle special cases
    if (lower === 'player') {
        return 'player';
    }
    
    if (lower === 'narrator') {
        return 'narrator';
    }
    
    if (lower === 'npc') {
        // "npc" shorthand refers to the main conversation NPC
        return this.npc.id;
    }
    
    // Check if this is a valid character ID
    if (this.characters[speakerId]) {
        return speakerId;
    }
    
    // Unknown speaker - return as-is (will fall back to current speaker)
    return speakerId;
}
```

**✅ TODO:**
- [ ] Add `parseDialogueLine()` method to PersonChatMinigame class
- [ ] Add `normalizeSpeakerId()` helper method
- [ ] Add unit tests for prefix parsing (various formats)

---

## Phase 2: Integrate Prefix Detection into Speaker Determination

### 2.1 Update determineSpeaker() Method

**Location:** `person-chat-minigame.js` (around line 509)

**Current Code:**
```javascript
determineSpeaker(result) {
    if (!result.tags || result.tags.length === 0) {
        return this.npc.id; // Default to main NPC
    }
    
    // Check tags in reverse order to find the last speaker tag (current speaker)
    for (let i = result.tags.length - 1; i >= 0; i--) {
        // ... existing tag parsing logic
    }
    
    // No speaker tag found - default to main NPC
    return this.npc.id;
}
```

**New Code:**
```javascript
/**
 * Determine who is speaking based on prefix or Ink tags
 * 
 * PRIORITY ORDER:
 * 1. Line prefix (SPEAKER_ID: text) - checked first
 * 2. Ink tags (#speaker:npc, etc.) - fallback
 * 3. Default to main NPC
 * 
 * @param {Object} result - Result from conversation.continue()
 * @param {string} textLine - Optional specific line of text to check for prefix
 * @returns {string} Character ID of speaker
 */
determineSpeaker(result, textLine = null) {
    // Priority 1: Check for line prefix format
    if (textLine || result.text) {
        const lineToCheck = textLine || result.text.split('\n')[0];
        const parsed = this.parseDialogueLine(lineToCheck);
        
        if (parsed.hasPrefix && parsed.speaker) {
            console.log(`🎯 Speaker detected from prefix: ${parsed.speaker}`);
            return parsed.speaker;
        }
    }
    
    // Priority 2: Fall back to tag-based detection (existing logic)
    if (!result.tags || result.tags.length === 0) {
        return this.npc.id; // Default to main NPC
    }
    
    // Check tags in reverse order to find the last speaker tag (current speaker)
    for (let i = result.tags.length - 1; i >= 0; i--) {
        const tag = result.tags[i].trim().toLowerCase();
        
        // Handle multi-part speaker tags like "speaker:npc:test_npc_back"
        if (tag.startsWith('speaker:')) {
            const parts = tag.split(':');
            
            if (parts.length === 2) {
                // Simple speaker tag: speaker:player or speaker:npc
                const speaker = parts[1];
                if (speaker === 'player') return 'player';
                if (speaker === 'npc') return this.npc.id; // Default NPC
            } else if (parts.length === 3) {
                // Specific character tag: speaker:npc:character_id
                const characterId = parts[2];
                return this.characters[characterId] ? characterId : this.npc.id;
            } else if (parts.length > 3) {
                // Handle IDs with colons like speaker:npc:test_npc_back
                const characterId = parts.slice(2).join(':');
                return this.characters[characterId] ? characterId : this.npc.id;
            }
        }
        
        // Fallback for non-speaker: tags
        if (tag === 'player') return 'player';
        if (tag === 'npc') return this.npc.id;
    }
    
    // Priority 3: No speaker detected - default to main NPC
    return this.npc.id;
}
```

**✅ TODO:**
- [ ] Update `determineSpeaker()` to accept optional `textLine` parameter
- [ ] Add prefix check as first priority before tag check
- [ ] Test backward compatibility with tag-based conversations
- [ ] Test prefix-based conversations
- [ ] Test mixed format (tags + prefixes)

---

## Phase 3: Multi-Line Dialogue with Speaker Changes

### 3.1 Update displayAccumulatedDialogue() Method

**Location:** `person-chat-minigame.js` (around line 623)

**Goal:** Detect speaker changes within a dialogue block and split into separate display segments

**New Code:**
```javascript
/**
 * Display accumulated dialogue (handle multi-line text with potential speaker changes)
 * This method splits dialogue by speaker when line prefixes change
 * 
 * @param {Object} result - Result from conversation.continue()
 */
displayAccumulatedDialogue(result) {
    if (!result.text || !result.text.trim()) {
        console.log('⚠️ No text to display in accumulated dialogue');
        return;
    }
    
    // Split text into lines
    const lines = result.text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        console.log('⚠️ No non-empty lines in accumulated dialogue');
        return;
    }
    
    // Build dialogue blocks grouped by speaker
    const dialogueBlocks = this.buildDialogueBlocks(lines, result);
    
    console.log(`📦 Built ${dialogueBlocks.length} dialogue block(s) from ${lines.length} line(s)`);
    
    // Display blocks sequentially
    this.displayDialogueBlocksSequentially(dialogueBlocks, result, 0);
}

/**
 * Build dialogue blocks from lines, grouping by speaker
 * Each block has: { speaker, lines: [...], isNarrator, narratorCharacter }
 * 
 * @param {Array<string>} lines - Array of dialogue lines
 * @param {Object} result - Original Ink result (for tag fallback)
 * @returns {Array<Object>} Array of dialogue blocks
 */
buildDialogueBlocks(lines, result) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        // Parse line for speaker prefix
        const parsed = this.parseDialogueLine(line);
        
        // Determine speaker for this line
        let lineSpeaker;
        if (parsed.hasPrefix && parsed.speaker) {
            // Has prefix - use it
            lineSpeaker = parsed.speaker;
        } else if (currentBlock) {
            // No prefix - continue with current speaker
            lineSpeaker = currentBlock.speaker;
        } else {
            // First line, no prefix - default to main NPC
            lineSpeaker = this.npc.id;
        }
        
        // Get the text to display (stripped of prefix if present)
        const displayText = parsed.hasPrefix ? parsed.text : line;
        
        // Check if we need to start a new block (speaker changed OR narrator character changed)
        const needsNewBlock = !currentBlock || 
                               currentBlock.speaker !== lineSpeaker || 
                               currentBlock.isNarrator !== parsed.isNarrator ||
                               currentBlock.narratorCharacter !== parsed.narratorCharacter;
        
        if (needsNewBlock) {
            // Start new block
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            
            currentBlock = {
                speaker: lineSpeaker,
                lines: [displayText],
                isNarrator: parsed.isNarrator,
                narratorCharacter: parsed.narratorCharacter
            };
        } else {
            // Same speaker - add line to current block
            currentBlock.lines.push(displayText);
        }
    }
    
    // Push final block
    if (currentBlock) {
        blocks.push(currentBlock);
    }
    
    return blocks;
}
```

**✅ TODO:**
- [ ] Add `buildDialogueBlocks()` method
- [ ] Update `displayAccumulatedDialogue()` to use block building
- [ ] Test multi-speaker dialogue (test.ink scenario)
- [ ] Test single-speaker dialogue (backward compatibility)
- [ ] Test narrator interjections

---

### 3.2 Update displayDialogueBlocksSequentially()

**Location:** `person-chat-minigame.js` (around line 751)

**Changes Needed:**
- Accept blocks with `{ speaker, lines: [...], isNarrator }` format
- Handle narrator-specific rendering

**Updated Code:**
```javascript
/**
 * Display dialogue blocks sequentially
 * @param {Array<Object>} blocks - Array of dialogue blocks with { speaker, lines: [...], isNarrator }
 * @param {Object} originalResult - Original result from Ink
 * @param {number} blockIndex - Current block index
 * @param {number} lineIndex - Current line index within the block (default 0)
 * @param {string} accumulatedText - Text accumulated so far for current speaker
 */
displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex = 0, accumulatedText = '') {
    if (blockIndex >= blocks.length) {
        // All blocks displayed, check if story has ended or if there are choices
        if (originalResult.hasEnded) {
            // Story ended - save state and show message
            this.scheduleDialogueAdvance(() => {
                if (this.inkEngine && this.inkEngine.story) {
                    npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                }
                this.ui.showDialogue('(Conversation ended - press ESC to close)', 'system');
                console.log('🏁 Story has reached an end point');
            }, 1000);
        } else if (originalResult.choices && originalResult.choices.length > 0) {
            // Choices available - show them directly without needing another click
            console.log(`📋 All dialogue blocks done, showing ${originalResult.choices.length} choices`);
            // Update lastResult so choice handler has the correct choices
            this.lastResult = originalResult;
            this.ui.showChoices(originalResult.choices);
        } else {
            // Try to continue for more dialogue
            console.log('⏸️ Blocks finished, checking for more dialogue...');
            this.scheduleDialogueAdvance(() => {
                const nextLine = this.conversation.continue();
                
                // Store for choice handling
                this.lastResult = nextLine;
                
                if (nextLine.text && nextLine.text.trim()) {
                    this.displayAccumulatedDialogue(nextLine);
                } else if (nextLine.choices && nextLine.choices.length > 0) {
                    // Back to choices - display them
                    console.log(`📋 Back to choices: ${nextLine.choices.length} options available`);
                    this.ui.showChoices(nextLine.choices);
                } else if (nextLine.hasEnded) {
                    // Story ended - save state and show message
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.ui.showDialogue('(Conversation ended - press ESC to close)', 'system');
                    console.log('🏁 Story has reached an end point');
                }
            }, DIALOGUE_AUTO_ADVANCE_DELAY);
        }
        return;
    }
    
    // Display current block's lines one at a time with accumulation
    const block = blocks[blockIndex];
    const lines = block.lines; // Already cleaned during block building
    
    if (lineIndex >= lines.length) {
        // All lines in this block displayed, move to next block with reset accumulation
        this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
        return;
    }
    
    // Add current line to accumulated text
    const line = lines[lineIndex];
    const newAccumulatedText = accumulatedText ? accumulatedText + '\n' + line : line;
    
    console.log(`📋 Displaying line ${lineIndex + 1}/${lines.length} from block ${blockIndex + 1}/${blocks.length}: ${block.speaker}${block.isNarrator ? ' (NARRATOR)' : ''}${block.narratorCharacter ? ` [${block.narratorCharacter}]` : ''}`);
    
    // Show accumulated text (all lines up to and including current line)
    // Pass isNarrator flag and narratorCharacter for special styling
    this.ui.showDialogue(newAccumulatedText, block.speaker, false, block.isNarrator, block.narratorCharacter);
    
    // Display next line after delay
    this.scheduleDialogueAdvance(() => {
        this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex + 1, newAccumulatedText);
    }, DIALOGUE_AUTO_ADVANCE_DELAY);
}
```

**✅ TODO:**
- [ ] Update block structure handling in `displayDialogueBlocksSequentially()`
- [ ] Pass `isNarrator` flag to UI
- [ ] Test sequential display with speaker changes
- [ ] Verify timing and auto-advance work correctly

---

## Phase 4: Narrator Support in UI

### 4.1 Update showDialogue() in person-chat-ui.js

**Location:** `person-chat-ui.js` (around line 200)

**Current Signature:**
```javascript
showDialogue(text, speaker, preserveChoices = false)
```

**New Signature:**
```javascript
showDialogue(text, speaker, preserveChoices = false, isNarrator = false)
```

**Updated Code:**
```javascript
/**
 * Show dialogue text from a speaker
 * @param {string} text - Dialogue text to display
 * @param {string} speaker - Speaker ID ('player', npc_id, or 'narrator')
 * @param {boolean} preserveChoices - If true, don't hide choices
 * @param {boolean} isNarrator - If true, apply narrator styling
 * @param {string|null} narratorCharacter - Character ID to show portrait for in narrator mode
 */
showDialogue(text, speaker, preserveChoices = false, isNarrator = false, narratorCharacter = null) {
    if (!text) return;
    
    console.log(`🗣️ showDialogue: speaker="${speaker}", isNarrator=${isNarrator}, narratorCharacter="${narratorCharacter || 'none'}", text="${text.substring(0, 50)}..."`);
    
    // Update speaker name and portrait
    if (isNarrator) {
        // Narrator mode - special narrative styling
        this.elements.speakerName.textContent = '';
        this.elements.speakerName.style.display = 'none';
        
        // Add narrator CSS class to dialogue box
        this.elements.dialogueBox.classList.add('narrator-mode');
        
        // Show character portrait if specified, otherwise hide
        if (narratorCharacter) {
            const characterData = this.getCharacterData(narratorCharacter);
            if (characterData) {
                this.portraitRenderer.showPortrait(characterData);
                console.log(`📖 Narrator with character: ${narratorCharacter}`);
            } else {
                this.portraitRenderer.hidePortrait();
                console.warn(`⚠️ Narrator character not found: ${narratorCharacter}`);
            }
        } else {
            this.portraitRenderer.hidePortrait();
        }
    } else {
        // Normal character dialogue
        this.elements.dialogueBox.classList.remove('narrator-mode');
        this.elements.speakerName.style.display = 'block';
        
        const characterData = this.getCharacterData(speaker);
        if (characterData) {
            this.elements.speakerName.textContent = characterData.displayName || characterData.name || speaker;
            this.portraitRenderer.showPortrait(characterData);
        } else {
            this.elements.speakerName.textContent = speaker;
            this.portraitRenderer.hidePortrait();
        }
    }
    
    // Update dialogue text
    this.elements.dialogueText.textContent = text;
    
    // Handle choice visibility
    if (!preserveChoices) {
        this.hideChoices();
    }
    
    // Make dialogue visible
    this.elements.dialogueBox.style.display = 'block';
}
```

**✅ TODO:**
- [ ] Add `isNarrator` parameter to `showDialogue()`
- [ ] Add narrator mode handling (hide portrait, special styling)
- [ ] Update all callers to pass `false` for `isNarrator` (default)
- [ ] Test narrator display vs normal dialogue

---

### 4.2 Add Narrator CSS Styling

**Location:** `css/person-chat-minigame.css`

**Add New Styles:**
```css
/* Narrator mode - narrative text styling */
.person-chat-dialogue-box.narrator-mode {
    background-color: rgba(20, 20, 20, 0.85);
    border-color: #666;
}

.person-chat-dialogue-box.narrator-mode .person-chat-dialogue-text {
    text-align: center;
    font-style: italic;
    color: #ccc;
    font-size: 15px;
    padding: 16px 24px;
}

/* Hide speaker name in narrator mode */
.person-chat-dialogue-box.narrator-mode .person-chat-speaker-name {
    display: none !important;
}
```

**✅ TODO:**
- [ ] Add `.narrator-mode` CSS class styles
- [ ] Test narrator visual appearance
- [ ] Ensure narrator text is visually distinct from character dialogue

---

## Phase 5: Testing & Validation

### 5.1 Create Test Ink File

**Location:** `scenarios/ink/test-line-prefix.ink`

```ink
VAR conversation_started = false

=== start ===
test_npc_back: Welcome! Let's test the new line prefix format.
Player: This looks much cleaner than tags!
test_npc_back: I agree. Let me introduce my colleague.
-> introduce_colleague

=== introduce_colleague ===
test_npc_front: Hi there! I'm the front desk technician.
Player: Nice to meet you!
Narrator: The two NPCs exchange a knowing glance.
test_npc_back: Now that we're all acquainted...
-> mixed_format_test

=== mixed_format_test ===
npc: I can use the "npc" shorthand too.
Player: That's convenient!
test_npc_front: And we can still have multiple speakers.
# unlock_door:test_room
test_npc_back: I just unlocked a door for you using a tag.
-> narrator_test

=== narrator_test ===
Narrator: The room falls silent for a moment.
Narrator: Outside, birds are chirping.
Player: That's a nice touch - narrative passages!
test_npc_back: Glad you like it.
-> narrator_with_character_test

=== narrator_with_character_test ===
Narrator[test_npc_back]: The technician shifts uncomfortably.
Narrator[test_npc_front]: The other technician watches the exchange closely.
Narrator[Player]: You sense the tension in the room.
Narrator[]: The moment passes.
test_npc_back: Let's move on.
-> choices_test

=== choices_test ===
test_npc_front: What would you like to test next?
+ [Test backward compatibility] -> backward_compat_test
+ [Test NPC behavior tags] -> npc_behavior_test
+ [End conversation] -> end

=== npc_behavior_test ===
test_npc_back: Let me demonstrate the new behavior tag features.
Player: What can they do now?
test_npc_back: Watch this - I can affect myself without specifying my ID.
# hostile
test_npc_back: I'm hostile now! (No ID parameter needed)
# friendly
test_npc_back: And now I'm friendly again.
Player: What about multiple NPCs?
test_npc_front: We can both be affected at once.
# hostile:test_npc_back,test_npc_front
test_npc_back: Both of us are now hostile!
test_npc_front: Using a comma-separated list.
# friendly:test_npc_*
test_npc_back: And now we're both friendly via wildcard pattern.
Player: Impressive!
-> end

=== backward_compat_test ===
# speaker:npc:test_npc_back
This line uses the OLD tag-based format.
# speaker:player
And this one too - tags still work!
test_npc_back: But I'm back to using prefixes.
-> end

=== end ===
test_npc_front: Thanks for testing!
Player: This is going to make writing conversations much easier!
Narrator: And scene.
-> END
```

**✅ TODO:**
- [ ] Create test Ink file with all formats
- [ ] Compile to JSON
- [ ] Test in-game with helper_npc or test NPCs

---

### 5.2 Test Cases Checklist

**Backward Compatibility Tests:**
- [ ] Existing tag-based conversations (helper-npc.json, neye-eve.json, etc.) work unchanged
- [ ] Tag-based speaker detection still functions
- [ ] Mixed tag + prefix format works

**Prefix Format Tests:**
- [ ] Single-speaker prefix conversation works
- [ ] Multi-speaker conversation (test.ink style) works
- [ ] Speaker changes mid-block work smoothly
- [ ] "Player:" prefix works (case-insensitive)
- [ ] "npc:" shorthand works
- [ ] Specific NPC IDs work (test_npc_back, test_npc_front)

**Narrator Tests:**
- [ ] "Narrator:" prefix detected
- [ ] Narrator text displays without portrait
- [ ] Narrator styling (italic, centered) applied
- [ ] Narrator mixed with character dialogue works

**Edge Cases:**
- [ ] Empty lines ignored
- [ ] Lines without prefix inherit current speaker
- [ ] Invalid speaker IDs fall back gracefully
- [ ] Colons in dialogue text don't break parsing
- [ ] Multi-line dialogue blocks work

**UI Tests:**
- [ ] Portrait changes when speaker changes
- [ ] Speaker name updates correctly
- [ ] Narrator mode hides portrait correctly
- [ ] Auto-advance timing works
- [ ] Click-through mode works
- [ ] Choice display works after multi-speaker dialogue

---

## Phase 6: NPC Behavior Tag Enhancements

### 6.1 Update processGameActionTags() in chat-helpers.js

**Location:** `js/minigames/helpers/chat-helpers.js` (around line 220)

**Goal:** Allow behavior tags to work without explicit NPC IDs, support multiple NPCs, and pattern matching

**New Helper Function:**
```javascript
/**
 * Parse NPC target specification from tag parameter
 * Supports:
 * - Empty/null → Main conversation NPC
 * - Single ID → That specific NPC
 * - Comma-separated list → Multiple NPCs
 * - Wildcard pattern → Pattern matching (guard_*, all)
 * 
 * @param {string|null} param - Tag parameter
 * @param {string} mainNpcId - Main conversation NPC ID (fallback)
 * @param {string} currentRoomId - Current room ID for "all" pattern
 * @returns {Array<string>} Array of NPC IDs to affect
 */
function parseNPCTargets(param, mainNpcId, currentRoomId) {
    // No parameter - default to main NPC
    if (!param || param.trim() === '') {
        console.log(`🎯 NPC target: main conversation NPC (${mainNpcId})`);
        return [mainNpcId];
    }
    
    const trimmed = param.trim();
    
    // Check for "all" keyword
    if (trimmed.toLowerCase() === 'all') {
        console.log(`🎯 NPC target: ALL in room ${currentRoomId}`);
        return getAllNPCsInRoom(currentRoomId);
    }
    
    // Check for wildcard pattern (contains *)
    if (trimmed.includes('*')) {
        console.log(`🎯 NPC target: pattern "${trimmed}"`);
        return getNPCsByPattern(trimmed, currentRoomId);
    }
    
    // Check for comma-separated list
    if (trimmed.includes(',')) {
        const npcIds = trimmed.split(',').map(id => id.trim()).filter(id => id);
        console.log(`🎯 NPC targets: list [${npcIds.join(', ')}]`);
        return npcIds;
    }
    
    // Single NPC ID
    console.log(`🎯 NPC target: single "${trimmed}"`);
    return [trimmed];
}

/**
 * Get all NPC IDs in a specific room
 * @param {string} roomId - Room ID to search
 * @returns {Array<string>} Array of NPC IDs
 */
function getAllNPCsInRoom(roomId) {
    if (!window.npcManager) {
        console.warn('⚠️ NPCManager not available');
        return [];
    }
    
    const room = window.rooms[roomId];
    if (!room || !room.npcs) {
        console.warn(`⚠️ Room ${roomId} not found or has no NPCs`);
        return [];
    }
    
    return room.npcs.map(npc => npc.id);
}

/**
 * Get NPC IDs matching a wildcard pattern
 * @param {string} pattern - Pattern with * wildcard (e.g., "guard_*")
 * @param {string} roomId - Room ID to search (optional, searches all if not provided)
 * @returns {Array<string>} Array of matching NPC IDs
 */
function getNPCsByPattern(pattern, roomId = null) {
    // Convert wildcard pattern to regex
    // guard_* → /^guard_.*$/
    const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern, 'i'); // Case-insensitive
    
    let npcsToSearch = [];
    
    if (roomId && window.rooms[roomId] && window.rooms[roomId].npcs) {
        // Search in specific room
        npcsToSearch = window.rooms[roomId].npcs;
    } else if (window.npcManager && window.npcManager.npcs) {
        // Search all NPCs
        npcsToSearch = Object.values(window.npcManager.npcs);
    }
    
    const matchingIds = npcsToSearch
        .filter(npc => regex.test(npc.id))
        .map(npc => npc.id);
    
    console.log(`🔍 Pattern "${pattern}" matched: [${matchingIds.join(', ')}]`);
    return matchingIds;
}
```

**Updated hostile tag handler:**
```javascript
case 'hostile':
    {
        // Parse NPC targets (supports empty, single, list, patterns)
        const mainNpcId = window.currentConversationNPCId;
        const currentRoom = window.currentRoom;
        const npcIds = parseNPCTargets(param, mainNpcId, currentRoom);

        if (npcIds.length === 0) {
            result.message = '⚠️ No NPCs found for hostile tag';
            console.warn(result.message);
            break;
        }

        console.log(`🔴 Processing hostile tag for NPCs: [${npcIds.join(', ')}]`);

        // Set all targeted NPCs to hostile state
        let successCount = 0;
        if (window.npcHostileSystem) {
            for (const npcId of npcIds) {
                window.npcHostileSystem.setNPCHostile(npcId, true);
                successCount++;
                
                // Emit event for each NPC
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('npc_became_hostile', { npcId });
                }
            }
            
            result.success = true;
            result.message = successCount === 1 
                ? `⚠️ ${npcIds[0]} is now hostile!`
                : `⚠️ ${successCount} NPCs are now hostile!`;
            
            if (ui) ui.showNotification(result.message, 'warning');
        } else {
            result.message = '⚠️ Hostile system not initialized';
            console.warn(result.message);
        }
    }
    break;
```

**✅ TODO:**
- [ ] Add `parseNPCTargets()` helper function
- [ ] Add `getAllNPCsInRoom()` helper function
- [ ] Add `getNPCsByPattern()` helper function
- [ ] Update `hostile` tag handler to use `parseNPCTargets()`
- [ ] Update `friendly` tag handler (if exists) to use `parseNPCTargets()`
- [ ] Update `influence` tag handler to support multiple NPCs
- [ ] Test with empty parameter (main NPC)
- [ ] Test with list: `# hostile:guard_1,guard_2`
- [ ] Test with pattern: `# hostile:guard_*`
- [ ] Test with "all": `# hostile:all`

---

## Phase 7: Documentation

### 7.1 Update Ink Writer Guide

**Create:** `docs/INK_SPEAKER_PREFIX_GUIDE.md`

**Content:**
```markdown
# Ink Speaker Prefix Guide

## Overview
You can now specify speakers using a clean prefix format at the start of dialogue lines.

## Syntax

### Basic Format
```
SPEAKER_ID: Dialogue text here
```

### Examples

**Player Dialogue:**
```ink
Player: I need to find the keycard.
```

**NPC Dialogue:**
```ink
test_npc_back: I can help you with that.
```

**Multiple NPCs:**
```ink
test_npc_back: Let me introduce my colleague.
test_npc_front: Hello! I handle the security systems.
Player: Nice to meet you both!
```

**Narrator (Narrative Passages):**
```ink
Narrator: The room falls silent.
Narrator: Outside, rain begins to fall.
```

**Shorthand for Main NPC:**
```ink
npc: This refers to whoever you're talking to.
```

## Mixing with Tags

Action tags still work normally:
```ink
test_npc_back: I'll unlock the door for you.
# unlock_door:ceo
test_npc_back: There you go!
```

## Backward Compatibility

Old tag-based format still works:
```ink
=== old_style ===
# speaker:player
This still works fine.
# speaker:npc:test_npc_back
So does this.
```

## Best Practices

1. ✅ **Use prefixes for speaker identification**
2. ✅ **Use tags for game actions** (unlock_door, give_item, etc.)
3. ✅ **Use "Narrator:" for scene descriptions**
4. ✅ **Use "Player:" for player dialogue** (case-insensitive)
5. ✅ **Use "npc:" shorthand for simple conversations**
6. ✅ **Use specific IDs for multi-NPC conversations**
```

**✅ TODO:**
- [ ] Create speaker prefix guide
- [ ] Update main Ink documentation
- [ ] Add examples to NPC_INTEGRATION_GUIDE.md
- [ ] Update copilot-instructions.md

---

### 6.2 Update Code Comments

**Files to Update:**
- [ ] Add comprehensive JSDoc to `parseDialogueLine()`
- [ ] Add comprehensive JSDoc to `buildDialogueBlocks()`
- [ ] Update `determineSpeaker()` JSDoc
- [ ] Update `showDialogue()` JSDoc
- [ ] Add inline comments explaining prefix vs tag priority

---

## Implementation Checklist

### Core Implementation
- [ ] **Phase 1:** Add `parseDialogueLine()` and `normalizeSpeakerId()`
- [ ] **Phase 2:** Update `determineSpeaker()` with prefix priority
- [ ] **Phase 3:** Add `buildDialogueBlocks()` method
- [ ] **Phase 3:** Update `displayAccumulatedDialogue()`
- [ ] **Phase 3:** Update `displayDialogueBlocksSequentially()`
- [ ] **Phase 4:** Update `showDialogue()` with narrator support
- [ ] **Phase 4:** Add narrator CSS styles
- [ ] **Phase 6:** Add NPC behavior tag enhancements
- [ ] **Phase 6:** Add `parseNPCTargets()` helper
- [ ] **Phase 6:** Update behavior tag handlers

### Testing
- [ ] **Phase 5:** Create test Ink file with all formats
- [ ] **Phase 5:** Test backward compatibility (existing conversations)
- [ ] **Phase 5:** Test prefix format (new conversations)
- [ ] **Phase 5:** Test narrator mode
- [ ] **Phase 5:** Test narrator with character: `Narrator[npc_id]:`
- [ ] **Phase 5:** Test multi-speaker conversations
- [ ] **Phase 5:** Test mixed format (tags + prefixes)
- [ ] **Phase 5:** Test edge cases
- [ ] **Phase 6:** Test NPC behavior tags without ID (default to main NPC)
- [ ] **Phase 6:** Test NPC behavior tags with list
- [ ] **Phase 6:** Test NPC behavior tags with wildcards
- [ ] **Phase 6:** Test `# hostile:all` pattern

### Documentation
- [ ] **Phase 7:** Create Ink writer guide
- [ ] **Phase 7:** Update main documentation  
- [ ] **Phase 7:** Update code comments
- [ ] **Phase 7:** Update copilot instructions
- [ ] **Phase 7:** Document NPC behavior tag enhancements

### Deployment
- [ ] Code review
- [ ] Final testing in production-like environment
- [ ] Merge to main branch
- [ ] Notify content creators of new feature

---

## Rollback Plan

If issues arise:

1. **Minimal Risk:** Implementation is additive, not replacement
2. **Quick Disable:** Remove prefix check from `determineSpeaker()` - tags still work
3. **Full Rollback:** Revert commits (prefix parsing is isolated to few methods)
4. **Zero Content Impact:** All existing Ink files work unchanged

---

## Success Metrics

After implementation:

- ✅ 0 regressions in existing conversations
- ✅ test.ink multi-NPC scenario works perfectly
- ✅ Narrator passages display correctly
- ✅ Performance remains < 1ms per line parse
- ✅ Ink writers report improved ease of use
- ✅ Code coverage > 90% for new methods

---

## Timeline Estimate

- **Phase 1-2 (Core):** 2-3 hours
- **Phase 3 (Multi-line):** 2-3 hours  
- **Phase 4 (Narrator):** 1-2 hours
- **Phase 5 (Testing):** 2-3 hours
- **Phase 6 (NPC Tags):** 2-3 hours
- **Phase 7 (Docs):** 1-2 hours

**Total:** ~10-16 hours of development time

---

## Notes

- All changes are backward compatible
- No database migrations needed
- No Rails backend changes needed
- No Ink compiler changes needed
- Can be implemented incrementally
- Easy to test in isolation

# Implementation Plan: Line Prefix Speaker Format (Revised)
## Actionable Development Guide

**Last Updated:** November 23, 2025  
**Status:** Ready for Implementation

**Target Files:**
- `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`
- `public/break_escape/js/minigames/person-chat/person-chat-ui.js`
- `public/break_escape/css/person-chat-minigame.css`
- `public/break_escape/js/minigames/helpers/chat-helpers.js`

---

## Critical Implementation Context

### Current Code State
1. **`determineSpeaker()` exists but is unused** (lines 500-543 in person-chat-minigame.js)
2. **Speaker detection is hardcoded** in `createDialogueBlocks()` (line 699)
3. **Three `showDialogue()` calls** in person-chat-ui.js pass 2-3 parameters (line 216)
4. **20 `showDialogue()` call sites** throughout codebase using 3-parameter signature

### Compatibility Strategy
- **No breaking changes** - All methods use optional parameters with defaults
- **Backward compatible** - Existing tag-based conversations work unchanged
- **Minimal API changes** - Only add optional parameters, don't remove or change existing ones

---

## Phase 0: Pre-Implementation Refactoring (CRITICAL)

### 0.1 Consolidate Speaker Detection Logic

**Current Problem:** Speaker detection happens in two places:
- `determineSpeaker()` method exists but is never called
- `createDialogueBlocks()` has inline speaker detection (line 699-705)

This causes maintenance issues and makes it hard to add new speaker detection features.

**Step 1: Refactor createDialogueBlocks() to use determineSpeaker()**

In `person-chat-minigame.js`, line 699-705 (approximate):

```javascript
// BEFORE: Inline speaker detection
createDialogueBlocks(lines, tags) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        let speaker = this.npc.id;  // ← Hardcoded default
        if (tag.includes('speaker:player')) {
            speaker = 'player';
        } else if (tag.includes('speaker:npc:')) {
            // Extract NPC ID...
        }
        // ... rest of block building
    }
}

// AFTER: Use determineSpeaker()
createDialogueBlocks(lines, tags, result) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        const speaker = this.determineSpeaker(result, line);
        // ... rest of block building
    }
}
```

**Step 2: Add State Locking**

Add to PersonChatMinigame constructor:
```javascript
this.isProcessingDialogue = false;
```

Add to beginning of displayAccumulatedDialogue():
```javascript
if (this.isProcessingDialogue) {
    console.log('⏳ Already processing dialogue, ignoring');
    return;
}
this.isProcessingDialogue = true;
```

Add to end of displayDialogueBlocksSequentially() (all exit paths):
```javascript
this.isProcessingDialogue = false;
```

**Step 3: Fix Memory Leak**

In PersonChatUI, add destroy() or conversation-end cleanup:
```javascript
destroy() {
    if (this.charactersWithParallax) {
        this.charactersWithParallax.clear();
    }
    // ... other cleanup
}
```

**✅ Acceptance Criteria:**
- [ ] All existing tag-based conversations work unchanged
- [ ] No API changes to public methods
- [ ] `determineSpeaker()` is the single source of speaker detection logic
- [ ] No race conditions during rapid dialogue advancement

---

## Phase 1: Core Parsing Functions

### 1.1 Add parseDialogueLine() Method

**Location:** `person-chat-minigame.js` - Add as method after line 543 (after determineSpeaker())

**Purpose:** Parse a single dialogue line for speaker prefix format

**Key Design Decisions:**
1. Validates that dialogue text is not empty (ignores "Speaker: " lines)
2. Case-insensitive speaker IDs ("Player:", "player:", "PLAYER:" all work)
3. First colon is delimiter ("Speaker: Text: with: colons" → speaker="Speaker", text="Text: with: colons")
4. Rejects prefixes where speaker ID doesn't exist in character index
5. Handles Narrator[character_id]: syntax for narrator with character portrait

**Implementation:**

```javascript
/**
 * Parse a dialogue line for speaker prefix format
 * 
 * Formats Supported:
 * - "NPC_ID: Dialogue text" → Speaker detected, text extracted
 * - "Player: Dialogue text" → Player character, case-insensitive
 * - "npc: Dialogue text" → Main conversation NPC shorthand
 * - "Narrator: Text" → Narrative passage, no portrait
 * - "Narrator[npc_id]: Text" → Narrative with character portrait in view
 * - "Narrator[]: Text" → Narrative explicitly with no portrait
 * - "Just text" → No prefix detected, text returned as-is
 * - "Speaker: " → Empty text rejected, no prefix
 * 
 * @param {string} line - Single line of dialogue text
 * @returns {Object} { speaker, text, hasPrefix, isNarrator, narratorCharacter }
 */
parseDialogueLine(line) {
    if (!line || typeof line !== 'string') {
        return { speaker: null, text: line || '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    const trimmed = line.trim();
    if (!trimmed) {
        return { speaker: null, text: '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // Pattern 1: Narrator with optional character: Narrator[character_id]: text
    const narratorWithCharPattern = /^Narrator\[([A-Za-z_][A-Za-z0-9_]*|)\]:\s+(.+)$/i;
    const narratorMatch = trimmed.match(narratorWithCharPattern);
    
    if (narratorMatch) {
        const characterId = narratorMatch[1] || null;
        const dialogueText = narratorMatch[2];
        
        if (!dialogueText || !dialogueText.trim()) {
            console.warn(`⚠️ Empty dialogue after Narrator prefix: "${trimmed}"`);
            return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
        }
        
        let normalizedCharacter = null;
        if (characterId) {
            normalizedCharacter = this.normalizeSpeakerId(characterId);
            if (!normalizedCharacter) {
                console.warn(`⚠️ Narrator character not found: ${characterId}`);
                normalizedCharacter = null;
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
    
    // Pattern 2: Basic speaker prefix: SPEAKER_ID: text
    const prefixPattern = /^([A-Za-z_][A-Za-z0-9_]*):\s+(.+)$/i;
    const match = trimmed.match(prefixPattern);
    
    if (!match) {
        return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    const speakerId = match[1];
    const dialogueText = match[2];
    
    if (!dialogueText || !dialogueText.trim()) {
        console.warn(`⚠️ Empty dialogue after speaker prefix "${speakerId}:"`);
        return { speaker: null, text: trimmed, hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    const normalizedSpeaker = this.normalizeSpeakerId(speakerId);
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
```

### 1.2 Add normalizeSpeakerId() Method

**Location:** `person-chat-minigame.js` - Add as method after parseDialogueLine()

**Purpose:** Convert raw speaker ID to canonical form and validate existence

**Implementation:**

```javascript
/**
 * Normalize speaker ID for consistent lookup
 * 
 * Valid inputs and outputs:
 * - 'player' → 'player' (always valid, special player character)
 * - 'npc' → this.npc.id (main conversation NPC shorthand)
 * - 'test_npc_back' → 'test_npc_back' (if exists in character index)
 * - 'Player' → 'player' (case-insensitive)
 * - 'nonexistent_npc' → null (character not found)
 * 
 * @param {string} speakerId - Raw speaker ID from dialogue line
 * @returns {string|null} Normalized speaker ID, or null if invalid/not found
 */
normalizeSpeakerId(speakerId) {
    if (!speakerId || typeof speakerId !== 'string') {
        return null;
    }
    
    const lower = speakerId.toLowerCase();
    
    // Special case 1: 'player' is always valid
    if (lower === 'player') {
        return 'player';
    }
    
    // Special case 2: 'npc' is shorthand for main conversation NPC
    if (lower === 'npc') {
        return this.npc?.id || null;
    }
    
    // Special case 3: 'narrator' is always valid
    if (lower === 'narrator') {
        return 'narrator';
    }
    
    // Try direct lookup
    if (this.characters && this.characters[speakerId]) {
        return speakerId;
    }
    
    // Try case-insensitive lookup
    if (this.characters) {
        const key = Object.keys(this.characters).find(k => k.toLowerCase() === lower);
        if (key) {
            return key;
        }
    }
    
    // Speaker not found
    console.warn(`⚠️ Speaker ID not found: ${speakerId}`);
    return null;
}
```

**✅ Acceptance Criteria:**
- [ ] `parseDialogueLine()` parses all prefix formats correctly
- [ ] Edge cases handled (empty text, invalid speakers, malformed lines)
- [ ] `normalizeSpeakerId()` returns correct normalized IDs
- [ ] Both methods handle missing/invalid data gracefully
- [ ] Unit tests pass for all formats

---

## Phase 2: Enhance Speaker Determination

### 2.1 Update determineSpeaker() Method

**Location:** `person-chat-minigame.js` - Replace existing method (lines 500-543)

**Key Changes:**
1. Add optional `textLine` parameter to specify which line to check
2. Check for prefix format BEFORE tag-based detection
3. Maintain backward compatibility with existing tag logic

**Implementation:**

```javascript
/**
 * Determine who is speaking based on prefix format OR Ink tags
 * 
 * Priority order:
 * 1. Line prefix format (SPEAKER_ID: text) - if available
 * 2. Ink tags (#speaker:player, #speaker:npc:id, etc.) - fallback
 * 3. Default to main conversation NPC - if no prefix/tags found
 * 
 * @param {Object} result - Result object from conversation.continue()
 * @param {string} textLine - Optional specific line to check for prefix
 *                            If not provided, uses first line of result.text
 * @returns {string} Speaker character ID ('player', NPC ID, or 'narrator')
 */
determineSpeaker(result, textLine = null) {
    // Priority 1: Check for line prefix format
    if (textLine || (result && result.text)) {
        const lineToCheck = textLine || result.text.split('\n')[0];
        const parsed = this.parseDialogueLine(lineToCheck);
        
        if (parsed.hasPrefix && parsed.speaker) {
            console.log(`🎯 Speaker detected from prefix: ${parsed.speaker}`);
            return parsed.speaker;
        }
    }
    
    // Priority 2: Fall back to tag-based detection (existing logic)
    if (!result || !result.tags || result.tags.length === 0) {
        return this.npc?.id || 'player'; // Default to main NPC
    }
    
    // Parse tags in reverse order to find most recent speaker tag
    for (let i = result.tags.length - 1; i >= 0; i--) {
        const tag = result.tags[i].trim().toLowerCase();
        
        if (tag.startsWith('speaker:')) {
            const parts = tag.split(':');
            
            if (parts.length === 2) {
                // Format: speaker:player or speaker:npc
                if (parts[1] === 'player') return 'player';
                if (parts[1] === 'npc') return this.npc?.id || 'player';
            } else if (parts.length >= 3) {
                // Format: speaker:npc:character_id (join all parts after 'speaker:npc:')
                const characterId = parts.slice(2).join(':');
                if (this.characters && this.characters[characterId]) {
                    return characterId;
                }
            }
        }
        // Also support shorthand tags
        else if (tag === 'player') {
            return 'player';
        } else if (tag === 'npc') {
            return this.npc?.id || 'player';
        }
    }
    
    // Default to main conversation NPC
    return this.npc?.id || 'player';
}
```

**Backward Compatibility:**
- ✅ Existing calls without `textLine` parameter still work
- ✅ Falls back to tag-based detection if no prefix found
- ✅ Maintains existing default behavior

**✅ Acceptance Criteria:**
- [ ] Prefix format takes priority over tags
- [ ] Tags still work when no prefix found
- [ ] Default to main NPC when neither prefix nor tags present
- [ ] All 20 existing showDialogue() call sites work unchanged
- [ ] Mixed format (prefix + tags) works correctly

---

## Phase 3: Multi-Line Dialogue with Speaker Changes

### 3.1 Update createDialogueBlocks() to Support Line Prefixes

**Location:** `person-chat-minigame.js` - lines 677-744

**Current State:** Function uses tag-based grouping
**New State:** Function uses line-by-line prefix parsing

**Key Changes:**
1. Now receives `result` object as third parameter (for tag fallback)
2. Parses each line with `parseDialogueLine()`
3. Groups lines by speaker
4. Returns blocks with structure: `{ speaker, text, isNarrator, narratorCharacter }`

**Implementation:**

```javascript
/**
 * Build dialogue blocks from lines, grouping by speaker
 * 
 * Each block represents dialogue from a single speaker before switching.
 * Lines without prefix inherit the previous speaker.
 * First line without prefix defaults to main NPC.
 * 
 * @param {Array<string>} lines - Array of dialogue lines
 * @param {Object} tags - Tag array from result (for backward compatibility)
 * @param {Object} result - Result object for tag-based fallback
 * @returns {Array} Array of blocks: { speaker, text, isNarrator, narratorCharacter }
 */
createDialogueBlocks(lines, tags, result) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        if (!line || !line.trim()) {
            continue; // Skip empty lines
        }
        
        // Parse line for speaker prefix
        const parsed = this.parseDialogueLine(line);
        
        let lineSpeaker;
        let isLineNarrator = false;
        let narratorCharacter = null;
        
        if (parsed.hasPrefix && parsed.speaker) {
            // Prefix found - use parsed speaker
            lineSpeaker = parsed.speaker;
            isLineNarrator = parsed.isNarrator;
            narratorCharacter = parsed.narratorCharacter;
        } else if (currentBlock) {
            // No prefix - continue with current speaker
            lineSpeaker = currentBlock.speaker;
            isLineNarrator = currentBlock.isNarrator;
            narratorCharacter = currentBlock.narratorCharacter;
        } else {
            // First line with no prefix - use tag-based or default
            lineSpeaker = this.determineSpeaker(result);
            isLineNarrator = false;
            narratorCharacter = null;
        }
        
        // Decide whether to add to current block or start new block
        if (currentBlock &&
            currentBlock.speaker === lineSpeaker &&
            currentBlock.isNarrator === isLineNarrator &&
            currentBlock.narratorCharacter === narratorCharacter) {
            // Same speaker - add to current block
            currentBlock.text += '\n' + (parsed.hasPrefix ? parsed.text : line);
        } else {
            // Speaker change - start new block
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            
            currentBlock = {
                speaker: lineSpeaker,
                text: parsed.hasPrefix ? parsed.text : line,
                isNarrator: isLineNarrator,
                narratorCharacter: narratorCharacter
            };
        }
    }
    
    // Don't forget the last block
    if (currentBlock) {
        blocks.push(currentBlock);
    }
    
    return blocks;
}
```

**Update displayAccumulatedDialogue():**

Call `createDialogueBlocks()` with new parameter:

```javascript
displayAccumulatedDialogue(result) {
    if (!result.text || !result.text.trim()) {
        // ... existing checks ...
    }
    
    // Process game action tags
    if (result.tags && result.tags.length > 0) {
        processGameActionTags(result.tags, this.ui);
    }
    
    // Build dialogue blocks (now with prefix support)
    const lines = result.text.split('\n').filter(line => line.trim());
    const dialogueBlocks = this.createDialogueBlocks(lines, result.tags, result);
    
    // Display blocks sequentially
    this.displayDialogueBlocksSequentially(dialogueBlocks, result, 0);
}
```

**✅ Acceptance Criteria:**
- [ ] Lines with prefixes grouped by speaker correctly
- [ ] Lines without prefixes inherit previous speaker
- [ ] First line without prefix uses tag-based or default speaker
- [ ] Multi-speaker conversations display correctly
- [ ] Backward compatible with existing tag-based grouping
- [ ] Performance acceptable (minimal regex overhead)

---

## Phase 4: Narrator Support in UI

### 4.1 Update showDialogue() Signature

**Location:** `person-chat-ui.js` - line 216

**Current Signature:**
```javascript
showDialogue(text, characterId = 'npc', preserveChoices = false)
```

**New Signature:**
```javascript
showDialogue(text, speaker = 'npc', preserveChoices = false, isNarrator = false, narratorCharacter = null)
```

**Implementation Notes:**
- Add two optional parameters at end (backward compatible)
- Parameter 1-3 maintain exact same behavior
- Parameter 4-5 are new narrator features
- All 20 existing call sites work without modification

```javascript
/**
 * Display dialogue text with speaker and optional narrator mode
 * 
 * @param {string} text - Dialogue text to display
 * @param {string} speaker - Speaker character ID (default 'npc')
 * @param {boolean} preserveChoices - Keep choices visible (default false)
 * @param {boolean} isNarrator - Narrative mode (no speaker name, special styling)
 * @param {string|null} narratorCharacter - Character to show in narrator mode
 */
showDialogue(text, speaker = 'npc', preserveChoices = false, isNarrator = false, narratorCharacter = null) {
    if (!text) return;
    
    // ... existing display logic ...
    
    // NEW: Handle narrator mode
    if (isNarrator) {
        // Add narrator-specific styling
        this.elements.dialogueBox.classList.add('narrator-mode');
        this.elements.speakerName.style.display = 'none';
        
        // Show narrator character if specified
        if (narratorCharacter && this.updatePortraitForSpeaker) {
            const characterData = this.characters?.[narratorCharacter];
            if (characterData) {
                this.updatePortraitForSpeaker(narratorCharacter, characterData);
            } else if (narratorCharacter === 'player') {
                // Handle player character
                const playerData = this.playerData || this.characters?.['player'];
                if (playerData) {
                    this.updatePortraitForSpeaker('player', playerData);
                }
            } else {
                // Character not found - hide portrait
                if (this.portraitRenderer) {
                    this.portraitRenderer.hidePortrait();
                }
            }
        } else {
            // No narrator character - hide portrait entirely
            if (this.portraitRenderer) {
                this.portraitRenderer.hidePortrait();
            }
        }
    } else {
        // Regular dialogue mode
        this.elements.dialogueBox.classList.remove('narrator-mode');
        this.elements.speakerName.style.display = 'block';
        
        // Update speaker name and portrait
        if (this.updatePortraitForSpeaker) {
            const characterData = this.characters?.[speaker];
            if (characterData) {
                this.updatePortraitForSpeaker(speaker, characterData);
            }
        }
    }
    
    // ... rest of existing display logic ...
}
```

### 4.2 Update displayDialogueBlocksSequentially()

**Location:** `person-chat-minigame.js` - lines 751-850 (approximate)

**Changes Needed:**
- Pass `isNarrator` and `narratorCharacter` to `showDialogue()`
- Handle narrator block rendering

```javascript
displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex = 0, accumulatedText = '') {
    if (blockIndex >= blocks.length) {
        // ... existing completion logic ...
        return;
    }
    
    const block = blocks[blockIndex];
    const lines = block.text.split('\n').filter(line => line.trim());
    
    if (lineIndex >= lines.length) {
        // Move to next block
        this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
        return;
    }
    
    // Build accumulated text
    const line = lines[lineIndex];
    const newAccumulatedText = accumulatedText ? accumulatedText + '\n' + line : line;
    
    // UPDATED: Pass narrator info to showDialogue
    this.ui.showDialogue(
        newAccumulatedText,
        block.speaker,
        false,
        block.isNarrator || false,
        block.narratorCharacter || null
    );
    
    // Schedule next line
    this.scheduleDialogueAdvance(() => {
        this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex + 1, newAccumulatedText);
    }, DIALOGUE_AUTO_ADVANCE_DELAY);
}
```

### 4.3 Add Narrator CSS Styling

**Location:** `css/person-chat-minigame.css` - Add after existing classes

```css
/* Narrator mode styling */
.person-chat-dialogue-box.narrator-mode {
    background-color: rgba(20, 20, 20, 0.85);
    border-color: #666;
}

.person-chat-dialogue-box.narrator-mode .person-chat-dialogue-text {
    text-align: center;
    font-style: italic;
    color: #ccc;
}

/* Hide speaker name in narrator mode */
.person-chat-dialogue-box.narrator-mode .person-chat-speaker-name {
    display: none !important;
}
```

**✅ Acceptance Criteria:**
- [ ] Narrator passages display without speaker name
- [ ] Narrator mode has distinct visual styling
- [ ] `Narrator[npc_id]:` shows correct character portrait
- [ ] `Narrator[]:` hides portrait entirely
- [ ] All 20 existing showDialogue() calls still work
- [ ] No visual regressions in existing conversations

---

## Phase 4.5: Background Changes Support

### 4.5.1 Add Background Parsing to parseDialogueLine()

**Location:** `person-chat-minigame.js` - Update existing parseDialogueLine()

**Add Background Pattern Recognition:**

```javascript
parseDialogueLine(line) {
    if (!line || typeof line !== 'string') {
        return { speaker: null, text: line || '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    const trimmed = line.trim();
    if (!trimmed) {
        return { speaker: null, text: '', hasPrefix: false, isNarrator: false, narratorCharacter: null };
    }
    
    // NEW: Pattern 1: Background change: Background[filename.ext]: optional text
    const backgroundPattern = /^Background\[([A-Za-z0-9_\-\.]*)\]:\s*(.*)$/i;
    const backgroundMatch = trimmed.match(backgroundPattern);
    
    if (backgroundMatch) {
        const filename = backgroundMatch[1] || null; // Empty string becomes null
        const narrativeText = backgroundMatch[2] || ''; // Optional text after colon
        
        return {
            speaker: null,
            text: narrativeText,
            hasPrefix: true,
            isNarrator: narrativeText.trim() ? true : false, // If text present, treat as narrator
            narratorCharacter: null,
            isBackgroundChange: true, // NEW: Flag as background change
            backgroundImage: filename // NEW: Filename or null to clear
        };
    }
    
    // Pattern 2: Narrator with optional character: Narrator[character_id]: text
    // ... existing narrator pattern ...
    
    // Pattern 3: Basic speaker prefix: SPEAKER_ID: text
    // ... existing speaker pattern ...
}
```

### 4.5.2 Update createDialogueBlocks() for Background Changes

**Location:** `person-chat-minigame.js` - Update existing createDialogueBlocks()

```javascript
createDialogueBlocks(lines, tags, result) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        if (!line || !line.trim()) continue;
        
        // Parse line for speaker prefix OR background change
        const parsed = this.parseDialogueLine(line);
        
        // NEW: Handle background changes as standalone blocks
        if (parsed.isBackgroundChange) {
            // Finish current dialogue block first
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            
            // Add background change block
            blocks.push({
                speaker: null,
                text: parsed.text,
                isBackgroundChange: true,
                backgroundImage: parsed.backgroundImage,
                isNarrator: parsed.isNarrator // True if narrative text present
            });
            
            continue; // Don't include in regular dialogue flow
        }
        
        // ... rest of existing speaker detection logic ...
    }
    
    return blocks;
}
```

### 4.5.3 Add Background Change Method

**Location:** `person-chat-minigame.js` - Add new method

```javascript
/**
 * Change the conversation background image
 * @param {string|null} imageFilename - Filename relative to assets/backgrounds/,
 *                                      or null to clear background
 * @returns {Promise} Resolves when background change complete
 */
async changeBackground(imageFilename) {
    if (!this.ui || !this.ui.portraitRenderer) {
        console.warn('⚠️ Cannot change background - UI not initialized');
        return Promise.resolve();
    }
    
    try {
        if (imageFilename) {
            // Construct full path
            const basePath = '/break_escape/assets/backgrounds/';
            const fullPath = basePath + imageFilename;
            
            console.log(`🖼️ Changing background to: ${imageFilename}`);
            await this.ui.portraitRenderer.setBackgroundAsync(fullPath);
            console.log(`✅ Background changed successfully`);
        } else {
            // Clear background (show default)
            console.log(`🖼️ Clearing background`);
            this.ui.portraitRenderer.clearBackground();
        }
    } catch (error) {
        console.error(`❌ Failed to change background: ${imageFilename}`, error);
        // Continue with current background - don't block dialogue
    }
}
```

### 4.5.4 Update displayAccumulatedDialogue() to Handle Backgrounds

**Location:** `person-chat-minigame.js` - Update existing method

```javascript
displayAccumulatedDialogue(result) {
    if (!result.text || !result.text.trim()) {
        // ... existing checks ...
    }
    
    // Process game action tags
    if (result.tags && result.tags.length > 0) {
        processGameActionTags(result.tags, this.ui);
    }
    
    // Build dialogue blocks (now with prefix + background support)
    const lines = result.text.split('\n').filter(line => line.trim());
    const dialogueBlocks = this.createDialogueBlocks(lines, result.tags, result);
    
    // Display blocks sequentially (handles backgrounds automatically)
    this.displayDialogueBlocksSequentially(dialogueBlocks, result, 0);
}
```

### 4.5.5 Update displayDialogueBlocksSequentially() to Process Backgrounds

**Location:** `person-chat-minigame.js` - Update existing method

```javascript
async displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex = 0, accumulatedText = '') {
    if (blockIndex >= blocks.length) {
        // ... existing completion logic ...
        return;
    }
    
    const block = blocks[blockIndex];
    
    // NEW: Handle background change blocks
    if (block.isBackgroundChange) {
        // Apply background change
        await this.changeBackground(block.backgroundImage);
        
        // If there's accompanying narrative text, display it
        if (block.text && block.text.trim()) {
            this.ui.showDialogue(
                block.text,
                'narrator',
                false,
                true, // isNarrator
                null  // no character portrait
            );
            
            // Brief pause to let user read
            await new Promise(resolve => {
                this.scheduleDialogueAdvance(resolve, 2000); // 2 second pause
            });
        }
        
        // Move to next block
        this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
        return;
    }
    
    // ... rest of existing dialogue display logic ...
}
```

### 4.5.6 Add Portrait Renderer Background Methods

**Location:** `person-chat-portraits.js` - Add new methods

```javascript
/**
 * Set a custom background image (async with promise)
 * @param {string} imagePath - Full path to background image
 * @param {number} transitionDuration - Fade transition time in ms (default 500)
 * @returns {Promise} Resolves when background loaded and applied
 */
setBackgroundAsync(imagePath, transitionDuration = 500) {
    return new Promise((resolve, reject) => {
        if (!imagePath) {
            this.clearBackground();
            resolve();
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            // Optional: Add fade transition
            if (transitionDuration > 0 && this.canvas) {
                this.canvas.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
                this.canvas.style.opacity = '0';
                
                setTimeout(() => {
                    this.backgroundImage = img;
                    this.backgroundPath = imagePath;
                    this.renderFrame();
                    this.canvas.style.opacity = '1';
                    resolve();
                }, transitionDuration / 2);
            } else {
                this.backgroundImage = img;
                this.backgroundPath = imagePath;
                this.renderFrame();
                resolve();
            }
        };
        
        img.onerror = () => {
            console.error(`❌ Failed to load background: ${imagePath}`);
            reject(new Error(`Failed to load background: ${imagePath}`));
        };
        
        img.src = imagePath;
    });
}

/**
 * Clear custom background, return to default
 */
clearBackground() {
    this.backgroundImage = null;
    this.backgroundPath = null;
    this.renderFrame();
    console.log('🖼️ Background cleared');
}

/**
 * Update renderFrame() to draw custom background
 * (Modify existing renderFrame method)
 */
renderFrame() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // NEW: Draw custom background if present
    if (this.backgroundImage) {
        this.ctx.save();
        this.ctx.drawImage(
            this.backgroundImage,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );
        this.ctx.restore();
    } else {
        // Default: fill with black
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw character sprite on top of background
    // ... existing sprite rendering logic ...
}
```

### 4.5.7 Add Background Examples to Test File

**Location:** `scenarios/ink/test-line-prefix.ink` - Add new test section

```ink
=== background_changes_test ===
test_npc_back: Let me show you background changes.
Player: This should be interesting!
-> change_to_night

=== change_to_night ===
test_npc_back: Watch as the environment transforms.
Background[office_night.png]: The lights dim as evening falls.
test_npc_back: See? Everything changes at night.
Player: That's really atmospheric!
-> change_to_security

=== change_to_security ===
test_npc_back: Now let's go somewhere more secure.
Background[security_room.jpg]: You both move to a dimly lit security room.
Player: This place has a completely different feel.
-> clear_background

=== clear_background ===
Background[]: The environment fades away.
Narrator: Leaving only the speakers in focus.
test_npc_back: Perfect for dramatic moments.
-> END
```

**✅ Acceptance Criteria:**
- [ ] Background[] syntax correctly parsed
- [ ] Background images load and display correctly
- [ ] Background[]: (empty) clears background
- [ ] Narrative text with background displays correctly
- [ ] Background without narrative text works silently
- [ ] Invalid background files handled gracefully (error logged, dialogue continues)
- [ ] Smooth transition between backgrounds
- [ ] No performance degradation with background changes
- [ ] Background persists until changed or conversation ends

---

## Phase 5: Testing & Validation

### 5.1 Create Comprehensive Test Ink File

**Location:** `scenarios/ink/test-line-prefix.ink`

This file tests all new features with existing tag-based and new prefix-based dialogue.

```ink
VAR conversation_started = false

=== start ===
test_npc_back: Welcome to the new speaker prefix test! This uses the new format.
Player: This looks much cleaner than tags!
test_npc_back: I agree. Let me introduce my colleague.
-> introduce_colleague

=== introduce_colleague ===
test_npc_front: Hi there! I'm the front desk technician.
Player: Nice to meet you!
Narrator: The two NPCs exchange a knowing glance.
test_npc_back: Now that we're all acquainted...
-> narrator_test

=== narrator_test ===
Narrator: The room falls silent for a moment.
Narrator: Outside, birds are chirping.
Player: That's a nice touch - narrative passages!
test_npc_back: Glad you like it.
-> narrator_with_character_test

=== narrator_with_character_test ===
Narrator[test_npc_back]: The technician shifts uncomfortably.
Narrator[test_npc_front]: The other technician watches closely.
Narrator[Player]: You sense the tension in the room.
Narrator[]: The moment passes.
test_npc_back: Let's move on.
-> mixed_format_test

=== mixed_format_test ===
# speaker:npc:test_npc_front
This line uses the old tag-based format (still works).
# speaker:player
And this one too - tags still work!
test_npc_back: But I'm back to using the new prefix format.
-> npc_behavior_tags_test

=== npc_behavior_tags_test ===
test_npc_back: Let me demonstrate the NPC behavior tag enhancements.
Player: What can they do now?
test_npc_back: I can affect myself without specifying my ID.
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
-> edge_cases_test

=== edge_cases_test ===
Player: Let's test some edge cases.
test_npc_back: Sure thing.
Narrator[]: No character shown here.
Player: What about empty narrator?
test_npc_back: Just tested it.
Player: And what about very long dialogue? Well, let's see what happens when a dialogue line is very long and goes on for many words to test whether the rendering system can handle significantly longer text without breaking or causing performance issues.
test_npc_back: All good!
-> stress_test

=== stress_test ===
// Multiple speakers in rapid succession
test_npc_back: First speaker.
test_npc_front: Second speaker.
Player: Third speaker.
test_npc_back: Back to first.
test_npc_front: Back to second.
Player: Back to third.
-> end

=== end ===
test_npc_front: Thanks for testing!
Player: This is going to make writing conversations much easier!
-> background_changes_test

=== background_changes_test ===
test_npc_back: Let me show you one more thing - background changes!
Player: Ooh, what's this?
Background[office_night.png]: The lights dim as evening falls.
test_npc_back: See? The environment can change during conversations.
Player: That's amazing for storytelling!
Background[]: The background fades to black.
Narrator: And scene.
-> END
```

### 5.2 Test Checklist

**Core Features:**
- [ ] Single-speaker dialogue with prefixes
- [ ] Multi-speaker dialogue (test.ink style)
- [ ] Speaker changes mid-block
- [ ] Lines without prefix inherit previous speaker
- [ ] First line without prefix uses default speaker

**Narrator Mode:**
- [ ] `Narrator: Text` displays without portrait
- [ ] `Narrator[npc_id]: Text` shows character portrait
- [ ] `Narrator[Player]: Text` shows player character
- [ ] `Narrator[]: Text` explicitly shows no portrait
- [ ] Narrator styling distinct from character dialogue

**Backward Compatibility:**
- [ ] Existing tag-based conversations work unchanged
- [ ] Tag-based speaker detection still functions
- [ ] Mixed format (prefixes + tags) works

**Edge Cases:**
- [ ] Empty text after prefix rejected
- [ ] Unknown speaker IDs rejected (no prefix)
- [ ] Colons in dialogue text handled correctly
- [ ] Unicode characters work (if supported)
- [ ] Case-insensitive speaker IDs work
- [ ] Very long dialogue lines render correctly

**NPC Behavior Tags:**
- [ ] `# hostile` affects main NPC (no ID needed)
- [ ] `# hostile:npc1,npc2` affects multiple NPCs
- [ ] `# hostile:npc_*` wildcard pattern works
- [ ] `# hostile:all` affects all NPCs in room
- [ ] Invalid NPC IDs handled gracefully

**Performance:**
- [ ] 10-line conversation: <1ms overhead
- [ ] 100-line conversation: <10ms overhead
- [ ] UI remains responsive during dialogue

**UI/UX:**
- [ ] Portrait changes when speaker changes
- [ ] Speaker name updates correctly
- [ ] No visual glitches or regressions
- [ ] Choice buttons still work after dialogue
- [ ] Click-through mode still works

---

## Phase 6: NPC Behavior Tag Enhancements

### 6.1 Update processGameActionTags() in chat-helpers.js

**Location:** `public/break_escape/js/minigames/helpers/chat-helpers.js` - around line 220

**Add Helper Functions:**

```javascript
/**
 * Parse NPC target specification from tag parameter
 * Supports: empty (main NPC), single ID, comma-list, wildcards, "all"
 * 
 * @param {string} param - Target specification from tag
 * @param {string} mainNpcId - ID of main NPC in conversation
 * @param {string} currentRoomId - Current room ID (from window context)
 * @returns {Array<string>} Array of NPC IDs to affect
 */
function parseNPCTargets(param, mainNpcId, currentRoomId) {
    if (!param || !param.trim()) {
        // No parameter - default to main NPC
        return [mainNpcId];
    }
    
    const trimmed = param.trim();
    
    // Handle "all" keyword
    if (trimmed.toLowerCase() === 'all') {
        console.log(`🎯 NPC target: ALL NPCs in room ${currentRoomId}`);
        return getAllNPCsInRoom(currentRoomId);
    }
    
    // Handle comma-separated list: npc1,npc2,npc3
    if (trimmed.includes(',')) {
        const npcIds = trimmed.split(',').map(id => id.trim()).filter(id => id);
        const validIds = npcIds.filter(id => {
            const exists = npcExists(id);
            if (!exists) {
                console.warn(`⚠️ NPC not found: ${id}`);
            }
            return exists;
        });
        return validIds.length > 0 ? validIds : [mainNpcId];
    }
    
    // Handle wildcard pattern: guard_*
    if (trimmed.includes('*')) {
        const matching = getNPCsByPattern(trimmed);
        return matching.length > 0 ? matching : [mainNpcId];
    }
    
    // Handle single NPC ID
    if (npcExists(trimmed)) {
        return [trimmed];
    }
    
    // Invalid NPC ID - fall back to main NPC
    console.warn(`⚠️ NPC not found: ${trimmed}, using main NPC`);
    return [mainNpcId];
}

/**
 * Get all NPC IDs in a specific room
 */
function getAllNPCsInRoom(roomId) {
    const currentRoom = window.rooms?.[roomId];
    if (!currentRoom || !currentRoom.npcs) {
        console.warn(`⚠️ Room not found or has no NPCs: ${roomId}`);
        return [];
    }
    return currentRoom.npcs.map(npc => npc.id);
}

/**
 * Get NPC IDs matching a wildcard pattern
 * Examples: guard_*, scientist_*, npc_*_back
 */
function getNPCsByPattern(pattern, roomId = null) {
    try {
        // Escape regex special characters except *
        const escaped = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*');
        const regex = new RegExp(`^${escaped}$`, 'i');
        
        // Get all NPCs to search
        let allNpcs = [];
        if (roomId) {
            const room = window.rooms?.[roomId];
            allNpcs = room?.npcs?.map(n => n.id) || [];
        } else {
            // Search all rooms
            allNpcs = Object.values(window.rooms || {})
                .flatMap(room => room.npcs?.map(n => n.id) || []);
        }
        
        const matching = allNpcs.filter(id => regex.test(id));
        console.log(`🔍 Pattern "${pattern}" matched: [${matching.join(', ')}]`);
        return matching;
    } catch (error) {
        console.error(`❌ Invalid NPC pattern: ${pattern}`, error);
        return [];
    }
}

/**
 * Check if an NPC exists
 */
function npcExists(npcId) {
    const allNpcs = Object.values(window.rooms || {})
        .flatMap(room => room.npcs?.map(n => n.id) || []);
    return allNpcs.includes(npcId);
}
```

**Update Behavior Tag Handlers:**

```javascript
// In processGameActionTags(), around line 220-240

case 'hostile': {
    const targetParam = tag.replace('hostile:', '').trim();
    const currentRoomId = window.currentRoom || window.player?.currentRoom;
    const mainNpcId = conversationNpc?.id || 'unknown';
    
    const targetIds = parseNPCTargets(targetParam, mainNpcId, currentRoomId);
    console.log(`⚠️ Making hostile: [${targetIds.join(', ')}]`);
    
    targetIds.forEach(npcId => {
        if (window.NPCGameBridge && window.NPCGameBridge.setNPCBehavior) {
            window.NPCGameBridge.setNPCBehavior(npcId, 'hostile');
        }
    });
    break;
}

case 'friendly': {
    const targetParam = tag.replace('friendly:', '').trim();
    const currentRoomId = window.currentRoom || window.player?.currentRoom;
    const mainNpcId = conversationNpc?.id || 'unknown';
    
    const targetIds = parseNPCTargets(targetParam, mainNpcId, currentRoomId);
    console.log(`✅ Making friendly: [${targetIds.join(', ')}]`);
    
    targetIds.forEach(npcId => {
        if (window.NPCGameBridge && window.NPCGameBridge.setNPCBehavior) {
            window.NPCGameBridge.setNPCBehavior(npcId, 'friendly');
        }
    });
    break;
}

// Similar updates for 'influence', 'suspicious', etc.
```

**✅ Acceptance Criteria:**
- [ ] Empty parameter defaults to main NPC
- [ ] Single NPC ID works
- [ ] Comma-separated list works
- [ ] Wildcard patterns work
- [ ] "all" keyword works
- [ ] Invalid NPC IDs handled gracefully
- [ ] Regex injection attacks prevented
- [ ] All behavior tags support new formats

---

## Phase 7: Documentation & Deployment

### 7.1 Create Ink Writer Guide

**Location:** `docs/INK_SPEAKER_PREFIX_GUIDE.md`

[See QUICK_REFERENCE.md for complete writer documentation]

### 7.2 Update Code Comments

- Add JSDoc to all new/modified methods
- Document regex patterns and edge cases
- Add inline comments for complex logic

### 7.3 Deployment Checklist

- [ ] All tests pass (unit + integration)
- [ ] No regressions in existing conversations
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Writer guide created and reviewed
- [ ] Merge to main branch

---

## Implementation Checklist

### Phase 0: Pre-Implementation Refactoring
- [ ] Refactor `createDialogueBlocks()` to use `determineSpeaker()`
- [ ] Add dialogue processing state lock
- [ ] Fix memory leak in `charactersWithParallax`

### Phase 1: Core Parsing
- [ ] Implement `parseDialogueLine()`
- [ ] Implement `normalizeSpeakerId()`
- [ ] Unit tests for parsing edge cases

### Phase 2: Speaker Determination
- [ ] Update `determineSpeaker()` with prefix priority
- [ ] Test backward compatibility
- [ ] Test prefix-based speaker detection

### Phase 3: Multi-Line Dialogue
- [ ] Update `createDialogueBlocks()` for line-by-line parsing
- [ ] Update `displayAccumulatedDialogue()`
- [ ] Update `displayDialogueBlocksSequentially()`

### Phase 4: Narrator Support
- [ ] Add `isNarrator` and `narratorCharacter` to `showDialogue()`
- [ ] Implement narrator CSS styling
- [ ] Test all narrator variants

### Phase 4.5: Background Changes Support
- [ ] Add background pattern to `parseDialogueLine()`
- [ ] Update `createDialogueBlocks()` to handle background blocks
- [ ] Implement `changeBackground()` method
- [ ] Add `setBackgroundAsync()` to portrait renderer
- [ ] Add `clearBackground()` to portrait renderer
- [ ] Update `renderFrame()` to draw custom backgrounds
- [ ] Test background changes with and without narrative text
- [ ] Test background clearing
- [ ] Test error handling for missing background files

### Phase 5: Testing
- [ ] Create comprehensive test Ink file
- [ ] Run full test checklist
- [ ] Performance testing

### Phase 6: NPC Behavior Tags
- [ ] Add `parseNPCTargets()` helper
- [ ] Add `getAllNPCsInRoom()` helper
- [ ] Add `getNPCsByPattern()` helper
- [ ] Update behavior tag handlers
- [ ] Test all tag formats

### Phase 7: Documentation
- [ ] Create Ink writer guide
- [ ] Update code comments
- [ ] Final code review
- [ ] Merge and deploy

---

## Rollback & Recovery

**If Critical Issues Found:**
1. **Option 1 - Disable Prefix Parsing:** Remove prefix check from `determineSpeaker()` - tags still work
2. **Option 2 - Feature Flag:** Add toggle to enable/disable prefix parsing
3. **Option 3 - Full Rollback:** All changes are isolated to few methods, easy to revert

**Zero Content Impact:** All existing Ink files work unchanged regardless of parsing changes.

---

## Success Metrics

After implementation:
- ✅ 0 regressions in existing conversations
- ✅ test-line-prefix.ink works perfectly
- ✅ Narrator passages display correctly  
- ✅ Background changes work smoothly
- ✅ Performance overhead < 1ms per line
- ✅ All 20 showDialogue() call sites work unchanged
- ✅ Writer satisfaction improved
- ✅ Code maintainability improved

---

## Timeline Estimate

- **Phase 0:** 2-3 hours (refactoring + testing)
- **Phase 1:** 2 hours (parsing functions)
- **Phase 2:** 1-2 hours (speaker determination)
- **Phase 3:** 2-3 hours (multi-line handling)
- **Phase 4:** 2-3 hours (narrator UI)
- **Phase 4.5:** 2-3 hours (background changes)
- **Phase 5:** 2-3 hours (comprehensive testing)
- **Phase 6:** 2-3 hours (NPC behavior tags)
- **Phase 7:** 1-2 hours (documentation)

**Total: 16-24 hours** of development time

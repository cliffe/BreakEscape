# Background Changes Feature Specification

**Date:** November 23, 2025  
**Status:** Added to Implementation Plan

---

## Overview

Add support for dynamically changing the conversation background image mid-dialogue using an Ink prefix format. This allows content creators to set mood, indicate time passage, or reflect environmental changes during conversations.

---

## Syntax

```ink
Background[image_filename.png]: Optional narrative description
```

### Examples

**Time of Day Changes:**
```ink
test_npc_back: It's getting late. Let me show you something.
Background[office_night.png]: The lights dim as evening falls.
test_npc_back: See? Everything changes at night.
```

**Location Transitions:**
```ink
test_npc_back: Follow me to the security room.
Background[security_room.jpg]: The scene shifts to a darker, more ominous space.
Player: This place gives me the creeps.
```

**Mood Setting:**
```ink
evil_npc: You've discovered too much.
Background[dark_room_red.png]: The room fills with an ominous red glow.
evil_npc: Now you'll never leave.
```

**Clear Background (Show Portrait Only):**
```ink
Background[]: The background fades to black.
narrator: Focus returns to the speaker.
```

---

## Implementation

### 1. Parsing

**Location:** `person-chat-minigame.js` - Add to `parseDialogueLine()` method

**Pattern Recognition:**
```javascript
// Pattern: Background[filename.ext]: optional narrative text
const backgroundPattern = /^Background\[([A-Za-z0-9_\-\.]*)\]:\s*(.*)$/i;
```

**Return Value Enhancement:**
```javascript
return {
    speaker: null,
    text: narrativeText || '', // Text after colon (may be empty)
    hasPrefix: true,
    isNarrator: false, // Could be true if text is narrative
    narratorCharacter: null,
    isBackgroundChange: true, // NEW: Flag this as background change
    backgroundImage: filename || null // NEW: Image filename or null to clear
};
```

### 2. Processing

**Location:** `person-chat-minigame.js` - Update `displayAccumulatedDialogue()`

**Add Background Change Handler:**
```javascript
displayAccumulatedDialogue(result) {
    // ... existing checks ...
    
    // Build dialogue blocks (now with prefix support)
    const lines = result.text.split('\n').filter(line => line.trim());
    const dialogueBlocks = this.createDialogueBlocks(lines, result.tags, result);
    
    // NEW: Process background changes BEFORE displaying dialogue
    for (const block of dialogueBlocks) {
        if (block.isBackgroundChange) {
            this.changeBackground(block.backgroundImage);
            
            // If there's accompanying narrative text, display it
            if (block.text && block.text.trim()) {
                // Display as narrator text
                this.ui.showDialogue(
                    block.text,
                    'narrator',
                    false,
                    true, // isNarrator
                    null  // no character portrait
                );
                
                // Optionally delay before continuing
                await this.scheduleDialogueAdvance(() => {
                    // Continue to next block
                }, DIALOGUE_AUTO_ADVANCE_DELAY);
            }
        }
    }
    
    // Filter out background change blocks before displaying dialogue
    const nonBackgroundBlocks = dialogueBlocks.filter(b => !b.isBackgroundChange);
    
    // Display remaining dialogue blocks sequentially
    this.displayDialogueBlocksSequentially(nonBackgroundBlocks, result, 0);
}
```

### 3. Background Changing Method

**Location:** `person-chat-minigame.js` - Add new method

```javascript
/**
 * Change the conversation background image
 * @param {string|null} imageFilename - Filename relative to assets/backgrounds/,
 *                                      or null to clear background
 */
changeBackground(imageFilename) {
    if (!this.ui || !this.ui.portraitRenderer) {
        console.warn('⚠️ Cannot change background - UI not initialized');
        return;
    }
    
    console.log(`🖼️ Background change requested: ${imageFilename || '(clear)'}`);
    
    if (imageFilename) {
        // Construct full path
        const basePath = '/break_escape/assets/backgrounds/';
        const fullPath = basePath + imageFilename;
        
        // Pass to portrait renderer to update background
        this.ui.portraitRenderer.setBackground(fullPath);
    } else {
        // Clear background (show default or black)
        this.ui.portraitRenderer.clearBackground();
    }
}
```

### 4. Portrait Renderer Updates

**Location:** `person-chat-portraits.js` - Add background management methods

```javascript
/**
 * Set a custom background image
 * @param {string} imagePath - Full path to background image
 */
setBackground(imagePath) {
    if (!imagePath) {
        this.clearBackground();
        return;
    }
    
    console.log(`🖼️ Loading background: ${imagePath}`);
    
    // Load image
    const img = new Image();
    img.onload = () => {
        this.backgroundImage = img;
        this.backgroundPath = imagePath;
        this.renderFrame();
        console.log(`✅ Background loaded: ${imagePath}`);
    };
    img.onerror = () => {
        console.error(`❌ Failed to load background: ${imagePath}`);
    };
    img.src = imagePath;
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
 * Render frame with optional custom background
 * (Update existing renderFrame method)
 */
renderFrame() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw custom background if present
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
        // Default: fill with black or render default background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw character sprite on top of background
    // ... existing sprite rendering logic ...
}
```

---

## Integration with createDialogueBlocks()

**Update block structure to include background change info:**

```javascript
createDialogueBlocks(lines, tags, result) {
    const blocks = [];
    let currentBlock = null;
    
    for (const line of lines) {
        if (!line || !line.trim()) continue;
        
        // Parse line for speaker prefix OR background change
        const parsed = this.parseDialogueLine(line);
        
        if (parsed.isBackgroundChange) {
            // Background change detected - create standalone block
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            
            blocks.push({
                speaker: null,
                text: parsed.text,
                isBackgroundChange: true,
                backgroundImage: parsed.backgroundImage,
                isNarrator: parsed.text && parsed.text.trim() ? true : false
            });
            
            continue; // Don't add to dialogue blocks
        }
        
        // ... rest of existing dialogue block logic ...
    }
    
    return blocks;
}
```

---

## Asset Organization

**Recommended Directory Structure:**
```
public/break_escape/assets/backgrounds/
├── office_day.png
├── office_night.png
├── security_room.jpg
├── dark_room_red.png
├── lab_bright.png
└── ...
```

**Background Image Guidelines:**
- Resolution: Minimum 1920x1080 (HD)
- Format: PNG (transparency support) or JPG (smaller size)
- Aspect ratio: 16:9 recommended
- File size: <500KB for performance

---

## Edge Cases

### 1. Invalid Filename
```javascript
Background[nonexistent.png]: Text
```
**Behavior:** Log error, keep current background, display text as narrator

### 2. Empty Filename (Clear Background)
```javascript
Background[]: Focus shifts back.
```
**Behavior:** Clear background to black/default, display text if present

### 3. No Text After Colon
```javascript
Background[office_night.png]:
```
**Behavior:** Change background silently, no narrator text displayed

### 4. Multiple Background Changes in Rapid Succession
```javascript
Background[scene1.png]: First scene
Background[scene2.png]: Second scene immediately after
```
**Behavior:** Apply changes sequentially with brief delay (500ms) between

---

## Testing Checklist

- [ ] Single background change mid-conversation
- [ ] Multiple background changes in sequence
- [ ] Background change with narrator text
- [ ] Background change without narrator text
- [ ] Empty background (clear) command
- [ ] Invalid/missing background file gracefully handled
- [ ] Background persists across dialogue blocks until changed
- [ ] Background resets when conversation ends
- [ ] Performance acceptable (no flickering or lag)
- [ ] Works with all narrator variants

---

## Example Test Ink File

```ink
=== background_test_start ===
test_npc: Let me show you how the environment changes.
Player: Sounds interesting!
-> change_to_night

=== change_to_night ===
test_npc: Watch this transformation.
Background[office_night.png]: The lights dim and night falls outside the windows.
test_npc: See? Everything changes at night.
Player: That's impressive!
-> change_to_security

=== change_to_security ===
test_npc: Now let's go somewhere more secure.
Background[security_room.jpg]: You both move to a dimly lit security room.
Player: This is quite different.
-> ominous_moment

=== ominous_moment ===
Background[dark_room_red.png]: 
test_npc: This is where things get serious.
Player: I don't like the look of this...
-> clear_background

=== clear_background ===
Background[]: The environment fades away, leaving only the speakers.
Narrator: The conversation becomes more intimate.
test_npc: Let's focus on what matters.
-> END
```

---

## Implementation Priority

**Priority Level:** Medium (nice-to-have enhancement)

**Rationale:**
- Adds significant storytelling capability
- Low implementation complexity
- Non-breaking addition (purely additive)
- Can be implemented after core prefix features

**Suggested Phase:** Phase 4.5 (between Narrator Support and Testing)

---

## Benefits

1. **Enhanced Storytelling:** Visual feedback for time passage, location changes
2. **Improved Immersion:** Backgrounds reinforce narrative context
3. **Creative Freedom:** Writers can create more dynamic, cinematic conversations
4. **Consistent Syntax:** Matches existing prefix format patterns
5. **Minimal Complexity:** Simple to implement, easy to use

---

## Alternatives Considered

### 1. Tag-Based Format
```ink
# background:office_night.png
The lights dim as evening falls.
```
**Rejected:** Mixes concerns (backgrounds vs game actions), less readable

### 2. Special Knot Convention
```ink
=== __background_office_night ===
The lights dim.
```
**Rejected:** Clutters story structure, harder to discover

### 3. External Command
```javascript
window.MinigameFramework.changeBackground('office_night.png');
```
**Rejected:** Breaks Ink-first philosophy, requires code injection

---

## Success Criteria

- ✅ Background changes apply smoothly without flickering
- ✅ Syntax is intuitive and easy to learn
- ✅ Performance overhead < 50ms per background change
- ✅ Works seamlessly with all other prefix formats
- ✅ Error handling is graceful and informative
- ✅ Writers can create dynamic visual narratives

---

## Conclusion

The `Background[filename.png]: Text` syntax provides a natural, readable way to manage conversation backgrounds. It fits perfectly with the existing prefix format philosophy and significantly enhances storytelling capabilities with minimal implementation complexity.

# RFID Keycard System - Critical Fixes Required

**Status**: ❌ Fixes Pending
**Priority**: IMMEDIATE (before implementation starts)
**Estimated Time**: 2 hours

---

## Quick Fix Checklist

### 🔴 Critical (Must Fix Before Implementation)

- [ ] **Fix #1**: Change CSS path from `css/minigames/rfid-minigame.css` to `css/rfid-minigame.css`
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md`, `02_IMPLEMENTATION_TODO.md`
  - Lines affected: Multiple references in Phase 4
  - Time: 10 minutes

- [ ] **Fix #2**: Change target file from `inventory.js` to `interactions.js` for keycard click handler
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md` (Section 7), `02_IMPLEMENTATION_TODO.md` (Task 3.5)
  - Impact: Without this, feature won't work
  - Time: 15 minutes

- [ ] **Fix #3**: Add RFID lock type to `getInteractionSpriteKey()` function
  - Files to update: `02_IMPLEMENTATION_TODO.md` (add new task 3.6)
  - Code change needed in: `js/systems/interactions.js`
  - Time: 20 minutes

- [ ] **Fix #4**: Add complete minigame registration pattern
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md`, `02_IMPLEMENTATION_TODO.md`
  - Pattern: export → import → register → window global
  - Time: 15 minutes

- [ ] **Fix #5**: Add event dispatcher integration
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md` (add events section)
  - Events needed: `card_cloned`, `card_emulated`, `rfid_lock_accessed`
  - Time: 20 minutes

- [ ] **Fix #6**: Add hex ID validation
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md`, `02_IMPLEMENTATION_TODO.md`
  - Validation: 10 chars, hex only, case-insensitive
  - Time: 15 minutes

- [ ] **Fix #7**: Document duplicate card handling strategy
  - Files to update: `01_TECHNICAL_ARCHITECTURE.md`
  - Decision: Overwrite existing or prevent duplicates?
  - Time: 10 minutes

**Total Time for Critical Fixes**: ~2 hours

---

## Code Snippets for Quick Reference

### Fix #3: Add to interactions.js getInteractionSpriteKey()

```javascript
// Add this case around line 357:
if (lockType === 'rfid') return 'rfid-icon';
```

### Fix #4: Complete Registration Pattern

```javascript
// In rfid-minigame.js - EXPORT:
export { RFIDMinigame, startRFIDMinigame };

// In index.js - IMPORT:
import { RFIDMinigame, startRFIDMinigame } from './rfid/rfid-minigame.js';

// In index.js - REGISTER:
MinigameFramework.registerScene('rfid', RFIDMinigame);

// In index.js - GLOBAL:
window.startRFIDMinigame = startRFIDMinigame;
```

### Fix #5: Event Emissions

```javascript
// In RFIDMinigame.handleSaveCard()
if (window.eventDispatcher) {
    window.eventDispatcher.emit('card_cloned', {
        cardName: cardData.name,
        cardHex: cardData.rfid_hex,
        npcId: window.currentConversationNPCId // if from NPC
    });
}

// In RFIDMinigame.handleEmulate()
if (window.eventDispatcher) {
    window.eventDispatcher.emit('card_emulated', {
        cardName: savedCard.name,
        success: cardMatches
    });
}
```

### Fix #6: Hex Validation

```javascript
// In RFIDDataManager
validateHex(hex) {
    if (!hex || typeof hex !== 'string') return false;
    if (hex.length !== 10) return false;
    if (!/^[0-9A-Fa-f]{10}$/.test(hex)) return false;
    return true;
}

generateRandomHex() {
    let hex = '';
    for (let i = 0; i < 10; i++) {
        hex += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return hex;
}
```

---

## High Priority Additions

### Addition #0: Return to Conversation Pattern

```javascript
// In rfid-minigame.js - Export return function
export function returnToConversationAfterRFID(conversationContext) {
    if (!window.MinigameFramework) return;

    // Re-open conversation minigame
    window.MinigameFramework.startMinigame('person-chat', null, {
        npcId: conversationContext.npcId,
        resumeState: conversationContext.conversationState
    });
}

// Make globally available
window.returnToConversationAfterRFID = returnToConversationAfterRFID;
```

## High Priority Additions

### Addition #1: DEZ8 Calculation Formula

```javascript
// In rfid-ui.js
toDEZ8(hex) {
    // EM4100 DEZ 8: Last 3 bytes (6 hex chars) to decimal
    const lastThreeBytes = hex.slice(-6);
    const decimal = parseInt(lastThreeBytes, 16);
    return decimal.toString().padStart(8, '0');
}
```

### Addition #2: Facility Code Calculation

```javascript
// In rfid-data.js
hexToFacilityCard(hex) {
    // EM4100: First byte = facility, next 2 bytes = card number
    const facility = parseInt(hex.substring(0, 2), 16);
    const cardNumber = parseInt(hex.substring(2, 6), 16);
    return { facility, cardNumber };
}
```

### Addition #3: Checksum Calculation

```javascript
// In rfid-ui.js
calculateChecksum(hex) {
    const bytes = hex.match(/.{1,2}/g).map(b => parseInt(b, 16));
    let checksum = 0;
    bytes.forEach(byte => {
        checksum ^= byte; // XOR
    });
    return checksum & 0xFF;
}
```

---

## File Update Priority

### Immediate Updates (before any coding)

1. `01_TECHNICAL_ARCHITECTURE.md`
   - [ ] Fix all CSS path references
   - [ ] Change inventory.js → interactions.js
   - [ ] Add events section
   - [ ] Add complete registration pattern
   - [ ] Add validation requirements
   - [ ] Add calculation formulas

2. `02_IMPLEMENTATION_TODO.md`
   - [ ] Update Phase 4 CSS tasks
   - [ ] Update Task 3.5 (interactions.js)
   - [ ] Add Task 3.6 (interaction indicator)
   - [ ] Update Task 3.2 (registration)
   - [ ] Add validation subtasks
   - [ ] Add event emission subtasks

3. `03_ASSETS_REQUIREMENTS.md`
   - [ ] Add Phaser asset loading section
   - [ ] Add HTML CSS link requirement

---

## Verification Checklist

After applying fixes, verify:

- [ ] All file paths are correct (no `css/minigames/` subdirectory)
- [ ] All references to inventory.js changed to interactions.js
- [ ] Event emissions documented
- [ ] Validation functions specified
- [ ] Calculation formulas provided
- [ ] Complete registration pattern shown
- [ ] Interaction indicator task added
- [ ] All code examples compile-check clean

---

## Impact if Not Fixed

| Issue | Impact if Ignored | Severity |
|-------|------------------|----------|
| CSS Path | Styles won't load, UI broken | 🔴 CRITICAL |
| Wrong File | Feature completely broken | 🔴 CRITICAL |
| Missing Icon | Wrong icon shown | 🟡 MEDIUM |
| Incomplete Registration | Minigame won't load | 🔴 CRITICAL |
| No Events | NPCs won't react | 🟡 MEDIUM |
| No Validation | Corrupted card data | 🟠 HIGH |
| No Duplicate Handling | Cards overwrite silently | 🟡 MEDIUM |

---

## Sign-Off

- [ ] All critical fixes applied
- [ ] Documentation updated
- [ ] Code examples verified
- [ ] Ready to proceed with implementation

**Fixes Applied By**: _____________
**Date**: _____________
**Reviewed By**: _____________

---

**Next Step**: Update planning documents with fixes, then begin Phase 1 implementation.

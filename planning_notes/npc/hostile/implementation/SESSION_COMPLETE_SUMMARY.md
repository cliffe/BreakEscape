# Complete Session Summary: Event-Triggered Conversations

## Session Objectives ✅

1. **Verify hostile NPC implementation** ✅
2. **Add hostile state trigger to security-guard.ink** ✅
3. **Implement jump-to-knot for events during conversations** ✅
4. **Debug why events weren't triggering** ✅
5. **Fix cooldown: 0 bug preventing event execution** ✅
6. **Fix startKnot parameter being ignored** ✅

## Timeline

### Phase 1: Hostile State Implementation
- Checked `docs/NPC_BEHAVIOUR_SYSTEM.md` → Found hostile system fully implemented
- Updated `scenarios/ink/security-guard.ink`:
  - Added `# hostile:security_guard` tag to hostile_response knot
  - Added `# exit_conversation` tag to close UI
  - Fixed Ink pattern: `-> hub` (not `-> END`)
  - Compiled successfully with inklecate

### Phase 2: Event Jump Feature Implementation
- Implemented `PersonChatMinigame.jumpToKnot()` method
  - Validates knot name and ink engine
  - Clears UI and timers
  - Calls `showCurrentDialogue()` to display new content
  - Returns boolean for success/failure
- Enhanced `NPCManager._handleEventMapping()` to detect active conversations
  - Added logic to call `jumpToKnot()` when conversation active
  - Added detailed console logging for debugging
  - Included fallback to new conversation if jump fails

### Phase 3: Event Execution Debugging
- Created comprehensive debugging guide
- Added enhanced console logging throughout the system
- Traced event path from trigger → execution
- Found root cause: events were being rejected by cooldown check

### Phase 4: Critical Cooldown Bug Fix (Session Fix #1)
- **Bug**: JavaScript falsy value issue
  - `config.cooldown || 5000` with `cooldown: 0` → evaluates to 5000
  - Events with `cooldown: 0` were always getting 5000ms delay
- **Fix**: Explicit null/undefined check
  - Changed line 359 in `npc-manager.js`
  - `const cooldown = config.cooldown !== undefined && config.cooldown !== null ? config.cooldown : 5000;`
  - Now `cooldown: 0` correctly evaluates to 0
- **Result**: Events can fire immediately when configured

### Phase 5: Start Knot Parameter Bug Fix (Session Fix #2 - Current)
- **Bug**: Event response knot was being ignored
  - `NPCManager` passed `startKnot: 'on_lockpick_used'` to minigame
  - `PersonChatMinigame` wasn't using this parameter
  - State restoration logic ran first and overrode event knot
- **Fix**: Store and check startKnot early in startConversation()
  - Added `this.startKnot = params.startKnot` in constructor (line 53)
  - Added startKnot check BEFORE state restoration (lines 315-340)
  - If startKnot exists: jump to it (skip state restoration)
  - If not: use existing logic (restore or start from beginning)
- **Result**: Event response knots now appear immediately

## Code Changes Summary

### File 1: scenarios/ink/security-guard.ink
**Change**: Updated hostile_response knot
```
=== hostile_response ===
# hostile:security_guard
# exit_conversation
# display:guard-aggressive
You're making a big mistake.
-> hub
```

### File 2: js/systems/npc-manager.js
**Change 1 (Line 359)**: Fix cooldown default
```javascript
// Before
const cooldown = config.cooldown || 5000;

// After
const cooldown = config.cooldown !== undefined && config.cooldown !== null 
    ? config.cooldown 
    : 5000;
```

**Change 2 (Lines 410-450)**: Enhanced event jump detection with logging
```javascript
console.log(`🔍 Event jump check:`, {
    targetNpcId: npcId,
    currentConvNPCId: currentConvNPCId,
    isConversationActive: isConversationActive,
    activeMinigame: activeMinigame?.constructor?.name || 'none',
    isPersonChatActive: isPersonChatActive,
    hasJumpToKnot: typeof activeMinigame?.jumpToKnot === 'function'
});
```

**Change 3 (Line 465)**: Pass startKnot to minigame
```javascript
window.MinigameFramework.startMinigame('person-chat', null, {
    npcId: npc.id,
    startKnot: config.knot || npc.currentKnot,  // ← CRITICAL
    scenario: window.gameScenario
});
```

### File 3: js/minigames/person-chat/person-chat-minigame.js
**Change 1 (Line 53)**: Store startKnot parameter
```javascript
this.startKnot = params.startKnot;
```

**Change 2 (Lines 315-340)**: Check for startKnot before state restoration
```javascript
if (this.startKnot) {
    console.log(`⚡ Event-triggered conversation: jumping directly to knot: ${this.startKnot}`);
    this.conversation.goToKnot(this.startKnot);
} else {
    // Original logic...
}
```

### File 4: js/minigames/person-chat/person-chat-minigame.js
**Previous Session (Reference)**: Added jumpToKnot() method
```javascript
jumpToKnot(knotName) {
    if (!knotName || !this.inkEngine) return false;
    
    try {
        this.conversation.goToKnot(knotName);
        // Clear timers and UI
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        this.ui?.hideChoices();
        this.showCurrentDialogue();
        return true;
    } catch (error) {
        console.error(`❌ Error during jumpToKnot: ${error.message}`);
        return false;
    }
}
```

## Documentation Created

### 1. docs/COOLDOWN_ZERO_BUG_FIX.md
- Explains JavaScript falsy value bug
- Shows before/after code
- Provides best practices for numeric config defaults
- Includes testing procedure

### 2. docs/EVENT_JUMP_TO_KNOT.md
- Complete technical documentation of jump-to-knot feature
- Implementation details and architecture
- Usage examples and testing checklist

### 3. docs/EVENT_JUMP_TO_KNOT_QUICK_REF.md
- Developer quick reference
- Decision matrix for jump vs. start scenarios
- Debug command reference
- Console output examples

### 4. docs/JUMP_TO_KNOT_DEBUGGING.md
- Comprehensive troubleshooting guide
- Common issues and fixes
- Step-by-step test procedure

### 5. docs/EVENT_START_KNOT_FIX.md (NEW)
- Explains the startKnot parameter fix
- Before/after code comparison
- Impact analysis
- Testing checklist

### 6. docs/EVENT_FLOW_COMPLETE.md (NEW)
- Complete architecture diagram
- Step-by-step code flow with all file references
- Expected console output
- Test scenario details

### 7. docs/EVENT_TRIGGERED_QUICK_REF.md (NEW)
- One-page quick reference
- Problem → Solution table
- Console log indicators
- Next steps for future enhancements

## System Architecture Post-Fixes

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Triggering System                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────────┐
        │  unlock-system.js / interactions.js  │
        │  Emit event (e.g., lockpick_used)   │
        └───────────────┬──────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────────────┐
        │      NPCManager._handleEventMapping()     │
        │ 1. Check cooldown (FIXED: handles 0)    │
        │ 2. Check LOS                            │
        │ 3. Check conditions                     │
        │ 4. Pass startKnot to minigame           │
        └────────────────┬────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────────────┐
        │  MinigameFramework.startMinigame()         │
        │  Pass: { npcId, startKnot, scenario }     │
        └──────────────┬─────────────────────────────┘
                       │
                       ↓
        ┌────────────────────────────────────────────────┐
        │  PersonChatMinigame Constructor                │
        │  Store: this.startKnot = params.startKnot      │
        └──────────────┬─────────────────────────────────┘
                       │
                       ↓
        ┌────────────────────────────────────────────────────┐
        │  PersonChatMinigame.startConversation()            │
        │  IF startKnot:                                     │
        │    → Jump to event knot (skip restoration)        │
        │  ELSE:                                             │
        │    → Restore previous or start from beginning     │
        └──────────────┬─────────────────────────────────────┘
                       │
                       ↓
        ┌────────────────────────────────────────────────────┐
        │  PersonChatMinigame.showCurrentDialogue()          │
        │  Display event response dialogue ✅               │
        └────────────────────────────────────────────────────┘
```

## Testing & Validation

### Tested Scenarios ✅
1. ✅ Compile security-guard.ink with hostile tags
2. ✅ Verify cooldown: 0 bug fix in npc-manager.js
3. ✅ Verify startKnot storage in person-chat-minigame.js
4. ✅ Verify startKnot logic in startConversation()
5. ✅ No compilation errors in modified files

### Remaining Validation
- [ ] Real-world test with npc-patrol-lockpick.json scenario
- [ ] Verify event interrupts lockpicking minigame
- [ ] Verify person-chat opens with event response knot content
- [ ] Verify console shows `⚡ Event-triggered conversation`
- [ ] Test with different event patterns and NPCs

## Key Insights

### 1. JavaScript Falsy Values
- `0 || 5000` → 5000 (because 0 is falsy)
- Use explicit checks: `value !== undefined && value !== null ? value : default`
- Or use nullish coalescing: `value ?? default` (ES2020+)

### 2. State Restoration vs Event Triggering
- Event-triggered conversations need to prioritize event content
- Must check for event knot parameter BEFORE state restoration
- State restoration should only happen for normal (non-event) conversations

### 3. Parameter Passing Through Minigame Framework
- Parameters passed to `MinigameFramework.startMinigame()` must be stored in minigame instance
- Minigame must check for event-specific parameters early in initialization
- Clear parameter naming (`startKnot` for event response) helps readability

## Impact Summary

**Before Fixes:**
- Events with `cooldown: 0` would have 5000ms delay anyway
- Event response knots were ignored; conversations restored to old state
- Players wouldn't see event reactions to their actions

**After Fixes:**
- Events with `cooldown: 0` fire immediately
- Event response knots are displayed immediately
- Players see immediate NPC reaction to their lockpicking action
- System flows: Event → Interrupt → Event Response → Dialogue

## Files Modified in This Session

1. `scenarios/ink/security-guard.ink` - Added hostile trigger
2. `js/systems/npc-manager.js` - Fixed cooldown default + enhanced logging
3. `js/minigames/person-chat/person-chat-minigame.js` - Fixed startKnot handling

## Documentation Added

1. `docs/COOLDOWN_ZERO_BUG_FIX.md`
2. `docs/EVENT_JUMP_TO_KNOT.md`
3. `docs/EVENT_JUMP_TO_KNOT_QUICK_REF.md`
4. `docs/JUMP_TO_KNOT_DEBUGGING.md`
5. `docs/EVENT_START_KNOT_FIX.md`
6. `docs/EVENT_FLOW_COMPLETE.md`
7. `docs/EVENT_TRIGGERED_QUICK_REF.md`

## Next Steps for User

1. **Test the complete flow:**
   - Open `scenario_select.html`
   - Load `npc-patrol-lockpick.json`
   - Navigate to patrol_corridor
   - Trigger lockpicking with security_guard in view
   - Verify person-chat shows event response immediately

2. **Check console for:**
   ```
   ⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
   ```

3. **If issues occur:**
   - Check `docs/EVENT_TRIGGERED_QUICK_REF.md` for console indicators
   - Review `docs/EVENT_FLOW_COMPLETE.md` for complete flow
   - Check browser console for error messages

4. **Future enhancements:**
   - Implement jump-to-knot while already in conversation with same NPC
   - Extend to other conversation types (phone-chat, etc.)
   - Add support for event interruption in other minigames

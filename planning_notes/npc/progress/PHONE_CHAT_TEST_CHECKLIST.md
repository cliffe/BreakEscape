# Phone Chat Minigame - Test Checklist

## Test Environment
- **URL**: `http://localhost:8000/test-phone-chat-minigame.html`
- **Date**: 2025-10-30
- **Status**: Ready for comprehensive testing

---

## Pre-Test Setup

### Step 1: Initialize Systems
- [ ] Click "Initialize Systems" button
- [ ] Verify console shows: "✅ All systems initialized!"
- [ ] Check for any error messages

### Step 2: Register NPCs
- [ ] Click "Register NPCs" button
- [ ] Verify console shows:
  - ✅ Registered Alice
  - ✅ Registered Bob
  - ✅ Registered Charlie
  - ✅ Timed messages system started
  - ✅ Scheduled 3 timed messages (5s, 10s, 15s)

### Step 3: Check Systems
- [ ] Click "Check Systems" button
- [ ] Verify all systems show "Ready"
- [ ] Verify 3 NPCs registered with 0 messages initially

---

## Core Functionality Tests

### Test 1: Basic Conversation Opening
**Goal**: Verify conversation opens and displays correctly

1. [ ] Click "Test Alice Chat" button
2. [ ] Verify phone UI appears with green LCD screen
3. [ ] Verify contact list shows 3 NPCs (Alice, Bob, Charlie)
4. [ ] Verify each NPC shows preview message (not "No messages yet")
5. [ ] Click on Alice in contact list
6. [ ] Verify conversation view opens
7. [ ] Verify Alice's avatar appears next to her name (or placeholder emoji)
8. [ ] Verify intro message displays: "Hey! I'm Alice..."
9. [ ] Verify 4 choice buttons appear at bottom
10. [ ] Check console for errors (should be NONE)

**Expected Result**: 
- ✅ No state serialization errors
- ✅ Intro message preloaded and displayed
- ✅ Choices rendered correctly
- ✅ Avatar displays in header

---

### Test 2: Making a Choice
**Goal**: Verify choices work and add to history

1. [ ] (Continue from Test 1) Click first choice button
2. [ ] Verify choice text appears as player message (right-aligned, blue bubble)
3. [ ] Verify NPC response appears (left-aligned, green bubble)
4. [ ] Verify new choices appear if available
5. [ ] Verify messages auto-scroll to bottom
6. [ ] Check console: should show "💾 Saved story state for alice"

**Expected Result**:
- ✅ Choice added to history as player message
- ✅ Response added to history as NPC message
- ✅ State saved successfully (no errors)
- ✅ New choices rendered

---

### Test 3: Conversation Persistence (Critical Test)
**Goal**: Verify intro doesn't replay when reopening

1. [ ] (Continue from Test 2) Make 2-3 more choices
2. [ ] Note the conversation history (intro + responses)
3. [ ] Click "X" button to close phone
4. [ ] Wait 2 seconds
5. [ ] Click "Test Alice Chat" again
6. [ ] Click on Alice in contact list
7. [ ] **VERIFY**: Intro message does NOT appear twice
8. [ ] **VERIFY**: All previous messages still visible
9. [ ] **VERIFY**: Choice buttons appear at bottom
10. [ ] **VERIFY**: No new message bubbles animate in

**Expected Result**:
- ✅ History preserved exactly as it was
- ✅ NO duplicate intro message
- ✅ Only choices display, no new messages
- ✅ Can continue conversation from where left off

**If Failed**: 
- Check console for "❌ Error saving state"
- Check if npc.storyState exists in openConversation()
- Verify preloadIntroMessages() saved state

---

### Test 4: Multiple NPC Conversations
**Goal**: Verify switching between NPCs works

1. [ ] Open phone, click Alice, make a choice
2. [ ] Click back arrow to contact list
3. [ ] Click Bob in contact list
4. [ ] Verify Bob's conversation opens (different from Alice)
5. [ ] Make a choice in Bob's conversation
6. [ ] Click back arrow
7. [ ] Click Alice again
8. [ ] **VERIFY**: Alice's conversation unchanged (history preserved)
9. [ ] Click back, then Charlie
10. [ ] Verify Charlie's conversation works

**Expected Result**:
- ✅ Each NPC has separate conversation history
- ✅ No cross-contamination between NPCs
- ✅ All histories persist independently

---

### Test 5: Timed Messages
**Goal**: Verify timed messages arrive and bark

1. [ ] Complete Test 1 setup (Initialize + Register)
2. [ ] Wait for 5 seconds
3. [ ] **VERIFY**: Bark appears from Alice (⏰ message)
4. [ ] Check console: "[NPCManager] Delivered timed message from alice"
5. [ ] Wait for 10 seconds (total 15s from start)
6. [ ] **VERIFY**: Bark appears from Bob
7. [ ] Wait for 15 seconds (total 30s from start)
8. [ ] **VERIFY**: Another bark from Alice
9. [ ] Open phone → contact list
10. [ ] **VERIFY**: Timed messages appear in preview text
11. [ ] Click Alice
12. [ ] **VERIFY**: Timed messages in conversation history

**Expected Result**:
- ✅ 3 barks appear at 5s, 10s, 15s intervals
- ✅ Messages added to history automatically
- ✅ Contact list updates with latest message
- ✅ No errors in console

---

### Test 6: Scrollbar Visibility
**Goal**: Verify scrollbars are styled and visible

1. [ ] Open phone with Alice
2. [ ] Make enough choices to fill the screen (5-10 choices)
3. [ ] **VERIFY**: Message container has visible scrollbar (8px, black thumb, green border)
4. [ ] **VERIFY**: Scrollbar is styled (not default browser style)
5. [ ] **VERIFY**: Can scroll through messages smoothly
6. [ ] Check contact list scrollbar (if 10+ NPCs)

**Expected Result**:
- ✅ Scrollbars visible on both Firefox and Chrome
- ✅ 8px width, black thumb with green border
- ✅ Scrolls smoothly

---

### Test 7: Avatar Display
**Goal**: Verify avatar rendering

1. [ ] Open phone, click Alice
2. [ ] **VERIFY**: Avatar appears next to name in header
3. [ ] Check if image loads or placeholder emoji shows
4. [ ] Click back, open Bob
5. [ ] **VERIFY**: Bob's avatar/placeholder appears
6. [ ] Check console for 404 errors on avatar images

**Expected Result**:
- ✅ Avatar displays correctly (32x32px, 2px border)
- ✅ Fallback emoji (👤) shows if no image
- ✅ Pixelated rendering (image-rendering: pixelated)

---

### Test 8: Keyboard Controls
**Goal**: Verify keyboard shortcuts work

1. [ ] Open phone with Alice
2. [ ] Press ESC key
3. [ ] **VERIFY**: Phone closes
4. [ ] Open phone again
5. [ ] Try arrow keys / number keys (if implemented)

**Expected Result**:
- ✅ ESC closes phone
- ✅ Other shortcuts work as expected

---

### Test 9: Edge Cases

#### 9a. Opening Conversation with No History (New)
1. [ ] Register a new NPC that wasn't preloaded
2. [ ] Open conversation
3. [ ] Verify intro message appears
4. [ ] Make choice
5. [ ] Reopen conversation
6. [ ] **VERIFY**: No duplicate intro

#### 9b. Story End State
1. [ ] Continue Alice conversation until story ends
2. [ ] **VERIFY**: Appropriate end message
3. [ ] **VERIFY**: No choices remain
4. [ ] Close and reopen
5. [ ] **VERIFY**: End state preserved

#### 9c. Rapid Open/Close
1. [ ] Open phone
2. [ ] Immediately close
3. [ ] Open again
4. [ ] **VERIFY**: No errors
5. [ ] **VERIFY**: State consistent

---

## Performance Tests

### Test 10: Performance Check
**Goal**: Ensure no lag or memory leaks

1. [ ] Open/close phone 10 times rapidly
2. [ ] Check browser memory usage (DevTools → Memory)
3. [ ] Make 50+ choices across multiple NPCs
4. [ ] **VERIFY**: No noticeable lag
5. [ ] **VERIFY**: Memory doesn't continuously increase
6. [ ] Check console for any warnings

**Expected Result**:
- ✅ Smooth performance
- ✅ No memory leaks
- ✅ No console warnings

---

## Console Error Checks

### Critical Errors to Watch For
- ❌ "Error saving state" → State serialization issue
- ❌ "Failed to convert runtime object" → InkJS serialization problem
- ❌ "Cannot read property" → Null reference errors
- ❌ "404" on required resources → Missing files

### Acceptable Console Messages
- ✅ "[NPCManager] Added npc message to alice history"
- ✅ "💾 Saved story state for alice"
- ✅ "📝 Preloaded intro message for alice and saved state"
- ✅ "✅ Story loaded successfully for alice"

---

## Known Issues / Expected Behavior

### ✅ Fixed Issues
- State serialization error (npc_name variable removed)
- Intro message replay (state now saves after preload)
- Contact list "No messages yet" (preloading implemented)

### Current Limitations
- Avatar images may 404 if not present (fallback emoji works)
- Ink.js.map 404 is cosmetic (doesn't affect functionality)

---

## Test Results Summary

### Date: _________
### Tester: _________

**Overall Status**: [ ] Pass / [ ] Fail

**Tests Passed**: ___ / 10

**Critical Issues Found**:
1. 
2. 
3. 

**Minor Issues Found**:
1. 
2. 
3. 

**Notes**:


---

## Next Steps After Testing

### If All Tests Pass:
1. [ ] Update documentation as complete
2. [ ] Prepare for main game integration
3. [ ] Create scenario examples
4. [ ] Add to main game menu

### If Tests Fail:
1. [ ] Document failure details
2. [ ] Create bug report with reproduction steps
3. [ ] Fix identified issues
4. [ ] Re-run failed tests
5. [ ] Update test checklist with lessons learned

---

**Test Checklist Version**: 1.0
**Last Updated**: 2025-10-30

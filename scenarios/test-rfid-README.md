# RFID System Test Scenario

## Overview
This scenario tests all RFID keycard functionality in BreakEscape.

## ⚠️ Important: Compile Ink Story First

Before running the scenario, you need to compile the Ink story file:

**Option 1: Using Inky (Recommended)**
1. Download [Inky](https://github.com/inkle/inky/releases) (Ink editor with built-in compiler)
2. Open `scenarios/ink/rfid-security-guard.ink` in Inky
3. Click File → Export story.json only...
4. Save as `scenarios/ink/rfid-security-guard.json`

**Option 2: Using inklecate (Command Line)**
```bash
# Install inklecate
# https://github.com/inkle/ink/releases

# Compile the story
inklecate scenarios/ink/rfid-security-guard.ink -o scenarios/ink/rfid-security-guard.json
```

**Note**: The current `rfid-security-guard.json` file is a placeholder and won't work without proper compilation from the `.ink` source.

## Scenario Structure

### Room 1: Test Lobby
**Items:**
- 📇 **Employee Badge** (keycard) - Physical item you can pick up
  - Hex: `01AB34CD56`
  - This is a standard badge that won't open the secure door

- 🔧 **Flipper Zero** (rfid_cloner) - The RFID cloner device
  - Pick this up first to enable card cloning

- 📄 **Security Notice** (notes) - Instructions about RFID system

**NPC:**
- 👮 **Security Guard**
  - Has a Master Keycard in holdsItems (Hex: `FF4A7B9C21`)
  - Conversation includes clone_keycard tag to clone their badge
  - This is the keycard that unlocks the secure door

**Door:**
- 🚪 **Secure Room Door** (locked with RFID)
  - Requires: `master_keycard` (the guard's badge)
  - Won't open with the employee badge

### Room 2: Secure Room
**Items:**
- ✅ **Success Note** - Congratulations message
- 📇 **CEO Keycard** - Bonus keycard you can take

## Test Procedure

### Test 1: Pick Up Items
1. Start the scenario
2. Pick up the **Flipper Zero** (RFID cloner)
3. Pick up the **Employee Badge**
4. Read the **Security Notice** to understand the system

### Test 2: Try Wrong Card
1. Try to unlock the secure door
2. Select the **Employee Badge** from the tap interface
3. Should get "Access Denied" (wrong card)

### Test 3: Clone Card from NPC
1. Talk to the **Security Guard**
2. Choose: "Ask about the keycard"
3. Choose: "Try to clone it secretly"
4. **RFID minigame should launch in clone mode**
5. Watch the Flipper Zero read the card
6. Card data should display:
   - Name: Master Keycard
   - Hex: FF 4A 7B 9C 21
   - Facility: 255
   - Card: 18811
   - Checksum: calculated
   - DEZ 8: calculated
7. Click "Save" to save to cloner
8. Should return to conversation automatically
9. Finish the conversation

### Test 4: Emulate Cloned Card
1. Go back to the secure door
2. Try to unlock it again
3. This time, choose **"Saved"** from the Flipper menu
4. Select **"Master Keycard"** from saved cards list
5. **RFID minigame shows emulation screen**
6. Should display "Access Granted" ✓
7. Door unlocks!

### Test 5: Click to Clone
1. After getting into secure room, pick up the **CEO Keycard**
2. Open inventory and **click on the CEO Keycard**
3. RFID minigame should launch in clone mode
4. Save it to your cloner
5. Now you have 2 cards saved!

### Test 6: Verify Saved Cards
1. Try to unlock the secure door again (from inside)
2. Go to **Saved** cards
3. Should see both cards:
   - Master Keycard
   - CEO Keycard

## Expected Behavior

### Unlock Mode
- Shows "RFID > Read" screen
- Lists available keycards from inventory
- Shows "RFID > Saved" option if cloner has cards
- Tap animation when selecting card
- Success/failure feedback
- Door unlocks on success

### Clone Mode (from conversation tag)
- Shows "RFID > Read" screen
- Reading progress bar animation
- Displays full card data after reading
- Save/Cancel buttons
- Returns to conversation after save
- Card added to cloner's saved_cards

### Clone Mode (from inventory click)
- Click keycard while holding cloner
- Same clone flow as above
- No conversation return

### Saved Card Emulation
- Lists all saved cards
- Shows card details when emulating
- "Emulating..." message with RF waves
- Success/failure feedback

## Keycards in Scenario

| Card Name | Hex ID | Facility | Card # | Opens Secure Door? |
|-----------|--------|----------|--------|-------------------|
| Employee Badge | 01AB34CD56 | 1 | 43981 | ❌ No |
| Master Keycard | FF4A7B9C21 | 255 | 18811 | ✅ Yes |
| CEO Keycard | FFAA55CC33 | 255 | 43597 | ❌ No (not required) |

## How to Load

1. Copy `test-rfid.json` to the scenarios folder
2. Modify `js/main.js` to load it:
```javascript
const scenarioUrl = 'scenarios/test-rfid.json';
```
3. Reload the game
4. You should spawn in the Test Lobby

## Troubleshooting

**If RFID minigame doesn't start:**
- Check browser console for errors
- Verify all RFID files are loaded
- Make sure CSS is linked in index.html

**If conversation doesn't return:**
- Check that `window.returnToConversationAfterRFID` exists
- Verify `window.pendingConversationReturn` is set
- Look for errors in console

**If door doesn't unlock:**
- Verify the keycard's `card_id` matches the door's `requires`
- Check that you're using the correct card (Master Keycard)
- Ensure unlock-system.js has the rfid case

**If clone_keycard tag doesn't work:**
- Verify you have the Flipper Zero in inventory
- Check chat-helpers.js has the clone_keycard case
- Look for tag processing errors in console

## Success Criteria

✅ Pick up Flipper Zero and keycards
✅ Wrong keycard shows "Access Denied"
✅ Clone NPC's keycard from conversation
✅ Conversation returns after cloning
✅ Cloned card appears in Saved list
✅ Emulate cloned card to unlock door
✅ Clone keycard by clicking in inventory
✅ Multiple saved cards work correctly
✅ All UI animations display properly
✅ Flipper Zero styling looks correct

## Notes

- All hex IDs are valid 10-character hex strings
- Facility codes and card numbers are properly calculated
- The scenario tests both clone modes (conversation tag and inventory click)
- Door is one-way locked (secure room exit is unlocked)
- CEO Keycard is a bonus to test inventory cloning

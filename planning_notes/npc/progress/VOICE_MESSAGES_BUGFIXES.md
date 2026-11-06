# Voice Messages - Bug Fixes

## Issues Fixed (2025-10-30 02:40)

### Issue 1: IT Team and David showing "no messages yet"
**Cause**: Compiled JSON files were 0 bytes (empty)
- `voice-message-example.json` was 0 bytes
- `mixed-message-example.json` was 0 bytes

**Root Cause**: Initial compilation command used stdout redirection (`>`) which failed silently

**Fix**: Recompiled using proper `-o` flag:
```bash
inklecate -o ../compiled/voice-message-example.json voice-message-example.ink
inklecate -o ../compiled/mixed-message-example.json mixed-message-example.ink
```

**Result**: 
- `voice-message-example.json` now 209 bytes ✅
- `mixed-message-example.json` now 720 bytes ✅

**Verification**:
- IT Team now shows voice message with transcript
- David now shows mixed text + voice conversation

---

### Issue 2: "Test Simple Message Conversion" creating duplicates
**Cause**: Function used timestamp-based NPC ID on every click:
```javascript
const npcId = `phone_msg_${baseName}_${Date.now()}`; // New ID each time!
```

**Problem**: 
- Click 1: `phone_msg_reception_phone_1730254800000`
- Click 2: `phone_msg_reception_phone_1730254801000`
- Click 3: `phone_msg_reception_phone_1730254802000`
- Result: 3 duplicate NPCs in contact list

**Fix**: Modified test function to:
1. Use static test ID: `test_reception_phone`
2. Check if NPC already registered before creating
3. If exists, just open phone (don't re-register)

**Code Change** (`test-phone-chat-minigame.html`):
```javascript
async function testSimpleMessageConversion() {
    const testNpcId = 'test_reception_phone'; // Static ID
    
    // Check if already registered
    if (window.npcManager.getNPC(testNpcId)) {
        log('ℹ️ Test NPC already registered, skipping...', 'info');
        // Just open phone, don't re-register
        window.MinigameFramework.startMinigame('phone-chat', null, {
            phoneId: 'default_phone',
            title: 'Test Simple Message'
        });
        return;
    }
    
    // Create and register only if doesn't exist
    const virtualNPC = PhoneMessageConverter.createVirtualNPC(simplePhone);
    virtualNPC.id = testNpcId; // Override timestamp ID
    window.npcManager.registerNPC(virtualNPC);
    // ...
}
```

**Result**: 
- First click: Registers NPC and opens phone
- Subsequent clicks: Just opens phone (no duplicates)

---

## Testing Steps

### Test Voice Messages
1. Open `test-phone-chat-minigame.html`
2. Click "Initialize Systems"
3. Click "Register Test NPCs"
4. Click "📱 Open Phone"
5. **Expected**: 6 contacts visible:
   - ✅ Alice - Security Consultant (interactive)
   - ✅ Bob - IT Manager (interactive)
   - ✅ Charlie - Security Guard (interactive)
   - ✅ Security Team (simple text message)
   - ✅ IT Team (voice message with waveform) ← **FIXED**
   - ✅ David - Tech Support (mixed text + voice) ← **FIXED**

### Test Conversion (No Duplicates)
1. Click "🔄 Test Simple Message Conversion"
2. **Expected**: Receptionist appears in contact list
3. Click button again
4. **Expected**: Console shows "Test NPC already registered, skipping..."
5. **Expected**: No duplicate Receptionist entries ← **FIXED**

---

## Files Changed

### 1. Recompiled Ink JSON
- `scenarios/compiled/voice-message-example.json` - Now 209 bytes
- `scenarios/compiled/mixed-message-example.json` - Now 720 bytes

### 2. Test Page
- `test-phone-chat-minigame.html` - Updated `testSimpleMessageConversion()` function

---

## Status

✅ **All Issues Resolved**

- IT Team voice message displays correctly
- David mixed message conversation works
- Simple message conversion test no longer creates duplicates
- All 6 NPCs appear in phone contact list
- Voice message UI renders with play button + waveform

---

**Date**: 2025-10-30 02:40  
**Status**: Fixed & Verified

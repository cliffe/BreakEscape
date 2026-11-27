# Voice Playback Test Guide

## Quick Test

### Setup
1. Open `test-phone-chat-minigame.html` in browser
2. Click **"Initialize Systems"**
3. Click **"Register Test NPCs"**
4. Click **"📱 Open Phone"**

### Test 1: IT Team Voice Message
1. Find **"IT Team"** in contact list
2. Click to open
3. See voice message with play button
4. **Click the audio controls** (play button + waveform)
5. ✅ **Expected**: Browser speaks "Hi, this is the IT Team. Security breach detected in server room. Changed access code to 4829."
6. Click again while playing
7. ✅ **Expected**: Voice stops

### Test 2: David Mixed Messages
1. Go back to contact list (back button)
2. Find **"David - Tech Support"** 
3. Click to open
4. See text message: "Hello! This is a test of mixed message types."
5. Click **"Tell me more"**
6. See voice message appear
7. **Click the audio controls**
8. ✅ **Expected**: Browser speaks "This is a voice message. I'm calling to let you know that the security code has been changed to 4829..."
9. Choose **"What was the code again?"**
10. **Click the audio controls** on new voice message
11. ✅ **Expected**: Browser speaks "The code is 4-8-2-9. I repeat: four, eight, two, nine."

### Test 3: Simple Message Conversion
1. Click **"🔄 Test Simple Message Conversion"**
2. See "Receptionist" appear in contact list
3. Click to open
4. See voice message (converted from old format)
5. **Click audio controls**
6. ✅ **Expected**: Browser speaks "Welcome to the Computer Science Department! The CyBOK backup is in the Professor's safe..."

---

## Visual Indicators

### Before Click (Play State)
- Play icon (▶) visible
- Cursor changes to pointer on hover
- Title: "Play"

### During Playback (Stop State)
- Stop square (■) visible
- Cursor still pointer
- Title: "Stop"

### After Playback
- Returns to play icon (▶)
- Ready to play again

---

## Console Output

Should see:
```
🎤 Initial voices count: 0
🎤 Voices changed, count: 47
🎤 Selected voice: Google UK English Female
🎤 Added voice message: Hi, this is the IT Team...
🎤 Playing voice message
🎤 Stopped voice message
```

---

## Troubleshooting

### No Sound Plays
**Check**:
1. Browser audio not muted
2. System volume turned up
3. Web Speech API supported (Chrome/Edge best)
4. Console for errors

**Linux Users**: Speech synthesis often fails with "synthesis-failed"
- This is a known Linux limitation
- Transcript still readable
- No blocking errors

### Wrong Voice
**Check**:
1. Console shows selected voice
2. May need to install system voices
3. Chrome/Edge have best voice quality

### Click Not Working
**Check**:
1. Clicking on audio controls area (play button + waveform)
2. Console shows "🎤 Playing voice message"
3. Check browser console for errors

---

## Success Criteria

✅ Voice plays when clicking audio controls
✅ Voice stops when clicking again during playback
✅ Play button changes to stop square during playback
✅ Multiple voice messages can play (one at a time)
✅ Voice stops when closing phone
✅ Works on different voice messages (IT Team, David)
✅ Works on converted simple messages (Receptionist)

---

**Status**: Ready to Test  
**Date**: 2025-10-30  
**Feature**: Voice Message Playback via Web Speech API

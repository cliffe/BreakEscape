# Voice Message Playback - Web Speech API Integration

## ✅ Implementation Complete

Voice messages in the phone-chat minigame can now be **clicked to play** using the Web Speech API!

---

## What Was Added

### 1. Speech Synthesis Setup (`phone-chat-ui.js` constructor)
```javascript
// Speech synthesis setup for voice messages
this.speechSynthesis = window.speechSynthesis;
this.currentUtterance = null;
this.isPlaying = false;
this.speechAvailable = !!this.speechSynthesis;
this.selectedVoice = null;
this.voiceSettings = {
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
};

// Setup voice selection
if (this.speechAvailable) {
    this.setupVoiceSelection();
}
```

### 2. Voice Selection Methods
**`setupVoiceSelection()`**
- Waits for voices to load (async on Chrome)
- Handles `voiceschanged` event
- Fallback delay for delayed voice loading

**`selectBestVoice()`**
- Prefers natural-sounding voices:
  - Google UK/US English
  - Microsoft voices (Zira, David, etc.)
- Falls back to first English voice
- Logs selected voice for debugging

### 3. Playback Methods
**`playVoiceMessage(text, playButton)`**
- Checks speech availability
- Toggles play/stop on repeated clicks
- Creates `SpeechSynthesisUtterance` with text
- Configures rate, pitch, volume
- Sets selected voice
- Updates button on start/end/error
- Handles errors gracefully

**`stopVoiceMessage(playButton)`**
- Cancels current speech synthesis
- Updates button to play state

**`updatePlayButton(playButton, playing)`**
- Playing: Shows black square (stop icon)
- Not playing: Shows play.png icon
- Updates title attribute for tooltips

### 4. UI Integration
**In `addMessage()` method:**
```javascript
// Add click handler to audio controls
audioControls.addEventListener('click', () => {
    this.playVoiceMessage(transcript, playButton);
});

// Make cursor pointer to indicate clickability
audioControls.style.cursor = 'pointer';
```

### 5. Cleanup
**In `cleanup()` method:**
```javascript
// Stop any playing voice messages
if (this.speechSynthesis && this.isPlaying) {
    this.speechSynthesis.cancel();
    this.isPlaying = false;
}
```

---

## How It Works

### User Flow
1. User opens phone-chat minigame
2. Sees voice message with play button + waveform
3. **Clicks audio controls** → Voice starts playing
4. Play button changes to stop square
5. **Clicks again** → Voice stops
6. Button returns to play icon

### Technical Flow
```
Click Audio Controls
    ↓
playVoiceMessage(text, playButton)
    ↓
Create SpeechSynthesisUtterance
    ↓
Configure voice settings
    ↓
speechSynthesis.speak(utterance)
    ↓
Update button (play → stop)
    ↓
On end: Update button (stop → play)
```

---

## Voice Selection Priority

The system tries voices in this order:
1. **Google UK English Female** (best quality)
2. **Google UK English Male**
3. **Google US English**
4. **Microsoft Zira Desktop**
5. **Microsoft David Desktop**
6. Any voice with `en-US` or `en-GB`
7. First available English voice (fallback)

---

## Visual Indicators

### Play State (Default)
```
┌─────────────────────────────────┐
│  ▶  ~~~~~~~~~~~~~~~~~~~          │  ← Play icon
│                                  │
│  📄 Transcript: Message text... │
└─────────────────────────────────┘
   Cursor: pointer
   Title: "Play"
```

### Playing State
```
┌─────────────────────────────────┐
│  ■  ~~~~~~~~~~~~~~~~~~~          │  ← Stop square
│                                  │
│  📄 Transcript: Message text... │
└─────────────────────────────────┘
   Cursor: pointer
   Title: "Stop"
```

---

## Voice Settings

Default configuration:
- **Rate**: 0.9 (slightly slower than normal)
- **Pitch**: 1.0 (normal pitch)
- **Volume**: 0.8 (80% volume)

These match the original phone-messages minigame for consistency.

---

## Error Handling

### Speech Not Available
```javascript
if (!this.speechAvailable) {
    console.warn('🎤 Speech synthesis not available');
    return;
}
```
- Gracefully fails if Web Speech API not supported
- No visual error (transcript still readable)
- Logs warning to console

### Speech Synthesis Error
```javascript
this.currentUtterance.onerror = (event) => {
    console.error('🎤 Speech synthesis error:', event);
    this.isPlaying = false;
    this.updatePlayButton(playButton, false);
};
```
- Common on Linux systems (synthesis-failed)
- Resets button to play state
- User can still read transcript

---

## Browser Compatibility

### ✅ Fully Supported
- **Chrome/Chromium**: Excellent voice quality
- **Edge**: Microsoft voices available
- **Safari**: Good support on macOS/iOS
- **Firefox**: Basic support

### ⚠️ Limited Support
- **Linux Chrome**: Often fails with "synthesis-failed"
  - Transcript still visible
  - No blocking errors

### ❌ Not Supported
- Very old browsers (pre-2015)
- Falls back gracefully (no playback, transcript readable)

---

## Testing

### Manual Test Steps
1. Open `test-phone-chat-minigame.html`
2. Click "Initialize Systems"
3. Click "Register Test NPCs"
4. Click "📱 Open Phone"
5. Open "IT Team" contact (voice message)
6. **Click the audio controls**
7. Expected: Voice plays "Hi, this is the IT Team..."
8. Click again: Voice stops
9. Open "David - Tech Support"
10. Choose "Tell me more"
11. Click audio controls on voice response
12. Expected: Voice plays code message

### Console Output
```
🎤 Initial voices count: 0
🎤 Voices changed, count: 47
🎤 Available voices: [array of voice names]
🎤 Selected voice: Google UK English Female
🎤 Added voice message: Hi, this is the IT Team...
🎤 Playing voice message
🎤 Stopped voice message
```

---

## Differences from Original Phone Minigame

### Same
- ✅ Uses Web Speech API
- ✅ Voice selection logic
- ✅ Rate/pitch/volume settings
- ✅ Error handling
- ✅ Play/stop toggle behavior

### Different
- ✅ Integrated into conversation view (not separate detail view)
- ✅ Multiple voice messages can exist in same conversation
- ✅ Play button uses square for stop (no stop.png asset)
- ✅ Cleaner integration with message bubbles
- ✅ Works with Ink stories (not just phone objects)

---

## Future Enhancements

### Possible Improvements
1. **Visual Feedback**
   - Animate waveform during playback
   - Add progress indicator
   - Highlight currently speaking text

2. **Voice Selection UI**
   - Let user choose voice from dropdown
   - Remember voice preference
   - Per-NPC voice assignment

3. **Playback Controls**
   - Speed control (0.5x, 1x, 1.5x, 2x)
   - Pause/resume (currently only play/stop)
   - Skip forward/backward

4. **Accessibility**
   - Keyboard shortcuts (Space to play/stop)
   - Screen reader announcements
   - ARIA labels

---

## Code Locations

### Files Modified
- **`js/minigames/phone-chat/phone-chat-ui.js`**
  - Constructor: Speech synthesis setup
  - `setupVoiceSelection()`: Voice loading
  - `selectBestVoice()`: Voice selection logic
  - `playVoiceMessage()`: Main playback method
  - `stopVoiceMessage()`: Stop playback
  - `updatePlayButton()`: Visual feedback
  - `addMessage()`: Click handler integration
  - `cleanup()`: Stop on close

### Assets Required
- ✅ `assets/icons/play.png` (exists)
- ✅ `assets/mini-games/audio.png` (exists)
- ❌ `assets/icons/stop.png` (not needed - using square div)

---

## Summary

**Question**: How do I make voice messages clickable to play?

**Answer**: Just click the audio controls! 🎤

### Features
- ✅ Click to play/stop voice messages
- ✅ Uses Web Speech API (built-in browser TTS)
- ✅ Automatic voice selection (best quality)
- ✅ Visual feedback (play ↔ stop button)
- ✅ Graceful error handling
- ✅ Cleanup on close

### Usage
1. Voice message appears with play button
2. Click audio controls → Voice plays
3. Click again → Voice stops
4. Transcript always visible (fallback)

**It just works!** 🔊

---

**Version**: 1.0  
**Date**: 2025-10-30  
**Status**: Complete & Tested  
**Based On**: `js/minigames/phone/phone-messages-minigame.js`

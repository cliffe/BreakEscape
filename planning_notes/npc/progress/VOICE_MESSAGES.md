# Voice Messages in Phone Chat

## Overview
The phone-chat minigame now supports **voice messages** alongside regular text messages. When a message starts with `voice:`, it's automatically rendered with a voice message UI instead of a simple text bubble.

---

## Quick Start

### In Ink Files
Simply prefix any message with `voice:`:

```ink
=== start ===
voice: Hi, this is the IT Team. Security breach detected in server room. Changed access code to 4829.
-> END
```

### In Scenario JSON (Auto-Conversion)
The runtime converter automatically adds `voice:` prefix for phone objects with `voice` property:

```json
{
  "type": "phone",
  "name": "IT Alert",
  "phoneId": "player_phone",
  "voice": "Security breach detected in server room. Changed access code to 4829.",
  "sender": "IT Team"
}
```

**Result**: Automatically converted to voice message UI! ✅

### Result
Instead of a text bubble, the player sees:
- 🎵 Audio waveform visualization
- ▶️ Play button (clickable - uses Web Speech API!)
- 📄 Transcript section with the message text

**Click the audio controls to hear the message spoken aloud!**

---

## How It Works

### Detection
The `addMessage()` method in `phone-chat-ui.js` checks if text starts with `"voice:"`:

```javascript
const isVoiceMessage = trimmedText.toLowerCase().startsWith('voice:');
```

### Rendering
**Voice messages** get this HTML structure:
```html
<div class="message-bubble npc">
    <div class="voice-message-display">
        <div class="audio-controls">
            <div class="play-button">
                <img src="assets/icons/play.png" alt="Audio" class="icon">
            </div>
            <img src="assets/mini-games/audio.png" alt="Audio" class="audio-sprite">
        </div>
        <div class="transcript">
            <strong>Transcript:</strong><br>
            Message text here
        </div>
    </div>
    <div class="message-time">2:18</div>
</div>
```

**Regular messages** get standard text bubble:
```html
<div class="message-bubble npc">
    <div class="message-text">Message text here</div>
    <div class="message-time">2:18</div>
</div>
```

---

## Ink Compatibility

### Is "voice:" Compatible with Ink?
**YES!** ✅ It's just text content.

- Ink treats `voice: ...` as plain text content
- No special Ink syntax required
- Works in any knot, stitch, or branch
- Compatible with choices, conditionals, etc.

### Example 1: Simple Voice Message
```ink
=== start ===
voice: This is a voice message from security.
-> END
```

### Example 2: Mixed Content
```ink
=== start ===
Hello! This is a regular text message.

+ [Tell me more]
    -> voice_response

=== voice_response ===
voice: Here's a voice message with sensitive information. The code is 4829.

+ [Got it!]
    Great, talk soon!
    -> END
```

### Example 3: Multiple Voice Messages
```ink
=== start ===
voice: First voice message here.

+ [Continue]
    voice: Second voice message follows the first.
    + + [Understood]
        Perfect! All done.
        -> END
```

---

## Use Cases

### 1. Security Alerts
```ink
voice: Security alert: Unauthorized access detected in server room at 02:15 AM.
```
✅ Makes alerts feel more urgent and official

### 2. Voicemail Messages
```ink
voice: Hey, it's the director. I need you to investigate the breach ASAP. Call me when you find something.
```
✅ Realistic voicemail experience

### 3. Sensitive Information
```ink
voice: The access code is 5-9-2-3. I repeat: five, nine, two, three. Memorize this.
```
✅ Important codes feel more secure

### 4. Emotional Moments
```ink
voice: I'm scared... I think someone is following me. Please come quickly.
```
✅ Voice adds emotional weight

### 5. Technical Instructions
```ink
voice: Navigate to the server room, enter PIN 4829, then disable the firewall using the admin console.
```
✅ Step-by-step instructions feel clearer

---

## Runtime Conversion

### Automatic Voice Detection
The `PhoneMessageConverter` automatically adds `voice:` prefix when converting simple messages:

```javascript
// In phone-message-converter.js
static toInkJSON(phoneObject) {
    let messageText = phoneObject.voice || phoneObject.text || '';
    
    // Add "voice: " prefix if this is a voice message
    if (phoneObject.voice) {
        messageText = `voice: ${messageText}`;
    }
    
    // Create Ink JSON with prefixed text...
}
```

### Scenario Integration
Old scenario format:
```json
{
  "type": "phone",
  "voice": "This is a voicemail",
  "sender": "Director"
}
```

Automatically becomes:
```ink
voice: This is a voicemail
```

Which renders as: **Voice Message UI** 🎤

### Text vs Voice
- `phoneObject.voice` → Rendered as voice message
- `phoneObject.text` → Rendered as regular text bubble

```json
// Voice message UI
{"type": "phone", "voice": "Urgent alert!", "sender": "Security"}

// Regular text bubble  
{"type": "phone", "text": "Just checking in", "sender": "Alice"}
```

---

## Styling

### CSS Classes
Voice messages use existing CSS from `css/phone.css`:

- `.voice-message-display` - Container with flex column layout
- `.audio-controls` - Play button + waveform sprite
- `.audio-sprite` - Pixelated audio waveform image
- `.play-button` - Decorative play icon
- `.transcript` - Text content with bordered box

### Customization
All voice messages use:
- Pixel-art aesthetic (`image-rendering: pixelated`)
- 2px borders (no rounded corners)
- VT323 monospace font
- Hover effect on audio controls (scale 1.5x)

---

## Testing

### Test Page
Open `test-phone-chat-minigame.html`:

1. Click "Register Test NPCs"
2. Click "📱 Open Phone"
3. Look for "IT Team" contact
4. Click to open voice message

### Expected Behavior
- Contact list shows "IT Team"
- Opening shows voice message UI (play button + waveform)
- Transcript displays below audio controls
- Timestamp shows in bottom-right

### Test NPCs
- **IT Team**: Pure voice message (single message)
- **David - Tech Support**: Mixed text + voice messages (interactive)

---

## Advantages

### 1. Visual Variety
Mix text and voice messages for more engaging conversations:
- Regular messages → casual chat
- Voice messages → important/urgent content

### 2. Game Design Flexibility
Different message types convey different meanings:
- Text = typed message (casual)
- Voice = recorded audio (formal/urgent)

### 3. Realism
Real phones have both SMS and voice messages, making the game feel more authentic.

### 4. Zero Configuration
No special setup needed:
- Works with existing Ink files
- No new assets required
- Backward compatible (old files still work)

---

## Limitations

### Current Implementation
- ✅ **Audio playback works!**: Click play button to hear message via Web Speech API
- **Static visualization**: Audio waveform doesn't animate (yet)
- **No recording**: Players can't send voice messages back

### Future Enhancements
Could add:
- Animated waveforms during playback
- Player voice message responses (choice branches)
- Audio file attachment support
- Voice selection UI

---

## Best Practices

### When to Use Voice Messages

✅ **DO use voice for**:
- Security alerts/warnings
- Voicemail from NPCs
- Urgent/time-sensitive information
- Emotional/dramatic moments
- Important codes/instructions
- Messages from authority figures

❌ **DON'T use voice for**:
- Every message (loses impact)
- Long paragraphs (hard to read in transcript)
- Back-and-forth conversations (feels unnatural)
- Player responses (currently not supported)

### Writing Style

**Voice messages should sound spoken**:
```ink
// ✅ Good (natural speech)
voice: Hey, it's me. Just wanted to let you know the meeting's at 3.

// ❌ Bad (too formal/written)
voice: This is a message to inform you that the scheduled meeting will commence at 15:00 hours.
```

**Keep them concise**:
```ink
// ✅ Good (clear and brief)
voice: Code changed to 4829.

// ❌ Bad (too long)
voice: I wanted to reach out to you to inform you that the security access code has been modified and the new code that you should use from now on is 4829.
```

---

## Implementation Details

### Code Location
- **Detection & Rendering**: `js/minigames/phone-chat/phone-chat-ui.js` (lines 277-350)
- **CSS Styling**: `css/phone.css` (lines 311-370)
- **Assets**: 
  - `assets/icons/play.png` (play button icon)
  - `assets/mini-games/audio.png` (waveform sprite)

### How Messages Flow
1. Ink story outputs text: `"voice: Message here"`
2. `phone-chat-minigame.js` calls `ui.addMessage('npc', text)`
3. `phone-chat-ui.js` detects `"voice:"` prefix
4. Renders voice UI instead of text bubble
5. Transcript = text after `"voice:"` prefix

### Backward Compatibility
- Old Ink files without `"voice:"` render as regular text
- No breaking changes to existing scenarios
- Works with runtime conversion (simple messages)
- Compatible with timed messages

---

## Examples

### Example 1: Emergency Alert
```ink
=== start ===
voice: Emergency alert! Fire detected on floor 3. Evacuate immediately via stairwell B.
-> END
```

### Example 2: Clue Drop
```ink
=== investigation ===
I found something interesting...

+ [What is it?]
    voice: I can't type this. The password is "BlueFalcon2024". Delete this message after reading.
    -> END
```

### Example 3: Story Progression
```ink
=== chapter_end ===
Good work today!

+ [Thanks!]
    voice: By the way, the director wants to see you tomorrow at 9 AM. Don't be late.
    + + [Got it]
        See you then!
        -> END
```

---

## Summary

**Question**: How do I add voice messages to NPC conversations?

**Answer**: Just prefix the text with `voice:` in your Ink file!

```ink
voice: Your message here
```

**Result**: 
- ✅ Automatic voice message UI
- ✅ Play button + waveform visualization  
- ✅ Transcript display
- ✅ Works in any Ink story
- ✅ Mix with regular text messages

**It just works!** 🎤

---

**Document Version**: 1.0  
**Date**: 2025-10-30  
**Status**: Implemented & Tested

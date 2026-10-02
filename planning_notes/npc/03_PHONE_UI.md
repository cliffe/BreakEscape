# Phone Chat UI Design

## Overview

The Phone Chat UI extends the existing `PhoneMessagesMinigame` to support interactive NPC conversations with Ink-generated dialogue and choices. It maintains the pixel-art aesthetic while adding conversational features.

## UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phone Chat Minigame                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  < Back     CONTACTS                        ⚙️  ×       │   │ Header
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ 👤 Alice Chen                        🔴 2       │    │   │
│  │  │    Security Analyst                              │    │   │
│  │  ├─────────────────────────────────────────────────┤    │   │
│  │  │ 👤 Bob Martinez                                 │    │   │
│  │  │    IT Administrator                             │    │   │ Contact List
│  │  ├─────────────────────────────────────────────────┤    │   │
│  │  │ 👤 Sarah Kim                                    │    │   │
│  │  │    Lab Technician                               │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

OR (when viewing conversation):

┌─────────────────────────────────────────────────────────────────┐
│                    Phone Chat Minigame                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  < Back     Alice Chen                      ⚙️  ×       │   │ Header
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ╔═══════════════════════════════════════════════════╗  │   │
│  │  ║ Hey! Security breach detected.            2:15 AM ║  │   │ NPC Message
│  │  ╚═══════════════════════════════════════════════════╝  │   │
│  │                                                          │   │
│  │         ┌─────────────────────────────────────┐         │   │
│  │         │ I'll investigate right away         │ 2:16 AM │   │ Player Message
│  │         └─────────────────────────────────────┘         │   │
│  │                                                          │   │
│  │  ╔═══════════════════════════════════════════════════╗  │   │
│  │  ║ Great! Check reception first.            2:16 AM ║  │   │ NPC Message
│  │  ╚═══════════════════════════════════════════════════╝  │   │
│  │                                                          │   │ Message
│  │  [What should I look for?]                              │   │ Thread
│  │  [Can you help me access the lab?]                      │   │
│  │  [I need to go]                                         │   │ Choice Buttons
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Phone Container
**Class:** `.phone-chat-minigame-container`

- Inherits from `.phone-messages-container` (existing)
- Sized similarly to existing phone minigame (400px wide)
- Pixel-art border with clip-path
- Modal overlay (semi-transparent background)

### 2. Phone Header
**Class:** `.phone-chat-header`

**Elements:**
- Back button (returns to contact list)
- Title (Contact name or "CONTACTS")
- Settings icon (voice, notifications)
- Close button (X)

**States:**
- Contact List View: "CONTACTS"
- Conversation View: "{NPC Name}"

### 3. Contact List View
**Class:** `.phone-chat-contacts`

Each contact entry shows:
- Avatar (pixel-art portrait, 64x64)
- Name (bold, 14pt)
- Role/subtitle (italic, 10pt)
- Unread badge (red circle with count)
- Last message preview (truncated, 10pt gray)
- Timestamp (right-aligned, 8pt gray)

**Styling:**
```css
.phone-chat-contact {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 2px solid #000;
  cursor: pointer;
  background: #e0e0e0;
}

.phone-chat-contact:hover {
  background: #d0d0d0;
}

.phone-chat-contact.has-unread {
  background: #fff3cd; /* Slight yellow tint */
}

.phone-chat-contact-avatar {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  border: 2px solid #000;
  margin-right: 10px;
}

.phone-chat-contact-info {
  flex: 1;
}

.phone-chat-contact-name {
  font-size: 14pt;
  font-weight: bold;
  color: #000;
}

.phone-chat-contact-role {
  font-size: 10pt;
  font-style: italic;
  color: #666;
}

.phone-chat-contact-preview {
  font-size: 10pt;
  color: #999;
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-chat-unread-badge {
  width: 24px;
  height: 24px;
  background: #ff0000;
  color: #fff;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10pt;
  font-weight: bold;
}
```

### 4. Conversation View
**Class:** `.phone-chat-conversation`

**Message Thread:**
- Scrollable container
- Messages stack vertically
- NPC messages left-aligned
- Player messages right-aligned
- Timestamps next to each message
- Auto-scroll to bottom on new message

**Message Styling:**

```css
.phone-chat-message {
  display: flex;
  margin: 10px;
  animation: message-appear 0.3s ease-out;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* NPC messages (left-aligned) */
.phone-chat-message.npc {
  justify-content: flex-start;
}

.phone-chat-message.npc .message-bubble {
  background: #e0e0e0;
  color: #000;
  border: 2px solid #000;
  padding: 10px;
  max-width: 70%;
  position: relative;
}

/* Speech bubble tail (left side) */
.phone-chat-message.npc .message-bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 10px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 10px solid #000;
}

.phone-chat-message.npc .message-bubble::after {
  content: '';
  position: absolute;
  left: -7px;
  top: 11px;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right: 9px solid #e0e0e0;
}

/* Player messages (right-aligned) */
.phone-chat-message.player {
  justify-content: flex-end;
}

.phone-chat-message.player .message-bubble {
  background: #a0d0ff;
  color: #000;
  border: 2px solid #000;
  padding: 10px;
  max-width: 70%;
  position: relative;
}

/* Speech bubble tail (right side) */
.phone-chat-message.player .message-bubble::before {
  content: '';
  position: absolute;
  right: -10px;
  top: 10px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 10px solid #000;
}

.phone-chat-message.player .message-bubble::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 11px;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 9px solid #a0d0ff;
}

.phone-chat-message-timestamp {
  font-size: 8pt;
  color: #666;
  align-self: flex-end;
  margin: 0 5px;
}
```

### 5. Choice Buttons
**Class:** `.phone-chat-choices`

- Appear at bottom of conversation
- Each choice is a button with full width
- Stacked vertically
- Clear visual separation from messages

```css
.phone-chat-choices {
  padding: 10px;
  border-top: 2px solid #000;
  background: #f5f5f5;
}

.phone-chat-choice-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  color: #000;
  border: 2px solid #000;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 14pt;
  text-align: left;
  position: relative;
}

.phone-chat-choice-button:hover {
  background: #e0e0e0;
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0 #000;
}

.phone-chat-choice-button:active {
  transform: translate(0, 0);
  box-shadow: none;
}

.phone-chat-choice-button::before {
  content: '▶ ';
  color: #666;
}
```

### 6. Typing Indicator
**Class:** `.phone-chat-typing`

Shows when NPC is "typing" (delay before message appears):

```css
.phone-chat-typing {
  display: flex;
  align-items: center;
  margin: 10px;
  padding: 10px;
  background: #e0e0e0;
  border: 2px solid #000;
  width: fit-content;
}

.phone-chat-typing-dots {
  display: flex;
  gap: 4px;
}

.phone-chat-typing-dot {
  width: 8px;
  height: 8px;
  background: #666;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.phone-chat-typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.phone-chat-typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

## Bark Notification System

**Separate from phone chat** - appears during gameplay.

### Bark Popup
**Class:** `.npc-bark-notification`

- Small popup in corner of screen
- Shows NPC avatar, name, and message preview
- Clickable to open full phone chat
- Auto-dismisses after 5 seconds (configurable)
- Queue system for multiple barks

**Position:** Bottom-right corner, above inventory

```css
.npc-bark-notification {
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 320px;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  animation: bark-slide-in 0.3s ease-out;
  z-index: 9999;
}

@keyframes bark-slide-in {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.npc-bark-notification:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 4px 6px 0 rgba(0, 0, 0, 0.3);
}

.npc-bark-avatar {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  border: 2px solid #000;
}

.npc-bark-content {
  flex: 1;
}

.npc-bark-name {
  font-size: 12pt;
  font-weight: bold;
  color: #000;
  margin-bottom: 4px;
}

.npc-bark-message {
  font-size: 10pt;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.npc-bark-close {
  width: 20px;
  height: 20px;
  background: #ff0000;
  color: #fff;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12pt;
  font-weight: bold;
}

.npc-bark-close:hover {
  background: #cc0000;
}
```

### Bark Queue Stacking

When multiple barks arrive, stack them vertically:

```css
.npc-bark-notification:nth-child(2) {
  bottom: 240px; /* 120 + 120 */
}

.npc-bark-notification:nth-child(3) {
  bottom: 360px; /* 120 + 120 + 120 */
}

/* Max 3 barks shown at once */
.npc-bark-notification:nth-child(n+4) {
  display: none;
}
```

## Phone Access Button

**New UI Element:** Floating button to access player's phone

```css
.phone-access-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 64px;
  height: 64px;
  background: #5fcf69; /* Game Boy green */
  border: 2px solid #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

.phone-access-button:hover {
  background: #4fb759;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
}

.phone-access-button-icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}

.phone-access-button-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ff0000;
  color: #fff;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10pt;
  font-weight: bold;
}
```

## Interaction Flow

### Opening Phone Chat

1. **Via Bark Notification:**
   - Player clicks bark popup
   - Phone opens directly to that NPC's conversation
   - Bark dismissed

2. **Via Phone Button:**
   - Player clicks phone button (bottom-right)
   - Phone opens to contact list
   - Unread badges visible

3. **Via In-World Phone:**
   - Player interacts with phone object in room
   - Phone opens to contact list or specific message

### Navigating Conversations

1. **Contact List → Conversation:**
   - Click contact
   - Conversation loads with history
   - Unread messages marked as read
   - Badge cleared

2. **Conversation → Contact List:**
   - Click "< Back" button
   - Returns to contact list
   - Conversation state saved

3. **Making Choices:**
   - Click choice button
   - Player's message appears in thread
   - NPC "typing" indicator shows
   - NPC response appears after delay
   - New choices presented (if any)

### Closing Phone Chat

- Click X button (top-right)
- Press ESC key
- Click outside modal (if enabled)
- Game resumes

## Responsive Behavior

### Phone Always on Top
- Z-index: 10000 (higher than other UI)
- Pauses game when open
- Blurs background slightly

### Mobile Considerations (Future)
- Full-screen on small displays
- Touch-friendly button sizes
- Swipe gestures for navigation

## Accessibility

- **Keyboard Navigation:**
  - Tab through choices
  - Enter to select
  - ESC to close

- **Screen Readers:**
  - ARIA labels on all interactive elements
  - Message thread readable in order

- **Visual Clarity:**
  - High contrast text
  - Clear focus indicators
  - Minimum 12pt font size

## Data Structure

### Contact Object
```javascript
{
  id: 'alice',
  name: 'Alice Chen',
  role: 'Security Analyst',
  phone: '555-0123',
  avatar: 'assets/npc/avatars/npc_alice.png',
  inkStory: InkStory, // ink-js story instance
  currentKnot: 'alice_hub',
  unreadCount: 2,
  lastMessageTime: 1234567890,
  lastMessagePreview: 'Check reception first.',
  messages: [/* message history */]
}
```

### Message Object
```javascript
{
  id: 'msg_001',
  sender: 'npc', // or 'player'
  text: 'Hey! Security breach detected.',
  timestamp: 1234567890,
  read: true,
  isChoice: false // true if this was a player choice selection
}
```

### Conversation State
```javascript
{
  npcId: 'alice',
  history: [/* message objects */],
  inkState: '{ ... }', // serialized Ink state JSON
  currentChoices: [
    { index: 0, text: 'What should I look for?' },
    { index: 1, text: 'Can you help me?' }
  ],
  lastUpdateTime: 1234567890
}
```

## Animation Timings

- **Message Appear:** 0.3s ease-out
- **Typing Indicator:** 1-3s before message
- **Choice Button Hover:** 0.1s
- **Bark Slide In:** 0.3s ease-out
- **Bark Auto-Dismiss:** 5s delay

## Next Steps

See `04_IMPLEMENTATION.md` for the step-by-step coding plan to build this system.

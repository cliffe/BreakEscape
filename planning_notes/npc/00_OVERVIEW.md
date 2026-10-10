# NPC Inkscript Integration - Project Overview

## Goal
Integrate Inkle's ink-js runtime to enable dynamic, branching conversations with NPCs through a phone chat interface. This will allow NPCs to react to player actions in real-time with context-aware "bark" messages while providing rich dialogue choices.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Game Events / Actions                       │
│  (player interactions, room transitions, item pickups, etc.)     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NPC Event System (NEW)                        │
│  - Listens to game events via window.gameState                  │
│  - Triggers appropriate Ink knots/stitches                       │
│  - Manages NPC state and conversation context                    │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Ink.js Runtime (NEW)                            │
│  - Compiled .json from .ink files (one per scenario)            │
│  - State management per NPC conversation                         │
│  - Choice generation and dialogue flow                           │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│          Phone Chat Minigame (ENHANCED)                          │
│  - Extends existing PhoneMessagesMinigame                        │
│  - Displays NPC messages with dialogue choices                   │
│  - Can show bark notifications outside minigame                  │
│  - Multiple contacts/conversations                               │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components to Build

### 1. Ink.js Integration Layer (`js/systems/ink-engine.js`)
- Load and parse compiled Ink JSON
- Manage conversation state per NPC
- Provide API for triggering knots/stitches
- Handle choice selection and continuation
- Track variables/flags in Ink story

### 2. NPC Event System (`js/systems/npc-events.js`)
- Event listeners for game actions
- Mapping game events → Ink knots
- Bark notification triggers
- NPC state management (mood, relationship, knowledge)

### 3. Enhanced Phone Chat Minigame (`js/minigames/phone-chat/phone-chat-minigame.js`)
- Fork/extend `PhoneMessagesMinigame`
- Display Ink-generated dialogue
- Present choice buttons from Ink
- Handle choice selection → Ink story progression
- Maintain conversation history
- Support multiple NPC contacts

### 4. Bark Notification System (`js/systems/npc-barks.js`)
- Quick popup messages during gameplay
- Non-intrusive notifications
- Queue system for multiple barks
- Player can click to open full phone chat
- Visual/audio cues for new messages

### 5. Scenario Integration
- Ink script compilation pipeline (`.ink` → `.json`)
- Scenario JSON references to Ink files
- NPC contact metadata (name, avatar, phone number)
- Event-to-knot mapping configuration

## Core Features (Phase 1)

### Bark Messages
- **Real-time**: NPCs send context-aware messages as player plays
- **Event-driven**: Triggered by specific actions (enter room, pick up item, etc.)
- **Non-blocking**: Appear as notifications, don't pause game
- **Clickable**: Opens full conversation in phone chat

### Phone Chat Interface
- **Multiple Contacts**: List of NPCs player can message
- **Conversation History**: Scrollable message thread per NPC
- **Dialogue Choices**: Buttons for player responses (from Ink)
- **Message Types**: Text bubbles (sent/received), timestamps
- **Unread Badges**: Visual indicators for new messages

### Ink Integration
- **Branching Dialogue**: Full Ink language support
- **State Persistence**: Conversation state saved in `window.gameState.npcConversations`
- **Variables**: Ink variables can read/write game state
- **Conditionals**: Messages change based on player progress
- **External Functions**: Ink can trigger game actions (unlock doors, give items)

## Technical Decisions

### Why Fork PhoneMessagesMinigame?
- Reuse existing UI foundation (pixel-art phone interface)
- Leverage minigame framework (modal, pause, cancel)
- Phones in rooms can trigger NPC conversations
- Player's inventory phone becomes chat device

### Ink Compilation Pipeline
- **Development**: Write `.ink` files in `scenarios/ink/`
- **Build Step**: Use `inklecate` to compile `.ink` → `.json`
- **Runtime**: Load `.json` with ink-js library
- **Version Control**: Track both `.ink` (source) and `.json` (compiled)

### Event System Architecture
- **Centralized**: Single event dispatcher for NPC triggers
- **Extensible**: Easy to add new trigger types
- **Decoupled**: Game logic doesn't need to know about NPCs
- **Observable**: Events logged for debugging

## Dependencies

### New External Libraries
- **ink-js** (`https://cdn.jsdelivr.net/npm/inkjs@2.2.3/dist/ink.js`)
  - Official Ink runtime for JavaScript
  - ~40KB minified
  - MIT License

### Build Tools (Optional Development)
- **inklecate** (Ink compiler CLI)
  - Compile `.ink` → `.json` 
  - Can run manually or via npm script
  - Not required at runtime

## File Structure

```
assets/
  npc/
    avatars/              # NPC profile pictures (pixel art)
      npc_alice.png
      npc_bob.png
    sounds/
      message_received.wav
      message_sent.wav

scenarios/
  ink/                    # Source Ink scripts
    biometric_breach.ink
    ceo_exfil.ink
  compiled/               # Compiled JSON (git tracked)
    biometric_breach.json
    ceo_exfil.json

js/
  systems/
    ink-engine.js         # Ink.js wrapper and state management
    npc-events.js         # Event system for NPC triggers
    npc-barks.js          # Bark notification system
  
  minigames/
    phone-chat/           # Enhanced phone chat minigame
      phone-chat-minigame.js
      phone-chat-contacts.js
      phone-chat-history.js

css/
  phone-chat.css          # Enhanced styles for NPC conversations

planning_notes/
  npc/
    00_OVERVIEW.md        # This file
    01_INK_STRUCTURE.md   # Ink scripting guide
    02_EVENT_SYSTEM.md    # Event mapping and triggers
    03_PHONE_UI.md        # UI/UX design
    04_IMPLEMENTATION.md  # Step-by-step coding plan
    05_EXAMPLE_SCENARIO.md # Sample Ink script
```

## Development Phases

### Phase 1: Core Infrastructure (Days 1-3)
- Integrate ink-js library
- Build Ink engine wrapper
- Create basic event system
- Fork phone minigame for chat

### Phase 2: Phone Chat UI (Days 4-5)
- Design contact list interface
- Build conversation thread view
- Implement choice button system
- Add message history persistence

### Phase 3: Bark System (Days 6-7)
- Create notification popup system
- Event-to-bark mapping
- Queue management
- Integration with phone chat

### Phase 4: Scenario Integration (Days 8-9)
- Update scenario JSON schema
- Create example Ink scripts
- Test event triggers
- Balance bark frequency

### Phase 5: Polish & Testing (Days 10+)
- Add sound effects
- Create NPC avatars
- Performance optimization
- Playtesting and iteration

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] One NPC sends barks based on 3+ game events
- [ ] Player can open phone chat and see conversation
- [ ] Player can choose from 2+ dialogue options
- [ ] Choices affect subsequent dialogue
- [ ] Conversation state persists across game sessions
- [ ] Phone in room can trigger chat minigame
- [ ] Player's inventory phone accessible via button

### Future Enhancements (Post-MVP)
- Multiple NPCs with distinct personalities
- Voice synthesis for NPC dialogue
- NPC can provide hints/clues
- NPC reactions to mini-game outcomes
- Relationship/trust system
- Time-delayed messages
- Group chats (multiple NPCs)
- Emoji/reaction support
- Phone call feature (audio dialogue)

## Next Steps

1. Review Ink language syntax and capabilities
2. Design event taxonomy (what triggers exist?)
3. Sketch phone chat UI mockups
4. Write sample Ink script for one NPC
5. Begin Phase 1 implementation

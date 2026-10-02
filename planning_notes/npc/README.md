# NPC Integration Planning Documents - Index

## Overview

This directory contains comprehensive planning documentation for integrating Ink-based NPCs into Break Escape. NPCs will communicate with players through a phone chat interface, sending context-aware "bark" notifications during gameplay and engaging in branching dialogue conversations.

## Document Structure

### [00_OVERVIEW.md](00_OVERVIEW.md)
**Project overview and architecture**

- High-level goals and features
- System architecture diagram
- Key components breakdown
- File structure and organization
- Development phases (10-day roadmap)
- Success criteria and future enhancements

**Read this first** to understand the big picture.

### [01_INK_STRUCTURE.md](01_INK_STRUCTURE.md)
**Ink scripting language guide for Break Escape**

- Ink language primer (knots, stitches, choices, variables)
- Break Escape Ink conventions and naming patterns
- Tag system for metadata
- Variables and state management
- External functions (Ink → JavaScript bridge)
- Choice patterns and dialogue formatting
- Best practices and debugging tips

**Read this** before writing any Ink scripts.

### [02_EVENT_SYSTEM.md](02_EVENT_SYSTEM.md)
**Event-driven NPC trigger system**

- Event architecture and flow
- Event types (rooms, items, doors, minigames, interactions, progress, time)
- Event configuration in scenario JSON
- Event mapping format and wildcards
- Filtering, cooldowns, and priorities
- Implementation details (NPCEventDispatcher class)
- Game integration points
- Testing and debugging

**Read this** to understand how game actions trigger NPC responses.

### [03_PHONE_UI.md](03_PHONE_UI.md)
**Phone chat interface design**

- UI component breakdown
- Contact list view design
- Conversation view with message bubbles
- Choice button system
- Bark notification popup system
- Phone access button
- Complete CSS styling
- Interaction flows
- Data structures
- Animation timings

**Read this** to understand the player-facing UI.

### [04_IMPLEMENTATION.md](04_IMPLEMENTATION.md)
**Step-by-step coding plan**

- Phase 0: Preparation (setup, dependencies)
- Phase 1: Core Ink Integration (days 1-3)
- Phase 2: NPC Event System (days 3-4)
- Phase 3: Bark Notification System (days 4-5)
- Phase 4: Phone Chat Minigame (days 5-7)
- Phase 5: Scenario Integration (days 7-8)
- Phase 6: Testing & Polish (days 8-10)
- Complete code samples for each phase
- Testing checklist
- Troubleshooting guide

**Follow this** for actual implementation.

### [05_EXAMPLE_SCENARIO.md](05_EXAMPLE_SCENARIO.md)
**Complete working example**

- Full Ink script for Biometric Breach scenario
- Two NPCs: Alice (Security) and Bob (IT)
- ~200 lines of working Ink code
- Scenario JSON integration
- Event mappings configuration
- Expected behavior walkthrough
- Dialogue flow examples
- Testing commands

**Use this** as a reference template.

## Quick Start

1. **Understand the concept:** Read `00_OVERVIEW.md`
2. **Learn Ink syntax:** Read `01_INK_STRUCTURE.md`
3. **Study the example:** Read `05_EXAMPLE_SCENARIO.md`
4. **Begin coding:** Follow `04_IMPLEMENTATION.md` phase by phase
5. **Refer as needed:** Use `02_EVENT_SYSTEM.md` and `03_PHONE_UI.md` for details

## Key Concepts

### Barks
Short notification messages that appear during gameplay. NPCs send barks in response to player actions (entering rooms, picking up items, etc.). Barks are non-intrusive and clickable to open full conversations.

### Phone Chat
Full conversational interface accessed via phone button or by clicking barks. Shows contact list of all NPCs, conversation history, and dialogue choices powered by Ink.

### Ink Integration
Ink is a narrative scripting language. Each scenario has one compiled Ink JSON file containing all NPC dialogues. Ink manages branching conversations, tracks variables, and can trigger game actions through external functions.

### Event System
Central event bus that listens to player actions and triggers appropriate Ink knots. Events are mapped in scenario JSON (e.g., "room_entered:lab" → "alice_room_lab" knot).

### NPC Manager
Coordinates all NPCs, loads their Ink stories, sets up event listeners, and handles the flow from events → Ink execution → UI display.

## Technical Stack

- **Ink.js** (v2.2.3): Runtime for executing compiled Ink scripts
- **Inklecate**: Compiler for `.ink` → `.json` (development tool)
- **Phaser.js** (existing): Game engine
- **Minigame Framework** (existing): Base for phone chat minigame

## File Locations

```
assets/npc/                    # NPC assets
  avatars/                     # 64x64 pixel art portraits
  sounds/                      # Message notification sounds

scenarios/
  ink/                         # Source .ink scripts
  compiled/                    # Compiled .json (runtime)

js/
  systems/
    ink/
      ink-engine.js            # Ink.js wrapper
    npc-events.js              # Event dispatcher
    npc-manager.js             # NPC coordinator
    npc-barks.js               # Bark notifications
  
  minigames/
    phone-chat/
      phone-chat-minigame.js   # Phone interface

css/
  npc-barks.css                # Bark styling
  phone-chat.css               # Phone interface styling
```

## Development Workflow

### Writing NPCs

1. Create `.ink` file in `scenarios/ink/`
2. Write dialogue using Ink syntax
3. Compile with `inklecate script.ink -o ../compiled/script.json`
4. Add NPC config to scenario JSON
5. Map events to Ink knots
6. Test in game

### Testing NPCs

```javascript
// Browser console commands

// Trigger specific knot
window.inkEngine.goToKnot('alice', 'alice_hub');

// Open conversation
window.MinigameFramework.startMinigame('phone-chat', null, { npcId: 'alice' });

// Check variable
window.inkEngine.getVariable('alice', 'trust_level');

// Emit event
window.npcEvents.emit('room_entered', { roomId: 'lab' });

// Enable debug logging
window.npcEvents.debug = true;
```

## Dependencies

### Required
- ink-js library (loaded via CDN in index.html)

### Optional (Development)
- inklecate compiler (for compiling .ink files)
- Node.js (for build automation, optional)

## Timeline

- **Phase 0:** Setup (1 day)
- **Phase 1:** Ink Integration (2-3 days)
- **Phase 2:** Event System (1-2 days)
- **Phase 3:** Bark System (1 day)
- **Phase 4:** Phone Chat (2 days)
- **Phase 5:** Scenario Integration (1-2 days)
- **Phase 6:** Testing & Polish (2+ days)

**Total: ~10 days for MVP**

## Success Metrics

### MVP Complete When:
- ✅ One NPC sends barks on 3+ events
- ✅ Barks appear and dismiss correctly
- ✅ Phone chat opens from bark or button
- ✅ Conversation shows dialogue and choices
- ✅ Choices update conversation state
- ✅ Multiple NPCs work independently
- ✅ State persists across sessions

### Future Enhancements:
- Multiple NPCs with relationships
- Voice synthesis
- Time-delayed messages
- Group conversations
- Hint system
- Phone calls

## Common Pitfalls

1. **Forgetting to compile Ink:** Always run inklecate after editing .ink files
2. **Wrong event names:** Event mappings must exactly match emitted event types
3. **Cooldown spam:** Events with short cooldowns can feel overwhelming
4. **Trust variables:** Ink variables don't automatically sync with game state
5. **Z-index conflicts:** Ensure phone chat appears above all other UI
6. **Path issues:** Use absolute paths in scenario JSON for reliability

## Getting Help

- **Ink Documentation:** https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- **ink-js GitHub:** https://github.com/y-lohse/inkjs
- **Break Escape Docs:** See main project README.md and .github/copilot-instructions.md

## Contributing

When adding new NPCs or extending the system:

1. Update relevant planning docs
2. Add examples to `05_EXAMPLE_SCENARIO.md`
3. Document new event types in `02_EVENT_SYSTEM.md`
4. Update CSS conventions in `03_PHONE_UI.md`
5. Add test cases to `04_IMPLEMENTATION.md`

## Questions?

Refer to these planning docs first, then:
- Check browser console for errors
- Enable debug mode: `window.npcEvents.debug = true`
- Test individual components in isolation
- Review example scenario code

---

**Last Updated:** 2025-10-28
**Status:** Planning Complete - Ready for Implementation
**Next Step:** Begin Phase 0 (Preparation) from `04_IMPLEMENTATION.md`

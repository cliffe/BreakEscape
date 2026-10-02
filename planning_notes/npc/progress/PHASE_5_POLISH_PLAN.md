# Phase 5: Polish & Additional Features Plan

## Status: Phase 4 Complete ✅
Event-driven NPC reactions are fully working! NPCs can:
- React to player actions (door unlocks, item pickups, minigame results)
- Influence game state (unlock doors, give items)
- Engage in branching conversations
- Send context-aware barks

## Phase 5 Goals: Polish & Expand

### Priority 1: Sound Effects (High Impact, Low Effort)
**Goal**: Add audio feedback for NPC interactions

#### Implementation
- [ ] **Bark notification sound** (`assets/sounds/bark_notification.mp3`)
  - Play when bark appears
  - Short, non-intrusive notification sound
  - ~0.3-0.5 seconds duration
  
- [ ] **Message received sound** (`assets/sounds/message_received.mp3`)
  - Play when timed message arrives
  - Similar to bark but slightly different pitch
  
- [ ] **Phone open/close sounds**
  - Subtle UI feedback
  - Optional: different sounds per NPC personality

#### Files to Modify
- `js/systems/npc-barks.js` - Add sound playback in `showBark()`
- `js/systems/npc-manager.js` - Add sound for timed messages
- `js/minigames/phone-chat/phone-chat-minigame.js` - Add open/close sounds

**Estimated Time**: 1-2 hours
**Value**: High - Audio feedback greatly improves UX

---

### Priority 2: Additional Game Events (Medium Impact, Medium Effort)
**Goal**: Add more events for NPCs to react to

#### New Events to Implement

##### Room Navigation Events
- [ ] `room_entered` - Emitted when player enters a new room
  - Data: `{ roomId, fromRoom }`
  - Use case: NPCs comment on player's progress through building
  
- [ ] `room_discovered` - First time entering a room
  - Data: `{ roomId }`
  - Use case: "You found the server room! Be careful in there."

##### Progress Events
- [ ] `objective_completed` - Scenario milestone reached
  - Data: `{ objectiveId, objectiveName }`
  - Use case: NPCs congratulate or warn about next steps
  
- [ ] `evidence_collected` - Important item collected
  - Data: `{ evidenceType, itemName }`
  - Use case: "Great! That file will be crucial evidence."

##### Failure Events
- [ ] `player_detected` - Security/surveillance triggered
  - Data: `{ detectionType, location }`
  - Use case: "Someone's onto you! Get out of there!"
  
- [ ] `alarm_triggered` - Mission failure condition
  - Data: `{ alarmType, roomId }`
  - Use case: "The alarm! Mission compromised!"

#### Implementation Tasks
1. Add event emissions to game systems
2. Create example NPC reactions in helper-npc.ink
3. Add event mappings to scenario JSON
4. Test each event type

**Estimated Time**: 3-4 hours
**Value**: High - Richer NPC interactions

---

### Priority 3: NPC Avatars (Low Impact, Low Effort)
**Goal**: Visual representation of NPCs in barks and conversations

#### Implementation
- [ ] Create default avatar system
  - Generic placeholder avatars by role (helper, adversary, neutral)
  - 32x32px pixel art style
  - Match game's aesthetic
  
- [ ] Avatar display in barks
  - Already supported in bark system
  - Just need to add avatar paths to NPC configs
  
- [ ] Avatar selection in scenarios
  - Add `avatar: "path/to/avatar.png"` in NPC config
  - Fallback to default if not specified

#### Assets Needed
- `assets/npc/avatars/helper_default.png`
- `assets/npc/avatars/adversary_default.png`
- `assets/npc/avatars/neutral_default.png`

**Estimated Time**: 1-2 hours (without custom art)
**Value**: Medium - Nice visual polish

---

### Priority 4: Objective/Secret System (High Impact, High Effort)
**Goal**: NPCs can set missions and reveal secrets

#### Features
- [ ] **Objective Display**
  - UI panel showing current objectives
  - Can be toggled (default: bottom-right corner)
  - Updates when NPC sets new objective
  
- [ ] **Secret/Discovery System**
  - NPCs can reveal hidden information
  - Unlocks new dialogue options
  - Can affect game progression
  
- [ ] **Integration with Game Bridge**
  - Already have `setObjective()` method
  - Already have `revealSecret()` method
  - Just need UI to display them

#### Implementation
1. Create objectives UI component
2. Add objectives state to game state
3. Update NPC bridge to track objectives
4. Add visual feedback when objectives change
5. Create secrets/discoveries log

**Estimated Time**: 4-6 hours
**Value**: High - Core gameplay feature

---

### Priority 5: Advanced NPC Features (Medium Impact, High Effort)

#### Adversarial NPCs
- [ ] NPCs that hinder player progress
  - Can lock doors player just unlocked
  - Can alert security
  - Can give false information
  
- [ ] Trust/Suspicion system
  - NPCs track player's suspicious actions
  - React differently based on suspicion level
  - Can blow player's cover

#### NPC-to-NPC Interactions
- [ ] NPCs can reference other NPCs
  - "Have you talked to Alice? She seems suspicious."
  - Ink variables shared between NPC stories
  
- [ ] NPCs can send messages to each other
  - Player sees message in conversation history
  - Creates feeling of living world

#### Dynamic Story Branching
- [ ] Story paths affect available NPCs
  - Some NPCs only appear after events
  - Some NPCs become unavailable
  
- [ ] Multiple endings based on NPC relationships
  - Good ending: high trust with allies
  - Bad ending: exposed by adversaries

**Estimated Time**: 8-12 hours
**Value**: Very High - Deep gameplay systems

---

## Recommended Implementation Order

### Week 1: Quick Wins
1. ✅ **Phase 4 Complete** - Event system working
2. **Sound Effects** (Priority 1) - 1-2 hours
3. **NPC Avatars** (Priority 3) - 1-2 hours
4. Test and polish

### Week 2: Core Features
5. **Additional Game Events** (Priority 2) - 3-4 hours
6. **Objective/Secret UI** (Priority 4) - 4-6 hours
7. Create example scenario using all features

### Week 3: Advanced Features
8. **Adversarial NPCs** (Priority 5) - 4-6 hours
9. **NPC-to-NPC Interactions** (Priority 5) - 2-3 hours
10. **Dynamic Story Branching** (Priority 5) - 2-3 hours
11. Full integration testing

---

## Testing Strategy

### Automated Tests
- [ ] Event emission tests
- [ ] Event mapping tests
- [ ] Bark display tests
- [ ] Conversation flow tests

### Manual Testing Scenarios
- [ ] Complete CEO Exfil with different choices
- [ ] Trigger all event types
- [ ] Test bark frequency limits
- [ ] Test adversarial NPC behavior
- [ ] Test multiple simultaneous barks

### Performance Testing
- [ ] Memory usage with multiple NPCs
- [ ] Story load times
- [ ] Event processing overhead
- [ ] Bark animation performance

---

## Documentation Needs

### User Documentation
- [ ] **NPC System User Guide** - For scenario designers
- [ ] **Event Reference** - Complete event catalog
- [ ] **Ink Story Guide** - Writing effective NPC dialogue
- [ ] **Best Practices** - NPC design patterns

### Developer Documentation
- [ ] **Architecture Overview** - System design
- [ ] **API Reference** - All public methods
- [ ] **Extension Guide** - Adding new features
- [ ] **Debugging Guide** - Common issues

---

## Success Metrics

### Phase 5 Complete When:
- [x] NPCs react to 8+ different event types ✅ (7 implemented)
- [ ] Audio feedback on all NPC interactions
- [ ] Objectives and secrets displayed in UI
- [ ] At least 3 fully-featured example NPCs
- [ ] Complete documentation suite
- [ ] All automated tests passing

### Stretch Goals:
- [ ] 5+ example scenarios using NPC system
- [ ] Adversarial NPC mechanics working
- [ ] NPC-to-NPC interaction examples
- [ ] Community scenario templates

---

## Next Immediate Steps

Based on user feedback and current progress, recommend starting with:

1. **Add room navigation events** (room_entered, room_discovered)
   - Most impactful for player experience
   - Relatively easy to implement
   - Creates sense of NPC awareness

2. **Implement sound effects**
   - Quick win
   - Greatly improves feel
   - Can use placeholder sounds initially

3. **Create 2-3 more example NPCs**
   - Demonstrate different personalities
   - Show off system capabilities
   - Help with testing

Would you like to proceed with any of these priorities?

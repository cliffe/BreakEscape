# Implementation Phases: Person NPC System

## Overview
Phased approach to implementing in-person NPC characters, from basic sprite rendering to full dual-identity functionality with events and barks.

---

## Phase 1: Basic NPC Sprites (Foundation)
**Goal:** Get NPC sprites visible and positioned in rooms.

### 1.1 Create NPCSpriteManager Module
**File:** `js/systems/npc-sprites.js`

**Tasks:**
- [ ] Create module with sprite creation functions
- [ ] Implement `createNPCSprite(game, npc, roomData)`
- [ ] Implement `calculateNPCWorldPosition(npc, roomData)`
- [ ] Implement `setupNPCAnimations(game, sprite, spriteSheet, config)`
- [ ] Implement `updateNPCDepth(sprite)`
- [ ] Implement `createNPCCollision(game, sprite, player)`
- [ ] Export functions for use by rooms system

**Acceptance Criteria:**
- NPCSpriteManager can create sprite at given position
- Sprite uses correct texture and frame
- Depth calculation matches player system (bottomY + 0.5)
- Collision body prevents player walking through

### 1.2 Integrate with Rooms System
**File:** `js/core/rooms.js`

**Tasks:**
- [ ] Import NPCSpriteManager
- [ ] Add `createNPCSpritesForRoom()` function
- [ ] Add `getNPCsForRoom(roomId)` helper
- [ ] Call sprite creation after room tile loading
- [ ] Add sprite cleanup to room unloading
- [ ] Store sprite references in room data

**Acceptance Criteria:**
- NPCs appear when room loads
- NPCs positioned correctly based on scenario data
- NPCs removed when room unloads
- No memory leaks from sprite creation/destruction

### 1.3 Update NPCManager
**File:** `js/systems/npc-manager.js`

**Tasks:**
- [ ] Add `npcType` property handling ("phone", "person", "both")
- [ ] Store sprite reference in NPC data (`npc._sprite`)
- [ ] Validate person-type NPCs have required properties
- [ ] Add warnings for missing roomId/position

**Acceptance Criteria:**
- NPCManager accepts `npcType: "person"` NPCs
- Sprite reference stored and accessible
- Validation catches configuration errors

### 1.4 Test Scenario
**File:** `scenarios/npc-sprite-test.json`

**Tasks:**
- [ ] Create minimal test scenario
- [ ] Add 2-3 person NPCs in different positions
- [ ] Test different position formats (grid vs pixel)
- [ ] Verify depth sorting with player movement
- [ ] Test collision boundaries

**Acceptance Criteria:**
- NPCs visible in test scenario
- Depth sorting works correctly
- Player cannot walk through NPCs
- Positioning accurate for both grid and pixel coords

**Estimated Time:** 3-4 hours

---

## Phase 2: Person-Chat Minigame (Conversation Interface)
**Goal:** Create cinematic conversation interface with zoomed portraits.

### 2.1 Create Portrait Rendering System
**File:** `js/minigames/person-chat/person-chat-portraits.js`

**Tasks:**
- [ ] Create PersonChatPortraits class
- [ ] Implement game canvas screenshot capture
- [ ] Calculate zoom viewbox for each sprite
- [ ] Generate data URLs from canvas
- [ ] Add cleanup method

**Acceptance Criteria:**
- Can capture game canvas as data URL
- Can calculate centered zoom region for sprites
- Portraits display correctly scaled (4x)
- No memory leaks

### 2.2 Create PersonChatMinigame
**File:** `js/minigames/person-chat/person-chat-minigame.js`

**Tasks:**
- [ ] Create PersonChatMinigame class extending MinigameScene
- [ ] Implement constructor with NPC data
- [ ] Implement init() with header/UI setup
- [ ] Implement startConversation() - load Ink story
- [ ] Implement showCurrentDialogue() - display text
- [ ] Implement selectChoice() - process player choices
- [ ] Implement endConversation() - cleanup and close
- [ ] Add event listeners for choice buttons
- [ ] Integrate portrait system

**Acceptance Criteria:**
- Minigame opens when triggered
- Shows NPC and player portraits
- Displays dialogue text
- Shows choice buttons
- Processes choices through Ink
- Closes properly after conversation

### 2.3 Create PersonChatUI
**File:** `js/minigames/person-chat/person-chat-ui.js`

**Tasks:**
- [ ] Create PersonChatUI class
- [ ] Implement render() - build HTML structure
- [ ] Implement portrait canvas rendering
- [ ] Implement showDialogue(text)
- [ ] Implement showChoices(choices)
- [ ] Add portrait update methods

**Acceptance Criteria:**
- UI renders with correct layout
- Portraits display in canvases
- Dialogue text updates smoothly
- Choices render as buttons
- Responsive layout works

### 2.4 Create PersonChatConversation
**File:** `js/minigames/person-chat/person-chat-conversation.js`

**Tasks:**
- [ ] Create PersonChatConversation class
- [ ] Implement story loading via NPCManager
- [ ] Implement getCurrentText()
- [ ] Implement getChoices()
- [ ] Implement selectChoice(index)
- [ ] Implement getCurrentTags() for actions
- [ ] Implement canContinue()

**Acceptance Criteria:**
- Loads Ink story correctly
- Returns current dialogue text
- Returns available choices
- Processes choice selection
- Handles Ink tags
- Detects conversation end

### 2.5 Style PersonChat UI
**File:** `css/person-chat-minigame.css`

**Tasks:**
- [ ] Create CSS file
- [ ] Style portrait containers (sharp edges, 2px borders)
- [ ] Style dialogue box
- [ ] Style choice buttons
- [ ] Ensure pixel-art rendering (crisp edges)
- [ ] Add hover/active states
- [ ] Test responsive layout

**Acceptance Criteria:**
- Follows pixel-art aesthetic (no border-radius)
- 2px borders throughout
- Clean, readable layout
- Good contrast and spacing
- Works at different window sizes

### 2.6 Register Minigame
**File:** `js/minigames/index.js`

**Tasks:**
- [ ] Import PersonChatMinigame
- [ ] Register with MinigameFramework
- [ ] Test registration works

**Acceptance Criteria:**
- Minigame registered as "person-chat"
- Can be started via MinigameFramework.startMinigame()

### 2.7 Test Conversation
**Tasks:**
- [ ] Create test Ink story for person NPC
- [ ] Test full conversation flow
- [ ] Verify portraits update during conversation
- [ ] Test choice selection
- [ ] Test conversation ending
- [ ] Test action tags (unlock_door, give_item)

**Acceptance Criteria:**
- Full conversation works end-to-end
- Portraits render correctly
- Choices process properly
- Action tags execute
- Minigame closes cleanly

**Estimated Time:** 6-8 hours

---

## Phase 3: Interaction System (Triggering Conversations)
**Goal:** Enable player to walk up to NPCs and talk to them.

### 3.1 Extend Interaction System
**File:** `js/systems/interactions.js`

**Tasks:**
- [ ] Add NPC sprite detection to proximity check
- [ ] Implement `checkNPCProximity()` function
- [ ] Add NPC interaction handler
- [ ] Show "Talk to [Name]" prompt when near NPC
- [ ] Trigger person-chat minigame on interaction
- [ ] Handle E key and click interactions

**Acceptance Criteria:**
- System detects when player near NPC
- Interaction prompt shows NPC name
- E key triggers conversation
- Click triggers conversation
- Prompt disappears when player moves away

### 3.2 NPC Animation Triggers
**File:** `js/systems/npc-sprites.js`

**Tasks:**
- [ ] Add `playNPCAnimation(npc, animName)` function
- [ ] Implement greeting animation trigger
- [ ] Implement talking animation trigger
- [ ] Implement return-to-idle logic
- [ ] Add animation state tracking

**Acceptance Criteria:**
- NPC plays greeting when player approaches
- NPC plays talking during conversation
- NPC returns to idle after conversation
- Animation transitions are smooth

### 3.3 Event Emission
**File:** `js/systems/interactions.js`

**Tasks:**
- [ ] Emit `npc_approached` event
- [ ] Emit `npc_interacted` event
- [ ] Emit `npc_conversation_started` event
- [ ] Emit `npc_conversation_ended` event
- [ ] Include NPC data in events

**Acceptance Criteria:**
- All events fire at correct times
- Events include proper data
- Other systems can listen to events

### 3.4 Integration Test
**Tasks:**
- [ ] Test walking up to NPC
- [ ] Test interaction prompt appearance
- [ ] Test conversation triggering
- [ ] Test animation transitions
- [ ] Test event emission
- [ ] Test multiple NPCs in same room

**Acceptance Criteria:**
- Full interaction flow works smoothly
- Multiple NPCs can be talked to independently
- Events fire correctly
- No interaction conflicts

**Estimated Time:** 3-4 hours

---

## Phase 4: Dual Identity System (Phone + Person)
**Goal:** Enable NPCs to exist as both phone contacts and in-person characters.

### 4.1 Update NPCManager for Dual Identity
**File:** `js/systems/npc-manager.js`

**Tasks:**
- [ ] Add `npcType: "both"` handling
- [ ] Ensure single InkEngine instance per NPC
- [ ] Share conversation history across interfaces
- [ ] Add metadata tracking (lastInteractionType, etc.)
- [ ] Add `getLastInteractionType(npcId)` method
- [ ] Add `updateNPCMetadata(npcId, updates)` method

**Acceptance Criteria:**
- "both" type NPCs work in phone and person modes
- Single Ink story shared across both
- Conversation history persists
- Metadata tracks interaction type

### 4.2 Update Phone-Chat Integration
**File:** `js/minigames/phone-chat/phone-chat-minigame.js`

**Tasks:**
- [ ] Ensure uses shared InkEngine from NPCManager
- [ ] Ensure uses shared conversation history
- [ ] Update metadata on phone interactions
- [ ] Test continuity with person interactions

**Acceptance Criteria:**
- Phone-chat uses shared state
- Conversation continues from in-person talk
- Metadata updated correctly

### 4.3 Update Person-Chat Integration
**File:** `js/minigames/person-chat/person-chat-minigame.js`

**Tasks:**
- [ ] Ensure uses shared InkEngine from NPCManager
- [ ] Ensure uses shared conversation history
- [ ] Update metadata on person interactions
- [ ] Test continuity with phone interactions

**Acceptance Criteria:**
- Person-chat uses shared state
- Conversation continues from phone messages
- Metadata updated correctly

### 4.4 Ink Story Enhancements
**Tasks:**
- [ ] Add external function bindings for metadata
- [ ] Add `get_last_interaction_type()` binding
- [ ] Add `get_interaction_count()` binding
- [ ] Create example dual-identity Ink story
- [ ] Test context-aware greetings

**Acceptance Criteria:**
- Ink can query interaction metadata
- Stories can branch based on interaction type
- Example story demonstrates all features

### 4.5 Test Dual Identity
**Tasks:**
- [ ] Test phone → person continuity
- [ ] Test person → phone continuity
- [ ] Test mixed conversation flow
- [ ] Test variable persistence
- [ ] Test metadata updates
- [ ] Test context-aware dialogue

**Acceptance Criteria:**
- Full dual identity works seamlessly
- State persists across both interfaces
- Dialogue adapts to interaction type
- No state corruption or loss

**Estimated Time:** 4-5 hours

---

## Phase 5: Events and Barks (In-Person Reactions)
**Goal:** Enable event-triggered reactions for person NPCs.

### 5.1 Person NPC Event System
**File:** `js/systems/npc-manager.js`

**Tasks:**
- [ ] Ensure event mappings work for person NPCs
- [ ] Test event-triggered knots for person types
- [ ] Add person-specific event patterns if needed
- [ ] Handle bark delivery for person NPCs

**Acceptance Criteria:**
- Person NPCs can respond to game events
- Event mappings configured in scenario
- Barks trigger correctly

### 5.2 Bark Delivery for Person NPCs
**Tasks:**
- [ ] Decide: phone bark or in-person animation?
- [ ] Option A: Send barks via phone (if dual identity)
- [ ] Option B: Show speech bubble over sprite
- [ ] Option C: Hybrid - phone for remote, bubble for nearby
- [ ] Implement chosen approach

**Acceptance Criteria:**
- Event barks work for person NPCs
- Delivery method is clear and intuitive
- Works for both "person" and "both" types

### 5.3 Animation on Barks
**Tasks:**
- [ ] Trigger attention animation on event bark
- [ ] Show visual indicator (exclamation mark?)
- [ ] Return to idle after bark delivered

**Acceptance Criteria:**
- NPC shows visual reaction to events
- Player notices NPC has something to say
- Animation timing feels natural

### 5.4 Test Event Reactions
**Tasks:**
- [ ] Test room_entered triggers person bark
- [ ] Test item_picked_up triggers person bark
- [ ] Test door_unlocked triggers person bark
- [ ] Test cooldowns work correctly
- [ ] Test maxTriggers limiting

**Acceptance Criteria:**
- All event types work with person NPCs
- Barks deliver appropriately
- Cooldowns and limits respected

**Estimated Time:** 3-4 hours

---

## Phase 6: Polish and Documentation
**Goal:** Refine system and document for scenario designers.

### 6.1 Add Comments and Documentation
**Tasks:**
- [ ] Add JSDoc comments to all functions
- [ ] Document scenario schema extensions
- [ ] Update NPC_INTEGRATION_GUIDE.md
- [ ] Create person NPC quickstart guide
- [ ] Add inline code comments

**Acceptance Criteria:**
- All public functions documented
- Scenario designers have clear guide
- Code is well-commented

### 6.2 Error Handling
**Tasks:**
- [ ] Add validation for person NPC config
- [ ] Add helpful error messages
- [ ] Handle missing sprites gracefully
- [ ] Handle missing rooms gracefully
- [ ] Add console warnings for common mistakes

**Acceptance Criteria:**
- Meaningful error messages
- Graceful degradation on errors
- Easy to debug configuration issues

### 6.3 Performance Optimization
**Tasks:**
- [ ] Profile sprite creation/destruction
- [ ] Optimize portrait rendering
- [ ] Add sprite pooling if needed
- [ ] Reduce texture memory usage
- [ ] Test with many NPCs in one room

**Acceptance Criteria:**
- Good performance with 5+ NPCs per room
- No noticeable frame drops
- Memory usage reasonable

### 6.4 Create Complete Example Scenario
**File:** `scenarios/person-npc-demo.json`

**Tasks:**
- [ ] Create full example scenario
- [ ] Include phone-only NPC
- [ ] Include person-only NPC
- [ ] Include dual-identity NPC
- [ ] Include event-triggered barks
- [ ] Include timed messages
- [ ] Add comprehensive Ink stories

**Acceptance Criteria:**
- Demonstrates all person NPC features
- Works as tutorial for scenario designers
- Showcases best practices

### 6.5 Update Project Documentation
**Tasks:**
- [ ] Update README.md with person NPC feature
- [ ] Update .github/copilot-instructions.md
- [ ] Add person NPC section to main docs
- [ ] Create troubleshooting guide

**Acceptance Criteria:**
- Main project docs updated
- AI assistant has full context
- Troubleshooting guide helps users

**Estimated Time:** 4-5 hours

---

## Total Estimated Time
- Phase 1: 3-4 hours
- Phase 2: 6-8 hours
- Phase 3: 3-4 hours
- Phase 4: 4-5 hours
- Phase 5: 3-4 hours
- Phase 6: 4-5 hours

**Total: 23-30 hours** (~3-4 full development days)

---

## Risk Mitigation

### Technical Risks

#### Risk: RenderTexture performance issues
**Mitigation:**
- Test early with multiple portraits
- Add caching if needed
- Fall back to sprite cloning if RenderTexture slow

#### Risk: Depth sorting conflicts with NPCs
**Mitigation:**
- Use exact same depth formula as player
- Test extensively with player walking around NPCs
- Add debug visualization for depth values

#### Risk: State synchronization bugs in dual identity
**Mitigation:**
- Test thoroughly after Phase 4
- Add state validation checks
- Log all state changes during development

### Design Risks

#### Risk: Portrait zoom doesn't look good
**Mitigation:**
- Test early with different sprite sheets
- Adjust crop area if needed
- Add blur/pixelation controls

#### Risk: Interaction range too sensitive
**Mitigation:**
- Make range configurable per NPC
- Add visual debug indicators
- Test with user feedback

---

## Success Criteria

### Phase 1 Complete
✅ NPC sprites visible and positioned correctly
✅ Collision works with player
✅ Depth sorting correct
✅ Sprites load/unload with rooms

### Phase 2 Complete
✅ Person-chat minigame opens and displays
✅ Portraits render at 4x zoom
✅ Conversation flows through Ink
✅ Choices work correctly
✅ UI styled per pixel-art aesthetic

### Phase 3 Complete
✅ Player can walk up to NPCs
✅ Interaction prompt shows
✅ Conversation triggers on interaction
✅ NPC animations play correctly
✅ Events fire properly

### Phase 4 Complete
✅ Dual-identity NPCs work in both modes
✅ State persists across interfaces
✅ Conversation continues seamlessly
✅ Context-aware dialogue works

### Phase 5 Complete
✅ Event-triggered reactions work
✅ Barks deliver appropriately
✅ Cooldowns and limits function
✅ Visual feedback on events

### Phase 6 Complete
✅ Code fully documented
✅ Scenario guides complete
✅ Example scenario demonstrates all features
✅ Performance acceptable

---

## Post-Implementation Enhancements

### Future Features (Not in MVP)
- **NPC movement and pathfinding**
- **Group conversations** (multiple NPCs at once)
- **Dynamic sprite changes** (outfit changes, expressions)
- **Voice lines** (audio clips)
- **Emotion system** (happy, angry, worried faces)
- **NPC-to-NPC conversations** (player overhears)
- **Multiple sprite sheets per NPC**
- **Camera zoom on conversation start**
- **Animated backgrounds in conversation**

---

## Development Order Recommendation

### Week 1 (Days 1-2)
- Complete Phase 1 (sprites visible)
- Start Phase 2 (portrait system)

### Week 1 (Days 3-4)
- Complete Phase 2 (person-chat minigame)
- Start Phase 3 (interactions)

### Week 2 (Days 1-2)
- Complete Phase 3 (interactions working)
- Complete Phase 4 (dual identity)

### Week 2 (Days 3-4)
- Complete Phase 5 (events)
- Complete Phase 6 (polish and docs)

---

## Testing Strategy

### Unit Tests
- Sprite position calculation
- Depth calculation
- Portrait rendering
- State sharing

### Integration Tests
- Full conversation flow
- Phone → person continuity
- Person → phone continuity
- Event triggering

### User Tests
- Walk up and talk to NPC
- Message NPC via phone, then meet in person
- Trigger event barks
- Multiple NPCs in same room

### Performance Tests
- 10 NPCs in one room
- Rapid conversation opening/closing
- Memory leak detection
- Frame rate monitoring

---

## Rollout Plan

### Alpha (Internal Testing)
- Complete Phases 1-3
- Test basic person NPCs
- Get feedback on interaction flow

### Beta (Limited Release)
- Complete Phases 4-5
- Test dual identity system
- Get feedback on state persistence

### Release (Production)
- Complete Phase 6
- Full documentation
- Example scenarios
- Public announcement

---

## Appendix: Key Files Changed

### New Files Created
```
js/systems/npc-sprites.js
js/minigames/person-chat/person-chat-minigame.js
js/minigames/person-chat/person-chat-ui.js
js/minigames/person-chat/person-chat-portraits.js
js/minigames/person-chat/person-chat-conversation.js
css/person-chat-minigame.css
scenarios/npc-sprite-test.json
scenarios/person-npc-demo.json
planning_notes/npc/person/ (all .md files)
```

### Files Modified
```
js/systems/npc-manager.js
js/core/rooms.js
js/systems/interactions.js
js/minigames/index.js
docs/NPC_INTEGRATION_GUIDE.md
README.md
.github/copilot-instructions.md
```

### Files Referenced (No Changes)
```
js/core/player.js (reference for sprite creation)
js/minigames/phone-chat/phone-chat-minigame.js (reference for UI)
js/minigames/framework/base-minigame.js (extends from)
```

# Implementation Roadmap - NPC Hostile State

## Document Purpose

This roadmap provides the recommended implementation order, incorporating all design decisions, enhanced feedback systems, and integration best practices.

## Implementation Phases

### Phase 0: Foundation (3-4 hours)

**Purpose**: Establish design decisions and foundational components

**Tasks**:
1. Make design decisions (see `phase0_foundation.md`)
2. Create `/js/events/combat-events.js` - Event constants
3. Create `/js/utils/error-handling.js` - Error utilities
4. Create `/js/utils/combat-debug.js` - Debug commands
5. Create `/scenarios/ink/test-hostile.ink` - Test Ink file
6. Update `/js/config/combat-config.js` - Add validation
7. Test event system and debug commands

**Deliverables**:
- All design decisions documented
- Event constants defined
- Error handling utilities ready
- Debug commands functional
- Test Ink file created
- Configuration validated

**Success Criteria**:
- [ ] All 10 design decisions made
- [ ] Event constants imported without errors
- [ ] Debug commands work in console
- [ ] Configuration validation passes
- [ ] Test Ink loads and compiles

---

### Phase 1: Core Systems (4-5 hours)

**Purpose**: Build health and state management systems

**Tasks**:

#### 1.1 Player Health System
**File**: `/js/systems/player-health.js`
- [ ] Create module with state initialization pattern
- [ ] Implement `initPlayerHealth()` with resetable state
- [ ] Implement `getPlayerHP()`, `setPlayerHP()`
- [ ] Implement `damagePlayer(amount)` with validation
- [ ] Implement `healPlayer(amount)` with validation
- [ ] Implement `isPlayerKO()` check
- [ ] Emit events using `CombatEvents` constants
- [ ] Add error handling throughout
- [ ] Add to `window.playerHealth`
- [ ] Test with debug commands

#### 1.2 NPC Hostile System
**File**: `/js/systems/npc-hostile.js`
- [ ] Create module with Map-based state storage
- [ ] Define hostile state object structure
- [ ] Implement `initNPCHostileSystem()`
- [ ] Implement `setNPCHostile(npcId, isHostile)`
- [ ] Implement `getNPCHostileState(npcId)` with safe defaults
- [ ] Implement `damageNPC(npcId, amount)` with validation
- [ ] Implement `isNPCKO(npcId)`, `canNPCAttack(npcId)`
- [ ] Add state cleanup when NPC destroyed
- [ ] Emit events using `CombatEvents` constants
- [ ] Add error handling and null checks
- [ ] Add to `window.npcHostileSystem`
- [ ] Test with debug commands

#### 1.3 Test Core Systems
- [ ] Use `CombatDebug.setPlayerHP(50)` - verify HP changes
- [ ] Use `CombatDebug.damagePlayer(20)` - verify events fire
- [ ] Use `CombatDebug.makeHostile('test_npc')` - verify state changes
- [ ] Verify error handling with invalid inputs
- [ ] Check console for validation errors

**Deliverables**:
- Player health system functional
- NPC hostile system functional
- Both testable via debug commands
- Events emitting correctly

---

### Phase 2: Enhanced Feedback Systems (4-5 hours)

**Purpose**: Build visual and audio feedback for combat

**Tasks**:

#### 2.1 Damage Numbers
**File**: `/js/systems/damage-numbers.js`
- [ ] Create `DamageNumberPool` class
- [ ] Implement object pooling (20 objects)
- [ ] Implement `show(x, y, damage, isCritical, isMiss)`
- [ ] Add float-up animation with tweens
- [ ] Support critical hits (larger, red text)
- [ ] Support miss display
- [ ] Add to `window.damageNumbers`
- [ ] Test: spawn multiple numbers rapidly

#### 2.2 Screen Effects
**File**: `/js/systems/screen-effects.js`
- [ ] Create red flash overlay
- [ ] Implement `flashDamage()` with config duration
- [ ] Implement `flashHeal()` (green flash)
- [ ] Implement `flashWarning()` (orange flash)
- [ ] Implement `shake()` with intensity parameter
- [ ] Add helper methods: `shakeLight()`, `shakeMedium()`, `shakeHeavy()`
- [ ] Respect accessibility settings
- [ ] Add to `window.screenEffects`
- [ ] Test: trigger each effect type

#### 2.3 Sprite Effects
**File**: `/js/systems/sprite-effects.js`
- [ ] Implement `flashSprite(sprite, color, duration)`
- [ ] Implement `flashSpriteRepeat(sprite, color, times, duration)`
- [ ] Implement `shakeSprite(sprite, intensity, duration)`
- [ ] Test with player and NPC sprites

#### 2.4 Attack Telegraph
**File**: `/js/systems/attack-telegraph.js`
- [ ] Create `AttackTelegraph` class
- [ ] Add exclamation mark icon
- [ ] Add attack range circle indicator
- [ ] Implement `show()` with pulse animation
- [ ] Implement `hide()` and cleanup
- [ ] Implement `updatePosition()` for movement
- [ ] Test: show/hide telegraph on NPC

#### 2.5 Combat Sounds (Optional for MVP)
**File**: `/js/systems/combat-sounds.js`
- [ ] Create `CombatSounds` class
- [ ] Add placeholder sound loading (or skip)
- [ ] Implement play methods for each sound type
- [ ] Respect audio settings
- [ ] Gracefully handle missing sounds
- [ ] Add to `window.combatSounds`

**Deliverables**:
- Damage numbers floating correctly
- Screen flash and shake functional
- Attack telegraph displays
- Sound system ready (even if no audio files yet)

**Test Scenario**:
```javascript
// In console
CombatDebug.damagePlayer(20)
// Should show: screen flash, shake, damage number, sound
```

---

### Phase 3: UI Components (3-4 hours)

**Purpose**: Build health display UI

**Tasks**:

#### 3.1 Player Health UI
**File**: `/js/systems/player-health-ui.js`
- [ ] Create HTML structure for hearts container
- [ ] Add CSS styling (above inventory)
- [ ] Implement `initPlayerHealthUI()`
- [ ] Implement `updatePlayerHealthUI()` - calculate hearts
- [ ] Implement `showPlayerHealthUI()` / `hidePlayerHealthUI()`
- [ ] Handle full/half/empty hearts display
- [ ] Listen to `CombatEvents.PLAYER_HP_CHANGED`
- [ ] Context-aware visibility (show near hostiles)
- [ ] Test: verify hearts update on damage
- [ ] Test: verify hearts hidden at full HP

#### 3.2 NPC Health Bar UI
**File**: `/js/systems/npc-health-ui.js`
- [ ] Create `HealthBar` class (Phaser Graphics)
- [ ] Implement color-based fill (green/yellow/red)
- [ ] Implement `createHealthBar(scene, npcId, npc)`
- [ ] Implement `updateHealthBar(npcId, currentHP, maxHP)`
- [ ] Implement `updatePositions()` - follow NPCs
- [ ] Implement `destroyHealthBar(npcId)`
- [ ] Add to scene depth correctly
- [ ] Test: health bar follows NPC movement
- [ ] Test: health bar updates on damage

#### 3.3 Game Over UI
**File**: `/js/systems/game-over-ui.js`
- [ ] Create HTML overlay structure
- [ ] Add CSS styling (fullscreen, centered)
- [ ] Implement `initGameOverUI()`
- [ ] Implement `showGameOver()` with stats
- [ ] Show: defeated by, damage dealt, time survived
- [ ] Add buttons: Restart, Load Save, Main Menu
- [ ] Implement `handleRestart()` - reload or reset state
- [ ] Listen to `CombatEvents.PLAYER_KO`
- [ ] Disable player controls when shown
- [ ] Test: KO triggers game over screen
- [ ] Test: restart button works

**Deliverables**:
- Hearts display and update correctly
- NPC health bars appear above hostile NPCs
- Game over screen functional

---

### Phase 4: Animation Systems (2-3 hours)

**Purpose**: Create combat animations (placeholders)

**Tasks**:

#### 4.1 Combat Animations
**File**: `/js/systems/combat-animations.js`
- [ ] Implement `playPlayerPunchAnimation(scene, player, direction)`
  - [ ] Use animation completion callback (not timer)
  - [ ] Apply red tint during animation
  - [ ] Play walk animation
  - [ ] Return promise that resolves on completion
  - [ ] Clear tint and return to idle
  - [ ] Add safety timeout (1000ms)
- [ ] Implement `playNPCPunchAnimation(scene, npc, direction)`
  - [ ] Same pattern as player
  - [ ] Use NPC-specific animation keys
- [ ] Test animations with both player and NPC

#### 4.2 KO Sprites
**File**: `/js/systems/npc-ko-sprites.js`
- [ ] Implement `replaceWithKOSprite(scene, npc)`
- [ ] Store original position
- [ ] Destroy active sprite
- [ ] Create grayed sprite (tint 0x666666)
- [ ] Rotate 90 degrees (fallen)
- [ ] Set alpha 0.5
- [ ] Disable physics body
- [ ] Update npc.sprite reference
- [ ] Set npc.isKO flag
- [ ] Test: NPC sprite replaced correctly

**Deliverables**:
- Punch animations play with proper timing
- KO sprites appear when NPC defeated

---

### Phase 5: Combat Mechanics (4-5 hours)

**Purpose**: Implement punch mechanics for player and NPCs

**Tasks**:

#### 5.1 Player Combat System
**File**: `/js/systems/player-combat.js`
- [ ] Initialize combat state (cooldown, isPunching)
- [ ] Implement `initPlayerCombat()`
- [ ] Implement `canPlayerPunch()` - check cooldown, state, KO
- [ ] Implement `playerPunch(targetNPC)`:
  - [ ] Play punch sound
  - [ ] Play punch animation (await)
  - [ ] Check target still in range
  - [ ] If hit: apply damage, show feedback
  - [ ] If miss: show miss indicator
  - [ ] Start cooldown timer
- [ ] Implement `updatePlayerCombat(delta)` - update cooldowns
- [ ] Implement `getHostileNPCsInRange()` helper
- [ ] Add to `window.playerCombat`
- [ ] Integrate all feedback systems
- [ ] Test: punch hostile NPC, verify damage
- [ ] Test: punch out of range, verify miss

#### 5.2 NPC Combat System
**File**: `/js/systems/npc-combat.js`
- [ ] Implement `initNPCCombat()`
- [ ] Implement `canNPCAttack(npcId, npc, playerPos)`:
  - [ ] Check hostile state
  - [ ] Check cooldown
  - [ ] Check if KO
  - [ ] Check player in range
- [ ] Implement `npcAttack(npcId, npc)`:
  - [ ] Show attack telegraph
  - [ ] Play warning sound/effect
  - [ ] Wait wind-up duration (500ms)
  - [ ] Hide telegraph
  - [ ] Play attack animation (await)
  - [ ] Check player still in range
  - [ ] If hit: damage player, strong feedback
  - [ ] If miss: play miss sound
  - [ ] Update cooldown
- [ ] Implement `updateNPCCombat(delta)` - update cooldowns
- [ ] Add to `window.npcCombat`
- [ ] Integrate all feedback systems
- [ ] Test: NPC attacks player, verify damage
- [ ] Test: telegraph shows before attack

**Deliverables**:
- Player can punch hostile NPCs
- NPCs can attack player
- Hit/miss detection works
- All feedback integrated
- Cooldowns prevent spam

---

### Phase 6: Behavior System Extensions (3-4 hours)

**Purpose**: Add hostile behavior to NPC system

**Tasks**:

#### 6.1 Extend NPC Behavior
**File**: `/js/systems/npc-behavior.js` (MODIFY)
- [ ] Import hostile system and config
- [ ] Add hostile check in `updateNPCBehaviors()` loop
- [ ] Implement `updateHostileBehavior(npc, playerPosition, delta)`:
  - [ ] Enable LOS (360 degrees)
  - [ ] Check if player in LOS
  - [ ] If in LOS: chase player using pathfinding
  - [ ] Calculate distance to player
  - [ ] If in attack range: stop and attack
  - [ ] If not in LOS: enter search state or patrol
- [ ] Implement `moveNPCTowardsTarget(npc, targetPosition)`:
  - [ ] Use existing pathfinding system
  - [ ] Set chase speed from config
  - [ ] Throttle pathfinding (recalc every 500ms)
- [ ] Implement `stopNPCMovement(npc)`
- [ ] Handle room transitions (NPC stops at door)
- [ ] Test: NPC chases player when hostile
- [ ] Test: NPC attacks when in range
- [ ] Test: NPC returns to patrol when calm

#### 6.2 Extend LOS System
**File**: `/js/systems/npc-los.js` (MODIFY)
- [ ] Implement `enableNPCLOS(npc, range, angle)`:
  - [ ] Create los object if doesn't exist
  - [ ] Set enabled, range, angle
- [ ] Implement `setNPCLOSTracking(npc, isTracking)`:
  - [ ] Set angle to 360 if tracking
  - [ ] Set angle to 120 if not
- [ ] Export new functions
- [ ] Test: LOS enabled when NPC becomes hostile
- [ ] Test: 360-degree vision works

**Deliverables**:
- Hostile NPCs chase player
- NPCs attack when in range
- NPCs use pathfinding correctly
- LOS system extends dynamically

---

### Phase 7: Integration Points (3-4 hours)

**Purpose**: Connect systems together

**Tasks**:

#### 7.1 Ink Tag Handler
**File**: `/js/minigames/helpers/chat-helpers.js` (MODIFY)
- [ ] Import `CombatEvents`
- [ ] Add hostile tag filter in `processGameActionTags()`
- [ ] Implement `processHostileTag(tag, ui)`:
  - [ ] Parse NPC ID from tag
  - [ ] Call `setNPCHostile(npcId, true)`
  - [ ] Emit `CombatEvents.NPC_BECAME_HOSTILE`
  - [ ] Exit conversation immediately
  - [ ] Log hostile trigger
- [ ] Test with test-hostile.ink file
- [ ] Verify hostile state triggered
- [ ] Verify conversation exits

#### 7.2 Update Security Guard Ink
**File**: `/scenarios/ink/security-guard.ink` (MODIFY)
- [ ] Review all paths ending with `-> END`
- [ ] Replace with `# exit_conversation` where appropriate
- [ ] Or return to hub with `-> hub`
- [ ] Add `# hostile:security_guard` to hostile paths:
  - [ ] hostile_response knot
  - [ ] escalate_conflict knot
- [ ] Ensure all hostile paths have `# exit_conversation`
- [ ] Verify hub pattern works (all choices loop or exit)
- [ ] Test all dialogue paths
- [ ] Verify hostile trigger works

#### 7.3 Player Movement Controls
**File**: `/js/core/player.js` (MODIFY)
- [ ] Add KO check in `updatePlayerMovement()`:
  - [ ] Check `window.playerHealth?.isPlayerKO()`
  - [ ] If KO: stop velocity, play idle, return early
- [ ] Add KO check in `movePlayerToPoint()`:
  - [ ] If KO: log and return early
- [ ] Test: player cannot move when KO
- [ ] Test: player stops when reaching 0 HP

#### 7.4 Punch Interaction
**File**: `/js/systems/interactions.js` (MODIFY)
- [ ] Import `COMBAT_CONFIG`
- [ ] Implement `checkHostileNPCInteractions()`:
  - [ ] Get player position
  - [ ] Get NPCs in current room
  - [ ] Find hostile NPCs in punch range
  - [ ] Select closest as target (or in facing direction)
  - [ ] Store in `window.currentPunchTarget`
  - [ ] Show visual indicator on target
- [ ] Add punch key handler (SPACE):
  - [ ] Check if currentPunchTarget exists
  - [ ] Check if canPlayerPunch()
  - [ ] Call playerCombat.playerPunch()
- [ ] Call checkHostileNPCInteractions() in update loop
- [ ] Test: punch indicator shows near hostile NPC
- [ ] Test: SPACE key punches NPC
- [ ] Test: multiple hostile NPCs, correct target selected

**Deliverables**:
- Hostile tag works in Ink
- Security guard triggers hostile correctly
- Player can punch near hostile NPCs
- Player movement disabled when KO

---

### Phase 8: Main Integration (2-3 hours)

**Purpose**: Initialize all systems in main game

**Tasks**:

#### 8.1 Initialize Systems
**File**: `/js/main.js` (MODIFY)
- [ ] Import all new modules
- [ ] In create() method, initialize systems in order:
  1. [ ] Validate `COMBAT_CONFIG`
  2. [ ] Init player health: `window.playerHealth = initPlayerHealth()`
  3. [ ] Init player health UI: `initPlayerHealthUI()`
  4. [ ] Init NPC hostile system: `window.npcHostileSystem = initNPCHostileSystem()`
  5. [ ] Init NPC health UI: `initNPCHealthUI(this)`
  6. [ ] Init combat systems: `window.playerCombat = initPlayerCombat()`
  7. [ ] Init NPC combat: `window.npcCombat = initNPCCombat()`
  8. [ ] Init feedback systems:
     - [ ] `initDamageNumbers(this)`
     - [ ] `initScreenEffects(this)`
     - [ ] `initCombatSounds(this)` (optional)
  9. [ ] Init game over UI: `initGameOverUI()`
  10. [ ] Init debug commands: `window.CombatDebug`

#### 8.2 Set Up Event Listeners
- [ ] Listen to `PLAYER_HP_CHANGED` → update health UI
- [ ] Listen to `PLAYER_KO` → show game over, disable movement
- [ ] Listen to `NPC_BECAME_HOSTILE` → enable LOS, create health bar, create attack telegraph
- [ ] Listen to `NPC_KO` → replace sprite, destroy health bar
- [ ] Test: all events trigger correct handlers

#### 8.3 Update Game Loop
- [ ] In update(time, delta) method:
  - [ ] Call `window.playerCombat?.update(delta)`
  - [ ] Call `window.npcCombat?.update(delta)`
  - [ ] Call `window.npcHealthUI?.updatePositions()`
  - [ ] Call `checkHostileNPCInteractions()`
- [ ] Test: systems update each frame
- [ ] Test: health bars follow NPCs

**Deliverables**:
- All systems initialized without errors
- Events connected correctly
- Update loop includes combat systems
- Full integration working

---

### Phase 9: Testing and Polish (4-5 hours)

**Purpose**: Comprehensive testing and bug fixes

**Tasks**:

#### 9.1 System Integration Tests
- [ ] Start game, verify no console errors
- [ ] Load security guard conversation
- [ ] Trigger hostile response (escalate_conflict)
- [ ] Verify: guard becomes hostile, conversation exits
- [ ] Verify: health bar appears above guard
- [ ] Verify: guard chases player
- [ ] Verify: attack telegraph shows before guard attacks
- [ ] Verify: player takes damage, screen flash/shake
- [ ] Verify: hearts appear and update
- [ ] Verify: player can punch guard (SPACE key)
- [ ] Verify: damage number appears on hit
- [ ] Verify: miss indicator on miss
- [ ] Verify: guard health bar updates
- [ ] Verify: guard KO'd at 0 HP, sprite replaced
- [ ] Verify: player KO'd at 0 HP
- [ ] Verify: game over screen appears
- [ ] Verify: restart button works

#### 9.2 Edge Case Tests
- [ ] Punch when NPC moves out of range during animation
- [ ] Rapid SPACE presses (cooldown should prevent)
- [ ] Multiple hostile NPCs in same room
- [ ] Hostile NPC loses sight of player
- [ ] Player leaves room with hostile NPC
- [ ] Player re-enters room with hostile NPC
- [ ] Damage at exactly 0 HP (shouldn't go negative)
- [ ] Very rapid damage (multiple NPCs attacking)
- [ ] Conversation while hostile NPC nearby
- [ ] Save/load with hostile NPC (if save system exists)

#### 9.3 Visual Polish
- [ ] Hearts clearly visible and positioned correctly
- [ ] Health bars don't overlap with other UI
- [ ] Damage numbers readable on all backgrounds
- [ ] Red tint visible during punches
- [ ] KO sprite clearly different from active
- [ ] Game over screen centered and readable
- [ ] Attack telegraph clearly visible
- [ ] Screen flash not too intense
- [ ] Test on different screen sizes

#### 9.4 Performance Testing
- [ ] Run with 5 hostile NPCs in one room
- [ ] Monitor frame rate (should stay 60fps)
- [ ] Check update times in profiler
- [ ] Verify pathfinding throttling works
- [ ] Check memory usage (object pooling)
- [ ] Test for 60 seconds of continuous combat

#### 9.5 Configuration Tuning
- [ ] Playtest and adjust values:
  - [ ] Player HP (too easy/hard?)
  - [ ] Player damage (too strong/weak?)
  - [ ] NPC HP (too easy/hard to defeat?)
  - [ ] NPC damage (too punishing?)
  - [ ] Chase speed (too fast/slow?)
  - [ ] Attack ranges (feel right?)
  - [ ] Cooldowns (too spammy/sluggish?)
  - [ ] Wind-up duration (fair/unfair?)
- [ ] Document final values in config

**Deliverables**:
- All tests passing
- Edge cases handled gracefully
- Visual polish applied
- Performance acceptable
- Configuration tuned for fun gameplay

---

### Phase 10: Documentation (1-2 hours)

**Purpose**: Document the implementation

**Tasks**:

#### 10.1 Code Documentation
- [ ] Add JSDoc comments to all public functions
- [ ] Document event payloads
- [ ] Document configuration options
- [ ] Add file header comments

#### 10.2 Usage Documentation
- [ ] Document hostile tag usage in Ink
- [ ] Add example hostile conversation
- [ ] Document combat configuration
- [ ] Add troubleshooting guide
- [ ] Update game mechanics documentation

**Deliverables**:
- Code well documented
- Usage examples provided
- Troubleshooting guide available

---

## Total Estimated Time

| Phase | Hours |
|-------|-------|
| Phase 0: Foundation | 3-4 |
| Phase 1: Core Systems | 4-5 |
| Phase 2: Enhanced Feedback | 4-5 |
| Phase 3: UI Components | 3-4 |
| Phase 4: Animation Systems | 2-3 |
| Phase 5: Combat Mechanics | 4-5 |
| Phase 6: Behavior Extensions | 3-4 |
| Phase 7: Integration Points | 3-4 |
| Phase 8: Main Integration | 2-3 |
| Phase 9: Testing & Polish | 4-5 |
| Phase 10: Documentation | 1-2 |
| **TOTAL** | **33-44 hours** |

**Recommended Schedule**: 5-6 full working days

---

## Critical Success Factors

1. **Complete Phase 0 First** - Design decisions prevent rework
2. **Test After Each Phase** - Don't accumulate bugs
3. **Use Debug Commands** - Test systems in isolation
4. **Integrate Incrementally** - Don't wait for Phase 8
5. **Strong Feedback Early** - Makes testing more enjoyable
6. **Handle Errors Gracefully** - Systems should not crash
7. **Performance Monitor** - Check frame rate regularly
8. **Playtest Often** - Feel is as important as function

---

## Risk Mitigation

**If Behind Schedule**:
- Skip sound effects (Phase 2.5)
- Simplify game over screen (Phase 3.3)
- Use simpler damage numbers (Phase 2.1)
- Defer polish items (Phase 9.3)

**If Technical Issues**:
- Have fallbacks for each feature
- Graceful degradation (missing sounds, etc.)
- Use debug commands to isolate problems
- Test in isolation before integration

**If Gameplay Doesn't Feel Good**:
- Adjust config values first (easiest)
- Add more feedback (screen shake, sounds)
- Increase wind-up time (fairness)
- Reduce NPC damage (less punishing)

---

## Final Checklist

Before considering complete:

- [ ] All systems functional
- [ ] No console errors during normal play
- [ ] Player health system works correctly
- [ ] NPC hostile system works correctly
- [ ] Combat feels responsive with feedback
- [ ] UI elements display correctly
- [ ] Ink integration works
- [ ] Security guard triggers hostile correctly
- [ ] Performance is acceptable (60fps)
- [ ] Edge cases handled gracefully
- [ ] Configuration tuned for fun
- [ ] Code documented
- [ ] Debug commands available
- [ ] Tested with multiple scenarios

---

## Quick Start Implementation

**Day 1**:
- Complete Phase 0 (foundation)
- Complete Phase 1 (core systems)
- Test with debug commands

**Day 2**:
- Complete Phase 2 (feedback systems)
- Complete Phase 3 (UI components)
- Visual systems working

**Day 3**:
- Complete Phase 4 (animations)
- Complete Phase 5 (combat mechanics)
- Combat functional

**Day 4**:
- Complete Phase 6 (behavior)
- Complete Phase 7 (integration)
- Hostile NPCs working

**Day 5**:
- Complete Phase 8 (main integration)
- Start Phase 9 (testing)
- Full integration complete

**Day 6**:
- Complete Phase 9 (testing & polish)
- Complete Phase 10 (documentation)
- Feature complete

This roadmap provides a structured path to implementing the hostile NPC feature with high success probability.

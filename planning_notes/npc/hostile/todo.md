# NPC Hostile State Implementation - TODO List

## Phase 1: Core Data Structures

### Task 1.1: Create Combat Configuration
- [ ] Create `/js/config/combat-config.js`
- [ ] Define `COMBAT_CONFIG` object with all combat parameters
- [ ] Export configuration for use in other modules
- [ ] Add player combat config (HP, damage, range, cooldowns)
- [ ] Add NPC combat config (HP, damage, range, chase parameters)
- [ ] Add UI config (hearts, health bars)

### Task 1.2: Create Player Health System
- [ ] Create `/js/systems/player-health.js`
- [ ] Implement `initPlayerHealth()` function
- [ ] Implement `getPlayerHP()` function
- [ ] Implement `setPlayerHP(hp)` with bounds checking (0-100)
- [ ] Implement `damagePlayer(amount)` function
- [ ] Implement `healPlayer(amount)` function
- [ ] Implement `isPlayerKO()` function
- [ ] Implement `resetPlayerHealth()` function
- [ ] Add event emission for HP changes (`player_hp_changed`)
- [ ] Add event emission for KO state (`player_ko`)
- [ ] Add to window.playerHealth for global access
- [ ] Test: Verify HP starts at 100
- [ ] Test: Verify damagePlayer reduces HP correctly
- [ ] Test: Verify HP cannot go below 0 or above 100
- [ ] Test: Verify KO state triggers at 0 HP

### Task 1.3: Create NPC Hostile State System
- [ ] Create `/js/systems/npc-hostile.js`
- [ ] Create `npcHostileStates` Map for state tracking
- [ ] Define hostile state object structure
- [ ] Implement `initNPCHostileSystem()` function
- [ ] Implement `setNPCHostile(npcId, isHostile)` function
- [ ] Implement `isNPCHostile(npcId)` function
- [ ] Implement `getNPCHostileState(npcId)` function
- [ ] Implement `damageNPC(npcId, amount)` function
- [ ] Implement `isNPCKO(npcId)` function
- [ ] Implement `updateNPCHostileState(npcId, delta)` for cooldowns
- [ ] Implement `canNPCAttack(npcId)` function
- [ ] Add event emission for hostile state changes
- [ ] Add event emission for NPC KO
- [ ] Add to window.npcHostileSystem for global access
- [ ] Test: Verify NPC state can be toggled
- [ ] Test: Verify NPC damage reduces HP correctly
- [ ] Test: Verify NPC KO triggers at 0 HP

## Phase 2: UI Components

### Task 2.1: Create Player Health UI
- [ ] Create `/js/systems/player-health-ui.js`
- [ ] Add HTML structure for `#player-health-container`
- [ ] Add CSS styling for health container
- [ ] Implement `initPlayerHealthUI()` function
- [ ] Implement `updatePlayerHealthUI()` function
- [ ] Implement `showPlayerHealthUI()` function
- [ ] Implement `hidePlayerHealthUI()` function
- [ ] Implement `calculateHearts(hp)` function
  - [ ] Convert HP to heart display (5 hearts max)
  - [ ] Handle full hearts (20 HP each)
  - [ ] Handle half hearts (10 HP increments)
  - [ ] Handle empty hearts
- [ ] Position hearts above inventory
- [ ] Listen to `player_hp_changed` event
- [ ] Hide UI when HP = 100 (max)
- [ ] Show UI when HP < 100
- [ ] Test: Verify hearts display correctly at 100 HP (5 full)
- [ ] Test: Verify hearts display correctly at 50 HP (2.5 hearts)
- [ ] Test: Verify hearts display correctly at 10 HP (0.5 hearts)
- [ ] Test: Verify hearts hidden at full HP
- [ ] Test: Verify hearts visible when damaged

### Task 2.2: Create NPC Health Bar UI
- [ ] Create `/js/systems/npc-health-ui.js`
- [ ] Create `npcHealthBars` Map for graphics objects
- [ ] Implement `initNPCHealthUI(scene)` function
- [ ] Implement `createNPCHealthBar(scene, npcId, npc)` function
  - [ ] Create Phaser Graphics object
  - [ ] Draw health bar background (red/black)
  - [ ] Draw health bar fill (green)
  - [ ] Add white border
  - [ ] Set dimensions (60x6 pixels)
- [ ] Implement `updateNPCHealthBar(npcId, currentHP, maxHP)` function
- [ ] Implement `positionHealthBar(npcId, x, y)` function
- [ ] Implement `showNPCHealthBar(npcId)` function
- [ ] Implement `hideNPCHealthBar(npcId)` function
- [ ] Implement `destroyNPCHealthBar(npcId)` function
- [ ] Position health bar 40px above NPC sprite
- [ ] Update position every frame in update loop
- [ ] Test: Verify health bar appears above NPC
- [ ] Test: Verify health bar updates when NPC damaged
- [ ] Test: Verify health bar follows NPC movement
- [ ] Test: Verify health bar removed when NPC KO

### Task 2.3: Create Game Over UI
- [ ] Create `/js/systems/game-over-ui.js`
- [ ] Add HTML structure for `#game-over-overlay`
- [ ] Add CSS styling for game over screen
- [ ] Style overlay with semi-transparent black background
- [ ] Style content with border and centered layout
- [ ] Implement `initGameOverUI()` function
- [ ] Implement `showGameOver()` function
- [ ] Implement `hideGameOver()` function
- [ ] Implement `handleRestart()` function
  - [ ] Option 1: Reload page
  - [ ] Option 2: Reset game state
- [ ] Add restart button with click handler
- [ ] Listen to `player_ko` event to show overlay
- [ ] Test: Verify game over screen displays at 0 HP
- [ ] Test: Verify restart button works
- [ ] Test: Verify overlay blocks interaction with game

## Phase 3: Animation Systems

### Task 3.1: Create Combat Animation System
- [ ] Create `/js/systems/combat-animations.js`
- [ ] Implement `playPlayerPunchAnimation(scene, player, direction)` function
  - [ ] Apply red tint to player sprite
  - [ ] Play walk animation in facing direction
  - [ ] Set animation duration (500ms from config)
  - [ ] Return promise that resolves after duration
  - [ ] Clear tint after animation
  - [ ] Return to idle animation
- [ ] Implement `playNPCPunchAnimation(scene, npc, direction)` function
  - [ ] Apply red tint to NPC sprite
  - [ ] Play NPC walk animation
  - [ ] Set animation duration from config
  - [ ] Return promise
  - [ ] Clear tint after animation
  - [ ] Return to NPC idle animation
- [ ] Test: Verify player punch animation plays with red tint
- [ ] Test: Verify NPC punch animation plays with red tint
- [ ] Test: Verify tint clears after animation
- [ ] Test: Verify sprite returns to idle after punch

### Task 3.2: Create KO Sprite System
- [ ] Create `/js/systems/npc-ko-sprites.js`
- [ ] Implement `replaceWithKOSprite(scene, npc)` function
  - [ ] Store NPC position
  - [ ] Destroy active NPC sprite
  - [ ] Create new sprite at same position
  - [ ] Apply gray tint (0x666666)
  - [ ] Set alpha to 0.5
  - [ ] Rotate sprite 90 degrees (fallen)
  - [ ] Update npc.sprite reference
  - [ ] Set npc.isKO flag
  - [ ] Disable physics body
- [ ] Test: Verify KO sprite appears grayed
- [ ] Test: Verify KO sprite is rotated
- [ ] Test: Verify KO sprite has no collision

## Phase 4: Combat Mechanics

### Task 4.1: Create Player Combat System
- [ ] Create `/js/systems/player-combat.js`
- [ ] Initialize player combat state (cooldown, isPunching)
- [ ] Implement `initPlayerCombat()` function
- [ ] Implement `canPlayerPunch()` function
  - [ ] Check cooldown timer
  - [ ] Check if already punching
  - [ ] Check if player is KO
  - [ ] Return boolean
- [ ] Implement `playerPunch(targetNPC)` function
  - [ ] Verify can punch
  - [ ] Get player facing direction
  - [ ] Play punch animation
  - [ ] Wait for animation duration
  - [ ] Check if NPC still in range
  - [ ] Calculate damage from config
  - [ ] Call damageNPC if in range
  - [ ] Start cooldown timer
  - [ ] Set isPunching state
- [ ] Implement `updatePlayerCombat(delta)` function
  - [ ] Update cooldown timers
  - [ ] Reset isPunching when done
- [ ] Implement `getHostileNPCsInRange()` helper
  - [ ] Get NPCs in current room
  - [ ] Filter for hostile NPCs
  - [ ] Filter for NPCs in punch range
  - [ ] Return array
- [ ] Add to window.playerCombat
- [ ] Test: Verify player can punch hostile NPC
- [ ] Test: Verify cooldown prevents spam punching
- [ ] Test: Verify damage applies correctly
- [ ] Test: Verify out-of-range punches don't damage

### Task 4.2: Create NPC Combat System
- [ ] Create `/js/systems/npc-combat.js`
- [ ] Implement `initNPCCombat()` function
- [ ] Implement `canNPCAttack(npcId, npc, playerPos)` function
  - [ ] Get NPC hostile state
  - [ ] Check attack cooldown
  - [ ] Check if NPC is KO
  - [ ] Calculate distance to player
  - [ ] Verify player in attack range
  - [ ] Return boolean
- [ ] Implement `npcAttack(npcId, npc)` function
  - [ ] Get NPC facing direction
  - [ ] Stop NPC movement
  - [ ] Play NPC punch animation
  - [ ] Wait for animation duration
  - [ ] Check if player still in range
  - [ ] Get damage from NPC config or default
  - [ ] Call damagePlayer if in range
  - [ ] Update attack cooldown in hostile state
  - [ ] Set last attack time
- [ ] Implement `updateNPCCombat(delta)` function
  - [ ] Update all NPC attack cooldowns
  - [ ] Update hostile state cooldowns
- [ ] Add to window.npcCombat
- [ ] Test: Verify NPC can attack player
- [ ] Test: Verify NPC attack cooldown works
- [ ] Test: Verify player takes damage from NPC
- [ ] Test: Verify NPC stops to attack

## Phase 5: Behavior System Extensions

### Task 5.1: Extend NPC Behavior for Hostile Mode
- [ ] Open `/js/systems/npc-behavior.js`
- [ ] Import hostile system and combat config
- [ ] Add hostile check in `updateNPCBehaviors()` loop
- [ ] Implement `updateHostileBehavior(npc, playerPosition, delta)` function
  - [ ] Enable LOS if not enabled (360 degree vision)
  - [ ] Import isInLineOfSight from npc-los.js
  - [ ] Check if player in LOS
  - [ ] If in LOS: chase player
  - [ ] Calculate distance to player
  - [ ] If in attack range: stop and attack
  - [ ] If not in LOS: continue normal patrol or search
- [ ] Implement `moveNPCTowardsTarget(npc, targetPosition)` function
  - [ ] Get pathfinder for NPC's room
  - [ ] Convert world positions to grid coordinates
  - [ ] Call pathfinder.findPath()
  - [ ] Use chase speed from config
  - [ ] Call pathfinder.calculate()
  - [ ] Handle path result
- [ ] Implement `stopNPCMovement(npc)` function
  - [ ] Stop sprite velocity
  - [ ] Clear current path
  - [ ] Play idle animation
- [ ] Test: Verify hostile NPC enables LOS
- [ ] Test: Verify hostile NPC chases player when in sight
- [ ] Test: Verify hostile NPC stops to attack in range
- [ ] Test: Verify hostile NPC returns to patrol when losing sight

### Task 5.2: Extend LOS System
- [ ] Open `/js/systems/npc-los.js`
- [ ] Implement `enableNPCLOS(npc, range, angle)` function
  - [ ] Create los object if doesn't exist
  - [ ] Set enabled to true
  - [ ] Set range (default 400)
  - [ ] Set angle (default 360 for hostile)
- [ ] Implement `setNPCLOSTracking(npc, isTracking)` function
  - [ ] Set angle to 360 if tracking
  - [ ] Set angle to 120 if not tracking
- [ ] Export new functions
- [ ] Test: Verify LOS can be enabled dynamically
- [ ] Test: Verify 360 degree vision works for hostile NPCs

## Phase 6: Integration Points

### Task 6.1: Add Hostile Tag Handler
- [ ] Open `/js/minigames/helpers/chat-helpers.js`
- [ ] Locate `processGameActionTags()` function
- [ ] Add hostile tag filter: `tags.filter(tag => tag.startsWith('hostile:'))`
- [ ] Implement `processHostileTag(tag, ui)` function
  - [ ] Parse tag to get NPC ID
  - [ ] Use current NPC ID if not specified
  - [ ] Log hostile trigger
  - [ ] Call npcHostileSystem.setNPCHostile()
  - [ ] Emit 'npc_became_hostile' event
  - [ ] Exit conversation immediately
- [ ] Add processHostileTag to tag processing loop
- [ ] Export if needed
- [ ] Test: Verify #hostile tag triggers hostile state
- [ ] Test: Verify #hostile:npcId works
- [ ] Test: Verify conversation exits after hostile trigger

### Task 6.2: Update Security Guard Ink
- [ ] Open `/scenarios/ink/security-guard.ink`
- [ ] Review all paths that currently end with `-> END`
- [ ] Update paths that should return to hub:
  - [ ] Line 83 (explain_drop low influence): Add `# exit_conversation` or return to hub
  - [ ] Line 99 (claim_official low influence): Add `# exit_conversation`
  - [ ] Line 119 (explain_situation low influence): Add `# exit_conversation`
  - [ ] Line 134 (explain_files low influence): Add `# exit_conversation`
  - [ ] Line 150 (explain_audit low influence): Add `# exit_conversation`
  - [ ] Line 180 (back_down): Add `# exit_conversation`
- [ ] Update hostile paths to trigger hostile state:
  - [ ] Line 159 (hostile_response): Add `# hostile:security_guard`
  - [ ] Line 167 (escalate_conflict): Add `# hostile:security_guard`
- [ ] Ensure all hostile paths also have `# exit_conversation`
- [ ] Review hub pattern to ensure choices always return to hub or exit cleanly
- [ ] Test: Load security guard conversation
- [ ] Test: Verify hub pattern works (can navigate back)
- [ ] Test: Verify hostile paths trigger combat
- [ ] Test: Verify conversation exits on hostile

### Task 6.3: Modify Player Movement for KO
- [ ] Open `/js/core/player.js`
- [ ] Locate `updatePlayerMovement()` function
- [ ] Add KO check at start of function
  - [ ] Check window.playerHealth?.isPlayerKO()
  - [ ] If KO: stop velocity
  - [ ] If KO: play idle animation
  - [ ] If KO: return early
- [ ] Locate `movePlayerToPoint()` function
- [ ] Add KO check at start
  - [ ] If KO: log message and return early
- [ ] Test: Verify player cannot move when KO
- [ ] Test: Verify player stops moving when becoming KO

### Task 6.4: Add Punch Interaction
- [ ] Open `/js/systems/interactions.js`
- [ ] Import COMBAT_CONFIG
- [ ] Implement `checkHostileNPCInteractions()` function
  - [ ] Check if player exists and is not KO
  - [ ] Get player position
  - [ ] Get NPCs in current room
  - [ ] Loop through NPCs
  - [ ] Check if NPC is hostile and not KO
  - [ ] Calculate distance to each hostile NPC
  - [ ] If in punch range: show punch indicator
  - [ ] Store reference in window.currentPunchTarget
- [ ] Add visual punch indicator (optional icon or highlight)
- [ ] Call checkHostileNPCInteractions() in interaction update
- [ ] Add punch key handler in appropriate input setup location
  - [ ] Listen for SPACE key
  - [ ] Check if currentPunchTarget exists
  - [ ] Check if canPlayerPunch()
  - [ ] Call playerCombat.playerPunch()
- [ ] Test: Verify punch indicator shows near hostile NPC
- [ ] Test: Verify SPACE key triggers punch
- [ ] Test: Verify punch only works when in range

## Phase 7: Main Game Integration

### Task 7.1: Initialize Systems in Main
- [ ] Open `/js/main.js`
- [ ] Import all new modules:
  - [ ] player-health.js
  - [ ] player-health-ui.js
  - [ ] npc-hostile.js
  - [ ] npc-health-ui.js
  - [ ] game-over-ui.js
  - [ ] player-combat.js
  - [ ] npc-combat.js
  - [ ] npc-los.js (for enableNPCLOS)
- [ ] Locate create() method
- [ ] Add player health initialization
  - [ ] Call initPlayerHealth()
  - [ ] Store in window.playerHealth
  - [ ] Call initPlayerHealthUI()
- [ ] Add NPC hostile system initialization
  - [ ] Call initNPCHostileSystem()
  - [ ] Store in window.npcHostileSystem
  - [ ] Call initNPCHealthUI(this)
- [ ] Add combat system initialization
  - [ ] Call initPlayerCombat()
  - [ ] Store in window.playerCombat
  - [ ] Call initNPCCombat()
  - [ ] Store in window.npcCombat
- [ ] Add game over UI initialization
  - [ ] Call initGameOverUI()
- [ ] Set up event listeners
  - [ ] Listen to 'player_hp_changed' → update health UI
  - [ ] Listen to 'player_ko' → show game over
  - [ ] Listen to 'npc_became_hostile' → enable LOS, create health bar
  - [ ] Listen to 'npc_ko' → replace sprite, remove health bar
- [ ] Test: Verify all systems initialize without errors
- [ ] Test: Verify events fire correctly

### Task 7.2: Update Game Loop
- [ ] Locate update(time, delta) method in main game scene
- [ ] Add player combat update
  - [ ] Call window.playerCombat?.update(delta)
- [ ] Add NPC combat update
  - [ ] Call window.npcCombat?.update(delta)
- [ ] Add NPC health bar position updates
  - [ ] Call window.npcHealthUI?.updatePositions()
- [ ] Add hostile NPC interaction checks
  - [ ] Call checkHostileNPCInteractions()
- [ ] Test: Verify combat updates work
- [ ] Test: Verify health bars follow NPCs
- [ ] Test: Verify interaction checks work each frame

## Phase 8: Testing and Polish

### Task 8.1: System Integration Testing
- [ ] Test: Start game and verify no errors
- [ ] Test: Load security guard conversation
- [ ] Test: Trigger hostile response path
- [ ] Test: Verify guard becomes hostile
- [ ] Test: Verify conversation exits
- [ ] Test: Verify guard chases player
- [ ] Test: Verify guard attacks when in range
- [ ] Test: Verify player takes damage
- [ ] Test: Verify hearts appear and update
- [ ] Test: Verify player can punch guard
- [ ] Test: Verify guard takes damage
- [ ] Test: Verify guard health bar updates
- [ ] Test: Verify guard becomes KO at 0 HP
- [ ] Test: Verify player becomes KO at 0 HP
- [ ] Test: Verify game over screen appears
- [ ] Test: Verify restart button works

### Task 8.2: Edge Case Testing
- [ ] Test: Punch when NPC moves out of range
- [ ] Test: Rapid key presses during cooldown
- [ ] Test: Multiple hostile NPCs
- [ ] Test: Hostile NPC loses sight of player
- [ ] Test: Player leaves room with hostile NPC
- [ ] Test: Player returns to room with hostile NPC
- [ ] Test: Damage at exactly 0 HP
- [ ] Test: Healing above max HP
- [ ] Test: Very rapid damage (multiple hits at once)
- [ ] Test: Browser window resize during combat
- [ ] Test: Conversation triggered while hostile NPC active
- [ ] Test: Save/load with hostile state active

### Task 8.3: Visual Polish
- [ ] Verify hearts are clearly visible
- [ ] Verify hearts are positioned correctly above inventory
- [ ] Verify health bars don't overlap with NPCs
- [ ] Verify health bars visible on all backgrounds
- [ ] Verify red tint is clearly visible during punches
- [ ] Verify KO sprite is clearly different from active sprite
- [ ] Verify game over screen is readable and centered
- [ ] Verify all text is legible
- [ ] Add any necessary z-index adjustments
- [ ] Test on different screen sizes

### Task 8.4: Configuration Tuning
- [ ] Play test with current values
- [ ] Adjust player HP if too easy/hard
- [ ] Adjust player damage if too strong/weak
- [ ] Adjust NPC HP if too easy/hard to defeat
- [ ] Adjust NPC damage if too punishing/weak
- [ ] Adjust chase speed if too slow/fast
- [ ] Adjust attack ranges if too short/long
- [ ] Adjust cooldowns if too spammy/sluggish
- [ ] Document final values in config file
- [ ] Test with multiple scenarios

## Phase 9: Documentation

### Task 9.1: Code Documentation
- [ ] Add JSDoc comments to all new functions
- [ ] Add file header comments explaining purpose
- [ ] Document event names and payloads
- [ ] Document configuration options
- [ ] Add inline comments for complex logic

### Task 9.2: Update Related Documentation
- [ ] Document hostile tag usage in Ink guidelines
- [ ] Add example hostile conversation to docs
- [ ] Document combat configuration in README
- [ ] Add troubleshooting section for combat issues
- [ ] Update game mechanics documentation

## Estimated Time Per Phase

- Phase 1 (Core Systems): 3-4 hours
- Phase 2 (UI Components): 3-4 hours
- Phase 3 (Animations): 1-2 hours
- Phase 4 (Combat Mechanics): 3-4 hours
- Phase 5 (Behavior Extensions): 2-3 hours
- Phase 6 (Integration): 3-4 hours
- Phase 7 (Main Integration): 1-2 hours
- Phase 8 (Testing & Polish): 4-5 hours
- Phase 9 (Documentation): 1-2 hours

**Total Estimated Time: 21-30 hours**

## Success Criteria Checklist

- [ ] Player health system tracks HP correctly
- [ ] Hearts display correctly and update in real-time
- [ ] Player becomes KO at 0 HP
- [ ] Game over screen displays and restart works
- [ ] NPCs can become hostile via Ink tag
- [ ] Hostile NPCs enable LOS automatically
- [ ] Hostile NPCs chase player when in sight
- [ ] Hostile NPCs attack player in range
- [ ] Player can punch hostile NPCs
- [ ] NPCs take damage and track HP
- [ ] NPC health bars display and update
- [ ] NPCs become KO at 0 HP
- [ ] KO sprites replace active NPCs
- [ ] Security guard Ink uses proper hub pattern
- [ ] Hostile paths trigger combat correctly
- [ ] All systems work together without conflicts
- [ ] Configuration is flexible and tunable
- [ ] No console errors during normal gameplay
- [ ] Game remains playable and fun

# NPC Behavior System - Planning & Implementation Guide

## Overview

This directory contains comprehensive planning documents for implementing dynamic NPC behaviors in Break Escape. The behavior system allows NPCs to react to the player, patrol areas, maintain personal space, and exhibit hostility states—all configurable through scenario JSON and controllable via Ink story tags.

**Status**: Ready for implementation  
**Timeline**: 3 weeks (Phase -1: 1 day, Phases 0-7: 2.5 weeks)

## Document Index

### 1. **IMPLEMENTATION_PLAN.md** (START HERE)
**Purpose**: Complete implementation roadmap with architecture, algorithms, and phased rollout plan.

**Contains**:
- **Phase -1: Critical Prerequisites** (walk animations, setup)
- System architecture and data flow
- Behavior state machine design
- Scenario JSON schema extensions
- Ink tag integration specifications
- Movement algorithms (face player, patrol, personal space)
- Integration points with existing systems
- 8-phase implementation plan
- Testing strategy and success criteria
- Performance considerations
- Future enhancements roadmap

**For**: Lead developer, project planning, architecture review

---

### 2. **TECHNICAL_SPEC.md**

**Contains**:
- Class definitions (NPCBehaviorManager, NPCBehavior)
- Complete API reference with method signatures
- Configuration schema with defaults
- Animation system specifications
- Movement algorithm implementations (with code)
- Depth calculation formulas
- Ink integration flow diagrams
- Tag handler implementations
- Performance optimization techniques
- Error handling patterns
- Testing checklist

**For**: Developers writing npc-behavior.js, integration work

---

### 3. **QUICK_REFERENCE.md**
**Purpose**: Fast lookup guide for common tasks and patterns.

**Status**: ✅ Updated with review corrections (v2.0)

**Contains**:
- Scenario configuration examples (copy-paste ready)
- Ink tag usage examples
- Developer API quick reference
- Configuration defaults table
- Distance reference (tiles ↔ pixels)
- Behavior priority table
- Common patterns cookbook
- Troubleshooting guide

**For**: Scenario designers, Ink writers, quick lookups

---

### 4. **example_scenario.json**
**Purpose**: Test scenario demonstrating all behavior types.

**Contains**:
- 5 NPCs with different behavior configurations:
  1. Default NPC (face player only)
  2. Patrolling Guard (patrol + face player)
  3. Shy Person (personal space + face player)
  4. Hostile Agent (hostile state + red tint)
  5. Complex NPC (all behaviors, Ink-controlled)

**For**: Testing, reference implementation, QA

---

### 5. **example_ink_complex.ink**
**Purpose**: Ink story demonstrating all behavior control tags.

**Contains**:
- Toggle patrol (#patrol_mode:on / :off)
- Set influence (#influence:±value)
- Toggle hostile (#hostile / #hostile:false)
- Adjust personal space (#personal_space:distance)
- Interactive dialogue for testing each behavior

**For**: Ink writers, behavior testing, tag reference

---

### 6. **example_ink_hostile.ink**
**Purpose**: Focused example of hostile state and influence system.

**Contains**:
- Hostile state initialization (#hostile)
- Influence score management (#influence:value)
- Threshold-based behavior changes
- Peace-making dialogue (hostile → friendly)

**For**: Ink writers, hostile behavior patterns

---

## Implementation Workflow

### Phase -1: Critical Prerequisites (1 day)
1. **Create walk animations** in `npc-sprites.js`
   - Walk animations for 4 directions (up, down, left, right)
   - Idle animations (if not already present)
   - See IMPLEMENTATION_PLAN.md for frame numbers
2. **Add player position null checks** in update loop
3. **Add phone NPC filtering** in behavior registration
4. **Implement setupNPCEnvironmentCollisions** if missing
5. **Add roomId to NPC data** during scenario initialization

### Phase 0: Foundation Setup (1 day)
1. Verify animations work
2. Set up test scenario
3. Verify integration points

### Phase 1: Core Infrastructure
1. Create `js/systems/npc-behavior.js`
2. Implement `NPCBehaviorManager` class
3. Implement `NPCBehavior` class with state machine
4. Integrate with `game.js` update loop
5. Integrate with `rooms.js` behavior registration
6. Test with single NPC (idle state)

### Phase 2: Face Player Behavior
1. Implement `facePlayer()` logic
2. Test with example_scenario.json default_npc

### Phase 3: Patrol Behavior
1. Implement `updatePatrol()` logic with bounds validation
2. Add collision handling and stuck recovery
3. Test with example_scenario.json patrol_npc

### Phase 4: Personal Space
1. Implement `maintainPersonalSpace()` with wall collision detection
2. Test with example_scenario.json shy_npc

### Phase 5: Ink Integration
1. Extend `npc-game-bridge.js` with tag handlers
2. Add tag processing to person-chat minigame
3. Test with example_ink_complex.ink

### Phase 6: Hostile Behavior
1. Implement hostile visual feedback (red tint)
2. Add influence → hostility logic
3. Test with example_scenario.json hostile_npc and example_ink_hostile.ink

### Phase 7: Polish & Debug
1. Add animation fallback strategy
2. Add debug visualization (optional)
3. Performance testing

### Phase 8: Testing & Documentation
1. Run full test suite
2. Write user documentation
3. Update scenario design guides

---

## Quick Start for Common Tasks

### For Scenario Designers

**"How do I make an NPC patrol?"**
→ See **QUICK_REFERENCE.md** → "Add Patrol Behavior"

**"What distances should I use?"**
→ See **QUICK_REFERENCE.md** → "Distance Reference" table

**"How do I make a hostile NPC?"**
→ See **example_scenario.json** → `hostile_npc` configuration

**"Why is my NPC's patrol not working?"**
→ See **QUICK_REFERENCE.md** → "Troubleshooting" → "NPC Not Patrolling"

### For Ink Writers

**"What tags control NPC behavior?"**
→ See **QUICK_REFERENCE.md** → "For Ink Story Writers" section

**"How do I make an NPC hostile via dialogue?"**
→ See **example_ink_hostile.ink** → `make_peace` knot

**"How do I toggle patrol mode?"**
→ See **example_ink_complex.ink** → `start_patrol` / `stop_patrol` knots

### For Developers

**"What's the class structure?"**
→ See **TECHNICAL_SPEC.md** → "Class Definitions"

**"How do I integrate with game.js?"**
→ See **IMPLEMENTATION_PLAN.md** → "Integration Points"

**"What's the animation key format?"**
→ See **TECHNICAL_SPEC.md** → "Animation System"

---

## Key Design Decisions

### 1. **Why throttle updates to 50ms?**
- Balance responsiveness with performance
- 20 updates/sec sufficient for NPC behaviors
- Reduces CPU usage with many NPCs

### 2. **Why use squared distances?**
- Avoid expensive Math.sqrt() calls
- Pre-calculate squared thresholds in config
- Significant performance gain with many NPCs

### 3. **Why priority-based state machine?**
- Clear behavior precedence (personal space > patrol)
- Predictable behavior in complex scenarios
- Easy to extend with new behaviors

### 4. **Why reuse player animation patterns?**
- Consistency in codebase
- Proven working implementation
- Reduced development time

### 5. **Why Ink tags for behavior control?**
- Integrates with existing narrative system
- No new UI/controls needed
- Designers can script dynamic behaviors

### 6. **Why are NPC collision boxes wider than player?**
- Better hit detection during patrol
- Prevents player from slipping past patrolling guards
- Intentional design decision (18px vs 15px)

---

## Development Principles

1. **Modularity**: Behavior system is self-contained module
2. **Performance**: Throttled updates, cached calculations
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Easy to add new behaviors
5. **Robustness**: Graceful degradation on errors
6. **Documentation**: Every decision documented
7. **Validation**: Validate inputs (patrol bounds, sprite references, roomId)

---

## Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| Update frequency | 20 Hz (50ms) | Throttled update loop |
| FPS impact (10 NPCs) | < 10% | Optimized calculations |
| Distance checks | O(1) | Squared distances |
| Animation changes | Minimal | Change detection |
| Memory footprint | < 5MB | Efficient data structures |

---

## Integration Checklist

### Phase 0 (Before Implementation):
- [ ] Walk animations created in `npc-sprites.js` (all 5 directions)
- [ ] Idle animations created in `npc-sprites.js` (all 5 directions)
- [ ] `roomId` added to NPC data in scenario initialization
- [ ] Integration point corrected (behaviors register per-room)
- [ ] Review document fully read and understood

### Phase 1+:
- [ ] `npc-behavior.js` created and exported
- [ ] `game.js` creates NPCBehaviorManager (initialize only)
- [ ] `rooms.js` registers behaviors per-room in createNPCSpritesForRoom()
- [ ] `game.js` update loop calls behavior update
- [ ] `npc-game-bridge.js` has behavior control methods
- [ ] `person-chat-minigame.js` processes behavior tags
- [ ] Constructor validates sprite references and roomId
- [ ] Update loop calls updateDepth() explicitly
- [ ] parseConfig() validates patrol bounds
- [ ] Test scenario loads without errors
- [ ] Behaviors work as documented
- [ ] Performance targets met

---

## Known Limitations & Future Work

### Current Limitations
- No pathfinding (direct line movement)
- No chase/flee implementation (stub only)
- No NPC-to-NPC interactions
- No behavior scheduling (time-based)
- No spatial culling (all NPCs update)
- Animation fallback is basic (idle only)

### Post-MVP Enhancements (from review)
- Chase/flee hostile behaviors
- Waypoint-based patrol paths
- Group behaviors (follow leader)
- Debug visualization overlay (Phase 7)
- Behavior scheduling system
- Event emission for behavior state changes
- Improved animation fallback strategy

### Long-term Vision
- Full pathfinding integration
- Emotion system (beyond hostile)
- Dynamic behavior trees
- NPC conversation system
- Animation state blending

---

## Support & Questions

**For design questions**: Review QUICK_REFERENCE.md and example files

**For technical questions**: Check TECHNICAL_SPEC.md API reference

**For architecture questions**: See IMPLEMENTATION_PLAN.md

**For troubleshooting**: See QUICK_REFERENCE.md troubleshooting section

**For performance questions**: See TECHNICAL_SPEC.md optimization section

---

## Version History

- **v1.0** (2025-11-09): Initial planning documents
  - Complete architecture and technical specifications
  - Example scenario and Ink stories
  - 8-phase implementation plan

---

## Contributing

When implementing behaviors:

1. **Read review document first** - PLAN_REVIEW_AND_RECOMMENDATIONS.md
2. **Complete Phase 0 before Phase 1** - Animation prerequisites are mandatory
3. Follow patterns from `player.js` (movement, animation)
4. Use emoji prefixes in console logs (🤖 for behaviors)
5. Add comprehensive error handling and validation
6. Write JSDoc comments for all methods
7. Update this documentation if design changes

---

## File Locations

```
planning_notes/npc/npc_behaviour/
├── README.md                           (this file)
├── PLAN_REVIEW_AND_RECOMMENDATIONS.md  (⚠️ READ FIRST)
├── IMPLEMENTATION_PLAN.md              (architecture & roadmap - v2.0)
├── TECHNICAL_SPEC.md                   (developer reference - needs updates)
├── QUICK_REFERENCE.md                  (quick lookup guide - v2.0)
├── example_scenario.json               (test scenario config)
├── example_ink_complex.ink             (full behavior demo)
└── example_ink_hostile.ink             (hostile state demo)

Future implementation files:
js/systems/
└── npc-behavior.js              (core behavior system - to be created)
```

---

## Version History

- **v2.0** (2025-11-09): Post-review updates
  - Added Phase 0 prerequisites
  - Fixed critical animation timing issue
  - Corrected integration points (per-room registration)
  - Added validation requirements
  - Updated all documentation with review fixes
  - Added PLAN_REVIEW_AND_RECOMMENDATIONS.md
  
- **v1.0** (2025-11-09): Initial planning documents
  - Complete architecture and technical specifications
  - Example scenarios and Ink files
  - 8-phase implementation plan

---

**Document Status**: Updated v2.0 (Post-Review)  
**Last Updated**: 2025-11-09  
**Review Applied**: PLAN_REVIEW_AND_RECOMMENDATIONS.md  
**Ready for Implementation**: ✅ Phase 0 must be completed first

**Document Status**: Planning Complete, Ready for Implementation
**Last Updated**: 2025-11-09
**Maintainer**: Development Team

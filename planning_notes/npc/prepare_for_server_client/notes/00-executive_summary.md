# Break Escape: Lazy-Loading NPC Migration: Executive Summary
## Quick Overview & Decision Guide

**Date**: November 6, 2025  
**Target Audience**: Project leads, architects, stakeholders  
**Status**: Planning complete, ready for implementation  
**Scope**: Direct implementation by human + AI, clean client/server separation

---

## The Problem We're Solving

### Current Limitation
1. **Config Exposure**: All NPCs and room info loaded to client (players can inspect)
2. **NPC Cheating**: Player can read config files to see all unlocks/secrets
3. **Monolithic Format**: NPCs defined at scenario root, not scoped to rooms
4. **No Security Boundary**: Everything client-side, no server validation

**Result**: Exploitable, not ready for future server work

### Solution We're Building
1. **Lazy-Load NPCs**: Load only when room enters (prevents config inspection)
2. **Room-Define NPCs**: All NPCs belong to specific rooms (clean architecture)
3. **Server Validation**: Important gates (unlocks, access) validated server-side (future)
4. **Clean Separation**: Client = gameplay logic, Server = security logic

**Benefit**: Clean architecture, prevents cheating, foundation for server work

---

## Implementation Approach

### Development Strategy
- **Direct implementation** by human + AI (no intermediate approvals)
- **Client-side**: Gameplay logic, dialogue, animations, events
- **Server-side** (future): Validation of important gates (room access, unlocks, objectives)
- **NPC Definition**: Room-scoped (phone NPCs also in rooms, but can load before room enters)
- **Loading**: Lazy-load when room loads (prevents config inspection)

### What We're NOT Doing
- ❌ Full server-side game delivery (yet - Phase 4+ future work)
- ❌ Multiplayer or real-time sync
- ❌ Streaming entire scenarios from server
- ❌ Complex backend architecture changes

### What We ARE Doing
- ✅ Clean NPC architecture (room-defined)
- ✅ Lazy-loading (prevent config cheating)
- ✅ Support all NPC types in rooms (person, phone, both)
- ✅ Server validation readiness (foundation for future)
- ✅ No regressions to existing gameplay

### Scenario JSON Format (New)

**BEFORE**:
```json
{
  "npcs": [ 
    // ALL NPCs here, loaded at startup
    { "id": "helper", "npcType": "phone", "roomId": "?" },
    { "id": "clerk", "npcType": "person", "roomId": "reception" }
  ],
  "rooms": { "reception": { } }
}
```

**AFTER**:
```json
{
  "npcs": [
    // Only phone NPCs available everywhere
    { "id": "helper", "npcType": "phone", "phoneId": "player_phone" }
  ],
  "rooms": {
    "reception": {
      "npcs": [
        // Person/phone NPCs scoped to this room
        { "id": "clerk", "npcType": "person", "position": {...}, "spriteSheet": "..." }
      ]
    }
  }
}
```

### File Changes

**NEW**:
```
js/systems/npc-lazy-loader.js                          ← Lazy-load coordinator
planning_notes/npc/prepare_for_server_client/05-DEVELOPMENT_GUIDE.md  ← THIS FILE
```

**UPDATED**:
```
js/main.js                             ← Initialize lazy loader
js/core/rooms.js                       ← Call lazy loader on room load
js/systems/npc-manager.js              ← Add unregisterNPC() cleanup
js/core/game.js                        ← Register only root phone NPCs at startup
scenarios/*.json                       ← Migrate NPCs to rooms
```

---

## Implementation Phases

### Phase 0: Setup & Understanding (1-2 hours)
**Goal**: Understand current code

- Examine NPC loading in game.js
- Review room loading lifecycle
- Understand Ink story usage

### Phase 1: Scenario JSON Migration (3-4 hours)
**Goal**: Define NPCs per room in scenario files

- Move person NPCs from `npcs[]` to `rooms[roomId].npcs[]`
- Keep phone NPCs at root level
- Update all test scenarios

### Phase 2: Create NPCLazyLoader (4-5 hours)
**Goal**: Build lazy-loading system

- Create `npc-lazy-loader.js`
- Add `unregisterNPC()` to NPCManager
- Implement Ink story caching

### Phase 3: Wire Into Room Loading (4-5 hours)
**Goal**: Call lazy-loader when rooms load

- Initialize lazy-loader in main.js
- Hook into `loadRoom()` function
- Verify NPC sprite creation still works

### Phase 4: Phone NPCs in Rooms (2-3 hours)
**Goal**: Support phone NPCs defined in rooms

- Update game init to only register root phone NPCs
- Verify room-level phone NPCs load with room

### Phase 5: Testing & Validation (6-8 hours)
**Goal**: Comprehensive testing

- Unit tests (>90% coverage)
- Integration tests
- Manual testing on real scenarios

### Phase 6: Documentation (2-3 hours)
**Goal**: Update developer docs

- Update copilot instructions
- Create NPC architecture guide

**TOTAL**: ~22-30 hours

---

## Key Milestones

| Milestone | Criteria |
|-----------|----------|
| Phase 0 Complete | Code review done, approach validated |
| Phase 1 Complete | All scenarios in new format, valid JSON |
| Phase 2 Complete | Lazy-loader created, unit tests passing |
| Phase 3 Complete | Integrated into room loading, no errors |
| Phase 4 Complete | Phone NPCs work in rooms |
| Phase 5 Complete | All tests passing, manual testing done |
| Phase 6 Complete | Documentation updated |
| **READY** | Clean NPC architecture, lazy-loading active |

---

## Impact Analysis

### Who's Affected

| Role | Impact | What They Do |
|------|--------|--------------|
| **Human (Project Lead)** | Direct | Execute plan, review code, make decisions |
| **AI Assistant** | Direct | Implement code, write tests, debug |
| **Player** | Positive | Slightly faster game startup, same gameplay ✅ |

### Architecture Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Config Security** | Client-side exploitable | Server validates important gates |
| **NPC Scope** | Global, root-level | Room-scoped, clean |
| **Loading** | All upfront | On-demand (lazy) |
| **Code Organization** | Monolithic | Modular |
| **Server Readiness** | Not ready | Foundation in place |

---

## Benefits Realized

### Immediate (Phase 1-3)
- ✅ Cleaner code organization
- ✅ Easier to understand NPC scope
- ✅ Better memory management
- ✅ Faster game initialization (small scenarios)

### Medium-term (Phase 3-4)
- ✅ Support for server-side game delivery
- ✅ Ability to stream content on-demand
- ✅ Foundation for dynamic/multiplayer features
- ✅ Scalability for large scenarios

### Long-term (Phase 4+)
- ✅ Real-time multiplayer support
- ✅ Dynamic NPC spawning (events trigger NPCs)
- ✅ User-generated content platforms
- ✅ Advanced analytics on game state

---

## Development Approach

This is a **collaborative refactoring project** between human and AI:
- Direct implementation (no intermediate team approval cycles)
- Clean separation: client-side content/logic vs. server-side validation
- Room-defined NPCs (including phone NPCs)
- Lazy-loading to avoid pre-loading exploitable config
- Important validations (room access, unlocks) happen server-side
- Client-side logic OK for non-sensitive gameplay

### Tools/Infrastructure
- JavaScript test framework (Jest or Mocha): Free
- Mock server: ~5 hours to build
- API server (Phase 4): Depends on chosen tech
- Database (Phase 4): Depends on scale

### Documentation
- This planning doc: ✅ Done
- Scenario migration guide: ✅ Done
- Server API spec: ✅ Done
- Testing plan: ✅ Done
- Developer guide (TODO): ~10 hours

---

## Critical Success Factors

1. **Backward Compatibility** (Phase 1-3)
   - Old scenarios must work throughout migration
   - No breaking changes to existing APIs
   - Clear rollback path if issues found

2. **Testing Coverage** (All Phases)
   - >90% unit test coverage
   - Integration tests for room + NPC lifecycle
   - Regression tests for all existing scenarios
   - Manual testing on real content

3. **Performance Metrics** (Phase 1)
   - Game init time < 1 second
   - Room load time < 200ms
   - No frame rate degradation
   - Memory stable (not leaking)

4. **Team Communication** (All Phases)
   - Clear ownership (who owns what phase)
   - Regular check-ins (weekly)
   - Documentation updates as we go
   - Shared understanding of architecture

---

## Decision Points for Leadership

### Decision 1: Proceed with Plan?
**Question**: Should we start Phase 1?

**Recommendation**: ✅ **YES**
- Plan is solid and low-risk
- Phase 1 is backward-compatible
- Can be stopped after Phase 1 if needed
- Infrastructure will be useful regardless

**Decision Owner**: Technical Lead

---

### Decision 2: Timeline Aggressive or Conservative?
**Question**: 4 weeks (aggressive) or 8 weeks (conservative)?

**Recommendation**: 🟡 **Start with 4 weeks, be flexible**
- Phase 1 can be done in 2 weeks
- Phase 2 is straightforward (1 week)
- Phase 3 is moderate complexity (1 week)
- Build buffer time as needed

**Decision Owner**: Project Manager

---

### Decision 3: Full Regression Testing Required?
**Question**: Can we skip some testing to move faster?

**Recommendation**: ⛔ **NO - test thoroughly**
- NPC system is core gameplay
- Regressions are high-impact
- Testing takes ~1 week (included in timeline)
- Worth it for confidence

**Decision Owner**: QA Lead

---

## Next Steps

### Immediate (This Week)
1. ✅ Review this plan with team
2. ✅ Get approval to proceed
3. ✅ Assign Phase 1 developer
4. ✅ Set up testing framework

### Week 1 (Phase 1 Kickoff)
1. Create `npc-lazy-loader.js`
2. Write unit tests
3. Hook into room loading
4. Verify backward compatibility

### Week 2 (Phase 1 Completion)
1. Complete testing
2. Code review
3. Merge to main
4. Begin Phase 2

### Week 3 (Phase 2)
1. Create migration script
2. Update scenarios
3. Validation & testing
4. Merge changes

---

## Q&A for Stakeholders

### Q: Will players notice any changes?
**A**: Mostly positive:
- Slightly faster game startup (small scenarios)
- Smoother room transitions (less initial load)
- No visible changes to gameplay
- New features coming in Phase 4

### Q: Can we do this incrementally?
**A**: Yes!
- Phase 1 can be deployed separately
- Phases 1-3 don't depend on each other much
- Phase 4 requires 1-3 complete first
- Natural breakpoints for releases

### Q: What if we find bugs during Phase 1?
**A**: Easy to rollback:
- New code is isolated in `npc-lazy-loader.js`
- Old scenarios still use upfront loader
- Can disable lazy-loader instantly
- No harm to existing gameplay

### Q: When can we use the server API?
**A**: After Phase 4 (5+ weeks), but:
- Phase 4 creates the API spec
- Mock server for testing
- Real server implementation depends on backend team
- Could be done in parallel

### Q: Should we plan multiplayer during this?
**A**: **Not yet**
- Phase 4 creates foundation for multiplayer
- Multiplayer is Phase 5+ (future)
- But this plan unblocks multiplayer
- Get Phase 1-3 done first, plan Phase 4+ separately

---

## Reference Documents

This summary references four detailed planning documents:

1. **`01-lazy_load_plan.md`** (30 pages)
   - Complete technical architecture
   - Code examples and patterns
   - Risk mitigation strategies
   - Timeline and phases

2. **`02-scenario_migration_guide.md`** (20 pages)
   - Step-by-step migration instructions
   - Examples and common questions
   - Automation scripts
   - Testing procedures

3. **`03-server_api_specification.md`** (25 pages)
   - REST API endpoints
   - Data models
   - Authentication & authorization
   - Deployment checklist

4. **`04-testing_checklist.md`** (20 pages)
   - Unit test examples
   - Integration tests
   - Manual testing procedures
   - Performance benchmarks

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | _______ | _______ | _______ |
| Project Manager | _______ | _______ | _______ |
| QA Lead | _______ | _______ | _______ |
| Product Owner | _______ | _______ | _______ |

---

## Conclusion

This plan transforms Break Escape from a monolithic client-side game into a **scalable, server-ready platform** without disrupting current gameplay.

**Key Takeaway**: By investing ~1 developer-month now, we unlock capabilities for:
- Streaming game content on-demand
- Dynamic, evolving game worlds
- Multiplayer support
- Large-scale scenarios

**The path forward is clear, well-documented, and low-risk.**

---

## Contact & Questions

- **Architecture Lead**: [Name] - general questions
- **Phase 1 Dev**: [Name] - implementation details
- **QA Lead**: [Name] - testing procedures
- **Project Manager**: [Name] - timeline & resources

For more details, see the 4 detailed planning documents in:
```
planning_notes/npc/prepare_for_server_client/
```

---

**Plan Status**: ✅ **COMPLETE & READY FOR IMPLEMENTATION**

**Date**: November 6, 2025  
**Last Updated**: November 6, 2025

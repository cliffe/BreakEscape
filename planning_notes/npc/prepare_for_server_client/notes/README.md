# Break Escape: Lazy-Loading NPC Architecture Plan
## Complete Planning Documentation Index

**Created**: November 6, 2025  
**Status**: Planning Complete - Ready for Implementation  
**Location**: `planning_notes/npc/prepare_for_server_client/`

---

## 📋 Documents in This Plan

### 1. **00-executive_summary.md** (START HERE!)
**Length**: ~15 pages | **Audience**: Managers, stakeholders, tech leads

Quick overview of the entire migration plan:
- Problem statement & vision
- 4-phase implementation overview
- Timeline & resource requirements
- Decision points for leadership
- Q&A section
- Approval sign-off form

**Read this if**: You have 20 minutes and want the big picture

---

### 2. **01-lazy_load_plan.md** (MAIN TECHNICAL PLAN)
**Length**: ~35 pages | **Audience**: Architects, senior developers

Comprehensive technical architecture:
- Current vs. target architecture (with diagrams)
- Detailed implementation phases (1-4)
- NPC type breakdown (person vs. phone)
- File structure changes
- Memory & performance implications
- Migration timeline & testing strategy
- Risk assessment & mitigation
- Key decision points with alternatives
- Code examples for each phase
- Appendices with glossary & code locations

**Read this if**: You're implementing the architecture or making design decisions

---

### 3. **02-scenario_migration_guide.md** (FOR CONTENT DESIGNERS)
**Length**: ~20 pages | **Audience**: Content designers, QA, scenario creators

Step-by-step instructions for updating scenarios:
- Quick reference (before/after format)
- Migration checklist
- 6-step migration process with examples
- Common questions (Q&A)
- Automation scripts (Python for bulk migration)
- Backward compatibility during migration
- Full migration template
- Known issues & resolution

**Read this if**: You need to update scenario JSON files or help others do it

---

### 4. **03-server_api_specification.md** (FOR BACKEND DEVS)
**Length**: ~25 pages | **Audience**: Backend developers, API designers

Complete REST API specification for server integration:
- Architecture context (why this API design)
- 8 categories of endpoints:
  1. Game initialization
  2. Scenario data retrieval
  3. Room data on-demand
  4. NPC data management
  5. Game state save/load
  6. Room state updates
  7. Event triggering
  8. Asset serving
- Complete data models (TypeScript interfaces)
- Authentication & authorization (JWT)
- Rate limiting strategy
- Error handling & HTTP status codes
- Performance considerations & caching
- Mock server for testing
- Deployment checklist
- Future enhancements (multiplayer, real-time, etc.)

**Read this if**: You're building the server backend for Phase 4+

---

### 4. **04-testing_checklist.md** (FOR QA & TESTERS)
**Length**: ~20 pages | **Audience**: QA team, testers, automation engineers

Comprehensive testing plan:
- Unit test examples (Jest) for each phase
- Integration test strategies
- Manual testing checklists
- Performance testing metrics
- Browser compatibility matrix
- Regression testing for old scenarios
- Testing template for sign-off
- CI/CD workflow (GitHub Actions)
- Performance benchmarks
- Known issues tracking template
- Post-launch monitoring guidance

**Read this if**: You're testing the implementation or setting up CI/CD

---

## 🎯 How to Use This Plan

### If you're a **Project Manager**:
1. Read `00-executive_summary.md` (20 min)
2. Review timeline & resource estimates
3. Get team approval via sign-off form
4. Assign Phase 1 developer

### If you're a **Architect**:
1. Read `00-executive_summary.md` (20 min)
2. Deep dive into `01-lazy_load_plan.md` (90 min)
3. Review decision points & alternatives
4. Make architectural choices
5. Brief team on decisions

### If you're a **Frontend Developer** (Phase 1):
1. Read `00-executive_summary.md` (20 min)
2. Study `01-lazy_load_plan.md` Phase 1 section (30 min)
3. Review code examples (15 min)
4. Check out `04-testing_checklist.md` for test expectations (20 min)
5. Start implementation

### If you're a **Content Designer** (Phase 2):
1. Skim `00-executive_summary.md` (10 min)
2. Follow `02-scenario_migration_guide.md` step-by-step (60 min)
3. Run migration script or do manually
4. Validate JSON using checklist
5. Test in game

### If you're a **QA/Tester** (All Phases):
1. Read `00-executive_summary.md` (20 min)
2. Study `04-testing_checklist.md` (90 min)
3. Set up test environment
4. Create test cases for your phase
5. Execute & document results

### If you're a **Backend Developer** (Phase 4):
1. Read `00-executive_summary.md` (20 min)
2. Study `03-server_api_specification.md` (60 min)
3. Design database schema
4. Implement API endpoints
5. Create mock server for testing

---

## 📊 Plan Overview Diagram

```
┌─────────────────────────────────────────────────────────┐
│          Break Escape NPC Lazy-Loading Plan             │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────▼──────┐ ┌───▼──────┐ ┌──▼─────────┐
      │ PLANNING   │ │TECHNICAL │ │  OPERATIONAL
      │ (This)     │ │  DETAILS │ │
      └─────┬──────┘ └───┬──────┘ └──┬─────────┘
            │            │            │
      ┌─────▼──────────┐ │ ┌──────────▼─────────┐
      │00-EXECUTIVE    │ │ │03-SERVER-API      │
      │SUMMARY         │ │ │SPEC               │
      │(Overview &     │ │ │(Backend work)     │
      │timeline)       │ │ └───────────────────┘
      └────────────────┘ │
                         │
                    ┌────▼──────┐
                    │01-LAZY-    │
                    │LOAD-PLAN   │
                    │(Technical) │
                    └────┬───────┘
                         │
             ┌───────────┴───────────┐
             │                       │
        ┌────▼─────────┐    ┌───────▼─────┐
        │02-SCENARIO   │    │04-TESTING   │
        │MIGRATION     │    │CHECKLIST    │
        │(Content)     │    │(QA)         │
        └──────────────┘    └─────────────┘
```

---

## 🔄 Implementation Phases at a Glance

| Phase | Duration | Focus | Output | Team |
|-------|----------|-------|--------|------|
| **Phase 1** | 2 weeks | Build lazy-loader infrastructure | `npc-lazy-loader.js` + tests | Frontend dev(s) |
| **Phase 2** | 1 week | Migrate scenarios to new format | Updated `scenarios/*.json` | Content designer |
| **Phase 3** | 1 week | Refactor event/lifecycle system | Working event system | Frontend dev |
| **Phase 4** | 2+ weeks | Design & implement server API | API spec + mock server | Backend dev |

**Total**: ~6 weeks, ~1 developer-month

---

## ✅ Quick Checklist

Before starting Phase 1:

- [ ] Read `00-executive_summary.md`
- [ ] Get team approval on timeline
- [ ] Assign Phase 1 developer
- [ ] Set up testing framework (Jest)
- [ ] Create feature branch: `feature/npc-lazy-loading`
- [ ] Share planning docs with team

Before starting Phase 2:

- [ ] Phase 1 code merged to main
- [ ] All Phase 1 tests passing
- [ ] Assign content designer
- [ ] Review `02-scenario_migration_guide.md`
- [ ] Create backup of scenarios

Before starting Phase 3:

- [ ] Phase 2 scenarios fully migrated
- [ ] Verify backward compatibility
- [ ] Assign event system refactorer
- [ ] Review lifecycle changes with team

Before starting Phase 4:

- [ ] Phases 1-3 complete & stable
- [ ] Assign backend developer(s)
- [ ] Design database schema
- [ ] Plan API implementation timeline

---

## 📝 File Locations

**Planning Documents**:
```
planning_notes/npc/prepare_for_server_client/
├── 00-executive_summary.md
├── 01-lazy_load_plan.md
├── 02-scenario_migration_guide.md
├── 03-server_api_specification.md
├── 04-testing_checklist.md
└── README.md (this file)
```

**Code to be Created**:
```
js/systems/
├── npc-lazy-loader.js (NEW - Phase 1)

Existing files to update:
├── npc-manager.js (add unregisterNPC)
├── npc-sprites.js (optional improvements)

js/core/
├── rooms.js (hook lazy-loader)
├── game.js (refactor NPC init)
```

**Scenarios to Update**:
```
scenarios/
├── npc-sprite-test2.json (Phase 2)
├── ceo_exfil.json (Phase 2)
├── biometric_breach.json (Phase 2)
├── cybok_heist.json (Phase 2)
└── scenario*.json (all others)
```

---

## 🎓 Learning Path for Team

### Day 1: Orientation
- [ ] Team meeting: Review `00-executive_summary.md` (30 min)
- [ ] Q&A session: Discuss concerns, timeline (30 min)
- [ ] Architecture walkthrough: Review `01-lazy_load_plan.md` (60 min)

### Week 1: Deep Dive
- [ ] Frontend devs: Study Phase 1 in detail (2 hours)
- [ ] Content designers: Learn migration process (1 hour)
- [ ] QA team: Plan testing strategy (2 hours)
- [ ] Backend devs: Review API spec (2 hours)

### Before Each Phase
- [ ] Team meeting: Phase-specific overview (30 min)
- [ ] Role-specific prep: Read relevant section (30-60 min)
- [ ] Q&A & blockers: Address concerns (15 min)
- [ ] Start implementation with confidence ✅

---

## 🚀 Success Criteria

**Phase 1 Success**:
- ✅ `npc-lazy-loader.js` created & tested
- ✅ Backward compatibility verified (old scenarios work)
- ✅ Unit test coverage >90%
- ✅ No regressions in existing scenarios
- ✅ Code review approved

**Phase 2 Success**:
- ✅ All scenarios migrated to new format
- ✅ Validation script passes all scenarios
- ✅ Manual testing in game works
- ✅ No console errors related to NPCs
- ✅ Performance maintained

**Phase 3 Success**:
- ✅ Event lifecycle works correctly
- ✅ Timed messages fire at right time
- ✅ No regressions in NPC interactions
- ✅ Integration tests passing

**Phase 4 Success**:
- ✅ API spec finalized & documented
- ✅ Mock server working
- ✅ Client code supports server API
- ✅ Can fetch room data from server
- ✅ Ready for real server implementation

---

## ❓ FAQ

**Q: Can we skip phases?**
A: Not really. Each phase builds on the previous. Phase 1 → 2 → 3 are sequential. Phase 4 is optional but recommended.

**Q: What if we find bugs during Phase 1?**
A: That's normal and expected. The plan includes time for bugs. Lazy-loader is isolated, easy to disable.

**Q: Can we do phases in parallel?**
A: Phase 2 can partially overlap with Phase 1 (migration script ready to go). Phases 3-4 need phases 1-2 done first.

**Q: What about old browser support?**
A: The plan includes browser compatibility testing. Fetch API is widely supported. No IE11 support needed.

**Q: Can we start with Phase 2 only?**
A: Not recommended. Phase 1 infra must exist first. Phase 2 is scenarios migration, only useful if lazy-loader active.

**Q: How much will this cost?**
A: ~1 developer-month (~160 hours @ $100-150/hour = $16k-24k in dev time). Infrastructure costs depend on server setup.

---

## 📞 Support & Questions

- **General questions**: See `00-executive_summary.md` FAQ section
- **Technical questions**: See `01-lazy_load_plan.md` Q&A sections
- **Content migration help**: See `02-scenario_migration_guide.md`
- **API design questions**: See `03-server_api_specification.md`
- **Testing questions**: See `04-testing_checklist.md`

---

## 🔗 Related Documents

In the same directory:
- Other NPC planning notes (if any)

In the main project:
- `copilot-instructions.md` - Project overview
- `README.md` - Project documentation
- `js/systems/npc-manager.js` - Current NPC implementation
- `js/core/rooms.js` - Room loading system

---

## ✨ Next Steps (TODAY)

1. ✅ **Read this README**
2. ✅ **Read `00-executive_summary.md`**
3. ✅ **Team meeting to discuss plan** (30 min)
4. ✅ **Get leadership approval** (sign-off form)
5. ✅ **Assign Phase 1 developer**
6. ✅ **Create feature branch**
7. ⏭️ **Begin Phase 1 implementation**

---

## 📈 Progress Tracking Template

Copy this to track implementation:

```markdown
# Lazy-Loading NPC Migration Progress

## Phase 1: Infrastructure
- [ ] npc-lazy-loader.js created
- [ ] Unit tests written (>90% coverage)
- [ ] Integrated into main.js
- [ ] Hooked into room loading
- [ ] Backward compatibility verified
- [ ] Code reviewed & merged
- **Status**: ⏳ Not Started | 🔄 In Progress | ✅ Complete

## Phase 2: Scenario Migration
- [ ] Migration script created
- [ ] npc-sprite-test2.json migrated
- [ ] ceo_exfil.json migrated
- [ ] All scenarios validated
- [ ] Manual testing passed
- [ ] Code reviewed & merged
- **Status**: ⏳ Not Started | 🔄 In Progress | ✅ Complete

## Phase 3: Lifecycle
- [ ] Event lifecycle refactored
- [ ] Timed messages tested
- [ ] Integration tests written
- [ ] Regressions checked
- [ ] Code reviewed & merged
- **Status**: ⏳ Not Started | 🔄 In Progress | ✅ Complete

## Phase 4: Server Integration
- [ ] API spec finalized
- [ ] Mock server created
- [ ] Client code updated
- [ ] Backend implementation started
- **Status**: ⏳ Not Started | 🔄 In Progress | ✅ Complete

## Overall
- **Started**: [Date]
- **Expected Completion**: [Date]
- **Current Phase**: [Phase]
- **Blockers**: [Any issues]
```

---

## 🎯 Vision Statement

> **Build Break Escape into a scalable, server-ready platform where game content streams on-demand as players explore. Modernize the NPC system from monolithic upfront-loading to lazy-loading architecture, enabling future features like dynamic NPCs, real-time multiplayer, and user-generated scenarios.**

This plan is the **first major step** toward that vision. ✨

---

**Plan Created**: November 6, 2025  
**Status**: ✅ Complete and Ready for Implementation  
**Next Update**: After Phase 1 Completion

# Testing Checklist: Lazy-Loading NPC Migration
## Quality Assurance Plan for Each Phase

**Date**: November 6, 2025  
**Status**: Phase 4 Planning  
**Audience**: QA team, developers, test automation engineers  

---

## Phase 1: Infrastructure Testing (Unit + Integration)

### Unit Tests: NPCLazyLoader

```javascript
// test/npc-lazy-loader.test.js

describe('NPCLazyLoader', () => {
  let loader, mockManager, mockDispatcher;
  
  beforeEach(() => {
    mockManager = {
      npcs: new Map(),
      registerNPC: jest.fn(),
      unregisterNPC: jest.fn()
    };
    mockDispatcher = {
      on: jest.fn(),
      emit: jest.fn()
    };
    loader = new NPCLazyLoader(mockManager, mockDispatcher);
  });
  
  // Test 1: Load NPCs from room.npcs array
  test('loadNPCsForRoom - loads NPCs when room.npcs exists', async () => {
    const roomData = {
      npcs: [
        { id: 'npc1', npcType: 'person', storyPath: null }
      ]
    };
    
    const result = await loader.loadNPCsForRoom('room1', roomData);
    
    expect(result.length).toBe(1);
    expect(mockManager.registerNPC).toHaveBeenCalledWith(roomData.npcs[0]);
    expect(loader.loadedRooms.has('room1')).toBe(true);
  });
  
  // Test 2: Handle missing NPCs
  test('loadNPCsForRoom - returns empty array when no NPCs', async () => {
    const roomData = { npcs: undefined };
    const result = await loader.loadNPCsForRoom('room1', roomData);
    
    expect(result.length).toBe(0);
    expect(mockManager.registerNPC).not.toHaveBeenCalled();
  });
  
  // Test 3: Prevent duplicate loading
  test('loadNPCsForRoom - skips if room already loaded', async () => {
    loader.loadedRooms.add('room1');
    const roomData = { npcs: [{ id: 'npc1' }] };
    
    const result = await loader.loadNPCsForRoom('room1', roomData);
    
    expect(result.length).toBe(0); // Skipped
    expect(mockManager.registerNPC).not.toHaveBeenCalled();
  });
  
  // Test 4: Unload room NPCs
  test('unloadNPCsForRoom - removes all NPCs for room', () => {
    mockManager.npcs.set('npc1', { id: 'npc1', roomId: 'room1' });
    mockManager.npcs.set('npc2', { id: 'npc2', roomId: 'room1' });
    mockManager.npcs.set('npc3', { id: 'npc3', roomId: 'room2' });
    
    loader.loadedRooms.add('room1');
    loader.unloadNPCsForRoom('room1');
    
    expect(mockManager.unregisterNPC).toHaveBeenCalledTimes(2);
    expect(mockManager.unregisterNPC).toHaveBeenCalledWith('npc1');
    expect(mockManager.unregisterNPC).toHaveBeenCalledWith('npc2');
    expect(mockManager.unregisterNPC).not.toHaveBeenCalledWith('npc3');
    expect(loader.loadedRooms.has('room1')).toBe(false);
  });
  
  // Test 5: Cache Ink stories
  test('_loadInkStory - caches story JSON', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ root: [] })
      });
    
    const story1 = await loader._loadInkStory('path/story.json');
    const story2 = await loader._loadInkStory('path/story.json');
    
    expect(story1).toBe(story2); // Same reference
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only 1 fetch
  });
  
  // Test 6: Handle Ink story fetch errors
  test('_loadInkStory - throws on fetch error', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'));
    
    await expect(loader._loadInkStory('bad/path.json'))
      .rejects.toThrow('Network error');
  });
  
  // Test 7: Clear caches
  test('clearCaches - empties all caches', () => {
    loader.inkStoryCache.set('path', {});
    loader.loadedRooms.add('room1');
    
    loader.clearCaches();
    
    expect(loader.inkStoryCache.size).toBe(0);
    expect(loader.loadedRooms.size).toBe(0);
  });
});
```

**Expected Coverage**: >90% line coverage

---

### Unit Tests: NPCManager.unregisterNPC()

```javascript
// test/npc-manager-unregister.test.js

describe('NPCManager.unregisterNPC', () => {
  let manager, mockDispatcher;
  
  beforeEach(() => {
    mockDispatcher = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
    manager = new NPCManager(mockDispatcher);
  });
  
  // Test 1: Remove NPC from registry
  test('unregisterNPC - removes NPC from npcs map', () => {
    manager.npcs.set('npc1', { id: 'npc1', displayName: 'NPC1' });
    
    manager.unregisterNPC('npc1');
    
    expect(manager.npcs.has('npc1')).toBe(false);
  });
  
  // Test 2: Warn on non-existent NPC
  test('unregisterNPC - warns if NPC not found', () => {
    const warn = jest.spyOn(console, 'warn');
    
    manager.unregisterNPC('nonexistent');
    
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    warn.mockRestore();
  });
  
  // Test 3: Clean up event listeners
  test('unregisterNPC - removes event listeners', () => {
    manager.npcs.set('npc1', { id: 'npc1' });
    manager.eventListeners.set('npc1', [
      { event: 'item_picked_up', callback: () => {} },
      { event: 'door_unlocked', callback: () => {} }
    ]);
    
    manager.unregisterNPC('npc1');
    
    expect(mockDispatcher.off).toHaveBeenCalledTimes(2);
    expect(manager.eventListeners.has('npc1')).toBe(false);
  });
  
  // Test 4: Clear conversation state
  test('unregisterNPC - clears conversation state', () => {
    manager.npcs.set('npc1', { id: 'npc1' });
    manager.conversationHistory.set('npc1', [
      { type: 'npc', text: 'Hello' }
    ]);
    
    manager.unregisterNPC('npc1');
    
    expect(manager.conversationHistory.get('npc1')).toBeUndefined();
  });
});
```

---

### Integration Tests: Room Loading

```javascript
// test/room-loading-integration.test.js

describe('Room Loading Integration', () => {
  let game, scene, lazyLoader, npcManager;
  
  beforeEach(() => {
    // Set up minimal Phaser scene
    scene = {
      add: { sprite: jest.fn() },
      physics: { add: { existing: jest.fn() } },
      anims: { exists: jest.fn(() => true), create: jest.fn() },
      textures: { exists: jest.fn(() => true) }
    };
    
    game = { scene };
    npcManager = new NPCManager({});
    lazyLoader = new NPCLazyLoader(npcManager, {});
    
    window.npcLazyLoader = lazyLoader;
    window.npcManager = npcManager;
  });
  
  // Test: Full room load with NPCs
  test('loadRoom triggers NPC lazy-loading', async () => {
    const roomData = {
      npcs: [
        {
          id: 'clerk',
          npcType: 'person',
          position: { x: 5, y: 3 },
          spriteSheet: 'hacker'
        }
      ]
    };
    
    await lazyLoader.loadNPCsForRoom('reception', roomData);
    
    expect(npcManager.npcs.get('clerk')).toBeDefined();
    expect(lazyLoader.loadedRooms.has('reception')).toBe(true);
  });
});
```

---

### Manual Testing: Phase 1

**Test Case 1.1**: Backward Compatibility
- [ ] Load `ceo_exfil.json` (old format with root NPCs)
- [ ] Game initializes without errors
- [ ] NPCs appear in rooms correctly
- [ ] No console errors related to NPC loading

**Test Case 1.2**: Lazy Loader Initialization
- [ ] `window.npcLazyLoader` exists after game init
- [ ] Has methods: `loadNPCsForRoom`, `unloadNPCsForRoom`
- [ ] `getLoadedRooms()` returns empty set initially

**Test Case 1.3**: Memory Allocation
- [ ] Browser memory before game start: ~X MB
- [ ] Browser memory after room 1 load: ~X+Y MB (Y = room NPCs)
- [ ] Browser memory after room 2 load: ~X+Z MB (stable, not accumulating)

**Test Case 1.4**: Console Output
- [ ] No warnings or errors on startup
- [ ] See "✅ NPC lazy loader initialized"
- [ ] When entering room: "✅ Lazy-loaded NPC: npc_id → room_id"

---

## Phase 2: Scenario Migration Testing

### Format Validation Tests

```bash
#!/bin/bash
# test/validate_scenarios.sh

for scenario in scenarios/*.json; do
  echo "Validating $scenario..."
  
  # Test 1: Valid JSON
  if ! python3 -m json.tool "$scenario" > /dev/null 2>&1; then
    echo "  ❌ Invalid JSON"
    exit 1
  fi
  
  # Test 2: Required fields
  npcs=$(python3 -c "import json; print('npcs' in json.load(open('$scenario')))")
  rooms=$(python3 -c "import json; print('rooms' in json.load(open('$scenario')))")
  
  if [ "$npcs" != "True" ] || [ "$rooms" != "True" ]; then
    echo "  ❌ Missing required fields"
    exit 1
  fi
  
  # Test 3: No person NPCs at root
  has_person=$(python3 << 'EOF'
import json
with open("$scenario") as f:
  s = json.load(f)
  for npc in s.get("npcs", []):
    if npc.get("npcType") == "person" or "spriteSheet" in npc:
      print("True")
      exit()
  print("False")
EOF
)
  
  if [ "$has_person" == "True" ]; then
    echo "  ⚠️  Still has person NPCs at root (should migrate)"
  else
    echo "  ✅ Structure valid"
  fi
done
```

### Manual Testing: Phase 2

**Test Case 2.1**: Migrate npc-sprite-test2.json
- [ ] Create backup of original
- [ ] Run migration script
- [ ] Validate resulting JSON
- [ ] Load in game
- [ ] Verify both NPCs appear in test_room

**Test Case 2.2**: Migrate ceo_exfil.json
- [ ] List all NPCs (see which are person vs phone)
- [ ] Move person NPCs to appropriate room.npcs arrays
- [ ] Keep phone NPCs at root
- [ ] Validate JSON
- [ ] Load in game
- [ ] Test flow: reception → office1 → office2 → ceo
- [ ] Verify each room has correct NPCs

**Test Case 2.3**: Backward Compatibility During Migration
- [ ] Mix old and new format scenarios
- [ ] Load old format scenario → works
- [ ] Load new format scenario → works
- [ ] No errors in either case

---

## Phase 3: Lifecycle Testing

### Event Lifecycle Tests

```javascript
// test/npc-lifecycle.test.js

describe('NPC Event Lifecycle', () => {
  // Test: Events fire only after room load
  test('event listeners activate after loadNPCsForRoom', async () => {
    const eventListener = jest.fn();
    const npcManager = new NPCManager({});
    const lazyLoader = new NPCLazyLoader(npcManager, {});
    
    const npcDef = {
      id: 'helper',
      eventMappings: [
        { eventPattern: 'item_picked_up:lockpick', targetKnot: 'on_pickup' }
      ]
    };
    
    // Before loading: listener not registered
    expect(eventListener).not.toHaveBeenCalled();
    
    // After loading: listener registered
    await lazyLoader.loadNPCsForRoom('room1', { npcs: [npcDef] });
    
    // Trigger event
    npcManager.eventDispatcher.emit('item_picked_up:lockpick', {});
    
    // Listener should fire
    expect(eventListener).toHaveBeenCalled();
  });
  
  // Test: Timed messages work with lazy-loading
  test('timed messages fire at correct time', (done) => {
    const npcManager = new NPCManager({});
    const lazyLoader = new NPCLazyLoader(npcManager, {});
    
    const npcDef = {
      id: 'contact',
      timedMessages: [
        { delay: 100, message: 'Hello!' }
      ]
    };
    
    const start = Date.now();
    
    lazyLoader.loadNPCsForRoom('room1', { npcs: [npcDef] });
    
    // Wait for timed message
    setTimeout(() => {
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
      done();
    }, 150);
  });
});
```

### Manual Testing: Phase 3

**Test Case 3.1**: Timed Messages After Room Load
- [ ] Load game (phone NPCs get timed messages)
- [ ] Check 5s later: message appears
- [ ] Load new room with person NPCs that have timed messages
- [ ] Check message appears correctly after room load

**Test Case 3.2**: Event Triggers After Room Load
- [ ] Person NPC in room1 has event mapping: `minigame_completed` → some knot
- [ ] Load room1, complete minigame
- [ ] Verify NPC reacts with correct dialogue
- [ ] Leave room1, return to room1
- [ ] NPC should still respond to events

**Test Case 3.3**: Ink Story Continuation
- [ ] Start conversation with NPC
- [ ] Save state (manually noted)
- [ ] Leave room (NPC unloaded)
- [ ] Re-enter room
- [ ] Continue conversation
- [ ] Verify conversation history maintained

---

## Phase 4: Server Integration Testing

### Mock Server Tests

```javascript
// test/mock-server.test.js

describe('Mock Game Server', () => {
  let mockServer;
  
  beforeEach(() => {
    mockServer = new MockGameServer();
  });
  
  // Test: Get room with NPCs
  test('getRoomData returns room with NPCs', async () => {
    const room = await mockServer.getRoomData('ceo_exfil', 'reception');
    
    expect(room.id).toBe('reception');
    expect(room.npcs).toBeDefined();
    expect(Array.isArray(room.npcs)).toBe(true);
  });
  
  // Test: Lazy load Ink story
  test('getInkStory fetches story on demand', async () => {
    const story1 = await mockServer.getInkStory('scenarios/ink/clerk.json');
    const story2 = await mockServer.getInkStory('scenarios/ink/clerk.json');
    
    expect(story1).toBe(story2); // Cached
  });
});
```

### Manual Testing: Phase 4

**Test Case 4.1**: Mock Server Room Fetching
- [ ] Enable mock server mode
- [ ] Load game
- [ ] Enter new room
- [ ] Mock server `/room/{roomId}` called
- [ ] Room data received and rendered

**Test Case 4.2**: Dynamic NPC Spawning
- [ ] Complete objective
- [ ] Server returns "add NPC to room X"
- [ ] Re-enter room X
- [ ] New NPC appears

**Test Case 4.3**: Asset Preloading
- [ ] Mock server provides NPC with unknown `spriteSheet`
- [ ] Client preloads sprite sheet
- [ ] Sprite created successfully
- [ ] No "sprite sheet not found" errors

---

## Performance Testing

### Metrics to Track

| Metric | Baseline | Target | Phase |
|--------|----------|--------|-------|
| Game init time | <2s | <1s | 1 |
| First room load | ~200ms | ~150ms | 1 |
| NPC spawn time | ~50ms | ~50ms | 1 |
| Memory per NPC | ~5KB | <5KB | 1 |
| Memory growth (10 rooms) | +50MB | +30MB | 2 |

### Performance Test Plan

```javascript
// test/performance.test.js

describe('Performance Benchmarks', () => {
  // Measure game initialization time
  test('game init completes within budget', async () => {
    const start = performance.now();
    await initializeGame();
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(1000); // < 1 second
  });
  
  // Measure room load time
  test('room load completes within budget', async () => {
    const start = performance.now();
    await loadRoom('reception');
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(200); // < 200ms
  });
  
  // Measure NPC creation time (with sprites)
  test('NPC sprite creation', async () => {
    const npcs = generateTestNPCs(10);
    const start = performance.now();
    
    npcs.forEach(npc => {
      createNPCSprite(scene, npc, roomData);
    });
    
    const elapsed = performance.now() - start;
    const avgPerNPC = elapsed / 10;
    
    expect(avgPerNPC).toBeLessThan(50); // < 50ms per NPC
  });
});
```

---

## Browser Compatibility Testing

### Tested Browsers

- [ ] Chrome 120+ (Windows, Mac, Linux)
- [ ] Firefox 121+ (Windows, Mac, Linux)
- [ ] Safari 17+ (Mac, iOS)
- [ ] Edge 120+ (Windows)

### Test Cases

**Test Case B.1**: Fetch API
- [ ] Ink story files load via fetch
- [ ] No "blocked by CORS" errors
- [ ] Retry on network error works

**Test Case B.2**: LocalStorage
- [ ] Game state saved to localStorage
- [ ] State persists across page reloads
- [ ] No quota exceeded errors

**Test Case B.3**: WebWorkers (Future)
- [ ] Pathfinding in worker thread
- [ ] NPC AI calculations
- [ ] No UI blocking

---

## Regression Testing

### Old Scenarios (Must Still Work)

- [ ] `scenario1.json` - Loads, plays to completion
- [ ] `scenario2.json` - No "NPC not found" errors
- [ ] `scenario3.json` - All minigames functional
- [ ] `biometric_breach.json` - Biometric scanning works

### Critical Flows

- [ ] Game initialization → room load → NPC interaction → dialogue
- [ ] Inventory → item pickup → event trigger → NPC response
- [ ] Phone → NPC message → timed message delivery
- [ ] Door lock → unlock via key/password → room accessible
- [ ] Minigame → completion → event fired → NPC reaction

---

## Testing Checklist Template

```markdown
## Phase X Testing Sign-Off

**Date**: ___________
**Tester**: ___________

### Unit Tests
- [ ] All new functions have unit tests
- [ ] Coverage > 90%
- [ ] All tests passing

### Integration Tests
- [ ] Room + NPC lazy-loading works
- [ ] Event lifecycle correct
- [ ] No memory leaks

### Manual Testing (on real scenarios)
- [ ] Test Case X.1: ✅ / ❌ / ⏭️
- [ ] Test Case X.2: ✅ / ❌ / ⏭️
- [ ] Test Case X.3: ✅ / ❌ / ⏭️

### Performance
- [ ] Frame rate maintained (60 FPS)
- [ ] Memory usage within budget
- [ ] No stuttering during room transitions

### Regression
- [ ] Old scenarios still work
- [ ] No new console errors
- [ ] Critical flows verified

### Browser Compatibility
- [ ] Chrome: ✅ / ❌
- [ ] Firefox: ✅ / ❌
- [ ] Safari: ✅ / ❌

**Overall Status**: ✅ PASS / ❌ FAIL / ⚠️ CONDITIONAL

**Issues Found**:
1. ...
2. ...

**Sign-Off**: ___________
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: NPC Lazy-Loading Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm install
      
      - name: Unit tests
        run: npm test -- --coverage
      
      - name: Lint
        run: npm run lint
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: Scenario validation
        run: python3 scripts/validate_scenarios.sh
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Test Automation Priorities

### Priority 1 (Must Have)
- Unit tests for NPCLazyLoader
- Scenario JSON validation
- Manual game flow tests
- Browser compatibility (Chrome, Firefox)

### Priority 2 (Should Have)
- Integration tests with Phaser
- Performance benchmarks
- Regression test suite
- Safari testing

### Priority 3 (Nice to Have)
- E2E tests with Playwright
- Visual regression testing
- Load testing (concurrent games)
- Automated accessibility tests

---

## Known Issues Tracking

```markdown
| Issue | Phase | Status | Notes |
|-------|-------|--------|-------|
| NPC sprites z-order wrong | 1 | Open | Verify depth calculation |
| Ink story cache not clearing | 2 | Fixed | Added clearCaches() |
| Phone NPC messages timing off | 3 | Blocked | Depends on game start time |
| Memory spike on room load | 1 | Investigating | Asset preloading issue? |
```

---

## Post-Launch Monitoring

After each phase deployment:

1. Monitor error logs for new NPC-related errors
2. Track performance metrics (frame rate, load times)
3. Gather player feedback on NPC interactions
4. Identify edge cases not covered by testing
5. Plan hotfixes for any critical issues

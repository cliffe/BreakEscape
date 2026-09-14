# Room State Sync System

## Overview

The Room State Sync system tracks dynamic changes to rooms during gameplay, ensuring that state persists across page reloads and sessions. This prevents the "feels like starting over" problem when resuming a game.

## Architecture

### Server-Side (Delta Overlay Pattern)

**Storage:** `player_state['room_states']` JSONB column stores deltas on top of `scenario_data`

```ruby
player_state['room_states'] = {
  'office1' => {
    'objects_added' => [     # Items dropped by NPCs, spawned dynamically
      { 'id' => 'dropped_key_001', 'type' => 'key', 'name' => 'Office Key', ... }
    ],
    'objects_removed' => ['office1_desk_0'],  # Items taken by player
    'object_states' => {     # State changes for existing objects
      'office1_cabinet_0' => { 'opened' => true }
    },
    'npcs_removed' => ['agent_handler'],  # NPCs that left the room
    'npcs_added' => [        # NPCs that moved into the room
      { 'id' => 'agent_handler', 'roomId' => 'office1', ... }
    ]
  }
}
```

**Merge Logic:** When loading a room, server:
1. Starts with `scenario_data['rooms'][room_id]` (static template)
2. Applies `player_state['room_states'][room_id]` delta
3. Returns merged result to client

**Validation:** All changes are validated server-side:
- Items can only be added if source (NPC) has them
- Objects can only be removed if they exist in the room
- NPCs can only move to connected rooms (or phone-type NPCs)
- Prevents client from spawning arbitrary items

### Client-Side (Sync API)

**Module:** `public/break_escape/js/systems/room-state-sync.js`

**Global API:** `window.RoomStateSync`

## Usage Examples

### 1. NPC Drops an Item

```javascript
// In NPC interaction handler or Ink script result
const item = {
    id: 'office_key_dropped',
    type: 'key',
    name: 'Office Key',
    scenarioData: {
        opens_lock: 'office_key',
        takeable: true
    },
    x: npc.x + 50,  // Position near NPC
    y: npc.y
};

await window.RoomStateSync.addItemToRoom(
    'office1',
    item,
    { npcId: 'agent_handler', sourceType: 'npc_drop' }
);

// Item is now persisted on server and will appear on reload
```

### 2. Player Picks Up an Item

```javascript
// In inventory system when item is collected
const itemId = 'office1_table_key_0';
const currentRoom = window.currentPlayerRoom;

await window.RoomStateSync.removeItemFromRoom(currentRoom, itemId);

// Item removed from room permanently (won't reappear on reload)
```

### 3. Container State Change

```javascript
// When container is unlocked/opened
await window.RoomStateSync.updateObjectState(
    'office1',
    'office1_cabinet_0',
    { opened: true, locked: false }
);

// Container will remain open on reload
```

### 4. NPC Moves Between Rooms

```javascript
// When NPC walks through a door or teleports
await window.RoomStateSync.moveNpcToRoom(
    'agent_handler',
    'safehouse_main',
    'safehouse_bedroom'
);

// NPC will appear in new room on reload, not spawn room
```

### 5. Batch Updates

```javascript
// For efficiency when multiple changes happen together
await window.RoomStateSync.batchUpdateRoomState([
    { type: 'add_item', roomId: 'office1', item: keyItem, options: { npcId: 'handler' } },
    { type: 'remove_item', roomId: 'office1', itemId: 'office1_desk_0' },
    { type: 'update_object', roomId: 'office1', objectId: 'safe', stateChanges: { opened: true } }
]);
```

## Integration Points

### Inventory System

**When collecting items:**
```javascript
// In systems/inventory.js
if (item.scenarioData?.takeable) {
    await window.RoomStateSync.removeItemFromRoom(
        window.currentPlayerRoom,
        item.getAttribute('data-id')
    );
}
```

### NPC Item Giving

**When NPC gives item to player:**
```javascript
// In minigames/person-chat/person-chat-conversation.js
// After item is added to player inventory, optionally track NPC's inventory change
// (if you want to prevent NPC from giving the same item twice)
```

### Container Minigame

**When container is unlocked:**
```javascript
// In minigames/container/container-minigame.js
if (unlocked) {
    await window.RoomStateSync.updateObjectState(
        roomId,
        containerId,
        { opened: true, locked: false }
    );
}
```

### NPC Movement System

**When NPC changes rooms:**
```javascript
// In systems/npc-behavior.js or via Ink script commands
await window.RoomStateSync.moveNpcToRoom(
    npcId,
    oldRoomId,
    newRoomId
);
```

## Server Validation Logic

### `add_item_to_room!`
- Validates item has required fields (type, etc.)
- Checks NPC source exists in the room (if specified)
- Generates unique ID if not provided
- Adds to `room_states[room_id]['objects_added']`

### `remove_item_from_room!`
- Validates item exists in room (scenario or added)
- Removes from `objects_added` if dynamically added
- Otherwise adds to `objects_removed` list
- Returns false if item not found

### `update_object_state!`
- Validates object exists in room
- Merges state changes into `object_states[object_id]`
- Preserves existing state properties

### `move_npc_to_room!`
- Validates rooms are connected OR NPC is phone-type
- Adds NPC ID to source room's `npcs_removed`
- Adds full NPC data to target room's `npcs_added`
- Returns false if rooms not connected (for sprite NPCs)

## Benefits

✅ **Items dropped by NPCs persist** - Key remains on floor after NPC drops it  
✅ **Containers stay opened** - No need to re-unlock after reload  
✅ **NPCs remember positions** - Don't teleport back to spawn points  
✅ **Collected items stay gone** - Room doesn't refill after reload  
✅ **Validated server-side** - Client cannot spawn arbitrary items  
✅ **Minimal storage** - Delta approach only stores changes  
✅ **No migration needed** - Uses existing JSONB column  

## Testing

### Manual Testing

1. Start a game, enter a room
2. Have an NPC drop an item via Ink script
3. Reload the page
4. Item should still be on the ground

### Server Validation Testing

Try to exploit the system (should all fail):
- Send `add_object` with invalid item data → 400 Bad Request
- Send `remove_object` for item not in room → 422 Unprocessable Entity
- Send `move_npc` for non-connected rooms → 422 Unprocessable Entity
- Send `update_room` for locked room → 403 Forbidden

### Example Test Scenario

```javascript
// In browser console after game loads:

// 1. Add item (should succeed)
await window.RoomStateSync.addItemToRoom('office1', {
    type: 'key',
    name: 'Test Key',
    id: 'test_key_001'
});

// 2. Reload page, check room data
await window.loadRoom('office1');
console.log(window.rooms['office1'].objects);
// Should include test_key_001

// 3. Remove item (should succeed)
await window.RoomStateSync.removeItemFromRoom('office1', 'test_key_001');

// 4. Reload page, check again
// test_key_001 should be gone
```

## Limitations

- **NPC conversation states** not tracked (use NPC manager's conversation history)
- **Temporary visual effects** not persisted (by design - only game state)
- **Player position** not tracked here (use `player_state['currentRoom']` instead)
- **Quest/objective state** tracked separately in `objectivesState`

## Future Enhancements

- Add `undo` capability for accidental room state changes
- Track more granular object properties (rotation, position, etc.)
- Add visual indicators for modified rooms in UI
- Export room state history for debugging

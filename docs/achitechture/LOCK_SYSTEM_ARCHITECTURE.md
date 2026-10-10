# Lock System Architecture

How locks flow from scenario definition to server validation.

## Data Flow

```
scenario.json.erb → Server Bootstrap → Client Game → Unlock Attempt → Server Validation
```

## 1. Scenario Definition

Locks are defined on **rooms** (for doors) or **objects** (for containers):

```json
{
  "room_id": {
    "locked": true,
    "lockType": "pin",
    "requires": "1234"
  }
}
```

## 2. Server Bootstrap Filtering

When game starts, `filtered_scenario_for_bootstrap` sends room metadata to client:

**Kept:** `locked`, `lockType`, `keyPins`, `difficulty`  
**Removed:** `requires` (for pin/password/key - the "answer")  
**Kept:** `requires` (for rfid/biometric/bluetooth - references collectible items)

## 3. Client Lock Check

When player interacts with a locked door/object:

1. `handleUnlock()` gets lock requirements from sprite properties
2. Checks `lockRequirements.locked` - if false, asks server to verify
3. If locked, launches appropriate minigame based on `lockType`

## 4. Server Validation

`validate_unlock(target_type, target_id, attempt, method)`:

| Method | Server Validates |
|--------|------------------|
| `key` | Player holds an item whose `opens_lock` matches the lock's `requires` |
| `lockpick` | Player has lockpick in inventory |
| `pin`/`password` | `attempt` matches room's `requires` |
| `rfid`/`biometric`/`bluetooth` | Trusted (client validated item possession) |
| `npc` | NPC encountered + has unlock permission |
| `unlocked` | Room has `locked: false` in scenario |

## 5. Unlock Success

On success:
1. Server adds room to `player_state['unlockedRooms']`
2. Server returns `roomData` for the connected room
3. Client opens door and loads room

## Security Notes

- PINs/passwords validated server-side only
- Keys validated against server inventory
- `requires` field stripped for exploitable locks
- Already-unlocked rooms bypass validation


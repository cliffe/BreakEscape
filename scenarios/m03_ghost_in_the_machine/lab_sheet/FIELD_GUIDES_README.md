# Mission 3 Field Guides (Ghost in the Machine)

This folder contains source markdown for optional in-game field guides delivered by Agent 0x99.

## Delivery Model
- Guides are optional support content delivered through phone dialogue.
- Delivery is milestone-driven via `eventMappings` in `scenario.json.erb` (using `setGlobal` + `sendTimedMessage`; phone NPCs cannot use `targetKnot` after the first call).
- Guide items are provided through Agent 0x99 `itemsHeld` entries and `#give_item` dialogue tags.
- The player requests a guide via a conditional hub choice in `ink/m03_phone_agent0x99.ink`.

## Current Guides
1. `SAFETYNET_FIELD_GUIDE_Lockpicking.md`
2. `SAFETYNET_FIELD_GUIDE_Network_Exploitation.md`

## Offer Timing (milestone-driven)
| Guide | Offered when (eventMapping) | Hub flag | `#give_item` id |
|-------|-----------------------------|----------|---------------------|
| Lockpicking | `room_entered:executive_wing_hallway` (player at the locked executive office) | `lockpicking_guide_offered` | `m03_lockpicking_field_guide` |
| Network Exploitation | `room_entered:server_room` (player at the VM/drop-site terminal) | `netexploit_guide_offered` | `m03_netexploit_field_guide` |

## Mirror Publishing (HacktivityLabSheets)
Each guide is mirrored to hidden game-fragment pages:
- `/_labs/m03_ghost_in_the_machine/safetynet-field-guide-lockpicking.md`
- `/_labs/m03_ghost_in_the_machine/safetynet-field-guide-network-exploitation.md`

These pages must include:
- `game_fragment: true`
- A stable `permalink`

The `labUrl` values in `scenario.json.erb` point at these published pages, so the mirror must be created/updated when content changes.

## Authoring Rules
- Reminder of objective/context is encouraged.
- Technical workflow should be complete enough for a learner who opts in for help.
- Avoid narrative spoilers, hardcoded mission answers, and explicit answer chains.
- Keep commands generic with placeholders (`[target-ip]`, `[port]`, etc.).
- Keep source and mirrored pages synchronized when updating content.

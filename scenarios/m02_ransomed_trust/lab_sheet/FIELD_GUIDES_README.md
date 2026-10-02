# Mission 2 Field Guides (Ransomed Trust)

This folder contains source markdown for optional in-game field guides delivered by Agent 0x99.

## Delivery Model
- Guides are optional support content delivered through phone dialogue.
- Delivery is milestone-driven via `eventMappings` in `scenario.json.erb`.
- Guide items are provided through Agent 0x99 `itemsHeld` entries and `#give_item` dialogue tags.

## Current Guides
1. `SAFETYNET_FIELD_GUIDE_Lockpicking.md`
2. `SAFETYNET_FIELD_GUIDE_SSH_Access_and_Bruteforce.md`
3. `SAFETYNET_FIELD_GUIDE_Privilege_Escalation.md`
4. `SAFETYNET_FIELD_GUIDE_Reconnaissance_and_Network_Mapping.md`
5. `SAFETYNET_FIELD_GUIDE_Vulnerability_Analysis_and_Attack_Surface.md`
6. `SAFETYNET_FIELD_GUIDE_ProFTPD_Exploitation_Workflow.md`

## Offer Timing (milestone-driven)
| Guide | Offered when (eventMapping) | Hub flag |
|-------|-----------------------------|----------|
| Lockpicking | Opening briefing closes (player faces the first locked offices) | `lockpicking_guide_offered` |
| SSH Access and Bruteforce | `access_server_room` task complete (before the SSH foothold) | `ssh_guide_offered` |
| Privilege Escalation | `submit_ssh_flag` task complete (foothold gained) | `privesc_guide_offered` |
| Reconnaissance and Network Mapping | `access_server_room` task complete | `scanning_guide_offered` |
| Vulnerability Analysis | `submit_ssh_flag` task complete | `vulnerability_guide_offered` |
| ProFTPD Exploitation | `submit_ssh_flag` task complete | `exploitation_guide_offered` |

## Mirror Publishing (HacktivityLabSheets)
Each guide is mirrored to hidden game-fragment pages:
- `/_labs/safetynet/lockpicking.md`
- `/_labs/safetynet/ssh-access-and-bruteforce.md`
- `/_labs/safetynet/privilege-escalation.md`
- `/_labs/safetynet/reconnaissance-and-network-mapping.md`
- `/_labs/safetynet/vulnerability-analysis-and-attack-surface.md`
- `/_labs/safetynet/proftpd-exploitation-workflow.md`

These pages must include:
- `game_fragment: true`
- A stable `permalink`

## Authoring Rules
- Reminder of objective/context is encouraged.
- Technical workflow should be complete enough for a learner who opts in for help.
- Avoid narrative spoilers, hardcoded mission answers, and explicit answer chains.
- Keep commands generic with placeholders (`{TARGET_IP}`, `{PORT}`, etc.).
- Keep source and mirrored pages synchronized when updating content.
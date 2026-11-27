# m06 Follow the Money: office-life baseline

Base: main `3e00651a8` (plan branch `plan/ol-m06`, Stage 0 commit `bcff36bf9`). Campaign mission (m01 to m10), so the skill applies without a special yes. Not m01, so no extra gate playtests.

| Check | Result | File |
|---|---|---|
| Validator | 0 errors. Warnings are pre-existing (music `comment` fields; onceOnly overlap wiring on `agent_0x99_handler`). Info lines 13 to 15 are one acknowledged clue on `cold_storage_console`. | `validator_info_lines.txt` |
| V1 office summary | 11 NPC records, none with needs, groups, habits, chatter or exchanges | `v1_summary_base.txt` |
| V9 lock and key | 13 lock nodes, 0 gates | `baseline_locks.json` |
| Object positions | 39 rows (objects per room, plus `itemsHeld` of Irina, Kemal and HaX) | `positions_base.txt` |
| V6 office lines | 0 office-life clips, 0 uncached | `v6_office_lines_base.txt` |

Scenario settings:

- `gameClock`: not set.
- `npcThoughts`: `false` (`scenario.json.erb:670`), so no thought bubbles or action icons (D77).
- `disableAttacks`: not set, so every NPC can be attacked.
- `officePresets`: not set.
- `creditsOverlay` (`scenario.json.erb:156`): an operation name and a fixed ticker; the schema gives it no conditional lines (`scripts/scenario-schema.json:126` to `:133`).
- Lighting: `defaultMode: "on"`; server room, data centre and Irina's office are motion rooms.
- Walkthrough: `scenarios/m06_follow_the_money/TESTING_WALKTHROUGH.md`.

Time of day: evening. The guard opens with "Evening. Floor's restricted." (`ink/m06_npc_checkpoint_guard.ink:49`), Netherton says "Tonight we chase the money" (`ink/m06_opening_briefing.ink:30`) and Irina speaks of "tonight" (`ink/m06_npc_irina_volkova.ink:352`, `:563`). A crypto exchange trades round the clock, so the floor still has a late desk. The mission's "routine FCA visit" is the player's cover, not a time.

Env for any rake or validator run from this worktree: `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`. The validator rewrites `dungeon_graph.*` in the mission folder; those files are never staged by this pass.

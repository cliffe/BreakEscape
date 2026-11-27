# m08 The Mole: office-life baseline (Stage 0)

Taken on branch `plan/ol-m08`, base main `a5b0c4a96dfdc3529042a4f81c2bb2f44cafa05d`, 2026-11-17. Nothing built.

## Scenario keys at base

| Key | Value |
|---|---|
| `startRoom` | `main_lobby` |
| `gameClock` | absent |
| `disableAttacks` | absent (every person NPC is attackable; each has `behavior.hostile` and a `globalVarOnKO`) |
| `officePresets` | absent (off) |
| `roomTone`, `roomToneTypes` | absent (off) |
| `lighting` | `{ enabled: true, defaultMode: "on", ambient: "#b8bfce" }` (night shift); motion rooms: `server_room`, `security_archives`, `interrogation_room` |
| Room `ambientSound` | none in any of the nine rooms, so the base plays no ambient bed anywhere |
| Rooms | nine, all bespoke `room_hq_*` types (none in the room-tone table's exact-type list) |

## Measurements

| Check | Result | File |
|---|---|---|
| Validator | 0 errors, 4 warnings (two onceOnly overlap warnings on `agent_0x99` and `closing_debrief`; a cutscene without onceOnly at `interrogation_room/npcs[0]/eventMappings[1]`; the acknowledged `suite_code` clue). Info: legacy desk boxes in all nine maps | `validator_info_lines.txt` |
| V1 `--office-summary` | 12 NPC records, none with needs; no affordances, no presets | `v1_summary_base.txt` |
| Lock and key | 8 lock nodes, 0 gates | `baseline_locks.json` |
| V6 office-line clips (`app:break_escape:tts:office_lines[m08_the_mole]`, run from the worktree with `bundle exec rake`, keyless boot warning seen) | `Total: 0 office-life clip(s), 0 uncached (0 characters uncached of 0).` | this file |

## Walkthrough and gate runs

- Latest critical-path evidence: `tools/playtest/m08-pass4-final-report.md` and `tools/playtest/m08-regress-trace.md`.
- m08 is not m01, so no m01, sis01 or sis02 gate replay is needed for this mission's office life.

## Notes for the build

- The worktree's `.bundle/config` sets `BUNDLE_PATH`; there is no `bin/rake`, so the V6 rake runs as `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m08_the_mole]"` from the worktree root.
- The validator rewrites `dungeon_graph.*`; on this base they came out unchanged.

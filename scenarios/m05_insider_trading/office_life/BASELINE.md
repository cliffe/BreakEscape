# m05 Insider Trading: office-life baseline (stage 0)

Taken before any office-life change. Branch `plan/ol-m05`, base main `a5b0c4a96`. The scenario file has not changed on this branch; every line number below is in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named.

## Preconditions

| Item | State |
|---|---|
| Gate scenario (m01, sis01, sis02 replay needed) | No. m05 is not a gate scenario. |
| `gameClock` | Yes, `:634`. Start Wed 16:30, rate 2.5 game minutes per real minute. Anchors: 19:50 on `torres_identified`, 20:xx and 20:14 on the data-centre variants, Thu 09:00 on `debrief_played`. 19:00 comes about 60 real minutes in. The clock emits no events, so acts must turn on globals. |
| `disableAttacks` | Not set. Every room NPC is attackable. |
| `officePresets` | Not set. |
| `roomTone` | Not set. |
| Night lighting | Keyed on `torres_identified`: lobby to night, corridor to motion (`:1695`), server hallway lit (`:1855`). |
| Walkthrough | The mission's QA walkthrough (`scenarios/m05_insider_trading/`); the build will re-run its critical path. |
| TTS barks batch | `build/tts-barks` is on main (commit `1164500ce`), so V6 counts barks. |
| Env for rake and the validator from this worktree | `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle` |

## Validator

0 errors (0 known), 22 warnings: 6 unknown `comment` fields on music events, credits suggestions, onRead "received not read" suggestions on Patricia's vetting files, and missing `showProgress` on collect tasks. One info line (`validator_info_lines.txt`): desk boxes are legacy in all 10 maps. Running the validator rewrites `dungeon_graph.*`; the output was byte-identical, so git stayed clean.

## Office-life summary (V1)

`v1_summary_base.txt`: 12 NPC records, none with needs, groups, avoids, habits, chatter, exchanges or calls.

## Voice lines (V6)

`v6_office_lines_base.txt`: 0 office-life clips. The cache holds 725 `.mp3` clips in `tts_cache/m05_insider_trading/`.

## Aim chain

From the dungeon graph, 4 hops:

1. Get Inside Quantum Dynamics (`establish_access`)
2. Work Out Who Has Been in the Servers (`investigate_employees`; Owen required, Lisa and Halloran optional)
3. Prove the Exfiltration on the Server (`gather_evidence`, unlocked by `torres_suspected` at `:436`, and `exploit_infrastructure`: `server_room_entered`, VM flags `flag1_submitted` to `flag4_submitted`)
4. Decide the Insider's Fate (`confront_insider`, which needs the four flag tasks)

## Lock and key baseline

`baseline_locks.json`: 8 lock nodes, 0 gates. The build's diff against this file must be empty.

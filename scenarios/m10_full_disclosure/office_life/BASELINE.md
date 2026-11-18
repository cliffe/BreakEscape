# m10 Full Disclosure: office-life baseline (Stage 0)

| Item | Value |
|---|---|
| Mission | `m10_full_disclosure`, campaign mission (m01 to m10): no extra sign-off needed. Not m01, so no gate replay of m01, sis01 and sis02 |
| Base commit | main `3e00651a85b515f1c24e32e229a904b9ab759e2f` (branch `plan/ol-m10`) |
| Walkthrough | `scenarios/m10_full_disclosure/WALKTHROUGH_R1.md` |
| `gameClock` | start 01:45, rate 0.5, anchors on `raid_clock` (`t0200` to `t0600`) and `ending !== ''` (05:55) |
| `disableAttacks` | unset: every NPC can be attacked |
| `npcThoughts` | `false` (D77) |
| `officePresets` | unset |
| `roomTone` / `roomToneTypes` | unset |
| Start room | `forward_post` (outdoor yard at night, 20 by 10 tiles, one exit east to `blast_tunnel`) |

## Files

| File | What it holds |
|---|---|
| `validator_info_lines.txt` | the validator's info lines: none for m10. Result 0 errors, 64 warnings, all existing (cutscene `onceOnly`, imported-global `setVisible` conditions, two `agent_0x99` mapping overlaps) |
| `v1_summary_base.txt` | V1 office summary, 75 NPC records, none with needs, chatter or exchanges |
| `baseline_locks.json` | V9 lock and key baseline: 12 lock nodes, 0 gates |
| `positions_base.txt` | object position baseline, 76 rows (declared objects, container items, `itemsHeld`), from `references/measurement-recipes.md` section 9 |

## Not run

- **V6 (`app:break_escape:tts:office_lines[m10_full_disclosure]`)** was not run: it needs the Rails environment and database, and the plan phase runs no servers or Rails tasks. m10 has no office-life lines yet, so the office-life count is 0 by construction; the build runs V6 before slice 5 for the cached-clip count.

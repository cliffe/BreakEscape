# m01 final3: launch-device id fix confirmation

Flags session-supplied (earned "no"); IT PIN 2468 used directly; Derek KO'd with `debugKO` after the archive (combat not played). Both games passed `verify-run.rb` (exit 0).

- Game 1214 (KO, reload before pickup): `tools/playtest/m01-final3-session.jsonl` (378 lines). status=completed, mission_concluded_at 2026-10-01 07:50:32 UTC.
- Game 1215 (no reload): `tools/playtest/m01-final3-nore-session.jsonl` (196 lines). status=completed, mission_concluded_at 07:51:50 UTC.

| Check | 1214 | 1215 |
| --- | --- | --- |
| Device on floor after KO | id `entropy_launch_device` at -152,-159; server `objects_added` holds full definition (mode launch-abort, position 5.25,3.03125) | same id, same position |
| Position stable after reload before pickup | PASS: same id, same -152,-159 | n/a |
| Pickup opens launch UI | PASS ("ENTER LAUNCH AUTHORIZATION CODE") | PASS |
| `<flag:3>` accepted, ABORT/EXECUTE shown | PASS ("Flag accepted", ABORT OPERATION, EXECUTE LAUNCH) | PASS |
| ABORT: "OPERATION ABORTED", close_the_case completed, status=completed | PASS | PASS |
| Debrief then credits | PASS: no "End Conversation" control seen, then creditsShowing true, closable false | not run |
| Device does not reappear after reload once picked up | not re-run (final2 passed it) | PASS: reload after abort, break room `room` lists only the hidden derek_lawson, device in inventory once |

Result: final2 failure (flag 3 "Incorrect flag") is fixed. No regression observed.

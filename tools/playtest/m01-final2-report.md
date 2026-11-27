# m01 final2: launch-device persistence confirmation (game 1212)

Log: tools/playtest/m01-final2-session.jsonl. Route: Sarah, IT PIN 2468 (used directly), Kevin, server room, flags 2/4/1 (session-supplied, "no" for earned), archive, break room, `debugKO` Derek. Combat not played.

| Check | Result | Evidence |
| --- | --- | --- |
| Device position noted after KO | -152,-159 (room-relative 5.25,3.03125), id `dropped_derek_lawson_0_1790840393018` | `room` output; `room_states.break_room.objects_added` holds the full definition (mode launch-abort, onAbort, onLaunch, flags, flagRewards, acceptsVms) |
| Same place after reload before pickup | PASS | after reload, `room` lists the same id at -152,-159 |
| Pickup after reload gives working launch UI | PASS | opens "OPERATION SHATTER - ENTER LAUNCH AUTHORIZATION CODE" (not the generic station) |
| Picked-up device does not reappear after a further reload | PASS | second reload: break room `room` lists only the hidden `derek_lawson`; device is in inventory once; `objects_removed` has the dropped id |
| flag 3 -> ABORT -> completed | **FAIL** | `<flag:3>` returns "Incorrect flag" (twice). `launch_code_submitted` and `ready_for_debrief` false, no ABORT/EXECUTE, status in_progress. Debrief and credits not reached. |

Likely cause (suspect, not classified): the picked-up item keeps the id `dropped_derek_lawson_0_1790840393018` (server inventory entry id), while `submit_flag` checks that the submitting station id owns the flag (`find_flag_station_for_flag`, owner is `entropy_launch_device`). The server inventory entry also has `flagCount:1` rather than `flags`. Before this fix the persisted item had id `entropy_launch_device` and flag 3 was accepted in-session. I did not test a no-reload pickup with this build, so I cannot say reload is required; the id mismatch is the evidence.

verify-run.rb: exit 0 (progress recorded), status=in_progress.

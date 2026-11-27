# Review M7 round 1 outcomes (m03)

Fixer: Sonnet, 2026-11-12. Verdict was accept with fixes (0 B, 1 M, 2 m, 3 n).

- **M1 fixed.** `revelation_ring_offered` is declared in `globalVariables`. Both ring mappings set it with `setGlobal` (it runs at offer time) and both conditions check `!globalVars.revelation_ring_offered`. Log note 3 corrected.
- **m1 fixed.** Lab sheet line 87 now reads "and the phone rings her". The VM companion was not opened. The HacktivityLabSheets change is uncommitted there.
- **m2.** Cross-mission (m01 bracket form); left to the M8 follow-up, as the orchestrator logged.
- **n1.** No action (reviewer confirmed the test is not flaky).
- **n2 fixed.** `proofs/M7/dbg/` removed with `git rm -r`. It held a scratch run (game id, session and /tts logs), referenced nowhere.
- **n3 fixed.** `tasks()` output is now filtered by id for the "task now" and "after Not yet" lines in `m07_live.sh`. Not re-run: the bring-in cases were not part of this round.
- Added the `decline_reload` route case.

## Live proof (keyless :3029, headless, `proofs/M7_r1/`)

1. `decline_reload`: ring at 121 s, Decline, one "Missed call" row. After a reload `revelation_ring_offered` is true, no ring and no banner 150 s later, still one Missed call row. The header shows "Call back" and it opens on "Knew you'd get back to me."
2. `reload_ring`: reload 20 s after the flag, the flag is true and the offer latch false, she rings once 134 s after the load, Answer plays the plain opener.
3. `call_button`: header Call button first, the call runs to its end, `revelation_heard` true, no ring 125 s later.

Validators exit 0 (the validator rewrote m03 `dungeon_graph.*`, left uncommitted). `tts_mission_lines_test.rb`: 5 runs, 0 failures. Key diff untouched (+22/-0: no ink change).

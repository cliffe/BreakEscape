# Review R2 (M2, M3, M9): outcomes

Fixed the two minors and the nit. 2026-11-12.

## m1 (M3, m09): reopen after a mid-read-out close skips the rest

`scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.ink`: `flag1_read` and `ledger_read` now use the review's two-level guard.

- New ink-local `flag1_read_done` and `ledger_read_done` (set before the last choice). Done goes to `support_hub`. Started but not done (`flag1_read_heard`, or `ledger_read_here or ledger_read_heard`) goes to a new `= ask` stitch that holds the first choice block and the lines after it.
- Guard order and `hax_voiced_scene_pending()` are untouched. No spoken or text words changed, routing only. The optional `more` stitch for the ledger was not added: a close at `[What else is on the entry?]` re-asks the first choices, as it did before R1.
- Other read-outs: afterwards has no mid-knot choice and hour_read has the forced re-ring (review table), so neither needed it.
- Recompiled `m09_phone_agent0x99.json` with inklecate, no errors.

Live proof, :3023 keyless, `tools/phone_calls/routes/m09_m3_r2_reopen.sh`, output in `proofs/M3R2/` (`output.txt`, screenshots looked at):
- flag 1: closed at the first choice, waited 22 s, `ledger_guide_offered=true`. Reopen shows the three choices (`r2_flag1_2_reopen_choices.png`, with the field-guide text now in the thread). Answering plays the rest including the Tomb Beta line once (one "Tomb Beta" in the thread), one salvage note. Reopening again shows the hub (`r2_flag1_4_reopen_hub.png`).
- ledger: closed at the first choice, `stacks_entered` set, reopen shows `TF Null` / `Who is WREN?` (`r2_ledger_2_reopen_choices.png`). Finishing plays the recap and the file number line once; the next reopen is the hub (`r2_ledger_4_reopen_hub.png`).
- The script's mid-run "finished" thread dump errored because the phone had already closed (fixed with `.get`); the hub screenshots show the finished threads.

## m2 (M9, sis03): text threads asked the player to call

`scenarios/sis03_cyber_insurance/scenario.json.erb`: `:119` "message him once you have read the NCSC brief"; `:676` "Message him on the claims phone for what the NCSC knows..."; `:788` "Message me about the contested items:...". HacktivityLabSheets `_labs/security_informed_safety/sis03_cyber_insurance.md:104`: "and message three people on the claims phone:".

## n1

`scenarios/m09_digital_archaeology/scenario.json.erb:141` comment: the latch is set when the mapping fires (the text is then scheduled).

## Checks

- dialoguelint m09: not-x-but-y=5, you-after-choice=1, the same as the review, none on changed lines.
- Validator (`--skip-ink --no-graph --no-lint`): m09 0 errors; sis03 only the 4 existing `minigameData` errors.
- `tts_mission_lines_test.rb` under the flock: 5 runs, 44 assertions, 0 failures (against the tree with the other agent's uncommitted extractor edit).
- `dump_tts_keys.rb` before and after: identical for all scenarios, so the m09 and sis03 key dumps did not move.

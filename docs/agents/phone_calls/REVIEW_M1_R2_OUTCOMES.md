# Review M1 R2 outcomes (m09 Nightshade ring order, m2 file line)

Fixer: Opus, 2026-11-12, on `build/phone-calls` (worktree `p-phone-calls`). Keyless server :3025, custom pidfile, stopped afterwards. Only m09 files, the M1 route, `proofs/M1_r2/`, this file, `HANDOVER_M1_R2.md` and the log changed.

## What changed

**M1 (major) — the stacks fallback rang Nightshade before HaX's read-out on the direct path.** Fixed.
`scenario.json.erb` now has three Nightshade call mappings, all latching `nightshade_rang` at offer time and checking `!nightshade_rang`, so he rings once:
1. `conversation_closed:agent_0x99` with `globalVars.flag1_read_done && m08_nightshade_triple_agent`, delay 3000 — the primary ring, after the read-out's card line (see m1).
2. `door_unlock_attempt` with `data.connectedRoom === 'restricted_cage' && flag1_submitted && m08_nightshade_triple_agent`, delay 3000 — the fallback, moved off `room_entered:restricted_stacks` to the first try at the cage gate, where his "crack the keys first" advice lands. The drop terminal is one room south of the stacks, so the old fallback rang before the read-out; the cage gate is a room further on, after the read-out has had its chance.
3. `room_entered` (any room) with `flag1_read_heard && m08_nightshade_triple_agent`, delay 3000 — the reload backstop, for a reload between the read-out closing and the 3 s ring (the close mapping's timer dies with the page). The pending offers re-check `!nightshade_rang` at fire time.
The `_comment` at the old `:956` and the ink header were rewritten.

**m1 (minor) — "heard" was set on the read-out's first line, so an early close rang before the card line.** Fixed.
`m09_phone_agent0x99.ink` now sets `#set_global:flag1_read_done:true` beside `~ flag1_read_done = true` (after the card line "Her card's on a reel at her hip" and the Tomb Beta line). The primary ring (mapping 1) keys on `flag1_read_done`, not `flag1_read_heard`. A player who closes at the first choice (done still false) gets no immediate ring; the `room_entered` backstop then catches them on the next room move. New default `flag1_read_done: false` added.

**m2 (minor) — the file-held line didn't fit what the player holds.** Rewritten.
`m09_phone_nightshade.ink:33` (`nightshade_file_held` arm):
- Before: `You have his file in your hand already. Then you know what she buried. Don't let her keep the rest.`
- After: `So you've found my file. Read the hand on it, not the boy. She's still feeding the shredder.`
It is his own 2011 assessment ("my file", not "his file"), names no assessor, points at the match-the-hand task ("the hand ... not the boy", the 23-year-old candidate) and at what is still burning (Sorensen feeding the Series R shredder). 16 words, no variables, no stage directions. The cage arm is unchanged.

**Nits.** n3: the R2 route now drives the real path (walk from the drop terminal, submit the catalogue flag at the terminal, walk through the stacks); no flag is set by hand. n1 (the `set:` keyword is set at offer, not on answer) and n2 (HaX's Tran text and Nightshade's close ring can land in the same second for the `m01_maya_ko`/`tran_outcome==='left'` branch) are left as-is and recorded in the log for the plan's 3.1 note; n2 is a narrow cross-mission branch the review marked "or leave it".

## Checks

- Compile: all m09 ink compiles; only `m09_phone_agent0x99.json` (set_global tag) and `m09_phone_nightshade.json` (m2 line) changed.
- dialoguelint (m09): no new finding; the new file-held line is 16 words (phone cap 25). Totals unchanged from R1 (not-x-but-y=5, you-after-choice=1, all pre-existing).
- Validator (`--no-graph`): 0 errors, 24 issues — the same set as the R2 review baseline. No new warning for `flag1_read_done`/`nightshade_rang`.
- `tts_mission_lines_test.rb`: 5 runs, 0 failures (no m09 line flagged).
- Key diff (m09, labelled dump, current tree): count stays 411. The m2 file-held line re-keys: `db6c420b…` (old text) removed, `89cf88a13e376cf0a8ecc792ec5283ca` (new text) added. The cage line `339ba23f…` and the 22 R1 call keys are unchanged. agent_0x99 keys unchanged (the `#set_global` tag is not spoken text). A clean parent (HEAD) dump is not possible from the worktree — `dump_tts_keys.rb` reads the worktree's own `scenarios/`, which carry the uncommitted change — so this rests on the current labelled dump, the R2 review's recorded `db6c420b…`, and the ink diff. Method caveat as in the R2 review table.
- Lines needing clips at the audio stage: **2** under `nightshade_phone` — `339ba23f…` (cage arm, unchanged from R1) and `89cf88a1…` (the R2 file-held rewrite, replacing R1's `db6c420b…`).

## Live proofs (real path, `proofs/M1_r2/`)

The route `tools/phone_calls/routes/m09_m1_live.sh` has R2 subcommands that walk from the drop terminal (the catalogue flag is the game's own per-game stand-in, typed into the terminal — no global set by hand).

- **race** — PASS. Submit flag 1 at the terminal, walk into the stacks with the read-out unopened: no Nightshade ring for 12 s (`flag1_read_heard` false) while HaX's read-out toast arrives; try the cage gate → he rings once (fallback), opens on the else-branch "crack the keys first" advice; walk back → no second ring.
- **readout_full** — PASS. Hear the read-out to the end (`flag1_read_done` true), close at [Got it]: Nightshade rings once via mapping 1, after the card line, on the else branch. (The run log was truncated by the handover stop after the call opened; screenshots in `proofs/M1_r2/readout_full_*`.)

### Owed (route ready, clean run not captured before the handover token stop)

- **first_choice_close** — close the read-out at its first choice (`flag1_read_heard` true, `flag1_read_done` false): mapping 1 must NOT ring (keyed on `flag1_read_done`); the `room_entered` backstop rings once on the next room move. The route step was corrected (tap, one `choose [1]` to reveal the menu, then close) but a clean end-to-end run is owed.
- **readout_reload** — hear the read-out past the card line (thread still open at [Got it]), persist, close + reload with a millisecond gap (inside the 3 s), then the `room_entered` backstop rings once on resume/next move. Observed working in an interim run (the backstop fired on resume, one ring); the corrected route (two `choose [1]` then `reload_fast`) needs a clean captured run.

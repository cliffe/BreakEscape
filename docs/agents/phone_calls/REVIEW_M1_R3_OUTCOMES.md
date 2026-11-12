# Review M1 R3: outcomes (m09 Nightshade ring)

Fixer: Sonnet, 2026-11-12. Config in `scenarios/m09_digital_archaeology/scenario.json.erb`, line in `ink/m09_phone_nightshade.ink`. Proofs in `proofs/M1_r3_fix/` (keyless server :3025, headless, stopped afterwards).

## Fixes

- **m1 fixed.** The cage-gate fallback now reads `... && globalVars.flag1_submitted && !globalVars.flag1_read_heard && ...` and uses `delayMs: 10000` (was 3000). The condition is re-checked when the delay ends, so opening the read-out inside the 10 s cancels it.
- **m2 fixed.** Before: "So you've found my file. Read the hand on it, not the boy. She's still feeding the shredder." After: "So you've found my file. Never mind the boy in it. Look at the handwriting."
- **n1 left.** A mid-read-out reload and an early close leave the same state (`flag1_read_heard` true, `flag1_read_done` false), so the backstop cannot ring for one and not the other. The reviewer's own advice was to leave it. Cost: a reload mid-read-out rings before the card line, once.
- **n2 fixed.** HaX's Tran warning text is now `delay: 1000` (was 3000), clear of the 3 s ring.
- **n3 fixed, config-only.** New fourth latched mapping: `global_variable_changed:cage_opened`, 10 s, condition `value === true && flag1_submitted && !flag1_read_heard && m08_nightshade_triple_agent && !nightshade_rang`, same `set: nightshade_rang`. It plays his "You're past her gate" arm, which fits: the Victoria code opens the cage with no gate try. Not proved live (the maintenance-code route needs Victoria recruited); the gate path and the latch are shared with the proved mappings.

## Checks

- Ink recompiled (16 files, only `m09_phone_nightshade.json` changed).
- Validator `--no-graph`: 0 errors. `validate_phone_calls.rb`: clean. `tts_mission_lines_test.rb`: 5 runs, 0 failures. dialoguelint m09: totals unchanged (not-x-but-y=5, you-after-choice=1, all pre-existing); the new line is 15 words.
- Key diff (parent files from HEAD via `keys_cmp.rb`): 411 to 411, one re-key: `- 89cf88a13e376cf0a8ecc792ec5283ca` / `+ 1276af28d86deb567dae913af4695f8e`, both `nightshade_phone`. One clip owed at the audio stage.

## Live proofs (real path from the drop terminal)

- **gate_direct: pass.** Terminal closed 0.5 s, at the gate 5.4 s, door try 5.6 s, HaX toast 6.3 s, Nightshade ringing 15.7 s: 10 s after the try, 9.4 s after the toast, never over the read-out. (Strictly "within 10 s of the toast" is 9.4 s; the ring is a gate-try-plus-10 s timer, so on a faster walk it would land later relative to the toast, never sooner.)
- **gate_open: pass.** Gate tried at 5.6 s, toast tapped 1 s later, read-out open (`flag1_read_heard` true): no ring for 14 s, `nightshade_rang` false, thread undisturbed. The fallback cancelled itself.
- **first_choice_close: pass.** Closed at the three-option menu (`read_heard` true, `read_done` false): no ring for 8 s; moving rooms rang once via the backstop; call played as `nightshade_phone`; no second ring.
- **readout_reload: pass.** Card line played (`read_done` true, not yet rung), synced, closed and reloaded inside the delay: he rang on resume, one ring, none after moving rooms.
- **readout_full: pass.** Read-out played to [Got it]: one ring after the card line, call played as nightshade_phone, walking back to the reading room: no second ring.

Route changes (harness only): `m09_m1_live.sh` now waits for the choice buttons instead of fixed 4 s sleeps (the old route picked the wrong choice once the read-out played faster), and `IMP` can be overridden. Extra routes are in `proofs/M1_r3_fix/m09_r3_fix_extra.sh`.

Item 8 (ring condition re-check vs the setGlobal latch) did not block any of these runs.

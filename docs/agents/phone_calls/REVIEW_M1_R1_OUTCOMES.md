# Review M1 R1 outcomes (m09 Nightshade, Torres, Gary ring)

Fixer: Opus, 2026-11-12, on `build/phone-calls` (worktree `p-phone-calls`). Commit `ad4c9151a` (source), proofs/docs follow-up commit. Server :3025, keyless, stopped afterwards. Only m09 files, the M1 route and the log changed.

## What changed

**M1 (major) — Nightshade rang before HaX's flag-1 read-out.** Fixed.
`scenario.json.erb`: the ring trigger moved from `global_variable_changed:flag1_submitted` (delay 7000) to `conversation_closed:agent_0x99` with `globalVars.flag1_read_heard && globalVars.m08_nightshade_triple_agent && !globalVars.nightshade_rang`, delay 3000. A fallback rings on `room_entered:restricted_stacks` with `flag1_submitted` for a player who never opens the read-out text. Both latch `nightshade_rang` at offer time (new `set:` kwarg on `call_map`, which writes `setGlobal`) and check `!nightshade_rang`, so he rings once. New global `nightshade_rang` added to the defaults. The stale `_comment` at the old `:952` was rewritten; the ink header updated.
Live (`nightshade_order`): the read-out text is present and heard first, Nightshade does not ring until HaX's thread closes, then he rings and the call plays the else-branch lines (cage not open).

**m1 (minor) — Torres could ring up to three times after one decline.** Fixed.
All three Torres mappings now latch `torres_rang` at offer time and check `!torres_rang`; the pre-existing `!torres_called` guard (its only reader) stays so no new "unused global" validator warning appears. The `!hl_box_opened` guard on the lid-shut mapping stays. The stale "a second ring waits for the open container" comment was rewritten.
Live (`torres_once`): one ring at the shut lid, decline leaves only the callback, opening the lid rings no second time in 8 s, one missed row, the callback plays the `hl_box_opened` branch.

**m2 (minor) — Nightshade's late call gave stale advice.** Fixed.
`m09_phone_nightshade.ink` `call` knot now branches on the synced globals `nightshade_file_held` and `cage_opened` (declared as VARs in the file). The pre-cage advice is dropped once the player is further on.
New voiced lines (both `nightshade_phone`, under the 25-word phone cap):
- `nightshade_file_held`: "You have his file in your hand already. Then you know what she buried. Don't let her keep the rest."
- `cage_opened`: "You're past her gate. The plan cabinet was never on her schedule -- that's how you know he wanted it kept. Read it."
No line changed on the `else` arm; no key moved on the 22 existing M1 call lines. These two lines are new and need voicing at the audio step.

**m3 (minor) — stale "unvoiced" ink headers.** Fixed.
`m09_phone_nightshade.ink`, `m09_phone_torres.ink`, `m09_phone_gary.ink` headers now read "voiced incoming call (ring: answer, decline or call back when missed)".

**m4 (engine, not M1's to fix).** Logged under "Engine follow-ups" in `PHONE_CALLS_LOG.md`: tapping the home-stub `(Close.)` posts itself as a player bubble in four m09 threads; fix in the engine (don't echo a wholly parenthesised choice).

## Checks

- Compile: all three ink files compile; only `m09_phone_nightshade.json` changed (2 new lines); gary/torres JSON byte-identical (header comments only).
- dialoguelint: no new warning from the new lines (new Nightshade lines max 22 words). The 5 not-x-but-y and 1 you-after-choice hits are pre-existing in other lines/files.
- Validator (`--no-graph`): 0 errors. Issue count fell from 25 to 24 (the `torres_called` unused-global warning that an earlier draft introduced is gone). No new warning for `nightshade_rang`/`torres_rang` (both set and read).
- `tts_mission_lines_test.rb`: 1 failure, all m01 `Agent Zero` vocative lines, none m09 — pre-existing, owned by the m01 slice.
- Key diff (m09, labelled dump): 2 keys added, both `nightshade_phone` (the m2 branch lines), 0 removed, 0 re-keyed; all 22 keys in `proofs/M1/KEYS.md` still present; every m09 key unique to m09 (no clash with other missions).
- Regression: the Recruiter guard-hit route and the M3 flag-1/ledger read-outs behave as the M1 README and the review recorded.

Proofs: `proofs/M1_r1/` (`nightshade_order`, `torres_once`, `rec_hit`, `hand_flag1`/`hand_ledger`), README there.

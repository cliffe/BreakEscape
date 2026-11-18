# m04 office life: build-phase handover (after R3 and the dialogue review)

Branch `build/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, head 022235857 when written. Keyless server on :3097, puma PID 2162290, started from this worktree. Stop it by that PID when the live work is done.

## Done this session

- F1 fixed: a re-talk now plays a line every time. `start` loops `-> start`, with `#exit_conversation` on the spoken line. Proven live in `LIVE_PROOF_6.md` (F1 section, games 8041 and 8042, reload included) and `BUILD_LOG.md` R3 m2 (game 8084).
- The Vance-call "stuck" was the harness: `converse` ended the call. The recipe is in `VANCE_CALL_RECHECK.md` (game 8037).
- Clone-route playthrough, start to credits, game 8053, all steps pass: `PLAYTHROUGH_CLONE.md`. Credits read "ALL THIRTEEN ON SITE WALKED OUT"; the debrief head-count line played; the newcomers stayed hidden after a reload. Assisted steps: Static by debugKO, and the VM flags came from FLAGS_XML.
- Route suite: build 29/13, base 27/13, the same 13 fail on both (`REGRESSION.md`).
- `LIVE_PROOF_7.md`: L6 vent and hydrogen cases pass, seeded only through `new-game.rb --set` of the timer-start globals (`voltage_fight_started`, `attack_mechanism_known`). The real timers fired and the mappings ran in play. The kettle pair render and the sofa re-shoot also pass.
- Already covered before this session: ops SCADA door clearance (`LIVE_PROOF_6.md` check 1), struck at the kettle (`LIVE_PROOF_5.md` check 6), KO after reload (`LIVE_PROOF_1.md` check 3, `LIVE_PROOF_5.md` check 4, game 8082). Chat background at the kettle, with the trip resuming after the chat: `PLAYTHROUGH_CLONE.md` office-life check 2.
- Build review R3: 0 B / 0 M / 6 m (`BUILD_REVIEW_R3.md`), outcomes in `BUILD_LOG.md`.
- Dialogue review: 0 B / 1 M / 7 m (`DIALOGUE_REVIEW.md`), all fixed in 022235857 (outcomes in `BUILD_LOG.md`).

## Open (in order)

1. **KO-route playthrough unfinished.** Game 8082 reached the workshop, with Joanne KO'd and Ibrahim untouched; Ibrahim gave the curt line twice. Resume steps are in `PLAYTHROUGH_KO.md` "Retry". Next: the reload check, flags, print lift, plant, Static, Voltage, ESD, "Bring me in", credits (expect "OFFICE STAFF: hurt, and that's on you", with no "ALL THIRTEEN"), then verify-run. Drive only 8082. My relaunch of it was refused at the concurrent-agent limit.
2. **R4 delta review (Sonnet)** over `da3ece382..HEAD`. That covers the R3 fixes, the dialogue fixes and the playthrough docs. Then R5, unless clean. A major sends the next round back to opus55.
3. Still-open minors: the L8 player-KO Restart case, run live; the five-try counts (R3 m3); the user's yes for the LIVE_PROOF_1 `--set` deviation (R2 m3); a cross-mission check of the `#exit_conversation` then `-> DONE` re-talk bug (R3 m5, for the integrator); Joanne's bark landing unread while a phone call is open in another room (clone run, minor, maybe intended); a hostile newcomer is close to the player's reload spawn (`PLAYTHROUGH_KO.md` first try, minor, needs a design view).
4. **AC0's instruction (user, via AC0): "Implement these using your best judgement."** Once the review loop and the dialogue review are clean, treat the wording as signed off. Then voice every new line with tts-audio and re-voice the HaX head-count line (`ink/m04_closing_debrief.ink:438`), with 0 wasted clips and a listen-check by transcript. Then strip model names from the repo files, commit, and report the hash to AC0. Not started.
5. Final static checks on the last commit: the validator, the `--office-summary` diff, the lock/key diff and the positions diff.

## Wording sign-off list (as built at 022235857; text in `DIALOGUE_SAMPLE.md`)

Talk lines: Ibrahim's normal and curt lines, Joanne's normal and curt lines. Pools: eight `coffee` lines, four each. Exchanges: `ex_six_oclock` (4 lines), `ex_not_on_the_rota` (4), `ex_stay_out_of_the_halls` (3). Joanne's evacuation bark. Text only (not voiced): the "ALL THIRTEEN" credit, the "OFFICE STAFF: hurt, and that's on you" credit, and the blueprint note.

## Voicing list (clip counts per voice)

| Voice | New clips | Lines |
|---|---|---|
| Ibrahim Diallo | 11 | 2 talk, 4 pool, 5 exchange (six_oclock 2, rota 2, halls 1) |
| Joanne Pell | 13 | 2 talk, 4 pool, 1 bark, 6 exchange (six_oclock 2, rota 2, halls 2) |
| Total | 24 | |

Separately, the HaX re-voice: one clip, `ink/m04_closing_debrief.ink:438`, "Thirteen people walked out of there tonight, two of them not on anyone's list. Two hundred and forty thousand people kept their lights on and never knew why." It replaces the voiced "Eleven..." line, whose old clip then needs pruning.

## For the integrator

- Games used this session: 8037, 8039, 8041, 8042, 8053, 8056, 8058, 8060, 8063, 8065, 8082, 8084, and 8087 (stray, created and never driven). Earlier probes touched 7782 and 7820, which belong to other sessions; treat 7984 as dirty.
- Untracked, left in place: `tools/playtest/*-flags-game*.xml`, session logs, and the `lp6_c2_talk_*` and `lp7_m2_talk_*` screenshots.

# m04 office life: build-phase handover (after R3 and the dialogue review)

Branch `build/ol-m04`, worktree `.claude/worktrees/p-ol-m04`, head ff6d8e6b0 (main merged in, 18 November) when last updated. Keyless server on :3097, puma PID 2162290, started from this worktree. Stop it by that PID when the live work is done.

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

Status on 18 November: main (dae6589ee) merged into the branch cleanly as ff6d8e6b0. On the merged head: route suite 29 pass / 13 fail, the same 13 as the base (`REGRESSION.md`); validator 0 errors, 29 warnings at that merge (re-run 21 November on main d28829ce3: 29, or 28 with `--skip-ink`; the older 32 and 33 counted a different set of notes); dialoguelint unchanged (line-len 1, blank-reentry 2, none in the newcomer files). A scratch-path line in `BUILD_LOG.md` was reworded. No subagent could be started this session (concurrent-agent limit), so items 1 to 3 below were not run.

1. **KO-route playthrough unfinished.** Start a fresh game rather than resuming 8082. Recipe: `PLAYTHROUGH_KO.md` "Retry (game 8082)" for the start to the workshop, then `PLAYTHROUGH_CLONE.md` "Continuation" for flags, print, plant door, Static, Voltage, ESD, call-in, debrief (picks from `r6_vance_ko.json`) and credits. Include a mid-mission reload after the workshop. Expect "OFFICE STAFF: hurt, and that's on you" and no "ALL THIRTEEN"; record the debrief head-count line. Write it up as "Retry 3" in `PLAYTHROUGH_KO.md`.
2. **L8 player-KO Restart, live (R3 m3).** Fresh game, strike Ibrahim until hostile, let him knock the player out, Restart, then talk to Ibrahim twice: calm, seated, curt line once per talk. Write `LIVE_PROOF_8.md`.
3. **R4 delta review** over `da3ece382..HEAD` (R3 fixes, dialogue fixes, playthrough docs; the main merge is not part of the build). Then R5, unless R4 finds nothing above minor.
4. **Voicing**, after a clean R4: the 24 new clips (table below) plus the HaX head-count re-voice at `ink/m04_closing_debrief.ink:438`, with the tts-audio skill; move the old "Eleven" clip to `tmp/delete/`. The dialogue review of the new lines is done; re-run it only on lines changed after it.
5. Final static checks on the last commit: `--office-summary` diff, lock/key diff and positions diff (validator and dialoguelint done on ff6d8e6b0, above).

Still-open minors, with the outcome proposed for each:
- R3 m3 five-try counts (L1, L2/L7, phone evacuation, seated attack at 2, 2, 2, 1): propose accepting them at that count. Each case passed every time it ran, r41 and r42 do not cover these cases (they set globals and run the debrief and credits only, with no newcomer, talk or movement), so the counts stand on the live runs alone. The L8 Restart run strikes a seated Ibrahim, so it gives the second seated-attack try; accept that case only after it passes.
- R3 m6: R2 m3 (`--set` deviation) is closed, because AC0 accepted it as a proof aid on 18 November; R2 m5 (probe-library id guard) stays a tooling note for the integrator. R2 m2 and m4 were closed by `LIVE_PROOF_7.md`.
- R3 m5, the cross-mission `#exit_conversation` then `-> DONE` re-talk question: with AC0, another agent is scanning other missions. Nothing to do here.
- Joanne's bark unread while a phone call is open in another room, and a hostile newcomer near the reload spawn: minor, design view for AC0.

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

## Session of 18 November (second hand-over): steps 4 and 5 done, step 3 written up, step 1 half done

Done and committed: R4 m5 rewording (Ibrahim `start` now "Hello. I'm waiting...", `ex_not_on_the_rota` last line "Inductions today. Nobody knows I'm in." (38), Joanne pool line 3 now "Who's moved my mug again, duck?"). Spoken "six" now appears only in Joanne's talk line and `ex_six_oclock` line 1. Ibrahim JSON recompiled (Joanne's JSON unchanged); dialoguelint unchanged (line-len 1, blank-reentry 2, none in the newcomer files). Docs R4 m1 to m3 done, AC0 acceptance line added to `BUILD_LOG.md`, R3 m3 justification reworded. `DIALOGUE_SAMPLE.md` is current. Voicing count is unchanged at 24 clips (Ibrahim 11, Joanne 13) but the three reworded lines (Ibrahim talk, `ex_not_on_the_rota` last line, Joanne pool line 3) have no clip yet.

R4 m6 (Joanne attackDamage 4 vs 10), cause found, ENGINE, not changed here:
- `public/break_escape/js/systems/npc-hostile.js:161-192` `restoreHostility` calls `getNPCHostileState` (line 297), which builds a default state via `createHostileState(npcId)` with no configured stats, so `attackDamage` is `COMBAT_CONFIG.npc.defaultPunchDamage` = 10 (`config/combat-config.js:69`). The configured 4 is applied only by `applyHostileStats`, called from `announceRestoredHostile` (line 229, which returns early for a KO or non-hostile state) and from `setNPCHostile` when turning hostile (line 252).
- Consequence: a restored KO or calm newcomer reads 10 (seen live, game 8133 after reload: Joanne `isKO`, `attackDamage` 10). A restored hostile, not-KO newcomer gets 4 when its sprite exists (`npc-behavior.js:410`, `:603`). So the "2.5 times harder after a reload" worry in R4 m6 does not hold for hostile newcomers by this reading; it was not proven live (L8 run could reload while Ibrahim is hostile and read `attackDamage` after his first hit).
- Also `npc-behavior.js:658` falls back to 10 when `hostile.attackDamage` is missing; m04's newcomers set 4, so not a scenario-data issue.

Step 1 KO route, game 8133 (fresh, `new-game.rb` with `tools/playtest/m04_critical_failure-flags-game8133.xml`, no `--set`), session logs `tools/playtest/m04_critical_failure-session-g8133.jsonl` and `...g8133b.jsonl` (untracked). Progress: briefing, guard, Joanne KO from her far side (KO at swing 7, Ibrahim stayed 100 HP and calm), Ibrahim curt line twice ("I'll keep to my work, if it's all the same to you."), Vance ally picks and Save, work orders, coffee kept, Vance KO, SCADA, Hall 1 dial, HaX thread ("Can we get the night crew out of Hall 2?" then "Nothing right now", crew_warned false), Hall 2 via Level 1 emulate, Relay clone (first attempt closed the RFID reader before Save and the cloner reported no clean read; second attempt Save worked, `relay_card_cloned` true), Cipher auto-chat in Hall 1 (by design, interrupts `moveToNear`), workshop door open, tool case taken (Fingerprint Kit, Job Card). Mid-mission reload done (browser died once; restarted `session-start.sh` on the plain URL, then `bootstrap` with `{"cmd":"bootstrap","resume":"resume"}`): Joanne still KO, `joanne_ko`, `aes_staff_off`, `robert_vance_ko`, `relay_card_cloned` kept, Ibrahim calm, player HP 92 at (160,144) in reception.
Current state: player in engineering_workshop with the flag station open (0 of 4 submitted). Not done: flags (`mg type [0,"<flag:N>",{"submit":true}]`), round-panel print (Hall 1, g8053b seq 76-132), plant door, Static (quiet option), Voltage, ESD, HaX call-in, debrief, credits, `verify-run.rb 8133`, "Retry 3" write-up in `PLAYTHROUGH_KO.md`. The reply to the new Ibrahim normal line and the Joanne bark are NOT yet read live: read the normal lines in the L8 run before striking, and emit `crew_warned` through the real Vance call if a clone-route game is cheap, or note the bark as unread.
Replay helper (scratchpad, may be gone): a script that sends chosen `seq` commands from the old session logs (`g8082` for start to workshop, `g8053b` for continuation) through `tools/playtest/cmd.sh`. Do not split command specs on `;` when they hold JS.

Server: keyless :3097 puma PID 2162290 still running (not stopped, work continues). Browser session for 8133 stopped at the end of this note. Games driven: 8133 only.

Steps still open: 1 (finish), 2 (L8 Restart, `LIVE_PROOF_8.md`), 6 (voicing, 24 clips plus the HaX re-voice and the three reworded lines above; "Eleven" clip to `tmp/delete/`), 7 (merge main, route suite, commit).

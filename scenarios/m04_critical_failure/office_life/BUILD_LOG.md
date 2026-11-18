# m04 office life: build log

## Slice A (scenario data, ink, static checks; no live server)

Built to PLAN sections 2.2 to 2.14, 3, 6, 7, 8 on the plan's picks. Estimated cells stay estimates (slice B measures): posts (6.7,7.47) and (7.47,7.47); cooler `useFrom` dx 0, dy 1; kettle `useFrom` dx 0, dy 2.

| Check | Result |
|---|---|
| Validator | (first run) 8 errors, 33 warnings (baseline 0 errors, 25). All 8 errors are one rule: exchange lines over 40 characters of spoken text (`validate_npc_needs.rb:715`, `:941`), in `ex_six_oclock`, `ex_not_on_the_rota` and `ex_stay_out_of_the_halls`. The sample's wording was kept as instructed; it needs shortening or a rule exemption (user decision) |
| New warnings (+8) | V4 on both newcomers (expected); caffeine target in another room than home, both newcomers (expected, kettle is in the ops office); `reception_cooler` chatter 'cooler' has no lines and needs capacity 2 (the preset supplies the pool name; plan says the cooler sets none, so accepted); onceOnly wiring notes on `agent_0x99` for `crew_warned` and `racks_vented` (new evacuation mappings meant to fire together with the existing ones) |
| `room_entered:*` | accepted, no message; per-room fallback not needed |
| `--office-summary` diff | only `ibrahim_diallo` and `joanne_pell` added (`v1_summary_build.txt`) |
| `lock_key_diff.rb` vs baseline | empty |
| Positions diff | only `reception_cooler` and `ops_kettle` rows added. The one-liner prints no NPC rows (no `itemsHeld`), so the two NPCs do not show |
| dialoguelint | new ink clean; debrief one warning at L294, pre-existing |
| tagdiff (debrief vs HEAD) | only the two VARs and the head-count condition |
| reopencheck (missions.json, m04) | 0 problems |
| `m04_routes` | 27 pass, 13 fail; the same 13 fail on an untouched HEAD checkout (pre-existing) |
| `bin/test-js` | not finished within 100 s; not run to completion |


Slice A follow-up (orchestrator): the ten exchange lines were rewritten to at most 40 characters of speech, `DIALOGUE_SAMPLE.md` and `SPOKEN_LINES.md` updated, Ibrahim's ink recompiled. Validator: 0 errors, 33 warnings.

## Slice B (live measurements, keyless server :3097, headless, 20 fps fixed step)

All numbers below are measured unless marked otherwise. Method: fresh game per run from `tools/playtest/new-game.rb` (games 7666 to 7693 for the earlier posts, cooler and clock measurements; 7699, 7714 and 7729 for the kettle runs on the edited scenario), body centres read from `sprite.body.center`, needs state polled from `window.__test` and the needs system, event times from `npc_left_post`, `npc_use_started`, `npc_used` and `npc_returned_post`. The kettle runs reach the state by the real route (talk to the keycard NPC, clone his card, which clears `ops_kettle_off`), go to the SCADA room and back to fire the mapped kettle break, and park the player at (250, 330), clear of the door lane.

- Sofa posts (edited into `position` and `needsHome`): Ibrahim x 6.72, Joanne x 7.47, both y 7.81. Fresh game 7699 and 7729: both NPCs seated at body centres (215.0, 250.0) and (239.0, 250.0), as predicted.
- Cooler (earlier runs): Joanne `using` at body centre (270.7, 212.8) for 11.7 s; guard 92.7 px away; `useFrom` dx 0, dy 1 unchanged.
- Door: one doorway at world (48, 288), gap x 32 to 64.
- Needs clock: 120 real s gave 120.0 clock s; decay 1.5 per minute stays.
- Kettle `using` cells, body centres (world): first user cells x 205.8 to 211.7, y 372; second user cells ranged x 205.9 to 240.6, y 372 to 382.8 (seen: (240.6, 372.2), (226.5, 381.7), (226.9, 381.5), (219.1, 382.8), (239.2, 372.8), (205.9, 372)). The kettle sprite is at (203, 300), so every cell is 72 to 83 px south of it, which is the two-tile `useFrom` plus the counter.
- Distances: to Vance (160, 480): 117 to 135 px (first-user cells 117 to 119). To the reception doorway (48, 288): 179 to 210 px. The nearest cell to the door lane (x 32 to 64) is 142 px east of it. No cell was blocked, none was inside another sprite, and none touched Vance's tile, so `useFrom` stays dx 0, dy 2; no scenario change was needed.
- Pair overlap at the kettle (clock seconds, from `npc_use_started` to the earlier `npc_used`): 19.3 s and 19.5 s (game 7699, two breaks), 23.7 s and 23.7 s (games 7714 and 7729). Four pair uses measured, not five; a fifth in 7729 was cut off by the probe's loop. A single use is 25 s (`useSeconds`). The second user leaves post 0.7 to 5 s after the first and starts using 2.8 to 7.5 s after the first starts.
- A forced second break did not always pair: in game 7714 break 1 and game 7729 break 1 the second NPC left post some 30 s after the first, so those had no overlap. The natural trigger (return from the SCADA room) paired in 7699 and 7729.
- Screenshot of the pair at the kettle: `screenshots/kettle_pair.png` (game 7729, both `using`, speech bubble visible). The two stand shoulder to shoulder with the sprites slightly overlapping (body centres 16 px apart in x, 10 px in y); readable, left as is.

Static checks after the posts edit: validator 0 errors, 33 warnings (unchanged from slice A); `lock_key_diff.rb` vs `baseline_locks.json` empty (regenerated `dungeon_graph.html` and `.md` reverted with `git checkout`); `--office-summary` diff vs `v1_summary_base.txt` is only the two added NPCs (identical to `v1_summary_build.txt`); positions diff vs `positions_base.txt` is only the added `reception_cooler` and `ops_kettle` rows.

Probe script (reaches the kettle state and measures pairs): a session scratch script, `kettle.mjs <game id>` with `lib.mjs` beside it, not kept in the repo.

## Build review R1 outcomes (0 B, 2 M, 5 m)

The user answered D117: all seven plan recommendations accepted. The build already followed them; the dialogue sample still needs its own yes before any voicing (Q5 (a)).

| Finding | Outcome |
|---|---|
| M1 Joanne's evacuation bark plays while she is knocked out | Fixed: condition gains `&& !globalVars.joanne_ko` (not gated on `aes_staff_off`, which the crew_warned mapping sets first) |
| M2 most live checks unlogged | In progress: `LIVE_PROOF_1.md` covers L8 backgrounds, the Q7 kettle strike, KO-at-kettle reload and evacuation; the rest go to the next live proof |
| m1 `officePresets` also gives `hall1_round_panel` the desk_pc preset | Accepted and recorded: no needs NPC may enter Hall 1 (`needsRooms` is reception and the ops office) and `npcThoughts` is false, so the preset does nothing |
| m2 pair overlaps 16 px at the kettle | Accepted: the screenshot reads as two people side by side at a counter |
| m3 four pair uses, not five | Fifth use measured in the next live proof |
| m4 bark shows as a toast anywhere, plan said "heard where in range" | Accepted: engine behaviour for barks; the plan's wording was loose. A toast anywhere is right for a site-wide alarm |
| m5 cooler and kettle had no `observations` | Fixed: one plain line each (text only, not spoken) |

## Kettle fixes (commit after f929c6a42)

### Problem 1: second user wedges on the way to the kettle

Cause. The kettle `useFrom` `{ dx: 0, dy: 2 }` put the first user at (208, 372), and `besideCell` tries the east side first, so the second user was sent to (240, 372). She comes from the reception doorway in the west, so she had to walk past the first user along the one free strip (y 352 to 408 between the counter and the desks). Ibrahim's held body plus the avoid margin closes that strip, so she stalled at about (188, 373), `walk_stuck`, `job_failed` (timeout), walked home. Forced trips paired because both left together and the `_sideBlocker` swap applies while both are still walking; the natural break sends Ibrahim first, so he has already arrived and no swap runs.

Change (data only, `scenario.json.erb`, `ops_kettle` affordance): `useFrom` `{ dx: 0, dy: 2 }` becomes `{ dx: 1.5, dy: 2 }`. The first user now stands at about (256, 372), whose east neighbour at x 288 is the room's east wall (not walkable). `besideCell` skips east and takes the west side, about (221, 372), on the doorway side, so neither user passes the other. Cells stay in the open strip: clear of the north door lane (x 32 to 64), about 150 px from Vance's tile (160, 480) for Ibrahim's cell and 124 px for Joanne's, 17 and 53 px east of the kettle sprite (203, 300).

Evidence (fresh game each, natural room-return break, no `needs.set`, 20 fps fixed steps, port 3097). Nine of nine first trips paired, no `walk_stuck`, `walk_rerouted`, `job_failed` or `pair_side_swap`. Using cells: Ibrahim x 255.9 to 257.0, Joanne x 219.3 to 225.3, both y 372. Overlap (`npc_use_started` of the later user to the first `npc_used`): 23.75 s (7898), 19.5 s (7899), 23.75 s (7900), 23.75 s (7904), 23.75 s (7905), 19.25 s (7906); games 7891, 7892, 7893 paired too (first batch, overlap not recorded). Each pair played its first exchange. Earlier failures were 4 of 6 first trips.

### Problem 2: newcomers walk to the kettle while Vance's chat is open

Cause: not a scenario or engine fault. Fresh game 7919 (no `needs.set`): caffeine 76.6 and 79.6 at the start, 76.0 and 79.0 at the clone (clock 30 s); `ops_kettle_off` went false at the clone and both newcomers stayed `idle` with no job for the following 14 s of sampling, chat still open. The immediate walks seen in LIVE_PROOF_2 routes (b) and (c) came from that probe's own `needs.set` forcing caffeine to 5 before the card, so the kettle opening made them due at once. No change made. The B2 break (`room_entered:operations_office` from elsewhere) is what brings the pair on a natural run.

Checks after the edit: validator 0 errors, 33 warnings; `lock_key_diff.rb` vs `baseline_locks.json` empty (`dungeon_graph.html` and `.md` reverted); `--office-summary` section identical to `v1_summary_build.txt`; object positions identical before and after (only the kettle `useFrom` line differs; a render diff of every room object's name, type and position, HEAD~1 against now). Games: 7886 (grid dump), 7891 to 7893, 7898 to 7900, 7904 to 7906, 7919 (problem 2; an earlier probe game with a stalled script is not reported). Scripts (scratchpad, not committed): `fx_trip.mjs`, `fx_p2.mjs`, `fx_grid.mjs`.

## Build review R2 outcomes (0 B, 3 M, 7 m)

| Finding | Outcome |
|---|---|
| M1 first kettle cell at the mouth of the SCADA door | In progress: live proof 6 and the regression playthroughs |
| M2 critical path not run end to end with office life on | In progress: live proof 6 and the regression playthroughs |
| M3 attack probe, KO bark gate and L checks still open | In progress: live proof 6 and the regression playthroughs. Partly closed by `LIVE_PROOF_5.md` (checks 1 to 4 and 6 pass); check 5 (credits after a newcomer KO) is covered in the route suite by r41 and r42 and still open live |
| m1 Q7 record from the old cell | Fixed: the strike was re-measured on the new cells in `LIVE_PROOF_5.md` check 6 (kettle cells 223 px and 192 px from the doorway; no follow at 212 px and 191 px, follow at 168 px, threshold about 160 px on sprite coordinates). The Q7 note stands, with those distances |
| m2 no render of the pair on the new cells | Open: `screenshots/lp5_c6_pair_before.png` is a pair on the new cells; it still needs a look before the pair is called readable |
| m3 `LIVE_PROOF_1` check 4 used `new-game.rb --set` | Recorded as a deviation: that check counts for the office-life mappings (they key on `crew_warned` alone; the card was cloned in play and the alarm chosen in Vance's chat), not as a by-play proof of the in-person route. The phone route was proven by play in `LIVE_PROOF_3.md` and `LIVE_PROOF_4.md`. The user's yes for the deviation is still to be asked |
| m4 sofa screenshot does not match the text | Correction note added under `LIVE_PROOF_4.md` check 1; the re-shoot (player in reception, objectives panel collapsed) is still open |
| m5 probes moved players in two other sessions' games | Recorded for the integrator: game 7782 (`LIVE_PROOF_1.md`, a typo for 7788; the probe moved that game's player once) and game 7820 (`LIVE_PROOF_3.md`; the probe moved its player to the ops office and closed minigames). No row was edited by hand, but the page's state sync may have saved the position and room, so the owners should check both. The probe library guard against foreign game ids is not built |
| m6 Joanne stalls beside a player in her cooler lane | Accepted: she gives up and retries later, and the player can step aside. It is the engine's normal avoid behaviour. Revisit only if the persona run reads it badly (then try a different cooler `useFrom` cell) |
| m7 stale documents, misnamed screenshot, no credits route | Fixed: `REGRESSION.md` no longer calls r5 stale and notes the pre-kettle-change run; `PLAN.md` L6 now says a toast anywhere; the Joanne distance above is 124 px; `lp4_c3_joanne_ko.png` renamed to `lp4_c3_joanne_hostile_not_ko.png` and `LIVE_PROOF_4.md` updated; routes r41 and r42 added and passing; `SPOKEN_LINES.md` references brought up to date |

F1 fixed (commit abcb3f683, proof in `LIVE_PROOF_6.md` section F1): Ibrahim's and Joanne's `start` now ends `-> start` instead of `-> DONE`; the chat closed with the divert unread, so the saved story looked mid-knot and a re-talk resumed into DONE ("End of conversation"). Every talk now plays one line, the curt one once `aes_staff_off` is true, including after a reload (games 8041, 8042).

## Build review R3 outcomes (0 B, 0 M, 6 m)

| Finding | Outcome |
|---|---|
| m1 inkcheck and loopcheck report RUNAWAY on both newcomer files | Closed by the m2 tag move: inkcheck and loopcheck are clean on both files at d405641e9 (R4 reviewer's re-run). The idea of teaching the tools to stop at `exit_conversation` is moot |
| m2 first talk reads the line twice | Fixed in commit 20aa6901d: `#exit_conversation` now sits at the end of each spoken line in `start` (`ink/m04_npc_ibrahim_diallo.ink:23` and `:25`, `ink/m04_npc_joanne_pell.ink:14` and `:16`), own-line tag dropped, `-> start` kept, words and exchange knots unchanged. Offline inkjs with save and reload over three talks, both flag states: one line with the tag per read. Live, game 8084 (fresh, no `--set`, port 3097; these are the words as of 20aa6901d, since reworded in 022235857 and again in the R4 m5 fix, so do not copy them into the voicing brief; `DIALOGUE_SAMPLE.md` is current), each newcomer talked to twice, one line each time: Ibrahim "Morning. I'm swapping the office desktops while nobody needs them. It was booked late, so I won't be on tonight's list." (twice); Joanne "Hiya, duck. I've a dozen inductions at six, so I came in early to set the room up. Don't mind me." (twice). Validator 0 errors, 33 warnings; dialoguelint unchanged (line-len 1, blank-reentry 2, none in the newcomer files) |
| m3 L8 player-KO Restart and the five-try counts | Open. Not run this round; counts for L1, L2/L7, the phone evacuation and the seated attack stay at 2, 2, 2, 1 until topped up or accepted |
| m4 stale documents | Fixed: `SPOKEN_LINES.md` line numbers re-read after the m2 edit (exchanges now `:34` to `:37`, `:41` to `:44`, `:48` to `:50`) and the two normal talk lines added (Ibrahim `:25`, Joanne `:16`); `PLAN.md` L4 now adds "no door lane of the machine's room". `HANDOVER.md` left to the orchestrator |
| m5 F1 cause not reproduced offline | Recorded below. `LIVE_PROOF_6.md` (F1) says the pre-fix save left `-> DONE` unread (`canContinue` true). The reviewer's offline run of the pre-fix JSON (8724fd90b) through the engine's read rule ended with `canContinue` false after the tag read, which would have taken `restartAfterEnd`. So that cause statement did not reproduce offline; the save point is not pinned down. The fix is proven live either way (games 8041, 8042, and now 8084 after the m2 change). Cross-mission question for the integrator: if the cause is an engine save before the tag is read, every one-line NPC ending `#exit_conversation` then `-> DONE` in other missions may have the same re-talk bug. Not investigated here |
| m6 R2 minors still open | Open/known: R2 m3 (user's yes for the `--set` deviation, via AC0) and R2 m5 (probe-library id guard, tooling note). R2 m2 and m4 closed by LIVE_PROOF_7, below |

Also from this round's live work (`LIVE_PROOF_7`): L6 closed (seeded, by `new-game.rb --set` of the timer start globals); R2 m2 (pair render) closed; R2 m4 (sofa re-shoot) closed.

## Dialogue review outcomes (`DIALOGUE_REVIEW.md`: 0 B, 1 M, 7 m)

| Finding | Outcome |
|---|---|
| M1 bark repeats the text that follows it | Fixed: "That's the alarm. Coats on, out we go." (38) |
| m1 Ibrahim says he is swapping desktops but sits all night | Fixed: "Morning. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list." |
| m2 pool line goes stale on repeat | Fixed: "These desktops take an age to image." (36) |
| m3 Joanne says she is setting a room up but sits | Fixed: "...so I came in early to get ahead. Don't mind me." |
| m4 "it" unclear aloud | Fixed: "After the rota went out. You're early." (38) |
| m5 Joanne's last rota line does not follow | Fixed, orchestrator's wording: "Inductions at six. Nobody knows I'm in." (39); reworded again in the R4 m5 fix to "Inductions today. Nobody knows I'm in." (38) to cut the repeated six o'clock |
| m6 credit styled unlike its neighbours | Fixed: "OFFICE STAFF: hurt, and that's on you"; r41 and r42 assertions updated and pass |
| m7 stale line numbers | Fixed in the R3 docs commit |
| Clone playthrough minor: Voltage says eleven, credits thirteen | Accepted: Q2 (d), Voltage quotes his rota (blueprint note says "per tonight's rota") |

Checks: validator 0 errors, 33 warnings; dialoguelint nothing new; r41 and r42 pass, r5 and r6 fail only on their base-set lines.

2026-11-18: AC0 accepted the LIVE_PROOF_1 --set deviation (timer-start globals only, set at creation) as a proof aid; the clone route end to end is the full proof.

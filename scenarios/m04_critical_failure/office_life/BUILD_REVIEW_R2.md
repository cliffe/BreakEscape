# m04 office life: build review R2

**Counts: 0 blockers, 3 majors, 7 minors.**

Scope: `git diff 198641936..HEAD` on `build/ol-m04` (R1 fixes, the kettle `useFrom` change, the two route assertions, `LIVE_PROOF_1.md` to `LIVE_PROOF_4.md`, `REGRESSION.md`, the build log sections "Build review R1 outcomes" and "Kettle fixes"), read against `PLAN.md` section 10, the skill's standing rules, stage 4, stage 5 and `references/checklists.md`. Line numbers are in `scenarios/m04_critical_failure/scenario.json.erb` unless another file is named. Engine paths are under `public/break_escape/js/`.

## Re-run by the reviewer

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb` | 0 errors, 33 warnings. The two `observations` recommended-field warnings from R1 m5 are gone. V4 still warns on both newcomers (E1 probe not passed) |
| `scripts/lock_key_diff.rb` vs `office_life/baseline_locks.json` | empty (`dungeon_graph.html` and `.md` reverted with `git checkout`) |
| `m04_routes/r5_late_warning.json` | `[PASS] said: "ALL THIRTEEN"`; its other 5 fails are the pre-existing base set |
| `m04_routes/r6_vance_ko.json` | `[PASS] not said: "ALL THIRTEEN"`; its 1 other fail is pre-existing |

## The delta itself

- **Bark KO gate (1725).** `value === true && !globalVars.joanne_ko` is right. The R1 option of adding `!globalVars.racks_vented` is not needed: every choice that sets `crew_warned` is already gated `not racks_vented` (`ink/m04_npc_robert_vance.ink:400`, `:403`; `ink/m04_phone_robert_vance.ink:127`), so a hidden Joanne cannot bark. `crew_warned` is monotonic, so a failed condition never re-arms into a late bark. The gate has not been seen live (see M3).
- **Observations (1753, 1868).** Plain, UK English, no dashes, not spoken, no credential or plot detail. Fine.
- **Route assertions.** r5 now expects `ALL THIRTEEN` (the credits line at 243). r6 kept its negative test meaningful by moving the `notSaid` to `ALL THIRTEEN`; left at `ALL ELEVEN` it would have passed trivially for ever. Both correct.
- **Kettle `useFrom` (1870).** `approachCell` takes fractional `dx` (`systems/npc-needs.js:5456` to `:5459`, `TILE` multiply then snap to the nearest walkable cell); `besideCell` tries east first with radius 0 and skips an unwalkable cell (`:5663` to `:5674`), so the first user at about (256, 372) with the wall at x 288 sends the second user west, as the log says. The facing point is back along `useFrom` (`systems/seating.js:2119` to `:2125`), so the first user faces about (208, 308), the kettle. The north door lane (x 32 to 64) is clear. Vance's tile (160, 480) is 144 px from (256, 372) and 124 px from (221, 372) (the log says 150; both are still above the plan's 118). The second-user wedge fix is well evidenced: nine of nine first trips paired on fresh games, against 4 of 6 failures before. What the change did not check is the other door (M1) and the Q7 record (m1).

## Majors

### M1. The new first kettle cell stands at the mouth of the SCADA door, and only the north door lane was checked
`scenario.json.erb:1870`; `office_life/BUILD_LOG.md:62`. The ops office has three doors (1765 to 1768): north to reception, east to `scada_control_room`, south to the security office. The kettle-fix check names only the north lane. By `systems/doors.js:243` to `:251` a single east door sits at `roomPosition.x + 320 - 16`, `roomPosition.y + 80`; the north door at (48, 288) is `roomPosition.y + 32` (`doors.js:92`), so the room origin is (0, 256) and the SCADA door centre is about (304, 336). Ibrahim's new cell (256, 372) is about 60 px from it, just below and west of the gap between the fridge and the east wall that the player must come down to reach the open strip (y 352 to 408). In `screenshots/l6_after_evac_ops.png` that door is the black gap right of the fridge, level with the kitchenette. The old cell (208, 372) was about 100 px away.

This matters more than for any other door because B2 (`room_entered:operations_office` from elsewhere, 1690) fires as the player comes back from the SCADA room: Ibrahim walks over and stands 25 s at the mouth of the door the player has just used, with Joanne beside him at (221, 372) across the same strip. The SCADA room is on the critical path (anomaly by the dial, Hall 1 through it). None of the nine fix runs records the player walking through the door while the pair is using the kettle. Probably passable along the south of the strip, but unmeasured.

Fix: measure the east door's gap from the live door sprite, then five times on fresh games walk the player SCADA to ops to reception and back again while both newcomers are `using`, and log any stop, reroute or push. If the lane is tight, try `useFrom { dx: 1.5, dy: 2.5 }` (cells about 16 px further south, off the door's axis, keeping the west-side second user) and re-run the nine-trip pairing check; or record the measured clearance as accepted. Add "no door lane of the machine's room" to L4's wording.

### M2. The critical path has not been run end to end with office life on
`PLAN.md:288` (10.1); skill stage 5 ("a scripted regression of the walkthrough with office life on") and checklists "Before merge" ("Short scripted regression of the walkthrough passes"). The route suite (27 pass, 13 fail, same set as the base, `REGRESSION.md:17` to `:20`) is ink-only, and most of its routes fail on the base anyway, so it says little about a live run. No live proof plays from the briefing to the debrief on the clone route or the KO-Vance route. Static checks (V5 none, lock diff empty) show that nothing reads an office-life global; they do not show that nobody stands in the way, which M1 makes a live question. Fix: one scripted walkthrough on each of the two routes on the current HEAD (after M1), fresh game, VM flags from `new-game.rb` FLAGS_XML, with the poll-before-interact rule from stage 5; `verify-run.rb` showing progress; record the hash.

### M3. The attack probe, the KO bark gate and several L checks are still open (R1 M2 carried over)
`LIVE_PROOF_4.md:5`, `:39` to `:50`, `:56` to `:67`; `LIVE_PROOF_1.md:51` to `:53`; `LIVE_PROOF_3.md:14` to `:16`. The live proofs support the passes they claim (L1, L2, L3, L5, L7, 10.3, the phone evacuation and the seated hide), but section 10 still lacks:
- **10.4**: attack Joanne walking to the cooler (stuck three times; this is the exact case V4 warns about, so V4 cannot be cleared); attack Vance with the pair at the kettle; strike the guard with Joanne at the cooler; Vance's and the guard's own KO outcomes; credits and debrief after a newcomer KO (not run in LP1 or LP4).
- **R1 M1 fix live**: LP4 check 3 never KO'd Joanne, so the bark gate is untested in play. LP1 check 3 did KO her at the kettle (game 7757), and in LP4 she moved from (239, 227) to (258, 227) during the punches, so the six misses look like a probe range problem, not a KO threshold. Re-aim each punch at her current body after `moveToNear` instead of chasing a threshold.
- **L6**: `racks_vented` without the bark, and `hydrogen_alarm` alone (both stay) not run; "hidden mid-use at the kettle leaves it free" is only partly shown (LP1 check 4: Ibrahim was mid-use when `crew_warned` fired, but nothing shows he was still mid-use at the hide).
- **L8**: the curt line after trouble, "past talking" on a struck newcomer, the player-KO Restart case, and "trip resumes after the chat" at the kettle, none run.
- **Five tries**: L1 (2 games), L2 and L7 (2), the phone evacuation (2), seated attack (1). The plan asks for five each.

Fix: run these on the current HEAD after M1. For 2b, call `attack({x, y})` at the sprite's current body straight after positioning (LP4 found direct calls work). For the credits, see m7 for a cheap route-suite check alongside the live one.

## Minors

### m1. The Q7 record is from the old cell
`office_life/LIVE_PROOF_1.md:16` to `:25`; `QUESTIONS.md:50`; `BUILD_LOG.md:33`. The user chose Q7 (a), "accept and record". The record (follow once the player is about 137 to 157 px away at (108, 243); kettle 179 to 210 px from the reception doorway) was measured at (207, 372). The cells are now (256, 372) and (221, 372): 224 px and 192 px from the doorway (48, 288). From (108, 243) Ibrahim is now about 196 px away, outside the 160 px aggro, so the recorded follow no longer happens there and would need the player further into reception's south-east, near the sofa. Fix: re-run the strike-at-kettle probe (both newcomers, one each as first user) and update the log and the Q7 note with the new distances. No data change is needed unless the user objects.

### m2. No render of the pair on the new cells
`BUILD_LOG.md:62` to `:64`; R1 m2 was accepted on `screenshots/kettle_pair.png` and `lp2_kettle_pair_ok_7871.png`, both from the old cells. Ibrahim now stands 53 px east of the kettle sprite, roughly in front of the fridge, and Joanne 18 px east of it. Whether that still reads as two people making tea, and how the second user faces, has not been looked at. Fix: one screenshot of a pair mid-use on the current HEAD, looked at and committed, with the user's view if it reads oddly.

### m3. LP1 check 4 used `new-game.rb --set`, against the stage 5 rule
`office_life/LIVE_PROOF_1.md:37`. Stage 5: "never set globals in the page to reach a state. If a check needs a head start, add it to a test scenario on the branch or ask." `--set vance_is_ally=true --set anomaly_detected=true` writes globals into the new game's state. LP2 to LP4 kept to the rule. How much the evidence counts: the office-life mappings key on `crew_warned` alone, the card was cloned in play and "Sound it." was chosen in Vance's chat, so it is fair evidence for the bark, the machines off and the hide after an in-person alarm. It is not a by-play proof of the in-person route, and the seed skipped whatever the ally and anomaly beats normally emit. The phone route was later proven by play (LP4 check 1). Fix: re-run the in-person case by play (LP3's `allyAndAnomaly` in `lp3_ally.mjs` already reaches ally and anomaly by play), or record the deviation in the log and get AC0's yes for it.

### m4. The sofa screenshot does not show what the text says
`office_life/LIVE_PROOF_4.md:21`; `screenshots/lp4_sofa_after_evac.png`. The text says "player at (48, 210), no walk" in reception. The frame is centred on the SCADA control room with an examine box open; reception's sofa is at the top-left edge and half covered by the objectives panel. The visible half is empty, which agrees, but this is the render check the gotchas ask for on a seated hide. Fix: re-shoot with the player in reception and the objectives panel collapsed, and replace the file.

### m5. Probes moved players in two other sessions' games
`LIVE_PROOF_1.md:61` (game 7782) and `LIVE_PROOF_3.md:24` (game 7820, player moved to the ops office and minigames closed). "No row edited" is likely untrue in effect if the page's state sync ran while the probe was attached, since player position and room are saved through it. Fix: tell AC0 the two ids so their owners can check them; make the probe library refuse a game id that its own `new-game.rb` call did not print in the same run.

### m6. Joanne stops beside a player standing in her cooler lane
`LIVE_PROOF_3.md:12`; `LIVE_PROOF_4.md:42` to `:44`. Three times she stalled next to a player in her path (7819, where she then gave up and went home without drinking; 7903; 7908). A player waiting in reception between the sofa and the cooler will see this. It is the engine's normal avoid behaviour and may be fine, but it is player-facing and not yet judged. Fix: note it in the build log and look at it in the stage 5 persona run; if it reads badly, check whether the cooler's `useFrom` (`{ dx: 0, dy: 1 }`, 1755) can take a cell off the reception walking line.

### m7. Stale documents and a misnamed screenshot; credits branch not in the route suite
- `REGRESSION.md:22` and `:46` still say r5's `ALL ELEVEN` assertion is stale and the route file unedited; 23f5c1e53 fixed both. The suite also ran at 11e562a0f, before the kettle change (data only, so a re-run is optional; say so).
- `PLAN.md:297` L6 still reads "bark heard where in range" although R1 m4 was accepted as "a toast anywhere"; correct the expectation as R1 asked.
- `BUILD_LOG.md:62` gives 150 px to Vance for both cells; Joanne's is 124 px.
- `screenshots/lp4_c3_joanne_ko.png` shows a run where Joanne was not KO'd; rename it (for example `lp4_c3_joanne_hostile_not_ko.png`) and fix `LIVE_PROOF_4.md:64`.
- No m04 route sets `ibrahim_ko` or `joanne_ko`, so the credits lines at 243, 244 and 250 and the debrief branch (`ink/m04_closing_debrief.ink:434` to `:438`) are checked nowhere. Add one route (copy r5, set `joanne_ko` true before the credits) with `said` "not all of them on their own feet" and "OFFICE STAFF: HURT" and `notSaid` "ALL THIRTEEN". Cheap, and it backs up the live credits check in M3.

## Accepted R1 minors: were they reasonable?

- **m1 (`hall1_round_panel` preset)**: yes. `needsRooms` on both newcomers is reception and the ops office (1672, 1712), and `npcThoughts` is false, so the preset has no reader.
- **m2 (16 px overlap)**: reasonable at the time, now superseded: the cell move puts the pair about 35 px apart, which answers the overlap, but see m2 above for the missing render.
- **m3 (fifth pair use)**: closed by LP2 (five uses, 16.3 to 23.8 s) and the nine fix runs.
- **m4 (toast anywhere)**: reasonable for a site-wide alarm; only the plan wording is left (m7).
- **m5 (observations)**: fixed.

## Not findings

- `__test.needs.set` to force caffeine (LP2) is a needs lever, not a global, and is logged; it was the cause of the "walk during Vance's chat" scare, which the log's game 7919 shows does not happen on natural numbers.
- L3's "ten needs-minutes" was run as 40 s plus 20 s windows with caffeine forced to 5, a harder test than ten idle minutes, since no other ops-office source exists for them.
- The untracked `screenshots/lp5_c1_after.png` in the worktree belongs to a later live proof and is outside this review.

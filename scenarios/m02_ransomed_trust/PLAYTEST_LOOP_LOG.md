# m02 Ransomed Trust: playtest improvement loop

Started 2026-10-04. Method: `.claude/skills/playtest-scenario/SKILL.md` ("The improvement loop") and `AGENTS.md`. User's limit: at most three review rounds in total (a round is a playtest or review whose findings go to a fix pass), blockers first, a blind playtest last.

Scratch for this loop (reports, session logs): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/52645c2c-da43-4f47-aa0a-01b55d09e3b3/scratchpad/m02-loop/`.

## Starting point: partial blind playtest (game 1528, 2026-10-03)

Session log and screenshots in the session scratchpad, `m02-blind/`. verify-run: 12 rooms beyond the first, 4 objects unlocked, 4 flags submitted, insider identified, confronted and arrested. The run reached about 75% and stopped when a permission layer blocked the tester's commands. Not reached: the ROT13 rack note through the in-game CyberChef, the recovery console decision and Ghost's offer, the press terminal, the debrief, the credits. The "struggling player" persona never started.

| # | Severity | Finding |
|---|---|---|
| A1 | minor | Gary's photo frame observation leaks a dev note "(check if relevant to the PIN puzzle)" |
| A2 | minor | Conference whiteboard says IT security was cut from £85K to £50K; Kim and the budget report say the £85K was deferred |
| A3 | minor | Kim keeps offering "What's the code for the boardroom?" after answering |
| A4 | minor | Gary's "Then it works both ways. Their door is my door." vanishes once another branch is taken |
| A5 | minor | After a reload the player respawns at reception and the Mission Brief note shows again |
| A6 | minor (maybe harness) | Title screen after reload only says "Continue?" with no obvious control |
| A7 | minor | Flags 2–4 each trigger a Ghost phone scene that types out over 20–60 s on top of the open flag station |
| A8 | minor | HaX toasts stack over the objectives panel |
| A9 | minor (harness/range) | Several objects needed the player about 10 px closer than expected |
| A10 | design | The insider deduction is more handout than deduction: Bernie and Val name Reeves unprompted, a HaX toast ties him to the drill, the post log names badge SC-4471, and "You're badge SC-4471" appears as soon as the number is held. Suspected within about 10 minutes |
| C1 | open | Recovery console says "ENTROPY key material NOT LOADED"; the rack note / sealed case / staging cache route wasn't played |
| C2 | open | The badge number reaches the player first through a VM flag (the Ghost-log flag); standalone it only appears in objective text and the post log |

Counts: 0 blockers, 0 majors, 9 minors, 1 design, 2 open.

Best moments: getting past Val via Bernie's vouch, Kim's board vote, Gary "on the record", Reeves's confession, Ghost's offer.

## Round 1

Playtests: tester A (regression, game 1543; `m02-loop/r1-tester-a/report.md`) and tester B (struggling player, game 1544; `m02-loop/r1-tester-b/REPORT.md`). Plan and decisions: `m02-loop/fixer/PLAN.md`. User decisions: the badge number stays behind flag 4 (C2 unchanged; SAFETYNET missions require their VM flags); Val accusation in; Val is SC-2208; SecGen S1/S2/S4 done by a separate agent, S3 rejected; engine E1 (minigame closes on damage) done by a separate agent.

### Severity table (A, B, R merged)

| # | Sev. | Finding | Class | Fix (round 1) |
|---|---|---|---|---|
| A10 | design | Insider deduction is a handout | mission | Board says SECURITY OVERRIDE (no number, no "N/S Supervisor"); post log loses its drill note; rota gives Val SC-2208; Val's notebook: "he turned his lanyard round"; HaX's three naming toasts deleted; graded `doors_nudge` (5 tiers); naming needs `cover_burned` + flag-4 number (+ post log to his face); Reeves deflects to Val; Val's drill line implicates herself; Val can be accused; Bernie no longer knows his name; "Graham Reeves" in HaX's menu only once `reeves_known` |
| C2 | open | Badge number only via VM flag | decided | Kept (user). Flag 4's VM document now names SC-4471 itself (SecGen S1) |
| R14 | minor | Only the right reason cites the post log | mission | Reasons reworked with A10 (security override, rota, post log) |
| B1 | major | Val fight with no warning; helpless in lock minigame | mission + engine E1 | Fight choices labelled "(Fight her.)" / "(She'll fight you.)"; E1 by engine agent |
| B2 / R1 / A5 / A6 | major | Reload: respawn at reception, brief replays, "Continue?" | engine + mission | `show_scenario_brief: "once"` (engine 22ec27e5); respawn and title screen are engine E2/P10, not this round |
| B3 | major | Debrief and credits ignore the Val fight and player KO | mission | `player_was_ko` from the engine's `player_ko` (probed in game 1547: mapping fires, global reaches the server); debrief lines; credit "Attacked by the agent — logged it" |
| B4 | major | Debrief says "Ghost told you" about the affiliate | mission | Verified: only `act2_reveal` says it. `ghost_affiliate_heard` set there; variant opener otherwise |
| B5 | major | Ghost's keys "lowest risk" vs 1 death | mission | Console bullets for Ghost's keys and ransom match the credits |
| R2 | major | Ghost tile claims a promise not made | mission | Bullet now "The price: your word to Ghost…" |
| A7 / B10 / R10 | minor | Ghost scenes auto-open over the flag station | mission | Ghost barks (9 s, 16 s) carry the knot; device `mid_mission_contact` offers missed scenes |
| A8 | minor | Toasts stack | mission | Flag 2: HaX 2 s / Ghost 9 s; flag 3: HaX 2.5 s / manifest 9 s / Ghost 16 s; flag 4: 1.5 s / 9 s; three naming toasts removed |
| C1 / R3 / R4 / R15 | minor | Key material location unclear; Combined tile names one missing input; note has no unit | mission | Slot "in ENTROPY's staging cache, in this rack"; blocked text names cache, flag and escrow; Combined `needs` reordered; ROT13 plaintext "(CACHE, THIS RACK) = 4 HOURS"; HaX advice branch |
| A1 / R6 | minor | Photo dev note | mission | Removed |
| A2 / R5 | minor | Whiteboard "cut" vs "deferred" | mission | Whiteboard says DEFERRED; "Cyber Security" in minutes |
| A3 / R7 / B11 | minor | Kim's stale options; `meet_dr_kim` left open | mission | Diary sets `found_boardroom_code` and retires the question; repeat ask gets the code only; IT hatch retires on `it_door_open`; `meet_dr_kim` + aim unlock moved to the top of `first_meeting`; re-talk no longer replays the first meeting |
| A4 / R8 | minor | Gary's "Their door is my door" lost | mission | Each follow-up offers the other |
| R9 | minor | Gary gives away the SSH password | mission | "I'd try the middle one" removed (3 voiced lines); HaX text drops "Try the middle one"; Gary's access notes name the account (gary), matching SecGen S2 |
| R11 | minor | "I still don't know" refuses Ghost | mission | Offer stays open; device can accept until a restore is chosen |
| R12 | minor | Credits say offline keys on combined restore | mission | Separate combined-restore credit |
| R13 | minor | "Picked him up" with no subject | mission | Line now names Reeves (debrief transcript showed the previous line missing; watch in the confirmation run) |
| B6 | minor | "Clean exit" vs foothold | mission | Ghost's-keys variant |
| B7 | minor | "Scapegoated" credit vs quiet firing | mission | Credit "Fired quietly — career over in healthcare IT" |
| B8 | minor | "Corridor full of people"; "named Derek" blur | mission | Both lines reworded |
| B13 | minor | Keep-internal confirm silent on the Ghost promise | mission | Conditional line on the confirm screen |
| §11.1 | — | HaX flag texts claimed things not on the VM | mission | Flag 2 HaX text quotes Ghost's deployment log (and completes `unmask_db_window`, retitled "Find out how the insider let ENTROPY in"); flag 3 describes the anonymous-FTP notice; flag 4 "That's all four…" (no "full backdoor chain") and the badge text quotes Ghost's log; `hint_vm` gives the real four-flag order; `hint_pin_safe` cites Gary's procedures |
| A9 / B9 / B12 / R16 | minor | Interaction range, pathfinding, key screen before picking | no-fix / small | 32 px range as designed; sealed case text says no key in the building fits it |
| B14 | minor | Bernie routes both give the key | no-fix | Design: the payoff is her vouch |
| R17 | minor | HaX timestamps all the same | engine | Left |

Also: `val_challenged` and `val_argument_heard` declared in `globalVariables` (validator warning).

### Files changed (m02 only, plus its block in `scripts/ink_runtime_check/missions.json`)

`scenario.json.erb`; inks + JSON: `m02_npc_asset`, `m02_npc_security_guard`, `m02_npc_receptionist`, `m02_npc_sarah_kim`, `m02_npc_gary_whitlock`, `m02_phone_agent0x99`, `m02_phone_ghost`, `m02_closing_debrief`, `m02_object_press_terminal`; `TESTING_WALKTHROUGH.md`, `PASS4_PLAYTEST.md` (superseded notes), `DESIGN_REVIEW.md` (round 4 pointer), this log. `VM_INTEGRATION.md` was changed by the SecGen agent, not here.

### Checks

| Check | Result |
|---|---|
| Ink compile | 15 compiled, 0 failed (3 known END notices) |
| tagdiff vs HEAD | 172 structural differences in 9 files, all from this round (debrief 8, Reeves 10, Gary 38, Kim 16, Val 31, terminal 2, HaX 53, Ghost 14) |
| Validator | schema passes, geometry and doors OK, 0 INVALID; warnings same set as HEAD (one fewer naming-mapping overlap); dungeon graph regenerated (unchanged) |
| dialoguelint | same as HEAD: not-x-but-y 2 (Ghost's allowed villain lines), you-after-choice 1; 0 errors |
| Rendered JSON assertions | 40, 0 failures (no number on board or snag list; badge global set only on flag 4; no "his face"/"whose post"; naming toasts gone; no "full backdoor chain" or "middle one"; Ghost barks; console slots; globals; brief "once"; no object moved) |
| inkcheck + loopcheck | 51 states × 2, 0 failures |
| reopencheck | 0 problems |
| Node suite | 265/265 |
| Browser | `player_ko` probe only (game 1547). Everything else needs the confirmation run |

### Spoken lines (old → new)

Changed:
1. Bernie: "Reeves. Graham, I think. Says it like you should already know it." → "Couldn't tell you. He's never signed, so he's never had to say."
2. Val: "I told myself facilities knew their own job. He smiled at me and said he'd sorted it." → "Panel said fire, so I unlocked the north doors myself. Somebody rang down and said facilities had it in hand."
3. Reeves: "If it's a records question, the post has a log. I'm sure it's somewhere." → "If it's badge numbers you're after, Officer Okonkwo keeps the rota. She's very thorough."
4. HaX (debrief): "…with half the facts and a corridor full of people watching you do it." → "…with half the facts and forty-seven people depending on it."
5. HaX (debrief): "…Cold. Focused. That's useful in this work, but hear the next part anyway." → "…Cold. Focused. Useful, in this work."
6. HaX (debrief): "SAFETYNET moved on the intel and picked him up…" → "SAFETYNET moved on your identification and picked Reeves up…"
6a. HaX (debrief): "You found Ghost's operational log. The mortality calculations." → "You found Ghost's manifesto. The mortality calculations." (now gated on the manifesto)
6b. HaX (debrief): "Ghost's logs confirmed what we suspected -- Zero Day Syndicate sourced the ProFTPD exploit. Crypto Anarchists handle payment processing across all cells." → "Crypto Anarchists handle payment processing across all cells."
6c. New: "That invoice from the boardroom safe confirmed it -- Zero Day Syndicate sourced the ProFTPD exploit." (gated on the invoice)
7–9. Gary: three lines lose "I'd try the middle one" / "Middle one, I'd bet." / "and I'd put money on the middle one."

New: Reeves ×2 (drill deflection); Val ×7 (accusation, incl. "Me." which the batch skips; vindication variant); HaX debrief ×5 (two Val-fight openers, the shared "Then she had to log you" line, the affiliate opener without "Ghost told you", Ghost's-keys "No trace on the person"). Total, including items 6a–6c: 11 changed, 15 new.

### Open items

- **Resolved: debrief VM claims.** "You found Ghost's operational log. The mortality calculations." now reads "You found Ghost's manifesto. The mortality calculations." and is gated on `lore_ghosts_manifesto_found` (was `flag_ghost_log_submitted`). "Ghost's logs confirmed … Zero Day Syndicate sourced the ProFTPD exploit. Crypto Anarchists handle payment processing across all cells." is split: "That invoice from the boardroom safe confirmed it -- Zero Day Syndicate sourced the ProFTPD exploit." (gated on `lore_zds_invoice_found`), then "Crypto Anarchists handle payment processing across all cells." (always).
- **Resolved: drill timeline.** Two drills, one badge. Six weeks ago an unscheduled drill covered the contractor sweep that placed the bridge, which is what every voiced line says (Ghost, Kim, Val, Bernie, Reeves, debrief). On Friday the same badge held the doors again for the 02:47 window, which is what the handover board says ("Second time"). No voiced line changed. Edited: HaX's flag-2 text ("…ran the drill six weeks ago, and held the doors again on Friday"); SecGen flag_2 and flag_4 text only (no more "Friday … place the bridge" / "the bridge was placed inside the window"; 4 `flag_generator`s, positions unchanged, lxml schema check VALID); `VM_FLAG_DOCS.md` and `VM_INTEGRATION.md` to match.
- R13: the debrief transcript skipped the first line of `insider_flagged`; check in the confirmation run whether a line after a choice is being dropped.
- Next: Sonnet confirmation run of the round's structural changes, then a blind run (the deduction changed).


### Round 1 confirmation (2026-10-04, games 1548–1551, Sonnet, headless :3001)

0 blockers, 0 majors, 8 minors, 2 notes. Deduction chain A1–A7 PASS; round-1 fixes PASS; gated debrief lines absent/present correctly; debrief and credits agree in both endings; engine E1 PASS (m02 Val on a lockpick, m01 Derek on a container; KO screen clean).

| # | Sev | Finding |
|---|---|---|
| CF-A | minor | Ghost tile "The price: your word to Ghost…" shows before any offer, identical after acceptance |
| CF-B | minor | Credit "COVER RE-ESTABLISHED: Access regained without incident" alongside "Attacked by the agent — logged it" |
| CF-C | minor | Val's re-talk after the fight ignores it |
| CF-D | minor (engine?) | Val began an attack windup ~0.4 s after the player's KO; a minigame could open while KO'd |
| CF-E | minor | Debrief "Ghost kept mortality calculations" / "Zero Day Syndicate. They sold Ghost…" play with neither manifesto nor invoice found |
| CF-F | minor (engine) | E1 abandoning a lockpick also shows "Lockpicking Failed" and "Pick Failed. Try again." toasts |
| CF-G | minor | "Remind me where we are" appends the stale Gary-keycard tip after the card is held |
| CF-H | minor | Reeves's cover intro replays in full on every re-talk |
| CF-I | note | Reeves's name and SC-4471-as-post-badge are findable without flags; flag 4 supplies the link (by design) |
| CF-J | note | After reload the title prompt needs a click; Space/Enter ignored (engine E2) |

Minors carried into the post-blind fix round.

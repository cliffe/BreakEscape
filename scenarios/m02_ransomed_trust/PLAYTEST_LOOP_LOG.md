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

## Round 2

Inputs: blind struggling-player run (game 1552, `m02-loop/blind-struggle/REPORT.md`; 0 blockers, 2 majors) and the round 1 confirmation minors CF-A to CF-H. The "do your best" blind run died on a Bash block and is rerun after this round.

| # | Sev. | Finding | Class | Fix |
|---|---|---|---|---|
| BS1 | major | After Gary's card nothing on screen says the server room is through Val's Security Office | mission | The burn mapping now unlocks "Somebody Pulled Your Booking" itself (it could stay hidden behind the IT aim's other tasks); task "Reach the server room, through Val's Security Office"; the 11 s burn text names "Her Security Office, west end of the main corridor"; a HaX toast 18 s after the card is picked up says where its door is (skipped once past Val); "Remind me where we are" says the same while the card is held |
| BS2 | major | Boardroom keypad: blind guesses burn attempts; the code is only in Kim's diary | mission | Snag list item 20: "CTO keeps the code in her desk diary"; Ward Board: "(KEYPAD -- ask the CTO)"; HaX's press-terminal advice and the tier-4 nudge mention Kim's code. Attempts: the 3 are per keypad session (`pin-minigame.js` builds a fresh attempt list each open; nothing is stored server-side), so at 0 the keypad closes with "PIN Rejected" and the next interaction gives 3 more. It can't block the ending. The "3 attempts" framing is engine UI, left as it is |
| BS-O5 | minor | "OPTIMAL -- BOTH KEY SETS" gives the answer away | mission | Combined tile: "4 HOURS -- BOTH KEY SETS", warning tone, banner "BOTH KEY SETS: FOUR-HOUR RESTORE, NOTHING PAID" |
| BS-O3 | minor | Clicking a lanyard in the inventory shows nothing | mission (engine cause) | The engine shows no observation for takeable, non-readable items in the inventory (`interactions.js`, observation only when `!takeable`). The three lanyards are now readable in place (`readDisplay: gameDisplay`, not added to notes) with a short card text. Needs a browser check that world pickup still works |
| BS-P3 | — | HaX line looked cut off | no-fix | The source line is whole (`m02_phone_agent0x99.ink:259`); harness truncation |
| BS-x | minor | HaX message timestamps all the same | engine | Left (same as R17) |
| BS-y | minor | The insider was learned from Reeves's ambush confession | mission | The ambush stays the fallback. New on-screen nudge 30 s after the restore decision, if flag 4 is in and nobody's named: "Before the press terminal: whoever carries SC-4471 is still in the building. Read the boardroom post log and name them first." |
| CF-A | minor | Ghost tile's price shows before any offer and reads the same after acceptance | mission | Tile bullets before acceptance: "Only if Ghost offers them -- and Ghost will want something for them."; `whenAvailable` (deal accepted) swaps in "You gave Ghost your word: tonight's evidence goes public." |
| CF-B | minor | "COVER RE-ESTABLISHED: … without incident" next to the attack credit | mission | Two route-true credits ("Val Okonkwo checked you out and opened her office" / "On paper -- you let yourself past Val anyway"), neither shown if Val was attacked or KO'd |
| CF-C | minor | Val's re-talk after a fight ignores it | mission | `after_fight`: one line and "[Walk away.]" |
| CF-D | minor | Hostile NPC starts a windup after the player's KO | engine | `npc-attack-guard.js` (`playerCanBeAttacked`); `npc-combat.js` checks it before a windup and before one lands (hides the telegraph). Node test `npc-attack-guard.test.mjs` |
| CF-E | minor | Debrief quotes the manifesto/invoice when neither was found | mission | `q_entropy_link` and `mission_3_setup` lines gated on `lore_ghosts_manifesto_found` / `lore_zds_invoice_found`, with variants |
| CF-F | minor | "Lockpicking Failed" / "Pick Failed" toasts after a damage close | engine | `player-damage-interrupt.js` records the close (`minigameClosedByDamage()`); the two lockpick failure toasts (`minigame-starters.js`, `unlock-system.js`) are skipped right after one. Node tests added to `player-damage-interrupt.test.mjs` |
| CF-G | minor | "Remind me" gives the stale Gary tip with the card in hand | mission | New `keycard_held` branch first; see BS1 |
| CF-H | minor | Reeves's introduction replays on every re-talk | mission | `cover_return`: "Still here. What can I do for you?" then his hub |

### Files changed

- m02: `scenario.json.erb`; inks + JSON `m02_phone_agent0x99`, `m02_npc_security_guard`, `m02_closing_debrief`, `m02_npc_asset`; this log; `scripts/ink_runtime_check/missions.json` (m02 block: `keycard_held`).
- Engine (separate commit): `public/break_escape/js/systems/player-damage-interrupt.js`, `minigame-starters.js`, `unlock-system.js`, `npc-combat.js`, new `npc-attack-guard.js`; tests `test/js/player-damage-interrupt.test.mjs` (2 added), new `test/js/npc-attack-guard.test.mjs` (4).

### Checks

| Check | Result |
|---|---|
| Ink compile | 15 compiled, 0 failed |
| tagdiff vs HEAD (95665799) | 22 structural differences in 4 files, all this round (debrief 4, Reeves 4, Val 9, HaX 5) |
| Validator | 0 INVALID; warnings the same set as round 1 (indices shifted); doors OK; graph regenerated |
| dialoguelint | unchanged, 0 errors |
| Rendered JSON assertions | round 1's 40 pass; round 2 checks (no OPTIMAL, diary pointers, task title, keycard mapping, credits, Ghost tile `whenAvailable`, readable lanyards) pass |
| inkcheck + loopcheck | 58 states × 2, 0 failures |
| reopencheck | 0 problems |
| Node suite | 271/271 |
| Rails | 491 runs, 0 failures, 0 errors, 1 skip |
| Browser | none this round: the confirmation run should check the keycard toast and the aim showing, lanyard pickup and inventory click, the Ghost tile before and after the deal, Val after a fight, Reeves's re-talk, and CF-D/CF-F with a hostile Val |

### Spoken lines (old → new)

Changed: none.

New (4):
- Val (`after_fight`): "You've got a nerve, coming back to me. It's all in my log."
- Reeves (`cover_return`): "Still here. What can I do for you?"
- HaX (debrief, no manifesto): "Ghost will have done the same sums. Different cell, different weapon, identical arithmetic."
- HaX (debrief, no invoice): "Zero Day Syndicate. Our analysts traced Ghost's exploit back to them after you left. They picked St. Catherine's out of 214 hospitals."

Running total for the loop: 11 changed, 19 new.

### Round 2 confirmation fixes (F1–F4)

| # | Class | Fix |
|---|---|---|
| F1 | m02 | `general_advice`: the burned-and-not-past-Val branch adds "Her Security Office is at the west end of the main corridor. The server-room door is inside it." when the card is held; the `keycard_held` branch moves ahead of `doors_nudge`, so it is no longer shadowed |
| F4 | m02 | The BS-y nudge is gated on `!inspected_asset_post`; a second mapping for a player who has read the post log: "…You've read their post's log. Name them first." |
| F2 | engine | `minigameClosedByDamage()` guard on the key-selection "Wrong Key", the PIN "Failed to enter correct PIN." and the password "Failed to enter correct password." toasts (`minigame-starters.js`); the no-framework fallbacks are untouched. Container minigames show no failure toast. Test added to `player-damage-interrupt.test.mjs` |
| F3 | engine | `pin-minigame.js`: `handleEnter` ignores Enter while a check is pending (`checkPending`, cleared in `finally`), and digits/backspace are ignored meanwhile, so the auto-submit plus a manual Enter costs one attempt. New `test/js/pin-minigame-enter.test.mjs` (2 tests) |

Files: m02 `scenario.json.erb`, `m02_phone_agent0x99.ink`/`.json`. Engine: `minigame-starters.js`, `pin-minigame.js`, `test/js/player-damage-interrupt.test.mjs`, new `test/js/pin-minigame-enter.test.mjs`.

Checks: ink compile 15/0 failed; validator 0 INVALID; dialoguelint unchanged; tagdiff vs HEAD 23 differences (one more than round 2, from the reordered branch's condition); HaX inkcheck/loopcheck 16 states, 0 failures; reopencheck 0; node 274/274; Rails 491 runs, 0 failures, 1 skip.

Spoken lines: none (HaX phone and timed texts only).

## Round 3 (final fix pass)

Inputs: blind struggling persona (game 1557, `m02-loop/blind3-struggle/REPORT-summary.md`) and blind "do your best" persona (game 1558, findings passed on by the orchestrator).

| # | Source | Class | Fix |
|---|---|---|---|
| 1 | struggle M4 | m02 | After a fight, walking away from Val's `after_fight` line sends a HaX toast: "Val's done talking to you. Her office door is still the way in: pick it while she's walking away from it." (`conversation_closed:security_guard_patrol`, needs `attacked_guard`, not KO'd, not yet past her). "Remind me where we are" opens with the same advice in that state. Bernie's word no longer works on Val after a fight, so it isn't offered |
| 2 | struggle M5 | m02 | The burn warning was queued behind Gary's chat with his other texts (barks are deferred while a person-chat is open, `npc-barks.js` `_shouldDefer`). The second burn text ("Val can disprove your cover now…") now fires on entering the handover room instead of 11 s into Gary's chat, and the keycard text is dropped (that line carries the route). So only the warning itself waits behind Gary's conversation |
| 3 | struggle M8 | m02 | Press terminal: "Evidence package -- transmits as one bundle, all of it or none:" (unvoiced) |
| 4 | best M5 | m02 | Visitor log: "NIGHT SECURITY SUPERVISOR (plain clothes) -- "posted", declined to sign" (no name). Other documents checked: the rota note names him in Val's hand and her notebook does too; both are Val's, who knows his name, so they stay |
| 5 | best M6 | m02 | Kim's reply to warning 7 re-dated 12 November (item name too), matching "answered four days later"; the warnings run May–November everywhere else |
| 6 | best M3 | not m02 | The cut-off chat is not in the scenario: in game 1558 the phone typeout stopped mid-word ("…the hard way re") and stayed there for about 35 s across 5 state reads (session seq 2557–2567) before the chat closed, inside `ghost_philosophy`, which has no exit tag or mapping. That points at the phone-chat typewriter stalling (or headless timer throttling in the harness), not the ink. Left for an engine look |
| 7 | best M4 | m02 | Kim's escrow question retires once `offline_keys_recovered`; Gary's lanyard request retires once any lanyard is held (`staff_lanyard_obtained`); his "anything reused" question retires once the sticky note is read (`password_hints_found`) |
| 8 | best B1, struggle M11, CF-J | engine | New `minigames/title-screen/title-screen-input.js`: a click anywhere, Space or Enter continues (once, then detaches). The prompt pulses instead of blinking out and adds "Click, or press Space or Enter". `title-screen-minigame.js`, `css/title-screen.css`. Test `title-screen-input.test.mjs` (6) |
| 9 | struggle M2, best M7 | engine | `password-minigame.js`: `submitPassword` ignores a second submit while a check is pending (same guard as the PIN fix). Test `password-minigame-submit.test.mjs` (2) |
| 10 | struggle M1 | engine | Finding: a real player can't reach the inventory under a minigame. The minigame overlay is full-screen at z-index 1500 over the inventory bar's 1000 (`minigames-framework.css:10`, `inventory.css:12`); the tester's DOM `click()` bypassed it. Defence anyway: new `systems/forced-minigame-guard.js`, and both inventory click handlers ignore clicks while a `disableClose` minigame (the debrief, cutscenes) is open. Test `forced-minigame-guard.test.mjs` (5); `engine-fixes-pass4.test.mjs` copies the new module |

### Files changed

- m02: `scenario.json.erb`; inks + JSON `m02_phone_agent0x99`, `m02_npc_sarah_kim`, `m02_npc_gary_whitlock`, `m02_object_press_terminal`; this log.
- Engine (separate commit): `minigames/title-screen/title-screen-minigame.js`, new `minigames/title-screen/title-screen-input.js`, `css/title-screen.css`, `minigames/password/password-minigame.js`, `systems/inventory.js`, new `systems/forced-minigame-guard.js`; tests: new `title-screen-input.test.mjs`, `password-minigame-submit.test.mjs`, `forced-minigame-guard.test.mjs`, and `engine-fixes-pass4.test.mjs` (copies the guard module).

### Checks

| Check | Result |
|---|---|
| Ink compile | 15 compiled, 0 failed |
| tagdiff vs HEAD (5b7b6b89) | 12 structural differences in 4 files, all this round (Gary 6, Kim 2, HaX 4; terminal prose only) |
| Validator | 0 INVALID; doors OK; the new `room_entered:staff_room` text is disjoint from the debrief backstop (`!debrief_played`); the recap line was reworded so the toast doesn't repeat it; otherwise the round 2 set |
| dialoguelint | unchanged, 0 errors |
| Rendered JSON assertions | 40, 0 failures |
| inkcheck + loopcheck | 62 states × 2, 0 failures |
| reopencheck | 0 problems |
| Node suite | 287/287 (one run showed a timing flake in `engine-fixes-pass3`, clean on rerun) |
| Rails | 491 runs, 0 failures, 0 errors, 1 skip |

### Spoken lines

None changed, none added (HaX phone and timed texts, documents and terminal text only).

Loop total: 11 changed, 19 new.

### Round 3 browser check (2026-10-04, game 1559, Sonnet, headless :3001)

PASS: title screen continues on Space, Enter or a click (once); password minigame counts one attempt per submit; HaX toast and recap after the Val fight; press-terminal "one bundle" wording; visitor log unnamed; inventory clicks ignored under a forced conversation. Not completed: credits after the debrief. The run skipped the four VM flags, which `concludeRequires` needs by design. Earlier runs with flags reached the credits, and round 3 did not touch conclusion code.

## Loop closed (3 review rounds)

Final blind runs (games 1557, 1558): no blocker in the game's own puzzles, and both scored fun 4, pacing 3, clarity 4, openness 4, teaching 3. The insider deduction plays as a deduction; Ghost's offer is the best scene. Open, outside m02: E2/P10 respawn at reception after a reload (user decision); the phone typewriter freezing mid-line (engine); identical HaX message timestamps (engine); clicking a pick-up item in the inventory shows nothing (engine); harness `enter` at room-edge doors.

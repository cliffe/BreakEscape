# demo_ops_second_step: build report (unit S-S, wave 1)

Scope: SHOWCASE_PLAN.md sections 4, 7.1 to 7.4, 7.7 to 7.9, contract 8.3.1. No helpdesk, no lock step, no `records_room` or `archive_store`. No `dungeon_graph.*` (the wave-2 T unit writes it, plan R1 m7); the validator was run with `--no-graph`.

## Probes

- **P6** (is there an event when a written-down note is shown?): yes. The sign-in screen emits `pc_signin_shown` and `pc_signin_shown:<pcId>` with `{ pcId, usernames, usernameList, hasPostit }` (`public/break_escape/js/systems/pc-sessions.js:1231-1238`, called from `public/break_escape/js/systems/unlock-system.js:814`; the suffix is added by `_emit`, `pc-sessions.js:365-370`). `see_note` therefore also has a mapping on Ama: `pc_signin_shown:anjali_pc` with `data.hasPostit === true` (scoped to Anjali's PC, because Darren's PC also shows a note after the temper beat). The ink tick in `tell_note` stays as the contract says.
- **P8** (office-life sync budget, validator output): reveal and left-behind globals 2/6; office-life onceOnly mappings 6/10; office-life items 3/4; small keys 23/64; workstation globals 12/24; frustration 2/6; workaround slots 2/4; magnet servings 1/2.

## Validator

`ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb --no-graph` (ink included, the S-I ink has landed): 1 error, 22 warnings.

- The one error is `work: Friendface phone 'Yusuf's phone' ... is not in yusuf_demir's itemsHeld` (`scripts/validate_access_work.rb:80`). It contradicts `docs/ACCESS_AND_NETWORKS.md:828` and `validate_mfa.rb` (a loose owned phone is a warning, "free to take"), and the plan's M7 needs the phone as a room object, because a left-behind item is looked up only among loaded rooms' objects (`public/break_escape/js/systems/npc-needs.js:6147-6160`). Fix belongs in `validate_access_work.rb` (skip an owned phone that has `leftBehindChance`); not touched here (not this unit's file).
- Intended warnings: `lorna_pc` "nobody passes this push step" (7.4); `kiosk` policy "does nothing" (Niamh is exempt, by design, M9); `yusuf_phone` lies loose (M7); `workstation_accessed:darren_pc` fires on some leaves only (M8 needs the short coffee trip).
- Warning for the S-I unit: `ink/ama_owusu.ink:11` `VAR see_note_done` (and every `<task>_done` VAR) is also a scenario global; the validator wants a "// Synced scenario global" comment on those VAR lines. Also `ama_owusu.ink:115` has `#give_item:text_file` after a dialogue line (must come before it).
- Remaining warnings are the standard "need target is in another room" notes for the kitchen, as in `office_life_showcase`.
- `python3 scripts/check_door_alignment.py`: all three connections OK. `tools/check_mapping_index_drift.rb`: 0 scenarios checked (new scenario).

## Away times (7.4 "Who is where")

Not measured in a browser (no run in this unit); estimated from `_expectedAwayMs` (`npc-needs.js:3412-3441`: walk distance over speed, plus the target's `useSeconds`, plus queue wait). Coffee trip: 12 s use at the office machine (a queue of up to three adds up to 24 s) plus a few seconds walking in one room: about 25 to 45 s, under Darren's 90 s threshold, so his screen stays open (M8). Lunch: the kitchen fridge and microwave presets use 15 s and 10 s, which would give about 35 to 50 s in all (under 90 s, so the screen would stay open and M5 would fail). So both kitchen hunger objects carry an explicit `affordance.useSeconds: 100` (the microwave also `capacity: 2`), which makes Darren's and Lorna's lunch trip over 100 s. The threshold stays at 90 s. The Haiku run should confirm both and record the real numbers.

Darren's `social` need goes to the kitchen water cooler (15 s preset, `useSeconds` 40 on the cooler here), about 60 s away, still under 90 s: an extra open-screen chance, harmless.

## Where the plan was wrong or needed a change

1. Loose owned phone: see the error above.
2. `wk_share_login` "Printer's dead. I'll ask Anjali to send it from hers." is 53 characters; a bubble holds 40 (schema error). Shortened to "Printer's dead. Asking Anjali." (30). Contract 8.3.1 quotes the long form; the S-I unit does not use it (the line is scenario chatter).
3. The printer resource cannot share an id or name with its object (`network model` error): resource id `print_service`, name "Print service"; the object stays `office_printer`.
4. NPCs in the office listen for `coffee_call`, `act_midday` and `act_evening`, but the start room is reception, so their mappings only exist once the office has loaded. Each live mapping carries `"fireOnlyWhenLoaded": true`, and `room_entered:office` relays (cooldown 300000 for the needs ones) catch a lever pressed before the first visit. Once coffee (or lunch) has been pressed even once, these relays reset caffeine, thirst or hunger again on every later entry to the Office at least 5 minutes apart. That is deliberate and harmless: it is a recovery path when a window has closed (implementation review R1 minor 7).
5. Thandiwe has no `work` need: with the preset on, a `work` need sends her to the nearest PC with a work affordance, which would be Darren's or Yusuf's.
6. The coffee machine sits at (8, 7), not (8, 8): the office has a south door, and the copied queue cells fell next to it.
7. A needs-based `workstation: true` is written on every owned PC, so `habits.screen` on Darren is read.
8. Positions are by hand from the room size (10 by 10) and the other scenarios; nothing was rendered. Check the room look in the first browser run.
9. `heard_exchange_cooler_chat` is not declared: the cooler exchange is not used here. `kitchen_seen` was left out in wave 1 and added back in round 1 (implementation review B1): see "Round 1 fixes".

## Rule 7

Each of the five passwords is one literal at the top of the erb. Rendered, each appears only in the owner's `creds`, in `credentials.lorna_login`'s item (`lorna_login_card`, Ama's `itemsHeld`) and in the kiosk card's text. No ink, chatter, objective or notice-board text holds one (grep over the scenario folder).

## Unit S-T (wave 2): integration, test, playtest outline, graph

- Integration: the two ink warnings from wave 1 are closed. `give_lorna_card` now tags `#give_item:text_file` before the dialogue line (the bare type form, as `test_ops_mfa/ink/hana.ink` does), and every `VAR` that is also a scenario global carries `// Synced scenario global` (Ama's fifteen, Thandiwe's `act_evening`). `scripts/compile-ink.sh demo_ops_second_step` compiles 7 files with 0 failures; dialoguelint under node 22 gives 0 ERROR lines; the validator's ink step reports "All ink files valid".
- Validator after the loose-phone fix landed in `validate_access_work.rb`: 0 errors, 20 warnings, all of the kinds listed above (the intended `lorna_pc` push, the unused `kiosk` policy, loose `yusuf_phone`, `workstation_accessed:darren_pc`, kitchen need targets in another room, missing recommended fields).
- Dungeon graph regenerated by the validator for this scenario only (`dungeon_graph.{html,json,md}`).
- Away times are still estimates: PLAYTEST.md asks the first browser run to record the real seconds.

## Round 1 fixes

Reviews: `IMPL_REVIEW_R1.md` (1 blocker, 2 majors, 7 minors), `DIALOGUE_REVIEW_R1.md` (4 majors, 10 minors), and the Haiku playtest of Runs A and B (`/data/tmp/scratch/showcase-second_step-playtest/RESULTS.md`, games 185 and 189).

| Finding | Outcome |
|---|---|
| Impl B1: nobody leaves for kitchen targets until the Kitchen is opened (needs only pick targets in loaded rooms; `fireOnlyWhenLoaded` drops a lever pressed before the Office exists) | Fixed as `office_life_showcase` does: `kitchen_seen` global, set by a onceOnly `room_entered:kitchen` mapping on Ama (who is always loaded), with the bark "That's the kitchen. Come back to me and I can send them for coffee." `lever_coffee` and `lever_lunch` answer "Have a look in the kitchen first..." until it is set, so no lever is spent while its targets are unloaded. The Kitchen is reached only through the Office, so both rooms are loaded when a lever works. "What's next?" sends the player to the Kitchen straight after Lorna's card. Each PLAYTEST run opens the Office and Kitchen first; the board lists it. |
| Impl M1: `login_accounts`, `npc_frustration`, `npc_workaround` not tested; the leak scan never saw them | Fixed. Three new cases: M1 (Anjali's note only, no-store), M2 (no note until two failed prints and the writes_down "done"; a third fail hands nothing over), M3 (an unheard share gives `{}`, the share repeats on the next fail, a heard share in the office gives the capture and the line, `sharedLogins`). `run_game` now reads Anjali's note, syncs `printer_off`, fails both printers twice, spends Darren's writes_down, reads his note and spends Yusuf's heard share before the sign-ins. The scanner is given the game (so it can judge an earned note and share); `scan(@log) == []` with no filter. |
| Impl M2: Run C cannot earn Darren's password before lunch | Fixed in PLAYTEST: Run C opens the rooms, switches the printer off and waits for the note before pressing lunch, and says lunch fires once only. Run B no longer presses lunch. |
| Impl minor 1: temper note read "once he is back at the desk" | Fixed: the task ticks when he writes it; the note is read at lunch (Run C). |
| Impl minor 2: an expired push left waiting writes no row | Fixed in Free play: send twenty times for the expired row. |
| Impl minor 3: `promptsSent` and the merged row untested | Fixed: M4 asserts `promptsSent` 1 then 2, one `mfa_prompt_sent` row with `n == 2`. |
| Impl minor 4 / dialogue m5: nothing said when Darren gives in | Fixed: the `pestered` mapping is now onceOnly and carries the bark "He approved just to make it stop." (merged into one mapping so the validator's same-pair onceOnly warning does not fire). office-life onceOnly mappings 6/10 (the validator's V8 figure; Ama's kitchen and pestered mappings are not counted as office-life ones). |
| Impl minor 5: the cake can spoil M5 | PLAYTEST line: keep the cake until M5 is done. Not changed in the scenario: the cake is the office-life magnet beat and a free-play toy. |
| Impl minor 6 / dialogue m4, m6: untrue barks ("His screen is still open", "kettle") | Fixed: "Darren's popped out. If it's a quick coffee, his screen stays open."; "a phone by the coffee machine". |
| Impl minor 7: office relays keep firing on later entries | Documented in item 4 above. |
| Dialogue M1: midday "What's next?" order wastes the one lunch | Fixed: fob and phone come before lunch; the fob line names the coffee lever; lunch: "Darren takes a long lunch. Tell me to send them to lunch, then go straight to his PC."; the pestered line says his password is on his sign-in screen note. |
| Dialogue M2: Yusuf's said-aloud line says nothing aloud | Fixed: "Use my login, Anjali. Here it is." The suggested "...I'll read my password out." is 58 characters; a bubble holds 40 (schema error) and "password" trips V11, so the shorter form is used. Start line "Printer's dead. I'll ask Anjali." |
| Dialogue M3: Thandiwe's choice reads backwards | Fixed: "Can I see what I looked like from your side?" |
| Dialogue M4: the burst's meaning never said | Fixed: Thandiwe "Then flag the odd one out, a burst of requests to Darren in the small hours."; Ama's recap "Those night-time requests mean someone else had Darren's password first." / "They were trying to wear him down." |
| Dialogue m1: `# speaker:npc` with no `Name:` prefix, so dialoguelint measures 0 lines | Not changed. The two sibling showcases use the same convention; the reviewer asks to fix all three or the lint, not this one alone. Line lengths were checked by hand instead: the longest spoken line is 127 characters (the joined short_version line the reviewer asked for), every other under 100. |
| Dialogue m2, m3, m7, m10, recap P5, short_version join | Fixed as suggested ("Ask me for it."; "one way"; Darren's open-screen recap; "Today you'll see"; one recap line per beat; joined summary). |
| Dialogue m8: Anjali's `login_aloud` never said | Removed. |
| Dialogue m9: one printer, "send it from hers" | Yusuf now asks Anjali to send it off for him (log in as him), which does not need a second printer. |
| Playtest: M3 not reached in Run A (player not close enough) | Ama's bark and "What's next?" now say to stand right beside Anjali; PLAYTEST says to wait there before he arrives and that the share repeats on each failed print while the printer stays off (`share_login` is a repeating kind, tested in M3). |
| Playtest: printer to note took 182 s, not 90 s | PLAYTEST now says up to about three minutes and records the measured times. |
| Playtest: after Start > Sign out Darren's PC reopened as a desktop | Explained, not a scenario fault: Sign out ends the player's claim; Darren's own screen stays open while he is away on a short trip, so the next click claims it again. PLAYTEST says so. If the orchestrator reads it as an engine bug it belongs to the workstation layer, not this folder. |
| Playtest: reload found Anjali back at her desk | PLAYTEST says either outcome is right. |
| Playtest: phone world click opens Friendface; the fob digits needed typing | PLAYTEST now says to use the pane's "Check Yusuf Demir's phone" and to type the digits if they are not filled. |
| Playtest: card toast "Lorna Easton's password is in Lorna's sign-in card." | Left: it is the engine's keyring toast for a held credential, and it names no value. |
| Playtest: "What did that show?" repeated in one converse | Left: the recap returns to the hub by design; the repeat was the converse loop choosing it twice. The recap is now half as long. |

**Live check of the B1 fix** (keyless server on :3023, fresh game 197, headless, stopped after): before the Kitchen was opened, "Send them for coffee." answered "Have a look in the kitchen first. That's where the water is, and Anjali won't move without it." and `coffee_call` stayed 0. After walking Office, Kitchen (`kitchen_seen` true), back to Reception, one press set caffeine or thirst on Lorna, Darren, Anjali and Yusuf in the same tick (needs log tick 187), and all four left within a second; Anjali went to the Kitchen cooler and left her fob (tick 191). Log: `/data/tmp/scratch/showcase-second_step-fix1/session-197.jsonl`.

## Round 2 fixes

Source: `planning/IMPL_REVIEW_R2.md` (N1 to N3) and playtest 2 (`/data/tmp/scratch/showcase-second_step-playtest-2/RESULTS.md`).

| Finding | Outcome |
|---|---|
| N1 reload: coffee and lunch gates open, Kitchen not loaded | PLAYTEST reload bullet now says to open the Office and Kitchen doors again before a lever. Engine side not touched. |
| N2 onceOnly budget | Round 1 table now quotes the validator's V8 figure, 6/10. |
| N3 dialoguelint measures 0 lines | Unchanged, deferred by agreement (shared prefix change). Lint: 0 ERROR, "Totals by rule: none", still 0 lines measured. |
| PT2 1: a lever press sometimes sends nobody for about two minutes | Cause not proven. Likely the 60 s skip (`FAIL_COOLDOWN_MS`, `QUEUE_COOLDOWN_MS` in `npc-needs.js`) on a target a member of staff just gave up on. Fixed as a scenario fault of feedback: Ama now adds "Give them a minute or two. If nobody moves, ask me again."; PLAYTEST says the same. |
| PT2 2: first click on Darren's PC after lunch opened his desktop | Not a fault: his screen stays open for about two minutes, then locks. PLAYTEST Run C step 2 says to wait; that click is M8. |
| PT2 3 and confusing: no Lorna rows in Run C, Thandiwe asks for them | The empty result is right: the approvals log holds only this game's rows, and Lorna's unanswered requests come only from M4 (Run A). A fresh Run C alone writes Darren's and Niamh's rows. Thandiwe's line is now "Look for requests nobody answered, and any approval."; PLAYTEST says which rows depend on which beat. |
| PT2 4: Yusuf's "Captured" tile in Friendface | Not a fault: the engine's tag for a password the player already holds (overheard). No value is shown. Documented in PLAYTEST. |
| PT2 5: pane wording | PLAYTEST now quotes "Note this number before you open the phone." and "That number did not match. The request was cancelled." |
| PT2 6: Ama and Lorna barks unverified | Documented: barks are speech bubbles, not in the toast or log, so check by eye. Still unverified by a run. |
| PT2 7, 8, 9: late toasts, repeated converse choice, habits block | Added to PLAYTEST "Things a tester sees that are not faults". |
| Leak check exits 2 with the listed `--signin` entries | Cause: the entries named second-step sign-ins (they earn their desktop through the step, not a successful login answer, so they match no row) and an open-screen claim (`via: claim`, unconfirmable). `#n` counts every successful `POST /login` answer including claims. Only Niamh's kiosk sign-in is such a row. PLAYTEST now lists one entry, `--signin niamh_doherty@visitor_kiosk#1`, Run C only. Re-run on the three playtest 2 captures: games 198, 202, 203 all "VERDICT: no leaks found." (203 with the Niamh entry). |

Checks: ink compile of `ama_owusu` and `thandiwe_moyo`; validator 0 errors, 20 warnings (graph unchanged); mapping drift 0 failures; dialoguelint 0 ERROR; scenario test and golden compare: see the commit reply.

## Unit S-8b (wave 3): helpdesk append (SHOWCASE_PLAN.md 7.5, `ops-helpdesk` on main)

An append: scenario fields, ink, objectives, new test cases and PLAYTEST beats M11 to M13. The existing test cases pass unchanged.

- **Fields.** `helpdesks.it_desk` (`thandiwe_moyo`, `questions`, `minCorrect` 2, `maxTries` 3, `resets` password and mfa, labels "Staff number" and "Line manager"). `creds.recovery` (`staff_no`, `manager`) on Lorna, Darren, Anjali and Yusuf; Niamh has none (`mfa: false`, not enrolled). `creds.resetPassword` on Darren only. The form `darren_form` is in `darren_pc`'s contents. The three log events join `mfa_log.events`. New aim `afternoon_helpdesk` (order 3) with `reset_password`, `reenrol`, `desk_refuses`; new globals `darren_badge_left`, `helpdesk_it_desk_result`, `reset_password_done`, `reenrol_done`, `desk_refuses_done`.
- **Clues.** Darren's staff number is on `darren_badge` (an `id_badge`, `leftBehindChance` 1, `revealOnGlobal darren_badge_left`, readable: shown on his desk whenever he is away). The kitchen `staff_board` (readable notice board) holds Darren's and Yusuf's line manager and Yusuf's staff number. Lorna's and Anjali's answers sit in no text (below).
- **Ticks.** Thandiwe's hub has two choices, each into its own knot carrying `#helpdesk_request:it_desk`, then a verdict knot reading `helpdesk_it_desk_result`; on "granted" it tags `reset_password` or `reenrol`. `desk_refuses` is Ama's last mapping on `helpdesk_answered:it_desk` with `data.result === 'blocked'`. The tasks gate nothing. Ama's "What's next?", recap and short version gained lines.
- **Validator.** 0 errors, 24 warnings (20 before, plus 4). The four new are the planned ones: `helpdesk 'it_desk'`: the player cannot find `staff_no` and `manager` for `lorna_easton` and for `anjali_rao` in any readable text. Reason: no beat resets them, and Anjali's fob must stay live for S8c; Lorna is the M13 target and must stay unanswerable. The office-life budget moved to items 4/4, reveal and left-behind globals 3/6, small keys 24/64.
- **Checks.** Ink compile 7 files, 0 failed; dialoguelint 0 ERROR; `tools/check_mapping_index_drift.rb main` 0 failures (nothing differs from main in the mappings it indexes); graph regenerated by the validator for this scenario only.
- **Leak scan.** A new last case passes every answer of a played helpdesk run (M11 to M13, grants, stale password, own phone, the stop) through the scanner, given the game, and asserts no findings. The 8.4 step 5 S8c exception does not apply yet (no lock steps). The older whole-run scan case is unchanged and still passes.
- **Rule 6 grep.** Each recovery answer and Darren's reset password appears only in the erb's literals, `creds`, the badge and board texts (Darren's and Yusuf's answers; the reset password nowhere readable) and the test's constants.
- **Browser.** Every beat is reachable by clicking; the form is also on Darren's desktop. A Haiku Run D is still to be played.

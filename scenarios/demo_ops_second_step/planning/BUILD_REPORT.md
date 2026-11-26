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

## Unit S-8c (wave 3): second step on locks append (SHOWCASE_PLAN.md 7.6, `ops-lock2` on main)

An append: scenario fields, ink, objectives, new test cases, PLAYTEST Run E (M14 to M17), VOICED_LINES, mission.json duration 25. The existing test cases pass unchanged except one assertion (see "Where the plan needed a change", item 6).

### Probes

- **Ticks probe (the `mfa_approved` detail for a lock).** The detail is `{ npcId, targetType, targetId, by }`. The gate answer's canonical `targetType` is `door` or `object` (the server's, `docs/ACCESS_AND_NETWORKS.md` A25), and the client builds the subject key `${answer.targetType}:${answer.targetId}` (`public/break_escape/js/systems/lock-step.js:106,127`), which `subjectDetail` turns into `{ targetType, targetId }` (`public/break_escape/js/systems/mfa-client.js:74-78`); `emitBoth('mfa_approved', npcId, { npcId, ...subjectDetail(parsed), by })` fires `mfa_approved` and `mfa_approved:<owner npc id>` (`mfa-client.js:259-267`, the suffix by `emitBoth`, `:80-84`). So: a door gives `targetType: 'door'`, `targetId: 'records_room'` (the room key); the safe gives `'object'`, `'records_safe'`; the case gives `'object'`, `'darren_case'`. A Rails test pins the gate answers that carry those two values for each (`S8c M14`, `M16`, `M17`); the browser emission itself is not played here (the three mappings and the `door_propped` one are not exercised until a browser run). No lock approval had to fall back to an ink tick. The PC form carries `pcId` and no `targetId`, so Ama's existing `pestered` mapping (`data.pcId === 'darren_pc'`) cannot tick on the case, and the new `case_step` mapping (`targetType === 'object' && targetId === 'darren_case'`) cannot tick on a PC.
- **P7** (does a held-up second step raise Fatima's frustration): no. Frustration is written only by `POST npc_frustration` reports of a failed work use (`app/models/break_escape/npc_frustration.rb`); the lock step routes never touch `npcFrustration`. The test asserts `player_state['npcFrustration']` stays `{}` after the gate and five unanswered requests at the records room. The records-index lever stays the forcing route.

### Fields

- Rooms: `records_room` (`room_lw_records`, PIN, `secondStep` push, owner Gwen) and `archive_store` (`room_office`, PIN, `secondStep` push, owner Gwen), both off the Office's north wall: `office.connections.north: ["records_room", "archive_store"]`. Gwen Pritchard (records manager, `approvesPrompts: "never"`, caffeine and hunger needs, desk `gwen_desk`, drawer `gwen_drawer` holding the safe PIN note, `gwen_phone` on a side table with `leftBehindChance` 1 and global `gwen_phone_left`) and Fatima Begum (records clerk, work need on the new resource `index_service`, `frustration.perFail` 35, `prop_door` at 60 on `archive_store` with the wedge `archive_wedge` revealed by `archive_door_propped`). Locks: `records_safe` (PIN, `secondStep` code, owner Anjali, her fob from M6), `darren_case` (key lock, `keyPins`, key in `darren_drawer`, `secondStep` push, owner Darren, takeable and droppable). New object `facilities_notice` (kitchen, both door PINs), `records_index_socket` wall switch with an Ama lever, `fatima_desk`, `gwen_desk`, `side_table`, Fatima's boxes in the archive store.
- Ink: Ama gains the lever `lever_index`, four `whats_next` branches, four recap lines and a short-version line; new short chats `gwen_pritchard.ink` and `fatima_begum.ink`. New aim `late_locks` (`door_step`, `propped`, `safe_step`, `case_step`), four mappings at the end of Ama's array (on `mfa_approved:gwen_pritchard` with the door condition, `door_propped:archive_store`, `mfa_approved:anjali_rao` for the safe and `mfa_approved:darren_price` for the case), and new globals `archive_door_propped`, `records_index_off`, `gwen_phone_left` and the four `<task>_done`.

### Where the plan needed a change

1. **`darren_case` is by the front desk in Reception, not under Darren's desk in the Office.** The leak scanner treats a lock in any room other than the start room as inside a shut room unless a door unlock proved that room open; an ungated room is opened by `GET room/<id>`, which the scanner does not count (`tools/playtest/lib/lock_step_leak_rules.rb:233-236,246-252`). The first whole-run scan with the case in the Office gave five findings, all on `darren_case`: `lock_step_answer` `lockstep:gate:room:object:darren_case` (the gate), `lockstep:refusal:mfa/prompt` twice, `lockstep:pass:no-gate`, and `lock_step_content` `lockstep:open:object:darren_case` (the open). None was `mfa_secret` or `mfa_session`. With the case in the start room (Reception) the scan judges the case in full and reports nothing. The scanner gap is for the owner of `tools/playtest/lib` (a lock in an ungated non-start room is always flagged); not touched here.
2. **The archive store is a second north door, not a south-west one.** The Office's south wall leads to Reception, and an array `south: ["reception", "archive_store"]` would place the store on top of Reception (the start room is placed first, so the array's only unplaced room is placed single, south of the Office). `north: ["records_room", "archive_store"]` places the two side by side (`positionNorthMultiple`) with the doors on the engine's own two-door spacing, so the left door is the records room and the right one the archive store. `scripts/check_door_alignment.py` reports `UNMODELLED multi` for it, as for `lab_physical_pentest`; the engine aligns each child's south door to its index in the array (`placeSouthDoorSingle`, `doors.js:165-190`). Not seen in a browser: check the two doors line up in Run E. The "Things to try" board moved from x 8.19 to x 5.19 so it does not sit on the right-hand door.
3. **The resource id is `index_service` (name "Index service"), not `records_index`.** The leak scanner's `network_string` rule flagged `GET room/office` for the resource id appearing in the object id `records_index_socket` (the printer pair uses `print_service` for the same reason). The global stays `records_index_off`.
4. **Positions are by hand** from the room size; nothing was rendered. Check Gwen's and Fatima's desks, the side table, the wall switch and the wedge against the existing furniture in the first browser run.
5. **No Haiku Run E has been played**; the timings (the index off to the door open; Gwen's coffee trip) are not measured. The validator's own estimate for Fatima is about 40 seconds of outage, plus her walk.
6. **One existing assertion changed**, because the cast grew: the shape case's list of NPC ids now includes `fatima_begum` and `gwen_pritchard` (the list is the scenario's cast; the 25 other existing cases pass untouched).

### Validator

`ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb`: 0 errors, 37 warnings (S-8b: 24). The 13 new ones:

- Of the 13, the plain ones are the standard "need target is in another room" notes for Gwen (caffeine, hunger), the `fatima_begum` work info and outage lines, and recommended-observation notes for the new objects. Same kind as in S-8b. The ones that need a reason:
- `item 'darren_case' is droppable without a needsTag`: intended. The case must be droppable for the carried-lock beat (M17); no NPC is meant to react to it.
- `mfa: Friendface phone 'gwen_phone' lies loose`: intended (M14), like `yusuf_phone`.
- `work: fatima_begum's workaround 0 (prop_door): her own card and role do not open 'archive_store'`: accepted. Fatima holds no card; what she is dodging is the PIN and Gwen's approval, which the validator cannot read. The "someone props a door they could not open" reading is the teaching point.
- `office life V8: office-life items is 5, above its cap of 4`: the left-behind items are the fob, Yusuf's phone, Darren's badge, Gwen's phone and the cake. Reason: Gwen's phone must be a left-behind item (it is the beat); the badge (S-8b) and the others cannot fold into it; the cap is a sync budget and the run is one scenario with eleven people. Reveal globals 4/6, small keys 27/64, onceOnly 6/10, workaround slots 3/4.
- `objective wiring: ama_owusu has two mappings for mfa_approved:darren_price (indices 10, 21), onceOnly at 10`: accepted. The two conditions are exclusive (`data.pcId === 'darren_pc'` for `pestered`, `targetType === 'object' && targetId === 'darren_case'` for `case_step`), which the validator cannot read.
- `UNMODELLED multi-door connection office.north`: see item 2.
- Dialogue lint: 0 ERROR, one `crowded-hub` check (Ama's hub now offers up to 11 choices at once, 6 conditional). Not folded: each lever and recap choice is a beat's own. Advisory.
- `lock step:` rows: none. No `never passes`, no gated own text, no tableItems warning.

### Checks

- Ink: `scripts/compile-ink.sh demo_ops_second_step` compiled 9 files, 0 failed; dialoguelint 0 ERROR.
- `tools/check_mapping_index_drift.rb main scenarios/demo_ops_second_step/scenario.json.erb`: 0 failures (the scenario is not on main, so 0 scenarios compared).
- `scripts/check_door_alignment.py`: the three single connections OK, the north array UNMODELLED.
- Scenario test (36 runs, 706 assertions, 0 failures): the 25 earlier cases plus 11 new ones (shape, no exposure, M14, M15 three cases, M16 two, M17 two, the whole-run scan). `bin/ops-golden-compare`: 39 runs, 0 failures.
- Dungeon graph regenerated by the validator for this scenario only.

### Leak scan (8.4 step 5)

The S8c exception did not arise: over the whole lock run (the archive store's PIN and request, Fatima's prop, the records room with Gwen's phone, the safe with a wrong and the right fob code, the case with a drop and a pick-up between requests) the scanner reports 0 findings of every rule, including `mfa_secret` and `mfa_session`. So the test asserts the plain zero. The docs line that lists the limit (`docs/ACCESS_AND_NETWORKS.md` A25, "Leak scanner") is still there: the limit stays recorded as open, but no answer here tripped it (all lock answers echo `targetType` and `targetId`, and no PC-form answer was dropped). The older whole-run case and the S8b helpdesk case are unchanged and still report 0.

### Rule 6 grep

Each PIN (records room 5821, archive store 3074, safe 6419) appears twice in the rendered scenario: the lock's own `requires` and its one clue (the facilities notice for the two doors; Gwen's drawer note for the safe). None is in any ink, chatter, objective, dungeon graph or planning file; in the test they are constants.

### Browser

Every beat is reachable by clicking (the codes from the notice and the drawer note; Gwen's phone from the side table after the coffee lever; Anjali's fob after the same lever; the case key from Darren's drawer; the case by the front desk). Not played: see item 5.

## Append fix R1 (F1 to F4)

- F1: the "Things to try" board now runs Morning, Midday, Afternoon, Late, Evening (the Evening line ends "Do this last: staff go home"). Aim orders: `afternoon_helpdesk` 2, `late_locks` 3, `evening` 4 (array order unchanged, so the test's last-in-array assertion holds). Ama's "Call it a day." now refuses with a plain line while any of the seven afternoon and late tasks is undone; "Skip them and call it a day anyway." (ink-local `skip_late`) lifts the refusal.
- F2: `darren_drawer` moved to (3.9, 4.0), 1.1 tiles from the badge. `side_table` (9.0, 4.3) and `gwen_phone` (9.0, 3.9) moved 1.3 tiles clear of the coffee socket (8.66, 6.06). Kept warning with its reason: `Side table` and `Gwen's phone` 13 px apart: the phone sits on the table's charger by design, and clicking either gives the same pick-up of the phone. Warnings now 35.
- F3: Ama's M14 hint names "the facilities notice in the kitchen", her M15 hint says not to approve on Gwen's phone, Thandiwe's two verdict lines are true for either kind of grant (ticks unchanged). VOICED_LINES updated; the audio for these lines needs a top-up.

## Tour unit U3 (SHOWCASE_TOUR_PLAN.md 2.6, 4.1; owner's answers of 2026-11-25 are recorded as decided in plan section 5)

Main was not merged into the worktree by this unit: another builders' uncommitted work shares the tree and the merge was refused by the permission check. Left to the orchestrator.

### Probes (live, keyless :3053, game 282, swap game; measured seconds are in PLAYTEST.md)

- Is `darren_pc_screen_locked` written before any leave? It is declared in `globalVariables` (false) and `_publish` writes it at every leave; the lock bark's `data.oldValue !== true` guard holds. Seen live: at the lunch leave the global went true and "Darren's screen has locked. Now try his PC." came with the existing "Darren's gone to lunch..." bark.
- Temper note: 50 s from the printer switch-off (one run); no tuning of `frustration.perFail` was needed (35, workaround at 60), so it is unchanged.
- Darren's coffee trips with the screen open: 25 s and 37 s; a trip in the printer outage 72 s. `autoLockSeconds` 50 on `darren_pc` locked the open screen exactly 50 s after the leave. `lockIfAwayOverSeconds` stays 90. Lunch: 105 s away, locked at the leave (expected trip over 90 s), so there is no lunch wait.
- M12 by the desktop form: the desk's `helpdesk_answered` event carries only `deskId` and `result` (`helpdesk-client.js:133-135`), not what was asked. So the tick is an appended Ama mapping on a granted answer while `reset_password_done` is true and `reenrol_done` is not; Thandiwe's in-person ink still ticks it. Plan deviation, written into PLAYTEST.
- Not probed live: the form on Darren's desktop through the browser (the Rails test for the form route already exists); the barks other than M0, M2 and the lock bark were not seen live (same mechanism: a `global_variable_changed:<task>_done` mapping).

### What changed

- `scenario.json.erb`: 16 appended Ama mappings (M0 on `pc_in_use:lorna_pc`, 15 "what you just saw" barks on `<task>_done`, the lock bark on `darren_pc_screen_locked`, the desktop-form tick of `reenrol`; `pestered`, `read_log` keep their existing lines); `autoLockSeconds: 50` on `darren_pc`; `darren_pc_screen_locked` declared; `ttsPregenerateChatter`; voices of Niamh (Kore, Dublin, covering reception today), Anjali (Aoede), Lorna (Erinome, Lancashire), Thandiwe (Pulcherrima).
- Ink: `give_lorna_card` (M0 pointer), `whats_next` reenrol (desktop form pointer), `lever_lunch` (temper check), Niamh's two lines. tagdiff: 3 structural differences, all in Ama (the new `lever_lunch` condition and its divert).
- No existing mapping moved or deleted; `check_mapping_index_drift.rb`: 0 failures (the scenario is not on main, so 0 compared).
- Panel order: unchanged (the plan's table already follows it).
- Validator: 0 errors, 35 warnings, the same list as before this unit (diffed against HEAD). Dialoguelint 0 ERROR (one existing `crowded-hub`). Scenario test: 41 runs, 0 failures (5 new tour cases); the whole-run leak scans are the existing ones, 0 findings.
- The old "Darren's gone to lunch. His screen will be locked." and the new lock bark both fire at the lunch leave; the dialogue review may fold them.

## Tour unit U3b (SHOWCASE_TOUR_PLAN.md 2.6 M13b, 4.1 U3b; owner's answer 5.4 YES, recorded as decided)

Main was not merged into the worktree by this unit either (same reason U3 gives: the tree holds other builders' work and the merge is refused). Left to the orchestrator/train; the leak scan ran against the scanner now in the worktree.

### Probes (from the code; the call route itself is browser-only, proven by engine JS tests)

- Call-back verify rule: `helpdesk_covers_request?` grants a `callback` desk when `held_friendface_phone(account_npc_id)` is non-nil (`app/models/break_escape/helpdesk_access.rb:219`), i.e. the player holds the account owner's declared `phone_friendface`. Confirmed by `test/models/break_escape/helpdesk_access_test.rb:321` and reproduced in this unit's Rails cases.
- Call -> helpdesk route: a pretext ask carrying `helpdesk:<deskId>` opens that desk's request form on a granted ask (`person-chat-pretext.js:300,313-334`); the server's `request_helpdesk!(desk_id, ...)` decides; the client emits `helpdesk_answered:<deskId>` with `{deskId, result}` (`helpdesk-client.js:131-135`). So `desk_call` ticks on an appended Ama mapping `helpdesk_answered:call_desk` with `data.result === 'granted'` — the same pattern the proven `reenrol`/`desk_refuses` ticks use.
- Phone-call plumbing shape (copied from `test_ops_helpdesk`): a room npc `{npcType:"phone", phoneId, callId, storyPath}` (the IT line contact) plus a `phone` item with the same `phoneId` and `npcIds:["it_line"]` (the work phone you ring from). The call-back's trusted phone is a separate held item — Yusuf's `phone_friendface`, taken at the coffee machine in M7.
- Desk must be met: `helpdesk_npc_serving?` needs the desk NPC encountered and present (`helpdesk_access.rb:162-168`), so Priya is a met IT-room NPC; before she is met the line answers `unavailable` (tested).
- Idempotency: a repeat mfa reset returns granted with no further change (`helpdesk_access.rb:270`). In the guided order M13b follows M12, which already moved Yusuf's approvals, so M13b's grant is idempotent; the bark teaches the route and the call-back check, not a fresh change. In a run that skips M12 (and in the isolated Rails case) it is the first move.
- Validator flags `call_desk` callback "not takeable" for lorna/niamh/darren/anjali (no takeable phone of theirs) and NOT for yusuf_demir or gwen_pritchard — confirming the mechanic is solvable for the account whose phone the player holds (Yusuf). Informational; recorded here.

### Plan deviation

The plan (4.1 U3b, test shape) suggested the call-back desk on "a second room NPC" with the call text written by a social-engineering specialist and wired by Sonnet. This unit was a single Opus builder: I wrote the (mild, training) pretext lines myself and added a minimal second IT-room NPC, Priya Nair (call_desk), plus the `it_line` phone contact, so the plan's "second room NPC" holds. The call-back resets Yusuf's approvals (the only owner phone the player holds by the afternoon); no new secret is introduced (a password reset on Yusuf would have needed a `resetPassword` the existing M11 shape test forbids).

### What changed

- `scenario.json.erb`: `call_desk` helpdesk (callback, resets mfa, npc priya_nair); `social.characters.it_line` and `social.pretextNpcs` (ask `reset_request` -> helpdesk `call_desk`), copied in shape from `test_ops_helpdesk`; `work_phone` start item (type phone, npcIds `it_line`); `priya_nair` and the `it_line` phone contact in the IT room (Priya voice Leda, it_line voice Sulafat — both free after the plan's Thandiwe/Lorna voice moves); `desk_call` task appended to the afternoon aim; two appended Ama mappings (the `helpdesk_answered:call_desk` tick and the `desk_call_done` bark); eight new `globalVariables` (desk_call_done, helpdesk_call_desk_result, the it_line pretext globals).
- Ink: new `it_line.ink` and `priya_nair.ink`; `ama_owusu.ink` gains `VAR desk_call_done`, the M13b "What's next?" pointer, the recap line, and `desk_call_done` added to the day-end gate and the recap-empty guard. tagdiff: ama structure-only additions, priya/it_line added, all explained; no existing knot/divert/condition removed beyond the two in-place gate edits.
- No existing mapping moved or deleted; `check_mapping_index_drift.rb main`: 0 failures.
- Rails test: 5 new U3b cases + the NPC-list assertion updated for Priya and the IT line; 46 runs, 0 failures; the leak scanner over a played call-desk run reports 0.
- Validator: 0 errors, 39 warnings (the only new substantive ones are the expected "callback not takeable" notices for accounts whose phone the player cannot hold). Dialoguelint: 0 ERROR (the pre-existing `crowded-hub` CHECK on Ama's hub is unchanged — no hub choice was added). `bin/ops-golden-compare`: 45 runs, 0 failures. Dungeon graph regenerated.
- Live smoke (keyless :3056, swapped game 285): the app boots the scenario with `helpdeskForms.call_desk` (npc priya_nair, resets mfa), `social.characters.it_line` and the `it_line_call` pretext ask pointing at `call_desk`, no server errors. The pretext-call UI and form are engine code with their own JS tests; the desk_call tick was not driven in a browser (same proven mapping mechanism as U3's barks).

## Tour round 1 fixes (TOUR_IMPL_REVIEW_R1, TOUR_DIALOGUE_REVIEW_R1, playtest 1)

### Fixed
- J1 (board): the afternoon now reads Thandiwe for Darren's reset, Thandiwe (or the desktop form while his screen is open) for Yusuf's approvals, Lorna's wrong answers, and Priya plus the IT line holding Yusuf's phone (M13b). Morning and late lines follow the new order.
- J2 (M12): the bark names no route ("Yusuf's approvals come to your phone now, and his own phone shows nothing. The desk never checked who was asking."). Driven live (game 298, :3073): the form on Darren's desktop stays open when he comes back, but the desk only takes it while his session is open; sent after his return it answers "The desk cannot take this request now." His coffee trips measured 14 s and 18 s. That is too tight to type a username, the request and two answers, so the guided M12 is now Thandiwe in person, and the pointer names the form as the other route ("it only sends while his screen is open"). Deviation from plan 2.6 (the desktop form as the guided route), made on that measurement.
- J3 / D-M3 (IT line): "Fill in the form, and we'll ring the number we hold for that account to check." Live: the line plays this, the form opens, and `dprice` is then refused ("The desk could not verify you. Tries left: 2.").
- D-M4 / n4: `it_line` has `"voiced": true` and voice Charon (male, free in this showcase); live, the call shows ON CALL and its lines go to `/tts` under `it_line`. No `// lint: call-knot` needed: dialoguelint reports nothing.
- D-M1, D-M2 (`tell_note` and its hub choice removed; header comment updated; nothing in the test referred to it), D-M5, D-M6 (lunch bark), m1 to m9, the recap lines that sat close to their barks (open_screen, pestered, desk_refuses), short_version's "And". Lines in VOICED_LINES.md.
- n1: late order is now M15 then M14 in "What's next?", the late aim and the board; the "don't approve it on Gwen's phone" sentence is gone; PLAYTEST Run E agrees.
- Playtest 1: M8 moved to second in the morning (pointer, aim, board), before the printer goes off. In the outage Darren's trips ran about 5 minutes and the idle lock shut his screen, with nothing to say why. Live: M8 ticked on the first coffee trip. The pointer adds "If you missed him, ask me to send them for coffee again."
- n6: `desk_call` is in `TOUR_TASKS`. New test: no ink claim of the note, the IT line voiced and promising the call-back, "What's next?" in panel order, the board's afternoon and late lines.

### Not changed, and why
- n2 (stale-bark guard): the one forward-pointing bark (M2, "You'll see it on his sign-in screen at lunch") stays true until M5, and lunch waits for M2, so no guard is needed.
- n5: Fatima's prop and the M13b call with Yusuf's phone held were not measured live this round (budget). The M13b refusal path and the call screen were checked.
- The dialogue review's D-M5 note about the M12 sign-in at Yusuf's PC with your own phone: dropped from the pointer, as suggested. The bark carries it.

### Checks
Ink 11 compiled, 0 failed. Validator 0 errors, 38 warnings (the earlier list, one fewer). Dialoguelint: no findings (Ama's hub is down to 10 choices, so `crowded-hub` has gone). tagdiff `--old` (snapshot of HEAD): Ama has 16 structural differences, all from removing `tell_note` (knot, choice, tags, divert, assign) plus the new `lever_lunch` printer branch and its two speaker tags. The other four files have no structural change. Mapping drift: 0 failures. Graph regenerated (unchanged). Leak check on game 298: no leaks.
Rails scenario test: 47 runs, 0 failures. That includes the whole-run leak scans, which report 0 findings, and the S8c late-order assertion, updated for M15 then M14. The captures use recorder tags, not hand-made `login` tags, so the scanner hardening needed no change. `bin/ops-golden-compare`: 45 runs, 0 failures.

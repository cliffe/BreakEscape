# m06 office life: handover

## Orchestrator status (build phase, after build review round 4)

- Branch build/ol-m06 (worktree .claude/worktrees/p-ol-m06), main merged at 78272befc (main dae6589ee). D116 answered: all seven recommendations (option a).
- Slices done: 3 (machines, extras, Dani's needs, trouble global, credits), 4 (Tomasz laptop, lock threshold 22 s, handover sheet, phone lever, pizza with 2 servings), 5 (pools, three exchanges, Lerato and Tomasz ink), slice 6 reduced to Lerato's seat (fixed R1). Slice 7 poses need no art. Fixes after each review round are logged in BUILD_LOG.md and each REVIEW_BUILD_R<n>.md "Outcomes".
- Dialogue review (DIALOGUE_REVIEW_OL.md): B0 M1 m9, all fixed. Later line change: exchange 2 Tomasz "I did. Two officers, very quiet." (R1 m5).
- Build review rounds: R1 B0 M2 m6 (fixed), R2 B0 M1 m3 (fixed: hostile leash), R3 B0 M1 m2 (fixed: coffee queue cells dy 0, fridge useFrom), R4 (delta review) B0 M0 m2 (fixed by the orchestrator: q.mjs moved to tmp/delete, print-errand notes closed).
- Next: R5 as a delta review on `git diff 41111ed70..<tip>` plus REVIEW_BUILD_R4.md; minors only after R5. Then finish the walkthrough regression from step 18 (LIVE_R3_WALKTHROUGH.md reached step 17, office life not exercised; next run should talk to Dani/Lerato/Tomasz with the poll-before-interact rule and check hostile/KO too).
- Still unproven live: 10.2 item 1 (three minutes at post, 5 tries), natural Tomasz trips on unloaded games, LIVE_S5 no-DOM-root anomaly, reload of a body near the coffee point.
- Voicing: 55 new clips (SPOKEN_LINES.md), none generated. AC0 relayed the user's "Implement these using your best judgement" for voicing after review and dialogue review are clean; the orchestrator left voicing to AC0 because an agent relay is not the user's own approval in this session.
- Engine notes for the integrator (BUILD_LOG.md): NPC room label takes the first room rectangle holding the feet (npc-behavior.js:996), so the floor's bottom row reads as the checkpoint; needs.state().atPost reads true for hostile or knocked-out NPCs.
- Gotchas: setFPS is window.game.physics.world.setFPS(20); new-game.rb needs --unlock security_checkpoint --unlock trading_floor --unlock blockchain_lab (plus irina_office); create games one at a time; stop servers by PID; node_modules in the worktree is a symlink to the main repo's (an agent removed it once; restored).


Pools, three exchanges, two short conversations (`ink/m06_npc_lerato.ink`, `ink/m06_npc_tomasz.ink`), heard_ globals. 55 clips, none voiced (SPOKEN_LINES.md). `grumble_gone` dropped. LIVE CHECKS NOT DONE (builder hit its context limit): one fresh game (new-game.rb with --unlock security_checkpoint --unlock trading_floor; scripts in the build scratchpad live/, lib.mjs boot/goRoom), then (1) walk onto the floor and confirm a coffee pair shows a pool line, (2) talk to Lerato and Tomasz once each: conversation opens, goodbye ends cleanly (#exit_conversation), game resumes, (3) an exchange only if reachable by play (irina_arrested needs the Irina detain route; exchange 1 needs Dani and Tomasz at the coffee point together, Dani goes after his first talk), else state why. Server 3096 was started and stopped by PID. Write results to LIVE_S5.md. Then the build review loop. Never stage dungeon_graph.*.

# Build status (slice 4 live checks: all done, see LIVE_S4.md part 3; ready for the build review loop)

Done and recorded: trip table and threshold 22 s, phone lever, handover sheet (prints once after the first Irina talk, planned text only, no reprint on a second talk or after a reload; an untaken page is gone after a reload, as PLAN says), workstation parity (both open, same text as main), lerato_phone useFrom (nominal cell on the desk edge, engine snaps it 8 px east to an open cell, Lerato reaches it), pizza (servings 2 to 0 with both extras; the engine removes the empty box, PLAN L1 corrected; reload with the box on the floor restores servings and the box; east-door stall not reproduced in three runs, cause unproven, no scenario fix applies). No engine change. Open: `grumble_gone` pool cannot play with two servings and two eaters (spare). Server 3096 stopped by PID at the end; start another per measurement-recipes section 1.

# Build status (slice 4 live checks: threshold and phone done, pizza partly, rest TODO; see LIVE_S4.md)

Commits: fe9a73feb, a21b37bc5, 8d59ba7cb (threshold 22, pizza servings 2). Done: items 1 (trip table, threshold), 2 (not applicable), 3 (phone home and away 5/5). Partly: 4 pizza (mid floor drop works, extras only, Dani ignores; servings to 0, grumble_gone, reload and a door-drop stall NOT yet checked). TODO: 5 handover sheet (h1.mjs written in build scratchpad live/, never run; position (1.1,7.0) still a guess), 6 lerato_phone useFrom wall check, 7 workstation parity, then final LIVE_S4.md update. Server 3096 was started from this worktree, stop it by PID (check ss -ltnp). Pizza is reachable in the lab only via waypoints round the conference table in scripts.

# Build status (slice 4, in progress: static built and committed fe9a73feb, live checks mostly NOT done)

Done: scenario.json.erb has Tomasz's laptop (workstation, owner, readable text, textVariants locked / away), his habits.screen {lockChance 0.2, lockIfAwayOverSeconds 30 PLACEHOLDER}, answersPhones, the `conversation_closed:irina_volkova` print mapping (producer floor_copier, forget), `tomasz_handover_sheet` (after daily_trading_report, position 1.1,7.0 is a GUESS for the tray), `lerato_phone` (useFrom dx0 dy1 is a GUESS), `floor_spare_phone` (emit desk_phone_ring:lerato_phone, no hint text), lab `pizza` (magnet tempt 60, servings 3, perPerson 1, no announce), globals tomasz_laptop_owner_away / _screen_locked / _accessed, tomasz_handover_sheet_shown, pizza_servings 3. Static checks pass (validator 0 errors, 45 warnings; summary diff only lerato/tomasz/trader; lock diff empty; positions diff only added planned rows). No Lerato print errand: PLAN gives none.
Validator warning 32 ("pizza has magnet but is not a droppable item the player holds") is expected: the box is takeable in the lab; prove drop live.

Live so far (keyless server 3096 from this worktree, games created with new-game.rb ... --unlock security_checkpoint --unlock trading_floor --unlock blockchain_lab; without unlocks needs.state is null): Tomasz caffeine trip, game 7727: expectedAwayMs 14478, real away 14.7 s (4 of 4 so far), owner_away global follows atPost, screen stayed open each time. Scripts in build scratchpad live/: t1.mjs (trip timing: `node t1.mjs <gid> caffeine|hunger <tries>`), t2.mjs (phone lever: `node t2.mjs <gid> home|away <tries>`, written, never run). Run scripts with nohup to a file and poll with Monitor until-loops; never pkill -f or pgrep -f in a Monitor (matches itself).

TODO live: hunger trip numbers; set lockIfAwayOverSeconds with 3 s margin (coffee 14.5 expected; fridge and pizza and phone-answer trips unmeasured; with lockChance 0.2 an over-threshold trip locks only about 1 in 5); home-dwell cut-short test (Tomasz has no home use in the plan: use a work-need NPC in test_needs_sims, or report not applicable); phone lever home and away; pizza (take from lab, drop on floor, only extras tempted, servings count down, Dani/Priya ignore, reload); handover sheet prints once after first talk with Irina (needs conversation with irina_volkova; check tray position) and reads as planned text only; trading_workstation and blockchain_workstation unchanged; laptop read while attended / away / locked; LIVE_S4.md write-up. Server on 3096 stopped at handover (restart per measurement-recipes section 1).


Slice 3 static build done and committed on build/ol-m06 (see BUILD_LOG.md). Live checks 1 to 4 done and passing (LIVE_S3.md, extras' positions fixed in ec16c0b90). Next: slice 4 (laptop text, workstation owner/screen habit, handover sheet, print mapping, phones, pizza); re-run the home-dwell test then. Never stage dungeon_graph.* (they show modified in git status).

# m06 office life: handover (plan phase; plan review rounds 1 to 6 done, plan ready for the user's answers)

## Status after round 6 (supersedes the older notes below)

- Rounds 4 to 6 were delta reviews on the planning tier (the deltas touched the secrets list): R4 B0 M2 m5, R5 B0 M2 m9, R6 B0 M0 m3. Every finding fixed; outcomes in REVIEW_R4.md to REVIEW_R6.md. Plan review loop closed; no B or M open.
- Changes since round 3: the six other trading-floor pc sprites are declared as `decor: true` twins after `lerato_desk` (a claim hides same-image twins), with a tile-home fallback for Lerato; Lerato is a night floor coordinator, Tomasz an evening app-support lead (app tickets only); 3.3 widened (VM, backend and password surface, deposits and withdrawals, hold or held, client escrow, "ops", the FCA and the player's cover, routines and tells, dates, prices, on-call names); `tomasz_handover_sheet` declared after `daily_trading_report`; 10.2 item 6 and 10.6 corrected.
- Next: the user answers QUESTIONS.md Q0 to Q6, then build.

## Status at ccf78348e (older)

- PLAN.md and QUESTIONS.md written and rewritten standalone after each round. No separate ANALYSIS.md: the cast audit is plan section 2.1.
- Rounds (all full reads on the planning tier): R1 B0 M6 m3 (REVIEW_R1.md, reviewer stopped at its context guard), R2 B0 M5 m10, R3 B0 M3 m8. Every finding fixed; outcomes in each REVIEW file.
- Design now: only Dani moves (caffeine only, found at post first by a first-talk break plus a `room_entered` mapped break, cooldown 240000 ms, both gated `!globalVars.floor_staff_ko`). Priya pinned by her ink (`ink/m06_npc_analyst.ink:124`, `:127`, `:323`, `:347`). Dani owns no PC (owner is holding under D78); Q1 option (b) is the exception, with plan 3.4 as its build check. Extras Lerato (desk, desk phone) and Tomasz (client-support lead, readable laptop `type: "laptop1"`, `position: "as-type:laptop"`, answersPhones, one handover sheet printed by command into a single copier slot). Pizza magnet tempts only the extras. `floor_staff_ko` trouble global; existing HaX loop still sets `cover_strained` for Dani and Irina KOs. About 60 clips.
- Next: R4. R3 changed what text may carry (secrets list 3.3, Tomasz's job and printout), so R4 is a delta review sent to the secret-handling reviewer tier, given `git diff 54bb60169 ccf78348e -- scenarios/m06_follow_the_money/office_life/PLAN.md` plus REVIEW_R3.md. If R4 has no B/M, R5 is a delta review. Stop at R5 unless a blocker is open; leftover M/m go in the plan as open with reasons.
- Reviewer brief must say: read-only, never open SecGen XML, Vagrantfiles, SecGen scenario files or the m06_*_field_guide items; Irina, the guard, Kemal, Satoshi stay put; office life never sets cover_strained; VM flags stay required.


Branch `plan/ol-m06`, worktree `.claude/worktrees/p-ol-m06`, base main `3e00651a8`. Plan phase only: no build, no servers. Env for rake/validator: `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`. Never stage `dungeon_graph.*`.

## Done

- Stage 0 complete: `BASELINE.md`, `validator_info_lines.txt`, `v1_summary_base.txt` (11 NPCs, no needs), `baseline_locks.json` (13 locks, 0 gates), `positions_base.txt` (39 rows), `v6_office_lines_base.txt` (0 clips).
- Time of day resolved: evening at a 24-hour exchange (guard "Evening", `ink/m06_npc_checkpoint_guard.ink:49`; "Tonight", `ink/m06_opening_briefing.ink:30`). Not a QUESTIONS item.
- `trading_workstation` (TRADE-WS-01, `scenario.json.erb:1977`) and `blockchain_workstation` (CHAIN-WS-01, `:2316`) are plain `pc`s: no `lockType`, no owner, no contents, `host` is only a taskbar label (schema `:5495`); m06 declares no networks, no sign-in PCs. So neither is a network host and `offWhen` is allowed on them. Neither is in the walkthrough.
- A reader digest of the skill references was attempted and not finished; its notes are at `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/ol-m06/HANDOVER.txt` (line refs for mapping-patterns, gotchas, recipes, checklists, m05 PLAN headings `scenarios/m05_insider_trading/office_life/PLAN.md` :1 to :407, m02 sync table :346 to :364, m03 plan is `docs/achitechture/M03_OFFICE_LIFE_PLAN.md`). Rendered scenario JSON: same folder, `m06.json`.

## Facts gathered (for ANALYSIS.md)

- NPC records (`scenario.json.erb`): opening_briefing_npc :870, director_netherton :903, agent_nightshade :922, agent_0x99_handler :939 (start room, phone/hub, all HaX mappings), closing_debrief_person :1683, checkpoint_guard :1767 (patrol :1788, los :1799), irina_volkova :1869 (itemsHeld 3, key source, required `meet_irina`, badge cloned while she talks `ink/m06_npc_irina_volkova.ink:225`), trader_npc :1951, blockchain_analyst :2290, satoshi_minder :2433 (patrol, challengeOnSight :2488), satoshi_nakamoto :2595.
- Dani (`trader_npc`, (5,7) trading floor, sprite `dani_okonkwo`, Puck "jittery on caffeine") and Priya (`blockchain_analyst`, (6,4) lab, `priya_raghavan`, Leda): optional tasks only (`question_the_trader`, `question_the_analyst`), no itemsHeld, no NPC chatBackground, no `Background[` lines, no own eventMappings. HaX holds `conversation_closed:trader_npc`/`:blockchain_analyst` (set `trader_spoken`/`analyst_spoken`) and their KO mappings. V2 (`scripts/validate_office_life.rb:436`) is clear for both: no required task, no conversation-mode mapping, not key sources. D78 class: free (open-conversation rule holds). Only location lines are first-meeting narrator lines (`ink/m06_npc_trader.ink:36` "watches six price charts", `ink/m06_npc_analyst.ink:42` "bent over a wall-sized monitor"), so found-at-post-first via a first-talk break covers them. Dani's `:106` "walked Irina out past my desk" is past tense.
- `cover_strained` is read by Irina's badge trust threshold (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi. Office life must NOT set it. Use a new trouble global `floor_staff_ko` (set by appended HaX mappings on `npc_ko` of trader_npc, blockchain_analyst, irina_volkova and the two extras; cooldown-only, not onceOnly) as the single `offWhen` on floor machines.
- `find_transaction_records` collects `blockchain_evidence` (Priya's write-up); `daily_trading_report` is a clue (`entropy_wallets_known`). No office-life text may carry wallet names or substitute for either.
- Trading floor Tiled (`public/break_escape/assets/rooms/room_hce_trading.json`, x,y in tiles, y = bottom): items photocopier1 (1.1,7.6), coffee_station1 (2.3,7.6), mini_fridge1 (3.1,7.5), 8 chair-grey-4; table_items pc10 (5.9,3.5) = trading_workstation, pc6 x3 (7.0,3.5)(1.3,5.2)(6.6,5.2), pc8 x2, pc11 x2, laptop1 (2.8,3.6) unique, phone1 (7.6,3.6), phone3 (7.6,5.2); `hce_trading_station1` (6.1,7.7) is in the `tables` layer (cannot be claimed, `core/rooms.js:2139`). Lab (`room_hce_lab.json`): pc10 (1.5,4.4) = blockchain_workstation, pizza_boxes1 (2.8,9.2) in items, no machine. Script: scratchpad `ol-m06/tiled.py`.
- Desk phone: `deskPhone: true`, `officeType: "desk_phone"`, owner, within 1.5 tiles of owner post; a spare phone with `triggerOnInteract: [{type: emit_event, event_name: "desk_phone_ring:<id>"}]` is the lever (`scenarios/test_needs_sims/scenario.json.erb:238` to `:262`). `answersPhones: true` (schema `:4941`) makes an idle colleague in the same room walk over from the second ring.
- Magnet shape: `scenarios/test_needs_sims/scenario.json.erb:93` to `:104` (`affordance.satisfies ["hunger","social"]`, `magnet {tempt, servings, perPerson, announce, newsRadius}`, `<id>_servings` declared, `grumble_gone` pool). Omit `announce` for seen-only.
- Print habit (schema `:4420`): fetch carries the page back to the needsHome object, so give print habits only to NPCs whose home is an object.
- Extras: Lerato Dlamini (`lerato_dlamini`, Gacrux) and Tomasz Wisniewski (`tomasz_wisniewski`, Algieba); atlases have 8 sit, use, phone and drink frames each (as do Dani and Priya), so no art. Voices unused in m06. Coordinator (AC0) asked: put final cast picks at the TOP of QUESTIONS.md; do not use the Office Life Tour cast (Chidi Okeke, Jun Watanabe, Graham Whitfield, Agnieszka Duda, Zainab Hussain).
- `creditsOverlay` has no conditional lines (schema `:126` to `:133`), so no KO credits line is possible; say so in the plan.

## Draft design (write into ANALYSIS.md then PLAN.md)

Tier: 2 in existing rooms plus two ambient extras, no new room. Cast: Irina, guard, Kemal, Satoshi, lobby records stay put, no needs.

- Dani: free, moved. Home tile {trading_floor,5,7}. Needs coffee (coffee_station) and hunger (mini_fridge, pizza); leash `needsRooms [trading_floor]`. Found at post first: `initial` 100, slow decay, plus a once-only first-talk break on his own `conversation_closed:trader_npc` (delayMs 2000) setting coffee and hunger into range. Owner of `trading_workstation` with `habits.screen` and readable `textVariants` (lore only). No answersPhones, interests or workarounds.
- Priya: same pattern; home tile {blockchain_lab,6,4}; `needsRooms [blockchain_lab, trading_floor]`; owner of `blockchain_workstation`, readable lore.
- Precondition to verify in build slice 3 (cannot measure now): `<pc>_owner_away` follows owner `atPost` when needsHome is a tile and the PC is elsewhere. Fallback: drop that NPC's screen, never move its post.
- Lerato (extra, late-desk market operations): home a declared `pc6` at (7.0,3.5) with seat; declare the other two pc6 twins `decor: true`; owns desk phone `phone1` (`lerato_phone`). Coffee, hunger. Print fetch errand (never forgotten).
- Tomasz (extra, evening settlements clerk): home `laptop1` (owner, screen habit, readable lore), `answersPhones: true`; print habit with one forgotten printout (lore page) on the copier, triggered once on `conversation_closed:irina_volkova`.
- Machines: `officePresets: true`; declare `coffee_station`, `photocopier`, `mini_fridge` by base name, `offWhen: "floor_staff_ko"`; coffee capacity 2 with chatter pool and overhearRadius.
- Levers: L1 leftover pizza (declare lab `pizza_boxes` as takeable, droppable magnet, servings 3, perPerson 1, no announce, `pizza_servings` non-monotonic); dropping it where Dani or Priya see it draws them off post and opens their screen window. L2 spare phone `phone3` rings Lerato's phone; when she is away, Tomasz crosses the floor to answer and his laptop window opens.
- Exchanges (3, `heard_`): Dani+Priya at the coffee point (late shift); Lerato+Tomasz gated `irina_arrested`; Lerato+Tomasz gated `assets_seized`. All also `floor_staff_ko: false`.
- Sync: workstation globals 9, heard_ 3, pizza_servings 1, dropped magnet 1, office items 2 (pizza, printout), reveal 1, onceOnly about 4, extras KO globals 2.
- Voicing estimate about 54 clips (pools, exchanges, two short extras' ink files).
- QUESTIONS draft: Q0 cast picks; Q1 readable screens on existing workstations vs new screens; Q2 pizza magnet vs cake vs none; Q3 phone lever with Tomasz covering vs proof only vs drop; Q4 move Dani and Priya vs Dani only vs none; Q5 extras' KO uses `floor_staff_ko` not `cover_strained`; Q6 extras get short conversations vs none.

## Next steps

1. Write `ANALYSIS.md` (cast audit table with the lines above, rooms and machines, secrets list, beats, tier), `PLAN.md` (m05 section order), `QUESTIONS.md` (cast picks first).
2. Plan review R1 on the planning-tier reviewer, then rounds per the skill to R5; `REVIEW_R<n>.md` with B/M/m; rewrite PLAN.md standalone each round.
3. Commit with explicit paths after `git diff --cached --stat`.

## Files touched

This folder only: `HANDOVER.md`, `BASELINE.md`, `v6_office_lines_base.txt`, plus the Stage 0 files committed in `bcff36bf9`.

# Resume note: awareness E8 to E20 build (started 2026-10-29)

Plan `planning_notes/security_awareness_course/implementation/00_README.md`; log `implementation/BUILD_LOG.md` (waves, agents, decisions, review rounds). Wave 1: engine ENG-01/09b/09d, ENG-03a/03b, ENG-04, ENG-09a/11 (Sonnet, worktrees, merged by the orchestrator, bridges run on main after merge); content E8 fragments and ink, general_v2 items, WP-15 and core_17 annual (opus48, shared tree). Next: E8 wiring (Sonnet), then the review phases (design, dialogue, playtests) on E8 before E9/E10.

# Resume note: video pipeline m01 trailer (started 2026-10-29)

Log `docs/video/TRIAL_LOG.md`; style `docs/video/GUIDELINES.md`; recipes and open gaps `docs/video/recipes/README.md`; skills `.claude/skills/video-*`. Status 2026-10-30: m01 60 s trailer v6 final, exported to cliffe/hacktivity-videos master (d0f8357). Review page https://claude.ai/artifact/HhdmENxRVcGuCa5BiZS5Gd. Hacktivity shell title intro + launch curtain: PR cliffe/Hacktivity#77. Lip-sync fix 1f56ea4e. Next: m01 stills pack refresh and export; m02 dry run of the skills; 30 s teaser cut-down. Haiku/Sonnet wherever possible (user). Rails env needs BE_DB_USER=root etc. (see the log).

# Resume note: awareness course plan and implementation briefs (planning branch ccr-8675a21c-vu1k0k)

Plan folder `planning_notes/security_awareness_course/`; **build briefs in its `implementation/` (start at `implementation/00_README.md`, §12 readiness)**, written for fresh Sonnet agents and checked over five adversarial review rounds (`implementation/reviews/`). Kids game pitch `planning_notes/kids_cyber_game/`. Public repo: keep Hacktivity at feature level.

# Resume note: VM weave fixes (started 2026-10-23)

Brief `docs/agents/VM_WEAVE_FIX_BRIEF.md`; source `scenarios/VM_INTEGRATION_REVIEW.md` (bbc7e25c6), R1–R39 approved except R10 (standalone-only; Hacktivity deployment is the focus). Baseline commits before edits: d12120486, 4501b7c26, 6aebbed38; SecGen 7c2773df1. Running: engine (Opus), game m01–m03 / m04–m06 / m07–m08 / m09–m10 (opus48), SecGen m04+m08 / m09 / m10 (opus48). Status 2026-10-23: DONE. All approved items landed and browser-checked: engine 74810fe06; m01 711851e39, m02 e5dac40ea, m03 49ca8dcd3, m04 3caa47eae, m05 e794996a1, m06 84f8ec099, m07 1f292b5f2, m08 364c44673, m09 d8a78bab6, m10 25c50194a; SecGen 7c2532511 (m04, m08), 2b0e1b4bc (m09, m10); review status 5afd7576e. Rules corrected by the user: diegetic + required are the hard rules. Open: the user's SecGen build checks; a real end-to-end VM playtest; TTS for the changed voiced lines (user's cost call); m10 hatch kill-config excerpt only shows on the proximity label.

# Resume note: backlog batch (started 2026-10-22)

Brief `docs/agents/BACKLOG_BATCH_BRIEF.md`. Done 2026-10-22: commits 5a8bf225 (engine), c98b7e55 (m06 tracer board), cf16ef61 (m02 Gary occlusion off); 13 backlog entries removed. Open follow-ups are in `docs/IDEAS_BACKLOG.md` under "Follow-ups from the backlog batch" (owed browser checks for route-around and combat, Node 20 for the harness, m06 blind run, Gary's mapping).

# Resume note: social-engineering build (started 2026-10-21)

Brief `docs/agents/SE_BUILD_BRIEF.md`; plan and log `planning_notes/phishing_and_social_engineering/IMPLEMENTATION_PLAN.md`, `SE_BUILD_LOG.md` (its "Resume" section holds the current status).

# Resume note: finale m09 + m10 (started 2026-10-20)

Brief `docs/agents/FINALE_BRIEF.md`; log `scenarios/FINALE_DEV_LOG.md`; pending `scenarios/FINALE_DECISIONS_PENDING.md`. Outputs under `planning_notes/overall_story_plan/mission_initializations/finale/`, `.../m09_digital_archaeology/`, `.../m10_full_disclosure/`.
Plan: phase A inventory (carry-over m01–m04, m05–m08; VM shape) → stage 0 joint for both missions + finale arc doc → stages 1+2, 3, 4+5, 6, 7, 8, 9 per mission (author + ≥3 review rounds; milestone cross-reviews after 3, 5, 8) → AGENTS.md improvement loops. User answers F1–F4 in the log (all endings kept; SecGen drafts, m08 exports, teaser slot, stage-doc commits approved).
Status (2026-10-21, stage 9): stages 0–8 closed for both missions (last cb97a2fb). Stage 8: reviews + helper files + STAGE_8_RULINGS.md in planning_notes/.../finale/; fixes in m09 CONTRACT §15, m10 CONTRACT §11, FINALE_ARC §22 (stage 9 handover: asset list first; mappings; texts files m09 texts/, m10 texts/BARKS_AND_TEXTS.md). VM answers in finale/STAGE_8_VM_ANSWERS.md (opus48 only; Opus 5.5 never reads it): m10 has three target machines; second flag terminal per mission bound to the same VM (m01 precedent); Tomb Beta early peek accepted (user), salvage-cage property label added. Running: stage 9 builders (m09, m10 scenario.json.erb + mission.json), Sonnet agent for m01–m08 exportGlobals (58) + F5 ink changes (commit only those hunks; m01 erb has other sessions' edits). Then: opus48 VM wiring pass, validator/door/dungeon checks, walkthrough, then AGENTS.md loops (playtests, dressing, lighting, POV, characters after user OKs art scope, lab sheet, audio after TTS count). Pending for user: F9 SecGen build. README_scenario_design.md '||' sentence: fix at stage 9 (file has other sessions' edits).

# Resume note — m07 and m08 full passes (pass 5, started 2026-10-13)

Same process and rules as m05/m06 below (user, 2026-10-13: run concurrently, no user input; blocking items go in each mission's `DECISIONS_PENDING.md`). Briefs `docs/agents/M07_PASS_BRIEF.md`, `M08_PASS_BRIEF.md`. Started: stage-1 regression playtest and alignment review cycle 1 for both. m05 is at dialogue cycle 3 review + room dressing; m06 at struggling-run fix browser check.

# Resume note — m05–m08 full passes (pass 5), status 2026-10-14

All four run without the user's input; anything blocked is in each mission's `DECISIONS_PENDING.md`.

- **m05, m06, m07: every unblocked stage done** (alignment → puzzle chains → scenario design → dialogue → dressing → lighting → playtests incl. a blind struggling run and fixes). Each has a "do your best" prompt for the user: `docs/agents/M05_/M06_/M07_BLIND_PLAYTEST_PROMPT.md` (and M04's).
- **Waiting on the user:** POV chat backgrounds (metered Gemini: m05 D17, m06 D10, m07 D-POV); character picks; first-room sign-offs (m05 D15 Halloran's lab, m07 U13 operations floor, m08 R1 lobby); SecGen checks (each mission's U-items, esp. m08 U1 addenda: whether the VM account names Nightshade); engine items (each file's E/D items; backlog in `docs/IDEAS_BACKLOG.md`).
- **m08: every unblocked stage done** as well (lighting closed, blind struggling run A to the credits with the mole deducible from evidence, fixes browser-checked). Prompt: `docs/agents/M08_BLIND_PLAYTEST_PROMPT.md`.
- Lessons: playtest skill gotcha on NPC combat state (D10 was harness-induced); dressing skill traps on NPC tap frames and top-left reach; never `git stash` in the shared tree (in all briefs).

# Resume note — m05 and m06 full passes (pass 5, started 2026-10-13)

Running alongside m04's pass, without the user's input (user, 2026-10-13): anything needing the user goes in each mission's `DECISIONS_PENDING.md` and work moves on. Briefs `docs/agents/M05_PASS_BRIEF.md`, `M06_PASS_BRIEF.md` (no VM-content summaries: a safety check stopped the orchestrator writing them; reviewers judge only that flags are required and woven in). Stage order as AGENTS.md "Iterating": regression, alignment, puzzle chains, scenario design, dialogue + dressing, lighting, POV, characters (parked for picks), playtests and blind runs. Started: regression A and alignment round 1 for both.

# Resume note — m04 full pass (pass 5, 2026-10-13): all stages done except the user's blind run

Brief `docs/agents/M04_PASS_BRIEF.md`; log `scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`. Stages closed:
- alignment (4 rounds)
- puzzle chains (4)
- scenario design (2)
- dialogue (3 cycles)
- room dressing (7)
- lighting (4)
- POV backgrounds (all 9 rooms, 19 Gemini calls)
- characters (7 new; HaX glow-up option A in every mission)
- struggling-player run, its fixes, and a final targeted check

Route driver: 33 routes. The user's blind run: `docs/agents/M04_BLIND_PLAYTEST_PROMPT.md` (report → `PASS5_BLIND_A.md`).

Pending for the user, in `scenarios/m04_critical_failure/DECISIONS_PENDING.md`:
- sign-offs: the first POV room (P1);
- engine: L1 fire effect, L2 hue-preserving glows, L3 validator `||` check, E1 dotted paths, E2 pause hostiles during cutscenes;
- SecGen checks.

# Resume note — m03 pass 2 (2026-10-13): complete

Brief `docs/agents/M03_PASS2_BRIEF.md`; log `scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md` "Pass 2". Later (user): lab sheet, audio, engine triage, SecGen.
- Dialogue: 5 cycles, signed off (ship), plus blind-run fixes 1-2. Route driver scripts/ink_runtime_check/m03_routes/ (27 routes).
- Room dressing: 7 cycles, layout final (room_zds_* maps). Lighting: 4 cycles, closed. POV backgrounds: 4 rounds, all 7 rooms, day/night via chatBackground conditions.
- Characters: Victoria, Danny, Ffion Rees, Terry Mott (Black British) with own art, visemes from talk, walk sprites, frames reviewed (33 strips + round 2 re-alignment). Nightshade = renamed male_scientist_v2; HaX = agent_hax.
- Engine today (all user-approved): lighting L1 variants, L2 white-map, L3 torch, E4 cones above light map, tour flags, chatBackground conditions, toasts reading-time lifetime, RFID denial hold + door_unlock_failed, KO body on reload.
- Terry: night on-sight challenge (talk your way out), lockpick catch → hostile; Perfect Stealth = never seen.
- Blind runs: B (struggling) complete; A4 ("do your best", user-run) reached the credits: 0 blockers, 0 majors, 8 minors, fixed in 408e0805, 7745ec6f, 4b6acad7. PASS2_STEALTH_CHECK.md: the A4 fixes pass in the browser; the lockpick catch forces a fight (user: fine, it's winnable); Terry's clock threats reworded (157dae9b). Route driver now has "reload": "page" (only synced globals survive), 27 routes.
- TODO (user, 2026-10-13): check m04's VM against SecGen (puzzle review F2): does root on bms_jump_server show a temperature-rewriting "calibration override", and do the four flag names match HaX's texts? HaX's line was softened to the in-game "charge-ceiling override" meanwhile; restore the stronger claim if the VM has it. Also check (puzzle review R2-6): that the ProFTPD *backdoor* guide offered after m04's scan flag fits what the FTP flag involves, and the "fake rack status page" (erb ~311, ~930). Done outside this session (the safety check stops agents reading the XML).
- TODO (user + orchestrator, 2026-10-13): m03 lab sheet VM stages. The lab sheet (`scenarios/m03_ghost_in_the_machine/labsheet.md`, copied to HacktivityLabSheets) has the scan, FTP, price list and distcc stages written from the in-game text and field guides only, marked "not checked against the VM". Auto mode's safety check stopped this session reading the SecGen XML for them, so the user runs that step in a normal session, writing to `scenarios/m03_ghost_in_the_machine/LABSHEET_VM_STAGES.md`. Then merge it into labsheet.md and the HacktivityLabSheets copy together.
- Not pushed (branch ahead of origin by ~70 commits).

# Resume note — room POV chat backgrounds (2026-10-11): COMPLETE

All committed. Engine: person-chat falls back to the room's `chatBackground`. Skill `.claude/skills/room-pov-background/` (+ pov_prep.py, pov_chat_preview.py, pov_diff.py, chat-background-shot.sh). Backgrounds with moody volumetric lighting for every room of m02 (12), sis01 (3), lab_tesseract_trials (11), sis02 (3), m01 (13): 42 rooms. Decisions in docs/agents/POV_BACKGROUNDS_PENDING.md (all answered).
Rules for new missions: every room; run after room dressing and lighting; first room of a new setting needs the user's sign-off; haze from Gemini; day missions use the daytime relight; screen-lit rooms glow, no beams; realistic, not cartoony.

# Resume note — TTS move to Gemini 3.8 (2026-10-08/09)

DONE for m01, m02, sis01, sis02, lab_tesseract_trials: every requestable line on gemini-3.8, committed (see the Log in `docs/agents/TTS_38_MIGRATION.md`). Engine eb0ff353 + 4d1f734c. Not pushed. Next missions use the brief's runbook; m03–m06 need the v2 HaX wording first, m05–m08 their `{player_name}` lines. Orphan and superseded 2.5 clips archived in `~/tts_orphans_2026-10/`.

# Resume note — lighting pass 2: m02, sis02, sis01, m01 (2026-10-08)

Brief: `docs/agents/LIGHTING_PASS_BRIEF.md`. Log: `docs/agents/LIGHTING_LOG.md` (dated heading per mission). Plans: `scenarios/<mission>/LIGHTING_PLAN.md`.
Scratch: session scratchpad `<mission>-<role>/` subfolders (lost at session end).
- m02: DONE, committed eda5423a (brownout verified from the conversation).
- sis02: DONE, committed dfac2abc. Engine committed 273d6261.
- sis01: DONE, committed ac923d31 (engine 5c8efcfc, 352c106b first).
- m01: DONE, committed b105f391 (engine c0092c83, a4ec046e first).
- lab_tesseract_trials: DONE, committed 96fd31ec (engine 2f228f81 first).
- PASS COMPLETE (2026-10-08): m02 eda5423a, sis02 dfac2abc, sis01 ac923d31, m01 b105f391. Engine 273d6261, 5c8efcfc, 352c106b, c0092c83, a4ec046e. Tour tool 8f52fa74. Skill SKILL.md not updated (user has uncommitted edits there).
- lighting.js: one editor at a time; m02 engine work first, sis02 emitters after.

# Resume note — room lighting (2026-10-08)

Log: `docs/agents/LIGHTING_LOG.md`. Five rounds done on m02 plus the back-wall fix; committed 2026-10-08 (engine, skill and docs, m02 config). Skill: `.claude/skills/mission-room-lighting/`. Next: other missions, ideas in docs/IDEAS_BACKLOG.md "Lighting".

# Resume note — The Tesseract Trials (lab_tesseract_trials), started 2026-10-06

Brief: `docs/agents/TESSERACT_TRIALS_BRIEF.md`. Log: `scenarios/lab_tesseract_trials/DECISIONS_LOG.md`.
Loop: design (Opus, DESIGN.md) → 3 adversarial review rounds (alignment + design-review lenses) → implement → puzzle-chains + dialogue reviews → Sonnet playtests → fix until clean.
Status (2026-10-06): Keyholder Trials complete and dressed. Engine E1-E3, E6-E10 fixed (3cfada8b; E9 was the harness, a4a102f0); pathfinding doorway waypoints + corner clearance (99cb5cab) and NPC registration race fix (ba3e0bdd); room dressing rounds 1-3 committed (5b29ea83 last), 80 PixelLab gens, balance 4144. Remaining for the user: audio (Schreuders lines first), E4/E5 deferred, the half-filled project-summary doc (delete or finish?), Cliffe's 3 failed PixelLab characters to delete by hand, m01 encrypted-archive approach (flag station takes the click).

# Resume note — pass 4 (editorial, m02–m08)

Updated 2026-10-02. Brief: `docs/agents/PASS4_BRIEF.md`. Log: `scenarios/PASS4_EDITORIAL_LOG.md`.

## Done
- Lab sheets committed (HacktivityLabSheets 38f5d96), SecGen m06 committed (e5a3eba19; the user's own `.claude/skills/convert_hackerbot…` edit left uncommitted). Not pushed.
- :3000 restarted (log `tmp/server-3000.log`; note `kill -USR2` killed it, so restart with `BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server -b 0.0.0.0 -p 3000`).
- m01 audio: daily Gemini limit hit; 1 line left (`scripts/tts_batch.sh m01_first_contact`).
- Setup committed 9a88560a (AGENTS.md, CLAUDE.md, brief, log, backlog, gitignore).

## Done since
- tagdiff.mjs (Sonnet), style guide + voice bible (Opus), U3 + follow-ups (engine, uncommitted; node 135/135, Rails 474/0).
- All 7 DESIGN_REVIEW.md written. Decisions in scenarios/PASS4_EDITORIAL_LOG.md.

## Running (2026-10-02)
- Opus design fixers m02–m08 (each appends "Changes made" to DESIGN_REVIEW.md and writes PASS4_PLAYTEST.md).
- Opus engine: LOS gate on "Switch to Lockpicking" (U2 option A).
- Sonnet: dialoguelint.mjs + validator gaps.
- Waiting on user: P1 (Nightshade foreshadowing), P3 (m05 whodunnit), P4/P5 (lab sheets push/SSH example), P6 (Tesseract).

## Status (latest)
- New-check fixes DONE and committed for m02–m08 (m01 frozen).
- ALL SEVEN MISSIONS (m02–m08) DONE AND COMMITTED (m02 4f7b8763). P8/P9/P12 done; P11 deferred (sprites later). Remaining: audio generation for m02–m08 (cost; ask the user), P-items in the log for the user, pushing lab sheets/SecGen (user said not yet).
- User APPROVED the m07 dialogue approach for all missions (2026-10-02). Writer brief: docs/agents/PASS4_DIALOGUE_WRITER_PROMPT.md (MISSION/MSHORT/EXTRA).
- m07: DONE, committed a6ba802c. USER: commit each mission as it completes. Engine committed 44e3c383, bible 9256ab10. Still uncommitted: tooling (tagdiff, dialoguelint, validator, inkcheck, missions.json — the recurring-checks agent is editing), docs (AGENTS.md, brief, log, backlog, README_ink_best_practices), test/js/ink-tagdiff (fix its 'unchanged at HEAD' test first).
- m06: DONE, committed 715a4462.
- m03: DONE, committed 3d95bfc9.
- m04: DONE, committed e7cfc940.
- m02: round 3 DONE (Raval offers the Bed 4 save; press terminal; val_met; naming reason for all names). DESIGN DONE (round-3 confirmation 6/7). Dialogue writer running. Then script edit → playtest → commit. m05: DONE, committed a5556cd7.
- Engine agent DONE (was: lockpick-catch room (containers), catch scoped to the watching NPC's room, keys apply onPickup, brief popup vs opening cutscene race, tutorial decline persistence, phone greeting loss; investigating reload respawn/door entity.

- DONE: recurring-bug checks committed 82c45519 / 8770ace6. Sonnet agent fixing new-check hits in m04/m06/m07 (then a follow-up commit). OLD NOTE: recurring bugs → validator + dialoguelint checks, README_scenario_design/README_ink_best_practices sections, and skills (validate-scenario, scenario-design-review, npc-dialog-review, playtest-scenario; additive edits — the user has uncommitted skill edits). Opus agent running. Afterwards route true-positive hits in finished missions to writers.

## Engine suspects collected from playtests (for one engine agent later)
- CONFIRMED: addKeyToInventory (inventory.js ~671-680) never applies onPickup; onPickup.setVariable only read at interactions.js:1377,1455, inventory.js:271, npc-game-bridge.js:30. m07 works round it with an item_picked_up:key mapping.
- After reload: Mission Brief reopening is the mission setting show_scenario_brief:on_resume (m07 erb:73) — not a bug; an unlocked door can lose its door entity (m07 server hall); timers restart from zero (m07).

- m04: round 2 done; confirmation playtest running (tools/playtest/m04-pass4-confirm-report.md).

- Engine (m04): no heal item/regen for missions; no room leash for chasers (npc-behavior.js:625-658); parseConfig drops maxHP and attackCooldown from scenario hostile config.
- Engine suspect: phone thread loses the hub greeting line once a scripted call lands (m03 playtest defect 4).

- m02: re-review 1 = another round (M1 naming by guessing; M2 task doesn't say naming completes it; M3 orchestrator call: Ghost's keys = 1 death vs combined 2, but Ghost keeps a foothold the debrief names; minors incl. attacked_guard on punching Val, vouched-player reload, Bed 4 backstop, device accept gate, walk-out gets one player reply). Send to the m02 fixer with the m02 playtest report.

## Next
1. Per mission when its fixer returns: fresh Opus re-review of the changes (iterate until clean) → Sonnet playtest from PASS4_PLAYTEST.md on :3001.
2. Dialogue: m02 first (calibration sample to the user) → m03–m08 in parallel; fresh script-editor review; tagdiff + dialoguelint + ink checks.
3. Commit per mission when the user asks; audio after the pass.

## sis01 hospital refresh (2026-10-02, uncommitted)
- sis01 moved onto m02's hospital maps: IT office → room_hospital_office_it, incident room → room_hospital_meeting; network map on the whiteboard, infected PC on the KVM cart, command board on the conference screen; bed4/bed5 NPCs at m02's bed-frame positions; bed monitors reordered to claim the right beds; patrol nurse uses female_nurse2; pharmacist has a talk portrait; person-chat backgrounds hospital1. Validator clean of new issues; slot_audit 0 problems. Sonnet layout playtest running (scratchpad sis01-playtest/report.md).
- Open for the user: talk portraits for sis01's three patients (no art; m02's are named m02 characters).
- Playtest done (layout pass). Follow-up: room_hospital_office_it bottom row slid right (cabinets from x=68) so sis01's south door doesn't drop the player on the locked filing cabinet; m02 still claims the same sprites. Not re-run in browser.
- sis01 committed 655d9e90 (maps, Ravi uses Gary's art) and d7034619 (info pack formatting). Dialogue review: scenarios/sis01_healthcare/DIALOGUE_REVIEW.md (6/37/24). User decisions: raised-MINIMUM tamper; IT responder keeps programming the pump; PSIRF, NIS report, ICO required / NCSC optional; Helen's "contain before notifying" as an arguable NPC misconception; fix then add decisions. Opus fixer running → then fresh script-editor review + Sonnet playtest from sis01 PASS_PLAYTEST.md.
- sis01 fix pass DONE (uncommitted): all blockers/majors, new scenes, risk-management beats, Priya S., info pack + labsheet updated; engine: infusion-pump and drug-library-integrity minigames read limits from scenario data; command board text "dose limits altered". Running: Opus script editor (SCRIPT_EDITOR_REVIEW.md) + Sonnet playtest (scratchpad sis01-playtest2/report.md). Then fixes → commit (engine first, then sis01). Audio: ~427 lines to voice once settled.
- sis01 cast: spec in scenarios/sis01_healthcare/CAST_DESIGN.md (11 characters; new Ravi; pharmacist named Hamza Iqbal). User chose: all concepts first, then pause for approval before PixelLab (~1,150–1,300 gens; balance: 1,333 of 5,000 REMAINING (misread at the time)). Opus concept agent running (scratchpad sis01-cast/contact.png). Voice/description/name edits to the scenario wait until the dialogue fix round is done (avoid clashing edits).
- sis01 lab sheet + information pack are now byte-identical to HacktivityLabSheets/_labs/security_informed_safety/sis01_healthcare{,_information_pack}.md (front matter included; highlighting guide applied to the lab sheet). Any later edit to either must be copied to the other (cp + cmp). Uncommitted in both repos.
- disableAttacks (2026-10-02, uncommitted): top-level scenario flag; player-combat.js attacksDisabled() gates setInteractionMode/canPunch/punch; hud.js hides the mode toggle and no-ops cycleMode; tutorial drops the Combat Mode step; schema + validator (known field; KO-resilience check skipped) + README row. Set in sis01/02/03. Node 199/199, Rails 474/0. Sonnet browser check running (scratchpad disable-attacks-check/).
- sis01 busts generated (44 gens). CORRECTION: pipeline "balance" shows generations REMAINING (1,333 → 1,289 of 5,000), not used. Full cast would need ~1,100–1,250 more: ask the user how to trim. Awaiting user's picks; sheets in scratchpad sis01-cast/busts/sheet_{1,2,3}.png.
- 2026-10-03: sis01 round 2 fixes done; confirmation playtest (sis01-playtest3) mostly PASS. Engine fix (uncommitted): music/scenario-music-events.js concludeMission awaits stateSync.sync() before /conclude (sis01 credits never rolled: debrief_complete not yet stored). Fixer round 3 running: N2 (Priya/Hamza hidden after reload; scenario workaround + engine log), N6 ICO-missed debrief wiring, N1 checker tabs, N3 David intro, N4 Sarah after Okafor's death + worst lines. Busts for the 3 scrub concepts queued with the PixelLab agent (user picks).
- 2026-10-03: sis01 final playtest (sis01-playtest4) ALL PASS incl. credits rolling on two paths. Fixer round 4 (minor: David stale line, checker box colour, credits title when not contained) running. Art: 8 characters imported (5 staff walk atlases + 3 bed sprites registered in game.js; talk/visemes for all 8); scrubs picks Sarah b02, Amy b02, Hamza b04 now in the full pipeline + Helen talk-frame lip fix. ~561 gens left before. NEXT: wire all 11 NPCs' spriteSheet/spriteTalk/spriteVisemes (+ bed_* sprites) in sis01, validator, short in-game check, then commits: (1) engine (disableAttacks, save-before-conclude, pump + checker minigames, schema/validator/README), (2) sis01 + its docs, (3) art assets + game.js preloads, (4) room maps + m02 flavour props, (5) HacktivityLabSheets sis01 copies.
- 2026-10-03 COMMITTED: a48d1176 engine (disableAttacks, save-before-conclude, pump/checker, sis02/03 flag), d4eb6935 hospital maps + m02 props, b4ed6eb0 sis01 pass 4; HacktivityLabSheets 2a66d84 (sis01 copies). Not pushed. Remaining: art for Sarah/Amy/Hamza (pipeline running) → wire all 11 in sis01 → commit art + game.js preloads + tools/pixellab_characters.json + overrides; sis01 audio (ask the user).
- 2026-10-03: sis01 cast art committed (all 11 wired; in-game check passed, scratchpad sis01-cast-ingame/). PixelLab ~199 gens left. Open small items: Hamza bust red brow mark, Sarah walk yellow lanyard/gold glint, Mr Ahmed portrait pillow hard left edge, unpicked PixelLab characters to delete by hand (user), sis01 audio (ask), engine items in backlog (timer reload reset, board clock/order, setVisible persistence, per-room mapping registration, event conversations losing ink locals).
- 2026-10-03 running: (1) Sonnet cosmetic art fixes (Hamza brow, Sarah lanyard/glint, Ahmed pillow) → scratchpad sis01-cosmetic/; (2) Opus engine agent: timers resume on reload, command board clock/order/clip/restore+death entries, toast over minigames, NPC visibility persistence, PLUS event conversations restore state then jump (user chose option A); browser regression across sis01/m07/m08 + 3 missions' cutscenes; (3) Sonnet validator warning for NPC triggers in not-yet-loaded rooms (user chose option C: warning + "fireOnlyWhenLoaded" opt-out, docs). After: re-check sis01 workarounds (Priya/Hamza re-show, Sarah relay), commit engine, art, validator separately.
- 2026-10-03: Ahmed pillow committed. Both engine regressions PASS. User decisions: command board keeps its own stamped entries (drop the general change log from the 30 s sync); keep the 30 s save model. Engine agent reworking that; m02 agent fixing the reload/backstop gap that skips the ambush (test 2). Then commit engine+validator(+schema) together, then m02.
- 2026-10-03: save-state scaling moved to a separate Claude session; prompt at docs/agents/SAVE_STATE_SCALING_PROMPT.md. Closed here.
- 2026-10-03 COMMITTED: c0c76a80 engine (timers on reload, board recorder + game clock, NPC visibility, event conversations keep state, barks held in minigames) + validator room-trigger warning; 7356945a m02 ambush/supervisor triggers; e9b9da9c/d02abf64 sis01 art fixes; save-state prompt committed. Not pushed. Open: sis01 audio (ask), sis01 workaround mappings (Priya/Hamza re-show) now redundant — remove later; MAR pickup 422; reload respawns in start room (backlog "Resume in the room you left").
- 2026-10-03: sis01 dialogue review R2 done (DIALOGUE_REVIEW_R2.md: 0/6/78). User decisions: spoken "Priya" (label stays Priya S.), printouts + phone pharmacy checks as the compensating control, voice swaps (Narrator off Charon; Helen/Hartley off Kowalski/Sarah voices), lab sheet Q10 Art 34 fix, add the player-advises Helen/David scene (no silent-patient lines). Opus R2 fixer running → then Sonnet confirmation playtest from PASS_PLAYTEST.md R2 → commit. Then sis02 (user asked for the same treatment; phases summarised in chat — offer to save a playbook in docs/agents/).
- 2026-10-03: SIS improvement playbook saved at docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md (for sis02/sis03 later; not started). sis01 R2 fixer handling playtest defects → R3 confirmation → commit sis01 + Hacktivity lab sheet.
- 2026-10-03: user queued: after the R3 confirmation passes and sis01 is committed, run ANOTHER dialogue review round on sis01 (fresh Opus, educational + natural dialogue, review only → DIALOGUE_REVIEW_R3.md).
- 2026-10-03: sis01 R3 review done (DIALOGUE_REVIEW_R3.md 0/8/40). User: E1 engine one-liner for nurse pause during scripted walk; E2 engine "save person NPC current knot" ONLY if analysis shows it works with exit/hub/pending patterns (analysis → docs/agents/SAVED_KNOT_ANALYSIS.md), else ink guards; E3 add Sarah pump exchange; E4 TTS pronunciation at audio time. Running: Opus engine agent (D1 + D2 analysis/impl + regression) and Opus sis01 R3 fixer (ink/scenario only). Then R3b confirmation playtest → commit.
- 2026-10-03: sis01 R3 committed (42ce4128) + leftovers (864976ee), engine scripted-walk fix de9ba625; all confirmation playtests pass. Open for user: held-bark policy (drop stale vs keep in order), m02 Val cover_restored guard, sis01 audio (~480 lines, voices changed), map pathing near ward beds (room-dressing pass). sis02 via docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md when asked.
- 2026-10-03: sis01 BLIND playtest done (findings: scratchpad sis01-blind/FINDINGS.md): blocker D1 debrief unreachable after reload; map Sever discoverability; orphan brief_ravi; lopsided choices. User: neutral pump buttons, arguable backup sources, ICO clock as game-time hours of 72 h, rewrite Mission Brief. Opus blind-fixer running (BLIND_PLAYTEST_FIXES.md) → then confirmation (ideally a second blind run) → commit.
- 2026-10-03: playtest skill updated (severity table, improvement loop, blind runs; committed). Running: sis01 second blind playtest (scratchpad sis01-blind2), m02 blind playtest (scratchpad m02-blind). Uncommitted: sis01 blind fixes + VPN minigame row-lookup fix (passed sis01+sis02 browser) — commit after sis01 blind2 reports. Player talk portrait copy committed 10e24b30.
- 2026-10-03 user reports → running: Opus engine-aims (completing any task shows its aim; history of the change), sis01 blind-2 fixer (also: always a visible next task after each aim), Sonnet IT-office desk PCs lowered (room_hospital_office_it, sis01+m02), Sonnet portrait facing for the 11 new sis01 characters (mirror talk/visemes). m02 blind playtest still running.

## State at 2026-10-04 (before context compaction)
- All sis01 work committed up to dea05b70 (plus 657f6158 aims engine, 43c192ef blind-2 fixes, 04e0687b portrait flips). Not pushed. HacktivityLabSheets sis01 copies committed (latest 55ca731).
- RUNNING (background agents):
  1. sis01 FINAL TIDY (Opus): F1 move Bed 2 pump task into "Assess Ward 7"; F2 new general engine task status "skipped" (not counted for Hacktivity score) used when isolating without sign-offs; F3 Mission Brief once per game (not after reload); F5 HC-003 credit wording. Scratch sis01-tidy/. Then commit.
  2. m02 IMPROVEMENT LOOP orchestrator (Opus): from the partial m02 blind run (findings A1–A10, C1–C2; A10 = insider deduction too easy) → regression playtest of unreached parts → fixes → confirm; ≤3 review rounds total; then a fresh blind playtest. Log: scenarios/m02_ransomed_trust/PLAYTEST_LOOP_LOG.md; scratch m02-loop/. It commits its own rounds.
- WAITING ON USER: portrait facing of the 3 sis01 patients (flipped to pillow-right; m02's patients face the other way); sis01 audio generation (~480 lines; HC-001/PSIRF pronunciation at audio time).
- Done this session also: playtest skill improvement loop + severity table + blind runs (71485b33); SIS playbook (docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md); save-state scaling moved to a separate session (docs/agents/SAVE_STATE_SCALING_PROMPT.md); engine: timers on reload, board recorder, NPC visibility, event conversations keep state, scripted walks don't stop for player, aims reveal on task progress, disableAttacks, save before conclude.
- Backlog ideas: pipeline should check portrait facing after bust/pick; held barks during minigames (drop stale vs keep order — user undecided); m02 Val cover_restored guard (offered); map pathing near ward beds; validator "on_resume" check now a false positive for on_start.
- 2026-10-04 m02 PLAYTEST LOOP CLOSED (3 rounds): commits 95665799, 5b7b6b89, 40bdf9cb (m02); engine 05f0d9b1, 64d9ca2b, c6b9ac8d; SecGen 2eb9f72dc (VM docs match game, gary/Hospital1987). sis01 tidy 22ec27e5 + 13eb2e38. Log scenarios/m02_ransomed_trust/PLAYTEST_LOOP_LOG.md. m02 spoken lines: 11 changed, 19 new (audio not regenerated). Open for user: E2/P10 respawn at reception after reload; VM-vs-game check for other missions (offered). Engine backlog: phone typewriter freezes mid-line; identical HaX timestamps; pick-up items show nothing when clicked in inventory.
- 2026-10-04 m03 IMPROVEMENT LOOP started (branch claude/m03-improvement-loop; log scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md; agent brief docs/agents/M03_LOOP_BRIEF.md). Cloud session: browser playtests work headless (see log "Environment"). SecGen m03 XML is not on master. Phase 1 (alignment) round 1 review running.
- 2026-10-04 m03 loop: PHASE 1 (alignment) CLOSED after 4 rounds (1/9/11 → 0/0/15 → 0/1/2 → 0/0/2). Fixer agent is Opus, resumed between rounds. Next: Phase 2 puzzle chains (mission-puzzle-chains), incl. the SecGen m03 XML draft (D1 pending with the user).
- 2026-10-04 m03 loop: PHASE 2 (puzzle chains) CLOSED after 3 rounds (0/4/9 → 0/1/4 → 0/0/2). SecGen proposal in scenarios/m03_ghost_in_the_machine/SECGEN_PROPOSED_m03_ghost_in_the_machine.xml (D1). Next: Phase 3 scenario design review.
- 2026-10-04 m03 loop: PHASE 3 (design) CLOSED after 3 rounds (0/3/15 → 0/1/6 → 0/0/4), with one Sonnet browser probe (P3-1/P3-3 pass). Engine items E-A..E-E logged. Next: Phase 4 dialogue (ink snapshot at the phase-3 close commit).
- 2026-10-04 m03 loop: PHASE 4 (dialogue) CLOSED after 3 rounds (0/9/33 → 1/2/19 → 0/0/8). Voiced lines changed are listed in the loop log (m03 has no audio yet). Next: Phase 5 playtests (regression + struggling personas, then fix, confirm, then blind).
- 2026-10-05 m03 IMPROVEMENT LOOP CLOSED (all five phases; blind runs fun 4/3, no blockers). Branch claude/m03-improvement-loop pushed, not merged. Waiting on the user: D1 SecGen XML (scenarios/m03_ghost_in_the_machine/SECGEN_PROPOSED_m03_ghost_in_the_machine.xml), engine items E-1, E-A..E-H, m01/m08/sis03 voiced-variable decisions, m03 audio (no audio generated yet). Other missions' voiced variables fixed in 94716a0.
- 2026-10-05 follow-ups running (user decisions in scenarios/m03_ghost_in_the_machine/DECISIONS_PENDING.md "User decisions, 2026-10-05"): (1) SecGen m03 XML review + add (SecGen branch claude/practical-planck-fvt3ha); (2) voiced variables sis03 + m01, m08 ERB note, backlog m04 note, two skill notes; (3) engine input bugs E-E, E-H, flipper Cancel, dictionary 15/16; (4) engine reload E-1, E-B; (5) engine E-D per-NPC sight attribute + phone timestamps; (6) tooling: voiced-variable lint, graph gates, harness openTasks, validator global/VAR collision. Commit each separately (engine before missions); node + Rails + browser regression for engine.
- 2026-10-05 follow-ups DONE and pushed: engine 96a339d (E-E), 44eb63c (E-H), d7c93de (flipper Back), 623ff83 (dictionary 16/16), e03dd0e (E-1, E-B), 24b44ec (phone times), 2643afb + fix cac4dde (E-D challengeOnSight; 2643afb alone is missing window.playerCombat), tooling b343110 + c9b5eac, missions 9395342 (sis03 slip, m01, m08 note) + 1d1e83c (m03 tidy), docs/skills 8be6ffc, SecGen 53447e9b. Node 345/346 (known env failure), Rails 501/0. Browser checks passed (sis03 slip game 5025; m03 smoke 5026). Open: m03 audio (later), m01 4 lines need new audio, 14 validator collision warnings in m01/m04/m05/m07/m08 to review, keycard inventory click has the same read-loss bug as E-H (not fixed), challengeOnSight not wired into any mission.

## sis02 improvement loop (2026-10-05)
Branch claude/m03-improvement-loop. Brief docs/agents/SIS02_LOOP_BRIEF.md, log scenarios/sis02_energy/IMPROVEMENT_LOG.md. Playbook phases 1-5 done through round 4 (5e52b40); confirmation Run H running. Next: lab sheet rewrite (phase 6; HacktivityLabSheets not in the container: add_repo cliffe/HacktivityLabSheets), cast (phase 7; ask before PixelLab spend), round-2 dialogue review (phase 8), audio last (ask; Helen and Priya fully re-voice, sis03 Eleanor ~26 lines).

# Resume note: VM lab-sheet reconcile (2026-10-23)
Brief docs/agents/VM_LABSHEET_BRIEF.md. All 10 VM technical-steps companions in HacktivityLabSheets reconciled to the current VMs. Rewrote m04, m08, m09, m10 (changed VMs) + fixed m05 (missing Base64 decode step) and m07 (listener carries operator password, not the door password). m01/m02/m03/m06 correct as-is. 6 files modified in HacktivityLabSheets, NOT committed (awaiting user OK). m09 mission.json Druid->credentialed-access line fixed and committed (e7a2ae426). Open for user: (1) commit the HacktivityLabSheets sheets; (2) m08 game hook says "credentials in git history/stash" + offers the Secrets-in-Git-History guide, but the VM puts the password in a loose /home/git file read via the RCE (only the recon text naming svc-planning is committed) — decide VM change vs soften game text (m08 shipped). Minor: m10 SecGen XML <description> prose says flag 3 at the server-hall console; game wires it to sealed_hatch (cosmetic XML tidy).

# Resume note: m08 git-history redesign (2026-10-23, done)
m08's "secrets in git history" hook made real. SecGen (committed): 5da749373 (gitlist_040 optional strings_to_leak_in_history → secret in deleted commit history; sudo_root_apt_get optional sudo_user → scope NOPASSWD to one account; both default to current behaviour, 6 other scenarios unaffected), 0abe02aaa (m08 wiring: flag-2 credential in deleted history, root scoped to www-data so the GitList RCE is required to finish; svc-planning has no sudo, mail 0600). m08 companion rewritten to the new chain: HacktivityLabSheets df39426. User signed off the design before commit. BUILD CHECKS (user's Proxmox, on the build-checks artifact): m08 — svc-planning can't reach root, www-data can via RCE→sudo apt-get; deleted-history secret absent at HEAD, recoverable via git log/show; mail 0600 owned svc-planning; flag order recon→cred→mail→root. Default build of sudo_root_apt_get + gitlist_040 scenarios unchanged (backward-compat). Open design note: whether GitList 0.4.0 web UI renders the deleted commit's diff (if it must be strictly RCE-gated, switch flag 2 to the stash variant) — root is RCE-gated regardless, so this only affects whether flag 2 alone is also web-reachable.

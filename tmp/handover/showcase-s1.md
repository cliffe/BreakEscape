# Handover: office_life_showcase slice S1 (skeleton)

Status: RESEARCH COMPLETE, NOTHING BUILT YET. Context guard fired at the 150k
handover limit during source reading, before any scenario/ink file was written.
No server was started (nothing to kill). No commits made except this note.

Worktree: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-showcase`
Branch `plan/ol-showcase`, HEAD d158bf566 (clean). Only `scenarios/office_life_showcase/planning/`
exists; every build file must be created fresh. (Also present, untracked in the main
checkout: `docs/agents/UI_PASS_RESUME.md` from an unrelated pass; ignore it.)

## What S1 must produce (PLAN.md section 11, binding)
Read first: PLAN.md sections 2, 3, 6, 7, 11 (lines 14-172, 370-379, and 7a/7b tables
at lines 184-262). Files to create under `scenarios/office_life_showcase/`:
- `mission.json`: display_name "Office Life Tour", collection test_scenarios,
  estimated_duration_minutes 8, NO `scoring` key. Model on
  `scenarios/test_needs_sims/mission.json` (keep test_type/test_objective style).
- `scenario.json.erb`: office + kitchen rooms (reuse sims maps), objects, cast with
  needs, globals, objectives (no `missionConclusion`), NO `music` block.
- `ink/ama_owusu.ink` (start, hub, exit only for S1) + 5 staff inks
  (chidi, jun, graham, agnieszka, zainab), each the 5-line shape in 7b.
- Compile every ink with `/home/cliffe/bin/inklecate -o <f>.json <f>.ink`.
- Base lighting only (office on, kitchen on; evening variants are S4, not S1).

## Top-level scenario config (from PLAN section 1)
`startRoom` office, `startPosition {x:5,y:6}`. Set: `showPressingNeeds: true`,
`officePresets: true`, `roomTone: true`, `lighting {enabled:true, defaultMode:"on"}`,
scenario-level `disableAttacks: true`. OMIT `needsDebugOverlay` and `npcThoughts`
(both default correctly: overlay off, thoughts on). `npcNeedsSeed` set to
"office_life_showcase". Keep `npcWindupMs: 700`.
NOTE: chatter pools, per-NPC pool extras, cake item are S2/S3, NOT S1. For S1 the
objects/cast still need their structural fields; pools can be added in S2. But the
coupling eventMappings and barks are S2+ too. S1 = skeleton: rooms, objects, cast
with needs + behavior, globals, objectives, Ama ink (start/hub/exit), staff inks.
Re-read section 11's S1 bullet for the exact cut line; do not add S2 content.

## Source line ranges to copy from (test_needs_sims/scenario.json.erb)
Positions/fields are given precisely in PLAN section 2 (objects) and the section 3
table (cast). Copy JSON shapes from these, then RENAME per the plan:
- Office objects: lines 190-355 (amara_pc->chidi_pc, tom_pc->jun_pc, sanjay_pc->
  graham_pc, grace_laptop->agnieszka_laptop, marek_tool_roll->zainab_tool_roll,
  tom_badge->jun_badge, office_coffee, office_coffee_socket, office_mugs).
  Desk machines MUST be declared in this order (sims order) so Tiled desk-item
  claiming lands each owner at the right desk (PLAN R8). The three PCs become
  workstations with `workstation:true` + `owner`. jun_pc/chidi_pc carry NO lock
  fields; graham_pc adds only `autoLockSeconds:20`.
- Office NPCs: lines 549-763. chidi<-amara, jun<-tom, graham<-sanjay,
  agnieszka<-grace, zainab<-marek. For S1 keep needsHome, needs (values from the
  section 3 table, NOT sims values), needsSpeed, behavior, interests, needsCompany.
  DROP sims-specific eventMappings/onUse/habits that belong to S2+ beats; keep only
  what S1 needs (posts + needs). Re-check section 11 S1 scope before adding mappings.
- Kitchen objects: lines 766-829 (fridge, microwave, kitchen_coffee, water_cooler
  with useSeconds 40, washing_up_tray). Drop kitchen_rota and kitchen copier.
  kitchen_coffee gets object-form `offWhen: {"office_coffee_off": false}` (S2 detail,
  but the object exists in S1).
- NPC posts (feet tiles): Chidi (7,3), Jun (3,6), Graham (3,4), Agnieszka (1,5),
  Zainab (2.15,6.65). Ama (new) at (5.5,4.5), feet px (176,144).

## Ama NPC block (voice/art) - from ca18
`scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:793-813`:
voice name "Autonoe", language "en-GB", style string (copy verbatim from :799),
displayName "Ama Owusu", npcType person, spriteSheet "ama_owusu",
spriteTalk "assets/characters/ama_owusu_talk.png",
spriteVisemes "assets/characters/ama_owusu_visemes.png",
storyPath "scenarios/office_life_showcase/ink/ama_owusu.json", currentKnot "start".
Ama S1 extras: `behavior: {facePlayer:true, immovable:true}`, position (5.5,4.5).
Her lines are TEXT ONLY for S1 (generate NO audio).

## Ama ink (7a) and staff ink (7b)
Lines are WORD FOR WORD in PLAN tables 7a (lines 186-220) and 7b (224-252).
For S1 Ama ink = start (A1,A2) + hub (A0 reopen + the exit choice "I'll have a look
round."/A27) ONLY. The act-turn/hint/lunch/recap choices are later slices per the
brief ("start, hub and exit only"). Model the reopen pattern on
`scenarios/test_needs_sims/ink/neil.ink` (start diverts to hub.choices; hub has a
reopen line; exit uses `# exit_conversation` then `-> END`). Add
`reopenRefreshesHub: true` on Ama's NPC block.
Staff ink per NPC: start line, hub reopen line, one topic choice -> two-line answer,
exit choice "I'll let you get on." -> one-line reply. Texts in 7b. Graham's exchange
knot `exchange_cooler_chat` (7c) is S2, not S1.

## Live proof infrastructure (for the S1 proof step)
- Port 3094 ONLY. Keyless server command (from m01 BUILD_REPORT.md):
  `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3094`
  Run in background with log; grep boot log for "GEMINI_API_KEY environment variable
  is not set". Record puma PID from `ss -ltnp`; kill ONLY that PID (never pkill).
  Some runs also set `RBENV_VERSION=2.7.8`.
- Fresh game per edit: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb office_life_showcase`
  (from worktree, same env). Use ONLY ids it printed this run. It prints FLAGS_XML
  for `tools/playtest/session-start.sh --url <URL> --flags <path>` (likely unneeded,
  no VM here). Set PLAYTEST_PORT=3094.
- THE NAMED HELPERS `tools/playtest/m05-ol-ng.sh` AND `m05-ol-lib.mjs` DO NOT EXIST.
  Use `tools/playtest/m01-ol-lib.mjs` as the driving lib (open/load/dismiss/
  waitAtPost/converse; sets setFPS(20), fixed steps on, smoothStep false; EXEC path
  for chromium-headless-shell). It does NOT itself abort /tts; a keyless server just
  503s on /tts so no abort is strictly needed, but add page request interception to
  abort '/tts' to be safe.
- W0 (free pathfinding cells west of Ama at y144): use the pathfinding grid.
  `tools/playtest/grid-hash.mjs` + `tools/playtest/lib/all-rooms-loader.mjs` show how
  to reach `window.pathfindingManager` and the world grid. Grid cell = 8px
  (utils/constants.js:37). Read the grid row at y144, count free cells between the
  west desk edge (x108px) and Ama's padded body (x152px start). PLAN section 2 table
  (lines 46-51) predicts cells 15-18 (120-151px) = 4 free, >=2 required. If <2, STOP
  and report; do NOT move Ama.
- Renders: `tools/playtest/room-snapshot.mjs` for both-room screenshots.
- atPost check: `window.__test.needs.state(id).atPost` for each of the 5 staff.
- W1: no clip/stall/long-detour round Ama on first coffee walk + first west-door walk.
- W2: Jun's walk back from west door to desk (3,6) reaches atPost cleanly down the
  west lane. East lane is closed to pathing - no walk may use it.

## Validators (S1 proof step 1: clean)
`ruby scripts/validate_scenario.rb scenarios/office_life_showcase/scenario.json.erb`
(0 errors). It calls validate_office_life (V7,V8,V10 etc). See DIGEST section 14 for
V8 caps and chatter 40-char rule.

## Discrepancies found in the plan/brief (report to orchestrator)
1. Brief names `tools/playtest/m05-ol-ng.sh` and `m05-ol-lib.mjs` as the pattern;
   neither exists. The real equivalents are the `m01-ol-*` family. Use those.
2. DIGEST is marked PARTIAL in places but its completion pass (sections 12-21) covers
   the gaps; it confirms Ama's atlas/talk/visemes/headshot all exist.
3. Nothing in the plan looked wrong on the structural facts checked so far; the
   desk-claim order (R8) and Ama placement (R1) are the load-bearing items to verify
   live.

## Standing rules reminders
- Leave test_needs_sims completely untouched (it is a fixture; T24 diffs it).
- Commit with explicit paths: `git add <paths>` then
  `git commit -m ... -- <paths>` after checking `git diff --cached --stat`.
  No attribution lines. UK English, no em/en dashes, no model names in repo files.
- Never open SecGen XML or the exploit field guides (not relevant here anyway).
- Write BUILD_REPORT.md (planning/) with an S1 section: proof table (PASS/FAIL,
  figures, game ids), W0/W1/W2 figures, screenshot paths.
- Commit as you go.

## Done / Open
Done: read PLAN.md (full), DIGEST.md (full), SKILL.md (full), neil.ink, ca18 Ama
block, test_needs_sims objects+NPCs+kitchen, mission.json, m01-ol-lib.mjs,
grid-hash.mjs, new-game.rb header, server start pattern.
Open: EVERYTHING in the build. Start by writing mission.json, then scenario.json.erb,
then the 6 ink files, compile, validate, then the live proof on :3094.

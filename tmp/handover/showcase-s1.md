# Handover: office_life_showcase slice S1 (skeleton)

Status: BUILD DONE through validator (steps 1-4). LIVE PROOF (step 5) and
BUILD_REPORT.md (step 6) NOT DONE. Context guard fired at 152k after the
validator. No server was ever started (nothing to kill).

Worktree: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-showcase`
Branch `plan/ol-showcase`.

## Commits made this run (all on the branch)
- `e56d9328a` mission.json (display name "Office Life Tour", no scoring)
- `5253143b9` scenario.json.erb (rooms, objects, cast, objectives)
- `6ab854286` six inks (.ink + compiled .json)
- `13ee82974` validator clean (0 errors), dungeon graph files

## What is built and verified
- mission.json, scenario.json.erb, ink/ (ama_owusu + 5 staff, compiled with
  /home/cliffe/bin/inklecate, no warnings).
- `ruby scripts/validate_scenario.rb scenarios/office_life_showcase/scenario.json.erb`
  => **0 errors, 17 warnings**. Warnings are all expected: cross-room need
  targets (office NPCs need kitchen objects; kitchen loads on door open, same as
  sims), a built-in `cooler` pool picture-chat note on water_cooler, and 3
  "recommended field" notes (player sprite, socket observations, timedConversation).
  None block S1. validate_office_life (V8 sync budget: small keys 10/64) and
  validate_npc_needs both run inside validate_scenario; both clean.

## Scope decisions taken (all S2+ left out, per section 11)
- globalVariables declares ONLY `office_coffee_off` and `jun_badge_left` (the two
  globals referenced in S1). act_midday/act_evening/kitchen_seen/
  heard_exchange_cooler_chat/*_owner_away are added in their later slices (sims
  does not pre-declare owner_away either).
- Objectives: all 3 aims (morning/midday/evening) + 8 tasks are defined as
  STRUCTURE, but Ama has NO eventMappings yet, so nothing ticks them in S1. No
  missionConclusion, no music block.
- Ama ink = start (A1,A2) + hub (A0 reopen) + exit ("I'll have a look round."/A27)
  ONLY. Staff inks = 5-line shape (start, reopen, one topic -> 2-line answer,
  exit). No barks, no couplings, no exchange knot, no cake, no chatter pools, no
  tour_notice, no lighting variants. test_needs_sims untouched.
- office_coffee has offWhen "office_coffee_off"; kitchen_coffee has object-form
  offWhen {office_coffee_off:false} (kitchen off while office on). Socket lever
  present. No `chatter`/`overhearRadius` on office_coffee (S2).
- Voice `style` strings copied verbatim from VOICE_CAST.md / ca18:799 (they keep
  the em dash as canonical data; everything I authored has no em/en dashes).
- Desk machines declared chidi_pc, jun_pc, graham_pc, agnieszka_laptop first (sims
  order) so Tiled desk-claim lands each owner at the right desk (R8).

## STILL TO DO

### Step 5: live proof on :3094 (NOT STARTED)
Follow PLAN section 11 S1 bullet and the brief exactly:
- Keyless server, port 3094 ONLY:
  `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3094`
  (background + log; grep log for "GEMINI_API_KEY environment variable is not set";
  record puma PID from `ss -ltnp`; kill ONLY that PID, never pkill). Some runs set
  RBENV_VERSION=2.7.8.
- Fresh game: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb office_life_showcase`
  from the worktree, same env; use ONLY ids it prints this run; PLAYTEST_PORT=3094.
- Driving lib: `tools/playtest/m01-ol-lib.mjs` (open/load/dismiss/waitAtPost/
  converse; sets setFPS(20), fixed steps on, smoothStep false). The m05-ol-* names
  in the original brief DO NOT EXIST. Add page.route to abort '/tts'. Use
  page.reload() for reloads.
- Renders: `tools/playtest/room-snapshot.mjs` for both rooms.
- atPost: `window.__test.needs.state(id).atPost` for chidi_okeke, jun_watanabe,
  graham_whitfield, agnieszka_duda, zainab_hussain (each at its own desk).
- Watch first coffee walk and first walk to the west door past Ama (5.5,4.5 = px
  176,144; body x166-186; west desk edge 108).
- W0 (before any walk): read NPC pathfinding grid row at y144, count free cells
  west of Ama between desk and body. >=2 required, 4 expected. If <2, STOP and
  report; DO NOT move Ama. Helpers: `tools/playtest/grid-hash.mjs` +
  `tools/playtest/lib/all-rooms-loader.mjs` reach window.pathfindingManager; grid
  cell = 8px. Expected free cells 15-18 (120-151px).
- W1: no NPC clips Ama / stalls / long-detours on first coffee walk + first
  west-door walk.
- W2: Jun's walk back from the west door to desk (3,6) reaches atPost cleanly down
  the WEST lane (east lane is closed to pathing). In S1 Jun has no reason to enter
  the kitchen by default (office_coffee is on; kitchen_coffee off), so INDUCE the
  west-door trip: switch office coffee OFF at the socket (lever exists) so turned-
  back NPCs head to kitchen_coffee via the west door, OR use __test to force a
  need, then watch his return. Figure the cleanest induction with m01-ol-lib.

### Step 6: planning/BUILD_REPORT.md (NOT STARTED)
Write it with an S1 section: proof table (PASS/FAIL, figures, game ids),
W0/W1/W2 figures, screenshot paths. Commit it, then final commit after the proof.

## Discrepancies to report to orchestrator
1. Original brief's helper names `tools/playtest/m05-ol-ng.sh` / `m05-ol-lib.mjs`
   do not exist; use the `m01-ol-*` family (already noted in prior handover).
2. Validator emits a `cooler` pool picture-chat warning on water_cooler because
   the `water_cooler1` preset carries a default chatter pool; harmless in S1.
3. S1 has no in-scenario driver that sends an office NPC through the west door by
   default (coffee stays in the office), so W2 needs an induced kitchen trip (see
   step 5 W2). Nothing in the plan is wrong; just note the proof needs a nudge.

## Standing rules reminders
- Commit explicit paths: `git add <paths>` then `git commit -m ... -- <paths>`
  after `git diff --cached --stat`. No attribution lines. UK English, no em/en
  dashes, no model names in repo files.
- Leave test_needs_sims untouched. Never open SecGen XML / exploit guides (n/a).
- Kill server by recorded PID only; never pkill. Never /tts. Never edit game rows.

# LIVE PROOF RUN (second agent) - done / open (guard fired at ~151k)

Server: keyless on :3094 (warning present in boot log), PID 3398796 (tmp/s1/server.pid). Killed at end of this run.
Needed BUNDLE_PATH=<main repo>/vendor/bundle (worktree has no .bundle config). The mission row did not exist in the dev DB: I created
one Mission row (name office_life_showcase, from mission.json) via rails runner, no db:seed, no game rows edited.
Games (all from new-game.rb this run): 7474 (W0 grid read, state), 7475 (first coffee walk, office coffee), 7476 (lever BEFORE kitchen open: Chidi
"parked no_source", nobody walks to kitchen), 7482 (kitchen opened first, then lever: W1/W2 data), 7485 (homes), 7486/7487 (render).
Scripts (uncommitted until this note's commit): tools/playtest/showcase-s1-probe.mjs (phases state|w0|post|homes|watch|lever|render),
showcase-s1-analyse.mjs <dump.json>, showcase-s1-path.mjs <dump.json> <npc> <fromS> <toS> <stepMs>. Dumps in tmp/s1/*.json (gitignored? check).

## Figures
- Boot: all 5 staff atPost true by ~7 s of game clock at own post. Final sprite pos (feet = sprite y + ~31): Chidi (228,98) home chidi_pc (228,124 feet);
  Jun (89,137) home jun_pc (92,164 feet; plan's "(3,6)" is his start tile (96,192), he walks to the pc post); Graham (92,99) graham_pc;
  Agnieszka (44,143) agnieszka_laptop; Zainab (76,184) zainab_tool_roll (home 76,212). NB waitAtPost returns true early for Zainab (she is still pushing her chair, done by ~7 s).
- W0 (game 7474, before any walk): grid cell 8px, rows cy267/268 cover y 136-151. Row y144: lx96:1 104:1 112:0 120:0 128:0 136:0 144:0 152:1..192:1 200:0 208:1 216:1.
  Free cells west of Ama = 5 (x 112-151, 40 px; 4 if the desk-edge cell 112 is excluded as the plan's 120-151). >=2 required, 4 expected: PASS.
  OBSERVATION: east side is NOT closed: cell x200-207 is free at y144 (plan says none).
- First coffee walk (7475, office coffee on): Chidi leaves 0:50 (clock 50.8 s), uses coffee 53.8-65.8 s, back at post 77 s. His path goes DOWN THE EAST LANE
  (x=204, body x193-213) at 7.3 px gap from Ama's body out (at 52.0 s) and 9 px back (70.5 s); no overlap, no stall, ~85 px/s, direct. Plan says east lane closed and Chidi runs east of
  east desks: contradiction in the plan text, but no clip. Only Chidi walks to coffee in S1 (queue is S2). Also a 3.5 s pause at the coffee after "using" before "returning" starts moving (far from Ama).
- W1 (7482, kitchen opened first, coffee off at socket, global office_coffee_off true): Chidi 0:50 and 3:34 trips to kitchen_coffee along y 93 above Ama, gap 10-17 px, never overlap, no stall;
  Jun trip at 3:00 (180.5 s): (89,137)->(104,133)->(114,110)->(84,93)->door, min gap to Ama 42 px; Graham water cooler 160 s min gap 60; Agnieszka mug run 20 s and cooler 160 s min gap 39. Overlap samples 0 for all five.
- W2 (7482): Jun return from kitchen starts 200.0 s ("returning"), (-212,208) -> (-4,53) -> (66,75) -> (103,109) -> (92,133) -> post (89,137); atPost true at 206.0 s (6 s), speed 50-80 px/s throughout, no wait,
  min gap to Ama 53 px (arrives from the north-west, never beside her). Induced by the plan lever (socket, sets office_coffee_off), NOT a needs nudge, but ONLY after the kitchen had been opened
  (entered and left) first: with the kitchen unloaded (7476) Chidi's caffeine job parks "no_source" for the whole 8 min and nobody goes west. Jun's own caffeine hits urgent at ~180 s.
- Lever recipe: moveToNear('office_coffee_socket'), interact('office_coffee_socket'), click '.game-confirm-ok'.

## Screens (scenarios/office_life_showcase/planning/screens/): s1-office-start, s1-first-coffee-walk (7475), s1-kitchen, s1-west-door-walk (Chidi, 7482), s1-office-after-kitchen, s1-office-posts (Zainab still pushing chair, early frame),
 s1-kitchen-room and s1-office-room (render phase, 7487: camera maths used game px of 600x400 but I put sx=420, so framing is probably off; redo with sx=210, sy=20, or just use s1-kitchen/s1-office-start).
 The kitchen render did not clearly show coffee machine / cooler / tray: check the s1-kitchen-room frame.

## Still to do
1. Look at s1-kitchen-room.png / s1-office-room.png; if off-frame fix sx/sy (210, 20) and rerun phase render on a fresh new-game id.
2. Write scenarios/office_life_showcase/planning/BUILD_REPORT.md S1 section from the figures above; commit with explicit paths (probe scripts, screens, report, handover).
3. Optional: a Jun-only nudge run is not needed (lever worked). No scenario fix made. Engine untouched.
4. Report: tests PASS (W0, W1, W2, atPost x5), with the east-lane note and the kitchen-must-be-opened-first note (the latter is for S2 T7 wording).

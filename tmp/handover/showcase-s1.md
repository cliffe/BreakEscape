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

# Handover: office_life_showcase S3 (midday and cake) for the proof agent

Worktree `.claude/worktrees/p-ol-showcase`, branch `plan/ol-showcase`. S3 build is committed
(60391659a) and verified against PLAN this pass; the validator is clean (0 errors, 17 warnings).
BC1 (cake after reload) is BLOCKED and NOT proven live. See
`scenarios/office_life_showcase/planning/BUILD_REPORT.md`, sections "S3 (midday and cake)" and "BC1".

## Done this pass
- Checked the S3 build line by line against PLAN sections 3, 4, 6, 7, 8. No scenario or ink fix
  was needed; everything matches, lines word for word. Recompiled ama_owusu.ink with inklecate:
  the json already matched the committed one.
- Validator: 0 errors, 17 warnings. One NEW warning beyond S2's 17 (#64, the
  `workstation_screen_changed:chidi_pc` habits mapping "fires on some leaves only") -- expected,
  B4 wants a locked leave and `act_midday`. S2's grumble_gone warning is resolved by the cake
  magnet. No cake-in-a-room stale warning (cake is held). V8 budget all within limits.
- Added resume-overlay handling to the BC1 probe's reload() (see below). Not yet sufficient.

## BC1 is blocked -- read this before retrying
Probe: `tools/playtest/showcase-bc1-cake-reload.mjs`. Usage:
`node tools/playtest/showcase-bc1-cake-reload.mjs --scenario office_life_showcase --room office --cake cake --port 3094 [--cases 1,2,3,4] [--eaters chidi_okeke,jun_watanabe] [--wait 22]`.

All four cases fail at `page.reload()`, never reaching the cake logic. First load of each fresh
game builds fine. After reload the game has saved progress, so the session-resume overlay shows
(diagnostics, games 7530/7531: hasProgress true, overlay flex, "RESUME SESSION?"). The probe now
clicks `#session-resume-btn` after reload, which hides the overlay, BUT the Phaser scene still does
not rebuild: `window.player`/`rooms`/`npcNeedsSystem`/`gameScenario` never return within 40 s and
the client does not re-fetch scenario/room/ink.
- The only 503 is `POST /tts` (expected keyless, harmless; first load works with the same 503). The
  `ERR_FAILED` console lines are the probe's own `/tts` route abort. 503 is NOT the blocker.
- Candidates for the no-rebuild: (a) a PARALLEL session on :3094 -- the harness cwd kept switching
  to `.claude/worktrees/p-ol-m05` during this run, so another session was likely driving the same
  server; (b) a standalone reload/resume path that does not re-bootstrap for this scenario (no
  reload of this scenario on :3094 has ever been proven live -- S1 R11 and S2 reload were left open).
- Next steps: confirm whether p-ol-m05 (or any) session shares :3094; retry when it is idle, or get
  the orchestrator's OK to use a second port (MEMORY "worktree live proof on :3002"). If it still
  fails alone, the bug is the standalone reload resume path, not the cake -- isolate with
  `/tmp/.../bc1-diag2.mjs` pattern (reload, click resume, poll for window.rooms). No engine edits here.

## What each midday task listens for (mappings on Ama unless noted)
- `use_open_screen`: `workstation_accessed:jun_pc` (cooldown 0). Fires when the player uses Jun's
  open PC. The same event also brings Jun back early (his work coupling) and pulls his work need.
- `see_caught`: on JUN, `npc_caught_at_post:jun_watanabe` (cooldown 30000), with bark B8. Fires once
  Jun walks back into the office and the viewer is within ~1.5 tiles of his desk or has his PC open.
  Ama's B6 (`npc_caught_at_post:jun_watanabe`, delayMs 2500) is the paired host line; close the PC
  first or B6/B8 wait for the minigame to close.
- `see_cake_eaten`: `magnet_finished:cake` (onceOnly), bark B7. Fires when the last of the 2 servings
  goes.

## How to call lunch (the gate)
Talk to Ama, choose "Let's do lunch." The ink gate: if `not kitchen_seen` -> A26 and back to hub;
else if `chidi_pc_owner_away or jun_pc_owner_away` -> A29 and back to hub; else A16, A30,
`#set_global:act_midday:true`, exit. So: enter the kitchen once first (sets `kitchen_seen`), and wait
until Chidi AND Jun are at their desks (not out on a coffee run). The two owner_away globals are
engine-published by workstation-state.js and declared in globalVariables; they sync into Ama's ink
when the conversation opens, so a conversation held open while they walk back keeps stale values
(R13) -- close and reopen. `act_midday` true sets Chidi/Jun hunger 20 and Graham/Agnieszka hunger 62.

## How to trigger Jun's PC and the badge beat
- After lunch is called (`act_midday` true), Chidi and Jun leave for the kitchen. Chidi locks his
  screen on the way (B4, needs sound off to read; he locks on every trip over 10 s). Jun does NOT
  lock (`habits.screen.lockChance 0`), so his PC stays open -> B5. Use Jun's open PC
  (`moveToNear('jun_pc')`, interact) to tick `use_open_screen`; using it also brings Jun back early.
  Close the PC and wait by his desk; when he arrives he catches you -> B8 then B6, `see_caught` ticks.
- Badge: `jun_badge` has `leftBehindChance 0.7`, so on ~70% of Jun's lunch leaves it stays on his
  desk (revealed by `jun_badge_left`). Take it before he returns; on his return `npc_left_item_gone:
  jun_watanabe` fires -> B9 "Jun's just found his badge gone. That was you." No task; bonus beat.
  Retry the run until the 70% roll lands (T14).

## How to drop the cake
The cake starts in the inventory. `inventoryAct('cake', 'Drop here')` puts it where the player stands
(on a table top if beside a table, item-drop.js). Drop it in the office once all four are back and
sitting. Those who see it and are tempted (hunger at or below 70) walk over; two eat (`cake` lines),
anyone still walking when the 2nd serving goes turns back with "Missed it." (grumble_gone). When the
last serving goes, `magnet_finished:cake` -> B7 and `see_cake_eaten`.

## Live-run rules (unchanged)
Port 3094 only. Keyless: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails
server -b 127.0.0.1 -p 3094` with `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/
BreakEscape/vendor/bundle` and `RBENV_VERSION=2.7.8`; grep the log for the GEMINI_API_KEY warning;
record the puma PID from `ss -ltnp`; kill ONLY that PID. Use only game ids new-game.rb prints this
run; never edit game rows or the DB. Never request /tts (route-abort it). Headless, setFPS(20),
fixed steps on. Reload only with page.reload(), at least 20 s after setting a key global. Commit
explicit paths, no attribution lines, UK English, no em/en dashes, no model names in repo files.

## Server
This run's server (PID was recorded in tmp/s3/server.pid) is killed at the end of this pass.

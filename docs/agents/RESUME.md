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

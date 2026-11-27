# Handover: wrap review fixes (M1, M3, items 5 and 8)

Branch feat/ca-living-office-build. Commits: 105cbcacb (M1), 1f4f0d3d1 (M3, items 5 and 8).

## Done
- M1: both test_ca01_panel chain barks carry `globalVars.kit_quiet === true` (now in the set piece, regenerated).
- M3: ca01 chain moved into set piece `ca01_recall` (office_kits/brightwell_foods.json: staff patches for both colleagues, host `mappings`, `globals`, timer). New placeholder `{chain}` in office_kit._subst (keys too). Row `test_ca01_panel` added to episodes.json (handAuthored, tier O, stepAway). `--kit` into scratch reproduces ca01 unchanged and test_ca01_panel differing only by: npcThoughts/chatter/stepAway key order (moved to where apply_kit puts them, as in ca01), plus the NEW timer fallback `kit_ca01_t_done` (12 s after kit_ca01_out, sets kit_ca01_done) and Agnieszka's resume on kit_ca01_done.
- Guard: office_kit.hand_written + apply_training_room.WouldDropHandWrittenContent; kit_text refuses (CLI exits non-zero naming the content) unless `--allow-drop`.
- Item 5: row field `keyMessage`; tool writes outcome.messageGlobals {<id>: kit_key_caught} and declares kit_key_caught; renamed kit_fraud_caught -> kit_key_caught everywhere (inks recompiled with bin/inklecate, fixtures, tests, GATE_B.md). e1/defend.json no longer carries messageGlobals. Validator lint added (scripts/validate_social/triage.rb, own result-name clash) with a test. History docs (CA01_DIALOGUE_EDITS.md, HANDOVER_message_globals.md) still say kit_fraud_caught on purpose.
- Item 8: `--kit` outdir required (exit 1 with message); tests updated.
- Tests: test_office_kit.py 49 OK; validator-social-triage-message-globals 12/12; validator OK (0 errors) on ca01_invoice_fraud, test_ca01_panel, test_ca_office_kit, test_ca_office_kit_defend, test_triage_message_globals (dungeon_graph churn moved to tmp/delete/graphs).

## Not done / open
1. `bin/test-js` was started in the background (task output .../tasks/bkttmfwuq.output) and had not finished when I stopped; rerun it (expect only m01-decode-task failing). Also run the other Ruby/JS validator tests touched, and `python3 test_apply_training_room.py`.
2. Live proof (a) catch, (b) mid-chain reopen, (c) timer fallback: NOT run. A throwaway worktree `.claude/worktrees/x-ca01-tool` was being created at 1f4f0d3d1 by a background `git worktree add` that was still checking out (45k status lines) when I stopped; check it finished (`git -C ... status`), or remove it (move, never rm) and recreate. Then overwrite its scenarios/test_ca_office_kit/scenario.json.erb with the panel build (scenario_id stays test_ca01_panel inside; check mission 278 still serves it) and copy the panel ink json files the fixture needs (scenarios/test_ca01_panel/ink/*.json into scenarios/test_ca_office_kit/ink/ or fix storyPath). Start keyless server on 3003 (tools/playtest/start-keyless-server.sh 3003), make games with scratchpad ca01_live/final/mk_game.sh, drive with playtest-session.js using ca01_live/final/panel_catch.jsonl as the base (rename kit_fraud_caught to kit_key_caught in its GLOBALS eval). Plan: (a) as panel_catch; (b) after Look up click, reopen training_kiosk within 2 s, Finish, X, then watch 30 s: barks at most once each, no Adaeze bark if quiet released first, kit_ca01_done set by the timer (~12 s), kit_quiet false; (c) swallow `npc_arrived:kit_agnieszka_duda` by wrapping window.eventDispatcher.emit (NPCEventDispatcher.emit(eventType, data) in systems/npc-events.js) before Look up, expect kit_ca01_done at ~12 s and both colleagues resumed (window.npcNeedsSystem.states.get(id).scriptSuspended false). Stop the server by PID.
3. A JS conformance test for the panel chain (bark quiet gate, timer) was not added; the Python tests cover it (RegenerateTheChain in test_office_kit.py).
4. CA01_BUILD.md still says chain mappings cannot go in the set piece (wrong; flagged in the review as M6 part). Not edited.

## Gotchas
- Never write --kit output into scenarios/ directly: scratch dir, diff, copy back.
- The auto-mode classifier blocks `rm -rf`; use new scratch dir names.
- Resume on an NPC that is not suspended is a no-op (npc-needs.js control), so the double resume (3 s after agn_there, and on done) is safe.
- Held barks drop when the mapping condition no longer holds, so after a mid-chain reopen the Adaeze mapping may not set kit_ca01_done; the timer fallback is what completes the chain then.

## Done (verification pass, code 1f4f0d3d1, no code changes)
- Tests: bin/test-js 886/888 files (m01-decode-task as expected; validator-social-indicators failed under load, passes 6/6 alone). office-kit-quiet-and-stub 10/10, triage-message-globals 13/13, validator-social-triage-message-globals 12/12, test_office_kit.py 49 OK, test_apply_training_room.py 10 OK.
- Live proof on :3003 (mission 278 with the panel build): (a) catch, game 10409, PASS; (b) mid-chain reopen, 10410, PASS (Adaeze bark lost by design, 12 s timer completes, kit_quiet false); (c) blocked walk, 10411, PASS (4 emits swallowed, timer done at ~12.1 s, both colleagues resumed); (d) miss, 10412, PASS (kit_key_caught false, MISS host lines). Details: scratchpad ca01_live/wrap_fixes/RESULTS.md.
- Finding for review minor m1 (not fixed): Agnieszka's chain bark leaves npcWorldBubbles.says after about 0.25 s (game 10439); Adaeze's stays about 8.7 s.

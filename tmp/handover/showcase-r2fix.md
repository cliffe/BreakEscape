# Handover: office_life_showcase R2 fixes (edits + checks done; full test-js and live proof pending)

Worktree `.claude/worktrees/p-ol-showcase`, branch `plan/ol-showcase`. Port 3094 only; start with
`-P $PWD/tmp/r2fix/server.pid`. Keyless server (`env -u GEMINI_API_KEY`), grep boot log for the game
ids, kill only that PID. Abort only POST /tts via `u => /\/tts$/.test(u.pathname)` (never the glob).
Server recipe: `tmp/handover/showcase-r1fix.md`. Reuse the R1 proof script patterns in
`tools/playtest/showcase-r1fix-proof.mjs` and lib `tools/playtest/showcase-s4-lib.mjs`.

## Done (committed as ffa3f39ee)
All nine R2 minors in `planning/BUILD_REVIEW_R2.md` plus the notice-board clip. Finding-to-fix table
and the three voiced-line changes are in `planning/BUILD_REPORT.md` "R2 fixes".
- m1 scenario.json.erb: `see_who_stays` mapping widened to `npc_used:*` with
  `data.npcId === 'zainab_hussain' && data.need === 'caffeine' && globalVars.act_evening === true`
  (need field confirmed carried on npc_used, npc-needs.js:3701-3707). npc_left_post path kept.
- m2 scenario.json.erb: evening aim description rewritten with the day-tasks-close warning.
- m3 PLAN.md: sections 6 (lines ~153/158/163), row 3.1, section 9 (line ~351), section 10 (R14 lamp).
- m4 scenario.json.erb: dropped "THINGS TO TRY\n\n"; shortened board to 12 one-line bullets, no blanks.
- m5 test/js/validator-exchange-line-length.test.mjs: topic type-check test (number/empty/blank/valid/
  none) via ValidateNpcNeeds.check; backlog line in docs/IDEAS_BACKLOG.md.
- m6 ama_owusu.ink: VAR cake_servings mirrors the engine global; midday branch shows A11+A33 when
  cake_servings>0, else new A34 "The cake's gone already. Tell me when to call it a day."
- m7 ama_owusu.ink: A32 gated on `kitchen_seen and heard_exchange_cooler_chat`; kitchen_seen-only -> A7.
- m8 scenario.json.erb cooler pool: "Not bad, you?" -> "Quiet one today, isn't it?".
- m9 ama_owusu.ink: A31 -> "They won't be back once they've gone home. Any tasks still unticked first?"

## Checks run
- inklecate recompiled ama_owusu.ink -> .json (only ama changed; cooler pool is scenario JSON).
- validate_scenario.rb --no-graph: 0 errors, 17 warnings (baseline). Run with RBENV_VERSION=2.7.8.
- node tools/playtest/showcase-lines-check.mjs: PASS (84 table rows + 24 pool lines).
- node --test test/js/validator-exchange-line-length.test.mjs: 3/3 pass (new topic test included).
- bin/test-js (expected 760): NOT run here (context budget). Run it next; it is the commit's trust gate.

## Lines changed (need the user's yes before voicing)
- A31: "They won't be back once they've gone home. Any tasks still unticked first?" (74 ch, 13 w)
- A34 (new): "The cake's gone already. Tell me when to call it a day." (55 ch, 12 w)
- cooler pool: "Quiet one today, isn't it?" (26 ch) replacing "Not bad, you?"
A32 changed only its gate, not its text; no re-voicing.

## Still to do
1. bin/test-js full run (expect 760). Commit any follow-up as a separate commit on the branch.
2. Live check on :3094, headless, setFPS(20) fixed steps on, fresh game per edit via
   `tools/playtest/new-game.rb office_life_showcase`:
   - m1: in the evening, switch the office coffee off while Zainab walks to it; she falls back to the
     kitchen coffee and `see_who_stays` ticks on her use (npc_used:kitchen_coffee).
   - A32's new gate: morning after kitchen entered but cooler NOT heard shows A7 (not A32); after the
     cooler exchange is heard, "What should I try next?" shows A32.
   - the notice board fits with no scroll (interact tour_notice; screenshot the modal).
   - A31's new text in the confirm, and "Not yet." returns to the hub with no blank bubble.
   Use only game ids new-game.rb printed this run; never edit game rows; never probe /tts.

## Gotchas
- cake_servings is the engine-owned `<id>_servings` global (cake id = "cake"), written on each serving
  and surviving reload (npc-needs.js:885-890); declaring the VAR syncs it in at conversation start.
- Do not stage s3-*.png / dungeon_graph.* (left unstaged per S3 precedent). Do not touch the
  npc-needs.js magnet code, helpers.js or scenario-brief.js.

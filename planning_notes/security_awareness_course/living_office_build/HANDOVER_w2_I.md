# Handover: wave 2 integration (I), stopped at the 150k guard

Worktree `.claude/worktrees/b-ca-lo-w2`, branch `feat/ca-living-office-w2`. Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/` (rows.py, changed.txt, shells.txt, val/*.txt, testjs.log; may be cleared).

## Done

- Step 0: `git merge --no-edit main` merged cleanly (f2c758e07). The uncommitted `office_kits/carrholme_services.json` change (cooler `useFrom` dy 1.25) was left alone; it is the Carrholme live-proof agent's.
- Commits after the merge:
  - 84f8fa3bb episodes.json: 35 new rows (ca00 convention row, 17 full shells `handAuthored: true`, 16 generated twins, ca17) and the ca13 twin row amended; `keyMessage` from the H packages (all ids confirmed present in the first triage set, with a set outcome, of full shell and twin; ca17 `e17_meeting_app`, set has an outcome though its messages have none); `hostLine` true on all but ca00 and ca17; `convention` added to `_note`.
  - 1st tool commit: `apply_training_room.py --kit` could not handle the ca00 convention row (no triage set, no host mappings); fixed (guarded the `messageGlobals` splice and the empty `eventMappings` creation).
  - 8291063a3 regeneration: proof5 procedure run on the merged tree, then the 53 differing files copied back (36 `scenario.json.erb`, 17 twin/ca00 `.ink`) plus 17 recompiled ink `.json`. Only the 36 shells changed; ca01, ca12, their twins and test shells match HEAD. All `scenarios/ca*/ink`, `_office_kit/ink`, `test_ca*/ink` ink recompile to byte-identical json (nothing stale).
  - bf39af8d8 tests: `gen_core00_shell.build(bare=False)` added (as `gen_e1_shells.defend_only(bare)`), `test_office_kit.ca00_shell()` uses `bare=True`; two tests that read the ca03 shell now filter out `kit_` NPCs / strip the kit.
- proof5 on the new HEAD: 0 differences (40 generated shells, 42 kit-spliced, 137 files compared; no-kit pass 20 rows, 59 files). The ca02 twin `conceptPanel` equals the `e2/defend.json` fragment panel (checked, True).
- `python3 -m unittest test_office_kit test_apply_training_room test_proof5`: 87 tests OK. The two HEAD-dependent test_proof5 tests pass unchanged on the new HEAD (they depend on HEAD being consistent, not on named shells).
- Validator (`--strict-social --no-graph`) on the 36 shells: 0 ERROR lines each. Warnings are advisory: every shell has the existing 'person' unknown-field warning on kit NPCs; dialoguelint findings: ca13 `ink/gwen_pritchard.ink:110` ("Understood.", on main already) and ca14 `ink/julian_sallow.ink:38` ("however", the new P-H3 host line; the twin may carry it too; fix is "no matter how well" but it changes a P-H3 line, so left for the review pass).
- `ruby tools/check_mapping_index_drift.rb main`: 36 scenarios, 0 failures (no new eventMappings need to be last-only issues).
- Pin test (28 check shells, annual shell, 12 `room_aw_*` maps): no pinned file differs from main (`git diff main HEAD --name-only` shows none); the pin test itself is inside the full `bin/test-js` run.

## In progress / not done

1. Full `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/test-js` was started in the background (task b30q2teft, output `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/tasks/b30q2teft.output`; the scratchpad `testjs.log` holds the same). Read the FAIL lines at the end. Re-run `social-mail-ink-runner` alone if it fails and report the flake. Also run T (`social-awareness-office-kit.test.mjs`), QS (`office-kit-quiet-and-stub.test.mjs`) and the payload-scan files individually, since step 6 names them and T/QS carry the pin and keyMessage/D13 checks.
2. Carrholme cooler: the proof5 export is HEAD, so ca11 and ca11 twin were regenerated with `useFrom` dy 1 (committed). When the live-proof agent commits dy 1.25, re-run the proof5 procedure (see below) and recommit ca11 and ca11 twin `scenario.json.erb`. `python3 -m unittest` already prints `wrote ... ca11_misdirected_data...` (changed) because the working tree has the 1.25 edit: that is the sign.
3. Missing-clip counts: `BUNDLE_PATH=... bin/rails "app:break_escape:tts:wasted[<scenario>]"` for the 36 shells (`shells.txt`); list new unvoiced lines per scenario for the voicing card. Not run. Do not voice.
4. Ink routes: `scripts/ink_runtime_check` and `tools/run-ink-routes.sh` (arrived with main) run 246 routes; confirm no `ca*` scenario has route files (`ls scripts/ink_runtime_check` shows only m02-m08 route folders, so likely none). Not verified against `missions.json`.
5. Rubocop: no Ruby file was touched by I. Rails TTS tests: not run (section I does not ask for them beyond step 6).
6. Build log note (do not rewrite history): commit b55ba4c60 (label "P-SBM") holds P-KC's Carrholme files; commit 9df9d0c05 (label "Wave 2 test") holds P-KQ's Quayholt files. Content is correct. Record this in `W2_INTEGRATION.md` (not yet created) along with game ids once the live proofs run.
7. Section I steps 8 and 9 (join `W2_LINES_ALL.md`, npc-dialog-review across the batch, voicing card, merge main again and re-run step 6 on the tested hash) are not started.

## Proof5 regeneration procedure (to repeat for ca11)

`cd planning_notes/phishing_and_social_engineering/awareness && python3 proof5.py --keep <scratch>/p5` (needs everything committed; it exports HEAD). Its FAIL lines list the changed paths; copy each `<scratch>/p5/root/<path>` over the real tree, recompile changed `.ink` with `bin/inklecate -o <x>.json <x>.ink`, commit with explicit paths, then `proof5.py <scratch>/p5b` must print 0 differences.

## Live proofs section I needs (Haiku, :3005, fresh games via `new-game.rb`, at most four shells per agent, game ids to `W2_INTEGRATION.md`)

- Text-tier shell per company: ca02 (Tarrowby), ca04 (Merrin and Sallow), ca05 (Quayholt), ca07 (Brightwell), ca11 (Carrholme, cooler without pool).
- ca00 (hello knots wherever the staff are, nothing spoken unprompted, cooler included) and ca17.
- One twin per generator: ca02 twin (`gen_e2_e4`), ca03 twin (`gen_e3_e5`), ca06 or ca07 twin (`gen_e6_e7`), an e8-e20 twin (`gen_e8_e17`), and ca13 twin (hand-authored); each raises and lowers `kit_quiet` and concludes.
- Cases: staff leave home, use the source and sit at all three new companies; each kit global turns at its save; nothing reaches the learner with the kiosk open; after the result the host hub speaks the right CATCH, PARTIAL or MISS block once and each colleague gives their episode knot; reload after the result keeps both; one check shell has no staff and no kit global in saved state; no synced key other than `kit_*`.
- Every other shell gets the scripted critical-path run (PLAN 12).

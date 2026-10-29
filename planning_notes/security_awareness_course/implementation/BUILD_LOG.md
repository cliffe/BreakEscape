# Build log: awareness episodes E8 to E20 and the work packages

Started 2026-10-29. Orchestrator: Opus 5.5. Plan: `00_README.md` (work order §4, routing §6, checks §8, done §9). One section per wave; every review round gets a severity table; every decision a line with its reason.

## Routing

- Engine packets (`02_ENGINE_WORK.md`): `general-purpose` Sonnet, each in its own git worktree, merged by the orchestrator. Bridges run on main after the merge (the keyless :3001 server serves the main tree, not a worktree).
- Content (fragments, erb content, ink, items, debrief copy) and content reviews: `opus48`.
- Wiring (P2 skeleton, P4 to P12): Sonnet. Scripted bridge reruns and searches: Haiku; a Sonnet run confirms any failure.
- Review phases after each episode builds, as the built product ran them: design review C1+ (`scenario-design-review`), dialogue review C1+ (`npc-dialog-review`), playtests (Sonnet personas, reload, blind), light puzzle-chain pass where gating changed, rooms/lighting/POV for new rooms only. Fresh reviewer each round; fixer resumed; stop when a round finds nothing above minor (at least 3 rounds, at most 5).

## Wave 1 (2026-10-29)

| Agent | Model | Work | Files it owns |
|---|---|---|---|
| eng-a | Sonnet, worktree | ENG-01, ENG-09b, ENG-09d (+ their ENG-08 rows) | episode runner, debrief, guards |
| eng-b | Sonnet, worktree | ENG-03a, ENG-03b (+ ENG-08 rows) | triage page states, landing-page builder fakeCheck |
| eng-c | Sonnet, worktree | ENG-04 (+ ENG-08 rows) | consequence `mistake` stage, montage flip |
| eng-d | Sonnet, worktree | ENG-09a, ENG-11 (+ ENG-08 rows) | triage `choice` kind, sort drill overlay |
| content-e8 | opus48 | E8 P1 fragments, host ink, full-erb content | `AW/e8/`, E8 ink |
| content-checks | opus48 | `general_v2` 20 items (10_CHECK_FORMS) | the new check fragment |
| content-wp | opus48 | WP-12 Part B (core_17 annual), WP-15 | annual fragment, E3/E6 swap items |

Decisions:
- Four engine agents in parallel rather than serially: the packets are opt-in on separate keys, so conflicts are limited to shared lists (`STAGE_IDS`, schema, validator); the orchestrator resolves them at merge.
- `data_conduct` waits on P5b (Carrholme room); it starts with E11.

### eng-b stopped (2026-10-29)

A safety classifier stopped eng-b (ENG-03a/03b) while it was still reading code: "Your response above was stopped by a safety classifier — this is not a tool or API error. The rest of it was withheld, and tool calls in it that had not finished did not run. Do not produce that content again, even reworded." No code written; worktree branch `worktree-agent-ae74dcc1fb6ce7fc5` clean. Per AGENTS.md, a retry of the same prompt on `sonnet-cvp` or Haiku goes to the user. Its code-reading notes, kept for the retry: verdict relabel already exists via `set.labels.verdict.*` (add `verdictLabels` as shorthand); pages without `url` need handling in `page()`, `defaultWho` and `triage.rb`; the fakeCheck mode also needs a builder-minigame branch (rows, `_sig`/`_pick7`, inspect step, `closeResult`/`linkInfoFor`, an `attach()` host-id equivalent), not only model, renderer and flip.
- User (2026-10-29): retry the stopped ENG-03 task on opus48 (same prompt plus the first attempt's code notes); if it needs escalating, Haiku gathers the game context first and cvp (metered) gets only the narrow residue. Running as eng-b2 (opus48, worktree).

### Wave 1 results so far

- eng-a (ENG-01, 09b, 09d): merged. Episode-level `stepLabels` added on top of the built `strings.stepLabels`; ENG-09d became registry guards (`FULL_EPISODES`, `CHECK_ROLES`, parity `EPISODES`), so each new shell needs one line. `bundle exec` leaks bundler env into child ruby in a worktree: run `bin/test-js` without it there.
- eng-c (ENG-04): merged (6acf291c6). Conflicts in `episode-runner-minigame.js` (imports, `_stripLabels`) and `flip-view.js` (signature) resolved keeping both packets. The stage advances only on `finished: true`. Open: beat choices not recorded for measurement; sandbox options are in authored order (authors must not list the safe option first: content reviewers check this). E16's "end on Samira" holds only if `samira` is authored last.
- After the merge: `bin/test-js` 296/298; the two failures are the new registry guards flagging the in-progress `awareness_e8_after_the_click` folder (expected until E8 wiring registers it).
- content-checks (`general_v2`, 06e691349): 20 items, both forms validate in scratch shells, balance lint clean with a positive control. Queued for design review C1: item 8 scores `reply_to_differs`, a header tell that the built forms stopped scoring (C2-M6); consider a visible tell instead.
- Running: bridge regression on main (Haiku), `general_v2` generator and shells (Sonnet), eng-d, eng-b2, content-e8, content-wp.

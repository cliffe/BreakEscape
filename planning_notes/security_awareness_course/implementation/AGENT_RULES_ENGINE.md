# Rules for engine agents (awareness E8 to E20 build)

Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on a neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model.

Read: `00_README.md` §7 (do-nots); `02_ENGINE_WORK.md` "How every packet is guarded", "Standard engine acceptance", your packet sections and the ENG-08 section; the episode briefs in `episodes/` that use your packet. Where a packet and the code disagree, the code wins: keep the packet's intent, choose sensibly, report the difference.

What is already on main (2026-10-29): ENG-01 (flip aftermath, episode `stepLabels`), ENG-09b (conceptPanel array), ENG-09d (shell registry guards), ENG-04 (`mistake` stage, montage flip, `consequence-sandbox` scene), ENG-09a (`choice` triage kind), ENG-11 (`sort-drill` scene, `awarenessEpisode.sortDrill` run first in the defend stage). ENG-03a/03b are in progress elsewhere.

Code conventions:
- Runner classes `epr-`; flip/debrief views `aw-`; triage `tri-`. Every learner-facing string has a default and a data override (follow `strings.stages.<id>`, `set.labels`, `sortDrill.strings`). No awareness ids hard-coded in reusable minigames.
- Fonts: `--se-font-readable` (GNF pixel font) for text, `--se-font-address` only for URLs, domains, emails and handles; nothing below 13px. One Esc closes one layer.
- Opt-in on the new key or stage id; without it, output is exactly as before (prove with a test). Tests use fixtures, never live `scenarios/awareness_e*`.
- Other agents work in parallel worktrees on the same shared lists (`STAGE_IDS`, `ATTACK_STAGES`, `scripts/scenario-schema.json`, `scripts/validate_social/*.rb`, `minigames/index.js`, `show.html.erb` stylesheet links, the runner's `_launch`). Keep those edits small and local, never reformat.
- Test harnesses copy runner files individually and stub some modules: if you add an export a stubbed module needs, add it to the stubs.

Process:
- You are in your own git worktree. Do not edit the main checkout.
- If `node_modules` is missing, symlink it from the main checkout; never commit the link.
- Run `bin/test-js -j 4` WITHOUT `bundle exec` (bundler env breaks child ruby in a worktree), and the validator with plain `ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph --skip-ink` over `scenarios/awareness_*`, `lab_social_engineering`, `test_social_*` (no FAIL). `bin/rails test` cannot run in a worktree; say so. No browser bridges (the :3001 server serves the main tree; the orchestrator runs them after merging). Never touch :3000.
- Never `git stash`, `git checkout -- <file>`, `git reset`. Restore `dungeon_graph.*` churn with `git show HEAD:<path> > <path>`.
- Commit on your worktree branch with explicit paths (check `git diff --cached --stat`), no attribution lines; commit before long suites, fixes as follow-ups.
- Content rule: attack content stays at template and psychology level; no working payloads, commands or pages.
- UK English, match surrounding code style and comment density.
- **Never run `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` or `db:setup`, in the main tree or a worktree.** Every checkout shares one Postgres database (`break_escape_development`); on 2026-10-30 a worktree `schema:load` wiped every game and user, with no backup. Only `db:seed` is allowed. If a server or `new-game.rb` fails for a schema reason, stop and report.

Return: branch and commits; change list (files, keys, tests); test results with counts; where the packet was wrong or thin and what you chose; anything open.

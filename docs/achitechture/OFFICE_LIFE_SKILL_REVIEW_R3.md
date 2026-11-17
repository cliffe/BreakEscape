# mission-office-life skill, review round 3

Scope: `.claude/skills/mission-office-life/SKILL.md` and `references/*.md` at 9b52a5cd3 (plan/ol-m03), the diff since R2 (`9712e77de..9b52a5cd3`), the R2 Outcomes table, AGENTS.md, the playtest-scenario, tts-audio and pixellab-character-pipeline skills, `bin/rails`, `tools/playtest/new-game.rb`, `start-keyless-server.sh`, `train-check.sh`, the bark and TTS code, and cites on build/ol-m03 (b4b7c5119).

All of the requested scope was checked.

Counts: 0 blockers, 1 major, 5 minors, 4 nits.

## R2 findings

| R2 | State at 9b52a5cd3 | Evidence |
|---|---|---|
| M1 worktree server | Fixed: the command, env, port rule, PID rule and the start script warning are all there. New gaps in the recipe are in m3 and n1. | `measurement-recipes.md:7` to `:20`; SKILL.md:211, :212, :47 |
| M2 plan rounds past 5 | Fixed: plan and build loops split, plan stops at 5 unless a blocker is open. Wording conflicts remain (m2) and the plan loop has lost the delta rule (m1). | SKILL.md:170 to :181; `checklists.md:26` |
| m1 openings routing | Fixed. Small wording point in n3. | SKILL.md:141, :197 |
| m2 delta timing and exceptions | Fixed for the build loop and in the checklist. | SKILL.md:180, :181; `checklists.md:21` |
| m3 barks outside V6 | Partly fixed. The client claims hold (checked below), but the voicing route is unsafe as written (M1), and Before merge has no bark check (m5). | `gotchas.md:84`; SKILL.md:128, :230 |
| m4 plain sitter | Fixed. `SOFA_FIX.md:52` on build/ol-m03 carries the sentence quoted. | `gotchas.md:53`; `measurement-recipes.md:82` |
| n1 to n4 | Fixed. The R1 Outcomes row now cites `docs/IDEAS_BACKLOG.md:284` on build/ol-m03, which holds. | SKILL.md:39, :236; `mapping-patterns.md:153`; `measurement-recipes.md:26` |

## Claims checked and found correct

- Bark voicing in the client: `npc-barks.js:470` calls `_speakBark`, which calls `TTSManager.play(npcId, text)` (`:162`, `:167`; same lines on build/ol-m03). The `/tts` action (`games_controller.rb:714`) resolves the text through `TtsLineResolver` (`:737`), which accepts barks via `ScenarioBarkValidator.canonical` (`tts_line_resolver.rb:45`, `:61`, `:68`). `bark_texts` reads `eventMappings[].bark`, `sendTimedMessage.message`, `timedMessages` and the NPC's chatter (`scenario_bark_validator.rb:36` to `:51`). On a cache miss with a key the action generates and caches the clip.
- `tts_line_extractor.rb:13` to `:14` and `tts_office_lines.rb:9` to `:10` say what the skill says they do, on both branches.
- Worktree server: `bin/rails` sets `BUNDLE_GEMFILE` and runs `bundler/setup`, so with no `.bundle/config` in a worktree, `BUNDLE_PATH` is needed. `train-check.sh:42` to `:45` sets the same default, and `RBENV_VERSION=2.7.8` matches `.ruby-version`. `new-game.rb:520` prints URLs from `PLAYTEST_PORT` and `:551` prints `FLAGS_XML`. `session-start.sh` takes `--url` and `--flags`. GEMINI_API_KEY comes only from the environment (no dotenv), so `env -u` is enough to make the server keyless.
- Stage 3 against AGENTS.md:41, :43: the plan loop stops at 5 unless a blocker is open, and the build loop's three exceptions are copied correctly.
- Stage 6 is ordered as the user asked (four inits, pick, then `--from-talk`). The step naming is a problem (m4).

## Cites spot-checked against build/ol-m03 (all hold)

`npc-needs.js` :271 to :273, :290 to :293, :2996 to :3004, :2954, :3062, :310 to :314, :3326 to :3359, :3377, :3427, :3445; `workstation-state.js:155` to `:157`; `NPC_NEEDS_SYSTEM.md:474`; `SOFA_FIX.md:52`; `SIMS_TIDY_LOG.md:600` to `:612`; m03 `scenario.json.erb:838` to `:840`; `tts_line_extractor.rb:13` to `:14`; `tts_office_lines.rb:9` to `:10`; `npc-barks.js:162`, `:167`, `:470`.

## Major

### M1. The bark-voicing step names no server and does not say where the clip lands

- Where: `gotchas.md:84`; SKILL.md:128, :230; `mapping-patterns.md:156`; SKILL.md:156 (approval item).
- Evidence:
  - The step says "on a keyed server, after the user's yes on the spend, trigger the bark once". The only sanctioned keyed server is :3000. The playtest-scenario skill ("Servers: with and without TTS") says it belongs to the user: agents never start, stop or restart it, and must ask if it is down. Nothing in AGENTS.md, playtest-scenario or tts-audio lets an agent start its own keyed server. The section 1 recipe implies the key is in the agent's environment (it unsets it), so dropping `env -u` gives a keyed worktree server that no rule covers.
  - :3000 runs the main checkout. `TtsService::CACHE_DIR` is `BreakEscape::Engine.root.join("tts_cache")` (`tts_service.rb:49`), so a clip made there lands in the main checkout's `tts_cache/<scenario>/`, not in the branch worktree the step then tells the builder to commit from. A branch game played on :3000 does resolve the bark, because `TtsLineResolver` reads the game row's `scenario_data`. The result is a clip sitting untracked in the shared tree and none on the branch, or a commit in the wrong tree.
  - "Trigger the bark once" means playing to the bark's event. Every uncached line heard on the way (other barks, chatter, ink) is generated too, and that goes beyond the yes. The yes itself is asked "stating the V6 clip count" (SKILL.md:230, :156), and V6 does not count barks, so the bark clips are paid for under an approval that never listed them.
  - "The step is its generic one" misreads tts-audio. Its generic route is the batch (tts-audio "Voice a mission" step 2), which skips barks. The live endpoint writing clips is mentioned only as a gotcha (tts-audio, "The live endpoint (your :3000 server) writes clips during play").
- Risk: a clip committed nowhere or in the wrong tree, an agent running a keyed server against standing rules, or generations outside the approved count.
- Fix: in `gotchas.md` "Voicing", SKILL.md:128 and :230, and `mapping-patterns.md:156`:
  1. Add the number of new bark clips (one per bark per voice) to the voicing approval item next to the V6 count.
  2. Make prefer-pools-or-knots the default. A new bark needs a reason in `SPOKEN_LINES.md`.
  3. Say who voices a bark and where. Either hand the bark list to the integrator to voice on :3000 after the yes and copy the clips from the main checkout's `tts_cache/<scenario>/` into the branch, or, if the user agrees, start one keyed worktree server just for this. In either case, make one `POST /games/<id>/tts` per bark (`npc_id` and the exact bark text) on a game made from the branch, not a play-through, then stop the server by PID.
  4. Confirm each clip with `TtsService` `cache_key_for` and `cache_path`, then commit with explicit paths.
  5. Drop "the step is its generic one".

## Minors

### m1. The plan loop has no delta rule

- Where: SKILL.md:170 to :175 (plan) against :180 (build only).
- Evidence: AGENTS.md:43 makes rounds from round 4 (or after a clean Opus round) delta reviews on the cheaper tier, "whatever the stage" (:41), and plan reviews run five rounds here, so plan R4 and R5 are deltas. SKILL.md gives the rule only under "Build review". `checklists.md:21` states it for every round, which is the only reason this is not a major.
- Fix: move the delta bullet (and its three exceptions) above the two loops as applying to both, or repeat it under "Plan review". Note that the delta for a plan is the diff of the rewritten PLAN.md.

### m2. The stopping rules disagree across the skill and its sources

- Where: SKILL.md:172, :174, :179; `checklists.md:26`; SKILL.md:14 (points readers to missions plan section 12).
- Evidence: SKILL.md:174 puts "After round 5, fix minors only" under the plan loop. SKILL.md:172 then says leftover minors at round 5 are listed as open, and a blocker open at round 5 allows round 6, which "minors only" forbids fixing. `checklists.md:26` puts the same "after round 5 fix minors only" under the build, where SKILL.md:179 keeps going past 5 while a major is open, so majors after round 5 must be fixed. `OFFICE_LIFE_MISSIONS_PLAN.md` section 12, which the skill sends readers to, says plan review is 3 to 5 rounds with an exit after round 3, and that built phases follow AGENTS.md's 2 to 5. SKILL.md:179 calls the longer build loop "the skill's own rule" without naming whose decision it is.
- Fix: one wording in both files. Plan: five rounds; the round 5 fixer fixes what it can and lists the rest as open; round 6 runs only for an open blocker. Build: at least five rounds, then stop at the first round with 0 blockers and 0 majors; from round 6 on, fix every finding the round raises. Add a line saying this skill overrides section 12's counts and cite the user decision it follows.

### m3. The server recipe blocks the shell and keeps no log, pid file or keyless check

- Where: `measurement-recipes.md:9` to `:14`.
- Evidence: the block runs `bin/rails server` in the foreground, so pasted as one command it blocks, and the following `ss -ltnp` never runs (in an agent's Bash call it is killed at the timeout). There is no log, so a GemNotFound or schema failure at boot is invisible, and the keyless check that `start-keyless-server.sh:31` to `:35` makes (the "GEMINI_API_KEY environment variable is not set" boot warning) is lost. There is no `-P`, so the default `test/dummy/tmp/pids/server.pid` is shared by every server from that worktree: a second one (m03 ran :3091 and :3094) refuses to start with "A server is already running". `train-check.sh:97` to `:101` and the start script both use `-P tmp/pids/server-<port>.pid`.
- Fix: `nohup ... bin/rails server -b 127.0.0.1 -p <port> -P tmp/pids/server-<port>.pid > tmp/server-<port>.log 2>&1 &` (or the Bash tool's background mode), a curl wait loop, `grep -q "GEMINI_API_KEY environment variable is not set" tmp/server-<port>.log` before any play, then the PID from the pid file or `ss -ltnp`.

### m4. Stage 6 treats the talk inits as a step after the bust

- Where: SKILL.md:223.
- Evidence: in the pipeline the talk init is the bust. The `bust` stage makes the candidates (`pixellab_pipeline.py:2462`, paid, 4 by default), and `pick <name> bust bNN` installs `<name>_talk_init.png` (pipeline skill line 55; `pixellab_pipeline.py:2304`). The skill asks for "4 alternative talk inits ... side by side ... with the character's concept and bust" and says the pipeline "does not state the first step". A builder can read that as a fifth paid run after the bust has been picked. "Make visemes for every NPC" can also send awareness-cast characters that already have `<key>_visemes.png` through 15 more generations each.
- Fix: "(1) the pipeline's `bust` stage: 4 candidates for each new character, shown side by side with the concept on a picks page (decisions page, Copy picks, saved inputs); (2) wait for the pick and install it with `pick`; (3) `visemes --from-talk` for each new character, and for each reused one that has no `<key>_visemes.png`."

### m5. Before merge has no bark check

- Where: `checklists.md:46`.
- Evidence: R2 m3 asked for a by-hand bark check "to Stage 7 and Before merge". Stage 7 has one (SKILL.md:230). The merge checklist accepts V6 at 0 uncached, which says nothing about barks (`tts_office_lines.rb:9` to `:10`).
- Fix: add "Each new bark in `SPOKEN_LINES.md` has a committed clip (checked by cache key), or is on the decisions page awaiting the yes."

## Nits

- n1. `measurement-recipes.md:10`, SKILL.md:211: the reserved-port list omits 3002, the second keyless worktree server named at AGENTS.md:237. The `ss` check catches it only if 3002 is up at that moment, so add 3002 to the list. `measurement-recipes.md:19` says the start script "runs the main checkout's code". It runs the checkout it lives in (`ROOT` from its own path, `start-keyless-server.sh:11`). The real reasons not to use it are that it is fixed to :3001, that it exits 0 when :3001 is up, and that a worktree copy has no `BUNDLE_PATH`.
- n2. `gotchas.md:84`: the client voices a bark only for an NPC with `npcType: "person"` and a `voice` (`useTTS` at `npc-manager.js:2033`, `:2132`, `:2571`; `npc-barks.js:450`). The phone beep after a 503 sounds only when the bark is a toast, not a bubble (`beep: !handle`, `:470`). Say both.
- n3. SKILL.md:141: AGENTS.md:111 sends game builds, office life included, to `opus55` "on every account". Making that depend on CVP, and writing "this account" into a skill, both age badly. The safeguard retry also drops AGENTS.md:112's "record the task type and the stop message".
- n4. `checklists.md:22` names reviews `M03_REVIEW_R<n>.md` style; SKILL.md:39 and :168 say `REVIEW_R<n>.md`. `checklists.md:21` leaves out the non-CVP `opus48` case that SKILL.md:180 has.

## Verdict

Revise. All six fixes (one major, five minors) are text changes. The major needs a choice of bark-voicing route (integrator on :3000, or a one-off keyed worktree server with the user's agreement). That choice is a new design decision, so per AGENTS.md:43 the R4 delta goes to `opus55`, not the cheaper tier. If the fix only adds the integrator route, which is already sanctioned, a cheaper-tier delta is enough.

## Outcomes

| Finding | Outcome |
|---|---|
| M1 bark voicing | Fixed. The "trigger once on a keyed server" step is gone. Barks go through the normal tts-audio batch and V6 (build/tts-barks), the voicing yes states the clip count including barks, and agents never start a keyed server. `gotchas.md` carries the pre-build/tts-barks line (count by hand, ask the integrator to voice). Edited in SKILL.md (bark checklist item, approvals item, Stage 7), `gotchas.md` "Voicing" and `mapping-patterns.md`. |
| m1 plan loop delta rule | Fixed. One "Delta rounds apply to both loops" paragraph above the two loops, naming plan rounds 4 and 5 (delta is the diff of the rewritten PLAN.md) with the three exceptions. |
| m2 stopping rules | Fixed. Plan: five rounds, stop at 5 unless a blocker is open. Build: at least five rounds, minors only after round 5, a round past 5 only while a major or blocker is open (log why). Same wording in SKILL.md and `checklists.md`. SKILL.md now says it overrides the counts in missions plan section 12 (plan 3 to 5, built phases 2 to 5) and follows AGENTS.md "Iterating" and the standing user rule. |
| m3 server recipe | Fixed. Background `nohup` start with `-P tmp/pids/server-<port>.pid` and a log, a curl wait loop, a `grep` for the boot warning, then the puma PID from `ss -ltnp`. The app prints no line when a key is present (`config/initializers/break_escape.rb:12` to `:19` warns only when there is none), so the check is for the warning, with `env -u GEMINI_API_KEY` as the guarantee. |
| m4 talk inits | Fixed. The talk inits are the pipeline's `bust` candidates (`<name>_talk_init.png`); Stage 6 offers 4 on a picks page, waits for the pick, then runs `visemes --from-talk` only for NPCs without `<key>_visemes.png`. No extra paid step. Matches the pipeline skill's bust stage. |
| m5 bark check in Before merge | Fixed. `checklists.md` Before merge counts barks in V6 and, until build/tts-barks is on main, requires the by-hand count. |
| n1 ports and start script | Fixed. 3002 added to the port lists in SKILL.md, `measurement-recipes.md` and `checklists.md`. The start script reason is now: fixed to :3001, exits 0 when it is up, no `BUNDLE_PATH` in a worktree. |
| n2 bark client conditions | Fixed in `gotchas.md` "Voicing": person NPC with a `voice` only; the beep only for toasts. |
| n3 opus55 routing | Fixed. SKILL.md sends game builds, office life included, to `opus55` on every account, and records the task type and stop message on a safeguard retry. |
| n4 naming and opus48 case | Fixed. Both files use `REVIEW_R<n>.md`; `checklists.md` now has the non-CVP `opus48` case. |

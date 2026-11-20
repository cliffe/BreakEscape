# Checklists

Short lists to run through. The procedure is in `../SKILL.md`; the reasons are in `gotchas.md`.

## Per slice

- [ ] Explicit paths staged; `git diff --cached --stat` read; slice committed before any live test.
- [ ] Ink compiles; `dialoguelint.mjs` on changed ink; `tagdiff.mjs` for existing ink touched; inkcheck, loopcheck, `reopencheck.mjs` and the mission's route suite.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`: 0 errors; each new warning cleared or justified in the log.
- [ ] `--office-summary` diffed against `v1_summary_base.txt`: only planned NPCs changed.
- [ ] `ruby scripts/lock_key_diff.rb ... baseline_locks.json`: empty or exactly the approved items.
- [ ] `python3 scripts/check_door_alignment.py` for new or changed rooms.
- [ ] No office-life key inside an ERB loop or tag; field names at `FormatUpgrade.current`.
- [ ] Machines declared with base type names; one of each in the room after two loads.
- [ ] Moved existing NPCs (SKILL.md, "Story-safe movement"): only free ones; V2 clear or leash is its own room; lock and key diff empty; `positions_base.txt` diff shows only planned objects (`measurement-recipes.md` section 9); line-of-sight mappings unchanged; no pinned, witness, holding, plot-located or suspect NPC gained any needs-layer key; at most two or three moved per mission, each found at post first (home dwell or once-only first-talk break); where a beat needs one at post, its `offWhen` gate on every source it may use away from its post object, on neither a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot, with a derived global where a machine has two or more causes and the machine's other users listed, its mappings and any `<npc>_beat` mapping hosted on the phone NPC or a start-room NPC, never the moved NPC; mapped breaks conditioned `!globalVars.<npc>_beat`; no `interests`, `workarounds` or magnet-met need; no `suspend` and no `patrolOverride` on any needs NPC; open-conversation rule met (no location in its lines, no NPC-level, ink, mapping or timed-conversation background, and no phone-to-person transition, showing its post, no beat hanging on the talk).
- [ ] Every new global declared (`globalVariables`, `heard_<knot>`, workstation globals; every key a `requireGlobal` tests for `false` too); sync budget updated.
- [ ] New mappings appended at the end of the NPC's list.
- [ ] Slice log written: what changed, measurements, what was not checked.

## Per review round

- [ ] Fresh read-only reviewer; round 1 on the `opus55` agent type. Delta rounds on the cheaper tier from round 4, or after a stronger-tier round with no blockers or majors. A delta goes back to `opus55` when it touches secret handling, what the server serves or access checks (a workstation's away-owner text included), or adds a design decision, or when a cheaper-tier round found a major (`opus48` instead of `opus55` for the secret, server and access case on an account without CVP). Plan rounds 4 and 5 are deltas too, on the diff of the rewritten PLAN.md.
- [ ] Findings tagged blocker, major or minor with file:line; saved as `REVIEW_R<n>.md` (as in SKILL.md) with B/M/m counts.
- [ ] A major or blocker sends the next round back to the stronger tier.
- [ ] Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.
- [ ] Reviewer re-measures anything the fix could move (trip table, machine count, lock diff).
- [ ] Plan: stop at round 5, leave anything open listed as open (a blocker still open allows round 6). Build: at least five rounds; after round 5 fix minors only, and run a round past 5 only while a major or blocker is open (log why).
- [ ] Fixer brief carries the handover rule (about 150k tokens or 80 calls) and the explicit-path commit rule.

## Per live check

- [ ] Keyless server from the worktree on its own port (not 3000, 3001, 3002, 3085 or 3086), started in the background with the `measurement-recipes.md` section 1 command; log shows the keyless warning; puma PID from `ss -ltnp` recorded.
- [ ] Fresh game from `new-game.rb`, id taken from its output.
- [ ] Headless: `window.__test.throttleFps(20)` and check `after` reads about 17 to 20 (it refuses if `physics.world.fixedStep` is off; re-call after a reload).
- [ ] Player parked clear of lanes.
- [ ] Five tries per timed trip; both expected and real away recorded.
- [ ] Night turn rendered and looked at, not only read from state.
- [ ] Reload at day and at night.
- [ ] Attack probe on a moving, a seated and a leaving NPC, fresh game each; and on each moved existing NPC at the machine (where its carried item lands, and that it walks home once available).
- [ ] Each story beat finds each moved NPC at post, five tries, approach started as it leaves for its longest trip. Reload inside a gate window (it stays at post) and outside one (it may leave at once, and is back before the next beat). Found at post on first room load and after a reload.
- [ ] Talk to each moved NPC away from post three ways (mid-walk, queued, using the machine): the background is the room it stands in, no line contradicts where it is, and it finishes its trip and walks home after the chat closes.
- [ ] Scripted runs: poll `__test.needs.state(<id>)` until the moved NPC is back at post (`atPost` true, `job` null or on its home object; a `null` state counts as at post) before each `interact`, with a timeout that fails the step and records the last state; no `needs.setManualClock` in a regression run.
- [ ] Run on the merged tip; commit hash recorded.
- [ ] Server stopped by PID; `unlink node_modules` done.

## Before merge

- [ ] Main merged into the branch; conflicts understood, not resolved blind.
- [ ] Commit, then ask the integrator for a train. `tools/playtest/train-check.sh` must be GREEN on the hash to be merged (it runs the Rails suite, rubocop, the JS batch, train-smoke and the validator corpus; a hand-run `bin/test-js` and Rails pass is only a subset). The `LabPhysicalPentestSecretsTest` flake is re-run alone.
- [ ] Validator 0 errors; V6 (barks included) shows 0 uncached office-life clips, or the voicing request is on the decisions page with the clip count and the user's yes is pending (no release carries unvoiced lines). Before build/tts-barks is on main, each new bark in `SPOKEN_LINES.md` is counted by hand: it has a committed clip, or it is on the decisions page awaiting the yes.
- [ ] `--office-summary` and lock/key diff clean against the baseline.
- [ ] No placeholder ink, no draft wording differing from `DIALOGUE_SAMPLE.md`.
- [ ] Dressing check with all rooms loaded: one of each machine, no duplicates.
- [ ] Short scripted regression of the walkthrough passes.
- [ ] Lab-sheet impact flagged to the user; sheet itself left for last.
- [ ] Handover note and log current; branch handed to the integrator, who merges the tested hash.

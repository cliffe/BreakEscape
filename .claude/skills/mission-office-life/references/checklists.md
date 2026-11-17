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
- [ ] Every new global declared (`globalVars`, `heard_<knot>`, workstation globals); sync budget updated.
- [ ] New mappings appended at the end of the NPC's list.
- [ ] Slice log written: what changed, measurements, what was not checked.

## Per review round

- [ ] Fresh read-only reviewer; round 1 on the `opus55` agent type, delta rounds from round 4 on the cheaper tier (AGENTS.md "Choosing a model").
- [ ] Findings tagged blocker, major or minor with file:line; saved as `M03_REVIEW_R<n>.md` style with B/M/m counts.
- [ ] A major or blocker sends the next round back to the stronger tier.
- [ ] Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.
- [ ] Reviewer re-measures anything the fix could move (trip table, machine count, lock diff).
- [ ] Stop only at 0 blockers and 0 majors after round 5; after round 5 fix minors only.
- [ ] Fixer brief carries the handover rule (about 150k tokens or 80 calls) and the explicit-path commit rule.

## Per live check

- [ ] Keyless server on its own port from the worktree; puma PID recorded.
- [ ] Fresh game from `new-game.rb`, id taken from its output.
- [ ] Headless: `setFPS(20)`, fixed steps on.
- [ ] Player parked clear of lanes.
- [ ] Five tries per timed trip; both expected and real away recorded.
- [ ] Night turn rendered and looked at, not only read from state.
- [ ] Reload at day and at night.
- [ ] Attack probe on a moving, a seated and a leaving NPC, fresh game each.
- [ ] Run on the merged tip; commit hash recorded.
- [ ] Server stopped by PID; node_modules link removed.

## Before merge

- [ ] Main merged into the branch; conflicts understood, not resolved blind.
- [ ] `bin/test-js` then the Rails suite, one after the other, on the final tip; the flake re-run alone.
- [ ] Validator 0 errors; V6 shows 0 uncached office-life clips (or the voicing request is filed).
- [ ] `--office-summary` and lock/key diff clean against the baseline.
- [ ] No placeholder ink, no draft wording differing from `DIALOGUE_SAMPLE.md`.
- [ ] Dressing check with all rooms loaded: one of each machine, no duplicates.
- [ ] Short scripted regression of the walkthrough passes.
- [ ] Lab-sheet impact flagged to the user; sheet itself left for last.
- [ ] Handover note and log current; branch handed to the integrator, who merges the tested hash.

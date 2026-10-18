# SecGen/VM consistency review — shared brief (m02–m08)

You are reviewing and fixing one SAFETYNET mission's SecGen/VM integration. Run the
`.claude/skills/mission-secgen-review/SKILL.md` skill in full — it is the method. This brief
adds the facts already established so you don't re-derive them, and the scope limits for
running in parallel with other missions' agents.

## Kind of game
SAFETYNET campaign = spy thriller. The VM flags are **required** to finish the mission and
are woven into the story. What the game says about the VM **must match SecGen**. That is the
standard (see `AGENTS.md`).

## This is cross-repo; reason statically, never build a VM
- Game: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`
- SecGen (canonical VM defs): `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/<mission>.xml`, modules under `/home/cliffe/Files/Projects/Code/SecGen/modules/`
- Field guides: `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/safetynet/`
- **Do not provision, build or boot any VM.** No `secgen.rb`, no build-project, no Proxmox,
  no test pipeline. Reason from source only. You may use the static skills
  `review-secgen-scenario`, `review-secgen-module`, `secgen-puppet` to reason about/edit the
  SecGen side. Do **not** use `secgen-test-pipeline`/`hackerbot-lab-testing`.

## Confirmed facts (don't re-derive)
- **`secgen_scenario` value.** Must be the XML path relative to SecGen's `scenarios/` dir:
  `break_escape/safetynet/<mission>.xml`. Confirmed from Hacktivity
  `SecGenBatch.read_scenarios` (`Dir["**/*.xml"]`, `validates :scenario, inclusion: {in: SCENARIOS}`).
  Every m02–m08 currently has a wrong value (a VM title / bare name / cloned-lab name), so
  none binds a VM in Hacktivity. Set it to the path.
- **`vm_object('<title>')`** — the title must equal a built VM's `title` = the SecGen
  `system_name` (e.g. `kali`). Wrong title → silent fallback to the static placeholder. The
  fallback object's `title`/`ip` should match the VM (same local network as the target host).
- **`vm_flags_json('<name>')`** — keyed by the SecGen `system_name` that owns the flags.
- **`targetFlags` form (game.rb `process_flag_task_completions!`).** Plain string compare
  against the controller DISPLAY form. Only `<vm>-flagN` (any station) and
  `<station-id>:<vm>-flagN` (that station) match. The reference form `<vm>:flag_N` NEVER
  matches — a task in that form only completes if a flag-lock `completesTask` or an event
  closes it. Trace completion for each `submit_flags` task.
- **`flagRewards` don't set globals by themselves.** Only `set_global` does, and only
  `sudo_flag_submitted` is hard-bridged in `interactions.js`. Any gate on `<x>_flag_submitted`
  needs an explicit `setGlobal`.
- **SecGen `parameterised_accounts`:** `leaked_filenames` are written to `/home/<user>/` at
  mode `0600` owned by that user (so a flag in another account's home genuinely needs
  escalation). `super_user: true` renders as `<user> ALL=(ALL) ALL` (full sudo), not a scoped
  rule — if a labsheet/field guide teaches a scoped misconfiguration, that is a pedagogy
  mismatch to flag, not silently "fix".

## Baseline reference
`m01_first_contact` has been through this review and is known working. Read
`scenarios/m01_first_contact/scenario.json.erb` (flags block, vm-launcher, flag-station,
objectives) and `scenarios/m01_first_contact/secgen_review/` for correct patterns and the
method. Do not edit m01.

## Which layer wins
Technical values (host, IP, accounts, paths, flag shape, escalation) → SecGen is canonical,
align the game to it; if the VM itself is wrong for the story, edit the VM. Story values
(names, roles, dates) → the ink is canonical. Make the smallest change per mismatch; invent
no new puzzle mechanics.

## Scope and limits (parallel-safe)
- **Edit only your mission's artifacts:** `scenarios/<mission>/**` (scenario.json.erb,
  mission.json, ink + recompiled json, labsheet.md, secgen/ copy, README), and your mission's
  **canonical** SecGen XML `.../break_escape/safetynet/<mission>.xml`, and a field guide only
  if it is specific to your mission.
- **Do NOT edit files shared across missions:** SecGen modules under `modules/`, and any field
  guide referenced by more than one mission. If a shared file needs a change, **report it** in
  your review (file:line, what and why) for the orchestrator to reconcile — do not edit it.
- **Do not edit other missions, m01, the engine, or `.claude/skills/*`.**
- **Do not commit, stash, checkout or reset.** The orchestrator commits per mission. You share
  the working tree with other agents; never run git write commands.
- Write long docs **section by section with Edit** (whole-file writes have been truncated).
- Give your scratch files their own subfolder under the session scratchpad path the
  orchestrator gives you.

## Verify before returning
- `./scripts/compile-ink.sh <mission>` if you changed ink (and confirm 0 failed).
- `ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb` — no new errors.
  (It re-renders the scenario, proving the ERB still yields valid JSON.)
- Grep the mission to confirm stale values gone / new values present.
- If you edited the SecGen XML, confirm every module path it references exists under
  `modules/` (static check; no build).

## Return
A change list (file:line, repo, from → to), the consistency matrix, the verification results,
and an explicit "open / needs author decision / shared-file changes for the orchestrator"
list. Your review docs go in `scenarios/<mission>/secgen_review/` (01_technical_review.md,
02_consistency_matrix.md, 03_edits_applied.md).

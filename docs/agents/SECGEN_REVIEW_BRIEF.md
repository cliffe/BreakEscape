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

## Optional VM rebasing
A mission's VM may be rebased on a known-good catalogue scenario if it enhances play — see
`docs/agents/SECGEN_ADAPTABLE_CATALOGUE.md`. This is a design improvement (adapt the chosen
scenario into the mission's canonical SecGen XML and re-align all game references), a flagged
decision to record with reasoning. Only when it clearly improves the mission; otherwise keep
the current VM and just align. Never build a VM.

## ROUND 2 (this pass) — confirm, rebase where it clearly helps, fix pedagogy

Round 1 aligned every mission's `secgen_scenario`, VM-launcher wiring and placeholder IPs,
and committed per mission. Round 2 is a fresh independent pass. Do all of:

1. **Confirm round 1 held** for your mission: `secgen_scenario` is the correct path,
   `vm_object('<title>')` opens the *attacker/Kali* console (not the target), flag host key,
   display-form `targetFlags`, flag→global bridge and `concludeRequires` are all correct.
   Fix anything that regressed or was missed.

2. **Rebasing (execute a clear win, else keep).** Judge whether rebasing this mission's VM on
   a known-good catalogue scenario (`docs/agents/SECGEN_ADAPTABLE_CATALOGUE.md`) would clearly
   improve hands-on play or story/CyBOK fit. The bar is high: round 1 found every current VM
   internally sound and on-theme, so **default to KEEP** and deepen. Rebase only if you can
   name specific improvements (better skill fit to the mission's `mission.json` CyBOK, a
   richer/again-solvable kill chain, closer story fit) that outweigh the current VM. If you
   rebase: adapt the chosen scenario's systems/modules into the mission's **canonical** SecGen
   XML (`/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/<mission>.xml`),
   keep an in-mission `secgen/` copy in sync if one exists, and re-align every game reference
   (flags/accounts/hosts/IPs/paths/launcher/labsheet). You CANNOT build-verify a rebase here —
   reason statically, keep the mission validator-clean, and clearly mark the rebase "needs an
   author VM build to confirm" in your docs. When in doubt, keep and recommend rather than
   execute.

3. **Pedagogy/VM-design fixes — apply with best judgement, log each** (user: fix these, don't
   just flag). Examples: if a flag framed as the privilege-escalation reward is readable
   without escalating, make escalation genuinely required (e.g. give the holder a strong
   generated password / correct file ownership); if the labsheet/field guide teaches a
   *scoped* sudo misconfiguration but the VM grants full `ALL=(ALL) ALL`, bring them into
   agreement (prefer scoping the VM rule to the taught target if tractable, else correct the
   teaching text). Make the smallest change that makes the lesson true; record what you chose
   and why.

4. **Field guides.** Your mission's own `labsheet.md` — edit freely to match the VM. The
   **shared** SAFETYNET field guides in `HacktivityLabSheets/_labs/safetynet/` are edited by
   the orchestrator only: if one needs a change for your mission, REPORT it (file, what, why)
   — do not edit it (parallel agents share it).

5. **Commits:** still the orchestrator's job, per mission, per repo. Do not commit. If you
   edited the canonical SecGen XML, say so clearly so it gets committed in the SecGen repo.

Update your `secgen_review/` docs in place (add a "Round 2" section to each rather than
rewriting). Return: what you confirmed, the rebase decision (keep/rebase + rationale; if
rebased, the full change list across repos), the pedagogy fixes applied, shared field-guide
changes for the orchestrator, and anything needing an author VM build.

## ROUND 3 (this pass) — VM↔mission integration quality

Rounds 1–2 made the VM consistent, correctly wired and required. Round 3 asks whether the VM is
**woven into the mission or bolted on**, using the skill's new **Step 4b** and the m01 benchmark.
Do this per mission:

1. Load the mission's `dungeon_graph.md` and trace the VM challenge/flag nodes through it.
2. Score the six Step 4b checks (motivation, gating, diegetic attacker box, flag payoff,
   requiredness & pacing, graph coherence) CONCERN/OK/N/A with file:line, against m01's bar:
   credentials/target found in-game; VM access gated by physical/PIN/badge/NPC steps; the Kali
   box placed by a character in-fiction; each flag triggers a concrete story beat; flags gate
   the ending; the right field guide offered at the right moment.
3. **Fix mission-local integration gaps with best judgement, log each**: add the in-game
   note/clue that supplies the credentials/target; gate the launcher behind an existing lock;
   give a flag a real payoff (`puzzle_graph_unlocks`/`completesTask`/story beat); move a
   field-guide offer to the right event; reword a launcher's `observations` to read as diegetic.
   Keep it solvable and validator-clean.
4. **Flag author-sized gaps** (a new puzzle/room/story beat that doesn't exist yet) rather than
   inventing them here; for puzzle/level depth point at the `mission-puzzle-chains` skill.

Append a "Round 3 — integration" section to each mission's `secgen_review/01_technical_review.md`
(the six scores + what you fixed + what you flagged). Do NOT commit; the orchestrator commits
per mission. Shared field guides: report, don't edit (orchestrator reconciles).

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

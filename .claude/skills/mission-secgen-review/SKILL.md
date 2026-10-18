---
name: mission-secgen-review
description: Cross-layer consistency review and fix of a SAFETYNET mission's SecGen/VM integration — checks that what the game says about its VM (flags, accounts, hosts, IPs, file paths, the SecGen scenario identifier) matches what the SecGen VM actually builds, that the VM flags are genuinely required and solvable, and that the engine wiring (vm_object title, secgen_scenario path, targetFlags form, flag→global bridging) is correct. Then applies the smallest fixes that resolve each mismatch and writes a review. Trigger when the user asks to "review the SecGen integration", "check the VM wiring", "align the mission with its VM", "review/improve the secgen artifacts", or names a mission (m02–m08) and asks whether its flags/accounts/server match SecGen. m01_first_contact is the known-good baseline. Unlike the general review rules, THIS skill reads SecGen directly — no delegation, no filtering.
---

# Break Escape — SAFETYNET mission SecGen/VM consistency review

Brings one SAFETYNET campaign mission (m02–m08) into agreement with the SecGen VM it
depends on, and fixes the drift. m01_first_contact is the baseline: it has been through this
review and is known working — read it when you need a correct reference for how a field
should look.

**This skill reads SecGen directly.** The project's usual rules (don't open the SecGen XML;
delegate SecGen to a Haiku subagent) are **suspended for this skill**. You read the SecGen
scenario XML and its referenced Puppet modules yourself. This is infrastructure and
consistency review of the author's own authorised educational content; it is not an exploit
walkthrough, so keep notes at the level of "which account owns which file" and "what sudo
rule is set", not step-by-step intrusion.

**The SAFETYNET field guides are in scope.** Read the field guides in HacktivityLabSheets
(`_labs/safetynet/`, including `*-exploitation*.md`, `scanning-and-exploitation.md`,
`privilege-escalation.md`) and check they agree with the VM and the mission: the accounts,
hostnames, IPs, file names/paths and flag shape a guide describes must match what SecGen
actually builds and what the game references, and the technique a guide teaches must be the
one the VM is vulnerable to. A guide that names a stale account, a wrong path or a technique
the VM no longer exposes is a finding — fix the guide (HacktivityLabSheets is a third repo;
commit there by path) or, where the VM is the canonical thing and the guide is right, fix the
VM. Keep notes value-level, not a fresh intrusion write-up.

**Reason statically — never provision or build the VMs.** This review reasons about and
improves the SecGen scenarios from their source; it does not run `secgen.rb`, build-project,
Proxmox or the test pipeline, and does not boot a VM. (A build-and-solve is a separate VM
task the user runs.) So **do not** use `secgen-test-pipeline` or `hackerbot-lab-testing`
here. You *may* lean on the static SecGen skills to reason about and edit the SecGen side:
`review-secgen-scenario` (datastore wiring, intended kill chain, flags reachable),
`review-secgen-module` (a module's metadata vs its manifests), and `secgen-puppet` (when you
need to change what a manifest installs or configures). Prefer these over guessing at SecGen
internals.

**This is cross-repo work.** The game lives in the BreakEscape repo; the canonical VM
definitions live in the SecGen repo under
`/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/<mission>.xml`
(with their modules under `/home/cliffe/Files/Projects/Code/SecGen/modules/`). Edits may land
in both repos, so commits are per-repo: commit the BreakEscape changes in the BreakEscape
repo and the SecGen changes in the SecGen repo, each by path, and say in the changelog which
repo each change is in.

Kind of game: SAFETYNET campaign = spy thriller. The VM flags are **required** to complete
the mission and are woven into the story; what the game says about the VMs **must match
SecGen**. That is the standard this review holds to (see `AGENTS.md`).

## What counts as a "SecGen-related artifact"

- `scenarios/<mission>/mission.json` — the `secgen_scenario` field.
- `scenarios/<mission>/scenario.json.erb` — the top-level `flags` block
  (`vm_flags_json(...)`), the `vm-launcher` object (`vm_object(...)`), every `flag-station`,
  flag-locked object and launch-device (`acceptsVms`, `flags`, `hintOnlyFlags`, `flagRewards`,
  `requires: <vm>:flag_N`), and every objective `submit_flags` task (`targetFlags`).
- The SecGen scenario XML, in two places that can drift apart:
  - canonical (builds the real VM): `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/<mission>.xml`
  - in-mission copy (reference): `scenarios/<mission>/secgen/<mission>.xml`
- The SecGen modules the XML references, under `/home/cliffe/Files/Projects/Code/SecGen/modules/`
  (read `secgen_metadata.xml` and the Puppet manifests to resolve values and behaviour).
- Any in-game text that asserts a VM value: ink hint lines, note/observation text, the
  mission `labsheet.md`. These should agree with the VM but the VM/story-ink is canonical for
  values (see "Which layer wins").

## Step 1 — build the picture (read everything)

Read, in this order, and keep a scratch note of every concrete value as you go:

1. `mission.json` and `scenario.json.erb` (the whole file — flags, objectives, rooms,
   NPCs, vm-launcher, flag stations, launch device, globalVariables).
2. The mission `ink/*.ink` (narrative + hint lines that name VM values).
3. `labsheet.md` (it often states the IP, accounts and the shape of each flag — and it
   should never print a per-build secret).
4. Both SecGen XML copies. Note every difference between them.
5. The modules the XML references, where you need a value or a behaviour resolved —
   especially the account module (`parameterised_accounts`) and any flag/leak encoders.
6. The engine helpers and matcher (so you check against how the game actually behaves):
   - `app/models/break_escape/mission.rb` — `vm_object`, `vm_flags_json`, `requires_vms?`,
     `valid_vm_sets_for_user` (how `secgen_scenario` is matched).
   - `app/models/break_escape/game.rb` — `process_flag_task_completions!` and the comment
     block above it (the `targetFlags` form rule — see pitfalls).
   - `public/break_escape/js/systems/interactions.js` — flag-station / launch-device /
     workstation handling, and which `flagRewards` globals are hard-bridged.

## Step 2 — the consistency matrix

Produce a table of every concrete value that appears in more than one layer: character
names, room/host names, PINs/codes, IPs, usernames, passwords, file names/paths, flag
identifiers and order. Columns: value | story (ink) | Break Escape scenario | SecGen VM |
status (match / mismatch / missing). This table is the highest-value output — cross-layer
drift is what breaks these missions. Values generated at build time (the chosen crackable
password, flag strings) are legitimately absent from source: mark them *(per-build)*, not
"missing".

Confirm against the SecGen source, not just the XML comments:

- **Flags.** Count and order. For each flag: its identifier (`<vm>:flag_N`), the file
  name/path it is leaked to, which account owns it, and whether privilege escalation is
  needed to read it. Map each to the game use (which flag-station / flag-lock / device
  consumes it, and which global its reward sets).
- **Leaked-file placement.** `parameterised_accounts`' `leak_files` drops files in
  `/home/<user>/` at mode `0600` owned by that user. So a flag in another account's home
  genuinely requires escalation — confirm the mission's escalation flags really are owned by
  the escalation target, or the "VM required" guarantee is hollow.
- **Accounts and privilege.** Which accounts exist; which has the crackable password; the
  sudo relationship. Note that `super_user: true` renders as `<user> ALL=(ALL) ALL` (full
  sudo), **not** a scoped `ALL=(<other>)` rule — if the labsheet teaches a scoped
  misconfiguration, that is a pedagogy mismatch to flag (see pitfalls).
- **Hosts / IPs.** System names and the `IP_addresses` datastore order. The attacker/console
  VM's IP and login, and the target server's name/IP.

## Step 3 — engine wiring checks (the silent killers)

These compile, pass the schema and look right in the dungeon graph, but break the mission.
Check each against the m01 baseline and the engine source:

- **`secgen_scenario` must be the scenario XML path, not a VM title or bare name.**
  `valid_vm_sets_for_user` matches `mission.json`'s `secgen_scenario` against Hacktivity's
  `sec_gen_batches.scenario`. That string is **confirmed** (Hacktivity
  `SecGenBatch.read_scenarios`: `SCENARIOS.replace Dir["**/*.xml"].sort` run from the SecGen
  `scenarios/` dir, with `validates :scenario, inclusion: { in: SCENARIOS }`): it is the XML
  path **relative to SecGen's `scenarios/` dir, with `.xml`**. For a SAFETYNET mission that is
  exactly `break_escape/safetynet/<mission>.xml`. Anything else (a VM title, a bare
  `m0x_name`, a cloned-lab name like `rooting_for_a_win`) is not in `SCENARIOS`, fails the
  inclusion validation, and binds no VM — so `requires_vms?` is true but a real-VM player gets
  nothing. This value is not a guess; set it to the path.
- **`vm_object('<title>')`'s title must equal a built VM's `title`** (the SecGen
  `system_name`, e.g. `kali`). A wrong title silently falls through to the static fallback,
  so the player gets the placeholder IP, never the real VM. The fallback object's own
  `"title"`/`"ip"` should also match the VM (same local network as the target).
- **`vm_flags_json('<name>')` is keyed by the SecGen `system_name`** (the host that owns the
  flags, e.g. `shatter_server`). Wrong key → an empty flags map, so every flag fails to
  validate.
- **`targetFlags` form (game.rb).** The matcher is a plain string compare against the
  controller's DISPLAY form. Only two authored forms ever match: `<vm>-flagN` (legacy, any
  station) and `<station-id>:<vm>-flagN` (that station only). The scenario *reference* form
  `<vm>:flag_N` **never matches** and silently never completes its task. Check each
  `submit_flags` task. If a task in the reference form still completes, it is because a
  flag-lock's `completesTask` or an `objective_task_completed`/`global_variable_changed`
  event closes it — trace that the task actually completes some way. Prefer the display form
  for any mission not already deployed with cached audio; for a deployed mission, aligning the
  form can change completion timing, so flag it rather than silently change it.
- **`flagRewards` do not set globals by themselves.** `emit_event` emits an event; only
  `set_global` sets a global, and only `sudo_flag_submitted` is hard-bridged in
  `interactions.js`. Any Ink or objective gated on `<x>_flag_submitted` needs that global
  explicitly `setGlobal`-ed (normally from an `objective_task_completed:<task>` or the
  station's `flagRewards`). Confirm the chain for every flag.
- **The two XML copies agree** on module paths and values. A module path in the in-mission
  copy that does not exist under SecGen `modules/` (e.g. a wrong encoder path) is a build
  break if that copy is ever used. Reconcile to the canonical copy.

## Step 4 — solvability

Confirm the VM flags are genuinely required and reachable:

- The mission ending / final gate depends on the flags (e.g. `concludeRequires`, or a
  confrontation gated on reading an archive that a flag unlocks). The VM cannot be skipped.
- Every flag the game consumes exists on the VM, owned by the right account, at the path the
  game/labsheet implies.
- Escalation flags are actually behind escalation (file ownership/permissions), so the
  escalation step is real.
- The crackable account's password is one of the strings the game ships as its wordlist (so
  the brute force succeeds), and no in-game text leaks a per-build secret.

## Optional: rebasing the VM on a known-good scenario

A mission's VM may be **rebased on a known-good SecGen scenario** when that would enhance the
mission's hands-on play or its fit with the story (see
`docs/agents/SECGEN_ADAPTABLE_CATALOGUE.md` for the adaptable scenarios and their paths). This
is a design improvement beyond consistency alignment: adapt the chosen scenario's
systems/modules into the mission's canonical SecGen XML and re-align every game reference to
the new VM. Match by the skill the mission should teach and its `mission.json` CyBOK mapping,
not title flavour. Only rebase when it clearly improves the mission; if the current VM is a
good fit, keep it and just align. A full rebase is a flagged design decision — record the
before/after and the reasoning in the review, and still never build a VM.

## Which layer wins

- **Technical values → SecGen is canonical.** Server name, IP, accounts, file paths, flag
  shape, the escalation relationship. Align the game to the VM. If the VM itself is wrong for
  the story (e.g. an IP on the wrong network, a scenario name that doesn't match the path),
  the VM may need the edit — you may edit the SecGen XML under this skill; edit the canonical
  repo copy and keep the in-mission copy in sync.
- **Story values → the ink is canonical.** Character names, roles, dates, stakes. Align stray
  lines to the dominant canon.
- Make the **smallest** change that resolves each mismatch. Do not invent new puzzle
  mechanics. Preserve the mission's design.

## Step 5 — apply fixes, then verify

Apply the fixes. Then, from the repo root:

- `./scripts/compile-ink.sh <mission>` if you changed any `.ink` (commit the regenerated
  `.json`).
- `ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb` — no new errors;
  it re-renders the scenario (proves the ERB still produces valid JSON) and regenerates the
  dungeon graph. (Use `--skip-ink --no-graph` if another agent is editing the same mission.)
- Grep the mission to confirm every stale value is gone and every new value is present.
- Re-run the Step 2 matrix against the edited files: confirm no new mismatch, and the
  critical path is still solvable end to end.
- If you edited the SecGen XML, confirm every module path it references exists under
  `modules/`. (A full SecGen build is out of scope here; a build-and-solve is a separate VM
  task for the user.)

## Output

Write to `scenarios/<mission>/secgen_review/`:

- `01_technical_review.md` — the full review: the matrix reasoning, each finding
  (technical/engine/story) with file:line, solvability, and a verdict. Audience: the author.
- `02_consistency_matrix.md` — the value-by-value table from Step 2.
- `03_edits_applied.md` — per-file changelog (what changed, from → to, which finding it
  resolves), the verification results, and a "still open / needs author decision" list (the
  `secgen_scenario` platform-string confirmation, any pedagogy mismatch like scoped-vs-full
  sudo, anything that needs a real VM build to confirm, and any value better left to the
  author).

Keep exploit specifics out; state value changes as `field: old → new`.

## Recurring findings to expect (from the m01 baseline)

- `secgen_scenario` and `vm_object` title left as a VM/lab name instead of the scenario path
  / the real VM title.
- A console-VM placeholder IP on the wrong network.
- A `submit_flags` task in the never-matching reference form, rescued (or not) by a
  `completesTask`.
- The in-mission SecGen copy drifted from the canonical one (a bad encoder path, a different
  lab-sheet URL).
- `super_user: true` giving full sudo where the labsheet implies a scoped rule — pedagogy
  decision for the author.
- VM flavour text pointing at a path in the wrong account's home — a harmless red herring to
  note.
- Dead references left by earlier refactors (a `storyPath` to a deleted terminal ink).

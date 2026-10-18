# m07 The Architect's Gambit — SecGen/VM consistency review

Date: 2026-10-18. Baseline: m01_first_contact. Method: `.claude/skills/mission-secgen-review/SKILL.md`.
Reviewed statically; no VM was built or booted.

## Scope

- Game: `scenarios/m07_architects_gambit/` (BreakEscape).
- Canonical VM: `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m07_architects_gambit.xml`.
- No in-mission `secgen/` copy exists for m07, so there is no second XML to reconcile.
- Field guides: `HacktivityLabSheets/_labs/safetynet/` (all shared across missions; report-only).

## The VM, from SecGen source

Two systems:

- `attack_vm` — Kali/MSF, the player's working box. `parameterised_accounts` + `iceweasel`
  give a `kali`/`kali` super-user. This is the launcher VM; it owns no mission flags.
- `scada_attack_host` — Debian 12 KDE, the target. Owns all four mission flags. Username is a
  random `mythical_creatures` word; password is a `strong_password_generator` value (both
  per-build).

Flag order (set in the XML comment and by module order):

1. `nfs_overshare` — leaks `User` + the username + a flag over an anonymous NFS export.
2. `nc_message` — on a random port (1024–2024) hands out `Password` + the password + a flag to
   anyone who connects.
3. `parameterised_accounts` — creates the operator account (`super_user: false`) and leaks a
   file named `flag` into that user's home at mode `0600`. Reading it needs the operator login
   (the username from flag 1 + the password from flag 2).
4. `sudo_root_awk` — leaks a flag into `/root` at mode `0600`, root-owned. The module installs
   `ALL ALL=(root) NOPASSWD: /bin/awk *, /usr/bin/awk *`, so any logged-in user (the operator)
   can `sudo awk 'BEGIN{system("/bin/sh")}'` to a root shell and read it.

Every referenced module resolves under SecGen `modules/`: `nfs_overshare`,
`nc_message`, `parameterised_accounts`, `sudo_root_awk`, and the generators
`random_sanitised_word`, `random_number`, plus the built-in `flag_generator` /
`strong_password_generator` / `account` types.

## Findings

### F1 (critical) — `secgen_scenario` was a bare name, bound no VM

`mission.json:5` had `"secgen_scenario": "m07_architects_gambit"`. Hacktivity's
`SecGenBatch.read_scenarios` validates `scenario` against `Dir["**/*.xml"]` under SecGen's
`scenarios/` dir, so the only accepted value is the XML path:
`break_escape/safetynet/m07_architects_gambit.xml`. The bare name is not in that set, fails the
inclusion validation, and binds no VM — `requires_vms?` stays true but a real-VM player gets
nothing. Fixed to the path (matches m01).

### F2 (minor) — VM launcher fallback `title` disagreed with the lookup key

`scenario.json.erb:1906`: `vm_object('attack_vm', {..."title":"kali"...})`. The first argument
(`attack_vm`) is the lookup key `vm_object` matches against `vm_context['vms']` by `title`, and
it is correct — the attacker's SecGen `system_name` is `attack_vm`. But the standalone fallback
object carried `"title":"kali"`, so the same box showed as `kali` in standalone/keyless
playtests and as `attack_vm` once a real VM is bound. Aligned the fallback title to `attack_vm`
(convention from m01, where lookup key, fallback title and system_name are all `kali`). Cosmetic
only — the player-facing label is the object `"name": "VM Access Terminal"`, and the ink still
calls it "the Kali box", which stays accurate to the base image.

## Engine wiring — all correct, no change needed

- `vm_flags_json('scada_attack_host', …)` (`scenario.json.erb:88`) and
  `flags_for_vm('scada_attack_host', …)` (`:1922`) are keyed by the flag-owning `system_name`.
- All four `submit_flags` tasks use the station-scoped DISPLAY form
  `flag_station_safetynet_relay:scada_attack_host-flagN` (`:441,452,564,575`), which
  `game.rb process_flag_task_completions!` matches. The never-matching reference form
  `scada_attack_host:flag_N` was already removed in PASS 2 (comment at `:433`).
- Every `flagN_submitted` global is set: flag 1 via `objective_task_completed:recover_coordination_traffic`
  (`:874`), flag 2 via `objective_task_completed:intercept_c2_channel` (`:931`), flag 3 via the
  station `flagReward` `set_global` (`:1922` block), flag 4 via
  `objective_task_completed:terminate_cascade_scripts` (`:1029`). None relies on an unwired
  reward.
- Flag 4's reward is `unlock_object crisis_control_system` (one submission point per flag); the
  win object `crisis_control_system` is flag-locked with no `requires`, opened only by that
  reward (`:2088` comment) — the m02 cache pattern.

## Solvability

The ending aim `end_the_sequence` sets `concludeRequires.tasksCompleted` to all four flag tasks
(`:590+`), so the VM cannot be skipped. The chain is genuine end to end: anonymous NFS → username
(flag 1); netcat on an odd port → password (flag 2); operator SSH login reads a `0600` flag in
their own home (flag 3, real login required); `sudo awk` → root reads the `0600` `/root` flag
(flag 4, real escalation). No in-game text leaks a per-build secret (username/password/flags are
all build-time generated; the game's `flag{…}` strings are standalone fallbacks only).

## Field guides (shared — report-only)

The six field guides offered in m07 point at published `HacktivityLabSheets` URLs. The three that
assert VM technique all match this VM and need no change:

- `nfs-and-netcat-leaks.md` — `showmount -e` / mount, and `nc` to an odd port: matches
  `nfs_overshare` + `nc_message`.
- `ssh-access-and-bruteforce.md` — operator SSH login: matches flag 3.
- `privilege-escalation.md` — Method 4 (GTFOBins) with `sudo … /usr/bin/awk` → root shell:
  matches `sudo_root_awk`.

No field-guide edit is required. (They are shared across missions in any case, so any future
change goes to the orchestrator, not this review.)

## Verdict

Two fixes applied, both in the BreakEscape repo. F1 was the only break (no VM bound in
Hacktivity); F2 is a cosmetic alignment. No SecGen XML edit was needed — the canonical XML is
internally consistent and matches the game's flag count, order, ownership and escalation shape.

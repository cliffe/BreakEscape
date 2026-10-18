# m02 Ransomed Trust — SecGen/VM integration review

Audience: the author. Method: `.claude/skills/mission-secgen-review/SKILL.md` + `docs/agents/SECGEN_REVIEW_BRIEF.md`.
Baseline: `m01_first_contact` (known good). Canonical VM:
`/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m02_ransomed_trust.xml`.

Reasoned statically from source. No VM was built or booted.

## Verdict

Two defects, both fixed. The mission's engine wiring (flag keys, flag order, `targetFlags`
form, flag→global bridging, solvability) was already correct and matches the m01 pattern. The
canonical SecGen XML is internally sound and all its module paths/types resolve.

- **Defect 1 (blocking in Hacktivity): `secgen_scenario` was a cloned-lab name.** Fixed.
- **Defect 2 (reference drift): the in-mission SecGen copy was an old draft.** Fixed.

## Findings

### F1 — `secgen_scenario` bound no VM (fixed)

`mission.json:5` had `"secgen_scenario": "rooting_for_a_win"`. Per the confirmed fact in the
brief, Hacktivity's `SecGenBatch.read_scenarios` builds `SCENARIOS` from
`Dir["**/*.xml"]` under SecGen's `scenarios/` dir and enforces
`validates :scenario, inclusion: { in: SCENARIOS }`. `rooting_for_a_win` is not an XML path,
so it fails inclusion and binds no VM: `requires_vms?` is true but a real-VM player would get
nothing. Set to the XML path relative to `scenarios/`:
`break_escape/safetynet/m02_ransomed_trust.xml` (matches the m01 form).

### F2 — in-mission SecGen copy drifted from canonical (fixed)

`scenarios/m02_ransomed_trust/secgen/m02_ransomed_trust.xml` was a superseded draft:
`system_name` `server` (not `hospital_backup_server`), account `marcus`/Marcus Webb (not
`gary`/Gary Whitlock), a `random_word_generator` SSH password (not the literal `Hospital1987`
the game hints), insider "Asset #47" with a £15,000 payment and a hard-coded safe PIN `4729`
(not the current unpaid-grievance insider, badge `SC-4471`, PIN = founding year `1987`). None
of this matched the current story or the canonical VM. If that copy were ever used to build,
it would produce the wrong VM. Reconciled: the in-mission copy is now byte-identical to the
canonical XML.

### Engine wiring — checked, all correct

- **`vm_flags_json('hospital_backup_server', …)`** (`scenario.json.erb:112`) is keyed by the
  SecGen `system_name` that owns the flags. Correct (wrong key would yield an empty map).
- **`vm_object('attack_vm', {title:"kali", ip:"172.16.0.2"})`** (`:2282`). The match arg
  `attack_vm` equals the attack box's `system_name`, so it binds in Hacktivity mode. The
  fallback `title:"kali"` is a standalone-only display label; cosmetic, see N1.
- **`targetFlags`** on all four `submit_flags` tasks use the valid station display form
  `flag_station_dropsite:hospital_backup_server-flagN` (`:369,:380,:391,:404`) — the
  `<station-id>:<vm>-flagN` form that matches in `game.rb process_flag_task_completions!`.
  None uses the never-matching `<vm>:flag_N` reference form.
- **Flag→global bridging** does not rely on `flagRewards` (which only `emit_event`/`give_item`/
  `unlock_object` here). Each global is set explicitly by an
  `objective_task_completed:submit_*_flag` handler: `flag_ssh_submitted` (`:1081`),
  `flag_proftpd_submitted` (`:1369`), `flag_database_submitted` (`:1147`),
  `flag_ghost_log_submitted` (`:1100`). All four backing globals are declared in
  `globalVariables` (`:3571-3574`). Chain is complete.
- **Flag order** aligns slot-for-slot with SecGen generation order (see matrix). flag1 sits in
  `gary`'s home at 0600 so it genuinely requires the SSH foothold; flag2 is in the proftpd
  root `strings_to_leak` so it genuinely requires the exploit; flags 3–4 are pre-leak
  (anonymous FTP), matching the game's "readable before login" framing.

### Solvability — confirmed

The ending gate requires the VM. flag1 unlocks the ProFTPD/Ghost-log tasks and the escrow
knowledge; flag2 opens the insider aim; flag3's reward item (`verified_restore_manifest`) is
the key the Recovery Console will not run without; flag4 unlocks the `entropy_staging_cache`
and names badge `SC-4471`. The VM cannot be skipped. The SSH password is a fixed literal
(`Hospital1987`) that the game hands the player as one of three candidates (HaX `:1021`,
sticky note `:2145`) and the password-lock requires exactly that string (`:2107`), so the
foothold is reachable without a per-build guess. Every canonical module path/type resolves
under `modules/` (concatenate encoder; `^(ascii|alpha)_reversible$` resolves to a reversible
string encoder; `proftpd_133c_backdoor`; `ssh_root_login`; `parameterised_accounts`).

## Notes (no change made)

- **N1 — fallback launcher title `kali` vs system_name `attack_vm`.** Cosmetic, standalone-only.
  In Hacktivity the real VM object replaces the fallback. m01's attack box is literally named
  `kali`, so its fallback matches; m02 names it `attack_vm`. Harmless; author may align either
  the fallback label to `attack_vm` or the SecGen `system_name` to `kali` for cross-mission
  tidiness. Left as-is (not a binding defect).
- **N2 — object id `vm_launcher_rooting_for_a_win`** (`scenario.json.erb:2277`, also two
  `puzzle_graph_unlocks` at `:2148,:2218` and the regenerated `dungeon_graph.json`). A
  leftover of the old cloned-lab name. Purely an internal object id, self-consistent across
  its three references; it binds no VM. Renaming is cosmetic and risks churn in the graph, so
  left as-is. Author decision.
- **N3 — historical dev notes** (`IMPLEMENTATION_SUMMARY.md`, `OBJECTIVES_VERIFICATION.md`)
  still mention the superseded PIN `4729` / "Asset #47". These are changelog/history docs, not
  canonical artifacts; left untouched.

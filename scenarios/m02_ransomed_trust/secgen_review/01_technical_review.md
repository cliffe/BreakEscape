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

---

# Round 2 (2026-10-18)

Independent re-pass. Verdict unchanged: the mission is sound. Round 1 held with no
regressions; no new code edits were required. Rebase decision: **KEEP**. No pedagogy fix
warranted on m02's own artifacts or VM; one shared field-guide observation reported for the
orchestrator.

## R2.1 — Round-1 fixes confirmed (all held)

- `mission.json:5` `secgen_scenario` = `break_escape/safetynet/m02_ransomed_trust.xml` — correct
  path form (matches the confirmed Hacktivity `SCENARIOS` inclusion rule). Held.
- `scenario.json.erb:2282` `vm_object('attack_vm', {title:"kali", ip:"172.16.0.2", enable_console:true})`
  — match arg `attack_vm` equals the attacker box's `system_name`, so the launcher opens the
  **Kali/MSF attacker console**, not the target. Fallback `title:"kali"`/`ip:172.16.0.2` on the
  attacker subnet. Held (N1 cosmetic, see below).
- `scenario.json.erb:112` `vm_flags_json('hospital_backup_server', [...])` — keyed by the flag-owning
  `system_name`. Held.
- `targetFlags` (`:369,:380,:391,:404`) all in the matching station display form
  `flag_station_dropsite:hospital_backup_server-flagN`. No reference-form (`<vm>:flag_N`) task. Held.
- Flag→global bridge: each global set explicitly by an `objective_task_completed:submit_*_flag`
  handler (`flag_ssh_submitted :1081`, `flag_ghost_log_submitted :1100`, `flag_database_submitted
  :1147`, `flag_proftpd_submitted :1369`); all four declared in `globalVariables` (`:3571-3574`).
  Does not depend on `flagRewards`/`sudo_flag_submitted` bridge. Held.
- `concludeRequires.tasksCompleted` (`:512-519`) = all four `submit_*_flag` tasks. The VM cannot
  be skipped. Held. Validator critical path (4 hops) still terminates at "Bring The Wards Back".
- In-mission `secgen/m02_ransomed_trust.xml` still **byte-identical** to canonical (`diff -q` clean).
- Every module path/type in the canonical XML resolves under SecGen `modules/`: `parameterised_accounts`,
  `iceweasel`, `kali_top10`, `kali_web`, `kde_minimal`, `handy_cli_tools`, `ssh_root_login`,
  `proftpd_133c_backdoor`, encoder `selector/concatenate`, `account` generator, `flag_generator`
  (type → 5 flag modules), and `^(ascii|alpha)_reversible$` (type → 13 reversible encoders incl.
  rot13/base64/caesar). No build run.

## R2.2 — Rebase decision: KEEP

Origin name `rooting_for_a_win` (catalogue: AC, F, MAT, NS, SOIM, SS). The canonical VM is
already a bespoke adaptation purpose-built for this story: ProFTPD 1.3.3c backdoor RCE→root,
anonymous-FTP pre-leak recon, a reversible-encoding challenge, and an SSH foothold with a
story-hinted password — every leaked document is woven into the plot (Gary's warning email,
Ghost's deployment log, the escrow-PIN rule, the insider badge `SC-4471`, the £150,000 ransom).
Its CyBOK (MAT exploitation/backdoor-trojans, SS CVEs, SOIM pentest, NS FTP, F encoding, AC
symmetric crypto) maps exactly onto `mission.json`. No catalogue scenario — including
`rooting_for_a_win` itself — would improve hands-on fit or story fit; a rebase would only strip
the narrative integration and lose the solvable, on-theme kill chain. The Round-2 bar (clear,
specific improvement outweighing the current VM) is not met. **Keep and deepen.**

## R2.3 — Pedagogy / VM-design assessment (no m02-side fix warranted)

- **Escalation is genuine** (verified against the module manifest, not just the XML):
  `proftpd_133c_backdoor/manifests/config.pp` writes `strings_to_leak` (flag2,
  proftpd_backdoor_exploited) to `/root/…` at mode `0600` owned by root, and the module's
  `<privilege>root_rwx</privilege>` backdoor is the only path there. flag1
  (ssh_access_granted) sits in gary's home at `0600` (SSH-as-gary, or root). So flag2 truly
  requires the exploit and flag1 truly requires a foothold — the "VM required" guarantee is not
  hollow.
- **No sudo misconfiguration to reconcile.** gary is `super_user:false`; the VM teaches no
  scoped-vs-full sudo rule, so there is nothing to bring into agreement on the VM side. (The
  sudo pedagogy in the *shared* privesc field guide is a separate reporting item — see 03.)
- **flags 3 & 4 are `strings_to_pre_leak`** (anonymous FTP, pre-exploit) by design — flag3 is
  recon (the server notice), flag4 is the reversibly-encoded operational log, so flag4 still
  poses the decode challenge (CyBOK F / AC). Matches Round-1's "readable before login" framing;
  intentional, not a defect.
- Net: Round 1 was thorough; the smallest-change principle means no edit is the correct Round-2
  action on m02's own artifacts and VM. Assessed, nothing to apply.

## R2.4 — Notes carried forward (unchanged, author decision)

- **N1** fallback launcher label `kali` vs attacker `system_name` `attack_vm` — cosmetic,
  standalone-only; the real VM object replaces it in Hacktivity. Left as-is.
- **N2** object id `vm_launcher_rooting_for_a_win` (`:2148,:2218,:2277`) — internal, self-consistent,
  binds no VM; renaming is pure graph churn. Left as-is.

---

# Round 3 — integration (2026-10-18)

VM↔mission integration quality (skill Step 4b), scored against the m01 benchmark. Traced the
four VM challenge/flag nodes (`vmch_submit_database/ssh/proftpd/ghost_log_flag` and their
`vmfl_*` flags) through `dungeon_graph.md`. The VM is woven in, not bolted on. One minor reword
applied; no author-sized gaps.

## Six checks

1. **Motivation — OK.** Credentials are found in-fiction: SSH password `Hospital1987` is on
   Gary's sticky note (`scenario.json.erb:2145`, `:2107`) and in his access-notes file
   (`:2119`), echoed by HaX (`:1021`, phone `hint_password` ink). Target host `172.16.0.3` and
   the ProFTPD 1.3.3c backdoor are on the network-diagram whiteboard (`:2215`) and Gary's notes
   (`:2119`); HaX `hint_vm` spells out the chain (phone ink `:463-472`). Nothing appears from
   thin air.
2. **Gating — OK.** VM access sits deep on the critical path, not in the start area. Server room
   is RFID-locked (`:2266-2267`, `server_room_keycard` from Gary); Gary is behind the IT
   override (Bernie); the launcher additionally requires the sticky note + network diagram found
   in IT (`:2148`, `:2218` → `lock_vm_launcher_rooting_for_a_win → vm_access_terminal` in the
   graph). HaX confirms "the server room is the one door where picks and charm are both useless"
   (phone ink `:419`).
3. **Diegetic attacker box — CONCERN → fixed (reword).** HaX dialogue already frames it as "your
   attack box" (`:1069`, `:1076`), but the launcher's own `observations` (`:2280`) read only
   "Kali attack terminal -- your working box…", which neither says whose box it is nor why a Kali
   rig is standing in a hospital server room — thinner than m01's "A Kali Linux system IT have
   prepared for your security audit." Reworded to name it the player's SAFETYNET field box,
   patched into the server room's isolated segment (the one point that reaches the backup
   server's network — consistent with phone ink `:419`/`:930`), with HaX pushing tools/guides to
   it (matches the `#give_item:lab-workstation` delivery). See `03_edits_applied.md`.
4. **Flag payoff — OK.** Every flag drives a concrete beat, none is a bare scoreboard:
   flag1/ssh → unlocks the ProFTPD challenge (`puzzle_graph_unlocks: proftpd_exploitation_unlocked`,
   `:385`) and reveals the escrow safe (`escrow_safe_known`, `:1081`); flag2/proftpd → opens the
   database-backup challenge (`:396`); flag3/database → the drop-site cuts the Verified Restore
   Manifest the Recovery Console refuses to run without (`flagRewards` give_item `:2306`, item
   `:2320-2331`) and opens the emergency-store safe (`:374`); flag4/ghost_log → auto-unlocks the
   ENTROPY staging cache (`unlock_object :2311`, task `:409`) exposing Ghost's manifesto, the
   affiliate-handling note and the insider badge `SC-4471`.
5. **Requiredness & pacing — OK.** `concludeRequires.tasksCompleted` (`:512-519`) lists all four
   `submit_*_flag` tasks, so the VM cannot be skipped (confirmed Rounds 1–2). Field guides are
   drip-fed at the right beat, not all up front: lockpicking on its beat (`:837`); scanning+ssh
   on `access_server_room` (`:1068`); scanning-and-exploitation on first touching the launcher
   (`:1075`); vulnerability+exploitation+privesc on `submit_ssh_flag` (`:1081`); CyberChef on the
   ROT13 decode beat (`:1013`). Each is offered through the HaX phone hub gated on its
   `*_guide_offered` flag (phone ink `:188`), exactly the m01 pattern.
6. **Graph coherence — OK.** In `dungeon_graph.md` the VM nodes sit on the critical path: physical
   prerequisites feed in (`lock_vm_launcher_rooting_for_a_win → vm_access_terminal →
   vmch_submit_database_flag`), the four challenges chain
   (database → ssh → proftpd → ghost_log via `vmfl_* -.-> vmch_*`), and story unlocks hang off
   every flag (`vmfl_submit_database_flag → lock_emergency_storage_safe` /
   `lock_hospital_recovery_console`; `vmfl_submit_ghost_log_flag → lock_entropy_staging_cache` /
   `lock_ghost_lore_unlocked` / `lock_press_terminal`). All route to "Bring The Wards Back".

## Fix applied (mission-local)

- `scenario.json.erb:2280` — launcher `observations`:
  `"Kali attack terminal -- your working box for reaching the hospital backup server over the network"`
  → `"Your SAFETYNET field box -- the Kali kit you patched into the server room's isolated segment, the one point in the building that can still reach the backup server's network. HaX pushes your tools and field guides to it from here."`
  Resolves check 3. Text-only; validator clean, dungeon graph regenerated unchanged in structure.

## Author-sized gaps

None. The VM is integrated to the m01 standard. No new puzzle/room/story beat is needed.

## Shared-file changes for the orchestrator

None this round. (Round 2's shared privesc field-guide observation still stands; see `03_edits_applied.md`.)

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — no errors;
  only pre-existing suggestions/warnings, none introduced by this edit. Dungeon graph regenerated
  (Puzzle 105/126, critical path 4 hops to "Bring The Wards Back").
- No ink changed (no compile-ink needed).

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

---

## Round 2 (2026-10-18) — confirm, rebase judgement, pedagogy

Fresh independent pass. No new edits were needed; Round 1's two fixes hold and the VM is sound.

### Round 1 fixes confirmed held
- `mission.json:5` `secgen_scenario` = `break_escape/safetynet/m07_architects_gambit.xml` (the path). Correct.
- `scenario.json.erb:1906` `vm_object('attack_vm', …)` opens the **attacker** Kali/MSF console (SecGen `system_name` `attack_vm`, the launcher VM that owns no flags), not the target. Fallback `"title":"attack_vm"` matches the system_name. Correct.
- Flag host key: `vm_flags_json('scada_attack_host', …)` (`:88`) and `flags_for_vm('scada_attack_host', …)` (`:1922`) keyed by the flag-owning `system_name`. Correct.
- Display-form `targetFlags`: all four `submit_flags` tasks use `flag_station_safetynet_relay:scada_attack_host-flagN` (`:441,452,564,575`); the never-matching reference form was removed in PASS 2. Correct.
- Flag→global bridge: flag1 via `objective_task_completed:recover_coordination_traffic`, flag2 via `intercept_c2_channel`, flag3 via the station `flagReward set_global` (`:1945`), flag4 via `terminate_cascade_scripts`. All four `flagN_submitted` globals set; none relies on an unwired reward. Correct.
- `concludeRequires` (`:595`) gates the ending on all four flag tasks — the VM cannot be skipped. Correct.

### Rebase decision — KEEP (no rebase)
The current VM is a clean four-stage kill chain — anonymous NFS overshare → username (flag 1); netcat on a random 1024–2024 port → password (flag 2); operator SSH login reads a `0600` flag in their own home (flag 3); `sudo awk` → root reads the `0600` `/root` flag (flag 4) — that maps precisely onto m07's `mission.json` CyBOK: NS (NFS, SSH), SOIM (pen-testing recon/active), OSV (Linux access control, attacks against sudo), AAA (access control, elevated privileges), AB/MAT (kill chains). The chain is multi-stage and genuinely solvable with real login + real escalation, richer than the single-flag catalogue CTFs. None of the `SECGEN_ADAPTABLE_CATALOGUE.md` scenarios is SCADA-themed, and the SCADA framing is distinctive and tightly woven into the grid-control story. No catalogue scenario would improve skill fit, kill-chain depth or story fit. The bar for rebasing ("clear win") is not met. Keep and deepen.

### Pedagogy / VM-design — no mismatch, no fix
- The brief flagged the sudo-awk rule scope vs what the labsheet teaches. The `sudo_root_awk` module installs a **scoped** rule, `ALL ALL=(root) NOPASSWD: /bin/awk *, /usr/bin/awk *` (confirmed at `modules/vulnerabilities/unix/access_control_misconfigurations/sudo_root_awk/manifests/config.pp:13`), i.e. awk-as-root only, not full `ALL=(ALL) ALL`. This is exactly the GTFOBins scoped-sudo lesson, so there is **no** scoped-vs-full mismatch of the kind the brief warns about. The shared `privilege-escalation.md` Method 4 teaches `sudo awk 'BEGIN {system("/bin/bash")}'` against a `(root) NOPASSWD: /usr/bin/awk` rule — it matches the VM.
- Escalation is genuinely required for both escalation flags: flag 3 sits in the operator's own home at `0600` (needs the SSH login built from flags 1+2); flag 4 sits in `/root` at `0600` root-owned (needs the sudo-awk root shell). Neither is readable without the step it rewards. No fix needed.

### Field guides (shared — report-only)
All three VM-technique guides offered by m07 match the VM and need no change:
- `nfs-and-netcat-leaks.md` — `showmount -e` / mount + `nc` to an odd port ↔ `nfs_overshare` + `nc_message`.
- `ssh-access-and-bruteforce.md` — operator SSH login ↔ flag 3.
- `privilege-escalation.md` Method 4 (GTFOBins, `sudo awk … /bin/bash`) ↔ `sudo_root_awk`.
No shared-file change to report for m07.

### Verdict (Round 2)
No edits applied this round. Round 1 holds; validator re-run clean (only the pre-existing timed-text spacing WARNING on `agent_0x99` and the conditional music-credit SUGGESTions, unrelated to SecGen wiring). KEEP the VM. No author VM build item beyond the standing "a real build-and-solve is a separate VM task" note.

---

## Round 3 (2026-10-18) — VM↔mission integration quality (Step 4b)

Traced the four VM challenge/flag nodes through `dungeon_graph.md` and scored the six Step 4b
checks against the m01 benchmark.

### The VM on the critical path (from the graph)
`vm_access_terminal` sits in `server_room` (behind the RFID lock) → `vmch_recover_coordination_traffic`
→ flag1 → (soft) `vmch_intercept_c2_channel` → flag2 → `door_scada_control`; flag2 → `vmch_escalate_on_attack_host`
→ flag3; flag3 → `vmch_terminate_cascade_scripts` → flag4 → `lock_crisis_control_system` → `aim_end_the_sequence`.
Every flag feeds a downstream in-game unlock, and the final flag opens the win object. The VM is the spine
of the critical path, not a side-room.

### Six checks

1. **Motivation — OK.** The target host is named and justified in-fiction in the same room as the launcher:
   `scada_backup_server` observation (`scenario.json.erb:1993`) — "the host driving the cascade… its NFS
   export is world-readable… You reach it from the VM terminal." The NFS entry technique is surfaced there;
   HaX also names it (`ink/m07_phone_agent_0x99.ink:360`, "Their host has an NFS share open to anyone"). The
   credentials are *earned by the chain itself* (flag 1 → username, flag 2 → operator password via the netcat
   listener capture at `:1981`), not handed over as a wordlist from nowhere — tighter than m01's found note.
   The netcat listener is found by recon (HaX's `vm2` hint + the recon/NFS field guides), which is legitimate
   active recon rather than thin air. The SCADA door password itself is delivered diegetically inside the
   listener capture (`:1981`).

2. **Gating — OK.** The launcher is in `server_room`, reached only through the RFID-locked
   `door_server_room`, which has three gated routes on the graph (Ray Hollis's badge; the printed contractor
   badge behind the badge-station PIN from the shift handover sheet; or the optional RFID cloner). Server hall
   is itself reached via `operations_floor` from the checkpoint. No terminal in the start area.

3. **Diegetic attacker box — OK (reworded this round).** The launcher is placed in the server hall and framed
   as the agent's own working machine; HaX calls it "the Kali box in the server hall… your way onto their
   network" (`ink/m07_phone_agent_0x99.ink:358`). Provenance was previously left implicit (the one spot
   thinner than m01's "Kevin set it up for the audit"). Fixed mission-locally by rewording the launcher
   observation (`scenario.json.erb:1904`) so the agent is stated to have set it onto the maintenance VLAN —
   see the edit below. No ink change needed; the ink was already consistent with agent ownership.

4. **Flag payoff — OK.** Every flag triggers a concrete story beat, not a scoreboard tick:
   - flag 1 → `give_item` the Coordination Schedule decode (`flagRewards[0]`, `:1933`; item at `:1960`),
     which drives the team-redirect decision (`deduce_schedule`) and reveals the Portland site notes / vault rule.
   - flag 2 → `give_item` the Listener Capture (`:1938`; item at `:1976`) carrying the operator password **and**
     the SCADA control-room door code; `puzzle_graph_unlocks: scada_control` (`:1918`) — the redundant route past
     Elena.
   - flag 3 → `set_global flag3_submitted` (`:1943`) which arms the cascade, starts the visible 15-minute
     countdown and closes the team-redirect window (`:1013–1025`), and cues an Architect comms line — the
     mission's biggest beat.
   - flag 4 → `unlock_object crisis_control_system` (`:1952`), the flag-locked win object.

5. **Requiredness & pacing — OK.** `concludeRequires.tasksCompleted` gates the ending on all four flag tasks
   (`:590+`), so the VM cannot be skipped. Field guides are offered at the beat each challenge appears, not all
   up front: recon + NFS guides unlock on first VM-terminal use (`:1272`), the SSH guide on the flag-2 /
   password beat (`:940,947`), the privesc guide on flag 3 (`:1278–1280`, reinforced by HaX's "Privesc guide's
   yours if you want it" at `:1017`). RFID/lockpicking guides gate on their own physical beats (`:1256,1264`).

6. **Graph coherence — OK.** On the integrated graph the VM challenge/flag nodes sit on the amber critical
   path with their in-game prerequisites feeding in (RFID-locked server hall → launcher) and their story
   unlocks hanging off (flag2 → `door_scada_control`; flag4 → `lock_crisis_control_system` → `aim_end_the_sequence`).
   No floating VM node.

### Mission-local fix applied
- `scenario.json.erb:1904` — VM launcher `observations`: "A Kali box on the maintenance VLAN -- your working
  machine…" → "The Kali box you set up here on the maintenance VLAN -- your working machine…". Makes the
  attacker box's provenance explicit (check 3), matching the m01 bar. Cosmetic/narrative only; validator clean.

### Author-sized gaps
None. m07's VM is woven into the mission to the m01 standard — all six checks OK. No new puzzle/room/story
beat is needed; no `mission-puzzle-chains` referral warranted for integration.

### Shared files
No shared-file (SecGen module / shared field guide) change needed for Round 3.

### Verification (Round 3)
`ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb` — no errors; dungeon
graph regenerated. Only the pre-existing timed-text spacing WARNING on `agent_0x99` and the conditional
music-credit SUGGESTIONS remain, both unrelated to the VM/integration. No ink changed, so no recompile needed.

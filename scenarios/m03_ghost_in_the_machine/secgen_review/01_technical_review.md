# m03 Ghost in the Machine — SecGen/VM technical review

Audience: the author. Scope: cross-layer consistency between what the game asserts about
its VM and what the canonical SecGen scenario builds, the engine wiring, and solvability.
Static review only — no VM was built or booted. m01_first_contact is the known-good baseline.

## The VM in one picture

Canonical: `SecGen/scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml`. Two systems:

- **`attack_vm`** — Kali/MSF attacker console. IP_addresses[0] = 192.168.100.2. Carries no
  flags. This is the box the player drives (nmap, msfconsole, ftp, distcc client).
- **`ghost_in_machine_vm_network`** — Debian 12 server, IP_addresses[1] = 192.168.100.3.
  Owns all four flags. Headless target.

Four flags, generated in XML order on the target:
1. `scan_flag` — one generator, shown in two service banners (FTP AccessGrantMsg welcome
   message and the web index page source). Recon flag.
2. ProFTPD 1.3.3c source backdoor → root; the post-exploit string + flag leaked to `/root`
   at mode 0600 (readable only after the unauthenticated root RCE).
3. ROT13-encoded price list served in the web page source (decode = flag 3).
4. distcc daemon command execution (CVE-2004-2687, port 3632); transaction log + flag
   leaked to `/home/distccd/` (owner distccd, mode 0600, home 0750 — readable only after
   the distcc RCE).

This matches the game's four objectives and four flag globals exactly.

## Findings

### F1 — `secgen_scenario` was a bare name (engine wiring, critical). FIXED.
`mission.json:5` was `"m03_ghost_in_the_machine"`. Hacktivity binds VMs by matching
`secgen_scenario` against `sec_gen_batches.scenario`, which is the XML path relative to
SecGen's `scenarios/` dir with `.xml` (`SecGenBatch.read_scenarios`,
`validates :scenario, inclusion: { in: SCENARIOS }`). A bare name is not in that set, fails
validation, and binds no VM — `requires_vms?` stays true but a real-VM player gets nothing.
Set to `break_escape/safetynet/m03_ghost_in_the_machine.xml`. This was the expected recurring
finding from the m01 baseline.

### F2 — vm-launcher pointed at the target host, not the attacker (engine wiring, critical). FIXED.
`scenario.json.erb:1538` was `vm_object('ghost_in_machine_vm_network', {…"ip":"192.168.100.3"…})`.
`vm_object(title, fallback)` (mission.rb:244) matches `title` against `vm['title']` (the SecGen
`system_name`) in Hacktivity mode. The launcher is the console the player attacks *from* — in
m01 that is `vm_object('kali', …)`, the attacker, while the flag host is a separate
`vm_flags_json('shatter_server')` key. m03 had inverted this: the launcher keyed the flag-owning
Debian target (`ghost_in_machine_vm_network`, .3), which either bridges the player into the
target server (letting them read flags without exploiting, hollowing the challenge) or falls
through to a wrong placeholder. Changed to `vm_object('attack_vm', {…"title":"attack_vm","ip":"192.168.100.2"…})`.
The flag host remains correctly keyed on `ghost_in_machine_vm_network` in `vm_flags_json` and the
flag-station `acceptsVms` — those are right and unchanged.

### What was already correct (no change)
- **`vm_flags_json('ghost_in_machine_vm_network', […])`** (line 83) and flag-station
  `acceptsVms:["ghost_in_machine_vm_network"]` (line 1556) — keyed on the flag-owning
  `system_name`. Correct.
- **`targetFlags` form.** All four `submit_flags` tasks use the display form
  `flag_station_dropsite:ghost_in_machine_vm_network-flagN` (lines 273/284/295/306), which is
  the `<station-id>:<vm>-flagN` form the game.rb matcher accepts. Not the never-matching
  `<vm>:flag_N` reference form. Correct.
- **flag→global bridging.** The four `flag_*_submitted` globals are set by
  `objective_task_completed:submit_*_flag` event mappings (lines 976-998), not relied on from
  `flagRewards` (which only emit/set write-only keys + one give_item). The confrontation and
  ending gates read those globals; the chain is complete. Correct.
- **Solvability / VM genuinely required.** The conclusion aim's `concludeRequires` lists all
  four submit-flag tasks (lines 451-458); the ending cannot be reached without them. Flags 2
  and 4 sit in `/root` and `/home/distccd/` at mode 0600, so they are genuinely behind the
  root FTP backdoor and the distcc RCE respectively — no shortcut. Flags 1 and 3 are recon/
  decode of service banners and page source. The VM cannot be skipped.
- **Module resolution.** Every `module_path` the XML references exists under `SecGen/modules/`.
  SecGen anchors module_path as `^modules/<path>$` (lib/objects/module.rb
  `prepare_required_value`), so `vulnerabilities/unix/ftp/proftpd_133c_backdoor` selects the
  root variant and not the sibling `..._nonroot` — no ambiguity, no XML edit needed. The root
  variant runs the backdoor as root and leaks to `/root`, which is what the game's "unauthenticated
  remote root" framing requires.
- **No in-mission `secgen/` copy** exists, so there is no canonical-vs-copy drift to reconcile.

### Observations (no fix applied)
- `labsheet.md:540` / field guide `nmap -sV 192.168.56.0/24` is a generic "scan a VM you own"
  exercise, not the mission's 192.168.100.0/24 network. Left as-is; author decision (see
  03_edits_applied.md).
- `mission.json:8` lab_sheet_url slug uses hyphens vs the underscore field-guide filename —
  cosmetic, not a VM value, left as-is.
- `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` in the mission dir is a stale pre-canonical
  proposal, not wired anywhere.

## Verdict

Two silent engine-wiring breaks (both of the kind the m01 baseline predicted) made the mission
bind no VM in Hacktivity and, even when bound, hand the player the wrong box. Both fixed with
the smallest possible value changes. Every other layer — flag count/order, flag ownership and
gating, targetFlags form, flag→global bridging, the ending gate — already agrees with the VM.
The mission is consistent and solvable end to end against the canonical SecGen scenario,
pending a real VM build-and-solve (a separate task, out of scope here).

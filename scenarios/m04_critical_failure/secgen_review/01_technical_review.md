# m04 Critical Failure — SecGen/VM integration review

Cross-layer consistency review of the SAFETYNET mission 4 VM integration, against the
m01 baseline and the engine source. Two findings fixed; the rest of the wiring was
already correct. Audience: the author.

## Scope

Reviewed: `mission.json`, `scenario.json.erb` (flags, objectives, vm-launcher,
flag-station, flag→global bridge, `concludeRequires`), the ink that names VM values,
both SecGen XML copies, and the SecGen modules the XML references. No mission labsheet
exists. Field guides are referenced by URL only and are shared across missions, so
value checks against them are noted under "shared files", not edited here.

## Findings

### F1 — `secgen_scenario` was a bare name (CRITICAL, fixed)

`mission.json:5` had `"secgen_scenario": "m04_critical_failure"`. Hacktivity matches this
string against `sec_gen_batches.scenario`, which `SecGenBatch.read_scenarios` populates
from `Dir["**/*.xml"]` under SecGen's `scenarios/` dir with
`validates :scenario, inclusion: { in: SCENARIOS }`. A bare name is not in that set, so
it binds no VM: `requires_vms?` stays true but a real-VM player gets nothing. Set to the
XML path `break_escape/safetynet/m04_critical_failure.xml` (the m01 form).

### F2 — vm-launcher opened a console on the target, not the attacker (CRITICAL, fixed)

`scenario.json.erb` launched `vm_object('bms_jump_server', …)`. `bms_jump_server` is a
real built system, so in Hacktivity mode `vm_object` returns the target's own console
object. The player would land on the victim with a KDE desktop, and the Kali box — the
only system carrying nmap/metasploit/pwtools — had no launcher at all, so it was
unreachable. The entire kill chain (scan → distcc foothold → sudoedit privesc) is
unplayable that way, yet `concludeRequires` still demands all four flags.

m01 (`vm_object('kali')`) and m02 (`vm_object('attack_vm')`, fallback title `kali`) both
launch the attacker and key the flag-station to the target. The flag-station here was
already correct (`acceptsVms: ["bms_jump_server"]`, `flags_for_vm('bms_jump_server', …)`).
Changed the launcher to `vm_object('kali', …)` with a standalone fallback on the target's
subnet (`192.168.100.3`) and the `kali/kali` postit, and reworded the observations to
describe a Kali working box reaching the jump server. Smallest change that makes the
attack reachable; no puzzle mechanics added.

## Engine wiring — checked, correct

- **`vm_object` title** = SecGen `system_name` `kali` (after F2). Fallback title/ip are
  standalone placeholders on the 192.168.100.x subnet shared with the target.
- **`flags_for_vm('bms_jump_server', …)`** keyed by the system that owns the flags.
  m04 has no top-level `flags` block, and does not need one: its `flagRewards` are all
  `set_global`, not `unlock_object`, and the station validates against its own `flags`
  array — `resolve_flag_ref` (the only reader of the top-level block) is reached only by
  `unlock_object` rewards whose `requires` is a `vm:flag_n` ref, which m04 has none of.
- **`targetFlags` form.** All four `submit_flags` tasks use the DISPLAY form
  `flag_station_dropsite:bms_jump_server-flagN`, which `process_flag_task_completions!`
  matches (station-scoped form). None use the never-matching reference form. Good.
- **Flag → global bridge.** Each `set_global` reward and the matching
  `objective_task_completed` mapping both set the `flag_*_submitted` global (harmless
  redundancy). No gate relies on an unset global; `sudo_flag_submitted` is not used here.
- **Flag numbering.** `targetFlags` map privesc→flag3, distcc→flag4, matching the XML
  document order (website, proftpd, sudoedit, distcc), not the submit-task order. Correct.
- **Two XML copies** are byte-identical (`diff` clean), module paths all resolve.

## Solvability

`concludeRequires` lists the four submit-flag tasks, so the VM work cannot be skipped and
the ending depends on it. Chain, from SecGen source:

- flag_1 (website) and flag_2 (proftpd) are network-reachable from Kali.
- flag_4 (distcc, CVE-2004-2687) is the foothold — RCE as the distcc daemon context.
- flag_3 (privesc) sits in `/root/root_only/bms_calibration_override` (root, 0600), so it
  genuinely needs escalation. The `sudoedit` module writes
  `ALL ALL = (root) NOPASSWD: sudoedit /etc/hosts`, an account-agnostic rule, so whatever
  account the foothold lands in can run the CVE-2023-22809 escalation to root. The
  escalation gate is real and the foothold account does not matter.

All four flags exist on `bms_jump_server`, owned/placed as the game implies. No in-game
text leaks a per-build secret (flag strings and the root password are build-generated).

## Verdict

Pass after F1 and F2. The mission could not bind a VM (F1) and could not be solved on a
real build (F2); both are now aligned to the m01/m02 pattern. One item needs a real build
to confirm end to end (see `03_edits_applied.md`).

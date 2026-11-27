# m07 — consistency matrix

`(per-build)` = generated at VM build time, legitimately absent from source.

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| Attacker VM system_name / lookup key | "the Kali box" (flavour) | `vm_object('attack_vm', …)` lookup key `attack_vm` | `attack_vm` (Kali/MSF) | match |
| Attacker VM fallback title | "Kali box" | was `kali` → now `attack_vm` | title = `attack_vm` | match (after F2) |
| Attacker fallback IP | — | `192.168.100.50` | `private_network` (per-build) | consistent (standalone placeholder) |
| Attacker account | — | — | `kali`/`kali`, super_user | match (not a mission flag) |
| Target VM system_name | — | `vm_flags_json('scada_attack_host')`, `acceptsVms:["scada_attack_host"]` | `scada_attack_host` (Debian 12) | match |
| Target IP | — | not pinned in game (referenced by name) | `private_network` (per-build) | n/a |
| secgen_scenario | — | `break_escape/safetynet/m07_architects_gambit.xml` (was `m07_architects_gambit`) | XML at that path | match (after F1) |
| Flag count | 4 (four flag tasks) | 4 flags, 4 `submit_flags` tasks | 4 flag-producing modules | match |
| Flag 1 | NFS coordination traffic | `…-flag1`, task `recover_coordination_traffic` | `nfs_overshare` (anon NFS) → username + flag | match |
| Flag 2 | netcat C2 intercept | `…-flag2`, task `intercept_c2_channel` | `nc_message` on port 1024–2024 → password + flag | match |
| Flag 3 | operator account login | `…-flag3`, task `escalate_on_attack_host` | `parameterised_accounts` flag `flag` in operator home, `0600` | match (login required) |
| Flag 4 | root on attack host | `…-flag4`, task `terminate_cascade_scripts` | `sudo_root_awk` flag in `/root`, `0600`, root | match (root required) |
| Operator username | — | — | random `mythical_creatures` word (per-build) | n/a |
| Operator password | — | — | `strong_password_generator` (per-build) | n/a |
| targetFlags form | — | `flag_station_safetynet_relay:scada_attack_host-flagN` (display form) | — | match (matches game.rb) |
| flagN_submitted globals | gate ink/objectives | 1,2,4 via `objective_task_completed`; 3 via `flagReward set_global` | — | all wired |
| Escalation (flag 3) | operator login | operator owns `0600` home flag | `parameterised_accounts` 0600, super_user false | genuine |
| Escalation (flag 4) | sudo awk → root | root-owned `/root` flag | `sudo_root_awk`: `ALL ALL=(root) NOPASSWD: awk *` | genuine |
| In-mission secgen/ copy | — | none | — | n/a (nothing to drift) |

No mismatch remains after F1 and F2.

---

## Round 2 (2026-10-18) — re-checked, unchanged

Re-ran the matrix against the current files. Every row still holds; no mismatch remains and
no value drifted since Round 1. Key re-confirmations:

- `secgen_scenario` = `break_escape/safetynet/m07_architects_gambit.xml` (mission.json:5).
- `vm_object('attack_vm', …)` lookup key and fallback `title` both `attack_vm` (:1906) → attacker console.
- Flag host key `scada_attack_host` on both `vm_flags_json` (:88) and `flags_for_vm` (:1922).
- Four display-form `targetFlags` (:441,452,564,575); four `flagN_submitted` globals wired.
- sudo rule is scoped (`awk` only) — matches the GTFOBins teaching, not a scoped-vs-full mismatch.

No rebase; VM kept. No new edits.

# m04 Critical Failure — SecGen/VM consistency matrix

Value-by-value cross-layer table. *(per-build)* marks values generated at build time
(legitimately absent from source). Status is after the fixes in `03_edits_applied.md`.

## Hosts, network, accounts

| Value | Story (ink / scenario text) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| Target host | "jump server in there" (Vance, phone) | `acceptsVms: ["bms_jump_server"]`, `flags_for_vm('bms_jump_server', …)` | `system_name` **bms_jump_server** (Debian 12) | match |
| Attack host | — | `vm_object('kali', …)` (launcher) | `system_name` **kali** (Kali/MSF) | match (after fix) |
| Target IP | SCADA log "192.168.100.X"; monitor "192.168.100.10" | launcher fallback `ip 192.168.100.10` (name/obs); kvm monitor obs `192.168.100.10` | `IP_addresses[0]` = bms_jump_server *(per-build)* | match (placeholder) |
| Attacker IP | — | launcher fallback `ip 192.168.100.3` | `IP_addresses[1]` = kali *(per-build)* | match (placeholder, same subnet) |
| Kali creds | — | postit `user: kali / password: kali` | `parameterised_accounts` `kali/kali`, `super_user:true` | match |
| secgen_scenario id | — | `mission.json` `break_escape/safetynet/m04_critical_failure.xml` | XML path under SecGen `scenarios/` | match (after fix) |

## Flags (document order on bms_jump_server)

| # | SecGen module | Leaked file (path, owner) | Needs root? | flag-station flag (index) | targetFlags task | Status |
|---|---|---|---|---|---|---|
| flag_1 | `parameterised_website` | falsified rack status page (web body) | no | `flag{network_scan_complete}` [0] | `…:bms_jump_server-flag1` → submit_network_scan_flag | match |
| flag_2 | `proftpd_133c_backdoor` | `optigrid_transfer/coordination_notes` (acct home) | no | `flag{ftp_intel_gathered}` [1] | `…-flag2` → submit_ftp_intel_flag | match |
| flag_3 | `sudoedit` (CVE-2023-22809) | `/root/root_only/bms_calibration_override` (root, 0600) | **yes** | `flag{privesc_complete}` [2] | `…-flag3` → submit_privesc_flag | match |
| flag_4 | `distcc_exec` (CVE-2004-2687) | `optigrid_toolkit/operator_notes` | no (is the foothold) | `flag{distcc_exploit_complete}` [3] | `…-flag4` → submit_distcc_exploit_flag | match |

Flag numbering is document order per `Mission#flags_by_vm` (keyed by `system_name`,
order from `flag_hints.xml`). SecGen declares website, proftpd, sudoedit, distcc in that
order = flag_1..flag_4. The game's `targetFlags` map privesc→flag3 and distcc→flag4,
which matches the XML order (NOT the submit-task narrative order). Confirmed consistent.

## Flag → global bridge

| flag-station reward (array index) | Global set | Also set by | Status |
|---|---|---|---|
| rewards[0] set_global | `flag_network_scan_submitted` | `objective_task_completed:submit_network_scan_flag` | match |
| rewards[1] set_global | `flag_ftp_intel_submitted` | `objective_task_completed:submit_ftp_intel_flag` | match |
| rewards[2] set_global | `flag_privesc_submitted` | `objective_task_completed:submit_privesc_flag` | match |
| rewards[3] set_global | `flag_distcc_exploit_submitted` | `objective_task_completed:submit_distcc_exploit_flag` | match |

`rewards[i]` aligns with `flags[i]`, so reward order follows flag order (privesc=index 2,
distcc=index 3). Correct. `concludeRequires` gates the ending on the four submit tasks.

## Two SecGen XML copies

| | Canonical (`SecGen/.../m04_critical_failure.xml`) | In-mission (`scenarios/m04_critical_failure/secgen/…`) |
|---|---|---|
| Content | authoritative | byte-identical (`diff` clean) | match |

---

## Round 2 (2026-10-18) — re-checked, still consistent

Re-ran the Step 2 matrix against the current files. All rows above still hold:

- `secgen_scenario` = `break_escape/safetynet/m04_critical_failure.xml` (match).
- `vm_object('kali', …)` launcher → attacker box (match); fallback `192.168.100.3` on the
  target subnet.
- Flag host key, 4 flags in XML document order (website, proftpd, sudoedit, distcc =
  flag_1..flag_4), `targetFlags` map privesc→flag3 / distcc→flag4 — match.
- Flag→global bridge rows all match; `concludeRequires` gates all four submit tasks.
- Two SecGen XML copies byte-identical.

### Leaked-file placement verified against module source (Round 2)

| Flag | Module | Leak path (owner, mode) | Escalation needed? |
|---|---|---|---|
| flag_1 website | `parameterised_website` | web body (falsified rack status) | no (network) |
| flag_2 proftpd | `proftpd_133c_backdoor` | `optigrid_transfer/coordination_notes` (FTP) | no (network) |
| flag_3 sudoedit | `sudoedit/manifests/install.pp` | `/root/root_only/bms_calibration_override` (root, 0600) | **yes** — root-only |
| flag_4 distcc | `distcc_exec/manifests/config.pp` | `/home/distccd/optigrid_toolkit/operator_notes` (distccd, 0600) | no — RCE lands as distccd |

Escalation gate (flag_3) is real; the account-agnostic `ALL ALL = (root) NOPASSWD: sudoedit
/etc/hosts` rule lets the distccd foothold run CVE-2023-22809 to root. No drift found.

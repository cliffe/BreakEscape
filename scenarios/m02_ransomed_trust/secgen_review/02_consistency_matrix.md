# m02 Ransomed Trust — SecGen/VM consistency matrix

Columns: value | story (ink/notes) | Break Escape scenario | SecGen VM (canonical) | status.
Canonical VM: `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m02_ransomed_trust.xml`.
*(per-build)* = generated at build time, legitimately absent from source.

## Hosts and network

| Value | Story | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| Attack box name | "Kali terminal" (object text) | `vm_object('attack_vm', …)`, launcher title `kali` | `system_name` = `attack_vm`, base Kali/MSF | match (title arg = system_name; fallback label cosmetic) |
| Attack box IP | — | fallback `172.16.0.2` | `IP_addresses[0]` = `172.16.0.2` | match |
| Target server name | "backup server" / "backup box" | `vm_flags_json('hospital_backup_server')`, `acceptsVms:["hospital_backup_server"]` | `system_name` = `hospital_backup_server` | match |
| Target server IP | `172.16.0.3` (Gary's notes, network diagram) | `172.16.0.3` in flavour text | `IP_addresses[1]` = `172.16.0.3` | match |
| FTP service | ProFTPD 1.3.3c backdoor | ProFTPD 1.3.3c (notes, CyBOK) | `proftpd_133c_backdoor` vuln | match |

## Accounts and privilege

| Value | Story | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| IT admin account | Gary Whitlock | account `gary`, SSH as `gary` | user `gary`, `super_user:false` | match |
| SSH password | "old shared admin password" | HaX hint + sticky note list `Emma2018 / Hospital1987 / StCatherines`; password-lock `requires:"Hospital1987"` | `gary` password literal `Hospital1987` | match |
| Root password | — (root via exploit, not login) | not referenced | `server_root_password` *(per-build strong)*; `ssh_root_login` | match |
| Escalation | root via ProFTPD backdoor | flag2 = "exploit the ProFTPD backdoor" | flag_2 leaked by proftpd vuln `strings_to_leak` (root post-exploit) | match |

## Flags (order = SecGen generation order within `hospital_backup_server`)

| Game slot | Game meaning | SecGen flag (XML order) | Owner / access | Status |
|---|---|---|---|---|
| flag1 | SSH foothold (`submit_ssh_flag`) | flag_1 — backup/recovery procedures doc (concatenate encoder) in `gary` leaked_filenames | `gary` home, 0600 → needs SSH login | match |
| flag2 | ProFTPD backdoor exploited (`submit_proftpd_flag`) | flag_2 — equipment deployment log, proftpd `strings_to_leak` | root (post-exploit) | match |
| flag3 | Database backup located (`submit_database_flag`) | flag_3 — server notice, proftpd `strings_to_pre_leak` | anonymous FTP, pre-login | match |
| flag4 | Ghost operational log (`submit_ghost_log_flag`) | flag_4 — encoded operational log, proftpd `strings_to_pre_leak` reversible encoder | anonymous FTP, pre-login | match |

Count: 4 game slots ↔ 4 VM flags. Order aligns slot-for-slot.

## Physical / story values (ink canonical — informational, not VM-bound)

| Value | Story (ink/notes) | SecGen VM flavour text | Status |
|---|---|---|---|
| Escrow safe PIN | hospital founding year = `1987` (plaque, snag list, Doyle, Kim) | backup-procedures doc + deployment log: "the hospital's founding year, never changed" | match (VM gives rule, game gives value — consistent) |
| Insider badge | `SC-4471` (asset ink, phone, agent0x99) | deployment log + encoded op log name badge `SC-4471` | match |
| Ransom amount | £150,000 | £150,000 (deployment log) | match |
| Insider motive | unpaid, grievance, "a post not a payroll" | unpaid grievance (deployment log + op log) | match |
| Ransomware actor | ENTROPY / Ghost | ENTROPY / Ghost (Ransomware Incorporated) | match |

## Build-time secrets (correctly absent from source)

| Value | Status |
|---|---|
| Actual flag strings | *(per-build)* — `flag_generator` |
| Root password (both VMs) | *(per-build)* — `strong_password_generator` |
| Cleanup `spoiler_admin_pass` | *(per-build)* |

No in-game text prints a per-build secret. The one fixed credential (`Hospital1987`) is a deliberate hinted password, not a per-build secret.

---

## Round 2 (2026-10-18) — matrix re-verified, no changes

Every row re-checked against the live files; all still `match`. Additions confirmed this pass:

| Value | Where it lands on the VM (module-verified) | Access required | Status |
|---|---|---|---|
| flag2 (proftpd_backdoor_exploited) | `/root/` via `proftpd_133c_backdoor` `strings_to_leak`, mode `0600` owner root (config.pp) | root — only via the backdoor RCE | match (escalation genuine) |
| flag1 (ssh_access_granted) | `/home/gary/hospital_docs/backup_procedures`, `leak_files` mode `0600` owner gary | gary (SSH) or root | match (foothold genuine) |
| flag3 (database_backup_located) | `/home/ftp/` via `strings_to_pre_leak` | anonymous FTP, pre-exploit | match (recon, by design) |
| flag4 (ghost_operational_log) | `/home/ftp/` via `strings_to_pre_leak`, reversibly encoded (`^(ascii|alpha)_reversible$`, difficulty low) | anonymous FTP + decode | match (decode challenge intact) |
| in-mission secgen copy | — | `diff -q` vs canonical: identical | match |

No value drift found. `secgen_scenario`, launcher, flag host key, `targetFlags` display form,
flag→global bridge and `concludeRequires` all confirmed (see 01 Round 2).

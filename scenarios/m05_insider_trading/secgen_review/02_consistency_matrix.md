# m05 Insider Trading — consistency matrix

Values appearing in more than one layer. *(per-build)* = generated at build time, legitimately
absent from source. Status reflects the state **after** the fixes in `03_edits_applied.md`.

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| SecGen scenario id | n/a | `break_escape/safetynet/m05_insider_trading.xml` (mission.json:5, fixed) | XML path `break_escape/safetynet/m05_insider_trading.xml` | match (was mismatch) |
| Attack VM lookup key | n/a | `vm_object('attack_vm')` (1806) | `system_name` = `attack_vm` | match |
| Attack VM console IP | n/a | fallback `172.16.0.3` (1806, fixed) | attack_vm on 172.16.0.x (desc: 172.16.0.3) | match (was off-network) |
| Attack VM display title | n/a | fallback `"kali"` (1806) | Kali MSF base, system_name `attack_vm` | cosmetic diff (see open list) |
| Target server | "research portal", "Bludit", "its own subnet behind the server room" | flag-station `acceptsVms:["qdc_research_server"]`, `flags_for_vm('qdc_research_server',...)` (1814-1815) | `system_name` = `qdc_research_server` | match |
| Target server IP | not stated | not stated (real IP from vm_context) | 172.16.0.2 (desc; *(per-build)* via network_ip) | match / build-confirm |
| Flag count | n/a | 4 consumed (+implicit bonus) | 4 primary + 1 bonus zip | match |
| flag1 (recon) | "admin login sitting in a handover note" | `submit_flag1` → `flag_station_evidence:qdc_research_server-flag1`; fallback `flag{leaked_bludit_admin_credentials}` | bludit `strings_to_pre_leak` (handover note), web-exposed | match |
| flag2 (web RCE) | "known upload flaw, but it needs a login" | `submit_flag2` ...-flag2; `flag{bludit_authenticated_upload_rce}` | bludit `strings_to_leak`, authenticated upload RCE | match |
| flag3 (user) | staging/exfil manifest, badge #4471 | `submit_flag3` ...-flag3; `flag{torres_staging_manifest}` | manager home `/home/<mgr>/flag` 0600 | match |
| flag4 (root) | Architect's acquisition authorisation | `submit_flag4` ...-flag4; `flag{architect_acquisition_authorisation}` | `sudo_root_less`, root 0600 (base64) | match |
| flag5 (bonus) | n/a | not consumed | `zip_file` `heisenberg_backup.zip` in `/root` | match (extra, harmless) |
| Flag→global | gates HaX hub + debrief on `flagN_submitted` | `flagRewards` `set_global flagN_submitted` (1816-1841); globals declared (705-708) | n/a | match |
| Ending gate | debrief needs all four flags in | `concludeRequires.tasksCompleted` submit_flag1..4 (527-534) | n/a | match |
| Insider identity | David Torres, badge #4471, medical debt | mission.json key_npcs; manifest/auth text | manager account; manifest "badge #4471", medical-debt note; Architect doc | match |
| Bludit admin username | n/a | n/a (per-build) | = `organisation['manager']['username']` (sed-rewritten into users.php) *(per-build)* | match |
| Crackable password | n/a | n/a | `random_sanitised_word` from `wordlist`, min 6 *(per-build)* | match |
| Recruiter cover | "TalentStack Executive Recruiting" (ink) | n/a | "TalentStack Executive Recruiting" (manifest + Architect doc) | match |
| Lab-sheet URL | n/a | n/a | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/bludit-cms-exploitation/` | see open list (field guide) |
</content>

---

# Round 2 (2026-10-18) — re-check

Re-ran the matrix against the current files and the module manifests. No new mismatch; every
row above still holds. Additions resolved this round:

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| vm_object opens attacker console | n/a | `vm_object('attack_vm')` (1806) | attacker system `attack_vm`, Kali MSF base | match (opens Kali, not the target) |
| flag3 escalation gate | HaX hints reference the manifest as evidence | `set_global flag3_submitted` | `/home/<manager>/flag` 0600 owned by manager; needs manager login | match (genuine user gate) |
| flag4 escalation gate | HaX "see what that account can run" (ink 401/1055), sudo guide (829/835) | `set_global flag4_submitted` | `sudo less /root/<file>` GTFOBins escape; flag 0600 root-owned | match (genuine root gate; scoped sudo rule) |
| sudo rule scope | guide teaches GTFOBins `less` escape | n/a | `ALL ALL=(root) NOPASSWD: /bin/less /root/<pre_leak>` (sudo_root_less/config.pp) | match (scoped = taught technique; no full-sudo mismatch) |
| Field-guide flag3 step | n/a | n/a | manifest 0600 in manager home | **gap in shared guide** — see 03 R2 report |

Ink carries no hard VM values (no IPs, no literal flag strings, no filesystem paths) — story
canon only. Confirmed by grep of `ink/*.ink`.

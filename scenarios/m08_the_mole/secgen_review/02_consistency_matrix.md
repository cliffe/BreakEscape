# m08_the_mole — consistency matrix

Values that appear in more than one layer. `(per-build)` = generated at build time,
legitimately absent from source. Status reflects state **after** the fixes in `03_edits_applied.md`.

| Value | Story (ink/notes) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| SecGen scenario binding | n/a | `secgen_scenario` = `break_escape/safetynet/m08_the_mole.xml` (mission.json) | XML at `break_escape/safetynet/m08_the_mole.xml` | match (was bare `m08_the_mole`) |
| Console VM title (lookup) | n/a | `vm_object('attack_vm', …)` | `system_name` = `attack_vm` | match |
| Console VM IP (fallback) | n/a | `172.16.0.3` | `attack_vm`, IP_addresses idx 0 / desc 172.16.0.3 | match (was `192.168.100.50`) |
| Console VM display title | "kali" (Kali box) | fallback `title:"kali"` | Kali / MSF base | match (cosmetic) |
| Target server host key | n/a | `vm_flags_json`/`flags_for_vm`/`acceptsVms` = `safetynet_gitlist_server` | `system_name` = `safetynet_gitlist_server` | match |
| Target server IP | n/a (not asserted in ink) | not referenced | `172.16.0.2` (desc) | n/a in game (OK) |
| Flag count | 4 ("All 4 VM flags") | 4 flags / 4 flagRewards / 4 submit_flags tasks | 4 flag_generator outputs | match |
| Flag 1 — recon | GitList RCE (notes, agent_0x99) | flag1 → `found_gitlist_vuln` | `gitlist_040` `strings_to_pre_leak` | match |
| Flag 2 — stashed creds | credentials in repo history | flag2 → `found_leaked_creds` | `gitlist_040` `strings_to_leak` (password) | match |
| Flag 3 — home dir | ENTROPY correspondence, SSH login | flag3 → `found_architect_comms` | `parameterised_accounts` `/home/<ops>` 0600 ops-owned | match |
| Flag 4 — root | access logs + Architect auth | flag4 → `found_access_logs` | `sudo_root_apt_get` `/root` 0600 root-owned | match |
| targetFlags form | n/a | `flag_station_evidence_relay:safetynet_gitlist_server-flagN` (display) | n/a | match (matching form) |
| Ops account username | "the account" (generic) | consumed via recovered creds | `organisation['manager']['username']` | (per-build) |
| Ops account password | not printed in game | wordlist brute-force implied | `random_sanitised_word` min_len 6 from `wordlist` | (per-build) |
| Sudo relationship | "Root for the account" (logs note) | escalate_to_root task | `ALL ALL=(root) NOPASSWD: /usr/bin/apt-get *` | match |
| ENTROPY address | `architect@entropy.onion` (evidence wall) | n/a | `architect@entropy.onion` (flag3 correspondence) | match |
| Lab sheet URL | n/a | n/a | `.../labs/safetynet/scanning-and-exploitation/` | match (guide exists) |
| Flag strings | n/a | `vm_flags_json`/`flags_for_vm` fallback placeholders (`flag{…}`) | `flag_generator` outputs | (per-build) — fallbacks are dev-only |

No mismatches remain. The only not-fully-confirmable item is the within-`gitlist_040` emit
order of flags 1 vs 2 (both from one module), which a build would confirm; the game's labels
assume recon-then-creds, matching the XML document order of the inputs.

# m03 Ghost in the Machine — SecGen/VM consistency matrix

Canonical VM: `SecGen/scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml`.
Two systems: `attack_vm` (Kali/MSF attacker console) and `ghost_in_machine_vm_network`
(Debian 12 server, owns all four flags). No in-mission `secgen/` copy exists.

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|---|---|---|---|---|
| SecGen scenario id | n/a | `mission.json` `secgen_scenario` was bare `m03_ghost_in_the_machine`; now `break_escape/safetynet/m03_ghost_in_the_machine.xml` | XML path under SecGen `scenarios/` | **fixed** (was mismatch) |
| Attacker console VM | "Nightshade has bridged it to your own kit" (ink/launcher text) | vm-launcher `vm_object` key was `ghost_in_machine_vm_network` / ip .3; now `attack_vm` / ip 192.168.100.2 | `system_name=attack_vm`, IP_addresses[0]=192.168.100.2, Kali MSF, enable_console | **fixed** (was mismatch) |
| Flag-owning host | n/a | `vm_flags_json('ghost_in_machine_vm_network')`, flag-station `acceptsVms:["ghost_in_machine_vm_network"]` | `system_name=ghost_in_machine_vm_network`, IP_addresses[1]=192.168.100.3 | match |
| Flag count / order | 4 globals: scan, ftp, http, distcc | 4 flags flag1..flag4 (station + top-level `flags`) | 4 flag_generators in order: scan_flag(1), proftpd root leak(2), website rot13(3), distcc(4) | match |
| Flag 1 (scan) | "That's their lab mapped" | flag1 | `scan_flag` shown in FTP AccessGrantMsg welcome + web index comment (same datastore, one generator) | match |
| Flag 2 (FTP) | "The backdoor they sold Ghost" | flag2 | proftpd_133c_backdoor root leak → `/root`, mode 0600 (readable only after root RCE) | match, gated |
| Flag 3 (pricing) | "Price list's in" | flag3 | ROT13 price list in web page source (parameterised_website) | match |
| Flag 4 (distcc) | "the distcc logs are the case" | flag4, pays out "Zero Day Transaction Log" item | distcc_exec leak → `/home/distccd/` owner distccd mode 0600, home 0750 (readable only after distcc RCE) | match, gated |
| targetFlags form | n/a | `flag_station_dropsite:ghost_in_machine_vm_network-flagN` (display form) | n/a | match (matches game.rb matcher) |
| flag→global bridge | `flag_scan/ftp/http/distcc_submitted` | set via `objective_task_completed:submit_*_flag` mappings (not via flagRewards) | n/a | match |
| distcc port | "The legacy distcc daemon on 3632" (phone ink) | — | CVE-2004-2687, high port 3632 | match |
| Target account | n/a | — | `student`/`student` (non-super_user), plus distccd/ftp service users | match (per-build root passwords) |
| Crackable password | n/a | — | none — flags gated by RCE + file perms, not password cracking | n/a (no wordlist/crack step in this mission) |
| Network | n/a | launcher ip now 192.168.100.2 | 192.168.100.0/24 (attacker .2, target .3) | match |
| `nmap` example subnet | — | labsheet.md:540 / field guide `nmap -sV 192.168.56.0/24` | mission network is 192.168.100.0/24 | observation (generic "a VM you own" exercise, not the mission net) |

Per-build values (legitimately absent from source): all four flag strings, the server
root password, the cleanup/spoiler passwords. Marked present via `flag_generator` /
`strong_password_generator`, not "missing".

---

## Round 2 (2026-10-18)

Re-verified every row against the canonical SecGen XML and the referenced modules. No change
to the matrix: every technical value still matches, the two Round-1 "fixed" rows remain
correctly aligned in `mission.json` / `scenario.json.erb`. Additional source confirmations:

| Value | Break Escape | SecGen VM / module | Status |
|---|---|---|---|
| Flag 2 ownership/mode | gated FTP flag | `/root`, root:root, 0600 (`leak_files` default owner + explicit `mode=0600`) | match, root-gated |
| Flag 4 ownership/mode | gated distcc flag | `/home/distccd` (dir 0750 distccd), file distccd 0600 | match, distccd-gated |
| Target account privilege | n/a | `student` `super_user:false`; no sudo privesc taught | match (no pedagogy mismatch) |
| Attacker account | n/a | `kali` `super_user:true` (attacker console) | match |
| Rebase | n/a | KEEP — bespoke VM already matches CyBOK + story | n/a |

No new mismatch, no missing value. Per-build strings unchanged.

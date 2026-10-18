# m06 Follow the Money — SecGen/VM consistency matrix

Value-by-value cross-layer table. Layers: story (ink), Break Escape scenario
(`scenario.json.erb` / `mission.json`), SecGen VM
(`SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml`).
Values generated at build time are marked *(per-build)* — legitimately absent from source.

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|-------|-------------|----------------------|-----------|--------|
| SecGen scenario id | n/a | `secgen_scenario` was `m06_follow_the_money`, now `break_escape/safetynet/m06_follow_the_money.xml` | XML lives at `break_escape/safetynet/m06_follow_the_money.xml` | **fixed** (was mismatch) |
| Target host system_name | n/a (generic "backend") | `hackme_crack_me_lab` (vm_flags_json / flags_for_vm / acceptsVms / targetFlags) | `<system_name>hackme_crack_me_lab</system_name>` | match |
| Console host system_name | n/a | `vm_object('kali_cracker', …)` first arg | `<system_name>kali_cracker</system_name>` | match |
| Console fallback title | n/a | was `kali`, now `kali_cracker` | VM title = system_name = `kali_cracker` | **fixed** |
| Console fallback IP | n/a | was `192.168.100.86`, now `172.16.0.3` | kali on `172.16.0.3` (IP_addresses[1]) | **fixed** (was wrong network) |
| Target IP | n/a | — (resolved at build) | `172.16.0.2` (IP_addresses[0]) | match (game does not hardcode) |
| Flag count / order | n/a | 4 flags, flag1..flag4 | 4 `flag_generator` nodes, document order | match |
| flag_1 owner / meaning | "first account", generic | submit_flag1 → flag1_submitted; credential_reuse_available | `hcauth` home `flag` (0600), weak reused pw | match |
| flag_2 owner / meaning | "reuse it on other accounts" | submit_flag2 → flag2_submitted | `hcledger` home `flag` (0600), SAME weak pw as hcauth | match |
| flag_3 owner / meaning | "financial database", "runs the doors" | submit_flag3 → give Door Controller Export | `hcfindb` home `flag` + `transaction_records/README`, weak pw | match |
| flag_4 owner / meaning | "full estate", "vault holds wallet keys" | submit_flag4 → give Cold Storage Recovery Keys, found_wallet_keys | `hcvault` home `cold_storage/full_access_flag`, framed as hcops-via-sudo priv-esc | match (see priv-esc note, doc 01) |
| Accounts | generic ("the other accounts") | not hardcoded | `hcops` (sudoer, pw literal `password`), `hcauth`, `hcledger`, `hcfindb`, `hcvault` | match (ink stays generic) |
| sudoer / priv-esc | "when you need administrator rights" (HaX) | privesc guide offered after flag1 | `hcops` `super_user: true` → `hcops ALL=(ALL) ALL` (full sudo) | match |
| Foothold | "readable shadow → logins" (HaX) | distcc guide offered | `distcc_exec` RCE + `readable_shadow` | match |
| Wordlist (crack) | "John the Ripper's default list is enough" | in-game "Volkova's wordlist" (flavour item) | passwords drawn from `jtrpassword.lst` (Openwall/JtR default; contains `password`) | match (rockyou in guide is a superset) |
| targetFlags form | n/a | `flag_station_financial:hackme_crack_me_lab-flagN` (station display form) | reference form `hackme_crack_me_lab:flag_N` | match — game uses display form (correct) |
| Flag values | n/a | fallback `flag{…}` placeholders | *(per-build)* flag_generator | match (per-build) |
| hcops password | n/a | not hardcoded | literal `password` (in jtrpassword.lst) | present (see note) |
| Crackable passwords | n/a | not hardcoded | *(per-build)* from `jtrpassword.lst` ×3 | *(per-build)* |

---

## Round 2 update (2026-10-18)

Changed rows (SecGen is canonical; game aligned):

| Value | Story (ink) | Break Escape scenario | SecGen VM | Status |
|-------|-------------|----------------------|-----------|--------|
| flag_4 route | "whole estate" / "last flag" (generic); HaX privesc hint now points at sudo | submit_flag4 → Cold Storage Recovery Keys, found_wallet_keys | `hcvault` `cold_storage/full_access_flag` (0600), reachable **only** via `hcops` sudo | match — escalation now required |
| hcvault password | n/a | not hardcoded | **strong_password_generator** (was `weak_passwords[2]`) | changed — not crackable |
| weak_passwords count | n/a | n/a | **2** generators (was 3; `[2]` removed, it was only hcvault's) | changed |
| privesc HaX hint | sudo route ("vault won't crack… sudo -l") | `request_privesc_guide` ink | sudo via hcops `ALL=(ALL) ALL` | match (was: described reuse) |

All other rows from the round-1 table are unchanged and still match.

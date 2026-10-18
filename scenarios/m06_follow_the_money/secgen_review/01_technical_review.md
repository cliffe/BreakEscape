# m06 Follow the Money — SecGen/VM integration review

Cross-layer consistency review of the SAFETYNET mission m06 against its canonical
SecGen VM. Baseline is m01_first_contact (known-good). Reasoned statically from
source; no VM was built or booted.

- Game: `scenarios/m06_follow_the_money/` (mission.json, scenario.json.erb, ink)
- Canonical VM: `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml`
- No in-mission `secgen/` copy exists — nothing to reconcile on that axis.
- Field guides: `HacktivityLabSheets/_labs/safetynet/` (shared across all eight missions)

## Verdict

The mission is well wired and solvable. The engine couplings that usually break
these missions (flag key, flag-station display form, flag→global bridging,
concludeRequires gate) are all correct here. Two drift findings were fixed; one
pedagogy point is left for the author. See `03_edits_applied.md` for the changelog.

## The VM, in brief

`hackme_crack_me_lab` (172.16.0.2, Debian 9 KDE) is the flag-bearing backend;
`kali_cracker` (172.16.0.3, Kali) is the operative console. Intended chain:
`distcc_exec` RCE foothold → `readable_shadow` exposes hashes → offline-crack the
weak service passwords → `hcauth` (flag_1) → reuse the same password on `hcledger`
(flag_2) → `hcfindb` financial DB (flag_3) → full estate via `hcops` sudo reading
`hcvault`'s home (flag_4). All five accounts' hashes are exposed through the
world-readable shadow, and the crackable passwords are drawn from `jtrpassword.lst`
(Openwall's list, i.e. JtR's classic default; it contains `password`, which is
`hcops`'s literal password), so every flag is reachable. All referenced module
paths resolve under `SecGen/modules/`.

## Findings

### F1 — `secgen_scenario` was a bare name, not the XML path (fixed)
`mission.json` had `"secgen_scenario": "m06_follow_the_money"`. Hacktivity validates
this against `SecGenBatch::SCENARIOS` = `Dir["**/*.xml"]` under SecGen's `scenarios/`
dir, so the only valid value is the XML path relative to that dir:
`break_escape/safetynet/m06_follow_the_money.xml`. The bare name is not in the set,
fails the inclusion validation, and binds no VM — `requires_vms?` is true but a
real-VM player gets nothing. Set to the path. (Confirmed fact per the brief; same
shape as m01's value.)

### F2 — console fallback object on the wrong network (fixed)
`scenario.json.erb:1941` `vm_object('kali_cracker', {… "title":"kali","ip":"192.168.100.86" …})`.
The first arg (`kali_cracker`) correctly equals the SecGen `system_name`/VM title,
so Hacktivity resolves the real VM. The fallback (standalone/dev) object, though,
had `ip` `192.168.100.86` — a different network from the VMs (172.16.0.0/24) — and
`title` `kali` instead of the VM title `kali_cracker`. Per the skill, the fallback's
own title/ip should match the VM on the same local network as the target. Set
`ip` → `172.16.0.3` (kali, IP_addresses[1]) and `title` → `kali_cracker`. m01 uses
the matching pattern (`vm_object('kali', {"title":"kali","ip":"172.16.0.3"…})`).

### Engine wiring — all correct, no change
- **Flag key.** `vm_flags_json('hackme_crack_me_lab', …)`, `flags_for_vm('hackme_crack_me_lab', …)`
  and `acceptsVms: ["hackme_crack_me_lab"]` all use the target `system_name`. Correct.
- **targetFlags form.** Every `submit_flags` task uses
  `flag_station_financial:hackme_crack_me_lab-flagN` — the station-scoped DISPLAY
  form `<station-id>:<vm>-flagN`, which the matcher in `game.rb`
  `process_flag_task_completions!` accepts. (Not the never-matching reference form
  `<vm>:flag_N`.) Matches m01. Correct.
- **flag→global bridges.** `flag1_submitted`..`flag4_submitted` are set twice over,
  belt-and-braces: by the flag-station `flagRewards` `set_global` entries and by the
  `agent_0x99_handler` `objective_task_completed:submit_flagN → setGlobal` mappings
  (scenario.json.erb ~1109–1133). flag_3 and flag_4 additionally `give_item`
  (Door Controller Export, Cold Storage Recovery Keys) and flag_4 sets
  `found_wallet_keys`. No gate relies on a raw flag event or on the hard-bridged
  `sudo_flag_submitted`. Correct.
- **console lookup is separate from flags.** The `vm-launcher` attaches the terminal
  to `kali_cracker`; the flag-station consumes `hackme_crack_me_lab` flags. Correct
  split, documented in the mission's `VM_INTEGRATION.md`.

## Solvability
- **VM cannot be skipped.** The `map_financial_network` aim carries
  `concludeRequires.tasksCompleted = [submit_flag1..submit_flag4]`, so the ending
  gate is all four flags. The VM is mandatory.
- **Every consumed flag exists**, owned by the right account, at the path the game
  implies; flag strings are per-build.
- **Cracking succeeds.** Weak passwords come from `jtrpassword.lst`; the field guide
  points at `rockyou.txt` (a superset) and the ink says JtR's default list is enough.
  Both crack the shipped passwords. No in-game text leaks a per-build secret.
- **flag_2 reuse is real.** `hcledger` shares `weak_passwords[0]` with `hcauth`, and
  its home carries a `reuse_note` spelling out the credential-reuse policy exception.

## Priv-esc pedagogy note (for the author — not changed)
flag_4 is framed as the privilege-escalation reward: HaX offers the privesc guide
after flag_1, the objective is "Take the whole estate", and the XML comment says the
flag "is intended to be reached by hcops via sudo". But `hcvault` is itself given a
weak, crackable password (`weak_passwords[2]`), and its flag sits in its own home, so
a player can crack `hcvault` directly and read flag_4 without ever escalating. The
sudo path (`hcops ALL=(ALL) ALL`) exists and works, but it is one option, not a
requirement. The author deliberately chose this (there is an explicit XML comment),
so this review does not override it. If the intent is that flag_4 *requires*
escalation, give `hcvault` a `strong_password_generator` password so the only route
to its 0600 flag is `hcops` sudo. Left as an author decision (see doc 03).

---

## Round 2 (2026-10-18)

### Round-1 confirmation — all held
- `mission.json` `secgen_scenario` = `break_escape/safetynet/m06_follow_the_money.xml` (correct path). ✓
- `vm_object('kali_cracker', …)` opens the **attacker/Kali** console (not the target); fallback `title`/`ip` = `kali_cracker` / `172.16.0.3` (same 172.16.0.0/24 as the target). ✓
- Flag host key `hackme_crack_me_lab` on `vm_flags_json` / `flags_for_vm` / `acceptsVms`. ✓
- `targetFlags` all station display form `flag_station_financial:hackme_crack_me_lab-flagN`. ✓
- flag→global bridges (`flag1..4_submitted` via station `flagRewards` set_global + `objective_task_completed` setGlobal) and `concludeRequires = [submit_flag1..4]` all intact. ✓

### Rebase decision — KEEP (deepened)
The current VM is a strong fit and was kept. Its kill chain (distcc RCE foothold → world-readable shadow → offline crack → credential reuse → sudo privilege escalation) is a richer, five-stage chain that maps cleanly onto the mission's `mission.json` CyBOK (MAT exploitation, AAA authentication + authorisation, SOIM penetration testing) and onto the "crack your way onto the backend and follow the money" story. No catalogue scenario in `SECGEN_ADAPTABLE_CATALOGUE.md` improves on this, and the round-1 brief sets a high bar defaulting to keep. Kept and deepened with the escalation pedagogy fix below.

### Pedagogy fix applied — flag_4 now genuinely requires escalation
Round 1 flagged (left for the author) that `hcvault` had its own weak crackable password, so flag_4 — framed as the privilege-escalation reward reached by `hcops` via sudo — could be read by cracking `hcvault` directly, making the escalation optional. Per the Round 2 brief (user: fix with best judgement), applied the smallest change that makes the lesson true: `hcvault`'s password is now a `strong_password_generator` value (not drawn from `weak_passwords`), and the now-unused `weak_passwords[2]` generator was removed. The flag in `hcvault`'s `cold_storage/full_access_flag` is mode `0600`, so the only route is `hcops` (weak password `password`, in `jtrpassword.lst`) → `sudo` to read it. `hcops` has `super_user: true` = `hcops ALL=(ALL) ALL`, so `sudo -u hcvault cat …` / `sudo cat …` works. The escalation is now mandatory and tractable.

This also resolves the long-standing S5 ambiguity logged in `DECISIONS_PENDING.md`/`IMPROVEMENT_LOOP_LOG.md` ("does the route need sudo?") in favour of the shared **Privilege Escalation via Sudo** field guide: the route now definitely needs sudo, and the guide (`sudo -l`, `sudo -u [user] cat /home/[user]/…`) teaches exactly this path.

The mission's "Privilege escalation" HaX hint (`ink/m06_phone_agent_0x99.ink` `request_privesc_guide`) previously described credential reuse ("two boxes share a service account… try the password you already have") — that is lateral movement (flag_2), already covered by the cracking-guide hint, and following it would no longer reach flag_4. Repointed it to the sudo route ("The vault won't crack. One of the other accounts can run sudo… Start with sudo -l").

Lateral-movement cracking (hcauth/hcledger/hcfindb) is unchanged and still solvable; only the vault is now escalation-only.

# SecGen draft notes: m09 and m10

Drafted from `FINALE_VM_PLAN.md` and the orchestrator rulings in `scenarios/FINALE_DEV_LOG.md`. Nothing has been built, tested or committed. Structure only: module names, accounts and positions.

## Files written

- `SecGen/scenarios/break_escape/safetynet/m09_digital_archaeology.xml`: three systems (attack box, `catalogue_server`, `tomb_beta_server`), four flags.
- `SecGen/scenarios/break_escape/safetynet/m10_full_disclosure.xml`: four systems (attack box, `bunker_monitor`, `release_host`, `core_host`), four flags.

## Where each flag sits

**m09**

| # | System | Module | Placement | Account | Text with it |
|---|---|---|---|---|---|
| 1 | `catalogue_server` | `apache_druid_rce` | file `catalogue_index` in the service account's home | `druid` (module default, not set in XML) | none |
| 2 | `catalogue_server` | `sudo_root_more` | file `insider_ledger` in root's home | root | none |
| 3 | `tomb_beta_server` | `nostromo_code_exec` | file `enrolment_record` in the web service account's home | `nostromousr` (hard-coded in the module) | staff credential issued to Tesseract, with the flag below it |
| 4 | `tomb_beta_server` | `sudo_root_less` | file `mirror_job_and_defences` in root's home | root | the mirror job to Tomb Gamma, the 06:00 UTC hour, the 04:00 head start, the fallback, the defences list |

Tesseract's memo (`albion_memo`) and his unsent vendor notice (`vendor_notice_draft`) sit in the web service account's home, beside flag 3's file, with no flag.

**m10**

| # | System | Module | Placement | Account | Text with it |
|---|---|---|---|---|---|
| 1 | `bunker_monitor` | `maltrail_rce` | file `monitor_status` in the platform account's home | `maltrail` (set in XML) | none |
| 2 | `bunker_monitor` | `maltrail_data` | embedded in the threat-data record, one line | none | the staging copy of the schedule: channels, cells' early-access orders, first entries by city |
| 3 | `release_host` | `nc_backdoor_docker_esc` | file `docker_flag` in root's home, after leaving the container | root | none |
| 4 | `core_host` | `nc_backdoor_chroot_esc` | file `chroot_flag` in root's home, after leaving the jail | root | none |

## Changes from the source scenarios

- Nosferatu: pre-login flags removed (`strings_to_pre_leak` set empty). The encoded message is gone, so the `cyberchef` utility is dropped from the attack box.
- Eventful Data: attack box dropped (the m09 attack box serves both targets).
- Off the Trail: the privilege-escalation block removed (`writable_passwd`, `writable_shadow`), so the entry box carries two flags. The `maltrail_flag` datastore is removed because nothing reads it now.
- Container Escape: root login over SSH removed from both `release_host` and `core_host`, and the `hackerbot_access_root_password` datastore with it. The third generated account on `release_host` is removed, leaving two. The stray `strings_to_leak` input on `parameterised_accounts` is removed because that module reads only `accounts`.
- All systems renamed. The attack box's IP list follows the m08 pattern.

## Not verified without a build

- Whether an empty `<value></value>` for `strings_to_pre_leak` overrides the `nostromo_code_exec` default. If it does not, the public page shows a generated message before login.
- Whether the concatenate encoder's `::` delimiter reaches the encoder intact, and whether the Maltrail parser keeps the whole schedule line as `trail_info` when it contains spaces.
- Whether `maltrail` is accepted as the platform account name.
- Whether flag 2 is readable before flag 1. The threat data is in the web UI, and the UI may not need a login.
- Whether the random service ports can be found by a scan (module review R4c).
- Whether the Druid module's default account is `druid`. The XML does not fix it.

## Story text not written into the scenarios

- Flag 1 (`catalogue_index`) and flag 2 (`insider_ledger`) carry the flag only. The index text and the ledger (23 placements, 47 candidates, WREN's day-10 entry) are not seeded. This is outside the M3 and M4 rulings.
- City and order choices in the m10 schedule, which the user must confirm:
  - Seattle is first, as the finale docs give it. Austin is my choice for second.
  - Zero Day's order is filed under the Sterling name. The story allows Sterling or Vos, and the file is static.
  - Only Seattle is named in the finale docs. The other two cities are placeholders.
- No `lab_sheet_url`. Add one when the Hacktivity sheet exists.

## What to check when building

1. Build time: four targets plus the attack box is the largest SAFETYNET build so far.
2. Root login over SSH is refused on `release_host` and `core_host`.
3. `release_host` has two accounts, and the names match the account list the game shows.
4. The `tomb_beta_server` public page shows no generated text before login.
5. The `bunker_monitor` threat-data page shows the schedule line and flag 2 on one row.
6. Confirm the account names: `druid`, `nostromousr`, `maltrail`.
7. Flag 2 on `bunker_monitor` is not visible before the flag 1 foothold.
8. Each target's random port is found by the scan the lab sheet describes.
9. Each file's leaked text reads correctly as the player finds it.
10. The climax (`release_host`, `core_host`) is not gated by SecGen. Flags 1 and 2 gate it only in the game.

## F12/F13 gating changes (2026-10-22, not yet applied to the XML)

From the F12/F13 ruling (`scenarios/FINALE_DEV_LOG.md:487-490`) and `scenarios/VM_GATING_AUDIT.md`. As currently drafted, every flag in both missions is reachable cold (the footholds are unauthenticated RCE, the rest are privilege steps), and the m10 disarm and unsent notice are not on the VM. The XML edits below make an in-game find required to read each foothold flag, and seed the two m10 artefacts. SecGen is on hold, so these are specified, not applied.

**Mechanism.** For each foothold flag, add a dedicated account with a **fixed password** set to a literal the game will also hand the player in-game (as m02's `gary` uses `Hospital1987`, `m02_ransomed_trust.xml:141-149`). Place the flag and its story file in that account's home at mode `0600`. Keep the existing exploit module as the foothold, but it must land in a context that **cannot** read the `0600` flag home, so reading the flag requires the in-game login. The deeper (root) flags stay as the drafted sudo/escape steps — transitively gated once the foothold needs a found credential.

**m09** (login strings chosen 2026-10-22, now in the m09 ERB Codes block — the build must seed these exact values)
- `catalogue_server`: catalogue service account **`catalogsvc`**, fixed password **`Catalog!Helena2016`**; flag 1 + catalogue-index text in its `0600` home. Seed the index body (Series R, R-114–R-161, bay 10) to match the drop screen. Flag 2 unchanged; seed the ledger body + `HL2015-0477` in root's home only.
- `tomb_beta_server`: keep the module's hard-coded web service account **`nostromousr`** and set its login password to **`TombBeta!Enrol16`** (the literal the player reads on the salvage-cage enrolment binder in-game); flag 3 + credential + memo + notice in its `0600` home. `strings_to_pre_leak` stays empty. Flag 4 unchanged.

**m10** (login strings chosen 2026-10-22, now in the m10 ERB Codes block — the build must seed these exact values)
- `bunker_monitor`: add a **separate** monitoring login account **`secmon`**, password **`Bunker!Monitor59`** (forward-post gate console in-game); flag 1 in `secmon`'s `0600` home. **Do not put flag 1 in the `maltrail` account** — the `maltrail_rce` foothold lands as `maltrail` with `user_rwx`, so a flag in maltrail's own home is readable cold. Keep `maltrail` unable to read `secmon`'s home. Flag 2 unchanged; seed the schedule record (channels, cities, early-access orders).
- `release_host`: operative account **`vos`**, password **`Release!Shift25`** (server-hall duty card in-game). The container bind shell must be reachable **only after logging in as `vos`** (bind to loopback / behind the operative login), so host root is not a cold escape. **Add a `release_control` file in root's home** beside flag 3 (F13) — the release service's kill/arming configuration (how the 06:00 release is armed and what would stop it). Renamed from "disarm" per puzzle-chains R3: the disarm *action* stays at the core console in-game, so the release host holds the control config, not the disarm itself.
- `bunker_monitor` flag 2: the threat-data store holding flag 2 and the schedule must sit **behind the `secmon` login**, not on a public/pre-login page, so flag 2 is gated by flag 1's find (resolves the open "readable before flag 1?" item above).
- `core_host`: the escape onto host root requires the core access key **`TSRCT-CORE-9F21`** (gallery access-key envelope in-game); gate the chroot bind shell on that key (bind to loopback), so host root is not cold. **Add `vendor_notice` (Tesseract's unsent notice) in root's home** beside flag 4 (F13), plus the stolen-copy / Citadel-vault line.
- Removing root login over SSH on both climax boxes (already a build note) is part of this: otherwise it is a cold route to flags 3 and 4.

**Open for the user / build:** whether to keep the unauth RCE as foothold-only with a `0600` flag home, or replace the foothold with a straight credentialed SSH login (simpler, but drops the RCE teaching). The audit recommends foothold-plus-credential to keep both the exploit and the gate.

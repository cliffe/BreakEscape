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

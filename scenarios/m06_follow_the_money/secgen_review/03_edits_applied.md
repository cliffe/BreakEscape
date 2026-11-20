# m06 Follow the Money — edits applied, verification, open items

## Changes (file:line, repo, from → to)

| # | File:line | Repo | From → To | Resolves |
|---|-----------|------|-----------|----------|
| 1 | `scenarios/m06_follow_the_money/mission.json:5` | BreakEscape | `secgen_scenario`: `"m06_follow_the_money"` → `"break_escape/safetynet/m06_follow_the_money.xml"` | F1 (no VM bound in Hacktivity) |
| 2 | `scenarios/m06_follow_the_money/scenario.json.erb:1941` | BreakEscape | `vm_object` fallback `"title":"kali","ip":"192.168.100.86"` → `"title":"kali_cracker","ip":"172.16.0.3"` | F2 (fallback on wrong network / wrong title) |

No SecGen XML edit was needed (values already consistent; all module paths resolve).
No ink changed, so no recompile.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb`
  — completes; ERB re-renders to valid JSON; dungeon graph regenerated (critical path
  5 hops, unchanged). Only pre-existing suggestions/warnings remain (moral_conflict_revealed
  unused, credits fallback lines, two lobby NPCs without behavior) — none related to
  these edits.
- Grep: `192.168.100.86` and bare `"m06_follow_the_money"` gone from the two files;
  `break_escape/safetynet/m06_follow_the_money.xml` and `kali_cracker…172.16.0.3`
  present.
- SecGen module paths referenced by the XML all resolve under `SecGen/modules/`
  (`distcc_exec`, `readable_shadow`, `ssh_root_login`, `parameterised_accounts`,
  `kde_minimal`, `handy_cli_tools`, `hash_tools`, `kali_pwtools`, `metasploit_framework`,
  `nmap`, `account`, `concatenate` encoder). Static check only; no build.
- Consistency matrix (doc 02) re-run against the edited files: no remaining mismatch;
  critical path solvable end to end (all four flags reachable, concludeRequires holds).

## Open / needs author decision

1. **flag_4 priv-esc is optional, not required (pedagogy).** `hcvault` has a weak
   crackable password, so flag_4 can be read by cracking `hcvault` directly, bypassing
   the `hcops`-sudo escalation the mission frames as the point. Deliberate (XML comment),
   so not changed. If escalation should be mandatory, set `hcvault`'s password to a
   `strong_password_generator` in the canonical XML. (Author call.)

## Shared-file changes for the orchestrator

None required. The field guides touched by m06 (offline-password-cracking,
privilege-escalation, distcc-exploitation) are shared across all eight missions and
stay generic; they do not assert m06-specific VM values and need no change. The
`jtrpassword.lst` wordlist and the SecGen modules are shared and were only read, not
edited.

## Not done / out of scope
- No VM build/boot or solve (static review only).
- No commit/stash/checkout (orchestrator commits per repo, per mission).

---

## Round 2 (2026-10-18)

### Changes (file:line, repo, from → to)

| # | File | Repo | From → To | Resolves |
|---|------|------|-----------|----------|
| R2-1 | `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml` (hcvault account) | **SecGen** | `hcvault` password `<datastore access="2">weak_passwords</datastore>` → `<generator type="strong_password_generator"/>` | flag_4 escalation now required (round-1 open item 1) |
| R2-2 | same XML (`weak_passwords` datastore + comment) | **SecGen** | removed the unused 3rd `custom_list_password` generator (`weak_passwords[2]`, only hcvault used it); updated the datastore comment and the hcvault comment | keep XML honest after R2-1 |
| R2-3 | `scenarios/m06_follow_the_money/ink/m06_phone_agent_0x99.ink` (`request_privesc_guide`) | BreakEscape | privesc hint "two boxes share a service account… try the password you already have" (credential reuse) → sudo route "The vault won't crack. One of the other accounts can run sudo… Start with sudo -l" | hint now matches flag_4's required sudo path |

**SecGen repo edit** (R2-1, R2-2): the canonical XML changed — commit it in the SecGen repo. No in-mission `secgen/` copy exists, so nothing to sync there.
Ink changed (R2-3): recompiled, committed `.json` alongside.

### Verification (Round 2)
- `./scripts/compile-ink.sh m06_follow_the_money` — 9 compiled, 0 failed.
- `ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb` — Schema validation passed; JSON/ink valid; critical path unchanged (5 hops, `concludeRequires` = all four flags). The 21 objective-wiring warnings are pre-existing onceOnly-handler notices on `agent_0x99_handler`, unrelated to these edits.
- SecGen XML: `strong_password_generator` is an existing generator type (already used for `desktop_root_password` and `spoiler_admin_pass`); no new module path introduced. All referenced module paths still resolve under `SecGen/modules/`. Static check only; no build.
- Solvability re-traced: hcauth/hcledger/hcfindb still crack+reuse as before; hcvault flag now reachable only via hcops (`password`, in `jtrpassword.lst`) + sudo. hcops hash is in the world-readable shadow, so the escalation is tractable.

### Round-1 open item — now closed
Round-1 open item 1 (flag_4 priv-esc optional) is resolved by R2-1/R2-2/R2-3 above.

### Needs an author VM build to confirm (static review only)
- Confirm `strong_password_generator` yields a password NOT in `jtrpassword.lst`/`rockyou.txt` (it is a long random string, so effectively uncrackable — build-time property).
- Confirm `hcops`'s `super_user: true` renders as `hcops ALL=(ALL) ALL` on the built Debian 9 box so `sudo` reads hcvault's 0600 flag (brief confirms this is the render; a build verifies the live box).

### Shared-file changes for the orchestrator
None required. The shared **Privilege Escalation via Sudo** guide (`HacktivityLabSheets/_labs/safetynet/privilege-escalation.md`) already teaches `sudo -l` and `sudo -u [user] cat /home/[user]/…`, which is exactly the now-required route — it was read, not edited, and needs no change for m06. Other m06 field guides (offline-password-cracking, distcc-exploitation) stay generic and need no change.

---

## distcc → Druid foothold swap (2026-10-18)

Per `docs/agents/SECGEN_MODULE_PLAN.md` (de-duplicate distcc: keep it in m03 only). m06's
entry-point RCE was swapped from `distcc_exec` (CVE-2004-2687) to `apache_druid_rce`
(CVE-2021-25646, `user_rwx`), modelling the HashChain financial backend's real-time analytics
database. **Only the foothold changed** — `readable_shadow`, the hcauth/hcledger/hcfindb
accounts, hcvault's strong-password fix, and the hcops sudo escalation to flag_4 are all
unchanged, as is the four-flag count/order (the Druid block carries no `flag_generator`).

Changes:
- **SecGen XML** `scenarios/break_escape/safetynet/m06_follow_the_money.xml`: `distcc_exec`
  vulnerability block → `apache_druid_rce` (same leak interface: `strings_to_leak` foothold note
  + `leaked_filenames` → `druid_foothold_note`; port defaults to `random_unregistered_port`,
  mirroring `scenarios/ctf/eventful_data.xml`). Updated `<description>` (foothold is now Druid)
  and `<lab_sheet_url>` → `.../labs/safetynet/apache-druid-rce/`.
- **Game** `scenario.json.erb`: field-guide item repointed (id `m06_distcc_field_guide` →
  `m06_druid_field_guide`, name → "Apache Druid RCE", labUrl → `apache-druid-rce`, observations);
  globals `distcc_guide_offered`/`distcc_guide_hint_given` → `druid_guide_*`; VM-launcher hook
  setGlobal + HaX timed message reworded (build service → data-analytics service).
- **Ink** `m06_phone_agent_0x99.ink` (+ recompiled json): VARs, hub choice, `request_distcc_guide`
  knot → `request_druid_guide`, give_item/set_variable tags, and the recon-hint line reworded.
- **Docs** README.md, VM_INTEGRATION.md, CYBOK_MAPPING.md, TESTING_WALKTHROUGH.md reworded;
  dungeon_graph regenerated by the validator.
- **New field guide** `HacktivityLabSheets/_labs/safetynet/apache-druid-rce.md` (shared
  distcc-exploitation.md left untouched; m03 still uses it).

Needs an author VM build to confirm: Druid provisions on the Debian 9 base and lands a shell as
an unprivileged service account that can read the world-readable shadow file (eventful_data runs
it on Debian 12 — the Bookworm-tested evidence; the Debian 9 base is unverified here).

### Debian 12 base (2026-10-18)
m06's backend base moved Debian 9 → Debian 12 in the canonical SecGen XML, matching the live
Druid scenario (Eventful Data runs `apache_druid_rce` on Debian 12). This resolves the earlier
"Druid on Debian 9 unverified" caveat. Account hashes are SHA-512 via `parameterised_accounts`
regardless of distro, so the offline-cracking lesson is unchanged. (Still needs an author build
to confirm end to end, like every mission here.)

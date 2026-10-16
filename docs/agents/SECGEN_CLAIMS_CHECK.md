# SecGen claims check: missions 5 to 8

Fact check of the game text against the SecGen scenario XML and module metadata. No exploit detail is recorded here.

Source key:
- SG = `/home/cliffe/Files/Projects/Code/SecGen/`
- BE = `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/`
- HL = `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/`

SecGen files checked:
- m05: `SG/scenarios/break_escape/safetynet/m05_insider_trading.xml` (game: `BE/scenarios/m05_insider_trading/scenario.json.erb`, header and flags at line 1689)
- m06: `SG/scenarios/break_escape/safetynet/m06_follow_the_money.xml` (game: `BE/scenarios/m06_follow_the_money/scenario.json.erb`)
- m07: `SG/scenarios/break_escape/safetynet/m07_architects_gambit.xml` (game: `BE/scenarios/m07_architects_gambit/scenario.json.erb`)
- m08: `SG/scenarios/break_escape/safetynet/m08_the_mole.xml` (game: `BE/scenarios/m08_the_mole/scenario.json.erb`)

Each `mission.json` names its SecGen scenario in `secgen_scenario`, and each value matches the file above. Flag order was taken from the XML document order and the comments in the XML. No build was run, so "flag order" here means the order the XML declares, not what a live VM produces.

## Mission 5: Insider Trading

| claim | SecGen says | match? | source file:line |
|---|---|---|---|
| Scenario named by mission.json | `m05_insider_trading` | yes | `BE/scenarios/m05_insider_trading/mission.json:5` |
| Flag 3 manifest names Torres | Manifest reads "Staged by: D. Torres (Cryptography Lead)" | yes | `SG/.../m05_insider_trading.xml:201-203` |
| Flag 3 shows only a badge number (#4471) | No badge number in the m05 XML. SC-4471 appears only in the m02 XML. The D1 change (show the badge, not the name) has not been made in SecGen. | no | `SG/.../m05_insider_trading.xml:201-230`; `SG/.../m02_ransomed_trust.xml:321,329`; `BE/scenarios/m05_insider_trading/DECISIONS_PENDING.md` (D1) |
| Flag 1 = admin login in a handover note on a research portal | Handover note on the Bludit portal (`qdc_research_server`) gives the manager account's login. Pre-leak flag. | yes | `SG/.../m05_insider_trading.xml:148-164` |
| Flag 2 = authenticated image upload in Bludit | `bludit_upload_images_exec` module, commented as "authenticated image-upload RCE" | yes | `SG/.../m05_insider_trading.xml:148,168` |
| Flag 3 = staging manifest in a user's home directory | Manifest is written by `parameterised_accounts` for the manager account, with leaked filename `flag`. The module's file path is `C:/Users/$username/Desktop`, a Windows-style path. No Linux home path was found in the module. | unclear | `SG/.../m05_insider_trading.xml:195-231`; `SG/modules/utilities/windows/system/parameterised_accounts/manifests/account.pp:42-46` |
| Flag 4 = root via a sudo rule | `sudo_root_less`: passwordless root rule for one listed tool, applied to all users. Module name says "setuid", but the config is a sudo rule. | yes | `SG/.../m05_insider_trading.xml:239-241`; `SG/modules/vulnerabilities/unix/access_control_misconfigurations/sudo_root_less/manifests/config.pp:14-20` |
| Other hosts or services | Two systems: `attack_vm` (Kali) and `qdc_research_server` (Debian 12, KDE). No other services. | yes | `SG/.../m05_insider_trading.xml:81-124` |
| Kali IP is 172.16.0.3 | XML sets no fixed IP for `attack_vm`; it uses `network_ip`. The literal addresses appear only in the description text. | unclear | `SG/.../m05_insider_trading.xml:85-90,16,22` |
| Four flags in order | Document order: recon pre-leak, then Bludit RCE, then manifest, then root. The game's flag list has these four in this order. | yes | `SG/.../m05_insider_trading.xml:148-292`; `BE/scenarios/m05_insider_trading/scenario.json.erb:1689` |
| Exactly four flags (the XML says "four primary flags") | `sudo_root_less` also has a `strings_to_pre_leak` flag generator (line 290) that is not in the game's flag list. Together with the bonus archive flag, the server has six flag generators. The comment says the bonus is "declared after the four primary flags", but the extra pre-leak flag sits before it. | no | `SG/.../m05_insider_trading.xml:289-291,294-315`; `BE/scenarios/m05_insider_trading/scenario.json.erb:1689` |
| Other hosts/services list | Only the two systems above | yes | `SG/.../m05_insider_trading.xml:81-124` |

Field guides referenced by m05:
- `SG/.../m05_insider_trading.xml:37` (lab sheet URL): bludit-cms-exploitation
- `BE/scenarios/m05_insider_trading/scenario.json.erb:833,841,849,893`: bludit-cms-exploitation, lockpicking, reconnaissance-and-network-mapping, rfid-cloning
- `BE/scenarios/m05_insider_trading/scenario.json.erb:912`: privilege-escalation (excluded from this check; not opened)

Titles (`title:` lines only):
- `HL/_labs/safetynet/bludit-cms-exploitation.md`: `SAFETYNET Field Guide: Bludit CMS Exploitation`
- `HL/_labs/safetynet/lockpicking.md`: `SAFETYNET Field Guide: Lockpicking`
- `HL/_labs/safetynet/reconnaissance-and-network-mapping.md`: `SAFETYNET Field Guide - Reconnaissance and Network Mapping`
- `HL/_labs/safetynet/rfid-cloning.md`: `SAFETYNET Field Guide - RFID Cloning`

## Mission 6: Follow the Money

| claim | SecGen says | match? | source file:line |
|---|---|---|---|
| Scenario named by mission.json | `m06_follow_the_money` | yes | `BE/scenarios/m06_follow_the_money/mission.json:5` |
| Backend entry is a build service holding no flag | `distcc_exec` foothold, commented as deliberately carrying no flag generator | yes | `SG/.../m06_follow_the_money.xml:266-280` |
| Flag 1 = password cracked offline from a readable shadow file | `hcauth` takes a password from the shared list. A `readable_shadow` module makes the hash file readable. Flag at line 159. | yes | `SG/.../m06_follow_the_money.xml:144-161,282-283` |
| Flag 2 = same password reused on a second account | `hcledger` uses the same `weak_passwords[0]` as `hcauth`. Flag at line 187. | yes | `SG/.../m06_follow_the_money.xml:150,169,187` |
| Flag 3 = financial database account | `hcfindb`, transaction ledger text, flag at line 216 | yes | `SG/.../m06_follow_the_money.xml:191-218` |
| Flag 4 = vault account | `hcvault`, flag at line 236 | yes | `SG/.../m06_follow_the_money.xml:220-238` |
| Root via sudo | `hcops` is `super_user` true (line 139), and the XML comment says its flag route is "via sudo". `parameterised_accounts` maps `super_user` to the groups `Users` and `Administrators`, which are Windows group names. No sudo rule is declared in the XML. | unclear | `SG/.../m06_follow_the_money.xml:131,139,220-236`; `SG/modules/utilities/windows/system/parameterised_accounts/manifests/account.pp:11-14` |
| Flag order | Document order, flag_1 to flag_4. The game's flag list matches. | yes | `SG/.../m06_follow_the_money.xml:123-128`; `BE/scenarios/m06_follow_the_money/scenario.json.erb:82,354-388,1846` |
| Naming: the description says the flags are `hackme_crack_me_lab:flag_1..4` | The game's `targetFlags` use `hackme_crack_me_lab-flag1` to `-flag4`. The system name is the same. | no (notation only) | `SG/.../m06_follow_the_money.xml:35-38`; `BE/scenarios/m06_follow_the_money/scenario.json.erb:354-388` |

## Mission 7: The Architect's Gambit

| claim | SecGen says | match? | source file:line |
|---|---|---|---|
| Scenario named by mission.json | `m07_architects_gambit` | yes | `BE/scenarios/m07_architects_gambit/mission.json:5` |
| Flag 1 = NFS export | `nfs_overshare` module exports a share | yes | `SG/.../m07_architects_gambit.xml:124-130`; `SG/modules/vulnerabilities/unix/nfs/nfs_overshare/manifests/config.pp:15-33` |
| Flag 2 = listener on a non-standard port | `nc_message` listens on a random port between 1024 and 2024 | yes | `SG/.../m07_architects_gambit.xml:132-148`; `SG/modules/utilities/unix/nc_message/manifests/install.pp:24` |
| Flag 3 = operator's home directory, reached over SSH | Account from `parameterised_accounts`, with leaked file `flag`. The XML comment says it can be reached over SSH, but neither the XML nor the module configures SSH. The module's file path is the Windows-style one noted for m05. | unclear | `SG/.../m07_architects_gambit.xml:151-171`; `SG/.../parameterised_accounts/manifests/account.pp:42-46` |
| Flag 4 = root via a sudo rule | `sudo_root_awk`: passwordless root rule for one listed tool, applied to all users | yes | `SG/.../m07_architects_gambit.xml:173-177`; `SG/modules/vulnerabilities/unix/access_control_misconfigurations/sudo_root_awk/manifests/config.pp:11-15` |
| One target host or two | Two systems: `attack_vm` (Kali) and `scada_attack_host`. One target. | yes | `SG/.../m07_architects_gambit.xml:65-185` |
| Kali IP | The XML sets no IP for `attack_vm`, and the m07 game files contain no 172.16.x.x address | unclear | `SG/.../m07_architects_gambit.xml:70-75`; `BE/scenarios/m07_architects_gambit/` (no literal IP found) |
| Flag 4 can be reached before flag 3 | The sudo rule applies to every local user, so any local login would do. The XML creates only one non-root login, the flag 3 account. No other local account is declared, so flag 4 looks dependent on flag 3, but the XML does not enforce this. | unclear | `SG/.../m07_architects_gambit.xml:151-177` |
| Flag order | 1 NFS, 2 netcat, 3 parameterised accounts, 4 sudo rule, as the XML comment states | yes | `SG/.../m07_architects_gambit.xml:123` |
| Flag labels in the game | The game's slugs at positions 3 and 4 are `root_on_attack_host` and `cascade_scripts_terminated`. In the XML, position 3 is the user account and position 4 is root. The position 3 label names root. | no | `BE/scenarios/m07_architects_gambit/scenario.json.erb:76` |
| `nfs-and-netcat-leaks` sheet exists | `HL/_labs/safetynet/nfs-and-netcat-leaks.md` exists | yes | `BE/scenarios/m07_architects_gambit/scenario.json.erb:1339-1344` |

Field guides referenced by m07 (`BE/scenarios/m07_architects_gambit/scenario.json.erb:1322-1358`):
- rfid-cloning, lockpicking, reconnaissance-and-network-mapping, nfs-and-netcat-leaks, ssh-access-and-bruteforce
- privilege-escalation at line 1358 (excluded from this check; not opened)

Titles (`title:` lines only):
- `HL/_labs/safetynet/rfid-cloning.md`: `SAFETYNET Field Guide - RFID Cloning`
- `HL/_labs/safetynet/lockpicking.md`: `SAFETYNET Field Guide: Lockpicking`
- `HL/_labs/safetynet/reconnaissance-and-network-mapping.md`: `SAFETYNET Field Guide - Reconnaissance and Network Mapping`
- `HL/_labs/safetynet/nfs-and-netcat-leaks.md`: `SAFETYNET Field Guide - NFS Shares and Open Ports`
- `HL/_labs/safetynet/ssh-access-and-bruteforce.md`: `SAFETYNET Field Guide - SSH Access and Bruteforce`

## Mission 8: The Mole

| claim | SecGen says | match? | source file:line |
|---|---|---|---|
| Built scenario | `m08_the_mole.xml` is the scenario named by mission.json. The m08 ERB header still calls the build "unconfirmed" (item U1). `ctf/such_a_git.xml` is a different scenario, with `attack_vm` and `web_server`, not the GitList host. | yes (for m08_the_mole); U1 still open in the game file | `BE/scenarios/m08_the_mole/mission.json:5`; `BE/scenarios/m08_the_mole/scenario.json.erb` header (around lines 17-21); `SG/scenarios/ctf/such_a_git.xml:67,108` |
| Target system name | `safetynet_gitlist_server`, as the game flag key expects | yes | `SG/.../m08_the_mole.xml:127`; `BE/scenarios/m08_the_mole/scenario.json.erb:129` |
| Account or home directory named after nightshade (for example `nightshade_ops`) | The login account name comes from the organisation's manager username, which is chosen at random per build (line selector). None of the 25 organisation files contains "nightshade". The string `nightshade_ops` appears only as hard-coded text inside the flag payload. | no | `SG/.../m08_the_mole.xml:130-135,183,249`; `SG/lib/resources/structured_content/organisations/json_organisations` |
| Mail to architect@entropy.onion | The `To:` line in the recovered message | yes | `SG/.../m08_the_mole.xml:200` |
| Where the mail sits | The text says it was recovered from `~/.local/share/mail/sent`. The module only writes a file named `flag` into the account's home directory. | no (path) | `SG/.../m08_the_mole.xml:192,198`; `SG/.../parameterised_accounts/manifests/account.pp:42-46` |
| Root-only log naming a "Crypto Lab" terminal and 47 minutes | Text says "source: Cryptography Lab terminal 03" and "duration 00:47:00", and it says `/var/log`, root only. The log is text inside the root flag payload, not a real log file. The wording is "Cryptography Lab", not "Crypto Lab". | unclear (wording; not a real file) | `SG/.../m08_the_mole.xml:248-251` |
| SSH as the second login | Comment says SSH with the recovered credentials "lands here", in the ops account. Neither the XML nor the module configures SSH. | unclear | `SG/.../m08_the_mole.xml:177-178` |
| CVE ID | CVE-2018-1000533, on `gitlist_040` (GitList 0.4.0) | yes | `SG/.../m08_the_mole.xml:18,150` |
| GitList with unauthenticated code execution | "no credentials required" | yes | `SG/.../m08_the_mole.xml:150-152` |
| Git history or stash holds credentials | "committed into repository history", and a commit-message note. No stash is mentioned. | history yes; stash no | `SG/.../m08_the_mole.xml:19,161` |
| Sudo rule to root | `sudo_root_apt_get`: passwordless root rule for one listed tool, applied to all users | yes | `SG/.../m08_the_mole.xml:226-229`; `SG/modules/vulnerabilities/unix/access_control_misconfigurations/sudo_root_apt_get/manifests/config.pp` |
| Account name visible once root is reached | The root payload names `nightshade_ops` and the mail `From:` line names `nightshade_deep_state`. Both are hard-coded. The real login name is random per build. | no | `SG/.../m08_the_mole.xml:201,249` |
| Flag order | 1 repository exposure, 2 stashed password, 3 home directory, 4 root. The game's list matches. The XML says the order "needs a build to confirm". | yes (XML order); build check pending | `SG/.../m08_the_mole.xml:154-155`; `BE/scenarios/m08_the_mole/scenario.json.erb:129` |

Field guide note: the m08 XML lab sheet URL points to `scanning-and-exploitation` (line 38). That sheet is excluded from this check and was not opened.

## Mismatches to resolve

- m05: the D1 change has not been made. SecGen still names Torres in the flag 3 manifest (`m05_insider_trading.xml:203`). The badge number #4471 is not in SecGen at all.
- m05: `sudo_root_less` has an extra flag generator (line 290) that is not in the game's flag list, so the server has five primary flags against four in the game. The XML text says "four primary flags".
- m07: the game's flag labels at positions 3 and 4 do not match the XML order (`scenario.json.erb:76`).
- m08: the account name `nightshade_ops` is hard-coded in the text but not fixed in SecGen. The account name is random. The m08 header note (U1) remains open.
- m08: the mail's stated location (`~/.local/share/mail/sent`) does not match where the module writes the file.
- m06: the description's flag notation (`hackme_crack_me_lab:flag_1..4`) differs from the game's `targetFlags` notation (`-flag1` to `-flag4`).

Items marked "unclear" depend on how the Linux build treats `parameterised_accounts` (home path, sudo group, SSH) and on the Kali IP, which SecGen assigns at build time. A build would settle them.

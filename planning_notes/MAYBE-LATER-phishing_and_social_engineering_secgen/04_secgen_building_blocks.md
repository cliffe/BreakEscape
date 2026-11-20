# 04 — SecGen building blocks & gaps

Status: plan, 2026-10-20. From a design-level SecGen survey (Haiku, read-only, no exploit detail).
Maps the challenge catalogue (`02`) to existing SecGen modules and names the gaps where a new module
is needed. Module paths are under `SecGen/modules/`. Actual scenario/module authoring is a Haiku task
(the orchestrator does not write SecGen XML); this doc is the shopping list.

## Reusable modules (already exist)

**Mail / phishing**
- `services/unix/email/mailserver` — Postfix + Dovecot (IMAP). Input: `server_ip` only.
- `services/unix/email/popa3d` — POP3 for system users.
- `utilities/unix/system/mail` — delivers `mail_message` hashes into local mailboxes.
- `utilities/unix/email_clients/thunderbird` — the student's GUI mail client (accounts, start page).
- `vulnerabilities/unix/email_phishing/phish_victim_bot` — the polling victim bot (**we mostly avoid
  this** — the game owns email judging; see C3).
- `generators/config_files/phish_victim_bot_config` — per-account rule blocks (only if the bot is used).
- `services/unix/http/phish_me_website` — static look-alike company site (Apache). **Captures nothing.**
- `generators/content/{mail_message,mail_id,email_address,business_email}` — message/address seed data.

**OSINT / info-leak**
- `generators/structured_content/person` — staff profile hashes (name, email, username, password, …).
- `generators/image/exif` + `random_exif_string_field` — hide a string in an image EXIF field.
- `utilities/unix/version_control/git`, `webapp/gitlist_040`, `gitlab_13102` — git hosting (leak via repo content).
- `generators/content/bash_history` — history file leaking a sudo password.
- `generators/structured_content/leaked_data`, `utilities/unix/system/leak_to_file` — generic leaked-file placement.
- `vulnerabilities/unix/webapp/onlinestore` — web app seeded with strings/accounts.
- `vulnerabilities/unix/system/forensic_trash_deleted_files` — deleted-file artefacts.

**Credentials / auth**
- `vulnerabilities/unix/system/crackable_user_account`, `passwordless_user_account`.
- `vulnerabilities/unix/system/{jtr,ncrack}_crackable_user_account` — password cracks to John/ncrack.
- `vulnerabilities/unix/ctf/pwn/ssh_leaked_keys` — SSH key left in a home dir.
- `vulnerabilities/unix/system/ssh_root_login` — root SSH with a (weak/overridable) password; used in `3_phishing.xml`.
- `utilities/unix/system/parameterised_accounts` — accounts from input (username, password, super_user, leaks).
- `generators/compression/zip`, `generators/image/steghide`, `generators/config_files/filezilla_config`
  — password-protected artefacts (zip/steg/ftp creds).

**Flags**
- `generators/flag/{flag_words,flag_hex,flag_8char_hex,flag_base64,flag_concat}` — flag strings.
- Placement: a vuln passes flags via `strings_to_leak`, named by `leaked_filenames`; `secgen_functions::leak_files`
  writes them with owner/group/mode — so a flag belongs to **one VM, one account's home**.
- Output: `projects/<ts>/flag_hints.xml`, per `<system_name>`; this is what Break Escape's
  `secgen_scenario` path consumes. CTFd export also available.

**Scenarios to learn from / extend**
- `scenarios/labs/cyber_security_landscape/3_phishing.xml` — two VMs: `victim_server` (phish_me_website
  + mailserver + phish_victim_bot + ssh_root_login + look-alike-domain hosts mapping + private net) and
  `kali` (Thunderbird, LibreOffice, Metasploit, nmap). The closest existing template.
- `scenarios/break_escape/safetynet/m01..m08.xml` — the mission VM sets (the flag-bridge target).

## Challenge → module map

| Challenge | Built mostly from | New work |
|-----------|-------------------|----------|
| C1 mail recon & auth | `mailserver`, `parameterised_accounts`, a flag generator + `leak_to_file` | **SPF/DKIM/DMARC config module (NEW)** — see gaps |
| C2 pretext→login | `parameterised_accounts` (password = the owned literal), flag + `leak_files` | none (core bridge demo) |
| C3 payload on victim | the `3_phishing.xml` victim pattern **minus** `phish_victim_bot`, flag in victim home | none; reuse template |
| C4 OSINT pivot | document-metadata leak → `parameterised_accounts`/`ssh_leaked_keys`, flag + a second leaked fact | **doc-metadata generator (NEW)** if the leak is a docx/odt/PDF (EXIF covers images only) |
| C5 harvested creds → portal | `phish_me_website` (or `onlinestore`) + `parameterised_accounts`, flag behind login | **form-capture / real-login module (NEW)** — phish_me_website captures nothing |
| C6 phishing-kit forensics | `forensic_trash_deleted_files`, `leaked_data`, `bash_history`, EXIF/zip artefacts, IoC flags | none; compose existing |

## Gaps — new modules to consider (design level)

Ranked by how much they unlock, least effort first:

1. **Document-metadata generator (docx/odt/PDF author field).** Today only EXIF (images) hides a
   string. For the OSINT lesson where a published document leaks a username (C4, and the no-VM OSINT
   browser's document-metadata layer), a generator that sets the author/last-saved-by field on an
   office/PDF document is wanted. Small, high value, reusable.
2. **Form-capture / real-login for the look-alike site (C5).** `phish_me_website` records nothing. A
   module that either logs submitted credentials to a student-readable file **or** stands up a real
   login the harvested credential opens (behind which sits a flag). Needed to make the landing-page
   lesson real.
3. **Mail sending-domain + SPF/DKIM/DMARC posture (C1).** `mailserver` takes only `server_ip`; there's
   no way to set a sending domain or publish/withhold SPF/DKIM/DMARC. Without this the "authentication
   catches the spoof" lesson can't be set up on the VM. Bigger; needed only for C1's full depth (the
   concept is still taught in the no-VM suite regardless).
4. **Build-time game↔VM content sync (optional, NOT IPC).** Staff names/emails are typed into the
   scenario XML today. A generator that reads a **BreakEscape content export** (the AccountingNow cast
   JSON) at **build time** would keep the two repos' fiction in sync automatically — the carried-across
   tokens (usernames, the owned-literal passwords) would then be generated from one source. This is a
   content-sync convenience at build time, **not** runtime IPC, so it doesn't violate the constraint.
   Until it exists, the fiction is kept in sync **by hand** via the crossing table (`01`).
5. **Mailbox seeding from a structured list (optional).** No path from a list of in-game emails into
   Postfix/Dovecot mailboxes (`mail` utility only does local system mail). Useful if a challenge wants
   the student to *read* a seeded inbox on the VM; not needed for the core challenges.

## Known caveat to verify at build time

- The flag-hint **marker generator matches `flag{...}`**, so `flag_base64`'s `"flag:"`-prefixed output
  may not be recorded as a flag (Haiku survey, §4). Prefer `flag_words`/`flag_hex`/`flag_8char_hex`
  for anything submitted at the flag station, or confirm the marker handles the chosen generator. This
  is exactly the kind of mismatch the `mission-secgen-review` skill checks.

## Routing

All SecGen authoring (scenarios, the new modules above, `flag_hints.xml`, the VM lab-sheet companion)
goes to a **Haiku subagent** (high effort, model+effort explicit), per the standing SecGen rule. The
orchestrator builds the game side and the crossing tables, and cross-checks with `mission-secgen-review`
before anything ships. VM exploit detail stays in the SecGen repo and the VM companion lab sheet, never
in these planning docs or the game walkthrough.

# SecGen module plan: distcc de-duplication + finale/remaining-mission candidates

Written for the author. Goal: stop over-using distcc (currently m03, m04, m06), draw every
substitute from the **known-good catalogue scenarios** (so they are Bookworm-tested — shellshock
is not), and line up VM module candidates for the unauthored missions (m09, m10).

Security detail is kept at citation level (module + CVE names), not exploit steps.

## Key finding: distcc was only ever planned for m03

`planning_notes/overall_story_plan/quick_reference.md` ("VM/SecGen Skills") lists distcc
exploitation only under **m03** ("Network scanning, banner grabbing, Base64, **distcc
exploitation** ✅"). m04's intended skills are "Vulnerability scanning (Nmap NSE), privilege
escalation (sudo)"; m06's are "Password cracking (JtR), multi-server lateral movement."
So distcc in m04 and m06 is drift from the design. **Keep distcc in m03** (also its strongest
story fit: the "legacy build box" / "ghost in the machine"), remove it from m04 and m06.

## Module inventory — user-level RCE footholds from the catalogue (Bookworm-tested)

All `user_rwx` unless noted; all expose the standard leak interface (`strings_to_leak`,
`leaked_filenames`, usually `strings_to_pre_leak` + `port`), so each is a drop-in foothold that
can hold a flag and lead into a privesc.

| Module | CVE / id | From catalogue scenario | Privilege | Notes |
|---|---|---|---|---|
| `distcc_exec` | CVE-2004-2687 | Rooting for a win (and others) | user_rwx | **keep for m03 only** |
| `proftpd_133c_backdoor` | — | Rooting for a win | user/root variants | already m02, m03 |
| `bludit_upload_images_exec` | — | Feeling Blu | user_rwx | already m05 |
| `nostromo_code_exec` | CVE-2019-16278 | **Nosferatu** | user_rwx | **reserve for m09** (planned) |
| `ssh_erlangotp_rce` | CVE-2025-32433 | SSH-it happens | user_rwx | modern pre-auth SSH RCE; Erlang/OTP suits OT/telecom |
| `apache_druid_rce` | CVE-2021-25646 | Eventful Data | user_rwx | real-time analytics DB; suits a finance/data backend |
| `apache_spark_rce` | — | Catching Sparks | user_rwx | big-data processing; finance/data alt |
| `maltrail_rce` | — | Off the Trail | user_rwx | malicious-traffic monitor; suits a security/monitoring box |
| `unrealirc_3281_backdoor` | CVE-2010-2075 | Eyearesee | user_rwx | old IRC backdoor; suits an abandoned C2 chat server |
| `lucee_rce` | — | Disastrous Development | **root_rwx** | lands as root — use where NO separate privesc is wanted, not as a foothold-before-privesc |

Privilege-escalation modules proven in the catalogue (all Bookworm-tested): `sudo_root_less`
(Feeling Blu, SSH-it happens, Nosferatu), `sudo_root_awk` (SSH-it happens, Eyearesee, Putting
it together), `sudo_root_more` (Eventful Data), `sudo_root_apt_get` (Git dejavu; already m08),
`sudoedit` CVE-2023-22809 (already m04), `writable_passwd`/`writable_shadow` (Off the Trail),
`readable_shadow` (already m06).

Container-escape modules (Container Escape): `nc_backdoor_docker_esc`, `nc_backdoor_chroot_esc`
— an advanced capstone mechanic (break out of a container to the host).

## distcc substitution plan (m04, m06)

### m06 Follow the Money → `apache_druid_rce` (CVE-2021-25646)
- Role today: distcc is the generic foothold → world-readable shadow → offline crack → hcops
  sudo. The foothold just needs `user_rwx` + readable shadow — Druid provides both.
- Why Druid: m06 is the Crypto Anarchists' financial hub; a real-time analytics database on a
  money-tracking backend fits far better than a C compiler, and keeps the mission's real lesson
  (password cracking + lateral movement) intact. Alt: `apache_spark_rce`.
- Why not nostromo here: reserved for m09 (below) — using it in m06 would recreate the
  duplication we are removing.
- Changes: swap the `distcc_exec` vulnerability block for `apache_druid_rce` in the canonical
  m06 XML (same leak interface, so flag placement/foothold-note transfer); repoint the game's
  field-guide handout and `lab_sheet_url`; write a Druid field guide (see below). The
  readable_shadow → crack → sudo chain is unchanged.

### m04 Critical Failure → `ssh_erlangotp_rce` (CVE-2025-32433)
- Role today: distcc is the foothold before the sudoedit (CVE-2023-22809) privesc, and the
  named CVE in `mission.json`.
- Why Erlang/OTP SSH: m04 is the water-treatment/SCADA mission; Erlang/OTP underpins
  industrial/telecom messaging stacks, and a 2025 pre-auth RCE pairs naturally with m04's
  modern-privesc signature (sudoedit) — "a brand-new critical CVE in the plant's control
  stack." Restores the plan's "vuln scanning + sudo privesc" intent better than a 2004 compiler
  bug. Alt: `maltrail_rce` (a monitoring tool on the OT network).
- Changes: swap `distcc_exec` → `ssh_erlangotp_rce` in the canonical m04 XML (and its
  in-mission copy); update `mission.json` CVE list (CVE-2004-2687 → CVE-2025-32433); repoint
  the field-guide handout + `lab_sheet_url`; write an Erlang/OTP SSH-RCE field guide. The
  sudoedit privesc and flag4 placement are otherwise unchanged.

### Field guides needed
`distcc-exploitation.md` stays (m03 still uses it). New guides to write in
`HacktivityLabSheets/_labs/safetynet/`: an Apache Druid RCE guide (m06) and an Erlang/OTP SSH
RCE guide (m04). Both follow the existing safetynet field-guide style.

After this, foothold RCEs are spread: proftpd (m02), distcc+proftpd (m03), erlang-ssh (m04),
bludit (m05), druid (m06), nfs+netcat (m07), gitlist (m08) — no module used more than twice,
distcc only once.

## Finale & remaining missions (unauthored: m09, m10)

From `quick_reference.md` the arc runs to 10 missions; m09 and m10 are the finale and are not
yet built. Candidate VM module mappings, drawing on the still-unused catalogue modules:

### m09 Digital Archaeology (planned: Nosferatu; historical / abandoned ENTROPY bases)
- **`nostromo_code_exec`** (CVE-2019-16278) as the core RCE — an obscure, dated web server is a
  perfect "abandoned infrastructure" artefact, exactly the Nosferatu basis the plan names.
- Optionally add **`unrealirc_3281_backdoor`** (CVE-2010-2075) as a second service — a derelict
  IRC server reads as an abandoned ENTROPY C2 channel, reinforcing the archaeology theme.
- Privesc: `sudo_root_less` (Nosferatu's own pairing).

### m10 The Final Cipher (planned: "Post-exploitation"; All Cells; boss; "Tomb Gamma")
- Capstone mechanic: **container escape** (`nc_backdoor_docker_esc`, from Container Escape) —
  break out of a container to the host reads as breaking the Architect's final containment.
  Advanced, climactic, and not used anywhere else.
- Entry RCE into the container: `lucee_rce` (lands root *inside* the container, so the challenge
  becomes the escape, not a second privesc) or `apache_spark_rce`.
- This gives m10 a genuine multi-stage "post-exploitation" shape: RCE into the container →
  escape to the host → final flags, matching the finale's Tier-3 billing.

### Modules left spare (for variety/alternates)
`apache_spark_rce`, `maltrail_rce`, `writable_passwd/shadow`, `sudo_root_more` — available as
alternates if a mapping above doesn't suit on a build.

## What needs confirming / out of scope here
- This is a plan. No VM or game files changed yet.
- None of it is build-verified; the catalogue scenarios being live is the Bookworm-tested
  evidence, but each adapted mission still needs an author build-and-solve.
- m09/m10 are full mission authoring (story, rooms, ink, puzzles, art), not just VM choice —
  the module picks above are only the VM half, to slot into the normal mission-authoring loop.

# Finale VM plan: m09 and m10

Scenario structure only: server names, module names, positions and account names. No exploit steps. Sources: FINALE_ARC §6 and the two stage 0 files (both as revised), VM_SHAPE.md, SECGEN_MODULE_PLAN.md (Finale section), and the SecGen scenarios named below. Nothing has been built, so positions are as the scenario files and module comments describe them. §3 says which story-side rewordings the revision applied.

## 1. m09 Digital Archaeology

**File:** `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`
**Attack box:** `attack_vm` (Kali). This is the field laptop, which the story calls the drop terminal in the reading room.

**Servers**

| Hostname | Story name | Built from | Flags |
|---|---|---|---|
| `catalogue_server` | the archive's catalogue server | `ctf/eventful_data.xml`, target system only | 2 |
| `tomb_beta_server` | Tomb Beta's last server, racked in the tape room | `ctf/nosferatu.xml`, pre-login flags removed | 2 |

FINALE_ARC §6.1 (revised) puts flags 1 and 2 on the catalogue and flags 3 and 4 on Tomb Beta's machine. The designers kept two machines (R2), so the plan uses two. See §4.

**Flags, in submission order**

| # | Story meaning | Provided by | Account the student sees | Submitted at | Fit |
|---|---|---|---|---|---|
| 1 | Foothold on the archive's catalogue server: the index, restricted series included | `catalogue_server`, the service account's home (user level) | the service account the module creates; name not fixed in the XML | Drop terminal, reading room (field laptop) | Fits. User-level access is a foothold. |
| 2 | The Insider Threat Initiative's live ledger: 23 placements, 47 candidates, and the legacy section with WREN's day-10 entry | `catalogue_server`, root's home | root | Drop terminal, reading room | Fits. Reached after flag 1. |
| 3 | The owner of Tomb Beta's server, shown by the SAFETYNET credential beside the flag, which names Tesseract | `tomb_beta_server`, the web service account's home (user level) | `nostromousr` (see §5, M5) | Drop terminal, reading room | R1 applied. Fits. The same machine also holds Tesseract's memo and unsent vendor notice (§5, M3). |
| 4 | Full control of Tomb Beta's server: the mirror job to Tomb Gamma, the 06:00 UTC hour, the 04:00 head start, the fallback, the list of defences | `tomb_beta_server`, root's home | root | Tape room, beside the machine (§5, M1) | Fits. |

**Build notes**
- Neither box enables root login over SSH (both XMLs checked). Keep it that way.
- Nosferatu: remove the `strings_to_pre_leak` input, which carries the two pre-login flags. This also removes the encoded message the scenario description mentions. Either rewrite the description and lab sheet to match, or keep the encoded text as non-flag clue text. Decide at the build.
- The Eventful Data account name is not written in its XML. Read it from the built VM and record it in the mission notes.
- Rename both systems. The source files call them `server`.
- Attack box: add both IPs to the `IP_addresses` datastore, as `ctf/nosferatu.xml` and m08 do.
- **Seed content, `tomb_beta_server`.** FINALE_ARC §6.1 row 3 says the machine's files hold Tesseract's memo on the Albion flaw and his unsent vendor notice. The build must place both. See §5, M3.

## 2. m10 Full Disclosure

**File:** `scenarios/break_escape/safetynet/m10_full_disclosure.xml`
**Attack box:** `attack_vm` (Kali), which is the forward post's terminal. `ctf/container_escape.xml` has no attack box, so one is added.

**Servers**

| Hostname | Story name | Built from | Flags |
|---|---|---|---|
| `bunker_monitor` | the bunker's security monitoring host | `ctf/off_the_trail.xml`, with the privilege-escalation block removed | 2 |
| `release_host` | the release host, with the release service in a container | `ctf/container_escape.xml`, `desktop` system | 1 |
| `core_host` | the core host | `ctf/container_escape.xml`, `chroot_esc_server` system | 1 |

The entry stage is `bunker_monitor`. Its two flags give the player progress before the two climax flags. Off the Trail's third flag is a root-level one, and removing it keeps the entry box at two flags.

**Flags, in submission order**

| # | Story meaning | Provided by | Account | Submitted at | Fit |
|---|---|---|---|---|---|
| 1 | Foothold on the security monitoring host that the camera and door systems report to | `bunker_monitor`, the monitoring service's home (user level) | `maltrail` (per VM_SHAPE, not checked in the module) | Forward post's terminal (the attack box) | R3 applied. Fits. |
| 2 | The staging copy of the schedule, kept on the security monitoring host: channels, first cities, early-access orders | `bunker_monitor`, the `staging` account's `0600` home (see §6; a separate account from flag 1, per R4 M1) | `staging` | Server-hall console (§5, M2) | R4 applied; flag-2 account split out in §6. |
| 3 | Out of the release service's container onto the release host beneath it | `release_host`, root's home, after leaving the container | root. The student reaches it through one of two generated accounts. | Server-hall console, which arms the disarm for the core | R5, R6 applied. Fits. |
| 4 | Full control of the core host: the stolen copy and the live line into the Citadel's vault | `core_host`, root's home, after leaving the jail | root. The core host has no named accounts. | Core host terminal, after Tesseract stops the clock | Fits. |

Neither the container nor the jail holds a flag, as the scenario describes.

**Build notes**
- **Known issue 1, root login over SSH.** Both `release_host` and `core_host` enable root login over SSH with a generated password. A student who logs in as root skips the escape and reads both flags. Remove `ssh_root_login` from both systems. Remove the `hackerbot_access_root_password` datastore too. Its name suggests it came from a Hackerbot scenario. After the build, confirm that root login over SSH is refused.
- **Known issue 2, account count.** `release_host` generates three accounts, but the file's comment says two. Build two, matching the comment. The story has no third operative on this box. Fix the comment in the same edit.
- `bunker_monitor` keeps its service account and drops the privilege-escalation block. Otherwise the entry box carries three flags and the total is five.
- **Seed content, `bunker_monitor`.** The schedule behind flag 2 must carry the channel list, the cells' early-access orders (Zero Day's among them, under Victoria's name or Vos's) and the first entries by city. See §5, M4.
- Rename the three systems. The source files call them `desktop` and `chroot_esc_server`.
- Four targets plus the attack box is the largest SAFETYNET build so far. m01 to m08 each have one target. Plan the build and test time accordingly.

## 3. Story-side rewordings

Status after the designers' revision of FINALE_ARC §6 and both stage 0 files. The label on each item gives the outcome. The text is the original proposal.

- **R1 (m09, FINALE_ARC §6.1 row 3; m09 stage doc §2.1 item 3). Applied, with different wording:** the credential is "found beside the flag", not "in that account's home". The name is in the credential text, as proposed. The story says the machine "was enrolled with a staff credential issued to Dr Adrian Tesseract," and that the flag proves its owner. The flag string carries no name. Reword to: "Tomb Beta's server ran its enrolment under a web service account. The credential issued to Tesseract sits in that account's home, beside the flag." The name belongs in the credential text, not in the flag.
- **R2 (m09, FINALE_ARC §6.1 intro). Not needed; the designers kept the two-machine plan.** No reword needed if the two-machine plan stands. If the designers want one target, rows 1 and 3 must name the same machine, which is a larger change.
- **R3 (m10, FINALE_ARC §6.2 row 1). Applied as written.** "The camera and door controller in the security office" → "the security monitoring host that the camera and door systems report to." The VM host watches network traffic. The camera feeds, blast-door route and door log stay as in-game content.
- **R4 (m10, FINALE_ARC §6.2 row 2; m10 stage doc §2.1 item 2). Applied as written.** "Inside the release pipeline: the staging service" → "the staging copy of the schedule, kept on the security monitoring host." The channels, the first cities and the early-access orders are the text beside the flag.
- **R5 (m10, FINALE_ARC §6.2 intro and row 3; m10 stage doc §2.1). Applied, and extended:** flag 3 is at the server-hall console and flag 4 at the core host terminal, as proposed. The designers also moved flag 2 to the server-hall console, which this item did not cover. The problem it fixed: the submission point conflicts. The intro says flags 3 and 4 are at the core's host terminal. Row 3 unlocks "the disarm action at the console", which is in the server hall. Reword so flag 3 is submitted at the server-hall console and flag 4 at the core host terminal.
- **R6 (m10, FINALE_ARC §6.2 row 3). Applied as written.** "Out of the release service's box onto the machine beneath it" → "out of the release service's container onto the release host beneath it." The VM runs the release service in a container on that host.

**Other changes in the revision**

- m09 flag 2 now names the ledger's contents (23 placements, 47 candidates, the legacy section with WREN's day-10 entry). It stays in root's home on the catalogue server.
- m09 flag 3 is now defined as ownership, shown by the credential beside it. Its old meaning was "enrolment and the credential".
- m09 flag 4 names the 06:00 UTC hour (day 13) and the 04:00 head start, with the fallback and the defence list.
- m10 flag 2 moved to the server-hall console. Its meaning is unchanged.

## 4. Choices and assumptions

- **Choice, m09 two machines.** The story already gives the catalogue and Tomb Beta different owners. One reworded box would merge them, which is a bigger story change than two boxes.
- **Choice, m10 entry stage from Off the Trail.** One spare box with two flags, instead of two single-flag spares (Disastrous Development and Catching Sparks). R3 and R4 are applied, so the schedule now sits on the monitoring host. That is the cost of this choice. Disastrous Development is out of the plan. VM_SHAPE says its flag sits at the service's privilege level, while SECGEN_MODULE_PLAN says its module lands as root. That conflict needs checking if the option is reopened.
- **Choice, two accounts on `release_host`.** This follows the file's comment, not the three it defines.
- **Assumption.** The positions above come from the scenario files and comments. Nothing has been built, and the module behaviour is unchecked. The first build must confirm that the trimmed Nosferatu and Off the Trail boxes still run.
- **Noticed, not acted on.** The `hackerbot_access_root_password` datastore is a leftover name. Removing it is in the build notes, and no other scenario is changed.

## 5. Mismatches left after the revision

Found while updating this plan. Nothing here was checked against SecGen, so each item is a build-time check, not a verified fault.

- **M1, m09 flag 4 submission point.** Flags 1 to 3 go in at the reading-room drop terminal, which is the field laptop and the attack box. Flag 4 goes in at the tape room, beside Tomb Beta's machine. Either the laptop is carried there, or the tape room gets a second in-game terminal for the same VM. Decide in the game build.
- **M2, m10 submission points.** Flag 1 goes in at the forward post's terminal, which is the only attack box. Flags 2 and 3 go in at the server-hall console, and flag 4 at the core host terminal. The same second-terminal question as M1 applies. Flag 2's move is new in this revision.
- **M3, m09 seed content.** The story puts Tesseract's memo on the Albion flaw (nine years old) and his unsent vendor notice on `tomb_beta_server`. Neither is in the build notes. The build must place both as files, or the story must move them.
- **M4, m10 seed content.** The text beside flag 2 must carry the channel list, the early-access orders and the first entries by city. Seeded in the threat-data record at `m10_full_disclosure.xml:179` (one line beside flag 2); the cities are Seattle first (hospital group, infusion pumps), Austin second (county, dispatch software), Cleveland third (a water utility, controllers) — decided F28, 2026-10-23, no real utility company named.
- **M5, m09 account for flag 3.** The story calls it a "web service account". The plan gives the student's account as `nostromousr`. These may be different accounts. Confirm against the built VM before the credential text is written.
- **M6, m09 flag 4 mirror target.** The mirror job is said to mirror to Tomb Gamma. Tomb Gamma is also the m10 network (§6.2 heading). No host in this plan carries that name, so the job should name the target only, with no route. Low risk, but the story must not imply a live link the VMs cannot show.

## 6. F12/F13 gating fixes (2026-10-22)

From the F12/F13 ruling (`scenarios/FINALE_DEV_LOG.md:487-490`) and the audit `scenarios/VM_GATING_AUDIT.md`. As drafted, all four m09 flags and all four m10 flags are reachable cold (the two footholds are unauthenticated RCE, the deeper flags are privilege steps), so F12 is not met; and the m10 "disarm" and "unsent notice" are not seeded on the VM, so F13 is not met. The design below keeps each taught exploit as the **foothold** and makes an **in-game find required to read the flag** — the m01 shape, where the box is reachable but the game still hides what you need. It also closes the m09 Tesseract name-peek (D1) and the m10 "climax rootable at start" problem.

### m09

- **Flag 1 (catalogue).** Move flag 1 and the catalogue-index text into a **catalogue service account whose shell login password is a fixed in-game string** (the m02 `Hospital1987` mechanism). The Druid RCE stays as the foothold but lands unprivileged and cannot read that account's `0600` home; flag 1 needs the found login. Seed the index body (Series R, R-114–R-161, restricted cage, bay 10) to match the drop screen.
- **Flag 2 (ledger, root).** Unchanged route (`sudo_root_more` from flag 1); transitively gated. Seed the ledger body **and the H&L number `HL2015-0477`** inside flag 2's root-home file only.

  Chosen login strings (2026-10-22, now in the m09 ERB Codes block): catalogue account **`catalogsvc`**, password **`Catalog!Helena2016`**. The build must create this account on `catalogue_server` with that exact password and place flag 1 + the catalogue-index text in its `0600` home.
- **Flag 3 (Tomb Beta owner).** Move flag 3, the Tesseract credential, the Albion memo and the unsent notice into a **web service account whose login password is a fixed in-game string**; nostromo RCE stays as the foothold but lands unprivileged; flag 3 needs the found login. `strings_to_pre_leak` stays empty. The in-game password lives on the salvage-cage enrolment binder, so the name cannot be read before the identity scene (fixes D1).
  Chosen login strings (2026-10-22, now in the m09 ERB Codes block): Tomb Beta web service account **`nostromousr`** (the module's hard-coded account name — keep it), password **`TombBeta!Enrol16`**. The build must set that account's login password to this exact string and place flag 3 + the credential + memo + notice in its `0600` home. These strings appear in-game on the salvage-cage enrolment binder.
- **Flag 4 (Tomb Beta control).** Unchanged route (`sudo_root_less` from flag 3); transitively gated; mirror job already seeded.

### m10

Chosen login strings (2026-10-22, now in the m10 ERB Codes block — the build must seed these exact values):

- **Flag 1 (monitoring).** Account **`secmon`**, password **`Bunker!Monitor59`** (shown in-game on the forward-post gate-console maintenance tag). **Correction to the earlier draft:** flag 1's file must go into this **separate `secmon` login account**, *not* the `maltrail` account the injection lands as — the maltrail foothold has `user_rwx` as `maltrail`, so a flag in maltrail's own home would be readable cold. Put flag 1 in `secmon`'s `0600` home and keep `maltrail` unable to read it; reading flag 1 then needs the `secmon` login. maltrail injection stays as the colour foothold.
- **Flag 2 (schedule).** **Needs its own find (R4 M1 — reverses the R3 answer).** The R3 answer (gate flag 2 on flag 1's `secmon` login, VM-internal) failed F12 in practice: a player can take flag 2 at the forward post and carry it through five rooms to the release console (depth 5). So flag 2 gets a **separate staging account** on `bunker_monitor`, account **`staging`**, password **`Staging!Copy25`**, with the staging copy of the schedule (channels, early-access orders, first cities — FINALE_VM_PLAN M4) in its `0600` home. The login is an in-game find placed **by the release console in the server hall**, so flag 2 cannot be obtained before its submit room. Flag 1's `secmon` login no longer gates flag 2.
- **Flag 3 (container escape).** Operative account **`relops`** (a neutral release-operations / shift account — renamed from `vos` per scenario-design R4, which clashed with the character Pieter Vos named in the next room), password **`Release!Shift25`** (shown in-game on the operator's duty card in the server hall). The container bind shell stays as the foothold, but it must be reachable **only after logging in as `relops`** (bind the service to loopback / behind the operative login), so reaching `release_host` root needs the in-game credential rather than a cold escape.
  - **Disarm conflict resolved (R3 m2).** In the game the disarm *action* happens at Tesseract's core console, so the release host must not hold "the disarm" itself. The release-host artefact is the **release-control / kill configuration** (`release_control` in root's home): how the 06:00 release is armed and what would stop it. The player recovers it here; only the core console can act on it. Seed `release_control` beside flag 3 (this is the F13 artefact, renamed from "disarm" so the game and VM agree).
- **Flag 4 (core escape).** Core access key **`TSRCT-CORE-9F21`** (shown in-game on the access-key envelope on the gallery rail — a key from Tesseract, reachable only after the gallery stair). The chroot bind shell stays as the foothold, but the escape route must require that key (bind to loopback / gate the shell on the key), so `core_host` root is not cold. **Seed Tesseract's unsent vendor notice in `core_host` root's home** beside flag 4 (F13), plus the stolen-copy / Citadel-vault line the game's `core_files` prop names. This removes the cold root-at-start route.

**Artefacts to seed on the m10 VM (F13), restated for the build:** the `release_control` (kill-configuration) file in `release_host` root's home (flag 3; the disarm *action* stays at the core console); Tesseract's unsent vendor notice in `core_host` root's home (flag 4). Both are absent from the current draft XML.

### Game-side dependencies (concept level; detail in `VM_GATING_AUDIT.md` §A5, §B5)

Each gated flag needs a matching in-game found object holding the credential (catalogue slip in the reading-room drawer; Tomb Beta login on the salvage-cage binder; m10 monitoring tag at the gate console; release-host credential in the server hall; core key in the gallery). **m10 F13 reverses an Educational R1 decision** that removed the on-VM promises for the disarm and the notice — surface that to the user/orchestrator before the game edit.

### Build note

Fixing root login over SSH on `release_host` / `core_host` (existing build note) is part of F12 too: left in, it is a module-level cold route straight to flags 3 and 4.

**Target addresses are dynamic.** Both the m09 and m10 drafts assign addresses with `network_ip` (not static literals like m02's hard-coded target), so the game reads each target's address at runtime by VM title (m09 helper `vm_ip_for`; titles `catalogue_server`, `tomb_beta_server`, and for m10 `bunker_monitor`, `release_host`, `core_host`). The in-game finds must carry the target address alongside the login, or the player has a credential with no host to use it on (m09 blind-playtest finding). m09 is done; m10 still needs it — see `scenarios/FINALE_VM_GATING_HANDOFF.md` B8.

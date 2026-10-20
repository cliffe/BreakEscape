# Finale VM plan: m09 and m10

Scenario structure only: server names, module names, positions and account names. No exploit steps. Sources: FINALE_ARC §6, the two stage 0 files, VM_SHAPE.md, SECGEN_MODULE_PLAN.md (Finale section), and the SecGen scenarios named below. Nothing has been built, so positions are as the scenario files and module comments describe them.

## 1. m09 Digital Archaeology

**File:** `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`
**Attack box:** `attack_vm` (Kali). This is the field laptop, which the story calls the drop terminal in the reading room.

**Servers**

| Hostname | Story name | Built from | Flags |
|---|---|---|---|
| `catalogue_server` | the archive's catalogue server | `ctf/eventful_data.xml`, target system only | 2 |
| `tomb_beta_server` | Tomb Beta's last server | `ctf/nosferatu.xml`, pre-login flags removed | 2 |

FINALE_ARC §6.1 puts flags 1 and 2 on the catalogue and flags 3 and 4 on Tomb Beta's machine. One target cannot hold both owners, so the plan uses two. See §4.

**Flags, in submission order**

| # | Story meaning | Provided by | Account the student sees | Fit |
|---|---|---|---|---|
| 1 | Foothold on the catalogue server: the index, restricted series included | `catalogue_server`, the service account's home (user level) | the service account the module creates; name not fixed in the XML | Fits. User-level access is a foothold. |
| 2 | The ledger, with the legacy section and WREN | `catalogue_server`, root's home | root | Fits. Reached after flag 1. |
| 3 | The owner of Tomb Beta's server: enrolment and the credential | `tomb_beta_server`, the web service account's home (user level) | `nostromousr` | Needs R1. |
| 4 | Full control of Tomb Beta's server: the mirror job, the hour, the defences | `tomb_beta_server`, root's home | root | Fits. |

**Build notes**
- Neither box enables root login over SSH (both XMLs checked). Keep it that way.
- Nosferatu: remove the `strings_to_pre_leak` input, which carries the two pre-login flags. This also removes the encoded message the scenario description mentions. Either rewrite the description and lab sheet to match, or keep the encoded text as non-flag clue text. Decide at the build.
- The Eventful Data account name is not written in its XML. Read it from the built VM and record it in the mission notes.
- Rename both systems. The source files call them `server`.
- Attack box: add both IPs to the `IP_addresses` datastore, as `ctf/nosferatu.xml` and m08 do.

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

| # | Story meaning | Provided by | Account | Fit |
|---|---|---|---|---|
| 1 | Foothold on the bunker's security system | `bunker_monitor`, the monitoring service's home (user level) | `maltrail` (per VM_SHAPE, not checked in the module) | Needs R3. |
| 2 | The staging copy of the schedule: channels, first cities, early-access orders | `bunker_monitor`, the platform's threat-data store | same account as flag 1 | Needs R4. |
| 3 | The release host, out of the release service's container | `release_host`, root's home, after leaving the container | root. The student reaches it through one of two generated accounts. | Needs R5, R6. |
| 4 | Full control of the core host: the stolen copy and the live line to the vault | `core_host`, root's home, after leaving the jail | root. The core host has no named accounts. | Fits. |

Neither the container nor the jail holds a flag, as the scenario describes.

**Build notes**
- **Known issue 1, root login over SSH.** Both `release_host` and `core_host` enable root login over SSH with a generated password. A student who logs in as root skips the escape and reads both flags. Remove `ssh_root_login` from both systems. Remove the `hackerbot_access_root_password` datastore too. Its name suggests it came from a Hackerbot scenario. After the build, confirm that root login over SSH is refused.
- **Known issue 2, account count.** `release_host` generates three accounts, but the file's comment says two. Build two, matching the comment. The story has no third operative on this box. Fix the comment in the same edit.
- `bunker_monitor` keeps its service account and drops the privilege-escalation block. Otherwise the entry box carries three flags and the total is five.
- Rename the three systems. The source files call them `desktop` and `chroot_esc_server`.
- Four targets plus the attack box is the largest SAFETYNET build so far. m01 to m08 each have one target. Plan the build and test time accordingly.

## 3. Story-side rewordings

The designers apply these in FINALE_ARC and the two stage 0 files.

- **R1 (m09, FINALE_ARC §6.1 row 3; m09 stage doc §2.1 item 3).** The story says the machine "was enrolled with a staff credential issued to Dr Adrian Tesseract," and that the flag proves its owner. The flag string carries no name. Reword to: "Tomb Beta's server ran its enrolment under a web service account. The credential issued to Tesseract sits in that account's home, beside the flag." The name belongs in the credential text, not in the flag.
- **R2 (m09, FINALE_ARC §6.1 intro).** No reword needed if the two-machine plan stands. If the designers want one target, rows 1 and 3 must name the same machine, which is a larger change.
- **R3 (m10, FINALE_ARC §6.2 row 1).** "The camera and door controller in the security office" → "the security monitoring host that the camera and door systems report to." The VM host watches network traffic. The camera feeds, blast-door route and door log stay as in-game content.
- **R4 (m10, FINALE_ARC §6.2 row 2; m10 stage doc §2.1 item 2).** "Inside the release pipeline: the staging service" → "the staging copy of the schedule, kept on the security monitoring host." The channels, the first cities and the early-access orders are the text beside the flag.
- **R5 (m10, FINALE_ARC §6.2 intro and row 3; m10 stage doc §2.1).** The submission point conflicts. The intro says flags 3 and 4 are at the core's host terminal. Row 3 unlocks "the disarm action at the console", which is in the server hall. Reword so flag 3 is submitted at the server-hall console and flag 4 at the core host terminal.
- **R6 (m10, FINALE_ARC §6.2 row 3).** "Out of the release service's box onto the machine beneath it" → "out of the release service's container onto the release host beneath it." The VM runs the release service in a container on that host.

## 4. Choices and assumptions

- **Choice, m09 two machines.** The story already gives the catalogue and Tomb Beta different owners. One reworded box would merge them, which is a bigger story change than two boxes.
- **Choice, m10 entry stage from Off the Trail.** One spare box with two flags, instead of two single-flag spares (Disastrous Development and Catching Sparks). The cost is R3 and R4, which move the release pipeline onto a monitoring host. Disastrous Development is out of the plan. VM_SHAPE says its flag sits at the service's privilege level, while SECGEN_MODULE_PLAN says its module lands as root. That conflict needs checking if the option is reopened.
- **Choice, two accounts on `release_host`.** This follows the file's comment, not the three it defines.
- **Assumption.** The positions above come from the scenario files and comments. Nothing has been built, and the module behaviour is unchecked. The first build must confirm that the trimmed Nosferatu and Off the Trail boxes still run.
- **Noticed, not acted on.** The `hackerbot_access_root_password` datastore is a leftover name. Removing it is in the build notes, and no other scenario is changed.

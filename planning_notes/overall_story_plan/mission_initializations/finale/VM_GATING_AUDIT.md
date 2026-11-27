# VM gating audit: m01–m10

Date: 2026-10-22. Author: audit sub-agent (Opus 4.8), tasked from the F12/F13 ruling in `scenarios/FINALE_DEV_LOG.md` (lines 487–490).

## What this checks

The user's ruling (F12/F13, 2026-10-22):

- **F12** — VM progress must be gated behind information found in the game. The model is m01: the player can reach Kali early, but needs Derek's/Kevin's password list, which sits behind in-game puzzles. A player must never hold a flag they cannot yet submit.
- **F13** — the VM should also hold the story artefacts the game leans on, as m01's VM holds the launch code. For m10, seed the "disarm" and Tesseract's unsent vendor notice on the VM.

For every flag in m01–m10 I record:

- **(a) Gate** — what VM-side prerequisite gates the flag, and whether that prerequisite comes from an **in-game find** (the good pattern) or is **reachable cold** (just the Kali box, no in-game information).
- **(b) Early-flag risk** — whether the flag can be obtained from the VM before its submit station is reachable or submittable in the game (the bad pattern F12 forbids).
- **(c) Story artefacts** — which artefacts the game references as being on the VM, and whether they exist there.

Evidence is cited as `file:line`. Game files are under `BreakEscape/`; SecGen XMLs under `SecGen/scenarios/break_escape/safetynet/`. `S` in a mission's tables = that mission's `scenario.json.erb`.

## Headline

| Mission | Flags gated by an in-game find | Reachable cold | Early-flag risk | F13 artefacts on VM |
|---|---|---|---|---|
| m01 First Contact | **4 / 4** | 0 | none | yes (decryption key, launch code) |
| m02 Ransomed Trust | 1 / 4 (soft) | 3 | none | yes (as flags) |
| m03 Ghost in the Machine | 0 / 4 | 4 | none | yes (as flags) |
| m04 Critical Failure | 0 / 4 | 4 | none | yes (as flags) |
| m05 Insider Trading | 0 / 4 (+bonus) | 4 | none | yes (as flags) |
| m06 Follow the Money | 0 / 4 | 4 | none | yes (as flags) |
| m07 Architect's Gambit | 0 / 4 | 4 | none | none distinct |
| m08 The Mole | 0 / 4 | 4 | none | yes (as flags) |
| **m09 Digital Archaeology (draft)** | 0 / 4 | 4 | **yes** (Tesseract-name peek; VM live from Act 1) | partial (memo + notice seeded; index + ledger body not) |
| **m10 Full Disclosure (draft)** | 0 / 4 | 4 | **yes** (flags 2–4 obtainable before their stations; climax rootable at start) | **no** (disarm + notice not seeded) |

The pattern the user wants is used fully only in **m01**, and partly (one soft gate) in **m02**. Every mission from m03 on is a self-contained pentest box the player can solve cold. In the shipped missions (m03–m08) this does not break F12's hard rule, because the VM launcher and the flag station share one locked room, so VM access and submission open together — a player cannot start the box before the station exists. The two unbuilt finale missions (m09, m10) are where F12's hard rule is actually at risk, and where F13's artefact seeding is incomplete.

---

## m01 First Contact — the gold standard (shipped)

VM `shatter_server` (+ Kali). SecGen: `m01_first_contact.xml`.

| # | Flag / station | (a) Gate: in-game find or cold | (b) Early-flag | (c) Artefact on VM |
|---|---|---|---|---|
| 1 | SSH / decryption key — submitted at the Encrypted Archive safe (S:2093-2095), sets `ssh_flag_submitted` | **In-game find.** derek's SSH password is one of a 27-word custom list picked at build (`m01_first_contact.xml:84-114`); the matching "My Passwords" list, the server IP and the username `derek` are in Derek's Safe (S:1293, S:1296-1304, PIN 1337 from a base64 note in Derek's office opened by Kevin's lockpick, S:1937-1946). Picking up "My Passwords" sets `password_list_found` and HaX names the Hydra use (S:759-768). Not crackable cold (custom wordlist). | Station in `server_room` (rfid, Kevin's keycard; S:2036-2038); launcher co-located. No early submit. | `DECRYPTION_KEY` = flag, opens the ENTROPY archive in-game (S:2098). Flag. |
| 2 | Linux / directory-traversal — drop-site terminal (S:2059-2085), `linux_flag_submitted` | Transitively gated: needs flag-1 derek session, no further find. (`m01_first_contact.xml:119-142`) | co-located; none | `operation_shatter/deployment_notes` (S:2077). Flag. |
| 3 | Launch code — goes into the ENTROPY Launch Device held by Derek (S:1390-1393), `launch_code_submitted` | Transitively gated: `~/launch_code/launch_flag` in the shatter account, reached by sudo from derek (`m01_first_contact.xml:156-160`). Device gated behind `ssh_flag_submitted` → `confront_derek` aim (S:427-431). | Device only after flag 1; none | `~/launch_code/launch_flag` = flag **and** the story artefact dropped into Derek's device (S:952, S:990). Flag + artefact. |
| 4 | Sudo / encoded config — drop-site terminal, `sudo_flag_submitted` | Transitively gated: `shatter_configuration` in the shatter account via sudo from derek (`m01_first_contact.xml:161-207`). | co-located; none | `shatter_configuration` base64 (S:2083). Flag. |

**Why it is the model:** flag 1's SSH password cannot be brute-forced cold (custom 27-word list), and the list is an in-game find behind two puzzles (Derek's office key via Kevin's lockpick → 1337 PIN → Derek's Safe). Flags 2–4 chain off that foothold on the VM. Two flag artefacts (decryption key, launch code) double as story objects the game consumes.

**Build-consistency note (shipped, verify once):** the in-game "My Passwords" list must contain the one password the SecGen `string_selector` picks (`m01_first_contact.xml:84-114`). If the list and the selector drift, flag 1 becomes unsolvable. Worth a spot check; not changed here.

---

## m02 Ransomed Trust — one soft gate (shipped)

VM `hospital_backup_server` (+ attack_vm). SecGen: `m02_ransomed_trust.xml`.

| # | Flag / station | (a) Gate | (b) Early-flag | (c) Artefact |
|---|---|---|---|---|
| 1 | SSH (gary) — drop-site `flag_station_dropsite`, `server_room` (S:2269-2271, rfid Gary's card) | **In-game find, soft.** gary's password is the literal `Hospital1987` (`m02_ransomed_trust.xml:141-149`, comment confirms the in-game clue). Found on Gary's sticky note `Emma2018 / Hospital1987 / StCatherines` (S:2144-2153) and his workstation SSH notes name host + account (S:2118-2124). **But** the sticky note is `puzzle_graph_optional:true` (S:2154) and `Hospital1987` is weak enough to fall to a default wordlist — so a cold brute is plausible. | Launcher + station co-located in `server_room`; none | — |
| 2 | ProFTPD backdoor (root) | **Cold.** Unauthenticated RCE backdoor (`m02_ransomed_trust.xml:238`). | co-located; none | Equipment deployment log: insider unpaid, PIN cracker in the sealed case, badge SC-4471, ransom (`...xml:241-287`). Flag. |
| 3 | Anonymous-FTP notice | **Cold.** Pre-login over anonymous FTP (`...xml:290-312`). | co-located; none | Backup-server notice / restore catalogue pointer. Flag. |
| 4 | Anonymous-FTP encoded log | **Cold.** Pre-login, encoded (`...xml:314-344`). | co-located; none | Ghost's operational log, names badge SC-4471 (`...xml:316-341`). Flag. |

**Verdict:** flag 1 is the only in-game-gated flag and the gate is soft (optional note, guessable password). Flags 2–4 are cold by design (the credential-less backdoor and two pre-login FTP flags). No early-flag risk — the box can only be reached once Gary's keycard opens the server room, where the station sits.

---

## m03 Ghost in the Machine (shipped) — all cold

VM `ghost_in_machine_vm_network` (+ attack_vm). SecGen: `m03_ghost_in_the_machine.xml`.

| # | Flag | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Network-scan token | **Cold.** In the FTP login banner + web index source, visible to any scan (`m03...xml:112-148, 184-197`). | — |
| 2 | FTP intel (root) | **Cold.** ProFTPD backdoor, unauth RCE (`...xml:133-178`). | FTP box notes. Flag. |
| 3 | Price list | **Cold.** ROT13 in the public web source (`...xml:199-220`). | Zero Day price list. Flag. |
| 4 | distcc log (root) | **Cold.** distcc exec CVE-2004-2687, unauth, high port (`...xml:228-251`). | Transaction log, invoice ZDS-2024-0847, matches the m02 buyer copy (`...xml:230-248`). Flag. |

**(b)** Station + launcher in `server_room` (rfid, Victoria clone; S:1467-1469), and the aim is gated behind `clone_call_done` (night; S:266). No early-flag risk. **Verdict:** pure cold CTF box; good story artefacts, but zero in-game gating.

---

## m04 Critical Failure (shipped) — all cold

VM `bms_jump_server` (+ kali). SecGen: `m04_critical_failure.xml`.

| # | Flag (station `flag_station_dropsite`, S:1771-1818) | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Rack status page | **Cold.** Public web page (`m04...xml:89-109`). | Falsified rack status. Flag. |
| 2 | FTP intel (root) | **Cold.** ProFTPD backdoor (`...xml:114-124`). | OptiGrid coordination notes. Flag. |
| 3 | Privesc (root file) | **Cold.** sudoedit CVE-2023-22809 (`...xml:130-137`). | `bms_calibration_override` (charge-ceiling override). Flag. |
| 4 | Erlang/OTP SSH RCE | **Cold.** Pre-auth RCE on port 2222 (`...xml:143-153`). | OptiGrid operator notes. Flag. |

**(b)** Station + launcher in `engineering_workshop` (rfid, Relay's card; S:1732-1734). No early-flag risk. The only credential handed over is the Kali post-it `kali/kali` (S:1766-1767). **Verdict:** all cold; no in-game gating.

---

## m05 Insider Trading (shipped) — all cold, self-contained chain

VM `qdc_research_server` (+ attack_vm). SecGen: `m05_insider_trading.xml`.

| # | Flag (station `flag_station_evidence`, S:1810-1845) | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Leaked Bludit creds | **Cold.** Admin creds leaked in a pre-login handover note on the VM itself (`m05...xml:152-164`). | Handover note (named again in the in-game manifest, S:2294). Flag. |
| 2 | Upload RCE | **Cold.** Authenticated upload RCE using the creds from flag 1's note (`...xml:148-178`). | — |
| 3 | Manager home | **Cold.** Reached via the RCE shell (`...xml:181-238`). | Torres's staging manifest, badge #4471, the confession notes (`...xml:201-231`). Flag. |
| 4 | Root (Architect auth) | **Cold.** sudo_root_less (`...xml:240-289`). | The Architect's acquisition authorisation + casualty projection (`...xml:245-284`). Flag. |
| B | Bonus zip | **Cold.** Zip password = manager's name (`...xml:292-312`). | — |

**(b)** Station + launcher in `server_room` (password `quantum2024` from Owen's note + hallway badge; S:78, S:1790-1791). The server-room password is an in-game find, but it gates the **door**, not the VM. No early-flag risk. **Verdict:** all cold; rich story payload, no VM gating.

---

## m06 Follow the Money (shipped) — all cold

VM `hackme_crack_me_lab` (+ kali_cracker). SecGen: `m06_follow_the_money.xml`.

| # | Flag (station `flag_station_financial`, S:1997-2050) | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | First account cracked | **Cold.** Druid RCE → world-readable shadow → crack a weak password from the standard John list (`m06...xml:106-159, 274-286`). | — |
| 2 | Credential reuse | **Cold.** Same weak password reused (`...xml:161-187`). | Reuse note. Flag. |
| 3 | Financial DB account | **Cold.** Weak password (`...xml:189-216`). | Transaction ledger (ENTROPY wallets, Architect fund); flag-3 reward hands the game the data-centre PIN 3110 (S:~2031). Flag. |
| 4 | Vault (privesc) | **Cold.** Strong password, reached by `hcops` sudo; `hcops` password is `password` (`...xml:130-140, 218-237`). | Cold-storage recovery keys. Flag. |

**(b)** Station + launcher in `server_room` (password `bitcoin2025`; S:~1976). Note the reverse coupling: flag 3's reward feeds the in-game data-centre PIN (fine, opposite of F12). No early-flag risk. **Verdict:** all cold; no VM gating. The in-game `Rack Inventory Sheet` (S:2055-2066) names VM facts but is an optional clue, not a gate.

---

## m07 Architect's Gambit (shipped) — all cold, VM leaks its own creds

VM `scada_attack_host` (+ attack_vm). SecGen: `m07_architects_gambit.xml`.

| # | Flag (station `flag_station_safetynet_relay`, S:1910-1923) | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | NFS overshare | **Cold.** World-readable NFS export leaks the username + flag (`m07...xml:124-130`). | Operator account name. Flag. |
| 2 | nc listener | **Cold.** A listener on a random port hands out the password + flag (`...xml:132-148`). | Operator password. Flag. |
| 3 | User login | **Cold.** SSH with the username (flag 1) + password (flag 2), both from the VM (`...xml:151-171`). | — |
| 4 | Root via sudo awk | **Cold.** sudo_root_awk (`...xml:173-177`). | — |

**(b)** Station + launcher in `server_room` (rfid badge). No early-flag risk. Reverse coupling: flag 2's capture also yields `scada_password` for an in-game door. **Verdict:** all cold; the VM supplies its own credentials; no distinct story artefacts.

---

## m08 The Mole (shipped) — all cold, self-contained chain

VM `safetynet_gitlist_server` (+ attack_vm). SecGen: `m08_the_mole.xml`.

| # | Flag (station `flag_station_evidence_relay`, S:1841-1848) | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Repository exposure | **Cold.** GitList 0.4.0 arg-injection RCE, no auth (`m08...xml:153-165`). | Ops username. Flag. |
| 2 | Stashed credentials | **Cold.** Password committed in repo history (`...xml:167-171`). | Committed password. Flag. |
| 3 | Home / correspondence | **Cold.** SSH with the recovered creds (`...xml:179-224`). | ENTROPY correspondence (architect@entropy.onion). Flag. |
| 4 | Root via sudo apt-get | **Cold.** sudo_root_apt_get (`...xml:229-265`). | The Architect's authorisation: Nightshade, Portland, "Destination: Tomb Gamma" (`...xml:234-260`). Flag. |

**(b)** Station + launcher in the server room (rfid, Netherton's badge or printed badge PIN 0311). No early-flag risk. **Verdict:** all cold; strong story artefacts (all as flags); no VM gating.

---

## m09 Digital Archaeology (draft, not built) — all cold, early-peek risk

VMs `catalogue_server`, `tomb_beta_server` (+ attack_vm). SecGen draft: `m09_digital_archaeology.xml`.

| # | Flag / station | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Catalogue index — `drop_terminal`, reading_room (S:1525-1541) | **Cold.** apache_druid_rce, unauth RCE on a random port (`m09...xml:136-143`). No in-game find. | Catalogue index — **not seeded on VM** (XML carries the flag string only; game drop screen prints Series R, R-114–R-161, bay 10 at S:1566). |
| 2 | Initiative ledger — same station (S:694) | **Cold (transitive).** sudo_root_more from flag 1 (`...xml:146-153`). | Ledger body (23 placements, 47 candidates, WREN day-10, H&L file `HL2015-0477`) — **not seeded** (the H&L door code `HL2015-0477`, S:36, must live only inside this root file; see `M09_PUZZLE_VM_ANSWERS.md` Q1). |
| 3 | Tomb Beta owner — `tomb_beta_station`, salvage_cage (S:2340-2356) | **Cold.** nostromo_code_exec, unauth RCE (`...xml:179-225`). No in-game find. | Tesseract staff credential, **seeded** (`...xml:191-198`); Albion memo + unsent vendor notice **seeded** (`...xml:202-223`). |
| 4 | Tomb Beta control — same station | **Cold (transitive).** sudo_root_less from flag 3 (`...xml:229-246`). | Mirror job to Tomb Gamma, 06:00 UTC, 04:00 head start, defences list — **seeded** (`...xml:236-241`). |

**(b) Early-flag risk — real.** Both server IPs are on the single Kali from Act 1 (`STAGE_8_VM_ANSWERS.md`, carried into `M09_PUZZLE_VM_ANSWERS.md` D1). The `drop_terminal` (flags 1–2) sits in the reading room, reachable by an open route early (S:1509, route B). The `tomb_beta_station` (flags 3–4) is well gated physically — behind flag 1 → restricted stacks → flag 2 → Recruiter call → deck choice → Sorensen's office → safe → tape card → tape room → keypad decode → salvage cage. But **a fast player can read Tesseract's name off `tomb_beta_server` (flag-3 foothold) before the identity scene plays it** (`M09_PUZZLE_VM_ANSWERS.md` D1), and can hold flags 3/4 before reaching their station. This is the F12 bad pattern plus a story-spoiler.

**Verdict:** F13 artefacts partly present (memo + notice + credential + mirror job seeded; index and ledger body not). F12 not met — four cold flags, a live-from-Act-1 box, and a name-peek before the reveal. Fixes in §A below.

---

## m10 Full Disclosure (draft, not built) — all cold, climax rootable at start

VMs `bunker_monitor`, `release_host`, `core_host` (+ attack_vm). SecGen draft: `m10_full_disclosure.xml`.

| # | Flag / station | (a) Gate | (c) Artefact |
|---|---|---|---|
| 1 | Monitoring foothold — `gate_terminal`, forward_post (start room, no lock; S:2533-2551) | **Cold.** maltrail_rce, unauth command injection (`m10...xml:156-186`). No in-game find. | Monitor status. Flag. |
| 2 | Staging schedule — `release_console`, server_hall (S:3561-3578) | **Cold (transitive).** Same box as flag 1, in the threat-data record (`...xml:171-185`). | Schedule (channels, cities, early-access orders) seeded in the record (`...xml:179`); the game also renders it from game state (`schedule_terminal`, S:3593-3617). Flag + text. |
| 3 | Container escape — `sealed_hatch`, server_hall (S:3623-3638) | **Cold.** nc_backdoor_docker_esc (`...xml:281-288`). No in-game find. | `docker_flag` only. **The "disarm" is NOT seeded** on `release_host` (XML seeds just the flag; the game removed the on-VM promise in Educational R1). |
| 4 | Core escape — `core_host_terminal`, core (S:4151-4165) | **Cold.** nc_backdoor_chroot_esc (`...xml:317-324`). No in-game find. | `chroot_flag` only. **Tesseract's unsent notice is NOT seeded** on `core_host`; the game names it (via HaX + the `core_files` prop, S:4177-4190) but no line promises a file on the box, and the XML has none. |

**(b) Early-flag risk — the worst case.** All three target boxes are on the one Kali, reachable from the start room (`forward_post`). The stations are progressively gated by room locks and `hintOnlyFlags` stops wrong-station submits (S:96-100), so a player cannot *submit* flag 4 early. But they **can obtain the flag string** for flags 2, 3 and especially flag 4 (core_host, the chroot escape) from the Kali at the very start — the whole climax root is available cold before any story beat. Holding the final flag in your pocket before meeting Tesseract is exactly what F12 forbids.

**(c) F13 gap — direct.** The 2026-10-22 ruling asks for the disarm on the release host and the unsent notice on the core host. Neither is seeded in the draft XML. Note the tension: the m10 Educational R1 pass deliberately **removed** the game lines promising "the disarm" and "the notice" are on the VM (`ink/m10_phone_agent0x99.ink:539` comment; `ink/m10_tesseract.ink:189` comment; `CONTRACT.md:1173`). F13 reintroduces them as VM artefacts, so the game side must re-add a story reference (concept hand-off in §B). This is a conflict for the user/orchestrator to confirm, not something to resolve silently.

**Verdict:** F12 not met (four cold flags, climax rootable at start); F13 not met (disarm + notice absent). Fixes in §B below.

---

# §A. m09 proposed fixes

Nothing is built, so these are plan changes. The design keeps each taught exploit as the **foothold** and makes an **in-game find** the thing you need to **read the flag** — the m01 shape (reach the box, but you still need what the game hides). It also closes the Tesseract name-peek.

### A1. Flag 1 (catalogue foothold) — gate on an in-game catalogue credential

- **VM-side (SECGEN_DRAFT_NOTES / FINALE_VM_PLAN):** flag 1 and the catalogue-index text move into a **catalogue service account whose shell login password is fixed to an in-game string** (the m02 `Hospital1987` mechanism). The Druid foothold stays as the way onto the box but lands unprivileged and cannot read that account's `0600` home; reaching flag 1 requires logging in with the found password. Seed the catalogue-index body (Series R, R-114–R-161, restricted cage, bay 10) in that account's home so it matches the drop screen (`M09_PUZZLE_VM_ANSWERS.md` D3).
- **Result:** no in-game credential → no flag 1. Not crackable cold (the password is a fixed non-dictionary string the game owns).

### A2. Flag 2 (ledger, root) — keep VM-internal, seed the ledger body

- Stays a privilege step from flag 1 (`sudo_root_more`); transitively gated, m01-style. Seed the ledger body **and the H&L file number `HL2015-0477`** inside flag 2's root-home file only — never on the flag-1 index or any pre-login page (`M09_PUZZLE_VM_ANSWERS.md` Q1).

### A3. Flag 3 (Tomb Beta owner) — gate on a find in the salvage cage; this also kills the name-peek

- **VM-side:** flag 3, the Tesseract credential, the Albion memo and the unsent notice move into a **web service account whose login password is fixed to an in-game string**. The nostromo foothold stays as the route on but lands unprivileged; reading flag 3 and the credential requires the found password. `strings_to_pre_leak` stays empty (no pre-login name).
- **In-game find:** the web service account's password lives on the **enrolment binder in the salvage-cage crate** (already `scenarios/m09_digital_archaeology/scenario.json.erb` S:2395-2425) — a place the player can only reach after the full salvage-cage chain (flags 1+2, Recruiter, safe, tape room, keypad). Because the password is only available there, the player cannot read Tesseract's name on the box until they are at the point the story reveals it. **This fixes F12 and the D1 early-peek in one move.**

### A4. Flag 4 (Tomb Beta control) — keep VM-internal, seed the mirror job

- Stays a privilege step from flag 3 (`sudo_root_less`); transitively gated. Mirror-job text already seeded (`...xml:236-241`); no change beyond confirming Tomb Gamma is named as a target only, no route (plan item M6).

### A5. Game-side hand-off for m09 (concept level — no VM/technique detail)

For the game builders. Add two in-game finds and one line; no exploit, command or technique:

1. **Catalogue account password (gates flag 1).** Put a **sticky note / login slip in the reading-room drop-desk drawer** holding the catalogue service account's name and password. Gate its readability behind the existing reading-room access (Noor's card / front desk) so it is a found object, not free. The **drop-screen hint and HaX's flag-1 steer should name the account** so the player knows which login the note is for. (Mirrors the user's own example.)
2. **Tomb Beta account password (gates flag 3, fixes the name-peek).** On the **enrolment binder already in the salvage-cage crate** (S:2395-2425), add the web service account's name and password as a readable line. HaX's flag-3 steer should point the player at "the enrolment record in the cage" for the login. Because the cage is the end of the long chain, this guarantees flag 3 cannot be taken before the identity scene.
3. Keep HaX's steers conceptual (as they already are). No change to the memo/notice tasks.

---

# §B. m10 proposed fixes

Same shape: exploit stays the foothold; an in-game find is required to read the flag. This also seeds the two F13 artefacts.

### B1. Flag 1 (monitoring foothold) — gate on a find at the forward post

- **VM-side:** flag 1's file moves into a **monitoring platform account whose login is fixed to an in-game string**; the maltrail command-injection stays as the way on but lands unprivileged. Reading flag 1 requires the found login.
- **In-game find:** a **maintenance tag / credential at the gate console** in the forward post (the "field console beside it" HaX already nudges about, S:1620). Available at the start, like m01's password list — found, not free.

### B2. Flag 2 (staging schedule) — keep VM-internal, seed the schedule

- Stays on `bunker_monitor` behind the flag-1 foothold; transitively gated. Seed the channel list, the cells' early-access orders and the first entries by city in the threat-data record (already drafted at `...xml:179`; this is FINALE_VM_PLAN M4). City choices decided (F28, 2026-10-23): Seattle first (hospital group, infusion pumps), Austin second (county, dispatch software), Cleveland third (a water utility, controllers); no real utility company named.

### B3. Flag 3 (container escape) — gate on a find in the server hall; seed the DISARM (F13)

- **VM-side:** reaching the release-host root (flag 3) requires an **in-game operative credential**; the container bind shell stays as the foothold but the host root is reached with the found credential, not cold. **Seed a `disarm` file in `release_host` root's home** beside flag 3 (F13), carrying the disarm text the story leans on.
- **In-game find:** a **release-host operative credential in the server hall / workshop**, behind the power-room card chain that already gates the hall (S:3245-3247). The player reaches it only after flags 1–2.

### B4. Flag 4 (core escape) — gate on a find from the gallery/Tesseract; seed the NOTICE (F13)

- **VM-side:** reaching the core-host root (flag 4) requires an **in-game key fragment / credential**; the chroot bind shell stays as the foothold. **Seed Tesseract's unsent vendor notice in `core_host` root's home** beside flag 4 (F13), plus the stolen-copy / Citadel-vault line the `core_files` prop names (S:4177-4190). This removes the ability to root the climax box cold at game start.
- **In-game find:** a **core-host access key in the gallery** (alongside the existing `vos_code_card` / `gallery_code_card`, S:3734/3758) or handed by Tesseract — available only after flags 2–3 and the gallery stair. The player cannot obtain flag 4 before the climax.

### B5. Game-side hand-off for m10 (concept level — no VM/technique detail)

For the game builders. Four in-game finds and a decision to surface to the user:

1. **Monitoring login (gates flag 1).** Add a **maintenance tag/credential at the gate console** in the forward post naming the monitoring account. HaX's monitoring steer should name the account.
2. **Release-host credential (gates flag 3).** Add an **operative credential object in the server hall or workshop** (behind the power-room card). HaX's hatch steer should point at it.
3. **Core-host access key (gates flag 4).** Add a **core access key in the gallery** (or have Tesseract hand it at the core door), available only after the gallery stair. HaX's core steer should point at it.
4. **Re-add the two VM-artefact references (F13).** The Educational R1 pass removed the lines that said the **disarm** is on the release host and the **unsent notice** is on the core host. F13 (2026-10-22) asks for both to be seeded on the VM, so the game needs a story reference again — e.g. HaX's hatch steer naming the disarm on the release host, and Tesseract/HaX naming the notice as sitting on the core host. **Flag this conflict to the user/orchestrator before the game edit:** F13 reverses an Educational R1 decision, and the wording should be chosen so it reads as "found on the box" without becoming an exploit hint.

---

# §C. m01–m08 (shipped) — where the pattern is missing, and the smallest fix

Hard rule (no flag before its station) holds in all eight: the VM launcher and the flag station share one locked room, so VM access and submission open together. The **good F12 pattern (an in-game find the VM genuinely needs) is used only in m01, and softly in m02.** m03–m08 are solvable cold. These are shipped, so nothing is changed here; the smallest retrofit for each, if the user later wants the pattern spread:

- **m02** — harden the one soft gate: make gary's SSH password a non-dictionary string the game owns (not `Hospital1987`), and make the sticky note non-optional, so flag 1 cannot be brute-forced cold. (`m02_ransomed_trust.xml:141-149`; S:2144-2154.)
- **m03** — gate one flag on a find: e.g. require an in-game-found credential to reach the distcc box (flag 4), or put the price-list decode key in-game. Currently all four answer a scan. (`m03...xml:228-251`.)
- **m04** — gate the Erlang foothold (flag 4) or the sudoedit account (flag 3) on an in-game credential (e.g. the "maintenance crew" account password found in the workshop), rather than a cold pre-auth RCE. (`m04...xml:130-153`.)
- **m05** — stop leaking the Bludit admin creds on the VM itself; move the handover-note credential to an in-game find so flag 1 is not cold. The in-game manifest already names `handover_note.txt`, so the hook exists. (`m05...xml:152-164`; S:2294.)
- **m06** — one of the weak service passwords could be replaced with a non-dictionary string handed over in-game (Volkova's list already exists but is pointed at the doors, not the VM; S:1116). That would gate flag 1 instead of leaving it to the standard John list. (`m06...xml:106-159`.)
- **m07** — the VM leaks its own username (NFS) and password (nc listener). Move one of those two to an in-game find so flags 1–3 are not fully self-contained. (`m07...xml:124-148`.)
- **m08** — the mole's SSH password is committed in the repo (flag 2 → flag 3 cold). Require an in-game-found passphrase to decrypt the committed credential, or move the credential to an in-game find. (`m08...xml:139-175`.)

Each is a single-flag change; none is urgent, because the room-lock co-location already prevents the F12 hard-rule violation in shipped missions.

---

# §D. Cross-cutting build items (for the m09/m10 build, carried from the plan)

- Remove root login over SSH on `release_host` and `core_host`, and the `hackerbot_access_root_password` datastore (FINALE_VM_PLAN build notes; else a player SSHes straight to root and skips everything — a second, module-level cold route).
- `release_host`: build two accounts, not three (XML seeds `tiaspbiqe2r` and `test` — the `test` password is trivially weak and should become one of the gated in-game credentials above, not a free login).
- Seed the m09 catalogue index and ledger body (A1, A2); seed the m10 schedule, disarm and notice (B2–B4).
- Confirm `strings_to_pre_leak` empty actually suppresses the nostromo pre-login text (SECGEN_DRAFT_NOTES "Not verified").

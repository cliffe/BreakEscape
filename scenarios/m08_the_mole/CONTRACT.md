# m08 "The Mole" — Identifier Contract

Authoritative list of every fixed identifier in this mission. Anything in
`scenario.json.erb` or the ink that names an NPC, room, object, global, flag,
task or knot is fixed here. **Do not rename without updating this file.**

Continuity: m08 opens on the m07 closer (`found_mole_evidence` → "the leak was
the agent"). The traitor is **Agent 0x47 "Nightshade"**, a placed insider of
ENTROPY's **Insider Threat Initiative** (see
`story_design/universe_bible/03_entropy_cells/insider_threat_initiative.md`).

---

## 1. NPCs

| id | displayName | type | room | sprite | voice | role |
|---|---|---|---|---|---|---|
| `opening_briefing_cutscene` | ATHENA | person (hidden) | main_lobby | female_office_worker | Kore | opening cutscene, fires on `game_loaded` |
| `receptionist_ai` | ATHENA | person | main_lobby | female_office_worker | Kore | standing console; redundant source for archives pw + safe PIN |
| `agent_0x99` | Agent HaX | phone | main_lobby | (avatar female_hacker_hood) | Aoede | **support hub**, VM hints, field guides, KO acks, flag→global bridges |
| `director_netherton` | Director Magnus Netherton | person | director_office | male_spy | Charon | briefing; gives all-zones keycard; holds safe combo |
| `agent_cipher` | Agent 0x23 'Cipher' | person | operations_floor | male_nerd | Iapetus | red herring (innocent) |
| `background_analyst` | Junior Analyst | person | operations_floor | female_office_worker | Kore | bark, no state |
| `agent_phantom` | Agent 0x88 'Phantom' | person | intel_analysis | male_spy | Fenrir | red herring (innocent, off-book hunter) |
| `agent_nightshade` | Agent 0x47 'Nightshade' | person | cryptography_lab | **male_scientist** | Charon | the mole, pre-reveal interview |
| `nightshade_confrontation` | Agent 0x47 'Nightshade' | person (hidden) | interrogation_room | **male_scientist** | Charon | confrontation; reveals on room entry + `all_flags_submitted` |
| `agent_0x99_person` | Agent HaX | person | break_room | female_hacker_hood | Aoede | in-person emotional beat, no task |
| `background_agent` | Off-Duty Agent | person | break_room | male_office_worker | Puck | bark, no state |
| `closing_debrief` | Director Magnus Netherton | person (hidden) | break_room | male_spy | Charon | debrief; reveals on `mission_complete` |

Player: `player` / Agent 0x00 / `male_hacker_hood_down`. Narrator voice: Algenib.

**Nightshade sprite is `male_scientist` in every appearance** (m08 and the
m02–m06 seed briefings), for character consistency.

---

## 2. Rooms and the lock chain

`startRoom: main_lobby`. Connections (all reciprocal):

- main_lobby — N director_office, E operations_floor, W cryptography_lab
- operations_floor — N intel_analysis, E server_room, S security_archives
- cryptography_lab — S interrogation_room, W break_room

### Lock table — every gate has a redundant source (no KO strands the run)

| Lock | Room/object | requires | Primary source | Redundant source |
|---|---|---|---|---|
| rfid | server_room | `server_zone_badge` | Netherton's keycard (briefing) | badge printer clone (main_lobby) |
| password | security_archives | `TrustNoOne` | post-it (break_room) | ATHENA facilities log (main_lobby) |
| pin | director_safe | `2407` | Nightshade personnel record (ops floor) | ATHENA (main_lobby) |
| key | interrogation_room | `interrogation_key` | key inside director_safe | lockpick (start inventory) |

`2407` = Nightshade's service number (a policy-violation default nobody fixed).

---

## 3. Object ids

- main_lobby: `badge_printer` (redundant rfid), `security_notice`
- director_office: `suspect_dossiers`, `director_safe` (pin) → `interrogation_key`, `nightshade_profile`
- operations_floor: `nightshade_personnel_record` (safe PIN source), `operations_board`
- intel_analysis: `tactical_board` (sets `database_theft_understood`), `phantom_notes` (sets `found_phantom_lead`)
- server_room: `vm_launcher_gitlist`, `flag_station_evidence_relay`, `server_access_logs`
- security_archives: `database_catalog` (sets `found_database_catalog`, `database_theft_understood`), `historical_leaks`
- cryptography_lab: `cyberchef_workstation`, `nightshade_desk` (pc) → `encrypted_backup` (base64+rot13), `deep_state_manual`
- interrogation_room: `evidence_display`, `disposition_terminal` (fate terminal)
- break_room: `password_sticky_note` (archives pw), `timeline_reconstruction`

---

## 4. VM, flags, field guides

SecGen scenario: **`m08_the_mole`**
(`SecGen/scenarios/break_escape/safetynet/m08_the_mole.xml`, derived from the base
`ctf/such_a_git.xml`). VM system_name for flags: **`safetynet_gitlist_server`**.
Attack box: `attack_vm` (Kali). Game `mission.json` → `secgen_scenario: m08_the_mole`.

| flag | narrative | flagReward setGlobal | HaX-derived global |
|---|---|---|---|
| safetynet_gitlist_server:flag_1 | GitList arg-injection RCE (no login) | `flag1_submitted` | `found_gitlist_vuln` |
| safetynet_gitlist_server:flag_2 | stashed credentials in repo history | `flag2_submitted` | `found_leaked_creds` |
| safetynet_gitlist_server:flag_3 | proper login → home-dir ENTROPY mail | `flag3_submitted` | `found_architect_comms` |
| safetynet_gitlist_server:flag_4 | sudo apt-get → root → access logs | `flag4_submitted` | `found_access_logs`, `all_flags_submitted`, `mole_identified` |

> **Flag-order caveat:** the fallback strings render standalone; the real
> per-build order of `flags_by_vm['safetynet_gitlist_server']` **must be verified against a live
> SecGen build** so the right flag completes the right task.

Field guides (HaX `itemsHeld`, exposure-gated via `_guide_offered` eventMappings,
delivered from the hub `{x_guide_offered and not x_guide_hint_given}`):
`m08_recon_field_guide`, `m08_scanning_field_guide`, `m08_infoleak_field_guide`
(→ information-leakage-and-the-pin-oracle; closest real sheet),
`m08_vulnanalysis_field_guide`, `m08_privesc_field_guide`.

---

## 5. Aims and task ids

| aim | tasks (● required, ○ optional) |
|---|---|
| `take_the_brief` | ● `brief_with_netherton` |
| `work_the_suspects` (side) | ○ `interview_cipher` ○ `interview_phantom` ○ `interview_nightshade` |
| `get_into_the_repo` | ● `breach_server_room` ● `recover_gitlist_exposure` ● `recover_stashed_credentials` |
| `correlate_the_evidence` | ● `recover_home_flag` ● `escalate_to_root` ○ `read_the_archives` |
| `confront_the_mole` | ● `open_interrogation_room` ● `confront_nightshade` |
| `close_the_investigation` (missionConclusion, bond_visualiser, requiresCompleted `confront_nightshade`) | ● `decide_the_fate` (terminal) ● `take_the_debrief` |

Critical path: brief → repo → correlate → confront → close.
`work_the_suspects` is **entirely optional** — the case is made on the VM; the
interviews are the investigation's texture and the accusation autonomy layer.

---

## 6. Global variables (grouped)

- **Act:** `briefing_played`, `mission_complete`
- **Investigation/theory:** `cipher_interviewed`, `phantom_interviewed`, `nightshade_interviewed`, `suspect_theory` (""|cipher|phantom|nightshade), `cipher_alibi_known`, `phantom_alibi_known`, `nightshade_suspected`
- **Evidence latches:** `found_gitlist_vuln`, `found_leaked_creds`, `found_architect_comms`, `found_access_logs`, `found_nightshade_profile`, `found_deep_state_manual`, `found_database_catalog`, `database_theft_understood`, `found_phantom_lead`, `found_access_logs_hint`, `found_architect_comms_local`, `evidence_reviewed`, `found_timeline`
- **Lock latches:** `badge_cloned`, `safe_pin_found`, `archives_password_found`
- **VM:** `flag1_submitted`..`flag4_submitted`, `all_flags_submitted`
- **Resolution:** `mole_identified`, `nightshade_confronted`
- **Fate (XOR):** `nightshade_arrested`, `nightshade_triple_agent`; plus `tomb_gamma_location_known`
- **Debrief:** `debrief_stance` (""|defended|owned)
- **KO latches:** `netherton_ko`, `nightshade_ko`, `nightshade_confront_ko`, `cipher_ko`, `phantom_ko`
- **Guide gating:** `<recon|scanning|vulnanalysis|infoleak|privesc>_guide_offered` / `_hint_given`

---

## 7. Consequence wiring

- **Fate** is chosen in `m08_nightshade_confrontation.ink` (`nightshade_arrested`
  XOR `nightshade_triple_agent`, `#set_global`), and a KO of the confrontation NPC
  resolves it to **arrest** via a HaX eventMapping on `nightshade_confront_ko`
  (never left unset).
- **`mission_complete`** is written by the `disposition_terminal` (`decide_the_fate`)
  — a terminal, not a KO-able conversation — and re-asserted in the debrief.
- **Debrief** (`m08_closing_debrief.ink`) branches on fate, `suspect_theory`
  (did the player wrongly accuse an innocent?), `nightshade_suspected` (deduced
  him cold?), `debrief_stance`, and `database_theft_understood`.
- **Music `victory`** cue is held to `conversation_ended:m08_closing_debrief` so
  the `bond_visualiser` opens only after the debrief finishes.

---

## 8. KO resilience

Every named person NPC: `globalVarOnKO` set; every critical conversation-gated
task has `taskOnKO` (`director_netherton`→`brief_with_netherton`,
`nightshade_confrontation`→`confront_nightshade`, `closing_debrief`→`take_the_debrief`)
or an evidence-only path. Suspect interviews are optional (KO closes only side
content). HaX acks each KO and points at the redundant lock source.

---

## 9. Attribution rules

Inline `Speaker:` prefixes matching the `displayName` exactly (`Director Magnus
Netherton:`, `Agent HaX:`, `Agent 0x47 'Nightshade'`, `Agent 0x23 'Cipher'`,
`Agent 0x88 'Phantom'`, `ATHENA:`). Scene beats are `Narrator:`. `You:` for the
player. Choice brackets carry the player's actual words (no `You:` echo).

---

## PASS 2 amendments (supersede the sections above where they differ)

- **New globals:** `fate_decided`, `start_debrief_cutscene`, `debrief_played`, `accused_cipher`, `accused_phantom`, `accused_nightshade`.
- **closing_debrief** moved from `break_room` to `main_lobby` (always loaded). It opens on `conversation_closed:nightshade_confrontation`, `minigame_completed/failed`, or any `room_entered`, gated on `fate_decided` + all four `flagN_submitted`. It also hosts the `all_flags_submitted` latch. It no longer has `taskOnKO`, because it is hidden and can't be knocked down.
- **take_the_debrief** is now `custom` and completes on the debrief's last line. Room-entry backstops on `opening_briefing_cutscene` cover a reload.
- **disposition_terminal** is now a read-only `smartscreen` (textVariants). The fate is chosen in `m08_nightshade_confrontation.ink`, which completes `decide_the_fate` and sets `fate_decided`.
- **badge_printer** is now a PIN-locked `pc` (PIN `0311` on the break-room post-it) holding `printed_server_badge`.
- **Netherton's keycard** id is `netherton_keycard`, given by `#give_item:keycard:netherton_keycard`.
- **Safe PIN** `2407` is the Director's service number, shown in the "Requested by" line of `nightshade_personnel_record`. Nightshade's own number is `4719`.
- **Flag targets:** `flag_station_evidence_relay:safetynet_gitlist_server-flag1..4`.
- **KO reactions** are keyed on `npc_ko:<id>`. `nightshade_confront_ko` resolves to arrest only through HaX's `npc_ko:nightshade_confrontation` safety net.
- **Review round 2:**
  - `open_interrogation_room` deleted.
  - `read_the_archives` moved into `work_the_suspects`.
  - `interview_cipher/phantom/nightshade`, `breach_server_room` and `read_the_archives` are now `custom`, completed by brief-gated mapping pairs.
  - New globals: `brief_taken`, `server_room_entered`, `archives_entered`.
  - The psych evaluator is Dr S. Okafor.

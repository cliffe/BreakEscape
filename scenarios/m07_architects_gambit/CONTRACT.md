# m07 "The Architect's Gambit" — Identifier Contract

**Status:** WP1 deliverable. Committed. **This file is the single source of truth for every
identifier in the mission.** WP2–WP10 write against these names and must not invent alternatives.

**Authority order:** `PASS2_IMPROVEMENTS.md` (design rationale) → this file → `planning/mission_design.md` →
`planning/delegation_operations.md`. Where the rationale and this file disagree on a *name*, this file
wins, because the rationale does not name everything and consistency matters more than provenance.

**If you need an identifier that is not here, add it here first**, in the same commit as the code
that uses it. A name that exists in ink but not in this file is a bug.

---

## PASS 2 amendments (2026-10-01) — these supersede the sections below where they differ

Identifiers are unchanged except where listed. See `PASS2_IMPROVEMENTS.md` for the evidence.

- **Flag targets** use the station-qualified display form `flag_station_safetynet_relay:scada_attack_host-flagN` (the reference form never matched, `game.rb:1110`).
- **Flag meanings** follow the VM: 1 NFS export, 2 listener (operator password), 3 operator login (user flag), 4 root via sudo. Task ids `escalate_on_attack_host` (flag 3) and `terminate_cascade_scripts` (flag 4) are kept; titles changed.
- **Flag rewards:** 1 `set_global flag1_submitted`; 2 `give_item` Listener Capture (`c2_capture`, carries CascadeWindow19); 3 `set_global flag3_submitted`; 4 `unlock_object crisis_control_system`. `flag2_submitted` / `flag4_submitted` are set by `objective_task_completed` mappings on `agent_0x99`.
- **`crisis_control_system`** is type `pc` with sprite `scada_historian`, `lockType: flag` and **no `requires`** (one submission point per flag).
- **`situation_board`** is type `smartscreen`, sprite `command_board`.
- **`badge_printer`** is a PIN-locked `pc` container ("Contractor Badge Station", PIN `badge_pin` = 0616) holding `printed_contractor_badge`; the PIN is on the new `shift_handover_sheet` (operations floor). Morrison's badge has id `morrison_server_badge`.
- **Countdown (§5 superseded):** `architect_t20_played` 10 min and `architect_t10_played` + `redirect_window_closed` 40 min after `team_assigned`; the cascade is armed by `flag3_submitted` (sets new global `cascade_armed`), and `architect_t5_played` / `architect_t1_played` / `countdown_expired` fire 10 / 14 / 15 min after that. Only the 15-minute clock is shown. `countdown_expired` now has a consequence (step one, Seattle, executes before the abort).
- **Debrief trigger (§ on `mission_complete` superseded):** `closing_debrief` and `the_architect` live in `security_checkpoint` so their mappings register at load. The debrief opens on `minigame_completed`/`minigame_failed` after the Architect's sign-off, or on any `room_entered`, once `grid_saved` and all four `flagN_submitted` are true; latched by `start_debrief_cutscene`, replay-guarded by `debrief_played`.
- **Tasks:** `assign_tactical_team` and `take_the_debrief` are `custom`.
- **New globals:** `start_debrief_cutscene`, `debrief_played`, `architect_signoff_started`, `architect_signoff_done`, `flags_nag_sent`, `redirect_declined`, `cascade_armed`, `badge_pin_found`.
- **KO reactions** key on `npc_ko:<id>`, not `global_variable_changed:<npc>_ko`.
- **Leaving NPCs** (Morrison talked round, Elena fled, Park talked round, Mercer detained or walked out) are hidden with `setVisible:false` mappings; the ink no longer uses `#remove_npc` or Elena's `#hostile`.


## 1. NPCs

Eight NPC blocks. `id` is the engine identifier, `displayName` is the *exact* string that must
appear as the inline attribution prefix in ink, and `currentKnot` is the entry knot every ink file
must define.

| `id` | `displayName` | `npcType` | Room | `storyPath` (relative to repo root) | Entry knot |
|---|---|---|---|---|---|
| `opening_briefing_cutscene` | `Director Magnus Netherton` | `person` | `security_checkpoint` (hidden) | `scenarios/m07_architects_gambit/ink/m07_opening_briefing.json` | `start` |
| `agent_0x99` | `Agent HaX` | `phone` | `security_checkpoint` | `scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.json` | `start` |
| `jake_morrison` | `Jake Morrison` | `person` | `security_checkpoint` | `scenarios/m07_architects_gambit/ink/m07_npc_jake_morrison.json` | `start` |
| `elena_rodriguez` | `Elena Rodriguez` | `person` | `server_room` | `scenarios/m07_architects_gambit/ink/m07_npc_elena_rodriguez.json` | `start` |
| `james_mercer` | `Dr. James Mercer` | `person` | `scada_control` | `scenarios/m07_architects_gambit/ink/m07_npc_james_mercer.json` | `start` |
| `the_architect` | `The Architect` | `phone` | `scada_control` (reachable everywhere) | `scenarios/m07_architects_gambit/ink/m07_architect_comms.json` | `start` |
| `thomas_park` | `Thomas Park` | `person` | `cable_vault` | `scenarios/m07_architects_gambit/ink/m07_npc_thomas_park.json` | `start` |
| `closing_debrief` | `Director Magnus Netherton` | `person` | `scada_control` (hidden) | `scenarios/m07_architects_gambit/ink/m07_closing_debrief.json` | `start` |

Notes that are not negotiable:

- **`agent_0x99` + `Agent HaX`.** The id/displayName mismatch is the verified house convention from
  m01 and m02. Do not "fix" it.
- **Both phone NPCs are listed in `player_phone`'s `npcIds`.** `the_architect` is comms-only per
  `masterminds/the_architect.md` — he hijacks the player's own handset. He is never met in person and
  never gets a body. His room placement is bookkeeping; a phone NPC is reachable from anywhere.
- **Netherton appears twice**, as two NPC blocks with the same `displayName` and different ids —
  briefing and debrief. That is the m01/m02 pattern for cutscene bookends, not a duplicate.
- **`closing_debrief` is the hidden debrief trigger.** WP8 fires it from
  `global_variable_changed:mission_complete` with `conversationMode: "person-chat"`,
  `condition: "value === true"`, `onceOnly: true`.
- Every file gets `=== start ===` as its entry knot, and `=== hub ===` where it has one. Seven knot
  names were wrong in the old build and the NPCs were silently mute as a result.

### Cut names — do not reintroduce

"Marcus Chen" (both m07 uses), "Adrian Cross", "Victoria 'V1per' Zhang", "Specter", "Rachel Morrow",
"Director Patricia Morgan", "Michael Bradford", **"The Professor"**, and the three innocent-staff
NPCs (Sarah Chen, David Kim, Rebecca Torres). Blackout is **Dr. James Mercer** — the
`grid_down.md:364` contradiction is noted in the plan and out of scope here.

**Tomb Gamma** is referenced as the Architect's workshop and carries **no map coordinates**. The
in-game record has an empty coordinate field, deliberately.

---

## 2. Rooms and the lock chain

Six rooms, one building. All six types are verified against the engine's tilemap loader
(`js/core/game.js`). `room_security` was missing from `scripts/scenario-schema.json` and has been
added to the enum as part of this work package.

| Room id | `type` | Tiles | Connections | Lock on entry |
|---|---|---|---|---|
| `security_checkpoint` | `room_security` | 10×10 | east → `operations_floor` | — (start room) |
| `operations_floor` | `room_office` | 10×10 | west → `security_checkpoint`, east → `server_room` | — |
| `server_room` | `room_servers` | 10×10 | west → `operations_floor`, north → `scada_control`, south → `generator_room` | **`rfid`** |
| `scada_control` | `room_control_1x2gu` | 10×6 | south → `server_room` | **`password`** |
| `generator_room` | `room_battery_hall` | 20×10 | north → `server_room`, south → `cable_vault` | **`key`** + `keyPins` |
| `cable_vault` | `room_archive_1x2gu` | 10×6 | north → `generator_room` | **`pin`** |

Connections are declared **both ways**. Do not reorder them — door corners move.

### Lock table

| Gate | `lockType` | `requires` | Primary source | Redundant source |
|---|---|---|---|---|
| → `server_room` | `rfid` | `server_zone_badge` | Morrison's `itemsHeld` badge (talk or KO) | `badge_printer` at the checkpoint |
| → `generator_room` | `key` | `generator_maintenance_key`, `keyPins: [40,25,55,30]` | `generator_maintenance_key` on the ops floor | Lockpick in starting inventory |
| → `cable_vault` | `pin` | `4703` (ERB `vault_pin`) | `maintenance_log` in the generator room | Elena Rodriguez |
| → `scada_control` | `password` | `CascadeWindow19` (ERB `scada_password`) | Elena Rodriguez | netcat C2 traffic, VM flag 2 |
| `crisis_control_system` | `flag` | `scada_attack_host:flag_4` | VM flag 4 | — (this **is** the win condition) |

The two plaintext secrets live in ERB locals at the top of `scenario.json.erb`. Ink must never
hard-code them; if a character says the PIN, WP-authors interpolate nothing — they write the digits,
and if the ERB value changes, the ink changes with it. Prefer having characters *point at* the
source rather than recite the value.

### Geometry (verified)

Grid units, 1 GU = 5×4 tiles = 160×128 px. `predict_door_sides.py` output:

```
security_checkpoint  (0, 0)  east=TOP(y2.5)
operations_floor     (2, 0)  east=TOP(y2.5)   west=TOP(y2.5)
server_room          (4, 0)  north=LEFT   south=LEFT   west=TOP(y2.5)
scada_control       (4, -1)  south=LEFT
generator_room       (4, 2)  north=LEFT   south=LEFT
cable_vault          (4, 4)  north=LEFT
```

No world-space overlaps, no two doors on the same corner of the same wall.

### Jake Morrison's patrol

`room_security` is 10×10 tiles, which is enough floor to walk round him. Sequential looping patrol,
speed 70, six waypoints at `(2,4) (5,3) (8,4) (8,8) (5,8) (2,8)` with dwells of 6000/1500/5000/1500/
3000/1500 ms. LOS cone: `range: 150`, `angle: 130`, `visualize: true`.

The waypoints are tile coordinates inside the real tilemap dimensions, not the JSON `dimensions`
field — the engine ignores that field entirely.

---

## 3. Object ids

Every interactable, by room. WP-authors referencing an object in `targetObject`, `triggerOnInteract`
or a `#` tag use these ids verbatim.

| Room | Object id | `type` | What it is |
|---|---|---|---|
| `security_checkpoint` | `badge_printer` | `workstation` | Redundant RFID source; `give_item` yields `printed_contractor_badge` |
| | `printed_contractor_badge` | `keycard` | Given by the printer; `opens_lock: server_zone_badge` |
| | `morrison_server_badge` | `keycard` | Morrison's `itemsHeld` badge; `opens_lock: server_zone_badge` |
| | `visitor_log` | `notes` | Morrison renewed Mercer's credentials |
| | `checkpoint_evacuation_board` | `smartscreen` | Muster board |
| `operations_floor` | `generator_maintenance_key` | `key` | Primary source for the key lock |
| | `situation_board` | `command_board` | 8.4M, 147 substations, the four-step sequence |
| | `substation_map` | `chart` | The 23 transformers |
| | `ops_floor_workstation` | `pc` | Abandoned operator position |
| `server_room` | `vm_launcher_attack_terminal` | `vm-launcher` | The Kali box |
| | `flag_station_safetynet_relay` | `flag-station` | Flag submission, `acceptsVms: ["scada_attack_host"]` |
| | `scada_backup_server` | `servers` | The NFS export |
| | `rack_cabling_note` | `notes` | Points at the vault keypad and the maintenance log |
| `scada_control` | **`crisis_control_system`** | `scada_historian` | **Win condition.** Flag-locked on flag 4 |
| | `cascade_countdown_display` | `smartscreen` | The countdown |
| | `casualty_projection` | `text_file` | 240–385, signed by Mercer. Takeable — carry it to Elena |
| `generator_room` | `maintenance_log` | `notes` | Carries the vault PIN; `onRead` sets `vault_pin_found` |
| | `backup_transfer_switch` | `batrack` | Park's sabotage target |
| | `genset_control_panel` | `servers` | 72-hour rating |
| `cable_vault` | `vault_trunk_runs` | `cable` | The physical half of the intrusion |
| | `tomb_gamma_dossier` | `notes` | `onPickup` sets `found_tomb_gamma` |
| | `mole_intercept_evidence` | `text_file` | `onPickup` sets `found_mole_evidence` |

---

## 4. VM, flags and the flag station

**VM / station name:** `scada_attack_host`. Used in the top-level `flags` block, in the flag
station's `acceptsVms`, in `flags_for_vm(...)` and in every `targetFlags` entry.

SecGen scenario `putting_it_together` (per `mission.json`): NFS shares, netcat, privilege escalation,
multi-stage.

| # | `targetFlags` id | Flag string | Challenge | Narrative payload |
|---|---|---|---|---|
| 1 | `scada_attack_host:flag_1` | `flag{nfs_coordination_traffic}` | Mount the misconfigured NFS export, recover the attack timeline | **The coordination traffic** — four operations, one schedule, one authority. Carries the Trojan Horse dormancy field (`T+9d`) and the `EHR-`/`CAD-` vendor manifest |
| 2 | `scada_attack_host:flag_2` | `flag{netcat_c2_intercepted}` | Service enumeration, netcat C2 channel | Override codes **and the SCADA password** — the redundant route past Elena |
| 3 | `scada_attack_host:flag_3` | `flag{root_on_attack_host}` | Privilege escalation to root | Control of the host running the countdown |
| 4 | `scada_attack_host:flag_4` | `flag{cascade_scripts_terminated}` | Terminate the attack processes, lock out remote access | The grid holds; unlocks `crisis_control_system` |

**WP2 owns `flagRewards`.** Required `set_global` writes, at minimum:

- flag 1 → `flag1_submitted: true`, `found_coordination_traffic: true`, `projection_revised: true`
- flag 2 → `flag2_submitted: true`, `scada_password_found: true`
- flag 3 → `flag3_submitted: true`, **`redirect_window_closed: true`**
- flag 4 → `flag4_submitted: true`

`set_global`, never `set_global_variable`. There is no `unlockMechanism` and no `vmConfig` in this
schema; the old build's `type: "pc"` VM object was invented and inert.

---

## 5. The countdown — **real engine timer**

**Decision: the timer is real.** `scenarios/test_timer_system` was investigated and the system is
live: a top-level `timers` array, dispatched by `js/ui/scenario-timer-dispatcher.js` with a HUD
countdown from `js/ui/scenario-timer.js`. It supports `delayMs`, `startOnGlobal`, `cancelOnGlobal`,
`condition`, `setGlobal`, `showCountdown` and `onceOnly`.

Five timers are wired. They start on `team_assigned` (the clock begins when the player has actually
made the delegation call) and are cancelled by `grid_saved`.

| Timer id | Fires at | Sets |
|---|---|---|
| `architect_taunt_t20` | 20 min | `architect_t20_played` |
| `redirect_window_close` | 40 min | `architect_t10_played`, **`redirect_window_closed`** |
| `architect_taunt_t5` | 50 min | `architect_t5_played` |
| `architect_taunt_t1` | 58 min | `architect_t1_played` |
| `cascade_zero` | 60 min | `countdown_expired` |

Scale is **2:1** — thirty minutes of fiction over sixty real minutes, against an 80–100 minute
mission. T-30 is the briefing itself.

**Two rules the ink must respect.**

1. **Nothing fails the mission on the clock.** `countdown_expired` is atmosphere. `grid_saved` is
   reachable after it fires. The Architect gets to be smug; the player still wins. Do not write a
   fail state against wall-clock time — a real player who reads carefully will be slower than a
   rushing one, and the mission must not punish that.
2. **Ink reads one boolean for the redirect window: `redirect_window_closed`.** Never a timer id,
   never a minute count, never `timer > 10`. That boolean is written by *two* independent sources —
   the 40-minute timer and `flag3_submitted` (WP2) — so the door closes for a fast player and a slow
   one alike. The hub gate is:

   ```
   {projection_revised and not team_redirected and not redirect_window_closed}
   ```

   And when it *is* closed, HaX refuses out loud. The plan is explicit: the player should see the
   door close, not find it missing from the menu.

---

## 6. Global variables

Every one of these is declared in `globalVariables` in `scenario.json.erb`. Ink files `VAR`-declare
what they read and write it back with `#set_global`. **Nothing may be added without adding it here.**

### Act structure
| Name | Type | Values |
|---|---|---|
| `player_name` | string | `"Agent 0x00"` |
| `briefing_played` | bool | cutscene skip guard (`skipIfGlobal` / `setGlobalOnStart`) |
| `mission_complete` | bool | fires the debrief. **Set from the terminal, never from a KO-able NPC** |

### The delegation
| Name | Type | Values |
|---|---|---|
| `team_assignment` | string | `""` \| `"fracture"` \| `"trojan_horse"` \| `"meltdown"` |
| `team_assigned` | bool | starts the countdown timers |
| `projection_revised` | bool | player learnt the Trojan Horse brief is understated |
| `team_redirected` | bool | only ever true alongside `projection_revised`; **always** sets `team_assignment` to `"trojan_horse"` |
| `redirect_window_closed` | bool | written by the timer **or** `flag3_submitted` |

### The countdown
| Name | Type |
|---|---|
| `architect_t20_played` | bool |
| `architect_t10_played` | bool |
| `architect_t5_played` | bool |
| `architect_t1_played` | bool |
| `countdown_expired` | bool |

### NPC outcomes
| Name | Type | Values |
|---|---|---|
| `morrison_resolved` | string | `""` \| `"talked"` \| `"ko"` \| `"evaded"` |
| `elena_outcome` | string | `""` \| `"turned"` \| `"fled"` \| `"ko"` |
| `mercer_fate` | string | `""` \| `"arrested"` \| `"ko"` \| `"escaped"` |
| `mercer_stance` | string | `""` \| `"condemned"` \| `"reasoned"` \| `"silent"` |
| `mercer_told_diversion` | bool | player told him he was a distraction |
| `park_resolved` | string | `""` \| `"talked"` \| `"ko"` \| `"evaded"` |

### Debrief
| Name | Type | Values |
|---|---|---|
| `debrief_stance` | string | `""` \| `"defended"` \| `"owned"` \| `"refused"` \| `"hardened"` |

`debrief_stance` is a **WP8 addition (2026-08-29)** — the player's recorded position on their own
triage, written by the four stance choices in `m07_closing_debrief.ink`. It is read by nothing in m07;
it exists so the choice is state rather than flavour, and so the campaign layer can pick it up.
**WP6 must declare it in `globalVariables` in `scenario.json.erb` (default `""`)** — WP8 does not touch
that file.

`park_resolved` is a WP1 addition — the plan names Park as a pressure point but gave him no state,
and the debrief credits need him.

### Knockout latches
`morrison_ko`, `elena_ko`, `mercer_ko`, `park_ko` — all bool. WP2 wires each NPC's `globalVarOnKO`
to its latch and `taskOnKO` to the matching task. Ink treats a KO'd NPC's `*_resolved` / `*_outcome`
string as `"ko"`.

### VM progress
`flag1_submitted`, `flag2_submitted`, `flag3_submitted`, `flag4_submitted`,
`found_coordination_traffic` — all bool, all written by `flagRewards` of type `set_global`.

### Lock-chain latches
`badge_obtained`, `maintenance_key_found`, `vault_pin_found`, `scada_password_found`,
`visitor_log_read`, `casualty_projection_found` — all bool. These exist so the HaX hub can gate hints
on what the player has actually found rather than guessing.

### Win condition and lore
`grid_saved` (bool — **the** win condition), `found_tomb_gamma`, `found_mole_evidence`.

### Field guide gating
Two latches per guide, five guides: `<x>_guide_offered` and `<x>_guide_hint_given`, where `<x>` ∈
{`rfid`, `lockpicking`, `recon`, `scanning`, `privesc`}. Ten booleans. The offer gate is
`{<x>_guide_offered and not <x>_guide_hint_given}`.

**Deleted from the old build:** everything not in the lists above. ~30 of the old 47 globals were
inert — declared, never touched by any ink file. In particular `crisis_choice`, `player_success`,
`final_debrief_complete`, `total_casualties` and the four `operation_*_outcome` strings are gone.

---

## 7. Field guides

Exposure-gated offers, delivered on request from the hub, per the m01/m02 pattern:
`#give_item:lab-workstation:<id>` behind `{<x>_guide_offered and not <x>_guide_hint_given}`,
with matching `itemsHeld` on `agent_0x99` carrying `id`, `name`, `labUrl`. **WP6 owns
`itemsHeld`**; these are the ids it must use.

All five lab sheets verified present in `HacktivityLabSheets/_labs/safetynet/`.

| Guide | `id` | Offered when | Lab sheet file | `labUrl` |
|---|---|---|---|---|
| RFID cloning | `m07_rfid_field_guide` | player first hits the badge door | `rfid-cloning.md` | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/rfid-cloning/` |
| Lockpicking | `m07_lockpicking_field_guide` | player first hits the key lock | `lockpicking.md` | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/lockpicking/` |
| Recon & network mapping | `m07_recon_field_guide` | `room_entered:server_room` | `reconnaissance-and-network-mapping.md` | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/reconnaissance-and-network-mapping/` |
| Scanning & exploitation | `m07_scanning_field_guide` | vm-launcher first interacted | `scanning-and-exploitation.md` | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/scanning-and-exploitation/` |
| Privilege escalation | `m07_privesc_field_guide` | `flag2_submitted` | `privilege-escalation.md` | `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/` |

No guide is ever offered before the player has hit the obstacle it explains. The old build's
unconditional four-stage walkthrough dump at `m07_phone_agent_0x99.ink:98-121` is deleted; its
content becomes these five guides plus per-stage hub hints gated on the previous flag.

---

## 8. Task ids

WP2 owns the objectives/aims block and may add tasks, group them into aims and set
`unlockCondition` chains. It **may not rename these ids** — the ink packages reference them in
`#complete_task` tags and WP2 references them in `taskOnKO` and `requiresCompleted`.

| `taskId` | `type` | Target | KO-able NPC |
|---|---|---|---|
| `assign_tactical_team` | `custom` | (briefing commit line; HaX backstops) | — |
| `clear_the_checkpoint` | `npc_conversation` | `jake_morrison` | ✔ `taskOnKO` |
| `reach_operations_floor` | `enter_room` | `operations_floor` | — |
| `breach_server_room` | `unlock_room` | `server_room` | — |
| `question_elena` | `npc_conversation` | `elena_rodriguez` | ✔ `taskOnKO` |
| `recover_coordination_traffic` | `submit_flags` | `["flag_station_safetynet_relay:scada_attack_host-flag1"]` | — |
| `intercept_c2_channel` | `submit_flags` | `["flag_station_safetynet_relay:scada_attack_host-flag2"]` | — |
| `secure_generator_room` | `enter_room` | `generator_room` | — |
| `recover_vault_pin` | `custom` | `maintenance_log` | — |
| `neutralise_park` | `npc_conversation` | `thomas_park` | ✔ `taskOnKO` |
| `search_cable_vault` | `enter_room` | `cable_vault` | — |
| `recover_mole_evidence` | `collect_items` | `mole_intercept_evidence`, `tomb_gamma_dossier` | — |
| `reach_scada_control` | `enter_room` | `scada_control` | — |
| `confront_mercer` | `npc_conversation` | `james_mercer` | ✔ `taskOnKO` |
| `escalate_on_attack_host` | `submit_flags` | `["flag_station_safetynet_relay:scada_attack_host-flag3"]` | — |
| `terminate_cascade_scripts` | `submit_flags` | `["flag_station_safetynet_relay:scada_attack_host-flag4"]` | — |
| `shut_down_the_cascade` | `unlock_object` | `crisis_control_system` | — |
| `take_the_debrief` | `custom` | (debrief last line; room-entry backstop) | — |

Every task on a KO-able NPC needs `taskOnKO` **and** `globalVarOnKO`, or a knockout soft-locks the
run. Aim titles must be action-first and spoiler-safe. The `missionConclusion` aim sits on
`shut_down_the_cascade` + `take_the_debrief` with `requiresCompleted` and
`conclusionScreen: { "type": "bond_visualiser" }`.

---

## 9. Attribution rules

**Inline `DisplayName:` prefixes only.** `#speaker:` tags do not resolve —
`determineSpeaker()` accepts only `player` and `npc` for a two-part tag, so all 281 tags in the old
build rendered as the room's main NPC, including 34 `#speaker:You` lines that put the player's words
in the antagonist's mouth. Every one of them is deleted.

The complete list of legal speaker prefixes for this mission:

```
You:
Narrator:
Agent HaX:
Director Magnus Netherton:
Dr. James Mercer:
Elena Rodriguez:
Jake Morrison:
Thomas Park:
The Architect:
```

Nothing else. The name before the colon must match column 2 of the NPC table **character for
character**, including `Dr. ` and `Director `.

`Narrator:` carries every scene beat — the old build has zero narrator lines in 3,763 lines of ink.

### Standing ink rules (all packages)

- No `**bold**`, no `* ` markdown bullets, no `# ` headings. 369 such lines in the old build parse as
  choices or vanish as tags and cause 54–92% of conversation paths to die with `ran out of content`.
- A **sticky unconditional exit** in every re-enterable knot: `+ [I'll call you back.] #exit_conversation`
  (or the in-fiction equivalent). `#exit_conversation` is used zero times in the old build.
- `#set_global` on **every** consequence-bearing choice. The old build contains zero.
- Choices phrased as first-person spoken lines, never menu labels. 134 of 328 choices are labels
  today.
- `VAR` declarations in every file for every global it reads.

---

## 10. What WP1 did **not** build

Left out on purpose. Do not treat their absence as an oversight.

| Owner | Missing piece |
|---|---|
| WP2 | `objectives` array and all aims/tasks; `flagRewards`; `taskOnKO` / `globalVarOnKO`; `missionConclusion` + `requiresCompleted` + `conclusionScreen` |
| WP6 | `itemsHeld` field guides on `agent_0x99`; dialogue `eventMappings` |
| WP7 | Architect taunt `eventMappings` on the countdown globals; Morrison and Park barks and `#hostile` |
| WP9 | `voice` blocks on all speakers; the top-level `narrator` block; the `music` block |
| ink agents | `m07_npc_jake_morrison`, `m07_npc_elena_rodriguez`, `m07_npc_james_mercer`, `m07_npc_thomas_park` do not exist yet; the four existing files are the old build and are being rewritten |

---

## 11. Validator state at the end of WP1

`ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb`

- ✓ Directory structure valid
- ✓ ERB renders
- ✓ JSON structure valid
- ✓ **No unknown fields** (the old build carried 106)
- ✓ **Room layout geometry OK — no world-space overlaps**
- ✓ Schema validation clean
- ✗ Ink errors — **all of them from the old ink files**, which WP3–WP8 replace. Four `storyPath`
  references point at files that do not exist yet, by design.

`python3 scripts/predict_door_sides.py` — clean, see §2.

**One schema change was required:** `room_security` is loaded by `js/core/game.js` and its tilemap
exists, but it was absent from the `room.type` enum in `scripts/scenario-schema.json`. It has been
added. This is the only file outside `scenarios/m07_architects_gambit/` that WP1 touched.

---

## 12. Aims — locked by WP2 (added 2026-08-29)

WP2 built the objectives block. These `aimId`s are now fixed; WP6 and WP8 must use them verbatim.

| # | `aimId` | Title | unlockCondition | `missionConclusion` |
|---|---|---|---|---|
| 0 | `commit_the_team` | Commit The Team And Get Inside | — (starts `active`) | — |
| 1 | `reach_the_control_network` | Get Onto The Control Network | aim 0 | — |
| 2 | `trace_the_intrusion` | Trace How They Got In | aim 1 (side branch) | — |
| 3 | `reach_the_control_room` | Get Into The Control Room | aim 1 | — |
| 4 | `take_the_attack_host` | Take The Attack Host Off The Board | aim 3 | — |
| 5 | `end_the_sequence` | Stop The Sequence And Report | aim 4 | ✔ + `bond_visualiser` |

**Optional tasks** (a player may legitimately evade these NPCs, so their tasks carry `optional: true`):
`clear_the_checkpoint`, `question_elena`, `neutralise_park`, `search_cable_vault`, `recover_mole_evidence`.

**`requiresCompleted` on aim 5** — do not add to this list without re-tracing solvability:
`assign_tactical_team`, `breach_server_room`, `reach_scada_control`, `escalate_on_attack_host`,
`terminate_cascade_scripts`, `shut_down_the_cascade`, `take_the_debrief`.

### Two `#complete_task` tags the ink still owes
- `#complete_task:assign_tactical_team` — **WP6**, on the delegation commit in the Agent HaX hub.
- `#complete_task:take_the_debrief` — **WP8**, in the closing debrief.

Both are in aim 5's `requiresCompleted`. Until they exist the mission cannot record its conclusion.

### Flag reward payloads (WP2)
A flag reward carries exactly one `set_global`. Secondary payloads hang off `eventMappings` on
`agent_0x99`, already wired: flag1 → `found_coordination_traffic` + `projection_revised`;
flag2 → `scada_password_found`; flag3 → `redirect_window_closed`.

### `#give_item` tag format — corrected 2026-08-29
`#give_item:<item type>:<id>` — the first field is the **item type** (`keycard`, `lab-workstation`,
`key`, `id_badge`), **not** the NPC id. WP7 used the NPC id and the item silently failed to resolve.

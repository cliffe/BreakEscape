# demo_access_tour: build plan

Status: v1. Sections 0 and 1 are checked against main 7ca03520e. Sections 2 to 5 give the design, server enforcement and sync budget, tests and proof, and the build slices.

User decisions: D100 (one two-act scenario, 35 min with a 15-min short route; Merrin & Sallow with Ama Owusu; office life light, 2 needs NPCs and a cake lever, overlay off, no task depends on an absence; plan now, 5 review rounds, build once the format changes are settled; no new engine work) and D101 (audience colleagues who know Break Escape; host lines text-only first, then dialogue review, then a voicing ask; reuse existing sprites; collection test_scenarios).

## 0. Format status: settled

The three changes from SCENARIO_FORMAT_REVIEW_ACCESS.md are on main:

- One outage field: step 8a, format 1. `downIf` and `affordance.offWhen` became object, network and resource `offWhen` (lib/break_escape/format_upgrade.rb:36-58).
- One owner field: step 8b, format 2. `owner` on objects and items (scripts/scenario-schema.json:5482); `needsHome` no longer sets an owner (format_upgrade.rb:60-100).
- Habits in one block: step 8c, format 3 (`habits.screen`, `habits.print`, `habits.usb`; schema 4410-4421).
- `STEPS = [STEP_8A, STEP_8B, STEP_8C]` (format_upgrade.rb:114), so the current format is 3.
- Strict keys: step 2, on main (SCENARIO_FORMAT_HARDENING_PLAN.md section 3).
- No scenario template still uses a retired key: a grep for `screenOwner|downIf|screenHabit|phoneOf|leftBehindBy|usbHabit|printHabit` over scenarios/*/scenario.json.erb matches nothing.
- tmp/handover/ac0/HARDENING_FINAL_HANDOVER.md:6 says the plan is complete on main (steps 1 to 8c, 6a-1 and 6a-2; 6b was not needed), and the stream is archived.

Still open, and not a blocker:

- D14 (scenario schema cleanup) is unanswered on AC0's decisions page. It covers the hardening plan's section 7 (drop dead fields, close the core kinds), which would turn unknown keys on rooms, objects, NPCs, mappings and tasks into errors.
- The demo should use no dead field (`endGoal`, `version`, `scenario_id`, `isEndGoal`, `autoTrigger`, `note_*`) and no unknown core key. Then that closure costs it nothing.
- The format review's recommendations 6 to 9 were not taken: role merge rule, one planting shape (`grant_foothold` stays), renaming `social` and `profile`, and the Friendface person.
- If the user later picks one of those, the demo migrates with the rest of the corpus. It adds 1 to the "needs migration" count for planting (it uses `grant_foothold` once).
- Who settles: the user, via D14 on AC0's page.

Verdict: the build can start; it does not wait on any format branch.

## 1. Audit "Not checked" items, resolved

### Grid and doors
- Rules: README_scenario_design.md:2766-2843.
  - Widths are multiples of 5 tiles; heights are 2 + 4N.
  - A single N/S door's corner follows the parity of (gridX + gridY).
  - A single E/W door always sits 2.5 tiles from the top.
  - The way in can never be the second element of a multi-room side.
  - Check the corners with `python3 scripts/predict_door_sides.py`.
- Map sizes (public/break_escape/assets/rooms/*.json): room_aw_merrin_lobby, room_aw_merrin_sallow, room_reception, room_office, room_break, room_ceo, room_meeting and room_servers are all 10x10 (2x2 GU). room_lw_comms is 5x6 (1x1 GU).
- The awareness course's own Merrin & Sallow maps exist (room_aw_merrin_lobby, room_aw_merrin_sallow). Use them for reception and the open plan, so the firm looks the same as in the course.
- Proposed grid, start room at (0,0):

  | Grid | Room |
  |---|---|
  | (0,0) | reception |
  | (0,-2) | open plan, north of reception |
  | (0,-4) | server room, north of the open plan |
  | (-2,-2) | kitchen, west of the open plan |
  | (-2,0) | partner's office, west of reception |
  | (2,0) | meeting room, east of reception |
  | (2,-2) | comms cupboard, east of the open plan |

  The kitchen and the partner's office touch but do not connect. No overlap is expected. The builder confirms with the validator and predict_door_sides.py.

### Cast art
- All seven have the full set in public/break_escape/assets/characters/:
  - an atlas: `<key>.png` and `.json`, 288 frames, including `sit_*` (seated) frames;
  - `_headshot`, `_talk`, `_talk_init` and `_visemes` art.
  - Keys: ama_owusu, delphine_arvanitis, thandiwe_moyo, yasmin_chaudhry, julian_sallow, lorna_easton, and nilesh_solanki (if used).
- NPC art fields, as ca18 uses them (scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:808-810): `spriteSheet`, `spriteTalk`, `spriteVisemes`.
- CORRECTION to the audit: Nilesh Solanki works for Tarrowby, not Merrin & Sallow (planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:87).
- The Merrin & Sallow cast is Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo, Delphine Arvanitis, Lorna Easton (reception and facilities lead) and Ama Owusu of Fenlow Managed IT (VOICE_CAST.md:104-113).
- Proposal: Lorna Easton replaces Nilesh as the badge to copy. As facilities lead she holds the comms cupboard and the door-controller account.
- Ama's voice and manner come from VOICE_CAST.md:113 ("warm and practical", London and southern English). The office-life showcase uses the same host (AC0 note), so her lines must match it.

### Ama on the phone
- Use the lab's pattern: a person NPC plus a phone NPC (`ruth` and `ruth_phone`, lab_physical_pentest scenario.json.erb:846 and 953, debrief NPC at 2573).
- The event-triggered message is the eventMapping `sendTimedMessage` ({ delay, message, targetKnot, skipIfGlobal }, scripts/scenario-schema.json:5080-5086; README_scenario_design.md:2008-2045).
- A phone NPC needs a `phoneId` that matches a phone in `startItemsInInventory`, and must have no `position` or `spriteSheet`.
- No "call me" text unless the contact has a `call` entry (README:2361).
- Space timed texts 4 to 6 seconds apart (README:2993).

### Server-side `needsSession`
- Read and enforced: NetworkModel.grant_foothold_actions (lib/break_escape/network_model.rb:266) and NetworkAccess#implant_foothold! (app/models/break_escape/network_access.rb:468-512).
- The session shape needs, all checked on the server:
  - a keyboard session on that PC, with no foothold and no remote route;
  - the held device;
  - the PC's USB policy not refusing its usbClass (it answers `usb_refused` with the policy line).
- CORRECTION: an item plant cannot sit on the sign-in PC itself (README:943). Use a separate dock object, as `sam_dock` does (test_access_networks:771-790). The sticky note uses `postitNote` and `showPostit` (test_access_networks:735-736).
- The USB-stick refusal beat needs checking against test_access_work U2 (lines 59, 123-130, 360-411). One grant_foothold per [pc, shape] (README:1150), so the stick refusal cannot be a second session-shape action on the same PC.

### Magnet (cake)
- The magnet schema is at scripts/scenario-schema.json:3981 (`affordance.magnet` on a droppable held item).
- test_needs_sims' cake is at scenarios/test_needs_sims/scenario.json.erb:94-101 (type cake1; satisfies hunger and social; capacity 3). Its chatter pools are at lines 21-22 and `cake_servings` at line 53.
- AC0 note: do not design the cake. AC4 writes the shared spec at scenarios/office_life_showcase/planning/CAKE_ITEM.md (branch plan/ol-showcase). The tour states only what it needs, marked "to match CAKE_ITEM.md":
  - it draws Thandiwe and Yasmin from their desks on cue;
  - the overlay stays off;
  - no task depends on it;
  - its sync cost, from the V8 caps in scripts/validate_office_life.rb:766-770: magnet servings 2, dropped magnet items 2, office-life items 4, office-life onceOnly mappings 10, workstation globals 24 (3 per owned workstation, so at most 8 owned PCs).
  - The two NPCs need a need the cake satisfies (hunger or social).
- Fallback, with no engine work: an eventMapping `needs: { set: { <need>: <level> } }` (schema around 5100) sets a need level on cue. Whether to use it is the user's choice (open question Q2).

### K-lock visibility
- test_access_keyring has no sign or task for locking (its tasks are at lines 109-113).
- K-lock is visible as Lock in the desktop start panel on any password, foothold or `from` credential session, never on a claim, guest or relay (public/break_escape/js/systems/pc-sessions.js:431-440; POST lock_session, config/routes.rb:40).
- The tour can show it on Julian's remote session with no extra data.

### Checks closed in this pass
- Door layout: a skeleton with the seven rooms (reception room_aw_merrin_lobby, open plan room_aw_merrin_sallow, room_servers, room_break, room_ceo, room_meeting, room_lw_comms) gives the grid above. The validator reports no overlap and door alignment OK. predict_door_sides.py: reception north LEFT, east and west TOP (y2.5); open plan north LEFT, south LEFT, east and west TOP; every leaf door on its shared side.
- USB stick refusal (test_access_work U2, lines 14, 575-645): a separate dock object with its own `policy` and `requiresItem`. On a click the client's plantRefusal shows the policy line and emits `usb_refused:<dockId>` (public/break_escape/js/systems/interactions.js:1015-1043). It grants nothing, so it is best-effort and needs no server check. plantRefusal refuses only when every matching held item is refused, so a dock that accepts both the stick and the injector never shows the refusal while the injector is held. Use two objects beside the PC: a USB hub whose `requiresItem` is the stick's id, and the implant socket whose `requiresItem` is the injector's id (sam_dock pattern, test_access_networks:771-789). The server still refuses an implant whose usbClass the policy blocks (app/models/break_escape/network_access.rb:506-512).
- Remote sign-in and an owner at the desk: no presence check on the remote path. The owner rule applies to a click at the keyboard and to claims (workstation-state.js:615-640; pc-sessions.js:658-668). An NPC that sits at the PC (`npc_sat_at`, or `npc_borrowed_session`) ends any session the player holds there, remote included (pc-sessions.js:84-87, 299-301). ownerPresent needs the needs system (workstation-state.js:676-680), so an owner with no needs is never present. Decision: Julian has no needs and no routine and stands in the kitchen; his PC is never sat at, so the remote session lasts until the unplug. The same holds for Delphine's front desk PC (owner Delphine, no needs): its sign-in screen always shows, with her `habits.writesDown` sticky note built by the server.
- Test coverage of test_* scenarios: corpus tests glob every scenarios/*/scenario.json.erb and pick a new scenario up with no edit: test/unit/scenario_schema_test.rb:238, test/unit/scenario_object_tile_bounds_test.rb:37, test/models/break_escape/payload_scan_fresh_state_test.rb:249, payload_scan_opened_state_test.rb:309, capture_payload_secret_test.rb:147, test/unit/break_escape/tts_mission_lines_test.rb:31, ink_compiled_staleness_test.rb:26, phish_superset_test.rb:30. Opt-in lists to add the demo to: test/js/validator-office-life.test.mjs:442 (V2/V4/V5 clean) and a "no unknown errors" validator run like test/js/validator-network-model.test.mjs:803. sync_payload_size_test.rb:17 holds measured bootstrap bases for named scenarios; adding the demo there is optional.
- Live games: tools/playtest/new-game.rb finds the mission row by id or name (lines 111-116); seeding (`db:seed`) is allowed, no other db task.

## 2. Design

### 2.1 Premise

Merrin & Sallow is a small firm in the awareness course. Its IT is run by Ama Owusu of Fenlow Managed IT. The partners have asked Fenlow for a walk-round access test of the office, and Ama has brought the player in to do it while she watches from reception.

The tour is for colleagues who already know Break Escape. It shows the access and network model in one office: doors and cards, sign-in PCs and their owners, saved credentials, a drop box on a wall port, a pivot to a second network, a keystroke injector, an evil-twin access point, and the clean-up when the box comes out. Office life is light: two staff with needs, one cake lever, the overlay off.

Full route: about 35 minutes, 18 stops. Short route: about 15 minutes, 10 stops (marked S). No task on either route depends on an NPC being away; the absence beats are optional tasks.

### 2.2 Rooms

Grid units are 5 tiles. Every map is 10x10 tiles (2x2 GU) except the comms cupboard, which is 5x6 (1x1 GU).

```
                      +----------------+
                      | server_room    |
                      | (0,-4)         |
                      +-------K--------+
                              |
+--------------+      +-------+--------+      +-----------+
| kitchen      |      | open_plan      |      | comms_    |
| (-2,-2)      +------+ (0,-2)         +--R2--+ cupboard  |
+--------------+      +-------+--------+      | (2,-2)    |
                              |               +-----------+
+--------------+      +-------+--------+      +--------------+
| partner_     |      | reception      |      | meeting_room |
| office       +--R3--+ (0,0) START    +--R1--+ (2,0)        |
| (-2,0)       |      |                |      |              |
+--------------+      +----------------+      +--------------+

K = keypad (pin)    R1, R2, R3 = RFID readers    unmarked = open door
```

The kitchen and the partner's office touch but have no door between them.

| Room id | Map | Grid | Doors | Lock |
|---|---|---|---|---|
| reception | room_aw_merrin_lobby | (0,0), start | N to open_plan, W to partner_office, E to meeting_room | none on its own doors |
| open_plan | room_aw_merrin_sallow | (0,-2) | S to reception, N to server_room, W to kitchen, E to comms_cupboard | none |
| server_room | room_servers | (0,-4) | S to open_plan | keypad, `lockType: pin`, `requires` the door code (a fixed four-digit code the builder picks; it appears only in the door controller's contents) |
| kitchen | room_break | (-2,-2) | E to open_plan | none |
| partner_office | room_ceo | (-2,0) | E to reception | RFID, access `people: ["julian"]`, with a `lockedHint`. Never opened in the tour. |
| meeting_room | room_meeting | (2,0) | W to reception | RFID, `requires` the visitor card's id (the test_access_doors:233 pattern) |
| comms_cupboard | room_lw_comms | (2,-2) | W to open_plan | RFID, access `roles: ["facilities", "it"]` |

Door corners, from predict_door_sides.py on the skeleton: reception north LEFT, east and west TOP (y 2.5); open plan north LEFT, south LEFT, east and west TOP; every leaf door on its shared side.

### 2.3 Networks, resources and policies

| Network | Joined by | Holds |
|---|---|---|
| office_lan | meeting_jack (drop box), Staff Wi-Fi, implant on reception_pc | reception_pc, thandiwe_laptop, yasmin_pc, julian_pc, the Client-Letters share, the Finance share |
| server_lan | `networkLinks` from office_lan (reached as a pivot from a session on office_lan) | door_controller |
| guest | Guest Wi-Fi, the guest VLAN port on the patch panel | nothing of the firm's: the contrast network |

- Staff Wi-Fi: SSID `MerrinSallow-Staff`, psk `<%= @random_password %>`. The same render goes in the rogue AP mapping's `addCapture` secret, so the captured key is the real one.
- Guest Wi-Fi: SSID `MerrinSallow-Guest`, psk printed on the guest Wi-Fi card at reception.
- Resources: `client_letters` share on office_lan, open to anyone on the network. `finance_share` on office_lan, access `roles: ["finance", "partner"]`: Julian's and Yasmin's desktops map it, the drop box foothold alone does not.

| Policy | Settings | Used by |
|---|---|---|
| desk (`defaultPolicy`) | `autoLockMin: 5`, USB `storage_blocked`, remote allowed | every PC unless named below, the USB hub |
| partner | remote allowed | julian_pc. Remote sign-in bypasses the partner office door: that is the point of the stop. |
| infra | remote allowed | door_controller |

### 2.4 Cast

All art exists (section 1). Fields as ca18 uses them: `spriteSheet`, `spriteTalk`, `spriteVisemes`.

| NPC | Where | Habits and needs | Role in the tour |
|---|---|---|---|
| ama (person) | reception, immovable | none | Briefing (`timedConversation` on `game_loaded`, `skipIfGlobal` so a reload does not repeat it) and the debrief. |
| ama_phone | the player's phone (`phoneId: player_phone`, no `position`, no `spriteSheet`, `livePreview`) | none | "Where next?" hub and every timed text. |
| delphine | reception, front desk | no needs; `habits.writesDown`; awareness low; owner of reception_pc | Her sign-in screen always shows, with the sticky note the server builds from her password. |
| thandiwe | open plan, studio desk | needs caffeine, work, hunger; owner and `needsHome` of thandiwe_laptop; `lockChance: 0` | Leaves her laptop signed in when she goes for coffee or cake. Her laptop is on Staff Wi-Fi and is the rogue AP's `knownClient`. |
| yasmin | open plan, finance desk | needs; `habits.locksScreenOnLeave`, `habits.writesDown`; owner of yasmin_pc | The good habit (padlock on leave) next to the bad one (sticky note). |
| lorna | open plan, static at a desk by the comms door | none; `creds.card` is her facilities card, EM4100, `cardName` "Lorna Easton FAC card" | Talk to her and copy the card from the conversation (`#clone_keycard` in her ink). Her account is admitted to the door controller. |
| julian | kitchen, static | no needs, no routine; strong password, never shown | The partner whose PC is reached only through the saved connection. Never sits at his PC, so a remote session lasts until the unplug. |

Thandiwe and Yasmin are the two needs NPCs. Both carry hunger at decay 0.5 per minute, urgent at 30, start 50 (matches CAKE_ITEM.md at b1f3a4396, not yet reviewed; may change). Neither gets hungry on their own during the tour, but the cake tempts them throughout.

### 2.5 Items and where they are

Start inventory (`startItemsInInventory`): `player_phone`.

Reception:
- `visitor_card`: RFID card, opens the meeting room only.
- `guest_wifi_card`: readable card with the guest SSID and psk.
- `staff_ap`, `guest_ap`: `wifiAp` objects for the two networks.
- Two plants with hideable spots; one is where the rogue AP goes.
- `planted_rogue_ap`: the rogue AP's console, `hiddenWith: kit_rogue_ap`, so it appears only once the kit is planted (test_access_devices:143-205 pattern).
- `reception_pc`: sign-in PC, owner delphine.
- `usb_hub`: dock beside the PC, `requiresItem: demo_stick`, `policy: desk` (refuses storage, shows the policy line, emits `usb_refused:usb_hub`).
- `implant_socket`: dock beside the PC, `requiresItem: kit_injector`, a `confirm_action` that runs `grant_foothold` on reception_pc with `needsSession` and `needsHeld` (sam_dock pattern, test_access_networks:771-790).

Delphine's desktop (on reception_pc):
- `facilities.txt`: names Lorna's door-controller password. Declared as a credential, kind `password`, `foundIn` this file, proof session reception_pc (test_access_keyring:44-49).
- `julian.rdp`: `text_file`, takeable, `credential: julian_rdp`, a saved connection to julian_pc (test_access_keyring:146-156).

Meeting room, kit table:
- `rfid_cloner`
- `kit_dropbox`: `rogueDevice`
- `kit_injector`: `usbClass: hid`
- `demo_stick`: `usbClass: storage`
- `kit_rogue_ap`
- `capture_tablet`: page-builder captures view (test_access_devices:99-102)
- `meeting_jack`: live wall port on office_lan

Comms cupboard:
- `managed_port`: `portSecurity` with a refusal message.
- `patch_panel` with `guest_vlan_port` (`panelOf`): plugging the box here lands on guest.

Server room: `door_controller`: headless, on server_lan, sign-in, access `roles: ["facilities"]`, contents list the door codes including the server room keypad code.

Open plan: `thandiwe_laptop`, `yasmin_pc` (sticky note via `postitNote` and `showPostit`, test_access_networks:735-736), `rota_board` ("Coffee rota"), Lorna's desk.

Partner's office: `julian_pc` (owner julian, `policy: partner`).

Kitchen: coffee machine preset, `cake` (magnet, takeable; matches CAKE_ITEM.md at b1f3a4396), Julian.

### 2.6 The cake

Matches CAKE_ITEM.md at b1f3a4396 (scenarios/office_life_showcase/planning/CAKE_ITEM.md on branch plan/ol-showcase; not yet reviewed; may change). The tour uses that spec's minimal variant and designs nothing of its own:

- The cake starts in the kitchen. The player picks it up and drops it in the open plan; the drop in their room is the cue (magnet on a droppable held item, `affordance.magnet`, schema 3981).
- It satisfies hunger. Thandiwe and Yasmin: hunger decay 0.5 per minute, urgent 30, start 50, so the cake tempts them all tour and neither gets hungry unprompted.
- 2 servings, 1 each.
- No task, no onceOnly mapping, no overlay.
- Sync cost within V8: 2 magnet servings, 1 dropped magnet item, 1 office-life item, 0 onceOnly mappings.

Fallback, which works with or without the cake: the `rota_board` in the open plan. Thandiwe's eventMappings hold `object_interacted:rota_board` with `needs: { set: { caffeine: 10 } }` and `cooldown: 30000` (precedent test_needs_sims:590). Reading the board sends her to the coffee machine. The kitchen sign also says the player can simply wait.

### 2.7 The stops

| # | Stop | What happens | Route |
|---|---|---|---|
| 1 | Ama's briefing | Timed conversation at reception on load. She explains the job and points at the phone. | S |
| 2 | Doors | The visitor card fails at the partner's office (lockedHint) and opens the meeting room. Take the kit. | S |
| 3 | Front desk | Delphine's sticky note signs the player in to reception_pc. Take `julian.rdp`, read `facilities.txt`. | S |
| 4 | Lorna's badge | Talk to Lorna; copy her card with the cloner from the conversation. | S |
| 5 | Comms cupboard | The copy opens it (role facilities). The managed port refuses the drop box. The patch panel's guest port gives only guest. | |
| 6 | Thandiwe at her desk | Click her laptop while she sits: `pc_in_use`. | S |
| 7 | The open session | Drop the cake in the open plan, read the rota board, or wait. She leaves; her laptop is still signed in. She returns, sits, and the player's session ends. Optional task. | S |
| 8 | Yasmin | She padlocks on leave; the sticky note still gets the player in; her desktop maps the Finance share. | |
| 9 | Drop box | Plant `kit_dropbox` in `meeting_jack`. Network view opens. | S |
| 10 | Saved connection | Keyring row for `julian_rdp`; connect to julian_pc remotely. Show the Lock (K-lock) button in the start panel. | S |
| 11 | Finance share | Open it from Julian's desktop (role partner), then try from the bare foothold: refused. | |
| 12 | Pivot | From a session on office_lan, reach server_lan; sign in to door_controller with Lorna's password; read the codes. | |
| 13 | Server room | Enter the code at the keypad. | |
| 14 | Front desk USB | The stick is refused at the hub (policy line). The injector at the implant socket gives a foothold through reception_pc. | |
| 15 | Rogue AP | Hide the rogue AP in the plant; clone Staff Wi-Fi from its console; Thandiwe's laptop joins the twin next time she uses it; the key is captured. | |
| 16 | Staff Wi-Fi | Join with the captured key; compare with the guest network. | |
| 17 | Unplug | Pull the box. Julian's remote session and the pivot session end. The implant, Wi-Fi and keyboard sessions stay. | S |
| 18 | Debrief | Back to Ama at reception; warning, then the debrief and the closing card. | S |

Short route: 1, 2, 3, 4, 6, 7, 9, 10, 17, 18.

Stop 15 detail (README 1125-1131 pattern): the mapping lives on `ama_phone`, `eventPattern: npc_used:thandiwe_laptop`, gated on the twin global set from the rogue AP console, `onceOnly`, with `addCapture` (proof: the planted `kit_rogue_ap`; secret: the Staff psk render) and `completeTask: t_capture_key`.

### 2.8 Objectives

Every required task can be done without waiting for anyone to move (V5). Tasks that need an absence or an NPC's use of a device are optional.

| Aim | Task id | Title | Completes on | Stop |
|---|---|---|---|---|
| The office (required) | t_meet_ama | Talk to Ama at reception | `npc_conversation` ama | 1 |
| | t_kit | Get into the meeting room | `unlock_room` meeting_room | 2 |
| | t_front_desk | Sign in at the front desk | `unlock_object` reception_pc (`pc_signed_in`) | 3 |
| | t_copy_badge | Copy a staff badge | eventMapping `card_cloned`, `condition: data.cardName === "Lorna Easton FAC card"`, `onceOnly`, `completeTask` (lab_physical_pentest:1113 pattern) | 4 |
| The network (required) | t_drop_box | Plug the drop box into a live port | `unlock_object` meeting_jack (`network_foothold_gained`) | 9 |
| | t_julian_pc | Connect to the partner's PC | `unlock_object` julian_pc (remote `pc_signed_in`; build check B1) | 10 |
| | t_unplug | Unplug the drop box | eventMapping `network_device_unplugged:meeting_jack`, `onceOnly`, `completeTask` | 17 |
| Around the office (optional) | t_comms | Get into the comms cupboard | `unlock_room` comms_cupboard | 5 |
| | t_open_session | Use a laptop its owner left signed in | `unlock_object` thandiwe_laptop (claim `pc_signed_in`; build check B3) | 7 |
| | t_yasmin_pc | Get past a locked screen | `unlock_object` yasmin_pc | 8 |
| | t_server_room | Get into the server room | `unlock_room` server_room | 13 |
| Deeper in (optional) | t_door_controller | Sign in to the door controller | `unlock_object` door_controller | 12 |
| | t_implant | Get a foothold through the front desk PC | eventMapping `network_foothold_gained`, `condition: data.via === "implant"`, `completeTask` (an implant meets no `unlock_object`, objectives-manager.js:368-375) | 14 |
| | t_capture_key | Capture the Staff Wi-Fi key | the stop 15 mapping | 15 |
| | t_staff_wifi | Join Staff Wi-Fi | `unlock_object` staff_ap (`network_joined`) | 16 |
| Wrap up (`missionConclusion`) | t_debrief | Report back to Ama | `#complete_task:t_debrief` in Ama's debrief ink | 18 |

Stop 11 (Finance share) has no task: it is a contrast the presenter shows, and a task would need an event name this plan has not confirmed.

### 2.9 Ama: person and phone

- `ama` (person) speaks twice: the briefing on load and the debrief. Her briefing ends by telling the player to use the phone.
- `ama_phone` carries the "Where next?" choice. Its answer reads globals and task state and names the next unfinished stop, short route first, then the full-route extras. It is the hint system for the whole tour.
- The phone has no `call` entry, so no line says "call me" (README:2361).

### 2.10 Phone texts (sendTimedMessage on ama_phone)

Each is an eventMapping with `sendTimedMessage: { delay, message, targetKnot, skipIfGlobal }` and `onceOnly`. Delays are 4000 to 6000 ms, so two texts that fire together never land at once (README:2993).

| Event | Delay | Text (target knot) |
|---|---|---|
| `pc_in_use`, condition on thandiwe_laptop (field name from the test_access_* fixtures) | 4000 | P1 (hint_open_session) |
| `network_foothold_gained:meeting_jack` | 5000 | P2 (hint_saved_connection) |
| `usb_refused:usb_hub` | 4000 | P3 (hint_injector) |
| `network_device_refused:managed_port`, `condition: data.reason === "port_security"` | 4000 | P4 (hint_live_port) |
| `network_device_unplugged:meeting_jack` | 6000 | P5 (debrief_ready) |

### 2.11 Signs and hints

- Meeting room door: a sign saying the room is booked for the Fenlow visit.
- Kitchen: a sign by the cake: take it through and share it, or wait, people drift in for coffee anyway.
- Rota board in the open plan (the cake fallback).
- Guest Wi-Fi card at reception.
- Partner's office `lockedHint`.
- Managed port refusal message.
- The desk policy's USB line (shown by plantRefusal).
- Hints come from the phone's "Where next?" and the five texts above. No other hint system.

### 2.12 The ending

1. Stop 17's text (P5) asks the player to come back to reception when they are done. It does not start the debrief.
2. At Ama, the debrief opens with a warning choice: carry on looking round, or wrap up now. `#ending_check` sits inside the choice brackets, so the warning shows before anything closes.
3. On "wrap up", Ama's last line carries `#complete_task:t_debrief` and sets the global `tour_debriefed`.
4. An eventMapping on `conversation_closed:ama`, `condition: globalVars.tour_debriefed === true`, plays the credits music and shows the `closingCard` (lab_physical_pentest:550-567 and 780-800; README 2570-2590).

### 2.13 Host and sign lines (text only)

All lines below are first drafts in Ama's voice (VOICE_CAST.md:113: warm and practical, London and southern English). They go through npc-dialog-review as one batch before any voicing ask; nothing is voiced from this plan.

Briefing (ama, stop 1):
- A1 "Morning. You found us. This is Merrin & Sallow, and for the next half hour you're my tester."
- A2 "The partners want to know how far someone gets with a visitor badge and a bag of kit. So do I."
- A3 "Your kit's in the meeting room. The visitor card opens that door and nothing else, in theory."
- A4 "I'll stay here. If you're stuck, check your phone. I'll text when I see something worth a look."

"Where next?" answers (ama_phone, one per state, first unmet wins):
- W1 "Kit first. Meeting room, just off reception."
- W2 "Delphine's front desk. She's not shy about her password, look round the screen."
- W3 "Have a word with Lorna by the comms door. Bring the cloner."
- W4 "Thandiwe's at her desk in the open plan. Watch what happens when she gets up."
- W5 "There's a live port in the meeting room. Plug the box in and see what it can reach."
- W6 "You took a file off Delphine's desktop. Open your keyring."
- W7 "When you've had enough, pull the box out and see what drops."
- W8 (full route, after the short-route stops) "Still time? The comms cupboard, Yasmin's desk, the server room, or the plants in reception."
- W9 "That's the lot. Come and find me at reception."

Timed texts (ama_phone):
- P1 "She's signed in and sitting right there. Give it a minute, or give her a reason to get up."
- P2 "Box is talking. Anything on the network you can already sign in to?"
- P3 "Storage is blocked on that hub. A keyboard isn't storage."
- P4 "That port knows what's meant to be plugged into it. Try one nobody's watching."
- P5 "Box is out. Have a last look if you like, then come back to reception."

Debrief (ama, stop 18):
- D1 (warning) "Before we wrap up: once we start, that's the tour done. Anything else you want to try?"
- D2 (choice) "I'll have another look round." / "I'm done, let's talk."
- D3 "The doors held where they checked who you were. They didn't where they only checked the card."
- D4 "The box got you onto the network, and Julian's saved connection did the rest. His door never came into it."
- D5 "And when the box came out, the sessions that rode on it went with it. The ones you'd made at a keyboard stayed."
- D6 (last line) "Thanks. I'll write it up for the partners."

Other NPCs (short, one each, also through review):
- Delphine: "Visitors sign in at the screen, love. Password's on the side, it's no secret."
- Lorna: "Facilities. If it's a door or a cupboard, it's mine."
- Thandiwe: "Can't stop, deadline."
- Yasmin: "Screen's locked. Always is when I get up."
- Julian: "Working from the kitchen today. My office is through there, not that you'll get in."

Signs:
- S1 meeting room: "Booked: Fenlow Managed IT, all day."
- S2 kitchen: "Cake! Take it through and share it round. (Or just wait. Someone always comes in for coffee.)"
- S3 rota board: "Coffee rota. Whoever's name is up makes the next round."
- S4 guest card: "Guest Wi-Fi: MerrinSallow-Guest. Password on the back."
- S5 partner door lockedHint: "Julian's office. His card only."
- S6 managed port: "Port security: this device is not the one registered to this port."
- S7 desk policy USB line: "USB storage is blocked on this PC."

Closing card: "Merrin & Sallow: access tour complete."

## 3. Server enforcement and sync budget

### 3.1 What the server enforces

Hard-enforced (the client cannot fake these):

| Thing | How | Reused fixture |
|---|---|---|
| Server room keypad code | `requires` checked by the server | keypad doors across test_access_doors |
| Meeting room door | `requires` the visitor card's id | test_access_doors:233 |
| Comms door, partner door | access lists on roles and people; a cloned card carries its owner's identity (recordCloneOnServer, rfid-minigame.js:551) | test_access_doors |
| reception_pc, yasmin_pc passwords | sign-in on the server; the sticky note text is built server-side from `habits.writesDown` | test_access_networks:735-736 |
| Door controller password | credential `foundIn` facilities.txt with proof session reception_pc | test_access_keyring:44-49 |
| julian_pc remote sign-in | saved_connection credential `julian_rdp`, held only after taking the file | test_access_keyring:146-156 |
| Drop box at meeting_jack, port security at managed_port, guest VLAN port | plant and refusal answered by the server | test_access_networks, test_access_devices |
| Implant foothold | `grant_foothold` with `needsSession` and `needsHeld`: keyboard session on reception_pc with no foothold or remote route, the held injector, USB policy not refusing hid (network_model.rb:266; network_access.rb:468-512) | test_access_networks:771-790 |
| Finance share | access roles finance and partner on the resource | test_access_networks |
| Staff Wi-Fi key and its capture | psk is a per-game render; the capture secret must match it | capture_payload_secret_test.rb:147 |
| Unplug | server ends exactly the sessions in `endedPcIds` (network-links.js:595) | test_access_networks |

Best-effort (client side, by design):

- The USB stick refusal at the hub: plantRefusal grants nothing, so it needs no server check (interactions.js:1015-1043).
- Office-life timing: Thandiwe and Yasmin leaving their desks, the cake draw, the rota board's `needs.set`, `pc_in_use`. No required task depends on any of it.
- Task completion from client eventMappings (t_copy_badge, t_implant, t_capture_key, t_unplug): the events behind them are server answers, but the mapping itself runs on the client.
- Phone texts and "Where next?".
- There is no tailgating in the tour.

### 3.2 player_state sync budget (V8)

The state must not grow during play, and every change goes as a delta.

- No counter rises over time. Every global the tour sets is a boolean set once (twin global, `tour_debriefed`, the onceOnly flags).
- The rota board mapping writes need levels, not globals, and has a 30 s cooldown.
- Bounded sets: footholds at most 4 (meeting_jack, implant, Staff Wi-Fi, guest); signed-in PCs at most 5; captures at most 2.

Expected counts against the caps in BUDGET_CAPS (scripts/validate_office_life.rb:766-770):

| Cap name | Cap | Tour |
|---|---|---|
| workstation globals | 24 | 12 (4 owned PCs: reception_pc, thandiwe_laptop, yasmin_pc, julian_pc) |
| magnet servings | 2 | 2 |
| dropped magnet items | 2 | 1 |
| office-life items | 4 | 1 |
| office-life onceOnly mappings | 10 | at most 8 (5 texts, card, implant, capture) |
| frustration | 6 | 0 to 2 |
| workaround slots | 4 | 0 |
| workaround and onUse globals | 8 | 0 |
| heard_ globals | 8 | 0 |
| reveal and left-behind globals | 6 | 0 |
| Friendface posts | 10 | 0 |

Whether the validator counts the non-office-life onceOnly mappings in that row is for the builder to read off its report; the tour stays under 10 either way.

## 4. Tests and proof

### 4.1 Validators

- The scenario validator: no errors, no unknown errors, door alignment OK, no overlap.
- `python3 scripts/predict_door_sides.py`: corners as in 2.2.
- scripts/validate_office_life.rb: V2, V4, V5 clean; V8 within every cap in 3.2.

### 4.2 Solvability

- Dungeon graph and walkthrough (break-escape-dungeon-graph, walkthrough-scenario skills): every required task reachable on the short route with no NPC movement.
- Lock and key check: each lock has exactly the key the plan names, and the partner door has none reachable.

### 4.3 Corpus tests (pick the scenario up with no edit)

- test/unit/scenario_schema_test.rb:238
- test/unit/scenario_object_tile_bounds_test.rb:37
- test/models/break_escape/payload_scan_fresh_state_test.rb:249
- test/models/break_escape/payload_scan_opened_state_test.rb:309
- test/models/break_escape/capture_payload_secret_test.rb:147
- test/unit/break_escape/tts_mission_lines_test.rb:31
- ink_compiled_staleness_test.rb:26
- phish_superset_test.rb:30

### 4.4 Hand lists (add the scenario)

- test/js/validator-office-life.test.mjs:442 (V2, V4, V5 clean).
- The validator "no unknown errors" run, like test/js/validator-network-model.test.mjs:803.
- Optional: a measured bootstrap base in sync_payload_size_test.rb:17.

### 4.5 Scripted walks

A scripted playtest (playtest-scenario skill, window.__test bridge) of each route:

- Short route: stops 1, 2, 3, 4, 6, 7, 9, 10, 17, 18. Pass when every required task completes and the closing card shows.
- Full route: all 18 stops. Pass when every task completes, each refusal (partner door, managed port, USB hub, Finance share from the foothold) shows its line, and stop 17 ends exactly the remote and pivot sessions.
- Headless physics: setFPS(20) with fixed steps on.
- Any "stuck" claim from a scripted walk is checked by a second, unscripted run before anyone acts on it.

### 4.6 Live proof

- A keyless server from the worktree on :3002. Never :3000 or :3001. `db:seed` only; no other db task.
- New game via tools/playtest/new-game.rb (finds the mission by id or name, lines 111-116).
- Check on the real path, not a helper: the remote sign-in completes t_julian_pc; the unplug answer's `endedPcIds` lists julian_pc and door_controller and not reception_pc; the implant survives the unplug; the captured key joins Staff Wi-Fi.
- No edits to a game row's scenario copy or state.

### 4.7 Build-time checks

- B1: does a saved_connection sign-in complete `unlock_object` julian_pc? Client: yes. objectives-manager.js:363-366 skips only `relay` and `token`, and pc-sessions.js:769-771 emits a remote sign-in with neither. Still to confirm: the server records a remote sign-in in `signedInPcs`, so the task validates there too. If it does not, t_julian_pc moves to an eventMapping on `pc_signed_in:julian_pc` with `completeTask`.
- B2: the exact V8 cap names are those in BUDGET_CAPS (scripts/validate_office_life.rb:766-770), as listed in 3.2. Check the validator's report uses the same strings, and the tour's counts.
- B3: a claim sign-in (Thandiwe's open session) completes `unlock_object` thandiwe_laptop. Same handler as B1; confirm in the scripted walk.
- B4: the `pc_in_use` payload field that names the PC, for P1's condition (read from a test_access_* fixture).
- B5: CAKE_ITEM.md is at b1f3a4396 and not yet reviewed. Before slice 4 builds the cake, diff the spec against b1f3a4396 and take any changed numbers or fields. Until the cake's engine side is on main, the rota board is the tour's only lever.

## 5. Build slices

Each slice is one builder's work. Each ends with the validator clean and the corpus tests green, and is committed on the branch before the next starts.

1. **Skeleton.** Seven rooms, doors, locks (keypad, three RFID), sign-in PCs as plain objects, the cast placed static, `player_phone`, signs. Proves: grid, door corners, lock types, art keys; corpus tests pick it up.
2. **Access and networks.** office_lan, server_lan, guest; APs; meeting_jack; shares; policies; reception_pc, yasmin_pc, julian_pc, door_controller; credentials (facilities.txt, julian.rdp); Lorna's card and `#clone_keycard`. Proves on the server: stops 2, 3, 4, 9, 10, 11, 12, 13, 16, 17. Settles B1.
3. **Devices.** Kit table; USB hub and implant socket; managed port and patch panel; rogue AP console and plant; capture tablet. Proves: stops 5, 14, 15 and the refusals.
4. **Office life.** Thandiwe and Yasmin needs and habits; coffee preset; rota board mapping; the cake to CAKE_ITEM.md (b1f3a4396 or its reviewed successor). Add the scenario to validator-office-life.test.mjs:442. Proves: stops 6, 7, 8; V2, V4, V5, V8 clean; B2, B3, B4.
5. **Ama, objectives and ending.** Ama person and phone ink, "Where next?", the five timed texts, aims and tasks, the debrief with warning, the closing card. Add the scenario to the validator no-unknown-errors list. Proves: every task completes; ending order. Then npc-dialog-review on all new lines.
6. **Proof.** Scripted walks of both routes, live proof on :3002, optional sync payload base. Proves: section 4 end to end. After this, and only after the dialogue review, the voicing ask goes to the user.

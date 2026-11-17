# demo_access_tour: build plan

Status: PARTIAL (v0). Sections 0 and 1 are checked against main 7ca03520e. Sections 2 to 5 are not written yet; the next planner writes them from the audit's section 4 (tmp/handover/ac0/DEMO_AUDIT_ACCESS_NETWORKS.md) with the corrections in section 1 below.

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

## 2 to 5. Not written yet

Design, server-side enforcement and sync budget, tests and proof, and build slices are still to write. See the handover note.

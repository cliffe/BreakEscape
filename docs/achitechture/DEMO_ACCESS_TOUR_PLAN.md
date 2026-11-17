# demo_access_tour: build plan

Status: v5. Sections 0 and 1 are checked against the tree at 9f415ef21 (main 7ca03520e plus plan commits). Sections 2 to 5 give the design, server enforcement and sync budget, tests and proof, and the build slices.

User decisions: D100 (one two-act scenario, 35 min with a 15-min short route; Merrin & Sallow with Ama Owusu; office life light, 2 needs NPCs and a cake lever, overlay off, no task depends on an absence; no new engine work) and D101 (audience colleagues who know Break Escape; host lines text-only first, then dialogue review, then a voicing ask; reuse existing sprites; collection test_scenarios). Q1: Lorna Easton's card is the one the player copies. Q2: a presenter lever that sets a need level (the rota board) backs up the cake.

Standing rule for every secret: nothing the player needs to type or present may be readable in the client's copy of the scenario. Passwords come from the server (a sticky note built from the owner's `habits.writesDown`, or a file inside a sign-in PC's contents); codes and keys are ERB renders the server withholds.

## 0. Format status: settled

The three changes from SCENARIO_FORMAT_REVIEW_ACCESS.md are on main:

- One outage field: step 8a, format 1. `downIf` and `affordance.offWhen` became object, network and resource `offWhen` (lib/break_escape/format_upgrade.rb:36-58).
- One owner field: step 8b, format 2. `owner` on objects and items (scripts/scenario-schema.json:5482); `needsHome` no longer sets an owner (format_upgrade.rb:60-100).
- Habits in one block: step 8c, format 3 (`habits.screen`, `habits.print`, `habits.usb`; schema 4410-4421).
- `STEPS = [STEP_8A, STEP_8B, STEP_8C]` (format_upgrade.rb:114), so the current format is 3.
- Strict keys: step 2, on main (SCENARIO_FORMAT_HARDENING_PLAN.md section 3).
- No scenario template still uses a retired key: a grep for `screenOwner|downIf|screenHabit|phoneOf|leftBehindBy|usbHabit|printHabit` over scenarios/*/scenario.json.erb matches nothing.
- tmp/handover/ac0/HARDENING_FINAL_HANDOVER.md:6 says the hardening plan is complete on main (steps 1 to 8c, 6a-1 and 6a-2; 6b was not needed).

Still open, and not a blocker:

- D14 (scenario schema cleanup) is unanswered on AC0's decisions page. It covers the hardening plan's section 7 (drop dead fields, close the core kinds), which would turn unknown keys on rooms, objects, NPCs, mappings and tasks into errors.
- The demo uses no dead field (`endGoal`, `version`, `scenario_id`, `isEndGoal`, `autoTrigger`, `note_*`) and no unknown core key, so that closure costs it nothing.
- The format review's recommendations 6 to 9 were not taken (role merge rule, one planting shape, renaming `social` and `profile`, the Friendface person). If the user later picks one, the demo migrates with the rest of the corpus; it uses `grant_foothold` once.
- Who settles: the user, via D14 on AC0's page.

Verdict: the build can start; it does not wait on any format branch.

## 1. Engine facts the design relies on

### Grid and doors
- Rules: README_scenario_design.md:2766-2843. Widths are multiples of 5 tiles; heights are 2 + 4N. A single N/S door's corner follows the parity of (gridX + gridY). A single E/W door sits 2.5 tiles from the top. The way in can never be the second element of a multi-room side. Check with `python3 scripts/predict_door_sides.py`.
- Maps (public/break_escape/assets/rooms/*.json): room_aw_merrin_lobby, room_aw_merrin_sallow, room_qdc_break, room_ceo, room_meeting and room_servers are 10x10 (2x2 GU). room_lw_comms is 5x6 (1x1 GU).
- The awareness course's own Merrin & Sallow maps (room_aw_merrin_lobby, room_aw_merrin_sallow) are used for reception and the open plan, so the firm looks the same as in the course. They are shared with the course, so the tour never edits them: everything it adds is a scenario object.
- A skeleton with the seven rooms gives the grid in 2.2 with no overlap and door alignment OK. The kitchen map is 10x10 like the one it replaced, so the door results hold; slice 1 reruns both checks.

### Cast art
- All six NPCs have the full set in public/break_escape/assets/characters/: an atlas (`<key>.png` and `.json`, 288 frames, including `sit_*`), plus `_headshot`, `_talk`, `_talk_init` and `_visemes`.
- Keys: ama_owusu, delphine_arvanitis, thandiwe_moyo, yasmin_chaudhry, julian_sallow, lorna_easton. Delphine's course id is `delphine_reception`; the tour uses the sprite key.
- Art fields as ca18 uses them (scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:808-810): `spriteSheet`, `spriteTalk`, `spriteVisemes`.
- The Merrin & Sallow cast (planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:104-113): Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo, Delphine Arvanitis, Lorna Easton (reception and facilities lead) and Ama Owusu of Fenlow Managed IT. Ages run from the 30s to the 60s and backgrounds vary.
- Ama: "warm and practical", London and southern English (VOICE_CAST.md:113). The office-life showcase uses the same host, so her lines must match it. Delphine is "poised and polite under a little pressure" (VOICE_CAST.md:111).

### Ama on the phone
- The lab's pattern: a person NPC plus a phone NPC (`ruth` and `ruth_phone`, lab_physical_pentest scenario.json.erb:846 and 953, debrief NPC at 2573).
- A phone NPC needs a `phoneId` that matches a phone in `startItemsInInventory`, and has no `position` or `spriteSheet`. It is listed in a room's `npcs` (reception), because captures are found through room NPC lists (capture_model.rb:122-129).
- Timed texts: eventMapping `sendTimedMessage` ({ delay, message, targetKnot, skipIfGlobal }, schema 5080-5086; README 2008-2045), spaced 4 to 6 seconds apart (README:2993). No "call me" text unless the contact has a `call` entry (README:2361).
- Ink cannot read task or aim state. Every task carries `onComplete.setGlobal` (objectives-manager.js:1125-1141) so the hub and Ama's knots can branch on it.

### Mapping conditions
- NPC eventMapping conditions go through `safeEvaluateCondition` (npc-manager.js:14-136), not `eval`. Supported terms: `value`, `name`, `data.x.y`, `globalVars.x` operands; `===`, `!==`, `>=`, `<=`, `>`, `<`; a right-hand side that is a literal or another `data.`/`globalVars.` operand; `<operand>.includes('s')`, which tests membership when the operand is an array; `!`; `&&`; and a bare operand as a truthy check. A missing link resolves to undefined without throwing.
- Anything else (a leading `(`, `||`, a method other than `includes`) logs "unsupported condition term" and is false. Every condition in the tour uses only the supported forms.
- Music entry conditions use a separate evaluator with `globalVars` in scope (scenario-music-events.js:38-57).

### Sign-in PCs, owners and notes
- `login_postit_for` builds the sticky note from the owner's creds only when the owner has `habits.writesDown` and the PC authors no `postitNote` (game.rb:3330-3342). It is served only by GET /login_accounts, with no presence check on the owner. NPC `creds`, `role`, `awareness` and unshipped habits are withheld from the client (game.rb:7214-7275).
- A sign-in PC's `contents` leave every room answer while it is `lockType: login` (game.rb:7094-7100).
- An owner with no needs is never present, so the sign-in screen always shows (workstation-state.js:625-627, 676-680). An owner with needs is present while `atPost` and available (workstation-state.js:673-676); the PC then answers `pc_in_use` with `{ pcId, ownerId, signedInBefore }` (pc-sessions.js:750), also emitted as `pc_in_use:<pcId>` (pc-sessions.js:328-333).
- An NPC that sits at a PC ends any session the player holds there, remote included (pc-sessions.js:84-87, 299-301).
- Every sign-in that is not a relay or a token, claims and saved-connection sign-ins included, is added to `signedInPcs` (game.rb:4321-4326), and the `unlock_object` task on a sign-in PC checks `signedInPcs` (game.rb:5159-5182). `unlock_object` on a jack or an AP checks `gainedFootholds` (game.rb:5168-5179). Client side, objectives-manager.js:362-366 skips only `relay` and `token`.
- `pc_signed_in` carries `fromPcId` when the session was opened from a desktop (`_remoteOf`, pc-sessions.js:958-964).
- The Sign out button sends POST /logout and emits `pc_signed_out` with `reason: "sign_out"` (pc-sessions.js:45-53, 795), also as `pc_signed_out:<pcId>`. Signing out of a desktop that other sessions were opened from ends those sessions too (pc-sessions.js:795-800).
- K-lock (Lock in the desktop start panel) shows on password sessions and on credential sessions with a foothold or `from` route, never on a claim, guest or relay (pc-sessions.js:431-440; server `session_lockable?`, game.rb:3737-3743; `sessionLockingSupported`, games_controller.rb:443).

### Saved connections on a desktop
- A takeable file on a sign-in desktop opens an Open / Copy / Move dialog. A saved connection adds Connect (container-minigame.js:1681-1683, 2011-2021).
- The server marks every served item whose credential is a saved connection with display-only `connect: true`, and drops any `connect` the scenario authors (`mark_saved_connection!`, game.rb:1873-1883). A scenario cannot switch Connect off for one file.
- Connect on a desktop file takes it (a copy unless the file says move) and signs in `from` that desktop's PC (container-minigame.js:2028-2056).

### Routes, the pivot and the unplug
- A saved_connection credential allows both `foothold` and `from` routes (credential_model.rb:23). GET /keyring lists a `{ from: <pc> }` row for every held session that reaches the target (credential_keyring.rb:444-465).
- The client's `connectRoute` (keyring.js:75-88) picks a `from` row before any foothold. Among several `from` rows it prefers the desktop Connect started on, then the most recently opened source desktop (keyring.js:69-74). With no `from` row it uses a foothold.
- Reach to server_lan counts any held, unlocked session on office_lan (network_access.rb:1259-1284, 1396-1411). A locked session extends no reach (network_access.rb:1268-1275, 1362).
- The door controller is headless. Its sign-in screen opens only from the network view, which passes the view's foothold (network-view-minigame.js:687-694); the session records that foothold (game.rb:4316-4317). Lorna's credential is a `password` (`connects: false`, credential_model.rb:21), so no keyring Connect reaches it.
- The unplug's `endedPcIds` lists expired tokens, sessions whose `foothold` is the unplugged jack, and `from` sessions whose source session went in the prune (network_access.rb:290-321, 410-415, 1378-1395, 1446-1475). A `from` session whose source is a keyboard session the player still holds survives.
- So two things decide what the unplug ends:
  - Julian's session: its route. Connected with no desk session held, it rides the box and ends. Connected `from` a desk the player still holds, it survives.
  - The door controller session: the foothold the network view was opened from. Opened at the box, it ends. Opened from the implant's or Staff Wi-Fi's link item, it survives, but only while another office_lan session is held. The door controller sits on server_lan, which is in reach only from a held office_lan session, so when the unplug ends Julian's box session and nothing else on office_lan is held, the next prune ends the door controller session too (network_access.rb:1255-1281, 1398-1412, 1453-1467).
- The plant consumes the rogue device into the foothold record (network_access.rb:253-268); only the unplug gives it back (network_access.rb:303-308). A jack click with no held rogue device is refused on the client with `reason: 'no_device'` before any request (network-links.js:398-405).

### Devices
- Implant: `grant_foothold` with `needsSession` and `needsHeld` (NetworkModel.grant_foothold_actions, network_model.rb:266; NetworkAccess#implant_foothold!, network_access.rb:468-512). One action per [pc, shape] (network_access.rb:445-450; README:1150). The session must be a keyboard session with a blank foothold and no relay or `from` route (496-501); the held item must not be client-forged (454-465); the USB policy refuses storage only under `storage_blocked` (access_work.rb:1198-1204, network_access.rb:506-512), so the injector (hid) passes the desk policy. Anything missing answers `not_ready` (the method is implant_not_ready; the JSON reason is not_ready) (network_access.rb:491-518), including a held stick, since `needsHeld` names the injector. An implant meets no `unlock_object` (objectives-manager.js:368-375); its foothold event carries `via: "implant"` (network_access.rb:527).
- An item plant cannot sit on the sign-in PC itself (README:943): the implant socket is a separate dock object, as `sam_dock` (test_access_networks:771-790).
- USB stick refusal: a dock with its own `policy` and `requiresItem`; on a click the client's plantRefusal shows the policy kind's line and emits `usb_refused:<dockId>` (interactions.js:1015-1043). It grants nothing. It refuses only when every matching held item is refused, so the stick's hub and the injector's socket are two objects.
- Port security: refusal with `reason: "port_security"` and the authored `portSecurityMessage` (network_access.rb:111-116, 243-245; client network-links.js:438; README 1024, 1138). The device stays held.
- Rogue AP: `knownClients: [{ npcId, label }]` is display only: the console draws a headshot and label (rogue-ap-model.js:27-28, rogue-ap-minigame.js:232-240) and matches no network. The fixture's laptop (test_access_devices:257-266) has no network field, so Thandiwe's laptop needs none for the AP. The console appears once the kit is planted (`hiddenWith`, test_access_devices:143-205). The capture secret is shown only when `social.captures.revealSecret` is true (game.rb:2494-2495; capture_model.rb:569-575; test_access_devices:10).
- Capture proof: the server matches a client capture against the authored writers by `targetId` (capture_model.rb:552-556, 576-580). A capture whose `address` is no account username takes the mapping's own `proof` and its owner's `captureProof` (capture_model.rb:957-970), so the Staff key capture needs `proof` in its `addCapture` and nothing on Thandiwe.
- Wi-Fi: the Wi-Fi block is per network (`wifi_of`, network_access.rb:345). `join_network!` compares the key with the network's psk and lets anyone join a network with no psk (network_access.rb:371-374). The psk is withheld from the client (`withhold_network_keys!`, network_access.rb:23).
- Share admission is player-wide: an access-listed share opens if any held, unlocked, routed session's identity is on the list (network_access.rb:1580-1627, 1726). A refusal from the bare foothold shows only before any session with the role is held.
- Card copy: the server records a clone only with a cloner held and the NPC met (game.rb:4016-4053), and an RFID door counts a recorded clone while a cloner is held (game.rb:3922-3939). `card_cloned` carries `cardName` from the card's `name` (rfid-minigame.js:555-559); `#clone_keycard:<card_id>` without a cloner only warns (chat-helpers.js:366-402).

### Office life
- Magnet: `affordance.magnet` on a held, droppable item (schema 3981; engine npc-needs.js:842-863). Any loaded object with a magnet is registered when its room loads (npc-needs.js:866-881), so a magnet that starts in a room is live at once; one carried in the inventory goes live when dropped (`magnet_placed:<id>` with `roomId`, npc-needs.js:863). With `tempt` 30 and `urgentAt` 30, a need is tempted at 60 or below.
- `object_interacted` is emitted bare, with `{ objectType, objectName, roomId }` (interactions.js:862-867), so a mapping keys on `data.objectName` (test_needs_sims:590).
- A completed `use` job at a PC emits `npc_used:<pcId>` (npc-needs.js:3586, 3684). The work need picks a target among objects whose affordance satisfies it (npc-needs.js:1786-1797), so the laptop needs a work affordance.
- Coffee: a scenario object like the lab's `coffee_station` (sprite `coffee_station1`, lab_physical_pentest:2379), capacity 1, so a second NPC queues.
- V8 (scripts/validate_office_life.rb) counts onceOnly mappings whose event has an office-life prefix (`npc_used`, `magnet_`, among others, lines 50-58) or whose action writes `needs` (lines 807-811).

### Live games
- tools/playtest/new-game.rb finds the mission row by id or name (lines 111-116). `db:seed` is the only db task allowed.

## 2. Design

### 2.1 Premise

Merrin & Sallow is a small firm in the awareness course. Its IT is run by Ama Owusu of Fenlow Managed IT. The partners have asked Fenlow for a walk-round access test of the office, and Ama has brought the player in to do it while she stays at reception.

The tour is for colleagues who already know Break Escape. It shows the access and network model in one office: doors and cards, sign-in PCs and their owners, saved credentials, a drop box on a wall port, a pivot to a second network, a keystroke injector, an evil-twin access point, the clean-up when the box comes out, and what the comms cupboard's ports make of the box afterwards. Office life is light: two staff with needs, one cake and one rota board, the overlay off.

Full route: about 35 minutes, 19 stops. Short route: about 15 minutes, 11 stops (marked S). No required task on either route depends on an NPC being away; the absence beats are optional tasks.

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
| server_room | room_servers | (0,-4) | S to open_plan | keypad, `lockType: pin`, `requires` `<%= @random_pin %>` (the same render appears in the door controller's file) |
| kitchen | room_qdc_break | (-2,-2) | E to open_plan | none |
| partner_office | room_ceo | (-2,0) | E to reception | RFID, access `people: ["julian"]`, with a `lockedHint`. Never opened in the tour. |
| meeting_room | room_meeting | (2,0) | W to reception | RFID, `requires` the visitor card's id (test_access_doors:233) |
| comms_cupboard | room_lw_comms | (2,-2) | W to open_plan | RFID, access `roles: ["facilities", "it"]` |

Door corners, from predict_door_sides.py on the skeleton: reception north LEFT, east and west TOP (y 2.5); open plan north LEFT, south LEFT, east and west TOP; every leaf door on its shared side.

Kitchen: room_qdc_break has a fridge, an undercounter fridge, a vending machine and a kettle, so the coffee station sits in a room that reads as a kitchen. The tour adds no fridge of its own.

Open plan: the course map has a conference table, six studio chairs, a kiosk and a plan chest, but no desks. The tour adds two desks as scenario objects from the existing catalogue, square to the walls: Thandiwe's on the west half, Yasmin's on the east half, each with its chair as the owner's seat (`needsHome` is the PC; the seat is the chair beside it). Lorna stands near the comms door, clear of its approach cell; she needs no desk.

Reception: the lobby map already has a `pc8` on its table layer and two `planter_fig1` as plain Tiled items. The scenario's `reception_pc` takes the lobby map's `pc8` slot (it claims it by sprite and moves to the counter's left end, so the west table is left bare, which is accepted). The two hideable plants go on other clear spots by the walls, so nothing doubles up and the course map stays as it is.

### 2.3 Networks, resources and policies

| Network | Joined by | Holds |
|---|---|---|
| office_lan | meeting_jack (drop box), Staff Wi-Fi, implant on reception_pc | reception_pc, thandiwe_laptop, yasmin_pc, julian_pc, the Client-Letters share, the Finance share |
| server_lan | `networkLinks` from office_lan, in reach only while a session on office_lan is held | door_controller |
| guest | Guest Wi-Fi, the guest VLAN port on the patch panel | nothing of the firm's: the contrast network |

- Staff Wi-Fi: `networks.office_lan.wifi: { "ssid": "MerrinSallow-Staff", "psk": "<%= @random_password %>" }`. The same render goes in the capture mapping's `addCapture.secret`, so the captured key is the real one. `@random_password` is used for this psk only.
- Guest Wi-Fi: `networks.guest.wifi: { "ssid": "MerrinSallow-Guest" }` with no `psk` key (an open guest network). The guest card at reception names the SSID only.
- `"social": { "captures": { "revealSecret": true } }`, so the captured Staff key shows on the capture tablet.
- Resources: `client_letters` share on office_lan, open to anyone on the network. `finance_share` on office_lan, access `roles: ["finance", "partner"]`: Julian's and Yasmin's desktops map it, the drop box foothold alone does not.

| Policy | Settings | Used by |
|---|---|---|
| desk (`defaultPolicy`) | no `autoLockMin`; USB `storage_blocked`; remote allowed | every PC unless named below, the USB hub |
| partner | remote allowed | julian_pc. Remote sign-in bypasses the partner office door: that is the point of the stop. |
| infra | remote allowed | door_controller |

No policy sets `autoLockMin`. Screens lock only when Yasmin leaves (`locksScreenOnLeave` on her PC) or when the presenter presses Lock. A locked session extends no reach, so a lock mid-tour would cut off server_lan.

### 2.4 Cast and accounts

| NPC | Where | Account (`creds`, `role`) | Habits and needs | Role in the tour |
|---|---|---|---|---|
| ama (person) | reception, immovable | none | none | Briefing (`timedConversation` on `game_loaded`, `skipIfGlobal: "done_t_meet_ama"`), a mid-tour knot, and the debrief. |
| ama_phone | listed in reception's `npcs`; `phoneId: player_phone`, no `position`, no `spriteSheet`, `livePreview` | none | none | "Where next?" hub, every timed text, the capture mapping, the cake guard. |
| delphine | reception, front desk | username `darvanitis`, literal password, role `reception` | no needs; `habits.writesDown`; owner of reception_pc | Her sign-in screen always shows, with the note the server builds from her password. |
| thandiwe | open plan, west desk | username `tmoyo`, literal password, role `design` | needs below; owner and `needsHome` of thandiwe_laptop | Leaves her laptop signed in when she gets up (`lockChance: 0` on the laptop). The rogue AP's known client. |
| yasmin | open plan, east desk | username `ychaudhry`, literal password, role `finance` | needs below; `habits.writesDown`; owner and `needsHome` of yasmin_pc | The good habit (`locksScreenOnLeave: true` on her PC) next to the bad one (the note). |
| lorna | open plan, static near the comms door | username `leaston`, literal password, role `facilities`; `creds.card` with `name: "Lorna Easton FAC card"`, EM4100 | none | Copy her card from the conversation. Her account is admitted to the door controller. |
| julian | kitchen, static | username `jsallow`, strong literal password never shown anywhere, role `partner`; no `creds.card` | no needs, no routine | The partner whose PC is reached only through the saved connection. Never sits at his PC, so a remote session lasts until the unplug or its source desk goes. |

Literal passwords are safe: NPC creds never reach the client, and the notes come from GET /login_accounts. Only Lorna carries role `facilities` or `it`, and Julian has no card, so no card the player can get opens the partner door.

Needs. The cake numbers are the minimal variant in CAKE_ITEM.md at 08646ad8b (branch plan/ol-showcase): hunger decay 0.5 per minute, urgent at 30, start 50, so both are tempted all tour and never urgently hungry before 40 minutes.

| NPC | Need | Decay per min | urgentAt | Start | Effect |
|---|---|---|---|---|---|
| thandiwe | hunger | 0.5 | 30 | 50 | Tempted by the cake as soon as she sees it. |
| thandiwe | caffeine | 1 | 30 | 45 | Wants coffee about 15 minutes in, if nobody prompts her. The rota board sets it to 10. |
| thandiwe | work | 1 | 30 | 90 | Never urgent unprompted. The rogue AP nudge sets it to 10, so she uses her laptop. |
| yasmin | hunger | 0.5 | 30 | 50 | Tempted by the cake as soon as she sees it. |
| yasmin | caffeine | 1 | 30 | 50 | Wants coffee about 20 minutes in. The rota board sets it to 10. |

Where the tour departs from the spec's minimal variant, and why:
- Thandiwe's caffeine and work needs: stop 12 needs her coffee run and stop 15 needs her to use her laptop. The cost is the one the spec names: she may be away when the cake goes down, and then learns of it on her return (npc-needs.js:958-970), so the cake is a best-effort cue for her.
- Yasmin's caffeine need: the rota board is the only lever that empties her desk on cue, and it works by setting a need the coffee station satisfies. Without it, stop 13 would rest on the cake alone, which is gone after two servings.
- P6, the guard text, follows the spec's optional guard (a mapping on `magnet_placed:cake` with a cooldown and no onceOnly), but as a phone text from `ama_phone` and not a bark, since the phone has no position to bark from. A second wrong drop gets the text again after the cooldown.
- Everything else (item fields, magnet numbers, inventory start, pools, `cake_servings`) is the spec as written.

### 2.5 Items and where they are

Start inventory (`startItemsInInventory`): `player_phone`, and the `cake` exactly as the spec's snippet (type `cake1`, takeable, droppable; affordance `satisfies ["hunger"]` (the spec has `"social"` too; it is dropped because no NPC in the tour has a social need, so it does nothing), `restores` 40, `useSeconds` 12, `capacity` 3, `chatter "cake"`, `useSound "eat_snack"`; magnet `tempt` 30, `servings` 2, `perPerson` 1, `announce "news_cake"`, `newsRadius` 5). The scenario-level `chatter` declares the spec's `cake`, `news_cake` and `grumble_gone` pools.

Reception:
- `visitor_card`: RFID card, opens the meeting room only.
- `guest_wifi_card`: readable card with the guest SSID.
- `staff_ap`, `guest_ap`: `wifiAp` objects for the two networks.
- Two plants with hideable spots; one is where the rogue AP goes.
- `planted_rogue_ap`: the rogue AP's console, `hiddenWith: kit_rogue_ap`.
- `reception_pc`: sign-in PC, `lockType: "login"`, owner delphine, no `postitNote`.
- `usb_hub`: dock beside the PC, `requiresItem: demo_stick`, `policy: desk` (shows the engine's storage line, emits `usb_refused:usb_hub`).
- `implant_socket`: dock beside the PC, `requiresItem: kit_injector`, a `confirm_action` that runs `grant_foothold` on reception_pc with `needsSession` and `needsHeld` (sam_dock pattern).

reception_pc contents (withheld until a session):
- `facilities.txt`: names Lorna's door-controller password. Declared as a credential, kind `password`, `account: lorna`, `foundIn` this file, proof session reception_pc (test_access_keyring:44-49).
- `julian.rdp`: `text_file`, takeable, `credential: julian_rdp` with `account: julian`, a saved connection to julian_pc (test_access_keyring:146-156). `"onRead": { "setVariable": { "seen_julian_rdp": true } }` and `"onPickup": { "setVariable": { "has_julian_rdp": true } }`. A read prefers `onRead`, so `onPickup` applies only on a take (inventory.js:652-665). The desktop offers Open, Copy, Move and Connect on it (1, Saved connections); the tour asks for Copy.

Meeting room, kit table (square to the walls):
- `rfid_cloner`
- `kit_dropbox`: `rogueDevice`, the only one in the tour
- `kit_injector`: `usbClass: hid`
- `demo_stick`: `usbClass: storage`
- `kit_rogue_ap`
- `capture_tablet`: page-builder captures view (test_access_devices:99-102)
- `meeting_jack`: live wall port on office_lan

Comms cupboard:
- `managed_port`: `networkJack: true`, `network: "office_lan"`, `portSecurity: true`, `portSecurityMessage` "Port security: this device is not the one registered to this port.", `jackConfirm`.
- `patch_panel`: `panelPorts` list (as the fixture's `p3_patch_panel`) whose spare port names `guest_vlan_port` under `jack`.
- `guest_vlan_port`: `networkJack: true`, `network: "guest"`, `panelOf: "patch_panel"`, `linkName`, `jackConfirm`. Plugging the box here lands on guest.
- Without `networkJack` and a network the scenario defines, the server cannot find the jack (`find_jack`, network_access.rb:99-107; network_model.rb:38-52) and the plant answers 404. Fixture: test_access_devices:342-390.

Server room: `door_controller`: `headless: true`, `lockType: "login"`, on server_lan, access `roles: ["facilities"]`; its contents hold a door-codes file with the server room code (`<%= @random_pin %>`).

Open plan:
- Two desks (2.2).
- `thandiwe_laptop`: owner thandiwe, `lockChance: 0`, on office_lan, `affordance: { "satisfies": "work", "restores": 60, "useSeconds": 3, "useFrom": <the chair side> }` (test_access_devices:264 pattern).
- `yasmin_pc`: owner yasmin, `locksScreenOnLeave: true`, no `postitNote`.
- `rota_board`: `name: "Coffee rota"` (unique in the scenario).

Partner's office: `julian_pc` (owner julian, `policy: partner`).

Kitchen: `coffee_station` (lab pattern: `affordance.satisfies: "caffeine"`, capacity 1, a `useFrom` cell and a `queue` line); Julian; the kitchen sign.

Open plan also has `coffee_station_open_plan`, a second machine on the north wall with the same affordance. The engine simulates only loaded rooms, so a kitchen nobody has opened is no coffee source and the rota board would park both staff (slice 4 review M1, confirmed live). The kitchen machine stays for when the kitchen is visited.

`globalVariables`: `cake_servings: 2`, and every boolean the tour sets (2.10), all false at start.

### 2.6 The cake and the rota board

The cake is the spec's minimal variant (CAKE_ITEM.md at 08646ad8b). The tour designs nothing of its own:

- It starts in the player's inventory, so nobody knows of it until it is dropped. Ama mentions it in the briefing (A3b). The player drops it in the open plan ("Drop here"); beside a table it goes on the table top. Thandiwe and Yasmin are in that room, so they learn of it by sight at once.
- Hunger starts at 50 inside the tempt band (60 or below), so a seen cake tempts both. 2 servings, 1 each; the last serving removes it and both walk back to their desks.
- No task, no overlay. The guard text (2.10, P6) asks the player to take it through if it goes down anywhere else.

Reload. A dropped cake is saved on the server as a room object and leaves the inventory (`persistDrop`, item-drop.js), and the room places it again on reload with its servings from `cake_servings`. The office_life_showcase proves this live as build check BC1, which covers four reload cases: cake held, cake down and untouched, one slice gone, and cake finished. The tour relies on the showcase's BC1 result; if the tour is built first, it runs BC1 itself (C6).

The cake is a best-effort cue, above all for Thandiwe. An NPC that is mid-job, or that picks its next action after the servings are gone, never walks over, and Thandiwe's caffeine and work needs can pull her away first. The tour keeps those needs and says plainly that the cake may or may not move her.

The guaranteed lever for any stop that must empty a desk on cue is the presenter's needs-set mapping on the rota board. It repeats, and it is the only lever for Yasmin once the cake is gone:

- Two mappings, one on Thandiwe and one on Yasmin: `"eventPattern": "object_interacted"`, `"condition": "data.objectName === 'Coffee rota'"`, `needs: { set: { caffeine: 10 } }`, `cooldown: 30000` (precedent test_needs_sims:590).
- Reading the board sends both of them to the kitchen's coffee station. Capacity 1 means one queues behind the other, which gives the presenter time at both desks.
- Thandiwe's open session (stop 12) and Yasmin's locked screen (stop 13) run during the same trip.
- The kitchen sign also says the player can simply wait: caffeine makes each of them get up on their own 15 to 20 minutes in.

### 2.7 The stops

| # | Stop | What happens | Route |
|---|---|---|---|
| 1 | Ama's briefing | Timed conversation at reception on load. She explains the job, points at the phone and the cake, and asks: the quick version or the full walk-round? (sets `tour_full`). | S |
| 2 | Doors and kit | The visitor card fails at the partner's office (lockedHint) and opens the meeting room. Take the kit. | S |
| 3 | Drop box | Plant `kit_dropbox` in `meeting_jack` while in the meeting room. The network view opens. | S |
| 4 | Finance share, refused | From the network view, with only the box, try the Finance share: refused. This comes before any session with the role. | |
| 5 | Front desk | Delphine's note (server-built) signs the player in to reception_pc. Read `facilities.txt`. Choose Copy on `julian.rdp` (not Connect). Ama texts: sign out before you use that, leave no trace. The player signs out. | S |
| 6 | Saved connection | Keyring row for `julian_rdp`; Connect to julian_pc through the box (no desk session held, so the foothold route is the one offered). Show the Lock button in the start panel. Full route: open the Finance share from Julian's desktop (role partner). | S |
| 7 | Pivot | With Julian's session held, open the network view at the box (meeting_jack or its tray link). server_lan is now in reach. Sign in to door_controller with Lorna's password; read the codes. The session carries the box's foothold. | |
| 8 | Server room | Enter the code at the keypad. | |
| 9 | Lorna's badge | Talk to Lorna; copy her card with the cloner from the conversation. The clone choice is sticky (`+`), so it is still there if the player first talks to her without the cloner. | S |
| 10 | Comms cupboard | The copy opens it (role facilities). Look round. The ports in here come later (full route, stop 18), once the box is free. | S |
| 11 | Thandiwe at her desk | Click her laptop while she sits: `pc_in_use`. | S |
| 12 | The open session | Read the rota board (the sure way), drop the cake in the open plan (best-effort), or wait. She leaves; her laptop is still signed in. She returns, sits, and the player's session ends. Optional task. | S |
| 13 | Yasmin | While both are away (rota board, or the cake if it worked), click Yasmin's PC: she padlocked it, but her note gets the player back in. | |
| 14 | Front desk USB | Sign in at reception_pc's keyboard again. The stick is refused at the hub (policy line). The injector at the implant socket gives a foothold through reception_pc. | |
| 15 | Rogue AP | Hide the rogue AP in the plant; clone Staff Wi-Fi from its console. The tour then nudges Thandiwe to check her email; her laptop joins the twin and the key is captured. | |
| 16 | Staff Wi-Fi | Read the key on the capture tablet; join Staff Wi-Fi; compare with the open guest network. | |
| 17 | Unplug | Pull the box. Julian's session and the door controller session end. The implant, Wi-Fi and keyboard sessions stay. The box is back in the player's bag. | S |
| 18 | The cupboard's ports | Take the box to the comms cupboard. The managed port refuses it (port security); the patch panel's guest VLAN port takes it and lands on guest, with nothing of the firm's on it. | |
| 19 | Debrief | Back to Ama at reception; the ending check, then the debrief and the closing card. | S |

Short route: 1, 2, 3, 5, 6, 9, 10, 11, 12, 17, 19. The only return trip is the unplug at the meeting room. The full route adds one more: meeting room to the comms cupboard for stop 18, then back to reception.

Stop 15 detail (README 1125-1131 pattern): the console sets the global `staff_twin_up`. A mapping on Thandiwe, `global_variable_changed:staff_twin_up`, `condition: value === true`, `onceOnly`, sets `needs: { set: { work: 10 } }`, so she walks to her laptop and uses it within seconds. The capture mapping lives on `ama_phone`:

```json
{ "eventPattern": "npc_used:thandiwe_laptop", "condition": "globalVars.staff_twin_up === true", "onceOnly": true,
  "addCapture": { "targetId": "staff_wifi_key", "kind": "credential", "roleLabel": "Merrin & Sallow, reception",
    "host": "MerrinSallow-Staff, rogue access point", "address": "MerrinSallow-Staff",
    "secret": "<%= @random_password %>", "note": "Thandiwe's laptop picked the copy and the key page took the Staff key (proof: planted).",
    "proof": { "planted": "kit_rogue_ap" } },
  "completeTask": "t_capture_key" }
```

No `captureProof` goes on Thandiwe: the address is an SSID, not her username, so the mapping's own `proof` is the one that counts.

Presenter notes:
- Only the front desk route to Julian is scripted. Connecting from another held desktop (a thandiwe_laptop claim or yasmin_pc) and losing that desk, or a reception_pc session that is itself remote through the box, are off the presented route; the presenter does not rely on them.
- Stop 5: choose Copy, not Connect. Connect on the desktop is the `from` route: Julian's session then rides Delphine's desk, and signing out there takes it down. If that happens, it is a talking point, not a dead end: the full-route hub says so (W6b, with a way to carry on) and Ama's debrief names it (D5c on both routes). Connect again from the keyring and it goes through the box.
- Stop 5's sign-out is what makes stop 17 end Julian's session. If the player still holds a keyboard session on any office_lan PC when they Connect from the keyring, the keyring offers the `from` route first (keyring.js:75-88) and Julian's session rides that desk. The unplug then leaves it up, because a `from` session ends only when its source session goes (network_access.rb:1378-1395, 1460-1462). Good talking point: the box is not the only way in, and pulling it does not undo what was done from a desk. The debrief says which one happened (2.12).
- After pressing Lock on Julian's session, unlock it at its own sign-in screen, which keeps its route. Connecting again from the keyring may take a different route (a desk, the implant or Staff Wi-Fi), and that session might survive the unplug.
- Stop 7: the foothold the network view was opened from decides whether the door controller session survives the unplug. Open it at the box. Opened from the implant's or Staff Wi-Fi's link item, the session survives while another office_lan session is held (the reception_pc keyboard session the implant needs counts); with none held, the prune ends it too. Any held office_lan session puts server_lan in reach; Julian's is the one the story uses.
- Stop 13: the server serves Yasmin's note whether or not she is at her desk. Her absence is the story, not a lock.

### 2.8 Objectives

Every required task can be done without waiting for anyone to move. Tasks that need an absence or an NPC's use of a device are optional. Every task has `onComplete.setGlobal: done_<task id>` for the hub.

Status: every task in aim_office, aim_network, aim_around and aim_deeper starts `status: "active"`, with no `unlockTask` chain between them. Tasks in aim_around and aim_deeper carry `optional: true` as well as their aim. aim_wrap and t_debrief start `locked`.

| Aim | Task id | Title | Completes on | Stop |
|---|---|---|---|---|
| aim_office (required) | t_meet_ama | Talk to Ama at reception | `npc_conversation` ama, via `#complete_task:t_meet_ama` in her briefing | 1 |
| | t_kit | Get into the meeting room | `unlock_room` meeting_room | 2 |
| | t_front_desk | Sign in at the front desk | `unlock_object` reception_pc (`signedInPcs`) | 5 |
| | t_copy_badge | Copy a staff badge | eventMapping `card_cloned`, `condition: data.cardName === "Lorna Easton FAC card"`, `completeTask` (lab_physical_pentest:1113 pattern) | 9 |
| | t_comms | Get into the comms cupboard | `unlock_room` comms_cupboard | 10 |
| aim_network (required) | t_drop_box | Plug the drop box into a live port | `unlock_object` meeting_jack (`gainedFootholds`) | 3 |
| | t_julian_pc | Connect to the partner's PC | `unlock_object` julian_pc (`signedInPcs`, game.rb:4321-4326) | 6 |
| | t_unplug | Unplug the drop box | eventMapping `network_device_unplugged:meeting_jack`, `completeTask` | 17 |
| aim_around (optional) | t_server_room | Get into the server room | `unlock_room` server_room | 8 |
| | t_open_session | Use a laptop its owner left signed in | `unlock_object` thandiwe_laptop (claim, `signedInPcs`) | 12 |
| | t_yasmin_pc | Get past a locked screen | `unlock_object` yasmin_pc | 13 |
| aim_deeper (optional) | t_door_controller | Sign in to the door controller | `unlock_object` door_controller | 7 |
| | t_implant | Get a foothold through the front desk PC | eventMapping `network_foothold_gained`, `condition: data.via === "implant"`, `completeTask` | 14 |
| | t_capture_key | Capture the Staff Wi-Fi key | the stop 15 capture mapping | 15 |
| | t_staff_wifi | Join Staff Wi-Fi | `unlock_object` staff_ap (`gainedFootholds`) | 16 |
| | t_guest_port | Find where the patch panel's spare port goes | `unlock_object` guest_vlan_port (`gainedFootholds`) | 18 |
| aim_wrap (`missionConclusion`, `unlockCondition: { aimsCompleted: ["aim_office", "aim_network"] }`, `conclusionScreen`) | t_debrief | Report back to Ama | `#complete_task:t_debrief` in Ama's debrief ink | 19 |

Stop 4, the Finance half of stop 6 and the managed port at stop 18 have no task: they are contrasts the presenter shows.

`completeTask` is idempotent (game.rb:5110-5133), so the card, implant and unplug mappings carry no `onceOnly`.

### 2.9 Ama: person and phone

- `ama` (person) has three knots. Which one answers is decided in ink by `wrap_open()`, an ink function that is true when all eight required `done_` globals are true (t_meet_ama, t_kit, t_front_desk, t_copy_badge, t_comms, t_drop_box, t_julian_pc, t_unplug). That matches aim_wrap's `aimsCompleted` gate.
  - Briefing on load. It ends with the route choice ("The quick version, or the full walk-round?") that sets `tour_full`, and carries `#complete_task:t_meet_ama`.
  - Mid-tour, while `wrap_open()` is false: M1, plus a choice "Actually, show me the full walk-round." shown while `tour_full` is false, which sets it.
  - Debrief, once `wrap_open()` is true (2.12).
- `ama_phone` carries the "Where next?" choice. Its answer reads the globals in 2.10 and names the next open step, in this order (first unmet wins; `F` lines only when `tour_full` is true):

| Line | Shown while | Text |
|---|---|---|
| W1 | not `done_t_kit` | "Kit first. Meeting room, just off reception." |
| W2 | not `done_t_drop_box` | "There's a live port by the kit table. Plug the box in before you go anywhere else." |
| W3 | not `done_t_front_desk` | "Delphine's front desk next. Have a look round the screen." |
| W4 | not `has_julian_rdp` and not `done_t_julian_pc` | If `seen_julian_rdp`: "You've read Julian's connection file. Now take a copy of it." Otherwise: "Delphine's desktop had a saved connection on it. Copy it, don't connect from there." |
| W5 | not `front_desk_signed_out` and not `done_t_julian_pc` | "Sign out of Delphine's PC before you use that file, so the connection has to go through the box." |
| W6 | not `done_t_julian_pc` | "Open your keyring and use Julian's saved connection." |
| W9 | not `done_t_copy_badge` | "Have a word with Lorna by the comms door. Bring the cloner." |
| W10 | not `done_t_comms` | "Your copy of Lorna's card should open the comms cupboard. Try it." |
| W6b F | `julian_lost_with_desk` and not `julian_back` and not `done_t_door_controller` and not `done_t_unplug` (below W10, above W7) | With `has_julian_rdp`: "Julian's session went when you signed out at the front desk. If you're signed in at the front desk again, sign out. Then connect from your keyring. It goes through the box that way, and you'll need it for the door controller." Otherwise: "Julian's session went when you signed out at the front desk. To get it back through the box, sign in there, copy his connection file, sign out, then connect from your keyring." |
| W7 F | not `done_t_door_controller` and not `done_t_unplug` and (not `julian_lost_with_desk` or `julian_back`) | "With Julian's session up, his PC can reach the server network. Open the network view at the box and try the door controller, with Lorna's password from facilities.txt." |
| W8 F | `done_t_door_controller` and not `done_t_server_room` | "You've got the codes. Server room's at the back of the open plan." |
| W11 | not `saw_in_use` and not `done_t_open_session` | "Thandiwe's at her desk in the open plan. Try her laptop, then watch what happens when she gets up." |
| W12 F | not `done_t_yasmin_pc` | "Next time Yasmin's away from her desk, have a look at her screen. The coffee rota gets people moving." |
| W13 F | not `done_t_implant` | With `front_desk_signed_out`: "Back to the front desk. Sign in again, then see what Delphine's USB ports will take." Otherwise: "Back to the front desk. See what Delphine's USB ports will take." |
| W14 F | not `ap_planted`, then not `staff_twin_up` | "Hide the access point in one of the reception plants, then open its console and copy the Staff Wi-Fi." then "The access point's in. Open its console from the plant and copy the Staff Wi-Fi." |
| W15 F | not `done_t_capture_key` | "Give it a moment. Thandiwe's about to check her email. Walk into the open plan and her laptop should join your copy." Then, box still in: "If she doesn't, carry on. The Wi-Fi stops still work after the box comes out." Box out: "If she doesn't, carry on to the comms cupboard and come back." (sets no tail) |
| W16 F | not `done_t_staff_wifi` | "You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one." |
| W17 | not `done_t_unplug` | "When you've had enough, pull the box out and see what drops." |
| W18 F | not `done_t_guest_port` | "Take the box to the comms cupboard. Try the managed port, then the patch panel." |
| W19 | otherwise | "That's the lot. Come and find me at reception." |

- The phone has no `call` entry, so no line says "call me" (README:2361).
- Hub order as built (slice 5 review): W9 and W10 (Lorna, comms cupboard) now sit ahead of W7 and W8, because required steps must not wait behind optional ones; W17 stays where it is but every optional line ahead of it (W6b, W7, W8, W11 to W14, W16) sets a tail that adds "Skip any of that you like, and pull the box out when you're ready.". W7 needs `not julian_lost_with_desk or julian_back`; only W6b and W7 are hidden once `done_t_unplug` (the Wi-Fi stops W14 to W16 still work after the box is out). The skip line shows on the first optional answer (`told_skip`, a bool) and again whenever the player asks twice at the same stop (`last_w`, an int from 0 to 17 set per line). W15 takes part in the repeat rule but sets no tail. W14 splits on a new global `ap_planted` (mapping on `device_hidden:kit_rogue_ap`) so it changes once the access point is in the plant.

### 2.10 Globals, mappings and timed texts

Booleans, all false at start:

| Global | Set by |
|---|---|
| `tour_full` | Ama's briefing choice, or the mid-tour switch |
| `done_<task id>` (17) | each task's `onComplete.setGlobal` |
| `seen_julian_rdp` | `onRead` on julian.rdp |
| `has_julian_rdp` | `onPickup` on julian.rdp |
| `front_desk_signed_out` | mapping on `pc_signed_out:reception_pc`, `condition: data.reason === "sign_out"`. No onceOnly: a later sign-out (stop 14) writes the same value, and sync sends only changes. |
| `julian_lost_with_desk` | mapping on `pc_signed_out:julian_pc`, `condition: data.reason === 'link_dropped' && data.fromPcId === 'reception_pc'`, `setGlobal: { julian_lost_with_desk: true, julian_back: false }`. The engine emits exactly this when a session opened from the front desk is dropped because the desk was signed out (pc-sessions.js:887-888, with `fromPcId` from `_remoteOf`, 958-964; the server's answer carries `fromPcId`, game.rb:4344-4367). A box-route session has no `fromPcId`, so an unplug never matches; signing out of julian_pc itself has reason `sign_out`, so that never matches either. |
| `julian_back` | mapping on `pc_signed_in:julian_pc`, `condition: globalVars.julian_lost_with_desk === true`. A second loss resets it to false (above), so D5c follows the latest loss. W6b is a full-route line that sits below W10 and above W7, and stops once the door controller is done or the box is out, because the door controller is the first stop that needs Julian's session. The short route never meets it, and a second loss at stop 14 does not put it ahead of W14 to W17. |
| `saw_in_use` | mapping on `pc_in_use:thandiwe_laptop` |
| `staff_twin_up` | the rogue AP console |
| `julian_ended_by_unplug` | mapping on `network_device_unplugged:meeting_jack`, `condition: data.endedPcIds.includes('julian_pc')` |
| `tour_debriefed` | Ama's last debrief line |

The mappings that set globals have no onceOnly: each writes a boolean and only a change is synced.

Who holds the mappings. NPCs register, with their eventMappings, only when their room loads (npc-lazy-loader.js:37-60), and the kitchen is on neither route. So `ama_phone`, which registers with reception at load, holds every mapping that sets a global or completes a task (the `julian_*` globals, `front_desk_signed_out`, `saw_in_use`, `julian_ended_by_unplug`, the card, implant and unplug tasks, the capture) and every timed text. Only the rota board mappings (on thandiwe and yasmin, since `needs` acts on the NPC that holds the mapping) and the stop 15 work nudge (thandiwe) sit elsewhere, and all three fire only after the open plan has loaded. Nothing sits on julian or lorna.

Timed texts, on `ama_phone`, each an eventMapping with `sendTimedMessage: { delay, message, targetKnot, skipIfGlobal? }` and `onceOnly` (P6 has a cooldown instead, below). A `skipIfGlobal` goes inside `sendTimedMessage`: the engine copies it into the scheduled text and checks it at delivery (npc-manager.js:1712-1722, 2540-2546). On the mapping itself it is read only by the video-call path (npc-manager.js:1236, 1905-1926), so it would do nothing here. Delays are 4000 to 6000 ms, so two that fire together never land at once (README:2993).

| Id | Event | Delay | Text (target knot) |
|---|---|---|---|
| P0 | `global_variable_changed:has_julian_rdp`, `value === true` | 4000 | `sendTimedMessage: { "delay": 4000, "message": "Before you use that, sign out of Delphine's PC.", "targetKnot": "hint_sign_out", "skipIfGlobal": "done_t_julian_pc" }` |
| P1 | `pc_in_use:thandiwe_laptop` | 4000 | "She's signed in and sitting right there. Read the coffee rota on the wall, then try her laptop while she's away." (hint_open_session) |
| P2 | `network_foothold_gained:meeting_jack` | 5000 | "Box is talking. Have a look at the network view before you sign in anywhere." (hint_network_view) |
| P3 | `usb_refused:usb_hub` | 4000 | "Storage is blocked on that hub. A keyboard isn't storage." (hint_injector) |
| P4 | `network_device_refused:managed_port`, `condition: data.reason === "port_security"` | 4000 | "That port knows what's meant to be plugged into it. Try the patch panel, see where its spare port goes." (no targetKnot) |
| P5a | `network_device_unplugged:meeting_jack`, `condition: globalVars.tour_full !== true` | 6000 | "Box is out. Have a last look if you like, then come back to reception." (no targetKnot) |
| P5b | `network_device_unplugged:meeting_jack`, `condition: globalVars.tour_full === true` | 6000 | "Box is out. Take it to the comms cupboard and see what the ports in there make of it. Then come back to reception." (hint_ports) |
| P6 | `magnet_placed:cake`, `condition: data.roomId !== 'open_plan'`, `cooldown: 30000`, no onceOnly | 4000 | "Take the cake through to the open plan, where the desks are." (hint_cake) |

P0's `skipIfGlobal` keeps it from telling a player who has already connected (from the desktop's Connect) to sign out. It is checked when the text is due, not when the event fires (npc-manager.js:1721, 2540-2546), and the onceOnly key is spent either way. A desktop Connect completes `unlock_object` on julian_pc at once, and `onComplete.setGlobal` writes `done_t_julian_pc` in the same call (objectives-manager.js:362-366, 1138-1144), well inside the 4 s delay. The text never reaches the phone thread in that case.

### 2.11 Signs and hints

- S1 meeting room door: "Booked: Fenlow Managed IT, all day."
- S2 kitchen, by the coffee station: "Coffee's on a rota. The board's in the open plan. (Or just wait. Someone always comes in for coffee.)"
- S3 rota board: "Coffee rota. Whoever's name is up makes the next round."
- S4 guest card: "Guest Wi-Fi: MerrinSallow-Guest. No password, just agree to the terms."
- S5 partner door `lockedHint`: "Julian's office. His card only."
- S6 managed port `portSecurityMessage`: "Port security: this device is not the one registered to this port."
- The hub's USB refusal line is the engine's own text for the `storage_blocked` kind (network_access.rb `USB_REFUSAL_LINES`, client pc-policy.js); the tour does not author it.
- The cake's `observations` is the spec's text.
- Hints come from the phone's "Where next?", Ama's mid-tour knot and the texts in 2.10. No other hint system.

### 2.12 The ending

1. P5a or P5b asks the player to come back to reception when they are done. Neither starts anything.
2. aim_wrap unlocks when aim_office and aim_network are complete. Until `wrap_open()` is true, Ama's mid-tour knot answers.
3. Once it is true, Ama opens with D1, a plain line, then the choice D2. "I'm done, let's talk." carries `#ending_check` inside its brackets, so the engine's "Before the mission ends" panel lists the open optional tasks before anything closes (ending-check.js:1-30). On the short route that list shows what the full walk-round adds.
4. D3 and D4 follow. D5 branches three ways, first match wins: D5a on `julian_ended_by_unplug`; D5c on `julian_lost_with_desk` and not `julian_back`; D5b otherwise. Ama's last line carries `#complete_task:t_debrief` and sets `tour_debriefed`.
5. The short route ends at the debrief. After the unplug there is no mid-tour switch and no hub line for the network stops, because most of them need the box back in the jack and Julian reconnected.
5a. The credits end the mission: the visualiser opens with `missionOver` (scenario-music-events.js:309-313), so after "I'm done, let's talk." the player cannot go back to the optional stops. This is intended. The run sheet (slice 6) says so. The mid-tour switch to the full route is also hidden once `done_t_unplug`, and Ama has no `taskOnKO`.
6. The closing card is a `music` event entry, as in the lab (lab_physical_pentest:773, 780-800): `trigger: "conversation_closed:ama"`, `condition: globalVars.tour_debriefed === true`, `closingCard`, `credits`.

### 2.13 Host and sign lines (text only)

All lines are first drafts. They go through npc-dialog-review as one batch before any voicing ask; nothing is voiced from this plan.

Briefing (ama, stop 1):
- A1 "Morning. You found us. This is Merrin & Sallow, and for the next little while you're my tester."
- A2 "The partners want to know how far someone gets with a visitor badge and a bag of kit. So do I."
- A3 "Your kit's in the meeting room. The visitor card opens that door and nothing else, in theory."
- A3b "And there's a cake in your bag. Put it down in the open plan and see if it gets anyone away from their desk."
- A4 "I'll stay here. If you're stuck, check your phone. I'll text if I think of anything."
- A5 (choice) "The quick version's about fifteen minutes. The full walk-round is nearer thirty-five, every room and every gadget. Which?" / "Quick version." / "The full walk-round." Replies: "Quick it is. Doors, a desk, the box, and back to me." / "The full walk-round, then. Most people only see half of it."

Mid-tour (ama, before `wrap_open()`):
- M1 "Still going? Your phone will tell you where next."
- M2 (choice, while `tour_full` is false) "Actually, show me the full walk-round." / reply: "Go on then. There's plenty more to see." Then "Right, back to it." gets "Good luck."

"Where next?" answers: W1 to W19 in 2.9. Timed texts: P0 to P6 in 2.10.

Debrief (ama, stop 19):
- D1 "Right. Before we wrap up, anything else you want to try?" (after a look-round: "Anything else, or shall we talk it through?")
- D2 (choice) "I'll have another look round." / "I'm done, let's talk." The look-round reply while `tour_full` is false: "Go on. The box is out, so anything that needed it in the wall is done for today. The rest is still there." While `tour_full` is true: "Have a proper look. I'll be right here when you're done."
- D3 "The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's door held only because nobody copied his card."
- D4 "A saved connection on the front desk got you into Julian's PC. His door never came into it."
- D5a (`julian_ended_by_unplug`) "And when the box came out, everything you'd opened through it went with it." Add-on when `done_t_implant`, `done_t_staff_wifi` or `done_t_yasmin_pc`: "Anything you'd reached another way didn't need the box."
- D5c (`julian_lost_with_desk` and not `julian_back`) "You connected to Julian's from Delphine's desk, so when you signed out there, his went too."
- D5b (`done_t_julian_pc`) "Julian's session didn't go with the box. Connect from a desk you're signed in at and it never needs the box. That's the bit people miss."; fallback "Pulling the box ends what ran through it. Anything you reached another way stays up. That's the bit people miss."
- D6 (last line) "Thanks. I'll write it up for the partners."

Other NPCs (one each, also through review):
- Delphine: "Visitors sign in on the tablet by the door. This screen's staff only."
- Lorna: "Facilities. If it's a door or a cupboard, it's mine."
- Thandiwe: "Can't stop, deadline."
- Yasmin: "Screen's locked. Always is when I get up."
- Julian: "My office is being rewired, so I'm in here with the kettle. Not that you'd get in."

Signs: S1 to S6 in 2.11.

Closing card: "Merrin & Sallow: access tour complete."

## 3. Server enforcement and sync budget

### 3.1 What the server enforces

Hard-enforced (the client cannot fake these):

| Thing | How | Reused fixture or code |
|---|---|---|
| Server room keypad code | `requires` `<%= @random_pin %>`, checked by the server; the code exists in the client only after a door_controller session | keypad doors in test_access_doors; game.rb:7088-7091 |
| Meeting room door | `requires` the visitor card's id | test_access_doors:233 |
| Comms door | access `roles`; a copied card counts only as a clone the server recorded with a cloner held and Lorna met | game.rb:3922-3939, 4016-4053 |
| Partner door | access `people: ["julian"]`; Julian has no card to copy | test_access_doors |
| reception_pc, yasmin_pc passwords | sign-in on the server; each note is built from the owner's creds under `habits.writesDown`, with no `postitNote` on the PC, and served only by GET /login_accounts | game.rb:3330-3342 |
| Door controller password | credential `foundIn` facilities.txt with proof session reception_pc; the file is in reception_pc's contents, withheld until a session | test_access_keyring:44-49; game.rb:7094-7100 |
| Door-codes file | door_controller is `lockType: "login"`, so its contents are withheld until a session | game.rb:7094-7100 |
| julian_pc remote sign-in | saved_connection credential `julian_rdp`, held only after taking the file | test_access_keyring:146-156 |
| Drop box at meeting_jack, port security at managed_port, guest VLAN port | plant and refusal answered by the server | test_access_networks, test_access_devices |
| Implant foothold | `grant_foothold` with `needsSession` and `needsHeld` (section 1, Devices) | network_access.rb:445-518 |
| Finance share | access roles finance and partner on the resource | network_access.rb:1580-1627 |
| Staff Wi-Fi key | psk is a per-game render, withheld from the client and compared on join | network_access.rb:23, 371-374 |
| Captured key | the capture secret and the psk are the same render in one binding (scenario_binding.rb:22); the capture is served only after the planted-AP proof, and only with `revealSecret` | capture_model.rb:552-556, 957-970; game.rb:2494-2495 |
| Unplug | server ends exactly the sessions in `endedPcIds` | network_access.rb:290-321, 410-415, 1378-1395 |

Best-effort (client side, by design):

- The USB stick refusal at the hub: plantRefusal grants nothing (interactions.js:1015-1043). On the server, the stick at the implant socket answers `not_ready`.
- Office-life timing: Thandiwe and Yasmin leaving their desks, the cake draw, the rota board's and the rogue AP nudge's `needs.set`, `pc_in_use`. No required task depends on any of it.
- Yasmin's note while she is at her desk: GET /login_accounts serves it to any player who reaches yasmin_pc. t_yasmin_pc is optional.
- Task completion from client eventMappings (t_copy_badge, t_implant, t_capture_key, t_unplug): custom tasks pass on the server (game.rb:5203-5204). The events behind them are server answers (a recorded clone, a granted implant, a served capture, an unplug), so a forged completion gains the player nothing a server check guards. Two of them are required (t_copy_badge, t_unplug); they stay best-effort and the demo says so.
- Phone texts, "Where next?", the route choice and the route globals behind D5.
- There is no tailgating in the tour.

### 3.2 player_state sync budget (V8)

The state must not grow during play, and every change goes as a delta (state-sync.js:33-41, 262).

- No counter rises over time. Every global the tour sets is a boolean (2.10): 17 `done_` globals and 10 others, 27 in all, each declared. `cake_servings` only falls, from 2 to 0.
- The rota board mappings write need levels, not globals, and have a 30 s cooldown.
- Bounded sets: `gainedFootholds` takes jack, AP and implant PC ids, so at most 5 (meeting_jack, guest_vlan_port, staff_ap, guest_ap, reception_pc); signed-in PCs at most 6 (adding door_controller); captures at most 1.
- onceOnly handlers land in `triggeredEvents` as fixed keys (game.rb:5711-5732). The tour has 9: P0, P1, P2, P3, P4, P5a, P5b, the capture mapping and the rogue AP work nudge. P6 has a cooldown and no onceOnly, so it adds no key.

V8 counts only office-life onceOnly ones: the capture mapping (`npc_used:`) and the work nudge (writes `needs`), so 2. P6's `magnet_placed:` mapping has no onceOnly and is not counted.

Expected counts against BUDGET_CAPS (scripts/validate_office_life.rb:766-770):

| Cap name | Cap | Tour |
|---|---|---|
| workstation globals | 24 | 12 (4 owned PCs: reception_pc, thandiwe_laptop, yasmin_pc, julian_pc) |
| magnet servings (counts magnet objects) | 2 | 1 |
| dropped magnet items | 2 | 1 |
| office-life items | 4 | 1 |
| office-life onceOnly mappings | 10 | 2 |
| frustration | 6 | 0 to 2 |
| workaround slots | 4 | 0 |
| workaround and onUse globals | 8 | 0 |
| heard_ globals | 8 | 0 |
| reveal and left-behind globals | 6 | 0 |
| Friendface posts | 10 | 0 |

## 4. Tests and proof

### 4.1 Validators

- The scenario validator: no errors, no unknown errors, door alignment OK, no overlap.
- `python3 scripts/predict_door_sides.py`: corners as in 2.2.
- scripts/validate_office_life.rb: V2, V4, V5 clean; V8 within every cap in 3.2, with the report's cap names matching BUDGET_CAPS.
- Every eventMapping `condition` uses only the forms in section 1 (Mapping conditions). Slice 5 lists them with a grep and checks each by eye; keep the grep and the by-eye check even though the validator also checks conditions. The validator flags only `||` and parentheses (scripts/validate_scenario.rb:6335-6343, 6469-6478); `==`, `!=`, a method other than `includes`, arithmetic and bracket access pass it and are read as false by the evaluator (npc-manager.js:100-118).

### 4.2 Solvability

- Dungeon graph and walkthrough (break-escape-dungeon-graph, walkthrough-scenario skills): every required task reachable on the short route with no NPC movement.
- Lock and key check: each lock has exactly the key 2.2 names. The partner door has none reachable: Julian has no `creds.card`, and only Lorna carries role `facilities` or `it`.

### 4.3 Corpus tests (pick the scenario up with no edit)

- test/unit/scenario_schema_test.rb:238
- test/unit/scenario_object_tile_bounds_test.rb:37
- test/models/break_escape/payload_scan_fresh_state_test.rb:249
- test/models/break_escape/payload_scan_opened_state_test.rb:309
- test/models/break_escape/capture_payload_secret_test.rb:147
- ink_compiled_staleness_test.rb:26
- phish_superset_test.rb:30

The payload scans run for this scenario alone with `PAYLOAD_SCAN_ONLY=demo_access_tour` (payload_scan_fresh_state_test.rb:247-251); use that in each slice. The scans treat `postitNote` and `text` as value-exempt (test/support/payload_scan.rb:119) and cannot see a 4-digit code inside longer text (payload_scan.rb:19-25), which is why 4.4 checks the notes and the keypad code by name.

tts_mission_lines_test.rb covers only m01 to m10 and lab_physical_pentest (line 18); it covers the demo only if the user later asks for voicing.

### 4.4 Rails integration test on the real scenario

test/controllers/break_escape/demo_access_tour_test.rb loads scenarios/demo_access_tour/scenario.json.erb as AccessDevicesRogueApScenarioTest does (access_devices_rogue_ap_test.rb:350-358) and drives the real endpoints. Cases:

Secrets (the standing rule):
- Delphine's and Yasmin's passwords appear only in GET /login_accounts for their PCs, never in the bootstrap, a room answer or the keyring. No case asserts a refusal of Yasmin's note while she sits.
- facilities.txt and julian.rdp are absent from every answer until a reception_pc session exists.
- The door-codes file is absent until a door_controller session exists; the keypad code (`@random_pin`) is absent from every other answer.
- The Staff psk is absent from every answer; the captured key is served only after the plant (and with `revealSecret`).
- No NPC creds, role or card password reach the client beyond the card data the clone needs.

Access:
- Partner door refused for the visitor card and for Lorna's clone.
- Comms door admits Lorna's recorded clone with the cloner held, and refuses a card the server did not record.
- Door controller, as the network view drives it (POST /login with `foothold`, no `from`): refused through meeting_jack with no office_lan session held; admitted through meeting_jack once julian_pc's session is held; admitted through the implant's foothold too.
- Keypad admits the rendered code.

Network and devices:
- Implant: refused with no reception_pc session and from a remote or `from` session; with only the stick held it answers `not_ready`; granted with the injector and a keyboard session.
- Finance share refused from the bare foothold before any role session; admitted after a julian_pc session.
- Capture before the plant refused; after the plant served; driven as AccessDevicesRogueApScenarioTest drives it (access_devices_rogue_ap_test.rb:348-362), reading the psk from `scenario_data.dig('networks', 'office_lan', 'wifi', 'psk')`. The key joins staff_ap; a wrong key is refused.
- Guest AP joins with no key in the request.
- Ports after the unplug: the box planted at managed_port answers 422 `port_security` and stays held; planted at guest_vlan_port it gives a foothold on guest; neither ends a session.

Unplug and routes:
- Foothold route: sign in to reception_pc, sign out, Connect julian_pc on the foothold, sign in to door_controller through meeting_jack, unplug. `endedPcIds` lists julian_pc and door_controller, not reception_pc or thandiwe_laptop; an implant foothold on reception_pc survives.
- Door controller through the implant's foothold: not in `endedPcIds` after the unplug, provided the reception_pc keyboard session is still held. After the unplug, with no other office_lan session held (no Julian, thandiwe_laptop or yasmin_pc session), POST /logout on reception_pc lists door_controller in its ended list.
- Every jack resolves through `find_jack`: a plant at each of meeting_jack, managed_port and guest_vlan_port answers something other than 404.
- `from` route: hold a reception_pc session, Connect julian_pc (`from: reception_pc`), unplug. `endedPcIds` lacks julian_pc, and the session is still held.
- Desk sign-out: hold a reception_pc session, Connect julian_pc `from: reception_pc`, POST /logout on reception_pc. Julian's session is in the answer's ended list.

### 4.5 Hand lists (add the scenario)

- test/js/validator-office-life.test.mjs:442 (V2, V4, V5 clean).
- The validator "no unknown errors" run, like test/js/validator-network-model.test.mjs:803.
- Optional: a measured bootstrap base in sync_payload_size_test.rb:17.

The leak proof is a script of its own (4.7), not a list entry.

### 4.6 Scripted walks

A scripted playtest (playtest-scenario skill, window.__test bridge) of each route:

- Short route: stops 1, 2, 3, 5, 6, 9, 10, 11, 12, 17, 19. Pass when every required task completes, the debrief gives D5a, and the closing card shows.
- Full route: all 19 stops in order. Pass when every task completes; each refusal (partner door, Finance share from the foothold, managed port, USB hub) shows its line; reading the rota board sends Thandiwe and Yasmin to the kitchen within 30 seconds; the work nudge makes `npc_used:thandiwe_laptop` fire within 30 seconds; stop 17 ends exactly julian_pc and door_controller; stop 18's managed port fires P4 and the guest port completes t_guest_port.
- No sign-out: skip stop 5's sign-out and Connect from the keyring. The unplug leaves Julian's session up and the debrief gives D5b.
- Desktop Connect: choose Connect on julian.rdp at stop 5, then sign out. Check P0 does not arrive in the phone thread, Julian's session is gone, W6b shows on the full route and not on the short one, and with no reconnect the debrief gives D5c. A reconnect through the box then sets `julian_back` and the debrief gives D5a or D5b instead. Variant: sign out of julian_pc first, then the front desk. Julian's sign-out has reason `sign_out`, so `julian_lost_with_desk` stays false and W6b does not show. Second loss: Connect from the desk, sign out (loss, W6b), Connect again from the desk (`julian_back` true), then sign out at the front desk at stop 14 (loss again, `julian_back` false): D5c returns unless the player reconnects, and W6b stays off because the door controller is done. This is the only case where `julian_back: false` in the mapping's `setGlobal` matters.
- The hub: at each stop, "Where next?" names the line 2.9 expects for that route; on the full route W17 does not appear before W16, and W18 follows the unplug.
- The cake: dropped in the open plan, it is checked as a cue, not a pass condition; dropped in reception, P6 arrives.
- Headless physics: setFPS(20) with fixed steps on.
- Any "stuck" claim from a scripted walk is checked by a second, unscripted run before anyone acts on it.

### 4.7 Live proof

- A keyless server from the worktree on :3002. Never :3000 or :3001. `db:seed` only; no other db task.
- New game via tools/playtest/new-game.rb (finds the mission by id or name, lines 111-116).
- On the real path, not a helper: the remote sign-in completes t_julian_pc; the door controller signed in from the network view opened at the box; the unplug answer's `endedPcIds` lists julian_pc and door_controller and not reception_pc; the implant survives the unplug; the captured key joins Staff Wi-Fi.
- The surviving cases: a door controller session opened from the implant's link survives the unplug while the reception_pc keyboard session is held (and, after the unplug with no other office_lan session held, is in the ended list once that session signs out); a Julian session Connected from the keyring while holding a reception_pc keyboard session survives it.
- Leak proof: tools/playtest/demo-access-tour-leak-proof.mjs, written in slice 6 on the pattern of tools/playtest/secret-leak-withholding-live-proof.mjs. Read-only: it never writes a game row, and edits no game's scenario copy or state.
  - Setup. It creates the game through new-game.rb with the mission id and no other argument. It then reads the secrets from the game row with `Game.find(id).scenario_data` through `rails runner`, a read and nothing else, at these paths: the Staff key at `networks.office_lan.wifi.psk`; the keypad PIN at the server_room lock's `requires`; each of the five passwords at that NPC's `creds.password`.
  - Corpus. It records the body of every response the walk receives under `/break_escape/games/:id/`, whatever the route and method (the bootstrap, GET /room, /keyring, /capture_secrets, /container, /login_accounts, /network, /objectives and /scenario_map, and the answers to POST /login, /network/plant, /unplug, /join, /implant, /logout, /unlock, /update_room, /inventory, /clone_card and /lock_session), not a hand list. It also fetches GET /ink once at the start for every NPC with a `storyPath`: the compiled file is served as it is, and the five passwords are authored literals, so a line that names one would reach every client. Request bodies are not scanned: a body carries only what an earlier scanned response gave the client or what the player typed after earning it (Delphine's password on POST /login, the PIN on POST /unlock), so scanning them would flag legitimate cases and catch nothing the response scan misses.
  - Matching. The PIN is `rand(1000..9999)` (scenario_binding.rb:24), and four digits occur in coordinates, sizes, timestamps and ids, so a substring scan gives false hits (test/support/payload_scan.rb:19-25 declines it for the same reason). The script parses each JSON answer and walks its leaves. A PIN hit is a leaf that equals the PIN as a string or number, or a string leaf that contains it as a whole token (`(?<![0-9])PIN(?![0-9])`). It prints the route and JSON path of every hit. Before failing on a PIN hit made before the door_controller session, it classifies the hit. A numeric leaf under a layout or timing key (`x`, `y`, `width`, `height`, `delay`, `cooldown`, or any key ending in `Ms`; the tour's own timed texts use delays of 4000 to 6000) and a string leaf whose whole value is an ISO date or time are reported as collisions, not leaks. Every other hit fails. If any collision is reported, the script creates a second game and fails only if the same JSON path carries that game's own PIN; a real leak follows the PIN to its path and a collision does not. The Staff key (8 characters) and the passwords use a plain case-insensitive substring match on the leaf strings. Before the five passwords are written, check that none is an ordinary word that appears elsewhere in the scenario text.
  - Pass when:
    - Julian's and Thandiwe's passwords never appear.
    - Delphine's and Yasmin's appear only in GET /login_accounts for their own PCs.
    - Lorna's appears only after a reception_pc session (in facilities.txt).
    - The PIN has no leak before a door_controller session (collisions reported and cleared by the second game), and at least one hit, in the door-codes file, after it.
    - The Staff key appears only after the plant and the laptop's use, in the capture answer.

### 4.8 Build-time checks

- C1: room_qdc_break carries no prop or sign that names another mission's firm. If it does, use room_lw_kitchen with catalogue props (fridge, kettle) beside the coffee station.
- C2: room_aw_merrin_sallow has clear floor for two desks square to the walls, away from the four doorways and their approach cells. If it does not, seat Thandiwe and Yasmin at opposite ends of the conference table (laptop and PC on the table) and say so in the run sheet. Both static NPCs stand clear of every door approach cell: Lorna near, not on, the comms door's approach; Julian clear of the coffee station's `useFrom` cell and its queue line.
- C3: the reception spots chosen for the two plants sit clear of the map's own planters; reception_pc takes the map's pc8 slot, leaving the west table bare (accepted).
- C4: CAKE_ITEM.md is at 08646ad8b. Before slice 4 builds the cake, diff the spec against 08646ad8b and take any changed numbers or fields; the rota board covers both NPCs either way.
- C6: the cake's reload behaviour is the showcase's BC1 result (cake held, cake down and untouched, one slice gone, cake finished, each reloaded on a fresh game). If the showcase has not landed BC1 when slice 4 is built, slice 4 runs BC1 on the tour's cake before it is marked done.
- C5: a policy with no `autoLockMin` never auto-locks a password or credential session (npc_frustration.rb:281-306 reads it only for guest and claim sessions).

## 5. Build slices

Each slice is one builder's work. Each ends with the validator clean, the corpus tests green (payload scans with `PAYLOAD_SCAN_ONLY=demo_access_tour`), and a commit on the branch before the next starts. A slice proves only what it and earlier slices built.

1. **Skeleton and rooms.** Seven rooms, doors, locks (keypad, three RFID), sign-in PCs as plain objects, the cast placed static with art fields, `player_phone`, signs. Room dressing with the mission-room-dressing skill: the two open-plan desks, the kitchen's coffee station, the kit table, the rota board and the signs, all square to the walls; reception objects on clear spots; Lorna and Julian clear of approach and queue cells. Checks C1, C2, C3. Proves: grid, door corners, lock types, art keys; corpus tests pick the scenario up.
2. **Access, kit and networks.** Accounts and creds for every NPC (2.4); visitor card, `rfid_cloner`, `kit_dropbox`, `meeting_jack`; office_lan with its Staff Wi-Fi block, server_lan, guest with its open Wi-Fi block; the APs; the shares; the policies (C5); reception_pc, yasmin_pc, julian_pc, door_controller (`headless`, `lockType: "login"`) with owners, `habits.writesDown` and contents; the credentials (facilities.txt, julian.rdp with `onRead` and `onPickup`); Lorna's card and a minimal ink knot with the sticky `#clone_keycard` choice. Write demo_access_tour_test.rb with the secrets, access, Finance share and every unplug and route case. Proves on the server: stops 2 to 10 and 17.
3. **Devices and the capture.** `kit_injector`, `demo_stick`, `kit_rogue_ap`, `capture_tablet`; the USB hub and implant socket; the managed port and patch panel; the rogue AP console and plant; `revealSecret`; thandiwe_laptop's work affordance; a bare `ama_phone` in reception's `npcs` (no ink yet) carrying only the capture mapping (2.7). Extend the Rails test with the implant, ports after the unplug (every jack resolving through `find_jack`), capture, Staff and guest join cases. Proves on the server: stops 14, 15, 16 and 18, with the capture driven as access_devices_rogue_ap_test.rb drives it.
4. **Office life.** Thandiwe's and Yasmin's needs (2.4), the coffee station, both rota board mappings, the cake in `startItemsInInventory` with its pools and `cake_servings` (C4), P6, the rogue AP work nudge. Add the scenario to validator-office-life.test.mjs:442. Proves, in a scripted browser walk of those stops: 11, 12 and 13 on the rota board (the cake is checked as a cue, not a pass condition), and the stop 15 trigger (`npc_used:thandiwe_laptop` after the nudge); V2, V4, V5, V8 clean.
5. **Ama, objectives and ending.** Ama's three knots, `wrap_open()`, the route choice and the mid-tour switch; the phone's hub (2.9); P0 to P5b; the global mappings (2.10); aims and tasks with status, `optional` and `onComplete.setGlobal` (2.8); aim_wrap's `unlockCondition` and `conclusionScreen`; the debrief with its three D5 branches; the closing card music entry. Add the scenario to the validator no-unknown-errors list; check every condition's form (4.1). Proves: every task completes in a scripted short-route walk; the hub order; the ending order. Then npc-dialog-review on all new lines.
6. **Proof.** Scripted walks of the four routes (4.6); the Rails test green; write and run tools/playtest/demo-access-tour-leak-proof.mjs and the live proof on :3002 (4.7); optional sync payload base. Then a one-page presenter run sheet next to this plan: stop order, the one sentence to say at each stop, the expected result on screen, and the presenter notes in 2.7. After this, and only after the dialogue review, the voicing ask goes to the user.

## Declined

- Removing the lobby map's own pc8 and planters: the map is the awareness course's, so the tour places its objects on other spots instead (C3).
- Switching off Connect on julian.rdp so the file is copy-only: the server sets `connect: true` on every saved connection and drops any authored value, so a scenario cannot do it without engine work. The tour asks for Copy and handles a Connect instead (2.7 presenter notes, W6b, D5c).
- A spare drop box for the comms cupboard's ports: the ports beat moves after the unplug and uses the one box.
- A hub line that holds W17 until Thandiwe's laptop is opened (a second "use the rota" line after `saw_in_use`): it would hold a required step behind an optional one. P1 names the rota board instead, and W12 names it on the full route.

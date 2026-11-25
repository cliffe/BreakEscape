# CA pilot mechanics: reading digest

Facts for the planner of the CA pilot mechanics plan. Each fact has a file:line pointer. Lines marked "about" were located by context, not by an exact grep hit. Anything inferred is labelled. No design decisions are made here.

Sources read: `CA_PILOT_MECHANICS_HANDOVER.md` (open items 1 to 7), the ca15 scenario, ink and kit files, the engine files named in the brief, the lab_physical_pentest scenario, `VOICE_CAST.md`, `BRAND_SET.md`, the rubric in the main checkout, and `scripts/ink_runtime_check`.

Paths: the worktree is `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/b-ca-trailers-next`. Paths below are relative to it unless stated.

---

## 1. ca15 attack shell

Files:
- `scenarios/ca15_shadow_it/scenario.json.erb` (1326 lines)
- `scenarios/ca15_shadow_it/ink/nilesh_solanki.ink` (59 lines)
- Kit: `planning_notes/phishing_and_social_engineering/awareness/office_kits/tarrowby_logistics.json`, set piece `setPieces.ca15_found_stick` at `:668`
- Episode row: `planning_notes/phishing_and_social_engineering/awareness/office_kits/episodes.json:356-370` (the `ca15_shadow_it` row; `"setPiece": "ca15_found_stick"` at `:365`, `ambient` `fatima_begum`, `chidi_okeke` at `:359-362`, `keyMessage` `e15_posted_stick` at `:368`)

Scenario header:
- `scenario_id` `ca15_shadow_it` (`:2`). `"npcThoughts": false` at `:8`. `"disableAttacks": true` at `:7`.
- `startRoom` `training_room`, `startPosition` `{x 6, y 6.2}` (about `:27-31`, inferred from the first 20 lines).
- Objective `shortcuts_aim`, task `sort_shortcuts` (`:23-53`). Conclusion needs global `episode_e15_shadow_it_defend_complete` (`:31-33`).

Rooms:
- Only one room: `training_room` (`:720`). Type `room_aw_tarrowby`. `"connections": {}` at `:755`.
- The room's map is 10 by 10 tiles (`public/break_escape/assets/rooms/room_aw_tarrowby.json`, `width` 10, `height` 10).
- Kiosk `training_kiosk` at `:1241`. Vending `kit_vending` at `:1260`. Stick `kit_ca15_stick` at `:1280`. Lost property `kit_ca15_lost_property` at `:1306`.

NPCs in the scenario:
- `nilesh_solanki` (`:757-`): `npcType` person, `voice` Iapetus (`:759-763`), `position` `{x 5.5, y 3.8}` (`:766-769`), `spriteSheet` `nilesh_solanki` (`:770`), `storyPath` `scenarios/ca15_shadow_it/ink/nilesh_solanki.json`, `currentKnot` `start` (`:773-774`). Eventmappings from `:775`. No needs or routines in the record.
- `kit_fatima_begum` (`:889-`): `person` `fatima_begum`, `position` `{x 2, y 6}` (`:894-897`), `spriteSheet` `fatima_begum`, voice Vindemiatrix, `needsHome` `training_room` `(2,6)` facing south, `needsSpeed` 90, `needs.thirst` `decayPerMin` 0.01, `urgentAt` 50, `initial` 65 (`:919-924`). Her eventMappings are from about `:937`.
- `kit_chidi_okeke` (`:1116-`): `person` `chidi_okeke`, `position` `{x 3, y 6}` (`:1120-1123`), `spriteSheet` `chidi_okeke`, voice Zubenelgenubi, `needsHome` `(3,6)`, `needs.thirst` `decayPerMin` 30, `urgentAt` 50, `initial` 60 (`:1145-1150`). Eventmappings from about `:1163`.
- Kit file staff block (`tarrowby_logistics.json:22-56`): `fatima_begum` at `:23` (`position {2,6}`, `thirst` decay 30 in the kit's own block at `:27-31`), `chidi_okeke` at `:34`, `zainab_hussain` at `:45` (not used by ca15).
- Note (inferred from the two thirst values): the scenario and the kit disagree on `decayPerMin` for Fatima (0.01 in the scenario at `:921`, 30 in the kit at `:28`). Which one applies is not checked.

Attack-half flow (start to the step-away cue):
1. Start: `training_room`, Nilesh's hub (`nilesh_solanki.ink:26-27`, `-> hub`).
2. Stages `stages` at `:484-490`: `brief`, `mistake`, `flip`, `defend`, `debrief`. `conclusionTaskId` `sort_shortcuts` (`:479`).
3. `mistake` block at `:496`, `"scored": false` at `:497`. Four beats:
   - `personal_email` (`:499`), safe option `ask_nilesh` (approvedRoute).
   - `drivers_chat` (`:517`), safe option `ask_channel`.
   - `visitor_stick` (`:534`), options `plug_visitor` (unsafe) and `send_link` (safe, approvedRoute). Situation text at `:535`.
   - `rota_app` (`:551`), safe option `ask_it`.
   - `"flipBeat": "personal_email"` (about `:568`).
4. `flip` is `"mode": "montage"` (`:570-571`, about).
5. `strings.stepAway` at `:574`: "Look up from the kiosk and carry on in the room for a minute. Someone may ask you something. Your place is saved." This is the only "Look up" text in the scenario.
6. The step-away event sets the kit. In the scenario's `nilesh_solanki` eventMappings, `episode_step_away` with condition `globalVars.kit_defend_done === true` sets `kit_ca15_out: true` (`scenario.json.erb:830-835`).
7. Defend (`defend.setId` `e15_shortcuts_inbox`, `:478-480`; triage set at `:153`, `:161-`).

Ink knots in `nilesh_solanki.ink`:
- Globals `:17-24`: `episode_e15_shadow_it_defend_complete`, `kit_defend_done`, `kit_caught`, `kit_key_caught`, `kit_ca15_host_said`, `kit_ca15_out`, `kit_ca15_done`, `hub_quiet`.
- Only knots: `start` (`:26-27`) and `hub` (`:29-54`). The hub has three branches: the post-stick line, when `kit_defend_done && (kit_ca15_done || not kit_ca15_out) && not kit_ca15_host_said` (`:33`, sets `kit_ca15_host_said` at `:44`); a closing line when `episode_e15_shadow_it_defend_complete` (`:46-48`); and the default (`:49-51`).
- `+ [Thanks, Nilesh.]` at `:55-59` (`#exit_conversation`, sets `hub_quiet`).
- Gap: the kit's `targetKnot: "ca15_stick"` at `tarrowby_logistics.json:879` names a knot that is NOT in `nilesh_solanki.ink`. That mapping is on Fatima's ambient staff block. Her ink is `scenarios/_office_kit/ink/fatima_begum_ambient.json` (the kit's `storyPath` for her, scenario `:912`). Not checked whether that file has `ca15_stick`.

The existing found-stick set piece (`ca15_found_stick`):
- Trigger: `episode_step_away` after `kit_defend_done` sets `kit_ca15_out` (scenario `:830-835`). Every kit mapping keys off `kit_ca15_out`.
- Globals `tarrowby_logistics.json:669-681`: `kit_ca15_there`, `_asked`, `_stick_taken`, `_sent`, `_at_host`, `_at_tray`, `_chidi_go`, `_chidi_there`, `_chidi_sent`, `_chidi_at_host`, `_done`, and `kit_ca15_stick_choice` = `""`.
- Object `kit_ca15_stick`: type `usb_storage_swivel`, name "Memory stick", sprite `usb_storage_swivel`, `takeable: false`, `interactable: true`, `revealOnGlobal: kit_ca15_out`, position `(1.15, 5.4)` (kit `:685-697`; scenario copy `:1279-1294`). Observation: "A small memory stick on the floor. No name, no label." Once `kit_ca15_stick_taken` is true it shows "Nothing there now." and sprite `usb_storage_swivel_taken` (kit `:698-709`). The item has no `needsTag`, no `droppable`, no `usbClass`. It is a scripted floor object, not a player-dropped item.
- Object `kit_ca15_lost_property`: `drop_box`, sprite `drop_box1`, position `(8.35, 5.5)` (kit `:712-728`). Observation changes when `kit_ca15_at_tray` is true.
- Timers (kit `:731-776`; scenario copies at about `:95-140`). Values differ between the two:
  - `kit_ca15_t_there`: 8000 ms after out (both).
  - `kit_ca15_t_tail`: kit 20000 ms after `kit_ca15_asked`, sets choice `leave` if still empty. Scenario 45000 ms.
  - `kit_ca15_t_walk`: 15000 ms after `kit_ca15_sent`, sets done (both).
  - `kit_ca15_t_chidi`: 20000 ms after `kit_ca15_chidi_go`, sets done (both).
  - `kit_ca15_t_done`: kit 90000 ms after out. Scenario 115000 ms after `kit_ca15_asked`.
  - `kit_ca15_t_done_out`: scenario only, 175000 ms after out, if `asked` is not true.
  - The kit's `_note` says the test fixture uses shortened timings. The scenario values are probably the live ones (inferred).
- Fatima's route (kit `:836-` onward): out makes her suspend and walk to `(1.5, 5)` (`patrolOverride`, kit about `:846`). On arrival she barks "Hang on, someone's dropped a memory stick over here." (`:~ 857`, quiet only). After 4500 ms, if the choice is still empty, `targetKnot` `ca15_stick` asks "No name on it, nothing. What do you reckon I do with it?". The choice then sets `kit_ca15_stick_choice` to `handin` (walks to `(4,4)`, kit `:~ 893-907`), `lost` (walks to `(8.45, 6.6)`, kit `:~ 910-921`), or `asked`/`leave`.
- `handin` path: `kit_ca15_sent` true, Fatima arrives, `kit_ca15_at_host` true, bark "Thanks, Fatima. I'll check it on a spare machine that isn't connected to anything." (quiet only), done after 5000 ms (kit mappings from about `:940-955`).
- `lost` path: Fatima arrives at the tray, `kit_ca15_at_tray` true, done after 3000 ms.
- `leave` path: `kit_ca15_chidi_go` true after 3000 ms. Chidi walks to `(1.5, 5)`, arrives, `kit_ca15_chidi_there` true, `kit_ca15_stick_taken` true. Bark "Whose is this, then? I'll take it to Nilesh." (quiet only). Then walks to `(4,4)` and `kit_ca15_chidi_at_host` is set. Bark "Ta, Chidi. That's sat on the floor all afternoon. Anyone could've pocketed it first." (quiet only). Done after 7500 ms.
- `kit_quiet` gates the barks. Scenario `kit_quiet` is set by `episode_e15_shadow_it_state` (`:~ 790-810`), and false again when the debrief is done or `debriefSeen`.

What the set piece shows, in words: a stick on the floor, a colleague who notices it, and an in-world result (handed to IT, or left in lost property where it can be picked up). The debrief card text (`:~ 575-600` in the scenario, `strings.conceptPanel`) names the outcome: "Handed to IT" (`:~ 596`), "Into the lost property box" (`:~ 600`), and "About that stick" (`:~ 590`).

Inbox messages in the attack half (scenario `:153-` triage set):
- `e15_posted_stick` (`:240`): from "Tarrowby Reception", "A padded envelope came in for you, marked from the client", body at `:248`, `truth.isPhish` `true` (`:~ 259`).
- `e15_free_transfer` (`:277`), `e15_giveaway_stick` (`:325`), `e15_free_pdf_tool` (`:362`), `e15_fileshare_notice` (`:410`), `e15_it_tool_reply` (`:444`).

---

## 2. ca15 defend twin: text about sticks

File: `scenarios/ca15_shadow_it_defend/scenario.json.erb` (797 lines). Ink directory exists (`scenarios/ca15_shadow_it_defend/ink`), not checked for stick text.

The twin has no kit set piece, no `visitor_stick` beat and no Nilesh stick knot. Its stick text is in the triage set and the debrief copy. Quotes:
- `:5` scenario brief: "Found sticks and 'quicker way' messages are waiting: some are safe, some aren't."
- `:86` triage brief: "Six things are waiting: found sticks, 'quicker way' messages, and a couple of genuine ones."
- `:189` the posted stick email body: "Inside there's a USB stick and a handwritten note: 'Survey results for the Monday pack, please load these on.'"
- `:209` `found_media` explanation: "A stick that came in the post is a found stick: don't plug it in, not even to see what's on it or who it's from. Hand it to IT, who can check it safely."
- `:212` `reportReply`: "Thanks. We'll take the stick and hand it to IT to check safely. We rang the client on the number already on file, and they'd posted nothing. A note's number proves nothing; the stick goes to IT."
- `:213` `kindLine`: "The email was genuinely from reception, but the posted stick is a found stick, and plugging it in could run malware."
- `:266-299` the giveaway stick (`e15_giveaway_stick`): `:294` "A giveaway stick from a stand is still a stick you didn't buy and can't vouch for. A real supplier is happy to email a catalogue or send a link; the stick goes to IT." `:296` "A stick handed out to a crowd is an easy way to get malware onto a firm's machines, whoever printed the logo on it." `:297` "Kindness and curiosity are why people plug these in, so the kind move is to hand it in rather than plug it in."
- `:444` `mondayCard`: "A found or posted stick goes to IT unplugged."
- `:446` `defendIntro`: "A found or posted stick goes to IT unplugged; if the official way is slow, ask IT rather than build a way round it."
- `:451-452` concept panel "About that stick": "The stick that came in the post was ours: an authorised test, and it only tells us a stick was plugged in. We name nobody. Most people who plug a found stick in are being kind, trying to find the owner, or just curious, so the kind move is to hand it to IT."
- `:448` `teamLine`: "...you kept a found stick or a risky shortcut away from the rest of your team."

No mention of visitors' sticks in the twin. A grep for "visitor" in the defend file returns nothing. The attack shell's `visitor_stick` beat (`scenario.json.erb:534-550`) has no twin counterpart.

Attack shell stick text, for comparison: `:535` "A visiting surveyor holds out their own USB stick with the site drawings on it: 'Just pop it in your laptop, it's quicker than emailing.'" Option `send_link` label `:543-544`: "Ask them to send the drawings through the firm's file-sharing link instead."

---

## 3. Dropped items and NPCs (engine)

### 3a. The drop (player side)

`public/break_escape/js/systems/item-drop.js`:
- Header `:1-30`. A `"droppable": true` inventory item is placed at the player's feet and becomes a takeable world object. An NPC with a matching `interests` tag can notice, collect and use it.
- `dropInventoryItem(sprite)` `:423`. `persistDrop` `:361` (`update_room add_object`, `sourceType 'player_drop'`). `returnToTray` `:406`.
- Event: `w.eventDispatcher?.emit(\`item_dropped:${obj.objectId}\`, payload)` at `:516`. Payload per the header: `{ itemId, tag, roomId, x, y, onTable }`.

Item-side config keys read by the needs system:
- `droppable` (player drop, scenario JSON).
- `needsTag` (string). Read at `npc-needs.js:5353` into the NPC-side item record as `needsTag`.
- `usbClass` (`storage` or `hid`). Read at `npc-needs.js:5371`.
- `sprite` (the picture). `item-drop.js:76-82` (`dropTextureKey`).
- Target side: `affordance.accepts` (array of tags), `affordance.useFrom` `{dx,dy}`, `affordance.useSeconds`. `usbPolicy` is derived from `pcPolicy.usbPolicyFor` (`npc-needs.js:5372-5373`).

### 3b. NPC notice and pickup

`public/break_escape/js/systems/npc-needs.js`:
- `interests` on the NPC record: `{ <tag>: { weight, noticeRooms?, noticeRadius? } }`, normalised at `:526-530` (`normaliseInterest`).
- Default notice radius `NOTICE_RADIUS_TILES = 24` (`:102`, 24 tiles = 768 px). Used at `_carryCandidate` (`:3184-3186`: `reach = (it.noticeRadius || NOTICE_RADIUS_TILES) * 32`).
- Scoring: interests are a candidate with score `it.weight` (`:1782-1788`). A due print errand is scored the same way (`:1790-1796`).
- Candidate filter `_carryCandidate` `:3183-3207`. Object must have `needsTag === tag`, `pickable`, be in `noticeRooms` (or the home room), be within reach, not claimed, not cooling down, `_permitted` and not `_reservedFrom`. The nearest reachable one wins. Target is an object whose `affordance.accepts` includes the tag (`:3200-3204`), or the NPC's home object if it accepts it.
- `pickable` is set at `:5357`: visible, active, not carried, not placed by an NPC, not destroyed.
- Pickup event: `npc_picked_up:${job.itemId}` with `{ npcId, itemId, tag }` at `:3600`.
- Use or delivery: `npc_used:${job.targetId}` with `{ npcId, objectId, need, itemId, tag, payload, ...proximity, met? }` at `:3768`. `consumeHeld` at `:3765` (carry without a slot) or `placeHeld`/`stowHeld` (slot deliveries, `:3755-3762`).
- `consumeHeld` `:5905-5935`: calls `RoomStateSync.consumeCarried`. On success the sprite is destroyed. Then `stateSync.requestSoon()`.
- Refusal: `usbRefusedBy(usb, usbClass)` `:321-328`. Values `blocked` (all of storage and hid) and `storage_blocked` (storage only). Checked at `:3669` on use. `_refuseUse` `:3822-3840` emits `npc_use_refused:<targetId>` (`:3825`), a `usb_refused` grumble (`:3826`), and tries the next target that accepts the tag and is not refused. A separate work-habit path emits `npc_usb_refused:<npcId>` at `:3873`.
- Lab `usb_target_pc` has no `usbPolicy` in its scenario JSON (see section 3d). Policy is taken from `pcPolicy`.

Chatter module: `public/break_escape/js/systems/npc-needs-chatter.js` (448 lines) is the voiced adapter for chatter and exchanges. Its header (`:1-25`) does not mention pickup. It has no `npcThoughts` reference (grep returned none).

### 3c. Does pickup depend on npcThoughts?

Answer (read from code): no, for pickup and use. `npcThoughts` gates only these things:
- `npc-needs.js:4523-4525` `_thoughtsOn()`, used for picture chat: `chatterPool(..., thoughtsOn)` (`:302-313`, `pictures: scenarioChatter !== false && thoughtsOn !== false`) and the many `chatterPool` calls (`:1023`, `:2187`, `:2199`, `:2247`, `:2349`, `:2448`, `:2982`, `:3079`, `:4863`).
- `npc-needs.js:2321-2324`: when thoughts are off, a mutter with no line still emits `npc_mutter:<npcId>` with `line: null`. The emit is kept so a scripted visit does not hang.
- `npc-action-icons.js:355-357` `npcThoughtsOn(scenario)` = `scenario?.npcThoughts !== false`. Used for action icons and avoid/parked/pressing bubbles (`:583-584`).
- `npc-needs.js:5685-5686` passes `npcThoughtsOn` to the chatter world.
- The carry and use functions (`_carryCandidate` `:3183`, `_useCandidate`, `consumeHeld` `:5905`) do not read it (grep of the file shows no other hits).

CA scenarios that set `"npcThoughts": false`: ca15 at `scenarios/ca15_shadow_it/scenario.json.erb:8` (verified). The kit file also sets it: `tarrowby_logistics.json` `"scenario": { "npcThoughts": false }` near line 7 (verified in the first 12 lines). ca12 at `:8` per the handover (not re-checked).

Consequence for CA: a learner sees no picture bubble and no action icon for an NPC's wants. Pickup and use still run. Picture bubbles are the only visible NPC-wants signal, so a dropped item gets no picture cue. This is read from the code, not tested.

Not checked: whether CA shells show the capture log (`addCapture`). Open item 2 of the handover is only partly answered.

### 3d. Lab_physical_pentest: Sofia's pickup (quoted)

File: `scenarios/lab_physical_pentest/scenario.json.erb`.

The droppable item (BadUSB), `kit_deviceB`, about `:1245-1258`:
```
"sprite": "usb_badusb_flat",
"position": { "x": 2.25, "y": 1.28125, "elevation": 30 },
"takeable": true,
"interactable": true,
"active": true,
"droppable": true,
"needsTag": "tag_deviceB",
```
Its `observations` text at about `:1255` tells the learner to drop it on the open-plan floor and watch who finds it.

The second droppable (storage stick), `kit_usb`, `:1259-1270`, `droppable: true`, `needsTag: "dev_usb"`. QR card `kit_qr` `:1274-1281`, `needsTag: "dev_qr"`. Cable `kit_cable` `:1413-1421`, `needsTag: "dev_cable"`. Clone-tool `:1449` has `"droppable": false`.

The NPC, Sofia Lord (`:1957-2050`):
```
{
  "id": "lord",
  "displayName": "Sofia Lord",
  "npcType": "person",
  "position": { "x": 3, "y": 8 },
  "spriteSheet": "lord",
  ...
  "role": "finance",
  "needsHome": "usb_target_pc",
  "needsSpeed": 100,
  "needs": { "caffeine": { "decayPerMin": 18, "urgentAt": 50, "initial": 90 } },
  "interests": {
    "tag_deviceB": { "weight": 3, "noticeRooms": ["open_plan"] },
    "dev_usb":    { "weight": 3, "noticeRooms": ["open_plan"] },
    "dev_qr":     { "weight": 3, "noticeRooms": ["open_plan"] },
    "dev_cable":  { "weight": 3, "noticeRooms": ["open_plan"] }
  },
  "usePayload": { "host": "ledgerwell.account-help.example" },
  "eventMappings": [ ... ]
}
```
(`:1961-1999`. The comment at `:1975-1982` explains the caffeine need. The `interests` block is `:1985-1990`.)

Sofia's mappings, quoted (`:2001-2030`):
```
{ "eventPattern": "item_dropped:kit_deviceB", "condition": "data.roomId === \"open_plan\"",
  "onceOnly": true, "setGlobal": { "kp_usb_dropped": true }, "completeTask": "drop_usb" },
{ "eventPattern": "npc_picked_up:kit_deviceB", "onceOnly": true, "cooldown": 0,
  "bark": "Someone's dropped a memory stick. Whose is this?" },
{ "eventPattern": "npc_used:usb_target_pc", "condition": "data.tag === \"tag_deviceB\"",
  "onceOnly": true, "cooldown": 0, "setGlobal": { "kp_usb_foothold": true },
  "completeTask": "usb_foothold",
  "bark": "Ooh, someone's lost a USB stick. I'll just plug it in and see whose it is." },
```
Other `npc_used:usb_target_pc` mappings: `dev_usb` (`:2031-2040`, `kp_usb2_foothold`, `addCapture` `usb_lure`, `opt_lure`), `dev_qr` (`:2041-2050`, `addCapture` `lord`, `kp_qr_phished`, `opt_qr`), `dev_cable` (`:2051-2059`, `kp_cable_foothold`, `opt_cable`).

The target: `usb_target_pc` (`:2307-2317`): `type: pc`, name "Sofia's PC", position `(2, 6.5)`, `affordance: { "accepts": ["tag_deviceB", "dev_usb", "dev_qr", "dev_cable"], "useSeconds": 6, "useFrom": { "dx": 0, "dy": 1.5 } }` (`:2316`).

Flow in engine terms: `item_dropped` fires from `item-drop.js:516`. The needs system's `onItemDropped` (`npc-needs.js:866-`) only handles magnets. For a plain BadUSB the pickup is an interest candidate (`:3188-3190`, `needsTag` match in `noticeRooms: ["open_plan"]`). Then `npc_picked_up` (`:3600`), then `npc_used:usb_target_pc` (`:3768`) with `data.tag`. The mapping at `:2016` matches on `data.tag === "tag_deviceB"`.

Lab validator note: `hint_watch_sofia` (`:720-725`) tells the learner to watch Sofia.

---

## 4. Cast

Source: `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md` (24 speaking characters; table rows in the "The cast" section, `:68-120`). Ages, roles and episodes come from it. Ethnicity comes from `BRAND_SET.md` where it gives one, otherwise from the voice style line. "Style" lines are inferred for ethnicity. The "Scenarios" column uses the awareness scenario names. Those match the `caNN_*` directory names (for example `e1_invoice_fraud` is `ca01_invoice_fraud`), which is inferred from the names.

Sprite check: every key below has `public/break_escape/assets/characters/<key>.png` (atlas) plus `<key>.json`, `<key>_talk.png` and `<key>_visemes.png` in that folder (directory listing). Delphine's scenario id is `delphine_reception` but her sprite key is `delphine_arvanitis`.

| Character (sprite key) | Age | Ethnicity (source) | Role | CA episodes already hosting them |
|---|---|---|---|---|
| Adaeze Okafor (`adaeze_okafor`) | 40s | Nigerian-British (BRAND_SET) | Finance manager | ca01_invoice_fraud (+defend) |
| Gwen Pritchard (`gwen_pritchard`) | late 30s | Welsh (BRAND_SET) | IT service desk lead | ca13_ai_assistant (+defend) |
| Agnieszka Duda (`agnieszka_duda`) | 30s | Polish, part-time (BRAND_SET) | Payroll officer | ca07_voice_ceo (+defend) |
| Graham Whitfield (`graham_whitfield`) | early 60s | White British, Halifax (BRAND_SET) | Finance training lead, proctor | core_17 annual defend; pre/post finance ab |
| Joanne Pell (`joanne_pell`) | late 40s | White British, Leicester (BRAND_SET) | L&D coordinator | pre/post finance ba |
| Nilesh Solanki (`nilesh_solanki`) | 30s | Gujarati-British, grew up in Leicester (BRAND_SET; ca15 ink header) | IT service desk analyst | ca15_shadow_it (+defend); ca17_acceptable_use_defend; ca09_passwords (+defend) |
| Fatima Begum (`fatima_begum`) | 30s | British Bangladeshi (BRAND_SET) | Recruitment lead | ca02_cv_lures (+defend) |
| Chidi Okeke (`chidi_okeke`) | 40s | Not stated in BRAND_SET; voice style says West Yorkshire with light Nigerian inflection (inferred) | Fleet coordinator, Shipley depot | ca06_texts_and_qr (+defend); ca15 kit ambient |
| Zainab Hussain (`zainab_hussain`) | 30s | British Bangladeshi, wears a hijab (BRAND_SET) | Field service engineer | ca20_remote_and_mobile_working (+defend) |
| Jun Watanabe (`jun_watanabe`) | early 20s | Japanese-British, first job (BRAND_SET) | HR assistant | pre/post hr ab; pre/post mobile ba |
| Lerato Dlamini (`lerato_dlamini`) | 30s | South African, Durban (voice style; not in BRAND_SET excerpt) | Health and safety adviser | pre/post mobile ab |
| Ibrahim Diallo (`ibrahim_diallo`) | 40s | French-West African heritage, settled in Leeds (voice style) | IT support lead | pre/post hr ba |
| Anjali Rao (`anjali_rao`) | 30s (BRAND_SET); about 35 (VOICE_CAST) | Indian, moved from Bengaluru (BRAND_SET) | Information security analyst | core_00_first_play; ca08 (+defend); ca16 (+defend); ca19 (+defend); pre/post general v2 ab; pre/post helpdesk ab |
| Niamh Doherty (`niamh_doherty`) | mid 20s | Northern Irish, Belfast (voice style) | Internal comms officer and IT trainer | ca10 (+defend); ca05 (+defend) |
| Darren Price (`darren_price`) | 40s (BRAND_SET); 50s (VOICE_CAST) | White, Bristol (BRAND_SET) | Security awareness lead | ca03 (+defend); pre/post general v2 ba |
| Sofia Marchetti (`sofia_marchetti`) | 30s | Second-generation Italian-British (VOICE_CAST) | HR adviser | pre/post helpdesk ba |
| Julian Sallow (`julian_sallow`) | mid 60s | Not stated in the lines read | Co-founding partner, Merrin & Sallow | ca14 (+defend); pre/post executive ba |
| Yasmin Chaudhry (`yasmin_chaudhry`) | 40s | British Pakistani (BRAND_SET) | Finance controller | pre/post executive ab |
| Thandiwe Moyo (`thandiwe_moyo`) | 30s | Zimbabwean inflection (voice style) | Studio manager | ca04 (+defend) |
| Delphine Arvanitis (`delphine_arvanitis`) | 30s (VOICE_CAST) vs 50s (BRAND_SET) | Greek-Cypriot British (BRAND_SET); VOICE_CAST says "Mediterranean lilt" | Front-of-house coordinator (lobby) | ca12_visitor_tailgater (attack half) |
| Lorna Easton (`lorna_easton`) | 40s | White, north-west England (BRAND_SET); Lancashire accent (voice) | Reception and facilities lead | ca12_visitor_tailgater (+defend) |
| Ama Owusu (`ama_owusu`) | 40s | Black British of Ghanaian heritage (BRAND_SET) | Security lead, Fenlow Managed IT | ca18_credential_attacks_at_scale (+defend) |
| Tomasz Wiśniewski (`tomasz_wisniewski`) | 50s | Polish, in the UK 25 years (BRAND_SET) | Data Protection Officer | ca11_misdirected_data (+defend); pre/post data conduct ab |
| Yusuf Demir (`yusuf_demir`) | 40s | British Turkish (VOICE_CAST) | Information security lead | pre/post data conduct ba |

Conflicts to flag:
- Delphine: age and ethnicity differ between VOICE_CAST (30s, Mediterranean lilt) and BRAND_SET (50s, Greek-Cypriot British).
- Darren Price: age differs (40s vs 50s).
- Anjali Rao: age differs (30s vs about 35).
- Chidi Okeke and Lerato Dlamini: ethnicity is inferred from voice styles only.

Sprites in CA use outside the 24 voiced cast:
- `kit_camila_ospina` (ca12, `scenario.json.erb:1393-1396`, spriteSheet `camila_ospina`). Sprite files `camila_ospina.png`, `_talk.png`, `_visemes.png`, `_nonpixelart.png` exist. She has no voice entry in VOICE_CAST.
- `lord` (Sofia Lord, lab_physical_pentest, not a CA episode).
- Generic guard sprites exist: `security_guard.png`, `male_security_guard.png`, `female_security_guard.png` (each with `_v2` variants and talk/visemes files). None is assigned to a CA guard yet. The handover's "ca12 guard" and "ca12 runner" are not in any CA scenario file yet.
- `female_office_worker_v2` is the learner avatar in ca12 and ca15 (`scenario.json.erb:18`).

Seated frames: the directory listing shows no separate "sit" or "seated" atlas file names. Whether the atlases contain seated frames is not checked (the PNGs were not opened).

---

## 5. Rubric

Path (main checkout only; the worktree has no `tmp/handover/ac0/`):
`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tmp/handover/ac0/CA_FUN_USP_RUBRIC.md`

Written 21 Nov 2026. Scored 0 to 3 per heuristic, with evidence required. The file says "13 heuristics. Max 39." (`:132`). The brief and the project memory say 12. The file has 13 IDs, so the count does not match. Sibling file `tmp/handover/ac0/CA_RUBRIC_USEFULNESS.md` has round notes only (no heuristic list read).

The 13 heuristics, one line each:
- F1 Early hook (curiosity, Malone): a question, oddity or goal within 2 minutes.
- F2 Challenge pitched to a first-timer (flow): goals clear, no stall over 90 seconds.
- F3 Agency and meaningful choice: choices change outcomes or NPC lines.
- F4 Living world and characters: staff have wants, banter, and are named by the player.
- F5 Pace and length: 15 to 20 minutes, no padded section.
- F6 Wants to play again or tell someone: unprompted intent to replay or recommend.
- O1 The attacker's goal and method are shown, not just stated.
- O2 Attacker reasoning is visible; the weakness named is a process or human one, not a character flaw.
- O3 Turning the view into defence: one concrete action and its cue.
- O4 Tone: curious and empowering, not frightening or blaming.
- A1 Technically and procedurally correct.
- A2 Safe takeaway: no operational detail beyond awareness level; no bad habit taught.
- P1 Put it into practice, or see it play out (added by the owner, 21 Nov): a fresh chance to apply the habit plus an in-world outcome.

Section 4 of the file: for the defend twin, O1 and O2 are recall, and O3 and F2 are weighted more heavily.

---

## 6. Route suites

Not present for ca12 or ca15. Checked:
- `scripts/ink_runtime_check/` holds `m01_routes` to `m10_routes` (each with `route.js` and `r*.json` routes), `maya_routes.js`, `missions.json`, `inkcheck.js`, `loopcheck.js`, `inklint.mjs`, `dialoguelint.mjs`, `reopencheck.mjs`, `tagdiff.mjs`, `voicelines.mjs`, and others. No `ca12_routes` or `ca15_routes` directory.
- `scripts/ink_runtime_check/missions.json` does have entries for `ca12_visitor_tailgater` and `ca12_visitor_tailgater_defend` (NPCs `lorna_easton`, `delphine_reception`, and `lorna_easton` for the defend twin) and for `ca15_shadow_it` and `ca15_shadow_it_defend` (NPC `nilesh_solanki`, room `training_room`). These are read by `reopencheck.mjs`.
- The only `routes` hits for CA are in the handover and plan files themselves.

How to run what exists:
- Per-mission route driver: `node scripts/ink_runtime_check/m01_routes/route.js scripts/ink_runtime_check/m01_routes/<name>.json` (usage line in `m01_routes/route.js` header). Each mission's driver is a copy with mission path, ink list and NPC ids changed. A ca route would need its own copy.
- Route file format (step vocabulary in the `route.js` header): `note`, `set`, `talk`, `enter`, `pickup`, `read`, `ko`, `event`, `expect`, `maxRun`, `tasks`, `music`, `credits`, `said`/`notSaid`, `backstops`.
- Ink-only checks: `node scripts/ink_runtime_check/inkcheck.js <file.json> [knot] [VAR=value ...]` (`inkcheck.js:4`). `node scripts/ink_runtime_check/loopcheck.js <file.json> <knot>` (`loopcheck.js:6`).
- Phone reopen: `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json [prefix ...]` (`reopencheck.mjs:14`; `AGENTS.md:197`).
- Ink diff: `scripts/ink_runtime_check/tagdiff.mjs` against the last commit (`AGENTS.md:198`).
- Lint: `node scripts/ink_runtime_check/inklint.mjs <mission-dir-or-ink-files>` (`inklint.mjs:488`) and `dialoguelint.mjs` (`:1228`).
- Team rule (project memory, not repo docs): run every `mXX_routes` route before sending a hash (maxRun 9). No CA route exists, so that rule does not reach CA ink today.

Open item 6 of the handover says to create `ca12_routes` and `ca15_routes`. These directories do not exist. Only the `missions.json` entries do.

---

## Gaps and things not checked

- Handover item 2 (`interests` and `npc_used` with `npcThoughts: false`): answered from code in 3c. Not run.
- Handover item 2, capture log under CA shells (`addCapture`): not checked.
- Handover item 3, the item-drop return path for a training-room refusal: `_refuseUse` (`npc-needs.js:3822`) covers the USB policy. The `training_room` policy (`usbPolicy` for the CA kiosk or PCs) was not read. Kit `ca15` has no `usbClass` on its stick, so no refusal path applies to it.
- The `ca15_stick` knot used by the kit (`tarrowby_logistics.json:879`) is not in `nilesh_solanki.ink`. Whether it is in Fatima's ambient ink was not checked.
- Timers and needs values differ between the ca15 scenario and the kit (section 1). Not resolved.
- Seated frames in the CA sprite atlases: not verified in the PNGs.

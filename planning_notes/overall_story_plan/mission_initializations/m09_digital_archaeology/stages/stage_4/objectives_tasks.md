# m09 Digital Archaeology: Stage 4, player objectives

## 0. Status and inputs

Stage 4. Author: stages 4–5 author (Opus), 2026-10-21. Status: first draft, for review round 1. Written with `../stage_5/room_layout.md` (the two documents share room, NPC, object and global ids; where a choice was a layout choice it is argued there).

Inputs: `../stage_0_initialization.md`; `../stage_1/story_arc.md` (beats cited as "Beat 2.4"; §11's locks table and forced-phone rule are binding); `../stage_2/storytelling_elements.md` ("SE"); `../stage_3/moral_choices.md` ("MC"; its §10 state table is the source for every story global); `../../finale/FINALE_ARC.md` ("FA") §1–9, §13, §17; `story_design/story_dev_prompts/04_player_objectives.md`; the `mission-alignment-plan`, `scenario-design-review` and `mission-puzzle-chains` skills; `README_scenario_design.md` (objectives, forced calls, closing card, authoring rules); `tools/pass2/PASS2_LESSONS.md`; shipped `m08_the_mole/scenario.json.erb` (aims, flag station, debrief), m05's Recruiter and debrief wiring; the engine (`systems/npc-manager.js`, `systems/apply-actions.js`, `minigames/helpers/chat-helpers.js`, `systems/unlock-system.js`, `app/models/break_escape/game.rb`). VM flags appear by story meaning only; no VM material was opened.

**What this stage decides** (each argued below):

1. Six aims. Aims 2 and 3 run side by side in Act 2 (the cage and the ledger), and so do aims 4 and 5 in Act 3 (the office and Tomb Beta's server), so the player always has an in-game step and a VM step on screen at once.
2. Every forced beat that would spoil itself as a task title (the Recruiter's call, the identity scene, the hour) is a task that ships `locked` and is unlocked by the scene's own first line, then completed by its done-flag.
3. The night's order (stage 1 §11) becomes thirteen concrete conditions (§4): two flag-station rules, four door locks, one NPC unlock tag, and mappings keyed on done-flags.
4. Two changes to earlier stages, both forced by the engine: Tomb Beta's server moves into the salvage cage (one lock per door), and the cage's print and card split between the cage gate (card) and the plan cabinet (print). §14 lists them.

## 1. Rules this stage works to

Where the 04 prompt and the newer standards differ, the newer standards win. The prompt's `id`/`description` JSON is the old form; §13 uses the shipped `aimId`/`title`/`taskId` form (m08 `scenario.json.erb:328-560`).

- **Aims gate nothing.** The only engine convergence is `unlockCondition` on aims (client) and `concludeRequires` (server). Story order is held by locks and done-flags (§4), never by an aim being open.
- **`concludeRequires` holds the four flag tasks and nothing else** (README "concludeRequires"). Story tasks are scored, not gated.
- **Spoiler-safe.** Every task in an aim shows when the aim unlocks, unless it ships `locked` and is unlocked by the moment that reveals it. No title names WREN, Kowalczyk, the Recruiter or Tesseract before the player has heard the name.
- **Action titles.** Each title says what to do and, where it isn't obvious, where.
- **A locked aim reveals itself when any of its tasks completes** (PASS2 lesson 27). No task in a later aim can complete before that aim unlocks; where an optional activity can happen early (Tran), its task is `custom` and completed by a mapping that waits for the aim (the m08 brief-gated pattern).
- **Tasks in later aims ship `status: "active"`** (lesson 33), apart from the deliberately `locked` reveal tasks above, which are opened by `#unlock_task`.
- **Flags.** Each flag reward sets a plain global (`flag1_submitted` … `flag4_submitted`); every story reaction hangs off those globals or off `objective_task_completed:<task>` on HaX (README "Wiring VM flags"). `submit_flags` targets are station-qualified. Notes are never flag rewards.
- **Mappings live on always-loaded NPCs.** HaX (`agent_0x99`), the Recruiter and every other phone contact are listed in the start room (`loading_dock`), so their mappings hear every event from the first frame (lesson 43). A person NPC in a later room only reacts to its own `room_entered` or to globals it reads on arrival.
- **Conditions use `&&` only.** Every "A or B" in this document is two mappings.
- **Imports never gate.** No import appears in an `unlockCondition` or `concludeRequires`; imports are read in ink, in mapping conditions and in object variants.
- **VM system names are placeholders.** `catalogue_server` (flags 1–2) and `tomb_beta_server` (flags 3–4) stand in for the SecGen `system_name`s the opus48 VM plan will choose. Assumption: each machine numbers its own flags from 1, so story flag 3 is `tomb_beta_server-flag1` and story flag 4 is `tomb_beta_server-flag2`. Stage 9 re-derives the mapping from the built XML.

## 2. The aim ladder

One objective, six aims. "On screen" is what the player sees the moment the aim unlocks.

| # | `aimId` | Title | Unlocks on | Act | On screen at unlock | Handoff line that announces it |
|---|---|---|---|---|---|---|
| 1 | `get_in` | Get In And Set Up The Drop Terminal | start (`active`) | 1 | get inside; set up the drop terminal; submit the catalogue flag; (optional) talk to the clerk | HaX at the dock: "That noise is a cross-cut shredder. It's been running since before you landed." |
| 2 | `restricted_series` | Find The Restricted Series Before It Burns | `aimCompleted: get_in` (flag 1) | 2 | get into the restricted stacks; talk to Sorensen at the cage hatch; get through the cage gate; open the plan cabinet; compare the hand; (optional) stop the tape wipe | HaX on flag 1: the shelf marks are behind the cage mesh, and "the boxes on Noor's trolleys are the ones on this list" |
| 3 | `read_the_ledger` | Read The Initiative's Ledger | `aimCompleted: get_in` (flag 1) | 2 | submit the ledger flag (the rest arrive `locked`) | the same HaX line, second sentence: "The catalogue keeps something else live. Their ledger." |
| 4 | `search_the_office` | Search The Director's Office | `aimCompleted: read_the_ledger` (the deck choice) | 3 | get into Sorensen's office; open her safe; take the file she quoted from; take the tape room key card; find Tomb Gamma's deed | the deck call's last lines: "She fired it from Peg's office. I'm on the door." |
| 5 | `take_tomb_beta` | Take Tomb Beta's Server | `aimCompleted: read_the_ledger` | 3 | get into the tape room; open the salvage cage; submit the owner flag; submit the control flag (two reveal tasks arrive `locked`) | the same call: "Her card for the tape room will be in that office." |
| 6 | `report_in` | Report To Netherton | `aimCompleted: take_tomb_beta` (Tesseract's call over) | debrief | report to Netherton | HaX's report of Tesseract's call ends: "Netherton's on the ground at Helena. Tell me when you're ready to come in." |

**Why two pairs run side by side.** Act 2 is the cage (in-game) and the ledger (VM flag 2) in either order; stage 1 lets flag 2 come before or after the cage (Beat 2.4), so one aim for each means neither looks finished while the other is pending. Act 3 is the office and the server: showing aim 5 with aim 4 tells the player at once that the tape room needs something from the office, which is the next step's reason. The pairing also keeps a VM task and an in-game task on screen through most of the night, which is the hybrid rhythm m02 and m08 aim for.

**Dead-zone check** (scenario-design-review §2g):

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Transition narrated |
|---|---|---|---|---|
| 1 | 3 | 3 (HaX at the dock names the dock doors and the reading room) | low: the shredder and HaX point inward | HaX on flag 1 (Beat 1.4) |
| 2 | 5 | 5 (flag 1's shelf marks; Sorensen in view behind the mesh; HaX names the reader and the cabinet; the case file names the notebook) | the hand: covered by a HaX hub topic once the file is held (§7) | the recognition and HaX's clock line at the gate |
| 3 | 2 visible after the call starts | 2 | between flag 2 and the call when the cage is still shut: aim 2's tasks are still open, so the next step is on screen | the Recruiter's call is the transition |
| 4 | 5 | 5 (HaX on the door; the safe in view; the safe holds the card and the file) | none | HaX's line on the deck |
| 5 | 4 visible, 2 more arrive with their scenes | 4 (the card's label names the tape room; HaX names the keypad; Gary or the catalogue legend for the code) | at the salvage cage keypad without the code: HaX's hub topic (§7) and the catalogue entry both point at it | the identity scene, the read, Tesseract's call |
| 6 | 1 | 1 (HaX's last line; a hub choice to come in) | none | HaX |

## 3. Aims and tasks

One objective (`main_mission`, "Digital Archaeology"). Columns: **Kind** is VM flag, in-game, correlation or scene; **Completes on** is the exact trigger; **Feeds** is what completing it opens or sets. Object, room and NPC ids are stage 5's (`../stage_5/room_layout.md` §3).

### 3.1 Aim 1 `get_in`: Get In And Set Up The Drop Terminal (Act 1)

Description: "Mountain States Records & Retention, after hours. Get inside, set the field laptop up in the reading room and open the archive's catalogue server. The shredder has been running since before you landed."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `get_inside` | Get inside the archive | in-game | `custom`, active | HaX mappings: `room_entered:front_desk` and `room_entered:open_stacks` (two mappings, either first, `onceOnly`) | nothing; the dock's two doors teach the choice of route (office door by pick, or the shutter on the guard's round) |
| `meet_the_clerk` | Talk to the clerk at the front desk | in-game | `npc_conversation` `noor_haddad`, active, **optional** | `#complete_task:meet_the_clerk` at the top of Noor's first knot (lesson 44); `taskOnKO` on Noor | Noor's branch (warning, card, held box) |
| `set_up_drop_terminal` | Set up the field laptop in the reading room | in-game | `custom`, active | HaX mapping on `object_interacted`, condition `data.objectType === 'vm-launcher' && data.roomId === 'reading_room'` | `catalogue_guide_offered` (§7) |
| `submit_catalogue_flag` | Get into the catalogue server and submit what it hides | VM flag 1 | `submit_flags`, active; `targetFlags: ["drop_terminal:catalogue_server-flag1"]`, `targetCount: 1` | the drop terminal | flag reward `unlock_door restricted_stacks` and `set_global flag1_submitted`; aims 2 and 3 |

Aim 1 completes on its three required tasks. `get_inside` and `set_up_drop_terminal` are both done long before flag 1 on every route, so the aim closes on the flag.

### 3.2 Aim 2 `restricted_series`: Find The Restricted Series Before It Burns (Act 2)

Description: "The catalogue puts Series R behind the cage mesh in the restricted stacks, where the director is feeding a shredder from the clerk's trolleys. Get past her and into the cage before it's all ash."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `enter_restricted_stacks` | Get into the restricted stacks | in-game | `enter_room` `restricted_stacks`, active | entering (the door opens on flag 1's reward) | Sorensen at the hatch in view |
| `talk_at_the_hatch` | Talk to Sorensen at the cage hatch | in-game, social | `custom`, active | two mappings on HaX: `global_variable_changed:hatch_talked` (set at the top of her hatch knot) and `global_variable_changed:cage_opened` (Victoria's route skips the hatch) | the bluff, the recognition, the bin choice, the card clone, the stamp in reach |
| `open_the_cage` | Get through the cage gate | in-game, RFID | `custom`, active | HaX mapping on `global_variable_changed:cage_opened` | `cage_opened`: the purge's first event (§4 row 2) |
| `open_plan_cabinet` | Open the locked plan cabinet at the back of the cage | in-game, fingerprint | `unlock_object` `plan_cabinet`, active | the biometric unlock (Sorensen's print, lifted off the stamp) | Nightshade's recruitment file in reach |
| `match_the_hand` | Compare the hand on the recruitment file with HaX's case file | correlation | `custom`, active | `#complete_task:match_the_hand` in HaX's hub knot `the_hand` (§7), offered once `nightshade_file_held` | `hand_matched`; HaX: "Those are my notes. That's his pen." then "Hold that." |
| `stop_the_shredding` | Stop Sorensen's shredding | in-game, choice | `custom`, **optional**, `locked` | unlocked by HaX's mapping on `cage_opened`; completed by two mappings: `global_variable_changed:sorensen_fate` with `value === 'ko'`, and with `value === 'talked'` | `legacy_files_saved` (on a knock-out before the clock), or her written account |
| `stop_the_tape_wipe` | Stop the tape wipe in the server closet | in-game, choice | `custom`, **optional**, active | brief-gated pair on HaX (m08 pattern), so an Act 1 visit to Tran can't reveal aim 2 early: `global_variable_changed:tran_outcome` with `value !== 'left' && globalVars.flag1_submitted`, and `global_variable_changed:flag1_submitted` with `globalVars.tran_outcome !== 'left'` (Tran's default is `left`) | the tape side saved; Tran talked or held |

Aim 2 completes on its five required tasks. `match_the_hand` is the only one with no lock behind it, so it can sit open into Act 3; that does no harm (aims gate nothing), and the identity scene holds the name until the file is held anyway (§4 row 9).

### 3.3 Aim 3 `read_the_ledger`: Read The Initiative's Ledger (Act 2)

Description: "The catalogue server keeps the Insider Threat Initiative's ledger live: placements, candidates, and an older legacy section. Pull it, and find out what it says about the people you met this morning."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `submit_ledger_flag` | Pull the Initiative's ledger off the catalogue server and submit it | VM flag 2 | `submit_flags`, active; `targetFlags: ["drop_terminal:catalogue_server-flag2"]`, `targetCount: 1` | the drop terminal | `flag2_submitted`; HaX's ledger read (a timed text plus the hub topic); the printed ledger readable; the H&L file number; the call (§4 row 3) |
| `answer_the_offer` | Answer the Recruiter's offer | scene, forced choice | `custom`, `locked` | `#unlock_task:answer_the_offer` on the call's first line; `#complete_task:answer_the_offer` on the line that sets `deck_choice_made` (in the Recruiter's knot, or in HaX's resume knot) | aim 3 done, so aims 4 and 5 open |
| `cross_reference_wren` | Find WREN's file among Harwick & Lowe's boxes in the open stacks | correlation | `custom`, **optional**, `locked` | unlocked by HaX's mapping on `flag2_submitted`; completed by two mappings: `global_variable_changed:sleeper_shortlist` (`value === true`) and `global_variable_changed:sleeper_named` (`value === true`), so it closes on the name too | `sleeper_shortlist` |

The task title uses "WREN" only from flag 2 on, because the task is locked until then.

### 3.4 Aim 4 `search_the_office`: Search The Director's Office (Act 3)

Description: "The Recruiter fired the wipe from Sorensen's office, and HaX has the door. Search it. Whatever the night is protecting, she kept the keys to it."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `enter_office` | Get into Sorensen's office | in-game | `enter_room` `sorensen_office`, active | entering (HaX's `#unlock_door:sorensen_office` on the deck choice) | – |
| `open_the_safe` | Open Sorensen's safe | in-game, PIN cracker | `unlock_object` `director_safe`, active | the PIN unlock (Kowalczyk's cracker, or the PIN from her desk) | the Reading, the master schedule, the tape room card in reach |
| `take_the_reading` | Take the file Sorensen quoted from | in-game | `collect_items`, `targetItemIds: ["the_reading"]`, `targetCount: 1`, active | the pickup | `reading_found`; reading it to its last page sets `reading_finished` (`onRead`, last page object; stage 7 decides one object or two) |
| `take_tape_room_card` | Take the tape room key card | in-game | `collect_items`, `targetItemIds: ["tape_room_keycard"]`, `targetCount: 1`, active | the pickup | opens `tape_room` |
| `find_the_deed` | Find Tomb Gamma's deed and construction file | in-game | `collect_items`, `targetItemIds: ["lease_file"]`, `targetCount: 1`, active | the pickup | the paper half of the defences; the no-coordinate line (FA §3.1) |

The title for the Reading is earned: by aim 4 every player has heard Sorensen quote their file ("You're the one he writes about.", Beat 2.1). The master schedule, the rent book, Danny's sheet and the refit ledger are finds with no task (§8).

### 3.5 Aim 5 `take_tomb_beta`: Take Tomb Beta's Server (Act 3)

Description: "Tomb Beta's last server is still running somewhere in the tape store, off the destruction schedule. Get to it, take it, and read what it's mirroring."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `enter_tape_room` | Get into the tape room | in-game, RFID | `enter_room` `tape_room`, active | entering (the key card from the safe) | the Alpha-tapes deck (on that route); the double-cross text (on that route) |
| `open_salvage_cage` | Open the salvage cage's keypad | in-game, decode | `unlock_room` `salvage_cage`, active | `door_unlocked` with `connectedRoom: salvage_cage` (objectives-manager's `unlock_room` path) | Tomb Beta's server, its station and the field kit link |
| `submit_owner_flag` | Find out who owns Tomb Beta's server and submit it | VM flag 3 | `submit_flags`, active; `targetFlags: ["tomb_beta_station:tomb_beta_server-flag1"]`, `targetCount: 1` | the salvage cage's station | `flag3_submitted`; the identity scene (§6.2) |
| `hear_the_name` | Take the call with HaX and Netherton | scene, forced choice | `custom`, `locked` | `#unlock_task` on the identity scene's first line; `#complete_task` on the player's answer (the line that sets `identity_scene_done`) | `hax_confession_answer`; the Albion papers; `send_the_notice` unlocks |
| `submit_control_flag` | Take full control of Tomb Beta's server and submit it | VM flag 4 | `submit_flags`, active; `targetFlags: ["tomb_beta_station:tomb_beta_server-flag2"]`, `targetCount: 1` | the salvage cage's station | `flag4_submitted`; the read (§6.3) |
| `hear_the_mirror_job` | Hear what the server is mirroring to Tomb Gamma | scene | `custom`, `locked` | `#unlock_task` on the read's first line; completed by HaX's mapping on `global_variable_changed:tesseract_call_done` | aim 5 done, so aim 6 opens |
| `send_the_notice` | Decide whether to send his vendor notice | choice | `custom`, **optional**, `locked` | unlocked in the identity scene's Albion knot (`#unlock_task`); completed by HaX's mapping on `global_variable_changed:albion_notified` (`value === true`) | `albion_notified` |

`hear_the_mirror_job` closes on Tesseract's call, not on the read, because stage 1 §11 puts the conclusion after the call (R4-01). Its title doesn't mention the call: the call is the one surprise of the act.

### 3.6 Aim 6 `report_in`: Report To Netherton (debrief)

Description: "Task Force Null is on the ground at Helena's airfield. Netherton wants the night from you in person."

`missionConclusion: true`, `conclusionScreen: { "type": "bond_visualiser" }`, `concludeRequires.tasksCompleted`: the four flag tasks (§9).

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `report_to_netherton` | Report to Director Netherton at the airfield | scene | `custom`, active | `#complete_task:report_to_netherton` on the debrief's **last** line, after the notice question (lesson 46; MC §3.5) | the closing card and credits |

The debrief starts from HaX's hub ("[Bring me in.]", §7), not by itself, so a player can still finish an optional thread (the notice in the archive, the boxes, Tran) after the call. Pattern: m05's `mission_complete` hub choice and hidden-person debrief (`m05 scenario.json.erb:1528-1560`).

## 4. The night's order as concrete conditions

Stage 1 §11's locks table, row by row, as the build will hold it. "HaX" means a mapping on `agent_0x99` (start room, always loaded). Two engine facts shape this table (verified in code; §5 of stage 5 has the verdicts):

- **A flag carries exactly one reward.** `flagRewards` is index-parallel to `flags` (`games_controller.rb` ~2163-2170), so flag 1 can't both set a global and open a door.
- **A flag reward's `unlock_door` opens the station's own room, not the target.** The server merges `'room_id' => <the station's room>` over the reward (`games_controller.rb` ~2166) and then reads `reward['room_id'] || reward['target_room']` (~2233), so `target_room` is never used when the station sits in a room. Until that is fixed (engine work, §15), doors that open on a flag are opened by HaX's ink `#unlock_door`, which the server allows for an NPC listed with `"unlockable": [...]` that the player has encountered (`game.rb:1247-1270`; every NPC in a loaded room counts as encountered, `games_controller.rb:1519-1557`).

| # | Step | Held by | Concrete condition |
|---|---|---|---|
| 1 | flag 1 → the cage | the restricted stacks' outer door | `restricted_stacks`: `locked: true`, `lockType: "rfid"`, `requires: "stacks_release"` (no card in the world has that id, so the cloner can't help). Opened only by `#unlock_door:restricted_stacks` on the first line of HaX's knot `flag1_read`, which a HaX mapping opens on `global_variable_changed:flag1_submitted` (`value === true`, `delayMs: 2500`, so it waits for the station to close). The same tag sets `stacks_door_opened`. Backstop: hub choice `{flag1_submitted and not stacks_door_opened}`. HaX's `unlockable`: `["restricted_stacks", "restricted_cage", "sorensen_office"]` (the cage only for Victoria's route, row 2b). |
| 2 | the cage gate | Sorensen's stacks card | `restricted_cage`: `lockType: "rfid"`, `requires: "stacks_card"`; `sorensen_hatch.rfidCard.card_id: "stacks_card"`, cloned by `#clone_keycard:stacks_card` in her hatch knot (m08's technique, `m08 scenario.json.erb:1434-1471`). `cage_opened` is set by HaX on `door_unlocked` with `data.connectedRoom === 'restricted_cage'`. |
| 2b | the cage gate, Victoria's route | the maintenance code from Sorensen's mail | HaX hub knot `maintenance_code`, gated `{m03_victoria_fate == "recruited" and flag1_submitted and not cage_opened}`, ends `#unlock_door:restricted_cage`. A second HaX mapping sets `cage_opened` on `door_unlocked_by_npc` with `data.roomId === 'restricted_cage'` (that event carries the unlocked room in `roomId`). |
| 2c | the plan cabinet | Sorensen's print | `plan_cabinet`: `lockType: "biometric"`, `requires: "Margaret Sorensen"`; `sorensen_stamp` on the hatch shelf has `hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`. |
| 3 | the cage → the call | flag 2 **and** the opened cage, outside it | Recruiter mappings, each `conversationMode: "phone-chat"`, `targetKnot: "call"`, `disableClose: true`, `onceOnly: true`: (a) `room_exited` with `data.roomId === 'restricted_cage' && globalVars.ledger_read_heard && globalVars.cage_opened && !globalVars.in_cage && !globalVars.recruiter_call_started`, `delayMs: 3000`; (b) `global_variable_changed:ledger_read_heard` with `value === true && globalVars.cage_opened && !globalVars.in_cage && !globalVars.recruiter_call_started`, `delayMs: 3000`. Keying on `ledger_read_heard` (set on the first line of HaX's ledger read, which opens on `flag2_submitted`) rather than on the flag itself means the call can never ring before the ledger is read: two delayed mappings on one event would race once the station closed. A delayed mapping waits for any open conversation (`npc-manager.js:612-620`), so the call rings as HaX's read closes. `in_cage` is set true and false by HaX on `room_entered:restricted_cage` and `room_exited` (`data.roomId === 'restricted_cage'`). |
| 4 | the call → the deck choice | the call's first line and done-flag | first line: `#set_global:recruiter_call_started:true`, `recruiter_offer = refused`, `deck_pulled = alpha_tapes`, `recruiter_secret` by branch, `#unlock_task:answer_the_offer`. Last choice: the legal pair, `#set_global:deck_choice_made:true`, `#complete_task:answer_the_offer`. Re-ring and resume: §6.1. |
| 5 | the deck → the office | the office door | `sorensen_office`: `lockType: "password"`, `requires` a long code that appears nowhere (her keypad is off the card system, and the PIN cracker only works on `pin` locks, `minigame-starters.js:525-540`). Opened by `#unlock_door:sorensen_office` on the line that sets `deck_choice_made`, in the Recruiter's knot and in HaX's resume knot; the Recruiter's `unlockable` is `["sorensen_office"]`. The tag also sets `office_door_opened`. Backstop: HaX hub `{deck_choice_made and not office_entered}`. |
| 6 | the office → the tape room | the key card in the safe | `tape_room`: `lockType: "rfid"`, `requires: "tape_room_reader"`; the only card with that id is `tape_room_keycard` in `director_safe` (`lockType: "pin"`). |
| 7 | the tape room → Tomb Beta's server | the salvage cage keypad | `salvage_cage`: `lockType: "password"`, `requires` the decoded catalogue code (stage 6 writes it; letters and digits, so it reads as an archive shelf code). The encoded entry is on `catalogue_view` from flag 1 (§5). |
| 8 | flags 3–4 only beside the server | station `acceptsVms` | `drop_terminal.acceptsVms: ["catalogue_server"]`; `tomb_beta_station.acceptsVms: ["tomb_beta_server"]`, inside `salvage_cage`. |
| 9 | flag 3 → the identity scene | flag 3 **and** the file | HaX: `global_variable_changed:flag3_submitted` with `value === true && globalVars.nightshade_file_held` → forced call `identity_scene` (§6.2); with `value === true && !globalVars.nightshade_file_held` → text "Bring me his file. Then we say it."; `global_variable_changed:nightshade_file_held` with `value === true && globalVars.flag3_submitted && !globalVars.identity_scene_started` → the forced call. `nightshade_file_held` is the file's `onPickup` `setVariable`. |
| 10 | the scene → flag 4's read | `identity_scene_done` | HaX: `global_variable_changed:flag4_submitted` with `value === true && globalVars.identity_scene_done` → forced call `hour_read`; `global_variable_changed:identity_scene_done` with `value === true && globalVars.flag4_submitted` → the same; `flag4_submitted` with `!globalVars.identity_scene_started` → text "His file first. Then the rest of his box."; with `globalVars.identity_scene_started && !globalVars.identity_scene_done` → re-ring the identity scene (`resume: true`). |
| 11 | the read → Tesseract's call | `hour_read_done` | HaX: `global_variable_changed:hour_read_done` (`value === true`, `delayMs: 4000`) → forced call `tesseract_call`. |
| 12 | the call → the conclusion | `tesseract_call_done` | HaX: `global_variable_changed:tesseract_call_done` → `completeTask: "hear_the_mirror_job"`; aim 6 unlocks on aim 5. |
| 13 | the notice → the pen | the debrief's spine | debrief ink: `albion_notified` copied to a temp on the first line; the stance; the notice question if unsent; the hub; the spine; `#complete_task:report_to_netherton` on the last line. |

**The purge's three timed rules** (FA §6.1), as conditions:

| Rule | Condition |
|---|---|
| The other bin goes when the cage opens | `cage_bin` default: HaX on `global_variable_changed:cage_opened` with `!globalVars.bin_chosen` → `setGlobal: { "cage_bin": "derek_file" }`. The bin choice sets `bin_chosen`. On Victoria's route the choice comes at the cage door just after, and overwrites (both bins' `spriteVariants` follow `cage_bin`, so the room always shows one bin emptied). |
| The legacy box goes at the first of the chest or the first exit | `legacy_clock_run`: HaX on `global_variable_changed:nightshade_file_held` with `globalVars.cage_opened && !globalVars.legacy_clock_run`, and on `room_exited` with `data.roomId === 'restricted_cage' && globalVars.cage_opened && !globalVars.legacy_clock_run`. Saved by a knock-out first: HaX on `npc_ko:sorensen` with `!globalVars.legacy_clock_run` → `legacy_files_saved: true`. Held back by Noor: HaX on `global_variable_changed:cage_opened` with `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → `legacy_files_saved: true`. |
| The printed ledger goes once read, if Sorensen is free | `printed_ledger.onRead` sets `printed_ledger_read`; its `textVariants` show the shredded strips on `globalVars.printed_ledger_read && globalVars.sorensen_fate === 'left'` (the flag holds the content, so nothing is lost). |

## 5. Globals and event wiring

Every global below goes in `globalVariables` with the default shown and is `VAR`-declared in each ink that reads it. The story globals (exports and locals) are MC §10's, unchanged; this section adds the machinery.

**Exports** (MC §10; the stage 9 `exportGlobals` list): `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, `cage_bin`, `legacy_files_saved`.

**Story locals** (MC §10): `raid_team_answer`, `noor_told`, `noor_ko`, `old_coyote_told`, `old_coyote_ko`, `sorensen_fate` (default `"left"`), `tran_outcome` (default `"left"`), `reading_told_hax`, `memo_stance`, `kowalczyk_reply`, `schedule_read`.

**New at this stage**

| Global | Default | Set by | Read by |
|---|---|---|---|
| `briefing_played` | `false` | briefing first line (`setGlobalOnStart`) | `skipIfGlobal`; music |
| `cracker_given` | `false` | `item_picked_up:pin-cracker` mapping (lesson 26) | HaX's safe line ("Kowalczyk's toy.") |
| `flag1_submitted` … `flag4_submitted` | `false` | each station's `flagRewards` (`set_global`, one per flag) | everything in §4 |
| `stacks_door_opened` | `false` | HaX `flag1_read` knot, with the unlock tag | hub backstop |
| `hatch_talked` | `false` | top of Sorensen's hatch knot | `talk_at_the_hatch`; her door knot on Victoria's route |
| `bin_chosen` | `false` | the bin buttons (hatch or door) | the `cage_bin` default |
| `cage_opened` | `false` | HaX on the gate's unlock (two mappings, §4 rows 2, 2b) | call, clock, Sorensen's swap, bins, tasks |
| `in_cage` | `false` | HaX on entering and leaving `restricted_cage` | the call's mapping (b) |
| `nightshade_file_held` | `false` | `onPickup` on `nightshade_file` | the clock; the hand; the talk lever; the identity scene |
| `notebook_read` | `false` | `onRead` on the case file's notebook page | the hub topic `the_hand` |
| `hand_matched` | `false` | HaX `the_hand` knot | the identity scene's "two directions" line |
| `legacy_clock_run` | `false` | §4 purge table | `legacy_files_saved`; `feed_table_box` variants; HaX's "She's done with that box." |
| `sorensen_ko` | `false` | `globalVarOnKO` on `sorensen` | her cage-room visibility; the debrief |
| `printed_ledger_read` | `false` | `printed_ledger.onRead` | its shredded variant |
| `ledger_read_heard` | `false` | HaX `ledger_read` knot | hub topics after flag 2 |
| `recruiter_call_started`, `recruiter_said_yes`, `recruiter_gone` | `false` | the call's ink (first line; the "yes"; her last line, whether naming, refusing or hung up on) | the re-ring routing (§6.1) |
| `deck_choice_made` | `false` | the deck's last choice | office, aims, Beat 2.7, the invoice |
| `office_door_opened`, `office_entered` | `false` | the unlock tag; `room_entered:sorensen_office` | the backstop |
| `invoice_booked` | `false` | HaX, 60 s after `deck_choice_made` on `taken` or `double_crossed` (two mappings) | `ledger_view` variant; HaX's text |
| `afterwards_heard` | `false` | HaX `afterwards` knot | its hub copy for a player who closed it early |
| `torres_called` | `false` | Torres' call | his fallback timing |
| `reading_found` | `false` | `the_reading.onPickup` | HaX's "Do you want to tell me what it says?" |
| `gary_called` | `false` | Gary's call | the hub's keypad hint |
| `identity_scene_started`, `identity_scene_done` | `false` | first line; the answer | §4 rows 9–10 |
| `hour_read_started`, `hour_read_done` | `false` | first line; last line | rows 10–11 |
| `tesseract_call_started`, `tesseract_call_done` | `false` | first line; HaX's last line | row 12 |
| `alpha_clip_played` | `false` | the clip's ink | the decode's hub line |
| `tran_alerted`, `guard_called`, `old_coyote_rerouted` | `false` | Tran's `player_spotted` mapping; the guard's reveal; Old Coyote's override | the obstacle imports (stage 5 §3) |
| `salvage_keypad_seen`, `tape_room_entered` | `false` | HaX on `door_unlock_attempt` (salvage cage); `room_entered:tape_room` | hub topics 4–5 |
| `start_debrief`, `debrief_played`, `report_done` | `false` | HaX hub "[Bring me in.]"; debrief first line; debrief last line | debrief trigger; music and credits; reload backstop |
| hub retire flags (`series_topic_given`, `tran_topic_given`, `name_topic_given`, `nightshade_file_decided`, `reading_told_hax_asked`) | `false` | their hub knots | their own gates (stage 7 may fold some into ink-local `VAR`s if no other file reads them) |
| field-guide pairs | `false` | §7 | §7 |

**Where the mappings live.** HaX carries the bridges, the task completions, the clock, the purge rules and the forced scenes she hosts; the Recruiter carries her call, its re-rings and the double-cross text; Nightshade, Torres and Gary carry their own calls. All of them are listed in `loading_dock`'s `npcs`, so none of their mappings can be missed (lesson 43). Person NPCs carry only mappings on their own room (`room_entered:<own room>`) or their own KO.

**Reload backstops** (delayed mappings are not saved, README "delayMs"). Each timed rule has a second mapping on `room_entered` (any room, no suffix) with the same condition and no delay. The two that hold the critical path come first: HaX's flag-1 call (`flag1_submitted && !stacks_door_opened`, which re-opens the stacks door) and her ledger read (`flag2_submitted && !ledger_read_heard`, which the Recruiter's call waits on). Then: the call (`ledger_read_heard && cage_opened && !in_cage && !recruiter_call_started`), the invoice, the Beat 2.7 call, Torres' fallback, the clip hold, and the debrief (m05's room-entry backstop, `m05 scenario.json.erb:1553-1560`). The forced scenes also re-ring on `game_loaded` (§6).

## 6. The forced phone scenes

Stage 1 §11's rule, built with the F14 forced-call feature (`README_scenario_design.md` "Forced phone calls that ring again"; `docs/agents/FINALE_ENGINE_TRIAL_CALLS_CREDITS.md`): `disableClose: true` on every ring, `resume: true` where the scene has a choice, `cooldown: 0` on re-rings, and the trigger is the mapping's `eventPattern`. A forced call can only be closed by a hit or a reload. Re-rings fire on `room_exited` (any room: "when the player leaves the room") and on `game_loaded` (the trial's note that nothing re-rings on load by itself). Each scene's other speakers are lines prefixed with their registered display name (`Director Magnus Netherton:`, `Agent HaX:`), which the phone draws under that name (F14).

**Voicing.** Phone-chat text is not TTS-voiced (only `voice:` bubbles are, `phone-chat-ui.js:232-260`; `phone-chat-minigame.js:743`). These four scenes are therefore read, as m05's Recruiter call is. Stages 1–3 say "voiced" in the sense "said on the call, not in a later text"; that holds. If the user wants them spoken, §15 gives the two options.

### 6.1 The Recruiter's call (host `recruiter`)

| Point | Wiring |
|---|---|
| Ring | §4 row 3 (mappings a and b), plus the backstop on `room_entered`. |
| First line | `#set_global:recruiter_call_started:true`, `#set_global:recruiter_offer:refused`, `#set_global:deck_pulled:alpha_tapes`, `recruiter_secret` by branch (`kept` on sold-and-lied, `confessed` on sold-and-confessed, else left `""`), `#unlock_task:answer_the_offer`. |
| "[Give me the name. Let the deck go.]" | `recruiter_said_yes = true`, `recruiter_offer = taken`, `deck_pulled = none`. |
| Her naming line | `sleeper_named = true`, `recruiter_gone = true` (she hangs up after it). |
| "[No. Keep your name.]" / the hang-up | her last line (or none, on the hang-up) sets `recruiter_gone = true`; the hang-up form keeps `recruiter_offer = refused` and goes straight to HaX's tape choice. |
| Last choice | the legal pair (`taken`+`none`, `double_crossed`+`her_file`, `named`+`her_file`, `refused`+`alpha_tapes`), then `#set_global:deck_choice_made:true`, `#unlock_door:sorensen_office`, `#set_global:office_door_opened:true`, `#complete_task:answer_the_offer`, HaX's "She fired it from Peg's office. I'm on the door.", `#exit_conversation`. |
| Re-ring 1: before any answer | Recruiter, `room_exited` and `game_loaded`, condition `globalVars.recruiter_call_started && !globalVars.recruiter_said_yes && !globalVars.recruiter_gone && !globalVars.deck_choice_made`, `resume: true`. |
| Re-ring 2: between "yes" and the name | Recruiter, same events, `globalVars.recruiter_said_yes && !globalVars.sleeper_named && !globalVars.deck_choice_made`, no `resume`, `targetKnot: "resume_name"`: "You hung up on the part you paid for. Halina Kowalczyk." (sets `sleeper_named`, `recruiter_gone`), then HaX's leave-or-pull choice in the same thread. |
| Re-ring 3: after she has gone | **HaX**, same events, `globalVars.recruiter_gone && !globalVars.deck_choice_made`, no `resume`, `targetKnot: "deck_resume"`: "I've paused the deck. It won't hold long.", then the unanswered choice. The knot reads `recruiter_said_yes` to offer leave-or-pull, else her-file-or-tapes, and writes the same pair, done-flag and unlock tag as the Recruiter's knot (one shared ink include for the four outcomes). |

Re-rings 1–3 have disjoint conditions, so only one can fire for any state.

### 6.2 The identity scene (host `agent_0x99`, knot `identity_scene`)

| Point | Wiring |
|---|---|
| Ring | §4 row 9. `delayMs: 2500` so the station closes first. |
| First line | `#set_global:identity_scene_started:true`, `#unlock_task:hear_the_name`. HaX reads the credential's first line. |
| Netherton | prefixed lines in HaX's thread, from the aircraft's forward cabin (Beat 3.3). |
| The answer | three buttons by the m06 form (MC §3.4); each sets `hax_confession_answer`, then `#set_global:identity_scene_done:true`, `#complete_task:hear_the_name`. Her reply follows, then "Seven years, and nobody turned it off.", the Albion knot (§8) with `#unlock_task:send_the_notice`, `#exit_conversation`. |
| Re-ring | HaX, `room_exited`, `game_loaded` and `global_variable_changed:flag4_submitted`, condition `globalVars.identity_scene_started && !globalVars.identity_scene_done`, `resume: true`. |

Stage 3 lets the scene run on with the Albion papers after the answer. A close after the answer and before the Albion lines loses nothing: the notice and the papers stay in HaX's hub (§7), and the files are objects in the salvage cage.

### 6.3 Flag 4's read (host `agent_0x99`, knot `hour_read`)

| Point | Wiring |
|---|---|
| Ring | §4 row 10. |
| First line | `#set_global:hour_read_started:true`, `#unlock_task:hear_the_mirror_job`. |
| Body | the two modes, the D-02 line, the head start, the defences, the casualty sheet (and Kemal on `m06_minder_walked`). |
| The realisation | on `schedule_read`, a choice: "[Her schedule. This room isn't on it.]" / "[Read me the defences.]"; otherwise HaX's line from the job's side. |
| Last line | `#set_global:hour_read_done:true`, `#exit_conversation`. |
| Re-ring | HaX, `room_exited` and `game_loaded`, `globalVars.hour_read_started && !globalVars.hour_read_done`: with `globalVars.schedule_read` → `resume: true`; with `!globalVars.schedule_read` → no `resume`, `targetKnot: "hour_read"` (no choice, so it restarts, stage 1 §11). |

### 6.4 Tesseract's call to HaX (host `agent_0x99`, knot `tesseract_call`)

No choice, so it restarts from the top if closed. First line `#set_global:tesseract_call_started:true`; HaX's last line of her four-sentence report sets `tesseract_call_done`. Re-ring: HaX, `room_exited` and `game_loaded`, `globalVars.tesseract_call_started && !globalVars.tesseract_call_done`, `targetKnot: "tesseract_call"`, no `resume`. The narrator line ("A man's voice on her end, too low to make out.") needs a registered narrator display name to draw as its own bubble; stage 7 checks that or folds it into HaX's thread as an italic aside.

### 6.5 The debrief (hidden person NPC `closing_debrief`, in `loading_dock`)

Not a phone scene, but forced by the same rule. HaX's hub choice "[Bring me in.]" (gated `tesseract_call_done and not start_debrief`) sets `start_debrief`. `closing_debrief` opens on `global_variable_changed:start_debrief` (`value === true && !globalVars.debrief_played`), `conversationMode: "person-chat"`, `background` the hangar, `disableClose: true`. Its first line sets `debrief_played` and copies `albion_notified` to a temp. Reload backstop: `room_entered` (each room) with `globalVars.start_debrief && !globalVars.report_done`, re-emitting `start_debrief` (m05's pattern). The person-chat saves after each choice, so a reload mid-debrief resumes at the saved choice (stage 9 browser-checks it, MC engine item 40). `#complete_task:report_to_netherton` and `#set_global:report_done:true` are on the last line.

### 6.6 Calls that are not forced

| Call | Host | Trigger | Notes |
|---|---|---|---|
| HaX on flag 1 (`flag1_read`) | HaX | `flag1_submitted`, `delayMs: 2500` | opens the stacks door on its first line (§4 row 1); not forced, because the tag runs before any choice and the hub repeats it |
| HaX's ledger read (`ledger_read`) | HaX | `flag2_submitted`, `delayMs: 2500` | WREN on the raid team; "neither will you"; the m05 and m07 lines; the H&L file number; unlocks `cross_reference_wren` (mapping) |
| Nightshade (triple agent) | `nightshade_phone` | `flag1_submitted && m08_nightshade_triple_agent`, `delayMs: 7000` | rings after HaX's flag-1 call closes; HaX's "He's right. I hate that he's right." is prefixed in his thread |
| Beat 2.7 "Afterwards" | HaX | `room_exited` with `globalVars.deck_choice_made && !globalVars.afterwards_heard`, `delayMs: 2500`, `onceOnly` | the loss line, three words, one sentence, "The rest when this is over. Her office is past the binders." Closed early: a hub topic, once |
| Torres (turned) | `torres_phone` | at the H&L boxes: `object_interacted` with `data.objectName` the boxes' name `&& globalVars.flag2_submitted && globalVars.m05_torres_turned`; fallback: `room_exited` with `globalVars.deck_choice_made && globalVars.afterwards_heard && globalVars.m05_torres_turned && !globalVars.torres_called`, `delayMs: 6000` | after HaX's Beat 2.7, never before WREN exists (R3-10) |
| Gary (protected) | `gary_phone` | `door_unlock_attempt` with `data.connectedRoom === 'salvage_cage' && globalVars.m02_gary_protected`, `onceOnly` | the decode hint; sets `gary_called` |
| The double-cross text | `recruiter` | `room_entered:tape_room` with `globalVars.recruiter_offer === 'double_crossed'`, `onceOnly`, `sendTimedMessage` | unvoiced, as written |

## 7. HaX's support hub and the field guides

`support_hub` in `m09_phone_agent0x99.ink`, the m01/m02 pattern (`m02_phone_agent0x99.ink`): each topic gated on a progress global and retired with a `_given` / `_heard` guard, **topics that arrive later listed first** so the newest sit at the top, and no more than ten choices showable at once (lint `crowded-hub`). Every answer is the next step or a cost, said once.

### 7.1 Topics (in ink order, newest first)

| # | Player's line (draft) | Shows when | Retires on | What it gives |
|---|---|---|---|---|
| 1 | "[Bring me in.]" | `tesseract_call_done` | `start_debrief` | sets `start_debrief` (§6.5). Before it, one line on anything still open: the notice unsent ("The notice is still on his box. Netherton will ask."), the boxes unread, Tran |
| 2 | "[His notice. Send it.]" / "[Not yet.]" | `identity_scene_done and not albion_notified` | `albion_notified` | MC §3.5's archive send, moved here from the drop terminal so it works from the salvage cage (stage 5 verdict on engine item 28). HaX's two lines on send ("Gone." … the vendor; the watch) |
| 3 | "[About the name.]" | `identity_scene_done` | `name_topic_given` | "the name" (SE §4.4), once |
| 4 | "[The keypad on the cage.]" | `room_entered` salvage door seen (`salvage_keypad_seen`) and not salvage open | the door opening | where the code is ("The catalogue gave you a shelf code in their own scheme. The legend's on the reading room wall."); on `gary_called`, "Gary told you how." |
| 5 | "[The tape room.]" | `deck_choice_made and not tape_room_entered` | entering | "Her card for the tape room will be in the safe." |
| 6 | "[Her office door's still shut.]" | `deck_choice_made and not office_entered` | `office_entered` | re-issues `#unlock_door:sorensen_office` (§4 row 5 backstop) |
| 7 | "[Afterwards.]" | `deck_choice_made and not afterwards_heard` | `afterwards_heard` | Beat 2.7 for a player who closed the call |
| 8 | "[The Reading.]" | `reading_found and not reading_told_hax_asked` | answered | MC §4.6: "[All of it.]" / "[It's about me. It can stay that way.]" (`reading_told_hax`) |
| 9 | "[Her deck. What's on it?]" | `recruiter_call_started and not deck_choice_made` | `deck_choice_made` | only reachable after a reload between rings; the call re-rings anyway |
| 10 | "[WREN.]" | `ledger_read_heard and not sleeper_named` | `sleeper_named` or `sleeper_shortlist` | the cross-reference nudge: "H&L's boxes are in the open stacks. You've got the number." On `m05_torres_turned`, his line follows |
| 11 | "[Send Nightshade his file.]" / "[Hold it.]" | `m08_nightshade_triple_agent and nightshade_file_held and not nightshade_file_decided` | decided | MC §4.1, moved here from the drop terminal so it can be answered anywhere until the debrief |
| 12 | "[The hand on his file.]" | `nightshade_file_held and notebook_read and not hand_matched` | `hand_matched` | the correlation (`match_the_hand`): the player says the two hands match; "Those are my notes. That's his pen." / "Hold that." On `cage_bin == "derek_file"`, "Two samples. One pen." |
| 13 | "[The box behind her.]" | `cage_opened and not legacy_clock_run and not legacy_files_saved` | the clock or the save | what the legacy box is and when it goes (MC §4.3), once |
| 14 | "[Sorensen's mail.]" | `m03_victoria_fate == "recruited" and flag1_submitted and not cage_opened` | `cage_opened` | Victoria's route (§4 row 2b): "Victoria's people read their mail. There's a maintenance code for that gate." `#unlock_door:restricted_cage` |
| 15 | "[The restricted series.]" | `flag1_submitted and not series_topic_given` | given | the shelf marks; Sorensen behind the mesh; the reader on the gate takes her card, the cabinet takes a print. Backstop for the stacks door (§4 row 1) |
| 16 | "[Tran.]" | `not tran_topic_given` | given | the warning by m01 branch (Beat 1.1's three lines), then "He's wiping tapes from the server closet off the open stacks." |
| 17 | "[Where do I stand?]" | always | never | a status answer that branches on every stage of the ladder (§2), most advanced first: debrief ready, the read, the scene, the salvage cage, the tape room, the office, the call, the cage, flag 2, flag 1, inside, outside. The README warns this answer is the commonest stale line, so stage 7 writes one line per row |

Seventeen declared, but the gates leave at most about eight showing at any point (two to four story topics, "Where do I stand?", one or two guide offers). Stage 7 runs the lint.

### 7.2 Field guides (exposure-gated, on request)

Each guide is a `lab-workstation` in HaX's `itemsHeld`. An exposure mapping sets `<x>_guide_offered` and sends one text; the hub choice `{<x>_guide_offered and not <x>_guide_hint_given}` gives it with `#give_item:lab-workstation:<id>` (README "Field guides"). The lab sheet URLs wait for the VM plan and the lab-sheet stage (stage 0 §7 left both open).

| Guide | Offered on (exposure) | Covers |
|---|---|---|
| `m09_catalogue_field_guide` | `object_interacted` with `data.objectType === 'vm-launcher' && data.roomId === 'reading_room'` | flag 1 (the foothold) |
| `m09_ledger_field_guide` | `flag1_submitted` | flag 2 |
| `m09_tomb_beta_field_guide` | `room_entered:salvage_cage` | flags 3–4, including the leaver credential (M-05: "Seven years, and nobody turned it off.") |
| `m09_archive_code_guide` | `door_unlock_attempt` on the salvage cage, or reading `catalogue_view` after flag 1 | the archive encoding at the CyberChef workstation (game-side, no VM content) |

The kit guides from earlier missions (picks, cloner, print kit, cracker) are not reissued; HaX names the technique in a line where the player first needs it (the gate reader: "Her card's on a reel at her hip. You've done this before."; the cabinet: "That reader takes a print. She stamps everything.").

## 8. Optional objectives and finds

No separate optional objective. The prompt allows 0–3; m08 keeps its optional work inside the act aims, and that is better here because each optional thread belongs to a moment (MC §4). Five optional tasks sit in their act's aim: `meet_the_clerk` (aim 1), `stop_the_shredding` and `stop_the_tape_wipe` (aim 2), `cross_reference_wren` (aim 3), `send_the_notice` (aim 5). They raise the score (the formula counts every task, README "Score") and never hold an aim open.

**Finds with no task** (they are rewards for looking, and a task would spoil or nag):

| Find | Where | What reading it does |
|---|---|---|
| The master destruction schedule | `director_safe` | `schedule_read` (`onRead`): the realisation choice at flag 4 |
| The Reading, to its last page | `the_reading` | `reading_finished` (`onRead` on the last page) |
| The rent book, Danny's sheet, the refit ledger | Sorensen's office | Tier 2 lines (Irina, Danny, the ransom) |
| The printed ledger | the cage | Reeves' handler's sheet (on that branch); Noor's codename (for "[Show her the page.]") |
| The legacy box | the cage's feed table, or under Noor's desk | HaX: "Nobody of ours in here. Ours are on her tape, by codename." |
| Derek's file / the letters / Nightshade's copy | given at the hatch | the second sample; Villanueva; the Tran lever |
| Old Coyote's incident book | the dock's guard hut | a week of "shredder running, night" entries nobody read |
| The tagged payments | `case_file` (on `m06_monitoring_enabled`) | HaX's line; the bunker pointer on the no-coordinate branch |
| Tomb Beta's enrolment binders | salvage cage | the hand again (Beat 3.2) |
| The Albion catalogue entry, the memo, the unsent notice | salvage cage (objects that read as files off the box; their `textVariants` show the text once `flag3_submitted`) | the papers HaX reads from in the identity scene's Albion knot |
| The Alpha tapes' annotation sheets | tape room (on `deck_pulled == "alpha_tapes"`) | the decode: his first draft of the line (optional, after the clip) |

## 9. Conclusion, concludeRequires and credits

```json
"concludeRequires": {
  "tasksCompleted": ["submit_catalogue_flag", "submit_ledger_flag", "submit_owner_flag", "submit_control_flag"]
}
```

The four flags, the mandatory flag nodes the dungeon graph will show. Nothing else: the deck choice, the confession and the notice are forced by locks (§4) and the debrief's spine, and every export is written on every finished route (FA §6.1: `cage_bin` at `cage_opened`, `legacy_files_saved` at `cage_opened` or a knock-out, `albion_notified` by the debrief, the rest by forced scenes).

**Order of the end** (lesson 46): the debrief's last line completes `report_to_netherton` and sets `report_done`; the aim completes and the server concludes; the music event on `global_variable_changed:report_done` (`value === true`) plays `victory` with the closing card and credits below. The debrief's last image is Netherton capping the pen; the card follows it.

**Closing card** (at most five lines show; these are written so exactly five hold on every route; conditions are JavaScript, so `||` works here):

| # | Line | Condition |
|---|---|---|
| 1 | "The Architect: Dr Adrian Tesseract. Proved." | always |
| 2 | "The Publication: 06:00 UTC, day 13." | always |
| 3a | "WREN: Halina Kowalczyk. She doesn't know you know." | `recruiter_offer === 'taken'` |
| 3b | "WREN: Halina Kowalczyk. She walked off the apron at Helena." | `recruiter_offer === 'double_crossed'` |
| 3c | "WREN: one of two names on a dead firm's placing sheet." | `!sleeper_named && sleeper_shortlist` |
| 3d | "WREN: one of four. Going in with you." | `!sleeper_named && !sleeper_shortlist` |
| 4a | "His vendor notice: sent, nine years late." | `albion_notified` |
| 4b | "His vendor notice: still on his box." | `!albion_notified` |
| 5 | "The Montana order: signed." | always |

**Credits** (fixed strings; `section` blocks drop their heading when nothing under them prints; the people clauses run most specific first and end unconditional, so every person always has a line):

- `MISSION COMPLETE` (title); `DIGITAL ARCHAEOLOGY` (subtitle).
- **IN THIS OPERATION** (`people`):
  - AGENT HAX: "Told she should have said it. She agreed." (`hax_confession_answer === 'should_have_told'`) / "Given her own line back." (`=== 'afterwards'`) / "Thanked, once." (otherwise).
  - MARGARET SORENSEN: "Wrote down every box she destroyed." (`sorensen_fate === 'talked'`) / "Stopped at the shredder. A concussion and a lawyer." (`=== 'ko'`) / "Shredded until morning."
  - NOOR HADDAD: "Knocked down at her own desk." (`noor_ko`) / "A witness in Great Falls. Not allowed to ring her father." (`noor_told`) / "Went home and rang her father. Still on a list."
  - CODY OLD COYOTE: "Knocked down on his round." (`old_coyote_ko`) / "Sat out the night in his truck." (`old_coyote_told`) / "Walked the fence. Saw nothing."
  - JESSE TRAN: "Walked out and made a phone call." (`tran_outcome === 'talked'`) / "In custody. Asked for a phone charger." (`=== 'ko'`) / "Wiped the tape side and went home."
  - THE RECRUITER: "Sold you a name and booked the sale." (`taken`) / "Sold you a name, then warned it." (`double_crossed`) / "Wiped her own file. You kept a copy." (`named`) / "Kept her name. You kept his tapes." (`refused`).
- **WHAT THE PURGE TOOK** (`lines`): "Saved at the hatch: Derek Lawson's file." / "…the Social Fabric letters. Teresa Villanueva was warned." / "…what Nightshade cleared from his locker." (by `cage_bin`); "The deck: wiped, all of it." / "The deck: her file pulled, the rest wiped." / "The deck: Tomb Alpha's tapes pulled, the rest wiped." (by `deck_pulled`); "The legacy placement files: picked up." (`legacy_files_saved`); "The tape side: saved." (`tran_outcome !== 'left'`).
- **ELSEWHERE** (`lines`): "Albion's controller: a fix in ninety days for four hundred sites. The Critical Mass watch went dark." (`albion_notified`) / "Albion's controller: four hundred sites, still open. The watch stays on." (otherwise).

Every line says what happened and judges nothing, per stage 1 §7.2. Stage 7 owns the final wording; these are fixed strings with no printed variables, so they can be voiced or not. The debrief doesn't read the bin or the tape back (HaX named them in Beat 2.7); the credits list them once, which is the season's convention (m08's per-person lines).

## 10. Music cues

SE §6.2's table as `music.events` entries. No new track is assumed; the near-silence for Tesseract's call needs either a silent track asset or a long fade (milestone M-06 says no engine change is needed), and the user decides before a track is added (§15).

| Trigger | Condition | Playlist | Beat |
|---|---|---|---|
| `game_loaded` | `!globalVars.briefing_played` | `cutscene` | briefing |
| `game_loaded` | `globalVars.briefing_played && !globalVars.debrief_played` | `noir` | resume mid-night |
| `conversation_closed:briefing_cutscene` | – | `noir` (fade) | the dock |
| `npc_hostile_state_changed` | `isHostile === true` | `threat` | Tran, his guard, Sorensen if fought |
| `all_hostiles_ko` | – | `noir` | back to the search |
| `global_variable_changed:identity_scene_started` | `value === true` | `cutscene` | the held cue |
| `global_variable_changed:identity_scene_done` | `value === true` | `noir` | back to work |
| `global_variable_changed:tesseract_call_started` | `value === true` | near-silence (asset or fade, §15) | his call |
| `global_variable_changed:start_debrief` | `value === true` | `cutscene` | the hangar |
| `global_variable_changed:report_done` | `value === true` | `victory`, with the closing card and credits (§9) | the pen |

"`noir`, low" at the call, at Beat 2.7 and at flag 4 (SE §6.2) is a volume, and the music events take no volume key (`music/scenario-music-events.js` has none). Those three stay on plain `noir`, or use a quieter track if the user adds one; the scene's text carries the drop.

**Ambient sound.** The shredder is a room `ambientSound` on `restricted_stacks` and `restricted_cage`; the zone model plays it quietly through open doors into neighbouring rooms (`rooms.js:3041-3068`). A room's ambient sound is fixed: nothing switches it on a global, so the shredder can't fall silent when Sorensen is stopped. The narrator's line and HaX's carry the silence, as SE §6.1 allows. Making it stop is a small engine item for the user (§15), not a dependency.

## 11. Timing against 85 minutes

**Assumption, not a measurement:** each VM stage takes 7 minutes for a player following the field guide (stage 1 §2). No shipped mission records per-flag times, and M-14 (real times from m07/m08 play data or one timed VM run) is still open. When the times exist, only the VM rows below change.

| Part | Beats and tasks | In-game | VM | Minutes |
|---|---|---|---|---|
| Briefing | cutscene; the cracker | 4 | – | 4 |
| Act 1 | the dock and the route choice (`get_inside`) 2; Noor (`meet_the_clerk`, optional, budgeted) 3; the reading room and the laptop (`set_up_drop_terminal`) 3; flag 1 (`submit_catalogue_flag`) | 8 | 7 | 15 |
| Act 2 | the hatch: bluff, recognition, bins, clone, print (`talk_at_the_hatch`) 6; the gate and the box (`open_the_cage`) 2; the cabinet and the hand (`open_plan_cabinet`, `match_the_hand`) 3; flag 2 and HaX's read (`submit_ledger_flag`) 2 + VM; the call (`answer_the_offer`) 5; the boxes (optional) 4; Tran (optional) 1–3; Beat 2.7 1 | 24 | 7 | 31 |
| Act 3 | the office, the safe, the Reading, the deed (aim 4) 6; the tape room, the code, the salvage keypad (`enter_tape_room`, `open_salvage_cage`) 4; flag 3 and the identity scene (`submit_owner_flag`, `hear_the_name`) 3 + VM; the Albion papers and the notice 2; flag 4, the read and the call (`submit_control_flag`, `hear_the_mirror_job`) 2 + VM | 17 | 14 | 31 |
| Debrief | the hangar (`report_to_netherton`) | 4 | – | 4 |
| **Total** | | **57** | **28** | **85** |

Notes:

- Without the field guides, stage 0's estimate is 95–100: the VM column grows, nothing else does.
- **Walking.** Stage 5's layout keeps every critical walk to one or two doors: the reading room is beside the restricted stacks (the flag-2 walk-back is one door), and the office, the cage and the tape room all open off the restricted stacks, so Act 3 has no backtrack through the building. The one walk-back by design is the plan cabinet for a player who skipped it before flag 3 (the identity scene waits for the file).
- **Cut order if playtests run long** (stage 1 §2, unchanged): the cross-reference, Tran's closet, the Alpha decode. Nothing on the critical path.
- **If real VM times come in at 10 minutes a flag**, the total is about 97 with the guides. The cut order above recovers about 8 minutes; past that, the user decides between a longer published time and a lighter VM (stage 8).

## 12. Playtest routes and F15 starting states

The F15 bootstrap (FA §13 item 42) starts a run in a named room with a set of globals loaded. For m09 a segment start needs three things: the room, the globals, and the tasks already completed server-side (the flag tasks especially, or `concludeRequires` refuses the end). Stage 9 builds the seed files from these.

### 12.1 Segment starts

| Seg | Room | Globals set (beyond imports) | Tasks completed | Doors open |
|---|---|---|---|---|
| S0 | `loading_dock` | none (fresh game) | none | none |
| S1 | `reading_room` | `briefing_played`, `cracker_given` | `get_inside`, `set_up_drop_terminal` | dock doors |
| S2 | `restricted_stacks` | S1 + `flag1_submitted`, `stacks_door_opened` | S1 + `submit_catalogue_flag` | + `restricted_stacks` |
| S3 | `restricted_cage` (outside the cabinet) | S2 + `hatch_talked`, `bin_chosen`, `cage_bin` (route's value), `cage_opened`, `in_cage` | S2 + `enter_restricted_stacks`, `talk_at_the_hatch`, `open_the_cage` | + `restricted_cage` |
| S4 | `reading_room`, call due | S3 + `in_cage = false`, `nightshade_file_held`, `legacy_clock_run`, `flag2_submitted`, `ledger_read_heard` | S3 + `open_plan_cabinet`, `submit_ledger_flag` | – |
| S5 | `sorensen_office` | S4 + the route's deck pair, `recruiter_call_started`, `recruiter_gone`, `deck_choice_made`, `office_door_opened`, `afterwards_heard` | S4 + `answer_the_offer` | + `sorensen_office` |
| S6 | `salvage_cage` | S5 + `reading_found`, `tape_room_keycard` held, `flag3_submitted` (the scene then fires on load: tests the `game_loaded` ring) | S5 + aim 4's tasks, `enter_tape_room`, `open_salvage_cage`, `submit_owner_flag` | + `tape_room`, `salvage_cage` |
| S7 | `salvage_cage` | S6 + `identity_scene_done`, the answer, `flag4_submitted`, `hour_read_done`, `tesseract_call_done` | all of aim 5 | – |

### 12.2 Routes (covering set)

Twelve routes, then the three stage 3 named, then the reload set. Import profiles: **none** (cold start), **kind** (won branches), **hard** (lost branches), and per-route overrides. Each export value and each L+ form is hit at least once.

| # | Imports | From | Choices | Covers |
|---|---|---|---|---|
| R1 | none | S0 | shutter route past Old Coyote (sneak); Noor left; hatch, no bin pressed; Sorensen left; take the name, leave the deck; the Reading put down; confession "should have told"; notice held at the debrief; memo "yes"; Kowalczyk flat | cold-start path end to end; `cage_bin` default `derek_file`; `taken`+`none`; `sleeper_named`; the narrator line for flat on a named WREN; `albion_notified` false; never-played forms everywhere |
| R2 | kind: `m05_found_pipeline_list`, no deal; `m02_gary_protected`; `m03_victoria_fate = recruited`; `m06_architect_identity_found` + `m07_teacher_discussed`; `m07_architect_echo_heard`; `m08_nightshade_triple_agent`; `m06_monitoring_enabled` | S0 | Noor's card route; Victoria's code at the gate; "[Take Derek's file.]" at the door; send Nightshade his file; refuse, her file; read the Reading to the end and tell HaX; confession "same in your place"; notice sent in the archive; Sorensen talked | Noor warned in time (`legacy_files_saved` true via Noor); Victoria's route (§4 row 2b); Gary's hint; identity form "found, discussed" + echo line; Nightshade's call and `nightshade_shown_file`; `named`+`her_file`; `reading_finished`; `albion_notified` in the archive; `talked` |
| R3 | hard: `m05_recruiter_deal_accepted`, not confessed; `m01_maya_ko`; `m08_nightshade_ko_before_fate` (no coordinate); `m04_disclosure_choice = full`, `m04_crew_lost` | S0 | Old Coyote KO'd; Tran sees the player, guard called, Tran talked with the letters; the letters at the hatch; Sorensen KO'd before the clock; hang up on the Recruiter, the Alpha tapes; the clip and the decode; confession "afterwards"; notice held in the archive, sent at the debrief | sold-and-lied hang-up (`kept`); `refused`+`alpha_tapes`; `letters`; `legacy_files_saved` by KO; `ko`; Tran `talked`; maya_ko obstacles; no-coordinate lease line; the inquiry lines; the extra route "full with crew_lost, held then sent" |
| R4 | `m05_recruiter_deal_accepted`, not confessed | S5 → back to S4's call | deny, then take | `denied` then `taken` (extra route) |
| R5 | `m05_recruiter_deal_accepted`, not confessed | S4 | own it; say yes; **close the call between "yes" and the name** (a hit from Tran's guard, or a reload); then pull her file anyway | `told`; re-ring 2 (`resume_name`); `double_crossed`+`her_file`; the invoice line; the text at the tape room; Kowalczyk absent at the hangar and the `double_crossed` spine (extra route) |
| R6 | `m05_recruiter_deal_accepted` + `m05_recruiter_deal_confessed` | S4 | refuse, Alpha tapes | `confessed` opening; Noor's late warning (from S0 if run full) |
| R7 | `m08_nightshade_tidied`, `m08_nightshade_arrested` | S2 | "[Pull Nightshade's copy through.]" | `nightshade_copy`; the arrested wall card (briefing, from S0) |
| R8 | `m05_torres_turned`; `m06_architect_identity_found` without `m07_teacher_discussed` | S4 | read the H&L sheet; refuse, her file; briefing answer "back Quintero" (from S0) | `sleeper_shortlist`; Torres at the boxes; HaX's Quintero line; identity form "found, not discussed"; closing card line 3c |
| R9 | none, plus `m07_teacher_discussed` | S0 | Noor told (then "show her the page" variant on a second run from S4); Old Coyote told; Sorensen left; Tran left | `noor_told`; `old_coyote_told` (both leave, desks stay); identity form "not found, discussed" |
| R10 | `m03_directive_decoded`; `m05_final_choice = public_exposure` | S0 | knock out Noor, Old Coyote, Sorensen after the clock, Tran | `noor_ko` (card drops; debrief line); `sorensen_fate = ko` with `legacy_files_saved` false; `tran_outcome = ko`; recognition line by directive; the ledger's "blown" line |
| R11 | Tier 2 sweep: `m02_reeves_fate = arrested`; `m02_paid_ransom`; `m06_irina_recruited`; `m03_danny_fate`; `m04_voltage_captured`; `m06_minder_walked`; `m08_debrief_stance = owned` | S3 → S7 | read every office file and the printed ledger | the contact sheet; the refit, rent and Danny lines; Kemal at the sheet; Netherton's "owned" line; the printed ledger shredded once read (Sorensen free) |
| R12 | none | S0 (order tests) | submit flag 2 before the cage; open the cage, stay in it, then leave (the call must wait); submit flag 3 before opening the cabinet (HaX holds the name); submit flag 4 before the scene ends | §4 rows 3, 9 and 10; `in_cage`; the hold lines |

### 12.3 Reload in each forced scene

From the matching segment: reload once **inside** each scene before its done-flag, and check it re-rings on `game_loaded` at the right point. Recruiter before any answer (re-ring 1), between "yes" and the name (R5 covers it), after she has gone (re-ring 3, HaX's `deck_resume`); the identity scene before the answer; the read on `schedule_read` (resume) and without it (restart); Tesseract's call (restart); the debrief at the notice question. Also one reload with the call due but not yet rung (the room-entry backstop) and one with the invoice pending.

## 13. Objectives JSON sketch

Shipped form (m08). Stage 9 adds `_comment`s and the `puzzle_graph_*` keys; system names are placeholders (§1).

```json
"objectives": [
  { "aimId": "get_in", "title": "Get In And Set Up The Drop Terminal",
    "description": "Mountain States Records & Retention, after hours. Get inside, set the field laptop up in the reading room and open the archive's catalogue server. The shredder has been running since before you landed.",
    "status": "active", "order": 0,
    "tasks": [
      { "taskId": "get_inside", "title": "Get inside the archive", "type": "custom", "status": "active" },
      { "taskId": "meet_the_clerk", "title": "Talk to the clerk at the front desk", "type": "npc_conversation", "targetNPC": "noor_haddad", "status": "active", "optional": true },
      { "taskId": "set_up_drop_terminal", "title": "Set up the field laptop in the reading room", "type": "custom", "status": "active" },
      { "taskId": "submit_catalogue_flag", "title": "Get into the catalogue server and submit what it hides", "type": "submit_flags",
        "targetFlags": ["drop_terminal:catalogue_server-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" }
    ] },
  { "aimId": "restricted_series", "title": "Find The Restricted Series Before It Burns",
    "description": "The catalogue puts Series R behind the cage mesh in the restricted stacks, where the director is feeding a shredder from the clerk's trolleys. Get past her and into the cage before it's all ash.",
    "status": "locked", "order": 1, "unlockCondition": { "aimCompleted": "get_in" },
    "tasks": [
      { "taskId": "enter_restricted_stacks", "title": "Get into the restricted stacks", "type": "enter_room", "targetRoom": "restricted_stacks", "status": "active" },
      { "taskId": "talk_at_the_hatch", "title": "Talk to Sorensen at the cage hatch", "type": "custom", "status": "active" },
      { "taskId": "open_the_cage", "title": "Get through the cage gate", "type": "custom", "status": "active" },
      { "taskId": "open_plan_cabinet", "title": "Open the locked plan cabinet at the back of the cage", "type": "unlock_object", "targetObject": "plan_cabinet", "status": "active" },
      { "taskId": "match_the_hand", "title": "Compare the hand on the recruitment file with HaX's case file", "type": "custom", "status": "active" },
      { "taskId": "stop_the_shredding", "title": "Stop Sorensen's shredding", "type": "custom", "status": "locked", "optional": true },
      { "taskId": "stop_the_tape_wipe", "title": "Stop the tape wipe in the server closet", "type": "custom", "status": "active", "optional": true }
    ] },
  { "aimId": "read_the_ledger", "title": "Read The Initiative's Ledger",
    "description": "The catalogue server keeps the Insider Threat Initiative's ledger live: placements, candidates, and an older legacy section. Pull it, and find out what it says about the people you met this morning.",
    "status": "locked", "order": 2, "unlockCondition": { "aimCompleted": "get_in" },
    "tasks": [
      { "taskId": "submit_ledger_flag", "title": "Pull the Initiative's ledger off the catalogue server and submit it", "type": "submit_flags",
        "targetFlags": ["drop_terminal:catalogue_server-flag2"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "answer_the_offer", "title": "Answer the Recruiter's offer", "type": "custom", "status": "locked" },
      { "taskId": "cross_reference_wren", "title": "Find WREN's file among Harwick & Lowe's boxes in the open stacks", "type": "custom", "status": "locked", "optional": true }
    ] },
  { "aimId": "search_the_office", "title": "Search The Director's Office",
    "description": "The Recruiter fired the wipe from Sorensen's office, and HaX has the door. Search it. Whatever the night is protecting, she kept the keys to it.",
    "status": "locked", "order": 3, "unlockCondition": { "aimCompleted": "read_the_ledger" },
    "tasks": [
      { "taskId": "enter_office", "title": "Get into Sorensen's office", "type": "enter_room", "targetRoom": "sorensen_office", "status": "active" },
      { "taskId": "open_the_safe", "title": "Open Sorensen's safe", "type": "unlock_object", "targetObject": "director_safe", "status": "active" },
      { "taskId": "take_the_reading", "title": "Take the file Sorensen quoted from", "type": "collect_items", "targetItemIds": ["the_reading"], "targetCount": 1, "status": "active" },
      { "taskId": "take_tape_room_card", "title": "Take the tape room key card", "type": "collect_items", "targetItemIds": ["tape_room_keycard"], "targetCount": 1, "status": "active" },
      { "taskId": "find_the_deed", "title": "Find Tomb Gamma's deed and construction file", "type": "collect_items", "targetItemIds": ["lease_file"], "targetCount": 1, "status": "active" }
    ] },
  { "aimId": "take_tomb_beta", "title": "Take Tomb Beta's Server",
    "description": "Tomb Beta's last server is still running somewhere in the tape store, off the destruction schedule. Get to it, take it, and read what it's mirroring.",
    "status": "locked", "order": 4, "unlockCondition": { "aimCompleted": "read_the_ledger" },
    "tasks": [
      { "taskId": "enter_tape_room", "title": "Get into the tape room", "type": "enter_room", "targetRoom": "tape_room", "status": "active" },
      { "taskId": "open_salvage_cage", "title": "Open the salvage cage's keypad", "type": "unlock_room", "targetRoom": "salvage_cage", "status": "active" },
      { "taskId": "submit_owner_flag", "title": "Find out who owns Tomb Beta's server and submit it", "type": "submit_flags",
        "targetFlags": ["tomb_beta_station:tomb_beta_server-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "hear_the_name", "title": "Take the call with HaX and Netherton", "type": "custom", "status": "locked" },
      { "taskId": "submit_control_flag", "title": "Take full control of Tomb Beta's server and submit it", "type": "submit_flags",
        "targetFlags": ["tomb_beta_station:tomb_beta_server-flag2"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "hear_the_mirror_job", "title": "Hear what the server is mirroring to Tomb Gamma", "type": "custom", "status": "locked" },
      { "taskId": "send_the_notice", "title": "Decide whether to send his vendor notice", "type": "custom", "status": "locked", "optional": true }
    ] },
  { "aimId": "report_in", "title": "Report To Netherton",
    "description": "Task Force Null is on the ground at Helena's airfield. Netherton wants the night from you in person.",
    "status": "locked", "order": 5, "unlockCondition": { "aimCompleted": "take_tomb_beta" },
    "missionConclusion": true,
    "concludeRequires": { "tasksCompleted": ["submit_catalogue_flag", "submit_ledger_flag", "submit_owner_flag", "submit_control_flag"] },
    "conclusionScreen": { "type": "bond_visualiser" },
    "tasks": [
      { "taskId": "report_to_netherton", "title": "Report to Director Netherton at the airfield", "type": "custom", "status": "active" }
    ] }
]
```

Checks against the validator rules: every `submit_flags` has `targetFlags` and `targetCount`; every `collect_items` has `targetCount`; `targetRoom`/`targetObject`/`targetNPC` ids exist in stage 5; one `missionConclusion`; no import in an `unlockCondition`. The `locked` tasks are opened only by ink `#unlock_task` or a HaX mapping (§3), each named.

## 14. Proposed changes

Not made: FINALE_ARC, m10 and stages 0–3 are not this stage's to edit. Each change below is forced by the engine or by the layout, and none changes a choice, a cost or an export.

| # | Change | Why | Where |
|---|---|---|---|
| P1 | **Tomb Beta's server stands in the salvage cage**, off the tape room. The tape room door takes the key card from the safe; the salvage cage keypad takes the decoded catalogue code. Flags 3–4, the identity scene, flag 4's read and Tesseract's call all happen in the salvage cage. Gary rings at the salvage cage keypad. The Alpha-tapes deck stays in the tape room. | A door has one lock (`rooms[*].lockType`), and a flag station or VM launcher ignores an object lock (they are handled before the lock check, `interactions.js:918, 1051` vs `:1340`). The story's "card and code" needs two doors, and putting the server behind the code makes the decode required. | stage 1 Beats 3.2–3.6, §11 tables and §13 stage 5 notes; stage 0 §2.1, §2.3; FA §1.3, §1.4 ("Tomb Beta's last server racked in the tape room"), §6.1 header and flag 3–4 rows; SE §6.1 (the tape room's server fans) |
| P2 | **The card opens the cage gate; the print opens the plan cabinet.** Sorensen locked the Architect's chest under her own print, which is why her query reads "plan chest: not listed. Keep?" Victoria's maintenance code replaces the card (the gate) only. | One lock per door again; the cabinet is the natural second lock, and it puts the print kit inside the cage. | stage 1 Beat 2.1 step 1 and Beat 2.2; stage 0 §2.2 RFID and fingerprint rows; FA §6.1 item 1, row 32 |
| P3 | **Sorensen is two NPC records**: `sorensen_hatch` (behind the counter in the restricted stacks, `koImmune: true`, "behind the mesh") and `sorensen` (in the cage, at the shredder, can be knocked down). The first hides on `cage_opened`; the second shows on entering the cage unless `sorensen_ko`. | An NPC talks only to a player in its own room; the hatch scene needs her in the player's room before the cage opens. `koImmune` (F14) stops a knock-out through the mesh, which would drop her card where nobody can reach it. | stage 1 Beat 2.1 staging (S-09 settled); FA §13 item 31 |
| P4 | **The cage is its own room**, so HaX's clock line is "…or walk out of this cage", and the exit is `room_exited` from `restricted_cage`. | MC §4.3 left the choice to stage 5. | MC §4.3, §11 change 33; FA §6.1 item 1 |
| P5 | **Noor's card opens the staff door from the front desk into the reading room**, which keeps the player off Old Coyote's floor (the open stacks) for Act 1 and the cage. | A tree layout can't give the open stacks two doors from the front desk; the staff door gives the same help. | stage 1 Beat 1.2; stage 0 §2.2 social engineering row; FA row 62 wording if it names the side door |
| P6 | **Tran's radio sends Old Coyote to the reading room's door** (a patrol override in the open stacks), not on a pass through the reading room. | An NPC patrols its own room; a reading-room pass would need a second Old Coyote record. HaX's text says it: "Tran's just sent the guard to your door." | stage 1 Beat 1.1; FA §3.1 `m01_maya_ko` |
| P7 | **Flag 1's door opens by HaX's `#unlock_door`** on her flag-1 line ("I've got the stacks door off their own system."), not by a flag reward. | One reward per flag, and the reward's `unlock_door` opens the station's own room (§4; engine item for the user). | stage 1 Beat 1.4 and §11 row 1; FA §6.1 flag 1 row ("the reward opens…") |
| P8 | **The two "send" actions live in HaX's hub**, on the player's word: the vendor notice and Nightshade's file. The drop terminal's text points at HaX. | Answers MC engine item 28 with no engine work: the hub is reachable from every room until the debrief. HaX already pushes both through in the story. | stage 1 Beats 2.2, 3.4; MC §3.5, §4.1; FA §3.4 `nightshade_shown_file` and `albion_notified` "Set where" |
| P9 | **The tagged payments are a page of HaX's case file** (`textVariants` on `m06_monitoring_enabled`), not a separate object. | Objects can't appear or disappear on a global; a variant on a standing object can. | stage 1 Beat 1.3; FA §3.1 `m06_monitoring_enabled` |
| P10 | **The Harwick & Lowe box takes the file number on a keypad** (`password`), so it is "findable without the number and readable only with it". | A key lock would fall to the picks, a PIN to the cracker. | stage 1 §13 stage 5 note; Beat 2.5 |
| P11 | **Sorensen's office keypad takes a long code nobody has** (`password`), and HaX opens it on the deck. | A `pin` door would fall to Kowalczyk's cracker before the deck choice and break the order. | stage 1 Beat 3.1 "Getting in"; FA §6.1 "the night's order" |
| P12 | **Forced phone scenes are read, not heard**, unless the user asks otherwise (§15 item 1). | Phone-chat text isn't TTS-voiced. | stage 1 §11 rule; MC §3.2 "every cost is voiced" (meaning said on the call) |
| P13 | Stage 1 §11's engine list gains stage 5's verdicts and two findings: the flag-reward door bug, and that room ambient sound can't change on a global. | Verified in code. | stage 1 §11; FA §8 r22 |
| P14 | FA §5 cast and stage 2 §3: the second guard Tran calls in needs a name and a sprite key (cast diversity). | New presence on the `m01_maya_ko` branch. | SE §3; FA §5.2 |

## 15. Open questions and items for the user

**For the user**

1. **Should the four forced phone scenes be spoken?** Phone-chat text is not voiced, so as designed the Recruiter's call, the identity scene, flag 4's read and Tesseract's call are read (as m05's Recruiter call was). Two ways to voice them: (a) engine work so phone-chat lines play TTS per speaker (the per-speaker voice lookup already exists in person-chat, `person-chat-minigame.js:1420-1431`); or (b) run them as `video-call` mode, which voices every speaker today but has no `resume`, so the re-ring-and-resume rule would need building again there. Recommendation: (a), small and reusable for m10; until then, text.
2. **A near-silent track** for Tesseract's call (SE §6.2, FA §13 item 40). Without one, the call plays over `noir`.
3. **Engine items found** (none blocks m09; each has a scenario pattern in use):
   - **Bug: a flag reward's `unlock_door` opens the station's own room**, not `target_room` (`games_controller.rb` ~2166 merges the station's `room_id` over the reward; ~2233 reads it first). Likely affects any scenario using it (`secgen_vm_lab`). One-line fix; m09 doesn't depend on it.
   - Room ambient sound can't change on a global (`rooms.js:3041-3068`), so the shredder can't stop when Sorensen does. Optional.
   - Music events take no volume, so "`noir`, low" is a separate track or nothing. Optional.
   - Objects can't be shown or hidden on a global; the bins, the legacy box and the printed ledger use sprite and text variants instead. Optional.
4. **M-14:** real per-flag VM times, before stage 8 sets the published length (§11).

**For the orchestrator**

- The VM plan's `system_name`s replace `catalogue_server` and `tomb_beta_server`, and confirm each machine numbers its own flags from 1 (§1).
- The milestone review after stage 5 should take P1–P11 into stages 0–3 and FINALE_ARC together.
- Lab-sheet URLs for the four field guides wait for the VM plan and the lab-sheet stage (§7.2).

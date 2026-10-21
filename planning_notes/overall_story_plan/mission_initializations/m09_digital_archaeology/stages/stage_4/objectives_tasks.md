# m09 Digital Archaeology: Stage 4, player objectives

## 0. Status and inputs

Stage 4. Author: stages 4–5 author (Opus), 2026-10-21. Status: **stages 4–5 complete** (round 1–3 fixes folded in, §16–§18; reviews `../stage_5/REVIEW_R1_PUZZLES.md`, `../stage_5/REVIEW_R1_DESIGN.md`, `../stage_5/REVIEW_R2.md`, `../stage_5/REVIEW_R3.md`). Designed to the user's decisions of 2026-10-21, with the engine features committed in 57d3d237: **F17** forced phone calls can be voiced (`voiced: true`, `docs/agents/FINALE_ENGINE_VOICED_CALLS.md`): the Recruiter's call, the identity scene and Tesseract's call; **F20 (committed, 24fcb06c)** only the call is voiced: a voiced call voices its start knots (the `targetKnot` of each `voiced: true` mapping) and every knot they reach, never entering the contact's home knot (its scenario `currentKnot`, default `start`) (`docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8); **F18** the flag-reward `unlock_door` fix; **F19** `unlockDoor`, a mapping key that unlocks a door persistently (`docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md`); **F10** the `silence` playlist. Written with `../stage_5/room_layout.md` (the two documents share room, NPC, object and global ids; where a choice was a layout choice it is argued there).

Inputs: `../stage_0_initialization.md`; `../stage_1/story_arc.md` (beats cited as "Beat 2.4"; §11's locks table and forced-phone rule are binding); `../stage_2/storytelling_elements.md` ("SE"); `../stage_3/moral_choices.md` ("MC"; its §10 state table is the source for every story global); `../../finale/FINALE_ARC.md` ("FA") §1–9, §13, §17; `story_design/story_dev_prompts/04_player_objectives.md`; the `mission-alignment-plan`, `scenario-design-review` and `mission-puzzle-chains` skills; `README_scenario_design.md` (objectives, forced calls, closing card, authoring rules); `tools/pass2/PASS2_LESSONS.md`; shipped `m08_the_mole/scenario.json.erb` (aims, flag station, debrief), m05's Recruiter and debrief wiring; the engine (`systems/npc-manager.js`, `systems/apply-actions.js`, `minigames/helpers/chat-helpers.js`, `systems/unlock-system.js`, `app/models/break_escape/game.rb`). VM flags appear by story meaning only; no VM material was opened.

**What this stage decides** (each argued below):

1. Six aims. Aims 2 and 3 run side by side in Act 2 (the cage and the ledger), and so do aims 4 and 5 in Act 3 (the office and Tomb Beta's server), so the player always has an in-game step and a VM step on screen at once.
2. Every forced beat that would spoil itself as a task title (the Recruiter's call, the identity scene, the hour) is a task that ships `locked` and is unlocked by the scene's own first line, then completed by its done-flag.
3. The night's order (stage 1 §11) becomes thirteen concrete conditions (§4): station ownership, door locks the kit can't skip, three persistent F19 door unlocks on HaX's mappings, and mappings keyed on done-flags, each with a backstop: room entry for scenes, game load for door unlocks.
4. Two changes to earlier stages, both forced by the engine: Tomb Beta's server moves into the salvage cage (one lock per door), and the cage's print and card split between the cage gate (card) and the plan cabinet (print). §14 lists them.
5. Three forced phone scenes are voiced (F17); §6.7 lists their spoken lines for the audio budget.

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
- **New engine keys.** `voiced: true` (F17, `docs/agents/FINALE_ENGINE_VOICED_CALLS.md`) and `unlockDoor` (F19, `docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md`) are the committed names (57d3d237).
- **VM system names are placeholders.** `catalogue_server` (flags 1–2) and `tomb_beta_server` (flags 3–4) stand in for the SecGen `system_name`s the opus48 VM plan will choose. Assumption: each machine numbers its own flags from 1, so story flag 3 is `tomb_beta_server-flag1` and story flag 4 is `tomb_beta_server-flag2`. Stage 9 re-derives the mapping from the built XML.

## 2. The aim ladder

One objective, six aims. "On screen" is what the player sees the moment the aim unlocks.

| # | `aimId` | Title | Unlocks on | Act | On screen at unlock | Handoff line that announces it |
|---|---|---|---|---|---|---|
| 1 | `get_in` | Get In And Set Up The Drop Terminal | start (`active`) | 1 | get inside; set up the drop terminal; submit the catalogue flag; (optional) talk to the clerk | HaX at the dock: "That noise is a cross-cut shredder. It's been running since before you landed." |
| 2 | `restricted_series` | Find The Restricted Series Before It Burns | `aimCompleted: get_in` (flag 1) | 2 | get into the restricted stacks; talk to Sorensen at the cage hatch; get through the cage gate; open the plan cabinet; compare the hand on Nightshade's file with HaX's notebook scan; (optional) stop the tape wipe | HaX on flag 1: the shelf marks are behind the cage mesh, "the boxes on Noor's trolleys are the ones on this list", and "The ledger keeps. Her shredder doesn't. Stacks first." |
| 3 | `read_the_ledger` | Read The Initiative's Ledger | `aimCompleted: get_in` (flag 1) | 2 | submit the ledger flag (the rest arrive `locked`) | the same HaX line, second sentence: "The catalogue keeps something else live. Their ledger." |
| 4 | `search_the_office` | Search The Director's Office | `aimCompleted: read_the_ledger` (the deck choice) | 3 | get into Sorensen's office; open her safe; take the file she quoted from; take the tape room key card; find Tomb Gamma's deed | the deck call's last lines: "She fired it from Peg's office. I'm on the door." |
| 5 | `take_tomb_beta` | Take Tomb Beta's Server | `aimCompleted: read_the_ledger` | 3 | get into the tape room; open the salvage cage; submit the owner flag; submit the control flag (two reveal tasks arrive `locked`) | the same call: "Her card for the tape room will be in that office." |
| 6 | `report_in` | Report To Netherton | `aimCompleted: take_tomb_beta` (Tesseract's call over) | debrief | report to Netherton | HaX's report of Tesseract's call ends: "Netherton's on the ground at Helena. Tell me when you're ready to come in." |

**Why two pairs run side by side.** Act 2 is the cage (in-game) and the ledger (VM flag 2) in either order; stage 1 lets flag 2 come before or after the cage (Beat 2.4), so one aim for each means neither looks finished while the other is pending. Act 3 is the office and the server: showing aim 5 with aim 4 tells the player at once that the tape room needs something from the office, which is the next step's reason. The pairing also keeps a VM task and an in-game task on screen through most of the night, which is the hybrid rhythm m02 and m08 aim for.

**Dead-zone check** (scenario-design-review §2g):

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Transition narrated |
|---|---|---|---|---|
| 1 | 3 | 3 (HaX at the dock names the dock doors and the reading room) | low: the shredder and HaX point inward | HaX on flag 1 (Beat 1.4) |
| 2 | 5 | 5 (flag 1's shelf marks; Sorensen in view behind the mesh; HaX names the reader and the cabinet; HaX's text on picking up the file says what to compare and where) | the hand: if never compared, the identity scene closes it, so it can't hang open past flag 3 (review D-02) | the recognition and HaX's clock line at the gate |
| 3 | 2 visible after the call starts | 2 | between flag 2 and the call when the cage is still shut: aim 2's tasks are still open, so the next step is on screen | the Recruiter's call is the transition |
| 4 | 5 | 5 (HaX on the door; the safe in view; the safe holds the card and the file) | none | HaX's line on the deck |
| 5 | 4 visible, 2 more arrive with their scenes | 4 (the card's label names the tape room; the coded salvage line is in the notepad since Act 1; the shelf-code legend hangs in the tape room beside the keypad; Gary's hint on that branch) | low: the code and its key are both at hand in the tape room (review D-03) | the identity scene, the read, Tesseract's call |
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
| `submit_catalogue_flag` | Get into the catalogue server and submit the flag | VM flag 1 | `submit_flags`, active; `targetFlags: ["drop_terminal:catalogue_server-flag1"]`, `targetCount: 1` | the drop terminal | flag reward `set_global flag1_submitted`; HaX's `unlockDoor` on the restricted stacks (§4 row 1); aims 2 and 3 |

Aim 1 completes on its three required tasks. `get_inside` and `set_up_drop_terminal` are both done long before flag 1 on every route, so the aim closes on the flag.

### 3.2 Aim 2 `restricted_series`: Find The Restricted Series Before It Burns (Act 2)

Description: "The catalogue puts Series R behind the cage mesh in the restricted stacks, where the director is feeding a shredder from the clerk's trolleys. Get past her and into the cage before it's all ash."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `enter_restricted_stacks` | Get into the restricted stacks | in-game | `enter_room` `restricted_stacks`, active | entering (the door opens on flag 1's reward) | Sorensen at the hatch in view |
| `talk_at_the_hatch` | Talk to Sorensen at the cage hatch | in-game, social | `custom`, active | two mappings on HaX: `global_variable_changed:hatch_talked` (set at the top of her hatch knot) and `global_variable_changed:cage_opened` (Victoria's route skips the hatch) | the bluff, the recognition, the bin choice, the card clone, the stamp in reach |
| `open_the_cage` | Get through the cage gate | in-game, RFID | `custom`, active | HaX mapping on `global_variable_changed:cage_opened` | `cage_opened`: the purge's first event (§4 row 2) |
| `open_plan_cabinet` | Open the locked plan cabinet at the back of the cage | in-game, fingerprint | `unlock_object` `plan_cabinet`, active | the biometric unlock (Sorensen's print, lifted off the stamp) | Nightshade's recruitment file in reach |
| `match_the_hand` | Compare the hand on Nightshade's file with the notebook scan in HaX's case file | correlation | `custom`, active | `#complete_task:match_the_hand` in HaX's hub knot `the_hand` (§7.1) when the player answers "[Same hand.]"; or, for a player who never did, in the identity scene (§6.2), so it can't hang open past flag 3 | `hand_matched`; HaX: "Those are my notes. That's his pen." then "Hold that." |
| `stop_the_shredding` | Stop Sorensen's shredding | in-game, choice | `custom`, **optional**, `locked` | unlocked by HaX's mapping on `cage_opened`; completed by two mappings: `global_variable_changed:sorensen_fate` with `value === 'ko'`, and with `value === 'talked'` | `legacy_files_saved` (on a knock-out before the clock), or her written account |
| `stop_the_tape_wipe` | Stop the tape wipe in the server closet | in-game, choice | `custom`, **optional**, active | brief-gated pair on HaX (m08 pattern), so an Act 1 visit to Tran can't reveal aim 2 early: `global_variable_changed:tran_outcome` with `value !== 'left' && globalVars.flag1_submitted`, and `global_variable_changed:flag1_submitted` with `globalVars.tran_outcome !== 'left'` (Tran's default is `left`) | the tape side saved; Tran talked or held |

Aim 2 completes on its five required tasks. `match_the_hand` is the one with no lock behind it. Three things keep it from becoming a stall (review D-02): HaX texts on picking up the file ("Hold his file next to the notebook scan in my case file. Then tell me what you see."), the hub topic shows on the file alone and sends the player to the scan if they haven't read it, and the answer is an honest choice: "[Same hand.]" completes it; "[Different hands.]" gets "Look at the loop on the g. Then look again."; "[I can't tell.]" gets "Put the scan beside it. Same pen pressure, same crossed sevens." Neither wrong answer costs anything but a line. A player who never answers has it closed inside the identity scene, where HaX says it for them.

### 3.3 Aim 3 `read_the_ledger`: Read The Initiative's Ledger (Act 2)

Description: "The catalogue server keeps the Insider Threat Initiative's ledger live: placements, candidates, and an older legacy section. Pull it, and see who's still on their books."

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
| `enter_office` | Get into Sorensen's office | in-game | `enter_room` `sorensen_office`, active | entering (HaX's `unlockDoor` on the deck choice, §4 row 5) | – |
| `open_the_safe` | Open Sorensen's safe | in-game, PIN cracker | `unlock_object` `director_safe`, active | the PIN unlock, `060216` (Kowalczyk's cracker, or the rent ledger's header "Lease start: 06/02/16", digits as printed; P16, stage 6 §3.2) | the Reading, the master schedule, the tape room card in reach |
| `take_the_reading` | Take the file Sorensen quoted from | in-game | `collect_items`, `targetItemIds: ["the_reading"]`, `targetCount: 1`, active | the pickup | `reading_found` (its `onPickup`). The last page is a separate notes object in the safe, `the_reading_last_page`, whose `onRead` sets `reading_finished`; two objects because `onRead` shadows `onPickup` on one (`container-minigame.js:484`, review m1). Entries 2–4 are three more notes objects in the safe, `the_reading_2`, `the_reading_3`, `the_reading_4` (stage 6 C-08: one variant list returns one string); no task targets them |
| `take_tape_room_card` | Take the tape room key card | in-game | `collect_items`, `targetItemIds: ["tape_room_keycard"]`, `targetCount: 1`, active | the pickup | opens `tape_room` |
| `find_the_deed` | Find Tomb Gamma's deed and construction file | in-game | `collect_items`, `targetItemIds: ["lease_file"]`, `targetCount: 1`, active | the pickup | the paper half of the defences; the no-coordinate line (FA §3.1) |

The title for the Reading is earned: by aim 4 every player has heard Sorensen quote their file ("You're the one he writes about.", Beat 2.1). The master schedule, the rent ledger, Danny's note and the build-out ledger are finds with no task (§8).

### 3.5 Aim 5 `take_tomb_beta`: Take Tomb Beta's Server (Act 3)

Description: "Tomb Beta's last server is still running somewhere in the tape store, off the destruction schedule. Get to it, take it, and read what it's mirroring."

| `taskId` | Title | Kind | Type / status | Completes on | Feeds |
|---|---|---|---|---|---|
| `enter_tape_room` | Get into the tape room | in-game, RFID | `enter_room` `tape_room`, active | entering (the key card from the safe) | the Alpha-tapes deck (on that route); the double-cross text (on that route) |
| `open_salvage_cage` | Get through the salvage cage keypad | in-game, decode | `unlock_room` `salvage_cage`, active | `door_unlocked` with `connectedRoom: salvage_cage` (objectives-manager's `unlock_room` path) | Tomb Beta's server, its station and the field kit link |
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

Stage 1 §11's locks table, row by row, as the build will hold it. "HaX" means a mapping on `agent_0x99` (start room, always loaded). Engine facts behind it (checked in code, confirmed by round 1's reviewer):

- **A flag carries exactly one reward** (`flagRewards` index-parallel to `flags`, `games_controller.rb:2160-2167`), so each flag sets one global and nothing else.
- **Doors open on HaX's mappings with F19's `unlockDoor`** (`docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md`), which unlocks persistently and emits `door_unlocked_by_npc`. Before F19 the only way was HaX's ink `#unlock_door` (fire and forget, refused by the server unless HaX is `unlockable` and met, `game.rb:1246-1270`), and a flag reward's `unlock_door` opened the station's own room (being fixed as F18). With F19 a door no longer depends on a conversation opening, so the hub backstops for doors are gone (review M3).
- **Every backstop retires on the thing it protects having happened** (entering the room, the scene starting), never on a tag having run (review M3).

| # | Step | Held by | Concrete condition |
|---|---|---|---|
| 1 | flag 1 → the cage | the restricted stacks' outer door | `restricted_stacks`: `locked: true`, `lockType: "rfid"`, `requires: "stacks_release"` (no card in the world has that id). HaX on `global_variable_changed:flag1_submitted` (`value === true`): `unlockDoor: "restricted_stacks"`. **Retry in session:** HaX on `door_unlock_attempt` with `data.connectedRoom === 'restricted_stacks' && globalVars.flag1_submitted` → the same `unlockDoor` (a failed request is only logged, so the next try at the door re-issues it). **After a reload:** `game_loaded` with `globalVars.flag1_submitted && !globalVars.stacks_entered` → the same. Both cover a failed unlock request; neither can recover `flag1_submitted` itself if a crash lost it before the next sync (§15 item 2). `stacks_entered` is set by HaX on `room_entered:restricted_stacks`. HaX's knot `flag1_read` still opens on the flag (`delayMs: 2500`) for the story, and ends by logging the coded salvage line (row 7). |
| 2 | the cage gate | Sorensen's stacks card | `restricted_cage`: `lockType: "rfid"`, `requires: "stacks_card"`; `sorensen_hatch.rfidCard.card_id: "stacks_card"`, cloned by `#clone_keycard:stacks_card`, offered on **every** branch of her hatch knot and as a repeatable choice in its hub (review B1; m08's technique). `cage_opened` is set by HaX on `door_unlocked` with `data.connectedRoom === 'restricted_cage' && !globalVars.cage_opened` (the guard stops a second emit from replaying the `cage_opened` chain; milestone F-14). |
| 2b | the cage gate, Victoria's route | the maintenance code from Sorensen's mail | HaX hub topic gated `{m03_victoria_fate == "recruited" and stacks_entered and not cage_opened}` sets `maintenance_code_used`. HaX on `global_variable_changed:maintenance_code_used`: `unlockDoor: "restricted_cage"` only. `cage_opened` is set by HaX on `door_unlocked_by_npc` with `data.roomId === 'restricted_cage'` (what `unlockDoor` emits, `npc-game-bridge.js:137-141`), so it follows the door, not the request (review M-R2-1). Retry: `door_unlock_attempt` with `data.connectedRoom === 'restricted_cage' && globalVars.maintenance_code_used && !globalVars.cage_opened`, and `game_loaded` with `globalVars.maintenance_code_used && !globalVars.cage_opened` → the same `unlockDoor`. The topic retires on `cage_opened`, so it comes back if the unlock failed. |
| 2c | the plan cabinet | Sorensen's print | `plan_cabinet`: `lockType: "biometric"`, `requires: "Margaret Sorensen"`, `biometricMatchThreshold: 0.5` (a number, review m3); `sorensen_stamp` on the hatch shelf has `hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`, `fingerprintDifficulty: "medium"`. |
| 3 | the cage → the call | the ledger read **and** the opened cage, outside it | Recruiter mappings, each `conversationMode: "phone-chat"`, `targetKnot: "call"`, `disableClose: true`, `voiced: true`, `onceOnly: true`: (a) `room_exited` with `data.roomId === 'restricted_cage' && globalVars.ledger_read_heard && globalVars.cage_opened && !globalVars.in_cage && !globalVars.recruiter_call_started`, `delayMs: 3000`; the `!in_cage` term is back (review N-R3-2: without it, out and back in within 3 s rang the call inside the cage), and because a delayed mapping re-checks its condition when the delay ends, a player who steps back in cancels it; (b) `global_variable_changed:ledger_read_heard` with `value === true && globalVars.cage_opened && !globalVars.in_cage && !globalVars.recruiter_call_started`, `delayMs: 3000`; (c) backstop on `room_entered` (any room) with `data.roomId !== 'restricted_cage'` plus (b)'s globals, no delay (review M1). Keying on `ledger_read_heard` means the call can't ring before the ledger is read, and it rings as HaX's read closes (`npc-manager.js:598-628`). `in_cage`: set by two mappings **on `recruiter` itself, listed in her `eventMappings` before (a)**: true on `room_entered:restricted_cage`, false on `room_exited` with `data.roomId === 'restricted_cage'`, both with **`cooldown: 0`** (review M-R2-2). One NPC's mappings for an event run in list order, so the clearing setter always runs before (a) reads `!in_cage` (review N-R3-2; chosen over relying on the order of `agent_0x99` and `recruiter` in the dock's NPC list, which the engine doesn't promise). HaX's `game_loaded` mapping still clears it after a reload (review M2). |
| 4 | the call → the deck choice | the call's first line and done-flag | first line: `#set_global:recruiter_call_started:true`, `recruiter_offer = refused`, `deck_pulled = alpha_tapes`, `recruiter_secret` by branch, `#unlock_task:answer_the_offer`. Last choice: the legal pair, `#set_global:deck_choice_made:true`, `#complete_task:answer_the_offer`. Re-ring and resume: §6.1. |
| 5 | the deck → the office | the office door | `sorensen_office`: `lockType: "password"`, `requires` a long code that appears nowhere (the PIN cracker works only on `pin` locks). HaX on `global_variable_changed:deck_choice_made` (`value === true`): `unlockDoor: "sorensen_office"`. Retry in session: `door_unlock_attempt` with `data.connectedRoom === 'sorensen_office' && globalVars.deck_choice_made`; after a reload: `game_loaded` with `globalVars.deck_choice_made && !globalVars.office_entered`. In the story HaX says it on the call's last lines: "She fired it from Peg's office. I'm on the door." |
| 6 | the office → the tape room | the key card in the safe | `tape_room`: `lockType: "rfid"`, `requires: "tape_room_reader"`; the only card with that id is `tape_room_keycard` in `director_safe` (`lockType: "pin"`). |
| 7 | the tape room → Tomb Beta's server | the salvage cage keypad | `salvage_cage`: `lockType: "password"`, `requires` the decoded catalogue code. **The coded line reaches every player** (review B-R2-1): HaX's `flag1_read` ends with `#give_item:notes:catalogue_salvage_line` from HaX's `itemsHeld` (a `notes` item, `name: "Catalogue: salvage cage"`, its `text` the coded line as a fixed string; a notes item an NPC gives reaches the notepad, PASS2 lesson 4) and her line "I've sent you the odd one. Salvage cage, their own code." (not `#add_note`, which has an engine bug in `NPCGameBridge.addNote`; review N-R3-1); every variant of the drop terminal's screen from flag 1 on repeats the line; HaX's keypad topic quotes it. The key to decode it is the shelf-code legend beside the keypad in the tape room. **Settled at stage 6** (§2): the item's text is two lines, "SALVAGE CAGE ACCESS" and `MSJMQAEGDZNVI`, label and code apart (C-01); `Vigenère Decode` of the second line only, key `BONEYARD` (the legend's Salvage row, bay 12), gives `LEWISANDCLARK`; `salvage_cage` `requires: "LEWISANDCLARK"`. No banned character (`|`, `#`, `//`, `{`, `}`, `->`, `<-`, `<>`, `~`, `[`, `]`, `\`, `"`, `<%`; no leading `*`, `-`, `+`, `=`). |
| 8 | flags 3–4 only beside the server | station `acceptsVms` | `drop_terminal.acceptsVms: ["catalogue_server"]`; `tomb_beta_station.acceptsVms: ["tomb_beta_server"]`, inside `salvage_cage`; a flag typed at the wrong station is refused by ownership (`games_controller.rb:1203-1216`). |
| 9 | flag 3 → the identity scene | flag 3 **and** the file | HaX: `global_variable_changed:flag3_submitted` with `value === true && globalVars.nightshade_file_held`, `delayMs: 2500` → forced call `identity_scene` (§6.2); with `value === true && !globalVars.nightshade_file_held` → text "Bring me his file. Then we say it."; `global_variable_changed:nightshade_file_held` with `value === true && globalVars.flag3_submitted && !globalVars.identity_scene_started`, `delayMs: 1500` → the forced call. **First-ring backstop** (review B3) on `room_entered` only (it fires on load too, after `game_loaded`; one event avoids a double open, review m-R2-1): `globalVars.flag3_submitted && globalVars.nightshade_file_held && !globalVars.identity_scene_started`. |
| 10 | the scene → flag 4's read | `identity_scene_done` | HaX: `global_variable_changed:flag4_submitted` with `value === true && globalVars.identity_scene_done`, `delayMs: 1500` → forced call `hour_read`; `global_variable_changed:identity_scene_done` with `value === true && globalVars.flag4_submitted`, `delayMs: 3000` → the same; `flag4_submitted` with `!globalVars.identity_scene_started && !globalVars.nightshade_file_held` → text "His file first. Then the rest of his box."; with `!globalVars.identity_scene_started && globalVars.nightshade_file_held && !globalVars.flag3_submitted` → a text asking for the owner first (stage 7 words it; stage 1's "Finish with me first. Then his box." is cut, because a started scene re-rings instead, milestone M9-15); with `globalVars.identity_scene_started && !globalVars.identity_scene_done`, `delayMs: 1500` → re-ring the identity scene at its guarded knot `identity_resume` (§6.2). **First-ring backstop** on `room_entered`: `globalVars.flag4_submitted && globalVars.identity_scene_done && !globalVars.hour_read_started`. |
| 11 | the read → Tesseract's call | `hour_read_done` | HaX: `global_variable_changed:hour_read_done` (`value === true`, `delayMs: 4000`) → forced call `tesseract_call`. **First-ring backstop** on `room_entered`: `globalVars.hour_read_done && !globalVars.tesseract_call_started`. |
| 12 | the call → the conclusion | `tesseract_call_done` | HaX: `global_variable_changed:tesseract_call_done` → `completeTask: "hear_the_mirror_job"`; aim 6 unlocks on aim 5. |
| 13 | the notice → the pen | the debrief's spine | debrief ink: the archive branch reads `debrief_notice_before` (copied from `albion_notified` in HaX's "[Bring me in.]" knot, never on the debrief's first line, §6.5); the stance; the notice question if unsent; the hub; the spine; `#complete_task:report_to_netherton` and `report_done` on the last line. Trigger and backstop key on `!report_done` (§6.5, review B2). |

**The purge's three timed rules** (FA §6.1), as conditions:

| Rule | Condition |
|---|---|
| The other bin goes when the cage opens | `cage_bin` default: HaX on `global_variable_changed:cage_opened` with `!globalVars.bin_chosen` → `setGlobal: { "cage_bin": "derek_file" }`. The bin choice sets `bin_chosen`. On Victoria's route the choice comes at the cage door just after, from a hidden `koImmune` record that holds the files (stage 5 §3.7, review M5), and overwrites. Both bins' `spriteVariants` follow `cage_bin`. |
| The legacy box goes at the first of Nightshade's file picked up from the plan cabinet (`nightshade_file_held`) or the first exit | `legacy_clock_run`: HaX on `global_variable_changed:nightshade_file_held` with `globalVars.cage_opened && !globalVars.legacy_clock_run`, and on `room_exited` with `data.roomId === 'restricted_cage' && globalVars.cage_opened && !globalVars.legacy_clock_run`. Saved by a knock-out first: HaX on `npc_ko:sorensen` with `!globalVars.legacy_clock_run` → `legacy_files_saved: true`. Held back by Noor: HaX on `global_variable_changed:cage_opened` with `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → `legacy_files_saved: true`. |
| The printed ledger goes once read, if Sorensen is free | `printed_ledger.onRead` sets `printed_ledger_read`; HaX sets `ledger_page_seen` on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted` (`delayMs: 500`), so only a read after flag 2 counts (the binder's `onRead` fires on the enciphered pre-flag-2 read too; stage 6 C-06); its `textVariants` show the shredded strip ("ACEMENTS 23. CANDIDA") on `globalVars.ledger_page_seen && globalVars.sorensen_fate === 'left'` (the flag holds the content, so nothing is lost). |

**The purge made visible** (review D-04; changes no outcome). The clock stays event-driven, but the building shows it moving:
- the front desk's trolleys and `trolley_list` empty in three steps (`spriteVariants`/`textVariants` on `flag1_submitted`, `flag2_submitted`, `cage_opened`);
- Sorensen's stamp on the hatch shelf carries an `observationVariants` line on `flag2_submitted && !cage_opened`: "Her stamp's warm. She's three boxes from the bins." (on the stamp, because the bins are out of reach behind her, review m-R2-4);
- HaX's `flag1_read` sets the order without forcing it: "The ledger keeps. Her shredder doesn't. Stacks first.";
- HaX's text, once, on `room_entered` with `globalVars.flag2_submitted && !globalVars.hatch_talked`: "She's still feeding it."

## 5. Globals and event wiring

Every global below goes in `globalVariables` with the default shown and is `VAR`-declared in each ink that reads it. The story globals (exports and locals) are MC §10's, unchanged; this section adds the machinery.

**Exports** (MC §10; the stage 9 `exportGlobals` list): `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, `cage_bin`, `legacy_files_saved`.

**Story locals** (MC §10): `raid_team_answer`, `noor_told`, `noor_ko`, `old_coyote_told`, `old_coyote_ko`, `sorensen_fate` (default `"left"`), `tran_outcome` (default `"left"`), `reading_told_hax`, `memo_stance`, `kowalczyk_reply`, `schedule_read`.

**New at this stage**

| Global | Default | Set by | Read by |
|---|---|---|---|
| `briefing_played` | `false` | briefing first line (`setGlobalOnStart`) | `skipIfGlobal`; music |
| `flag1_submitted` … `flag4_submitted` | `false` | each station's `flagRewards` (`set_global`, one per flag) | everything in §4 |
| `stacks_entered` | `false` | HaX on `room_entered:restricted_stacks` | the stacks door's load backstop; Victoria's topic; hub topics |
| `hatch_talked` | `false` | top of Sorensen's hatch knot | `talk_at_the_hatch`; the door scene on Victoria's route |
| `bin_chosen` | `false` | the bin buttons (hatch or door) | the `cage_bin` default |
| `maintenance_code_used` | `false` | HaX's Victoria topic | the gate's `unlockDoor` and its retries |
| `debrief_notice_before` | `false` | HaX's "[Bring me in.]" knot copies `albion_notified` into it before setting `start_debrief`, and never again | the debrief's "sent in the archive" branch, stable across a replay (review m-R2-2) |
| `cage_opened` | `false` | HaX on the gate's unlock (§4 rows 2, 2b), and on `room_entered:restricted_cage` with `!globalVars.cage_opened` (being in the cage proves the gate is open; rebuilds it if a crash lost the client global, review m-R3-3) | call, clock, Sorensen's swap, bins, tasks |
| `in_cage` | `false` | `recruiter`: two mappings (true on `room_entered:restricted_cage`, false on `room_exited` from it), listed in her `eventMappings` before ring (a), both `cooldown: 0` (§4 row 3); HaX clears it on `game_loaded` | the call's mappings (a), (b) and (c) |
| `nightshade_file_held` | `false` | `onPickup` on `nightshade_file` | the clock; the hand; the talk lever; the identity scene |
| `notebook_read` | `false` | `onRead` on `notebook_scan` | the hand topic's reply |
| `hand_matched` | `false` | HaX `the_hand` knot, or the identity scene | the scene's "two directions" line |
| `legacy_clock_run` | `false` | §4 purge table | `legacy_files_saved`; `feed_table_box` variants; HaX's "She's done with that box." |
| `sorensen_ko` | `false` | `globalVarOnKO` on `sorensen` | her cage-room visibility; the debrief |
| `printed_ledger_read` | `false` | `printed_ledger.onRead` | HaX's `ledger_page_seen` mapping only (stage 6 C-06) |
| `ledger_page_seen` | `false` | HaX, `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted`, `delayMs: 500` (stage 6 §3.4) | the printed ledger's shredded variant; Noor's "[Show her the page.]" (the ledger is a readable, not an item, so the choice is gated on a read after flag 2, which the shredding can't take back; milestone M9-21, stage 6 C-06) |
| `ledger_read_heard` | `false` | first line of HaX's `ledger_read` knot | the Recruiter's call; hub topics after flag 2 |
| `recruiter_call_started`, `recruiter_said_yes`, `recruiter_gone` | `false` | the call's ink (first line; the "yes"; her last line, whether naming, refusing or hung up on) | the re-ring routing (§6.1) |
| `deck_choice_made` | `false` | the deck's last choice | office, aims, Beat 2.7, the invoice |
| `office_entered` | `false` | HaX on `room_entered:sorensen_office` | the office's load backstop; the invoice and Beat 2.7 timing |
| `invoice_booked` | `false` | HaX after `office_entered` on `taken` or `double_crossed` (two mappings, §6.6) | the drop terminal screen's variant; HaX's text |
| `afterwards_heard` | `false` | HaX `afterwards` knot | its hub copy for a player who closed it early |
| `torres_called` | `false` | Torres' call | his fallback timing |
| `reading_found` | `false` | `the_reading.onPickup` | HaX's "Do you want to tell me what it says?"; Torres' fallback |
| `gary_called` | `false` | Gary's call | the keypad topic |
| `salvage_keypad_seen`, `tape_room_entered`, `salvage_opened` | `false` | HaX on `door_unlock_attempt` (salvage cage); `room_entered:tape_room`; `door_unlocked` with `data.connectedRoom === 'salvage_cage'` | hub topics (review m4) |
| `identity_scene_started`, `identity_scene_done` | `false` | first line; the answer | §4 rows 9–10 |
| `identity_name_said`, `hour_read_choice_reached` | `false` | Netherton's naming line; the line before the read's realisation choice | the guarded resume knots (§6 intro, §6.2, §6.3) |
| `hour_read_started`, `hour_read_done` | `false` | first line; last line | rows 10–11 |
| `tesseract_call_started`, `tesseract_call_done` | `false` | first line; HaX's last line | row 12 |
| `alpha_deck_used`, `alpha_clip_played` | `false` | the deck's `triggerOnInteract`; the clip's ink | the clip's mapping; the decode's hub line |
| `tran_alerted` | `false` | Tran's `player_spotted` mapping | the called guard, Lyle Dillard (`archive_guard`; stage 5 §3.3, stage 6 §5) |
| `start_debrief`, `debrief_played`, `report_done` | `false` | HaX hub "[Bring me in.]"; debrief first line; debrief last line | debrief trigger and backstop (`!report_done`); music and credits |
| hub retire flags (`series_topic_given`, `tran_topic_given`, `name_topic_given`, `nightshade_file_decided` (set by the first answer to topic 10; it does not retire the send), `reading_told_hax_asked`, one `flagN_help_given` per flag) | `false` | their hub knots | their own gates (stage 7 may fold some into ink-local `VAR`s if no other file reads them) |
| field-guide pairs | `false` | §7.2 | §7.2 |

`cracker_given` and `stacks_door_opened` from round 0 are gone: the cracker is in the start kit (review M4) and the doors no longer need a "tag ran" flag (review M3).

**Where the mappings live.** HaX carries the bridges, the door unlocks, the task completions, the clock, the purge rules and the forced scenes she hosts; the Recruiter carries her call, its re-rings, the two `in_cage` setters (ahead of her ring (a)) and the double-cross text; Nightshade, Torres and Gary carry their own calls. All of them are listed in `loading_dock`'s `npcs`, so none of their mappings can be missed (lesson 43). Person NPCs carry only mappings on their own room (`room_entered:<own room>`), their own KO, or a global they can only see once their room is loaded.

**Reload and first-ring backstops** (delayed mappings are not saved, `npc-manager.js:606-626`). Every timed rule that holds the critical path has a backstop that retires on the thing it protects having happened. Backstops that **open a scene** sit on `room_entered` (any room) only: it fires on load as well, just after `game_loaded`, so one event avoids opening the scene twice (review m-R2-1). Backstops that only **re-issue an unlock** sit on `game_loaded` (`unlockDoor` is idempotent).

| Protects | Event | Condition |
|---|---|---|
| the stacks door | `game_loaded` (+ the in-session retry on `door_unlock_attempt`, §4 row 1) | `flag1_submitted && !stacks_entered` |
| the cage gate, Victoria's route | `game_loaded` (+ retry) | `maintenance_code_used && !cage_opened` (review M-R2-1) |
| the office door | `game_loaded` (+ retry) | `deck_choice_made && !office_entered` |
| `in_cage` | `game_loaded` | → `false` (review M2) |
| HaX's ledger read | `room_entered` | `flag2_submitted && !ledger_read_heard` |
| the Recruiter's call | `room_entered` | `ledger_read_heard && cage_opened && !in_cage && !recruiter_call_started && data.roomId !== 'restricted_cage'` (review M1) |
| the identity scene's first ring | `room_entered` | `flag3_submitted && nightshade_file_held && !identity_scene_started` (review B3) |
| flag 4's read, first ring | `room_entered` | `flag4_submitted && identity_scene_done && !hour_read_started` |
| Tesseract's call, first ring | `room_entered` | `hour_read_done && !tesseract_call_started` |
| the debrief | `room_entered` | `start_debrief && !report_done` (review B2) |

Optional timed beats (Beat 2.7, the invoice, Torres' fallback) get the `room_entered` backstop only.

## 6. The forced phone scenes

Stage 1 §11's rule, built with the F14 forced-call feature (`README_scenario_design.md` "Forced phone calls that ring again"; `docs/agents/FINALE_ENGINE_TRIAL_CALLS_CREDITS.md`): `disableClose: true` on every ring, `cooldown: 0` on re-rings, and the trigger is the mapping's `eventPattern`. Every ring and re-ring names its `targetKnot` (F20 voices nothing without one). A forced call can only be closed by a hit or a reload (Escape does nothing). Re-rings fire on `room_exited` (any room) and on `game_loaded`; first rings also have backstops (§5).

**HaX's scenes re-ring to a guarded knot, not by `resume`** (milestone M9-04; orchestrator ruling). `resume: true` restores whatever HaX's thread last saved, and after a hit closes one of her scenes the player can open her thread in the same room: the hub, unvoiced, or the scene's choice answered outside the call. So each HaX scene with a choice has a resume knot (`deck_resume`, `identity_resume`, `hour_read_resume`) that checks the scene's done-flag first (done: `#exit_conversation` at once) and otherwise jumps to the unanswered choice by the scene's own globals, and every re-ring targets that knot with no `resume`. The re-rings also fire on `conversation_closed:agent_0x99` (the engine's "immediately" trigger), with the same condition and `delayMs: 500`, so closing her thread re-rings at once. While any of her scenes is pending (started and not done), the top of her home knot shows one line, "Pick up. I'm ringing you.", and `#exit_conversation`, so the hub can't answer the scene's choice and its close re-rings the call. The Recruiter's re-ring 1 keeps `resume: true` (her story holds only the call), with `targetKnot: "call"` as the fallback F20 needs. Stage 9 adds a browser test: a hit inside each HaX scene, open her thread, close it, and the scene re-rings at its choice, voiced where the scene is voiced. Every ring keyed on a flag global or a minigame event carries a `delayMs` so it waits for the station or keypad to close rather than shutting it (review m8). Each scene's other speakers are lines prefixed with their registered display name (`Director Magnus Netherton:`, `Agent HaX:`), which the phone draws under that name (F14).

**Voicing (F17, F20).** The Recruiter's call, the identity scene and Tesseract's call are voiced: every ring and re-ring mapping for them carries `voiced: true` and a `targetKnot` (`docs/agents/FINALE_ENGINE_VOICED_CALLS.md`), so each line plays in its speaker's TTS voice. F20 ("voice only the calls") is committed (24fcb06c), and its rule is in that doc's §8: a voiced call's lines are those in its start knots (each voiced mapping's `targetKnot`) and every knot they reach by divert, tunnel, function or choice, never entering the contact's home knot (its scenario `currentKnot`, default `start`). **Home knots in m09:** HaX's is `start`, which diverts to `support_hub`; the Recruiter's is `start`, a stub with no lines. Because the walk stops only at the home knot itself, a voiced knot that diverted into `support_hub` would voice the hub, so the rule here is stricter: each voiced knot ends `#exit_conversation` and never diverts into `start`, `support_hub` or any knot the hub also uses, unless that knot's lines are meant to be voiced. The three scenes stay on their existing hosts (`recruiter`, `agent_0x99`), and HaX's hub, texts, `flag1_read`, `ledger_read` and `hour_read` stay unvoiced (review M-R2-3). Start knots: `recruiter` → `call`, `resume_name`; `agent_0x99` → `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`. The outcome lines shared between the Recruiter's knot and HaX's `deck_resume` live in an include that only those two knots divert to. Narration in a phone thread isn't voiced (engine doc §2), so neither scene has a narrator line: each becomes HaX's own aside. Flag 4's read stays text. The spoken lines are in §6.7; stage 7 recounts them after the walk.

### 6.1 The Recruiter's call (host `recruiter`, voiced)

| Point | Wiring |
|---|---|
| Ring | §4 row 3 (mappings a, b, c). |
| First line | `#set_global:recruiter_call_started:true`, `#set_global:recruiter_offer:refused`, `#set_global:deck_pulled:alpha_tapes`, `recruiter_secret` by branch (`kept` on sold-and-lied, `confessed` on sold-and-confessed, else left `""`), `#unlock_task:answer_the_offer`. |
| "[Give me the name. Let the deck go.]" | `recruiter_said_yes = true`, `recruiter_offer = taken`, `deck_pulled = none`. |
| Her naming line | `sleeper_named = true`, `recruiter_gone = true` (she hangs up after it). |
| "[No. Keep your name.]" / the hang-up | her last line (or none, on the hang-up) sets `recruiter_gone = true`; the hang-up form keeps `recruiter_offer = refused` and goes straight to HaX's tape choice, opening on her aside "Her counter's running." (was a narrator line; narration isn't voiced). |
| Last choice | the legal pair (`taken`+`none`, `double_crossed`+`her_file`, `named`+`her_file`, `refused`+`alpha_tapes`), then `#set_global:deck_choice_made:true` (HaX's `unlockDoor` on the office follows, §4 row 5), `#complete_task:answer_the_offer`, HaX's "She fired it from Peg's office. I'm on the door." and "Her card for the tape room will be in that office.", `#exit_conversation`. |
| Re-ring 1: before any answer | Recruiter, `room_exited` (with `data.nextRoom !== 'restricted_cage'`, so it never rings as the player walks into the cage, review m-R2-3) and `game_loaded`, condition `globalVars.recruiter_call_started && !globalVars.recruiter_said_yes && !globalVars.recruiter_gone && !globalVars.deck_choice_made`, `resume: true`, `targetKnot: "call"` (the fallback when no story is saved, and F20's start knot). |
| Re-ring 2: between "yes" and the name | Recruiter, same events (the same `nextRoom` test), `globalVars.recruiter_said_yes && !globalVars.sleeper_named && !globalVars.deck_choice_made`, no `resume`, `targetKnot: "resume_name"`: "You hung up on the part you paid for. Halina Kowalczyk." (sets `sleeper_named`, `recruiter_gone`), then HaX's leave-or-pull choice in the same thread. |
| Re-ring 3: after she has gone | **HaX**, `room_exited`, `game_loaded` and `conversation_closed:agent_0x99` (§6 intro; no room test needed: HaX alone on the line), `globalVars.recruiter_gone && !globalVars.deck_choice_made`, no `resume`, `targetKnot: "deck_resume"` (guarded: exits at once on `deck_choice_made`): "I've paused the deck. It won't hold long.", then the unanswered choice. The knot reads `recruiter_said_yes` to offer leave-or-pull, else her-file-or-tapes, and writes the same pair and done-flag (one shared ink include for the four outcomes). |

Re-rings 1–3 have disjoint conditions, so only one can fire for any state. All three carry `voiced: true`.

### 6.2 The identity scene (host `agent_0x99`, knot `identity_scene`, voiced)

| Point | Wiring |
|---|---|
| Ring | §4 row 9, with its first-ring backstop; every ring `targetKnot: "identity_scene"`, `voiced: true`, `disableClose: true`. |
| First line | `#set_global:identity_scene_started:true`, `#unlock_task:hear_the_name`. HaX reads the credential's first line. |
| The hand | if `not hand_matched`, one HaX line closes it before the name: "You never told me about the hand on his file. I looked while you were busy. It's his." `#complete_task:match_the_hand`, `hand_matched = true` (review D-02). |
| Netherton | prefixed lines in HaX's thread, from the aircraft's forward cabin (Beat 3.3). |
| The answer | three buttons by the m06 form (MC §3.4); each sets `hax_confession_answer`, then `#set_global:identity_scene_done:true`, `#complete_task:hear_the_name`. Her reply follows, then "Seven years, and nobody turned it off.", the Albion knot with `#unlock_task:send_the_notice`, and on `deck_pulled == "alpha_tapes"` "His tapes are on the bench next door. When you want them." (review D-16), `#exit_conversation`. |
| Re-ring | HaX, `room_exited`, `game_loaded`, `conversation_closed:agent_0x99` and `global_variable_changed:flag4_submitted` (`delayMs: 1500`), condition `globalVars.identity_scene_started && !globalVars.identity_scene_done`, no `resume`, `targetKnot: "identity_resume"`, `voiced: true`. `identity_resume` exits on `identity_scene_done`. If the name hasn't been said (`identity_name_said`, set on Netherton's naming line), it diverts to the scene's opening stitch, so a player cut off before the name hears it. Otherwise one HaX line ("Still here. Netherton too."; stage 7 words it) and on to the answer's three buttons. The hand line is before the name, so it is covered by the opening stitch. |

A close after the answer and before the Albion lines loses nothing: the notice and the papers stay in HaX's hub (§7), and the papers are an object in the salvage cage.

### 6.3 Flag 4's read (host `agent_0x99`, knot `hour_read`, text)

| Point | Wiring |
|---|---|
| Ring | §4 row 10, with its first-ring backstop. |
| First line | `#set_global:hour_read_started:true`, `#unlock_task:hear_the_mirror_job`. |
| Body | the two modes, the D-02 line, the head start, the defences, the casualty sheet (and Kemal on `m06_minder_walked`). |
| The realisation | on `schedule_read`, a choice: "[Her schedule. This room isn't on it.]" / "[Read me the defences.]"; otherwise HaX's line from the job's side. |
| Last line | `#set_global:hour_read_done:true`, `#exit_conversation`. |
| Re-ring | HaX, `room_exited`, `game_loaded` and `conversation_closed:agent_0x99`, `globalVars.hour_read_started && !globalVars.hour_read_done`: with `globalVars.schedule_read` → no `resume`, `targetKnot: "hour_read_resume"` (guarded: exits on `hour_read_done`; on `hour_read_choice_reached`, set on the line before the realisation choice, one line and the choice; otherwise it diverts to `hour_read`'s body); with `!globalVars.schedule_read` → no `resume`, `targetKnot: "hour_read"` (no choice, so it restarts). Text, so no `voiced`. |

### 6.4 Tesseract's call to HaX (host `agent_0x99`, knot `tesseract_call`, voiced)

No choice, so it restarts from the top if closed. First line `#set_global:tesseract_call_started:true`; HaX's last line of her four-sentence report sets `tesseract_call_done`. Ring: §4 row 11, with its first-ring backstop. Every ring `targetKnot: "tesseract_call"`, `voiced: true`. Re-ring: HaX, `room_exited`, `game_loaded` and `conversation_closed:agent_0x99`, `globalVars.tesseract_call_started && !globalVars.tesseract_call_done`, `targetKnot: "tesseract_call"`, no `resume`, `voiced: true`. Music: `silence` (F10) from its first line (§10). Round 0's narrator line becomes HaX's own aside at the top of her report ("He kept his voice down. He always did."; stage 7 words it), since narration in a phone thread isn't voiced. Review D-07 noted this scene could run today as a voiced `video-call` with no `resume`; with F17 it stays in the phone with the others, which keeps one pattern.

### 6.5 The debrief (hidden person NPC `closing_debrief`, in `loading_dock`)

Not a phone scene, but forced by the same rule. HaX's hub choice "[Bring me in.]" (gated `tesseract_call_done and not report_done`, so it can be asked again after a reload) sets `start_debrief` (`setGlobal` emits even when unchanged). `closing_debrief` opens on `global_variable_changed:start_debrief` with `value === true && !globalVars.report_done`, `conversationMode: "person-chat"`, `background` the hangar, `disableClose: true`. Backstop on `room_entered` (any room) with `globalVars.start_debrief && !globalVars.report_done`, re-emitting `start_debrief`. Keying both on `report_done` rather than `debrief_played` means a reload anywhere inside the debrief reopens it (review B2; m05's backstop only covered a reload before the first line). `debrief_played` (first line) is kept for the music. A mapping-opened person-chat **restarts at its knot** after a reload (it restores variables and visit counts, then jumps to the knot, `npc-manager.js:1072-1081`, `person-chat-event-start.js:22-33`), so the debrief is written to replay safely (review m-R2-2): the archive-or-debrief branch reads `debrief_notice_before`, copied once in HaX's "[Bring me in.]" knot, never a value taken on the debrief's own first line; each answered beat (Kowalczyk's reply, the stance, the notice, each hub topic) is guarded by its own global or visit count and skipped on a replay with one short bridging line. `#complete_task:report_to_netherton` and `#set_global:report_done:true` are on the last line.

### 6.6 Calls and texts that are not forced

| Call | Host | Trigger | Notes |
|---|---|---|---|
| HaX on flag 1 (`flag1_read`) | HaX | `flag1_submitted`, `delayMs: 2500` | the shelf marks; "The ledger keeps. Her shredder doesn't. Stacks first."; "Her card's on a reel at her hip. You've done this before." (review D-11). Ends with `#give_item:notes:catalogue_salvage_line` (the coded salvage line, from HaX's `itemsHeld`) and "I've sent you the odd one." (§4 row 7). The door opens on its own mapping (§4 row 1) |
| HaX's ledger read (`ledger_read`) | HaX | `flag2_submitted`, `delayMs: 2500`; backstop §5 | first line sets `ledger_read_heard`; WREN on the raid team; "neither will you"; the m05 and m07 lines; the H&L file number; unlocks `cross_reference_wren` (mapping) |
| Nightshade (triple agent) | `nightshade_phone` | `flag1_submitted && m08_nightshade_triple_agent`, `delayMs: 7000` | rings after HaX's flag-1 call closes; HaX's "He's right. I hate that he's right." is prefixed in his thread |
| Nightshade's text back | `nightshade_phone` | `global_variable_changed:nightshade_shown_file` with `value === true`, `delayMs: 4000`, `onceOnly`, `sendTimedMessage`; two mappings, one with `globalVars.cage_bin === 'nightshade_copy'` ("You found what I cleared, too…") and one with `globalVars.cage_bin !== 'nightshade_copy'` ("Thank you. I'd rather not have known…") | unvoiced; MC §4.1, SE §2 (milestone M9-20) |
| The file in hand | HaX text | `global_variable_changed:nightshade_file_held` with `value === true && !globalVars.flag3_submitted`, `onceOnly` | "Hold his file next to the notebook scan in my case file. Then tell me what you see." (review D-02) |
| The cabinet's reader | HaX text | `room_entered:restricted_cage`, `onceOnly`, `delayMs: 2000` | "That cabinet takes a print. She stamps everything." (review D-11) |
| Beat 2.7 "Afterwards" | HaX | `global_variable_changed:deck_choice_made` (`value === true`), `delayMs: 2500` | waits for the Recruiter's call to close, so it lands while the player is still in the hub (review D-12); the loss line, three words, one sentence, "The rest when this is over. Her office is past the binders." Closed early: a hub topic, once |
| The invoice | HaX text | `global_variable_changed:office_entered` with `globalVars.recruiter_offer === 'taken'` (and a second mapping for `'double_crossed'`), `delayMs: 20000`, `onceOnly`; sets `invoice_booked` | held until the player is in the office so the seam after "Afterwards" stays quiet (review D-18) |
| Torres (turned) | `torres_phone` | at the H&L boxes: `object_interacted` with the boxes' `data.objectName` `&& globalVars.flag2_submitted && globalVars.m05_torres_turned`, `delayMs: 1500`; fallback: `global_variable_changed:reading_found` with `globalVars.m05_torres_turned && !globalVars.torres_called`, `delayMs: 8000` | the fallback waits for the safe, never before WREN exists (R3-10), and after the seam (review D-18) |
| Gary (protected) | `gary_phone` | `door_unlock_attempt` with `data.connectedRoom === 'salvage_cage' && globalVars.m02_gary_protected`, `delayMs: 1500`, `onceOnly` | the hint names the CyberChef operation and points at the legend (stage 6 §2.3: "Seen codes like that. Archives key them to the shelf scheme. Read it like a shelf mark, not a number. Vigenère, and the bay's word is the key. There'll be a chart near the keypad."); sets `gary_called` |
| The double-cross text | `recruiter` | `room_entered:tape_room` with `globalVars.recruiter_offer === 'double_crossed'`, `onceOnly`, `sendTimedMessage` | unvoiced; m05 sends texts from the Recruiter outside the phone's `npcIds` (`m05 scenario.json.erb:1494-1500`) |
| Door refusals | HaX texts | `door_unlock_failed` with `data.connectedRoom` the room, `onceOnly` each | stacks: "That reader's on the catalogue server. Get me in there and I'll open it."; office: "Her keypad's off the card system. Leave it for now."; tape room: "That reader wants a real card. Hers will be somewhere she trusts." (review D-09) |
| "She's still feeding it." | HaX text | §4 "The purge made visible" | once |

### 6.7 Spoken lines for the audio budget (F17)

Counted from the stage 1–3 drafts; stage 7 writes the final strings, all fixed (no printed variables). Each variant is one audio line. Player choices aren't voiced.

| Scene | Speaker | Lines | Variants included |
|---|---|---|---|
| Recruiter's call | The Recruiter | about 14 | four openings (sold-and-lied; "Last time I said the next one would cost me more. This is the next one."; the stranger, two lines; confessed has none), "Of course. Shall we do business anyway?", the grievance (two lines), the offer (two lines), the double-cross price, "Nobody has.", the naming line, "Then I'll tidy my own desk. Gone. Goodnight, agent.", "You hung up on the part you paid for. Halina Kowalczyk." |
| | Agent HaX | about 15 | "Her counter's running." (the hang-up aside), "We've talked about that. She has nothing on you.", "Noted. Later.", "She's wiping it. She thinks it's gone.", the deck line, "I can beat that wipe.", the invoice line, "You thanked her at the briefing. Keep doing it.", "She's watching the deck…", "She watched the counter. Not the copy. One of them. Now.", "One of them. Now." (hang-up), the first-handler line (two forms), "One of four. Two, if that firm's boxes say so.", the office lines (two), "I've paused the deck. It won't hold long." |
| Identity scene | Agent HaX | about 26 | the credential line; the hand line; two recognition lines; four confession openings; the wall line; three replies and three Reading-aware replies; "Seven years, and nobody turned it off…"; four m04 landing lines; two controller lines; three watch lines; the send-cost line and its inquiry clause; "It isn't my call…"; the tapes line |
| | Director Magnus Netherton | 3 | "I said we wouldn't name him… Dr Adrian Tesseract."; "He was our chief strategist…"; "HaX." |
| Tesseract's call | Agent HaX | about 8 | the aside that replaces the narrator line, her side of the call (one line with beats, or split at the beats into three), the four-sentence report, "Netherton's on the ground at Helena. Tell me when you're ready to come in." |
| **Total** | | **about 66** (Recruiter 14, HaX 49, Netherton 3; no narrator) | only these knots are voiced under F20; plus the two-line Alpha-tapes clip already budgeted (F12) |

A player hears about a third of these on any one route (one opening, one branch of each choice). Lines shared by the Recruiter's knot and `deck_resume` are one audio file each (the cache keys on the text). Netherton needs `director_netherton` registered as a character (the id m08 and m10 use; renamed from `netherton` at the stages 4–5 milestone), which the start-room record does; a playtest segment that starts elsewhere carries it (§12). The user hears Tesseract's tape style before it ships (tts-audio skill).

## 7. HaX's support hub and the field guides

`support_hub` in `m09_phone_agent0x99.ink`, the m01/m02/m08 pattern: each topic gated on a progress global and retired with a `_given` / `_heard` guard, **topics that arrive later listed first**, no more than ten choices showable at once (lint `crowded-hub`), and the field guides behind one choice (m08's "[I need a field guide.]"). Every answer is the next step or a cost, said once. Topics are text: under F20 only the voiced calls' knots are voiced, and none of them diverts into the hub. HaX's home knot (`currentKnot`) is `start`, which diverts to `support_hub`; while one of her scenes is pending, `start` shows only "Pick up. I'm ringing you." and `#exit_conversation` (§6 intro).

### 7.1 Topics (in ink order, newest first)

| # | Player's line (draft) | Shows when | Retires on | What it gives |
|---|---|---|---|---|
| 1 | "[Bring me in.]" | `tesseract_call_done and not report_done` | `report_done` | copies `albion_notified` into `debrief_notice_before`, then sets `start_debrief` (§6.5); askable again after a reload (review B2). Before it, one line on anything still open: the notice unsent ("The notice is still on his box. Netherton will ask."), the boxes unread, Tran |
| 2 | "[His notice. Send it.]" / "[Not yet.]" | `identity_scene_done and not albion_notified` | `albion_notified` | MC §3.5's archive send, here so it works from any room (P8). HaX's two lines on send ("Gone." … the vendor; the watch) |
| 3 | "[About the name.]" | `identity_scene_done` | `name_topic_given` | "the name" (SE §4.4), once |
| 4 | VM help, flags 3–4: "[I'm on his box. Where do I look?]" | `salvage_opened and not flag4_submitted` | `flag4_submitted` | one line per stage in story terms, before flag 3 and between 3 and 4 (review D-06); the opus48 VM plan gives stage 7 the steer, at game-design level only |
| 5 | "[The keypad on the cage.]" | `salvage_keypad_seen and not salvage_opened` | `salvage_opened` | First ask (stage 6 §2.3), each line its own text, no prefix: "Catalogue line from flag one." / "SALVAGE CAGE ACCESS" / "MSJMQAEGDZNVI" / "Just the code, not the label. The key is the salvage bay's word, on the chart in the tape room, by the keypad. If the cipher's new to you, ask me for the archive-code field guide." On `gary_called` the last sentence becomes "Gary told you how." Asked again while the keypad is shut (ink visit count): "Vigenère Decode, on your workstation. Key: the salvage bay's word. Capitals in, capitals out." (review B-R2-1; C-02 to C-04) |
| 6 | "[The tape room.]" | `deck_choice_made and not tape_room_entered` | `tape_room_entered` | "Her card for the tape room will be in the safe." |
| 7 | "[Afterwards.]" | `deck_choice_made and not afterwards_heard` | `afterwards_heard` | Beat 2.7 for a player who closed the call |
| 8 | "[The Reading.]" | `reading_found and not reading_told_hax_asked` | answered | MC §4.6: "[All of it.]" / "[It's about me. It can stay that way.]" (`reading_told_hax`) |
| 9 | "[WREN.]" | `ledger_read_heard and not sleeper_named` | `sleeper_named` or `sleeper_shortlist` | the cross-reference nudge: "H&L's boxes are in the open stacks. You've got the number." On `m05_torres_turned`, his line follows |
| 10 | "[Send Nightshade his file.]" / "[Hold it.]"; after Hold, "[Send Nightshade his file.]" alone | first ask: `m08_nightshade_triple_agent and nightshade_file_held and not nightshade_file_decided`; after Hold: `nightshade_file_decided and not nightshade_shown_file` | `nightshade_shown_file` or `start_debrief` | MC §4.1, here so it can be answered anywhere until the debrief (P8). The first answer sets `nightshade_file_decided`; Hold leaves the send in the hub until the debrief, as MC says (milestone F-04) |
| 11 | "[The hand on his file.]" | `nightshade_file_held and not hand_matched` | `hand_matched` | if `not notebook_read`: "Read the notebook scan in my case file first. Then look again." Otherwise the honest choice (§3.2): "[Same hand.]" (completes `match_the_hand`; "Those are my notes. That's his pen." / "Hold that."; on `bin_chosen and cage_bin == "derek_file"` (the player pulled Derek's file and holds it), "Two samples. One pen." (review m-R2-5)) / "[Different hands.]" / "[I can't tell.]" (a line each, no progress) (review D-02) |
| 12 | VM help, flag 2: "[The ledger. Where is it?]" | `flag1_submitted and not flag2_submitted` | `flag2_submitted` | one story-level steer (review D-06) |
| 13 | "[The box behind her.]" | `cage_opened and not legacy_clock_run and not legacy_files_saved` | the clock or the save | what the legacy box is and when it goes (MC §4.3), once |
| 14 | "[Sorensen's mail.]" | `m03_victoria_fate == "recruited" and stacks_entered and not cage_opened` | `cage_opened` | Victoria's route (§4 row 2b): "Victoria's people read their mail. There's a maintenance code for that gate." Sets `maintenance_code_used`. Then: "The cabinet in there takes her print. It's on the stamp on her shelf." (review D-10) |
| 15 | "[The restricted series.]" | `flag1_submitted and not series_topic_given` | given | the shelf marks; Sorensen behind the mesh; "The gate takes her card, the cabinet takes a print." |
| 16 | VM help, flag 1: "[The catalogue. What am I looking for?]" | `not flag1_submitted` | `flag1_submitted` | "The catalogue's the index. Find the part that isn't public." (review D-06) |
| 17 | "[Tran.]" | `not tran_topic_given and not cage_opened` | given, or `cage_opened` | the warning by m01 branch (Beat 1.1), then "He's wiping tapes from the server closet off the open stacks. You'd need something he wants to talk him off it. Otherwise it's a fight." (review D-15) |
| 18 | "[I need a field guide.]" | any `<x>_guide_offered and not <x>_guide_hint_given` | all offered guides given | a sub-menu listing only the offered, undelivered guides (§7.2) (review D-06) |
| 19 | "[Where do I stand?]" | always | never | a status answer that branches on every stage of the ladder (§2), most advanced first. Stage 7 writes one line per row |

**Showable at once.** The gates make the VM-help topics (4, 12, 16) mutually exclusive, and 15 and 17 are Act 1–2 topics that retire before Act 3. The worst case is just after the deck choice: 6, 7, 8 (once the safe is open), 9, 10 (triple agent only), 11 (if the hand is still open), 13 (rarely still live), 18, 19, which is nine. Stage 7 runs the lint. The two door backstop topics from round 0 are gone (F19, review M3).

### 7.2 Field guides (exposure-gated, on request)

Each guide is a `lab-workstation` in HaX's `itemsHeld`. An exposure mapping sets `<x>_guide_offered` and sends one text; the guide is delivered from topic 18's sub-menu with `#give_item:lab-workstation:<id>` (README "Field guides"; m08's grouping). The lab sheet URLs wait for the VM plan and the lab-sheet stage. No offer text names the raid team or WREN (review D-05).

| Guide | Offered on (exposure) | Covers |
|---|---|---|
| `m09_catalogue_field_guide` | `object_interacted` with `data.objectType === 'vm-launcher' && data.roomId === 'reading_room'` | flag 1 (the foothold) |
| `m09_ledger_field_guide` | `flag1_submitted` | flag 2 |
| `m09_tomb_beta_field_guide` | `room_entered:salvage_cage` | flags 3–4, including the leaver credential (M-05) |
| `m09_archive_code_guide` | `global_variable_changed:salvage_keypad_seen` | the CyberChef operation for the archive code, `Vigenère Decode`, with one worked example (game-side, no VM content); HaX's first topic-5 answer points at it (stage 6 §2.3) |

The kit techniques get a line where they are first needed, not a guide (§6.6: the card on the reel in `flag1_read`; the cabinet's reader on entering the cage).

## 8. Optional objectives and finds

No separate optional objective. The prompt allows 0–3; m08 keeps its optional work inside the act aims, and that is better here because each optional thread belongs to a moment (MC §4). Five optional tasks sit in their act's aim: `meet_the_clerk` (aim 1), `stop_the_shredding` and `stop_the_tape_wipe` (aim 2), `cross_reference_wren` (aim 3), `send_the_notice` (aim 5). They raise the score (the formula counts every task, README "Score") and never hold an aim open.

**Finds with no task** (they are rewards for looking, and a task would spoil or nag):

| Find | Where | What reading it does |
|---|---|---|
| The master destruction schedule | `director_safe` | `schedule_read` (`onRead`): the realisation choice at flag 4 |
| The Reading, to its last page | `the_reading` | `reading_finished` (`onRead` on the last page) |
| The rent ledger (`rent_book`), Danny's note (`danny_sheet`), the build-out ledger (`refit_ledger`): read in place, `notes`, `takeable: false` (stage 6 C-15) | Sorensen's office | Tier 2 lines in HaX's ink (Irina, Danny, the ransom). The rent ledger's header, "Lease start: 06/02/16", gives the safe's PIN `060216` as printed: the long way, a read rather than a pick (review m7; stage 6 C-20) |
| The framed certificate (`clerk_certificate`, observations only) | Sorensen's office wall | twenty years' service, Clerk and Recorder, Lewis and Clark County: the callback the salvage decode lands on (stage 6 W6-09) |
| The printed ledger | the cage | the totals (23, 47, 11) and costs; Reeves' handler's sheet (on that branch, flag 2 only); Noor's codename LINNET (for "[Show her the page.]", on `ledger_page_seen`) |
| The legacy box | the cage's feed table, or under Noor's desk | HaX: "Nobody of ours in here. Ours are on her tape, by codename." |
| Derek's file / the letters / Nightshade's copy | given at the hatch (`sorensen_hatch`) or, on Victoria's route, at the cage door (`sorensen_door`); items `derek_file`, `letters`, `nightshade_copy`, held by both records (stage 5 §3.6–3.7) | the second sample; Villanueva; the Tran lever |
| Old Coyote's incident log (`incident_book`, "Incident Log") | the dock's guard hut | a week of "shredder running, night" entries nobody read |
| The tagged payments | `case_file` (on `m06_monitoring_enabled`) | HaX's line; the bunker pointer on the no-coordinate branch |
| Tomb Beta's enrolment binders | salvage cage | the hand again (Beat 3.2) |
| The Albion papers (the catalogue entry, his memo and the unsent notice, in one folder) | salvage cage (`albion_folder`, printed off the box; its `textVariants` show the text once `flag3_submitted`) | the papers HaX summarises in the identity scene's Albion knot; one object rather than three to keep Act 3's reading down (review D-07) |
| The Alpha tapes' annotation sheets | tape room (on `deck_pulled == "alpha_tapes"`) | the decode on the CyberChef workstation from the start kit: his first draft of the line (optional, after the clip; milestone M9-22). Stage 6 §2.4: `Vigenère Decode`, key `ALPHA` ("Key: the series."); the readable variant needs `deck_pulled === 'alpha_tapes' && identity_scene_done`, else "Blank label stock." (C-11) |
| The archive's shelf-code legend | tape room, on the wall by the salvage keypad, every route | the key to the salvage code (§4 row 7): Bay 12, Salvage, `BONEYARD`, with the house rule "cage and keypad codes use the bay word" (observations only, stage 6 §1.9). The coded line is in the notepad on every route, given by HaX's `flag1_read` as a notes item (`#give_item`), and repeated on the drop terminal's screen from flag 1 on (review B-R2-1) |

## 9. Conclusion, concludeRequires and credits

```json
"concludeRequires": {
  "tasksCompleted": ["submit_catalogue_flag", "submit_ledger_flag", "submit_owner_flag", "submit_control_flag"]
}
```

The four flags, the mandatory flag nodes the dungeon graph will show. Nothing else: the deck choice, the confession and the notice are forced by locks (§4) and the debrief's spine, and every export is written on every finished route (FA §6.1: `cage_bin` at `cage_opened`, `legacy_files_saved` at `cage_opened` or a knock-out, `albion_notified` by the debrief, the rest by forced scenes).

**Order of the end** (lesson 46): the debrief's last line completes `report_to_netherton` and sets `report_done`; the aim completes and the server concludes; the music event on `global_variable_changed:report_done` (`value === true`) plays `victory` with the closing card and credits below. The debrief's last image is Netherton capping the pen; the card follows it.

**Closing card** (at most five lines show; these are written so exactly five hold on every route; conditions are JavaScript over `globalVars`, so every name is written `globalVars.<name>` and `||` works here; milestone F-10):

| # | Line | Condition |
|---|---|---|
| 1 | "The Architect: Dr Adrian Tesseract. Proved." | always |
| 2 | "The Publication: 06:00 UTC, day 13." | always |
| 3a | "WREN: Halina Kowalczyk. She doesn't know you know." | `globalVars.recruiter_offer === 'taken'` |
| 3b | "WREN: Halina Kowalczyk. She walked off the apron at Helena." | `globalVars.recruiter_offer === 'double_crossed'` |
| 3c | "WREN: one of two names on a dead firm's placement record." | `!globalVars.sleeper_named && globalVars.sleeper_shortlist` |
| 3d | "WREN: one of four. Going in with you." | `!globalVars.sleeper_named && !globalVars.sleeper_shortlist` |
| 4a | "His vendor notice: sent tonight." ("nine years late" is kept for Tesseract in m10, MC C-13; milestone M9-16) | `globalVars.albion_notified` |
| 4b | "His vendor notice: still on his box." | `!globalVars.albion_notified` |
| 5 | "The Montana order: signed." | always |

**Credits** (fixed strings; `section` blocks drop their heading when nothing under them prints; the people clauses run most specific first and end unconditional, so every person always has a line; every condition is written `globalVars.<name>`, as on the card):

- `MISSION COMPLETE` (title); `DIGITAL ARCHAEOLOGY` (subtitle).
- **IN THIS OPERATION** (`people`):
  - AGENT HAX: "Told she should have said it. She agreed." (`globalVars.hax_confession_answer === 'should_have_told'`) / "Given her own line back." (`=== 'afterwards'`) / "Thanked, once." (otherwise).
  - MARGARET SORENSEN: "Wrote down every box she destroyed." (`globalVars.sorensen_fate === 'talked'`) / "Stopped at the shredder. A concussion and a lawyer." (`=== 'ko'`) / "Shredded until morning."
  - NOOR HADDAD: "Knocked down at her own desk." (`globalVars.noor_ko`) / "A witness in Great Falls. Not allowed to ring her father." (`globalVars.noor_told`) / "Went home and rang her father. Still on a list."
  - CODY OLD COYOTE: "Knocked down on his round." (`globalVars.old_coyote_ko`) / "Sat out the night in his truck." (`globalVars.old_coyote_told`) / "Walked the fence. Saw nothing."
  - JESSE TRAN: "Walked out and made a phone call." (`globalVars.tran_outcome === 'talked'`) / "In custody. Asked for a phone charger." (`=== 'ko'`) / "Wiped the tape side and went home."
  - THE RECRUITER: "Sold you a name and booked the sale." (`globalVars.recruiter_offer === 'taken'`) / "Sold you a name, then warned it." (`double_crossed`) / "Wiped her own file. You kept a copy." (`named`) / "Kept her name. You kept his tapes." (`refused`).
- **WHAT THE PURGE TOOK** (`lines`): "Saved from the bins: Derek Lawson's file." / "…the Social Fabric letters. Teresa Villanueva was warned." / "…what Nightshade cleared from his locker." (by `globalVars.cage_bin`; "from the bins" because Victoria's route takes it at the cage door, milestone M9-18); "The deck: wiped, all of it." / "The deck: her file pulled, the rest wiped." / "The deck: Tomb Alpha's tapes pulled, the rest wiped." (by `globalVars.deck_pulled`); "The legacy placement files: kept from the shredder." (`globalVars.legacy_files_saved`; the files are readable objects, not an item, so not "picked up", milestone M9-19); "The tape side: saved." (`globalVars.tran_outcome !== 'left'`).
- **ELSEWHERE** (`lines`): "Albion's controller: a fix in ninety days for four hundred sites. The Critical Mass watch went dark." (`globalVars.albion_notified`) / "Albion's controller: four hundred sites, still open. The watch stays on." (otherwise).

Every line says what happened and judges nothing, per stage 1 §7.2. Stage 7 owns the final wording; these are fixed strings with no printed variables, so they can be voiced or not. The debrief doesn't read the bin or the tape back (HaX named them in Beat 2.7); the credits list them once, which is the season's convention (m08's per-person lines).

## 10. Music cues

SE §6.2's table as `music.events` entries. No new track is assumed. Tesseract's call plays under the `silence` playlist (F10, approved 2026-10-21).

| Trigger | Condition | Playlist | Beat |
|---|---|---|---|
| `game_loaded` | `!globalVars.briefing_played` | `cutscene` | briefing |
| `game_loaded` | `globalVars.briefing_played && !globalVars.debrief_played` | `noir` | resume mid-night |
| `conversation_closed:briefing_cutscene` | – | `noir` (fade) | the dock |
| `npc_hostile_state_changed` | `isHostile === true` | `threat` | Tran, his guard, Sorensen if fought |
| `all_hostiles_ko` | – | `noir` | back to the search |
| `global_variable_changed:identity_scene_started` | `value === true` | `cutscene` | the held cue |
| `global_variable_changed:identity_scene_done` | `value === true` | `noir` | back to work |
| `global_variable_changed:tesseract_call_started` | `value === true` | `silence` (F10) | his call |
| `global_variable_changed:tesseract_call_done` | `value === true` | `noir` (fade) | back to the box |
| `global_variable_changed:start_debrief` | `value === true` | `cutscene` | the hangar |
| `global_variable_changed:report_done` | `value === true` | `victory`, with the closing card and credits (§9) | the pen |

"`noir`, low" at the call, at Beat 2.7 and at flag 4 (SE §6.2) is a volume, and the music events take no volume key (`music/scenario-music-events.js` has none). Those three stay on plain `noir`, or use a quieter track if the user adds one; the scene's text carries the drop.

**Ambient sound.** The shredder is a room `ambientSound` on `restricted_stacks` and `restricted_cage`; the zone model plays it quietly through open doors into neighbouring rooms (`rooms.js:3041-3068`). A room's ambient sound is fixed: nothing switches it on a global, so the shredder can't fall silent when Sorensen is stopped. The narrator's line and HaX's carry the silence, as SE §6.1 allows. Making it stop is a small engine item for the user (§15), not a dependency.

## 11. Timing against 85 minutes

**Assumption, not a measurement:** each VM stage takes 7 minutes for a player following the field guide (stage 1 §2). No shipped mission records per-flag times, and M-14 (real times from m07/m08 play data or one timed VM run) is still open. When the times exist, only the VM rows below change.

| Part | Beats and tasks | In-game | VM | Minutes | Critical path only |
|---|---|---|---|---|---|
| Briefing | cutscene; the cracker | 4 | – | 4 | 4 |
| Act 1 | the dock and the route (`get_inside`) 2; Noor (`meet_the_clerk`, optional, and the first clone on route A) 3; the reading room and the laptop (`set_up_drop_terminal`) 3; flag 1 (`submit_catalogue_flag`) | 8 | 7 | 15 | 12 (Noor's 3 off, apart from a clone on route A) |
| Act 2 | the hatch: bluff, recognition, bins, clone, print (`talk_at_the_hatch`) 6; the gate and the box (`open_the_cage`) 2; the cabinet and the hand (`open_plan_cabinet`, `match_the_hand`) 3; flag 2 and HaX's read (`submit_ledger_flag`) 2 + VM; the call (`answer_the_offer`) 5; the boxes (optional) 4; Tran (optional) 1–3; Beat 2.7 1 | 24 | 7 | 31 | 26 (boxes and Tran off) |
| Act 3 | the office, the safe, the Reading, the deed (aim 4) 6; the tape room, the code at the legend, the salvage keypad (`enter_tape_room`, `open_salvage_cage`) 5; flag 3 and the identity scene (`submit_owner_flag`, `hear_the_name`) 3 + VM; the Albion folder and the notice 1; flag 4, the read and the call (`submit_control_flag`, `hear_the_mirror_job`) 2 + VM | 17 | 14 | 31 | 30 (the archive send off) |
| Debrief | the hangar (`report_to_netherton`) | 4 | – | 4 | 4 |
| **Total** | | **57** | **28** | **85** | **about 76** |

Notes:

- **Published figure.** About 85 with the optional content, about 76 on the critical path alone, at 7 minutes a flag with the field guides (review D-17). Without the guides, stage 0's estimate is 95–100: the VM column grows, nothing else does.
- **The decode is re-costed** at 5 minutes (was 4) and the Albion papers at 1 (was 2, now one folder). Round 0's walk-back to the reading room is gone: the coded line is in the notepad and the legend hangs by the keypad in the tape room (review D-03, M7).
- **Walking.** Every critical walk is one or two doors: the reading room is beside the restricted stacks (the flag-2 walk-back is one door), and the office, the cage and the tape room all open off the restricted stacks. The one walk-back by design is the plan cabinet for a player who skipped it before flag 3 (the identity scene waits for the file). The open stacks is now a 4×2 warehouse floor (stage 5 §2); route B's crossing is still about seven tiles at its west end, because the shutter and the reading-room door are both there. The extra length holds the H&L boxes and the closet, and Old Coyote's round is drawn to cross the west end on every lap (review m-R2-7).
- **Cut order if playtests run long** (stage 1 §2, unchanged): the cross-reference, Tran's closet, the Alpha decode. Nothing on the critical path.
- **If real VM times come in at 10 minutes a flag**, the total is about 97 with the guides (88 critical path). The cut order recovers about 8 minutes; past that, the user decides between a longer published time and a lighter VM (stage 8).

## 12. Playtest routes and F15 starting states

The F15 bootstrap (`tools/playtest/new-game.rb`, README "head start") starts a run in a named room with globals, items, unlocked rooms, completed tasks and submitted flags seeded. What it carries and doesn't, for m09:

- `--start-room ROOM` moves every phone NPC from `loading_dock` into the new start room (HaX, the Recruiter and the branch callers), so the hub, the forced scenes and HaX's mappings are live, and they count as met when that room loads.
- `--carry-npc ID` moves a person NPC; m09 carries `closing_debrief` for S7 (it keeps its 500,500 position and stays hidden). `briefing_cutscene` and its speakers stay in the dock, which is fine because every segment sets `briefing_played`.
- `--complete-task` and `--submit-flag` write the server state, including each station's `set_global` rewards (`flag1_submitted` …), but no client mapping replays. Every door in m09 that opens on a mapping has a `game_loaded` backstop (§5: the stacks door, the cage gate on Victoria's route, the office door) or is passed with `--unlock`, and every scene that would have rung has a first-ring backstop, so a seeded segment comes up in the right state. Globals the client would have set are passed with `--set`.
- A reload respawns at the segment's start room.

### 12.1 Segment starts

Flag ids use the station-qualified form (`drop_terminal:catalogue_server-flag1`, …), with the placeholder system names until the VM plan. "Imports" are passed with `--imports=<file>`.

| Seg | `--start-room` | `--set` (beyond imports) | `--submit-flag` / `--complete-task` | `--unlock` / `--give` / `--carry-npc` |
|---|---|---|---|---|
| S0 | (none: the dock) | none | none | none |
| S1 | `reading_room` | `briefing_played=true` | tasks `get_inside`, `set_up_drop_terminal` | – |
| S2 | `restricted_stacks` | S1 + `stacks_entered=true` | S1 + flag 1 (completes `submit_catalogue_flag`, sets `flag1_submitted`) | `--unlock restricted_stacks` |
| S3 | `restricted_cage` | S2 + `hatch_talked=true`, `bin_chosen=true`, `cage_bin=<route>`, `cage_opened=true` | S2 + tasks `enter_restricted_stacks`, `talk_at_the_hatch`, `open_the_cage` | + `--unlock restricted_cage` |
| S4 | `reading_room`, call due on load | S3 + `nightshade_file_held=true`, `legacy_clock_run=true`, `ledger_read_heard=true` (the call's backstop rings on the first room entry) | S3 + flag 2, task `open_plan_cabinet` | + `--give nightshade_file` |
| S5 | `sorensen_office` | S4 + the route's deck pair, `recruiter_call_started=true`, `recruiter_gone=true`, `deck_choice_made=true`, `afterwards_heard=true`, `office_entered=true` | S4 + task `answer_the_offer` | + `--unlock sorensen_office` |
| S6 | `tape_room`, scene rings on load (the first room entry, in the tape room) | S5 + `reading_found=true`, `salvage_opened=true`, `tape_room_entered=true` | S5 + aim 4's tasks, `enter_tape_room`, `open_salvage_cage`, flag 3 | + `--unlock tape_room --unlock salvage_cage --give tape_room_keycard --carry-npc director_netherton`. With `flag3_submitted` and `nightshade_file_held` set and `identity_scene_started` false, the identity scene's first-ring backstop rings on load, in the tape room (review B3, m-R3-2). `director_netherton` carried so his lines are attributed and voiced as his (review M-R2-4) |
| S7 | `tape_room` | S6 + `identity_scene_started=true`, `identity_scene_done=true`, `hax_confession_answer=<route>`, `hour_read_started=true`, `hour_read_done=true`, `tesseract_call_started=true`, `tesseract_call_done=true` | S6 + task `hear_the_name`, flag 4, task `hear_the_mirror_job` | + `--carry-npc closing_debrief --carry-npc director_netherton --carry-npc kowalczyk --carry-npc hax_voice` (the debrief's host and every speaker in it; the narrator is a voice block, not an NPC) |

**Start rooms and door parity** (review M-R2-4): a start room that is 1 GU tall, like the 2×1 salvage cage, shifts every grid sum by an odd number and flips door sides (`doors.js:96-110, 168-186`; a stub started there misaligns the dock's north door). S6 and S7 therefore start in the 2×2 `tape_room`, one door from the salvage cage; round 2's reviewer checked stubs from `tape_room`, `reading_room`, `restricted_stacks`, `restricted_cage` and `sorensen_office`, and all align.

If a segment can't be seeded this way in practice (a stage 9 check), it starts at the dock with the same `--set`, `--unlock`, `--give` and seeded tasks and flags, and walks in: six doors at most (review B4).

### 12.2 Routes (covering set)

Twelve routes, then the three stage 3 named, then the reload set. Import profiles: **none** (cold start), **kind** (won branches), **hard** (lost branches), and per-route overrides. Each export value and each L+ form is hit at least once.

| # | Imports | From | Choices | Covers |
|---|---|---|---|---|
| R1 | none | S0 | shutter route past Old Coyote (sneak); Noor left; hatch, no bin pressed; Sorensen left; take the name, leave the deck; the Reading put down; confession "should have told"; notice held at the debrief; memo "yes"; Kowalczyk flat | cold-start path end to end; `cage_bin` default `derek_file`; `taken`+`none`; `sleeper_named`; the narrator line for flat on a named WREN; `albion_notified` false; never-played forms everywhere |
| R2 | kind: `m05_found_pipeline_list`, no deal; `m02_gary_protected`; `m03_victoria_fate = recruited`; `m06_architect_identity_found` + `m07_teacher_discussed`; `m07_architect_echo_heard`; `m08_nightshade_triple_agent`; `m06_monitoring_enabled` | S0 | Noor's card route (handed over); Victoria's code at the gate; "[Take Derek's file.]" at the door; send Nightshade his file; refuse, her file; read the Reading to the end and tell HaX; confession "same in your place"; notice sent in the archive; Sorensen talked | Noor warned in time (`legacy_files_saved` true via Noor); Victoria's route (§4 row 2b); Gary's hint; identity form "found, discussed" + echo line; Nightshade's call and `nightshade_shown_file`; `named`+`her_file`; `reading_finished`; `albion_notified` in the archive; `talked` |
| R3 | hard: `m05_recruiter_deal_accepted`, not confessed; `m01_maya_ko`; `m08_nightshade_ko_before_fate` (no coordinate); `m04_disclosure_choice = full`, `m04_crew_lost` | S0 | Old Coyote KO'd; Tran sees the player, guard called, Tran talked with the letters; the letters at the hatch; Sorensen KO'd before the clock; hang up on the Recruiter, the Alpha tapes; the clip and the decode; confession "afterwards"; notice held in the archive, sent at the debrief | sold-and-lied hang-up (`kept`); `refused`+`alpha_tapes`; `letters`; `legacy_files_saved` by KO; `ko`; Tran `talked`; maya_ko obstacles; no-coordinate lease line; the inquiry lines; the extra route "full with crew_lost, held then sent" |
| R4 | `m05_recruiter_deal_accepted`, not confessed | S5 → back to S4's call | deny, then take | `denied` then `taken` (extra route) |
| R5 | `m05_recruiter_deal_accepted`, not confessed | S4 | own it; say yes; **close the call between "yes" and the name** (a hit from Tran's guard, or a reload); then pull her file anyway | `told`; re-ring 2 (`resume_name`); `double_crossed`+`her_file`; the invoice line; the text at the tape room; Kowalczyk absent at the hangar and the `double_crossed` spine (extra route) |
| R6 | `m05_recruiter_deal_accepted` + `m05_recruiter_deal_confessed` | S4 | refuse, Alpha tapes | `confessed` opening; Noor's late warning (from S0 if run full) |
| R7 | `m08_nightshade_tidied`, `m08_nightshade_arrested` | S2 | "[Pull Nightshade's copy through.]" | `nightshade_copy`; the arrested wall card (briefing, from S0) |
| R8 | `m05_torres_turned`; `m06_architect_identity_found` without `m07_teacher_discussed` | S4 | read the H&L sheet; refuse, her file; briefing answer "back Quintero" (from S0) | `sleeper_shortlist`; Torres at the boxes; HaX's Quintero line; identity form "found, not discussed"; closing card line 3c |
| R9 | none, plus `m07_teacher_discussed` | S0 | route A with Noor's card cloned (the cloner's first use); Noor told (then "show her the page" variant on a second run from S4); Old Coyote told; Sorensen left; Tran left | the easy clone on a cold branch (review D-01); `noor_told`; `old_coyote_told` (both leave, desks stay); identity form "not found, discussed" |
| R10 | `m03_directive_decoded`; `m05_final_choice = public_exposure` | S0 | knock out Noor, Old Coyote, Sorensen after the clock, Tran | `noor_ko` (card drops; debrief line); `sorensen_fate = ko` with `legacy_files_saved` false; `tran_outcome = ko`; recognition line by directive; the ledger's "blown" line |
| R11 | Tier 2 sweep: `m02_reeves_fate = arrested`; `m02_paid_ransom`; `m06_irina_recruited`; `m03_danny_fate`; `m04_voltage_captured`; `m06_minder_walked`; `m08_debrief_stance = owned` | S3 → S7 | read every office file and the printed ledger | the contact sheet; the refit, rent and Danny lines; Kemal at the sheet; Netherton's "owned" line; the printed ledger shredded once read (Sorensen free) |
| R12 | none | S0 (order tests) | submit flag 2 before the cage; open the cage, stay in it, then leave (the call must wait); submit flag 3 before opening the cabinet (HaX holds the name); submit flag 4 before the scene ends | §4 rows 3, 9 and 10; `in_cage`; the hold lines |

### 12.3 Reload in each forced scene

From the matching segment: reload once **inside** each scene before its done-flag, and check it re-rings on `game_loaded` at the right point. Recruiter before any answer (re-ring 1), between "yes" and the name (R5 covers it), after she has gone (re-ring 3, HaX's `deck_resume`); the identity scene before the answer; the read on `schedule_read` (resume) and without it (restart); Tesseract's call (restart); the debrief at the notice question (it must reopen, review B2). Then, for each of HaX's scenes (`deck_resume`, the identity scene before and after the name, the read on `schedule_read`, Tesseract's call): a hit closes it, the player opens HaX's thread (her home knot shows only "Pick up. I'm ringing you.") and closes it, and the scene re-rings at its guarded knot, voiced where the scene is voiced (§6 intro, milestone M9-04).

Then the **first-ring** reloads (review B3), each inside the delay window: flag 3 submitted with the file held, reload before the scene rings; flag 4 submitted with the scene done, reload before the read; the read's last line, reload before Tesseract's call. Each must ring on load. Also: a reload inside the cage with the call due (`in_cage` cleared, the call rings on the next room entry outside the cage, review M2); the gate opened from the hub with flag 2 in, then walking into the cage (the call must **not** ring there, review M1); a reload with the call due but not yet rung; one with the invoice pending.

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
      { "taskId": "submit_catalogue_flag", "title": "Get into the catalogue server and submit the flag", "type": "submit_flags",
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
      { "taskId": "match_the_hand", "title": "Compare the hand on Nightshade's file with the notebook scan in HaX's case file", "type": "custom", "status": "active" },
      { "taskId": "stop_the_shredding", "title": "Stop Sorensen's shredding", "type": "custom", "status": "locked", "optional": true },
      { "taskId": "stop_the_tape_wipe", "title": "Stop the tape wipe in the server closet", "type": "custom", "status": "active", "optional": true }
    ] },
  { "aimId": "read_the_ledger", "title": "Read The Initiative's Ledger",
    "description": "The catalogue server keeps the Insider Threat Initiative's ledger live: placements, candidates, and an older legacy section. Pull it, and see who's still on their books.",
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
      { "taskId": "open_salvage_cage", "title": "Get through the salvage cage keypad", "type": "unlock_room", "targetRoom": "salvage_cage", "status": "active" },
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

Not made: FINALE_ARC, m10 and stages 0–3 are not this stage's to edit. Each change below is forced by the engine, the layout or round 1's review, and none changes a choice, a cost or an export.

| # | Change | Why | Where |
|---|---|---|---|
| P1 | **Tomb Beta's server stands in the salvage cage**, off the tape room. The tape room door takes the key card from the safe; the salvage cage keypad takes the decoded catalogue code. Flags 3–4, the identity scene, flag 4's read and Tesseract's call all happen in the salvage cage. Gary rings at the salvage cage keypad. The Alpha-tapes deck and the shelf-code legend are in the tape room. | A door has one lock, and a flag station or VM launcher ignores an object lock (`interactions.js:917-925, 1047-1052` vs `:1340`). The story's "card and code" needs two doors, and putting the server behind the code makes the decode required. | stage 1 Beats 3.2–3.6, §11 tables and §13 stage 5 notes; stage 0 §2.1, §2.3; FA §1.3, §1.4, §6.1 header and flag 3–4 rows; SE §6.1 |
| P2 | **The card opens the cage gate; the print opens the plan cabinet.** Sorensen locked the Architect's chest under her own print, which is why her query reads "plan chest: not listed. Keep?" Victoria's maintenance code replaces the card (the gate) only. | One lock per door; the cabinet puts the print kit inside the cage. | stage 1 Beats 2.1–2.2; stage 0 §2.2 RFID and fingerprint rows; FA §6.1 item 1, row 32 |
| P3 | **Sorensen is three records**: `sorensen_hatch` (behind the counter, a static-sprite NPC whose body reaches the counter edge so she can be talked to across it, `koImmune`), `sorensen` (in the cage, can be knocked down, holds only her card), and `sorensen_door` (hidden, `koImmune`, hosts Victoria's door scene and holds the two files). | An NPC talks only in its own room and within 32 px of its body (`constants.js:65`, `npc-reach.js`); a KO drops everything held (`npc-hostile.js:339`), which would undo the bin on Victoria's route (review B1, M5). | stage 1 Beat 2.1 staging (S-09 settled); FA §13 item 31 |
| P4 | **The cage is its own room**, so HaX's line is "…or walk out of this cage". | MC §4.3 left the choice to stage 5. | MC §4.3; FA §6.1 item 1 |
| P5 | **Noor's card opens the staff door from the front desk into the reading room, and every player can clone it** while talking to her (an easy card, the cloner's first use before Sorensen's harder one). Warned in time, she hands it over and has held the box back. | Route A must work on every branch without knocking out an innocent clerk (review D-01). | stage 1 Beat 1.2; stage 0 §2.2 RFID and social rows; FA row 62 |
| P6 | **Tran's radio sends Old Coyote to a tile beside the reading room's door** (a patrol override in the open stacks), not through the reading room. | An NPC patrols its own room; the tile is beside the door so his body can't block route B (review m5). | stage 1 Beat 1.1; FA §3.1 `m01_maya_ko` |
| P7 | **Doors that open on story events open on HaX's mappings (F19)**: the stacks door on flag 1, the office on the deck choice, the gate on Victoria's code. | One reward per flag; F19 unlocks persistently without a conversation (review M3). | stage 1 Beat 1.4, Beat 3.1 and §11 rows 1, 4; FA §6.1 flag 1 row |
| P8 | **The two "send" actions live in HaX's hub**, on the player's word: the vendor notice and Nightshade's file. | Reachable from every room until the debrief, with no engine work. | stage 1 Beats 2.2, 3.4; MC §3.5, §4.1; FA §3.4 "Set where" |
| P9 | **The tagged payments are a page of HaX's case file** (`textVariants` on `m06_monitoring_enabled`). | Objects can't appear or disappear on a global. | stage 1 Beat 1.3; FA §3.1 `m06_monitoring_enabled` |
| P10 | **The Harwick & Lowe box takes the file number on a keypad** (`password`). | A key lock falls to the picks, a PIN to the cracker. | stage 1 Beat 2.5 |
| P11 | **Sorensen's office keypad takes a code nobody has** (`password`); HaX opens it on the deck. | A `pin` door would fall to the cracker before the deck choice. | stage 1 Beat 3.1; FA §6.1 |
| P12 | **The Recruiter's call, the identity scene and Tesseract's call are voiced (F17), and only their knots (F20, committed: start knots and all they reach, never the home knot); flag 4's read and HaX's hub stay text; narration in those calls becomes HaX's asides.** | User decisions F17 and F20; narration in a phone thread isn't voiced. | stage 1 §11 rule; MC §3.2; SE §4.3 |
| P13 | Stage 1 §11's engine list gains stage 5's verdicts. | Verified in code. | stage 1 §11; FA §8 r22 |
| P14 | The second guard Tran calls in needs a name and a sprite key (cast diversity). *(Named at stage 6 §5: Lyle Dillard, Statewide Security, NPC id `archive_guard`; sprite still open.)* | New presence on the `m01_maya_ko` branch. | SE §3; FA §5.2 |
| P15 | **The PIN cracker is in the start kit**, and the briefing narrates Kowalczyk handing it over. | A `#give_item` inside the briefing gives from the briefing's host, not from Kowalczyk (`chat-helpers.js:98-113`, review M4). | stage 1 §3.4, beat 10 |
| P16 | **The safe's long-way PIN is the lease's start date, which heads every page of the rent book**, not a note in a picked drawer. *(Stage 6: the "Rent Ledger", header "Lease start: 06/02/16", PIN `060216`.)* | A same-room pick made the season's one new tool optional (review m7). | stage 1 Beat 3.1 ("the PIN is on her desk") |
| P17 | **The hand comparison is an honest three-way answer to HaX**, prompted by her text when the file is picked up, and closed in the identity scene if never answered. | It was a required task with no pointer and one correct-only option (review D-02). | stage 1 Beat 2.2 |
| P18 | **New lines for HaX**: "The ledger keeps. Her shredder doesn't. Stacks first.", "She's still feeding it.", the file-in-hand text, the three door refusals, the reel and print lines, the Victoria print line, the tapes-next-door line, one story-level VM steer per flag. Stage 7 words them. | Reviews D-02, D-04, D-06, D-09 to D-11, D-16. | SE §4.3 |
| P19 | **The Albion papers are one folder**, summarised by HaX. | Act 3's reading load (review D-07). | stage 1 Beat 3.4 |
| P20 | **Stage 6 requirement**: the salvage code's encoding is one CyberChef performs with a key, the tape room's legend supplies the key in the archive's terms, and the coded string contains none of `|`, `#`, `//`, `{`, `}` (review m-R3-4). *(Settled at stage 6 §2: `Vigenère Decode`, key `BONEYARD`, `MSJMQAEGDZNVI` → `LEWISANDCLARK`.)* | CyberChef needs a real use; a bespoke lookup isn't one (review M7, D-03). | stage 6 brief |

## 15. Open questions and items for the user

**For the user**

1. **Voicing** (F17, decided): the Recruiter's call, the identity scene and Tesseract's call, about 66 audio lines in all (§6.7), plus the two-line clip. Flag 4's read stays text; say if it should be voiced too (about 15 more lines).
2. **Engine items** still open after F17–F19 (none blocks m09):
   - flag-reward `set_global` lands client-side only until the next sync (`apply-actions.js:34-44`, `state-sync.js:59-64`), so a crash (not a reload) right after a flag could lose it; a `stateSync.sync()` after rewards would close it. m09's load backstops can't recover a global that was never saved (review m6);
   - a room's ambient sound can't follow a global, so the shredder can't fall silent when Sorensen stops (optional);
   - music events take no volume (optional).
3. **M-14:** real per-flag VM times, from one timed VM run before stage 7 (FINALE_ARC §13 item 45, the cross-mission rule; milestone A-10), so stage 8 can set the published length (§11: about 85 with the optional content, about 76 critical path).

**For the orchestrator**

- The VM plan's `system_name`s replace `catalogue_server` and `tomb_beta_server`; confirm each machine numbers its own flags from 1 (§1).
- F20 is committed (24fcb06c; `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8): start knots and all they reach, never the home knot. Stage 7 checks the voiced knots against it (§6: HaX's home knot `start`, the start knots listed there) and recounts §6.7's lines. The key names are final.
- The milestone review after stage 5 takes P1–P20 into stages 0–3, stage 6's brief and FINALE_ARC together.
- Lab-sheet URLs for the four field guides wait for the VM plan and the lab-sheet stage (§7.2).

## 16. Review round 1 outcomes

Reviews: `../stage_5/REVIEW_R1_PUZZLES.md` (B1–B4 blockers, M1–M7 majors, m1–m10 minors) and `../stage_5/REVIEW_R1_DESIGN.md` (D-01–D-08 majors, D-09–D-18 minors), with the orchestrator's rulings and user decisions F10 and F17–F19. Stage 5's §14 records the layout side of the same findings; this table records where each landed in this document.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B1 | blocker | Fixed (ruling): `sorensen_hatch` is a static-sprite NPC whose body reaches the counter edge; the clone is on every branch and in a repeatable hub choice; the hatch bell is the fallback | §4 row 2; stage 5 §3.6 |
| B2 | blocker | Fixed: the debrief trigger, backstop and hub choice key on `!report_done` | §6.5, §7.1 topic 1, §5 |
| B3 | blocker | Fixed: first-ring backstops on `game_loaded` and `room_entered` for the identity scene, flag 4's read and Tesseract's call | §4 rows 9–11, §5 |
| B4 | blocker | Fixed (ruling): segments use the extended bootstrap (`--start-room` with carried phone NPCs, `--carry-npc closing_debrief`, `--complete-task`, `--submit-flag`); dock start as the fallback | §12 |
| M1 | major | Fixed: the call's room-entry backstop excludes the cage | §4 row 3, §5 |
| M2 | major | Fixed: `in_cage` cleared on `game_loaded` | §4 row 3, §5 |
| M3 | major | Fixed (ruling, F19): doors open on HaX's `unlockDoor` mappings; door backstop topics dropped; `stacks_entered` added | §4 rows 1, 5; §5; §7.1 |
| M4 | major | Fixed (ruling): the cracker is in the start kit (P15); `cracker_given` removed | §5, §14; stage 5 §3.1 |
| M5 | major | Fixed: `sorensen_door` (hidden, `koImmune`) hosts Victoria's door scene and holds the files; `sorensen` holds only her card | §4 purge table; stage 5 §3.7 |
| M6 | major | Fixed: Victoria's topic gated on `stacks_entered`; a relay hide on `sorensen_hatch` | §7.1 topic 14; stage 5 §3.6 |
| M7 | major | Fixed (ruling): the legend moves to the tape room; the coded line goes into the notepad; the CyberChef requirement for stage 6 (P20) | §4 row 7, §8, §11 |
| m1 | minor | Fixed: the Reading is two objects (the file and its last page) | §3.4 |
| m2 | minor | Fixed: the deck uses `triggerOnInteract` | stage 5 §3.9 |
| m3 | minor | Fixed: `biometricMatchThreshold: 0.5` | §4 row 2c |
| m4 | minor | Fixed: `salvage_opened`, `stacks_entered`, `tape_room_entered` declared | §5 |
| m5 | minor | Fixed: Noor stands on the floor by the trolleys, not behind the counter; Old Coyote's override tile is beside the door | stage 5 §3.2, §3.3 |
| m6 | minor | Recorded for the user (engine) | §15 item 2 |
| m7 | minor | Fixed: the long way is the rent book's date, a read rather than a pick (P16) | §8; stage 5 §3.8 |
| m8 | minor | Fixed: `delayMs` on every ring keyed on a flag global or a minigame event | §4 rows 9–10, §6.6 |
| m9 | minor | Accepted, with a stage 9 check: the hub's tape-room and office doors share the north-west corner; each is its own tap target | stage 5 §2, §11 |
| m10 | minor | Fixed: a hidden person-type `hax_voice` for HaX's line in the clip; the called guard is revealed and turned hostile by its own conversation (no hidden hostile); the Recruiter's texts outside `npcIds` have m05's precedent | §6.6; stage 5 §3.3, §3.9 |
| D-01 | major | Fixed (ruling): Noor's card is cloneable on every branch (P5) | stage 5 §3.2, §5 |
| D-02 | major | Fixed (ruling): retitled; HaX's text on the file; the hub topic on the file alone; same / different / can't tell; closed in the identity scene if never answered (P17) | §3.2, §6.2, §6.6, §7.1 topic 11 |
| D-03 | major | Fixed with M7 | as M7 |
| D-04 | major | Fixed: trolleys and list empty in steps; the bins' line; "The ledger keeps…"; "She's still feeding it." | §4 "The purge made visible" |
| D-05 | major | Fixed: aim 3's text no longer points at the raid team; guide offers checked | §3.3, §7.2 |
| D-06 | major | Fixed: one story-level VM help topic per stage; guides under one choice; Tran retires at the cage; worst case nine showable | §7 |
| D-07 | major | Superseded by F17: three scenes voiced, the line list for the budget; Albion papers cut to one folder | §6, §6.7, §8 |
| D-08 | major | Fixed (ruling): the open stacks is 4×2 and the salvage cage 2×1, checked with `scripts/check_door_alignment.py` on a stub | stage 5 §2 |
| D-09 | minor | Fixed: three door-refusal texts | §6.6 |
| D-10 | minor | Fixed: the print line in Victoria's topic | §7.1 topic 14 |
| D-11 | minor | Fixed: the reel line in `flag1_read`; the print line on entering the cage | §6.6 |
| D-12 | minor | Fixed: Beat 2.7 fires on `deck_choice_made` with a delay | §6.6 |
| D-13 | minor | Partly fixed: the two screens are one object and the legend has moved; the notebook stays its own object because `onRead` on a page can't be told apart from the file's | stage 5 §3.5 |
| D-14 | minor | Fixed: a stub run shows every N/S door on the west corner, clear of the hatch strip on the east wall | stage 5 §2 |
| D-15 | minor | Fixed: titles reworded; the Tran topic says talking needs something he wants | §3, §7.1 topic 17 |
| D-16 | minor | Fixed: the tapes line at the end of the identity scene | §6.2 |
| D-17 | minor | Fixed: a critical-path column (about 76) | §11 |
| D-18 | minor | Fixed: the invoice waits for the office, Torres' fallback for the safe | §6.6 |

**Counts:** 39 findings (4 blockers, 15 majors, 20 minors). 36 fixed, 1 superseded by a user decision (D-07), 1 accepted with a stage 9 check (m9), 1 recorded for the user (m6). None withdrawn.

## 17. Review round 2 outcomes

Review: `../stage_5/REVIEW_R2.md` (1 blocker, 4 majors, 8 minors), with the orchestrator's rulings and user decision F20 (voice only the calls). The reviewer confirmed all 39 round 1 findings as landed. Stage 5 §15 has the same table from the layout side.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B-R2-1 | blocker | Fixed (ruling; superseded by N-R3-1: `#give_item`): `flag1_read` ends with `#add_note` carrying the coded line and HaX says she logged it; every drop terminal screen variant from flag 1 on repeats it; the keypad topic quotes it | §4 row 7, §7.1 topic 5, §8; stage 5 §3.5 |
| M-R2-1 | major | Fixed (ruling): Victoria's `cage_opened` set from `door_unlocked_by_npc` (`roomId === 'restricted_cage'`), not alongside the request; retry on `door_unlock_attempt`; `game_loaded` backstop `maintenance_code_used && !cage_opened` → `unlockDoor` | §4 row 2b, §5 |
| M-R2-2 | major | Fixed (ruling): `cooldown: 0` on both `in_cage` setters; `!in_cage` dropped from ring (a) | §4 row 3, §5 |
| M-R2-3 | major | Resolved by F20: the three calls stay on their existing hosts; only their knots are voiced; voiced knots never divert into the hub; the two narrator lines became HaX's asides; recount about 66 (Recruiter 14, HaX 49, Netherton 3) | §6 intro, §6.1, §6.4, §6.7, §7, §14 P12 |
| M-R2-4 | major | Fixed (ruling): S6 and S7 start in `tape_room`; S6 carries `netherton` (now `director_netherton`); S7 carries `closing_debrief`, `netherton`, `kowalczyk`, `hax_voice` (the debrief's host and speakers; the narrator is a voice block); a note that a 1-GU start room flips door parity | §12 |
| m-R2-1 | minor | Fixed: scene-opening backstops on `room_entered` only (one event per scene on reload); unlock backstops on `game_loaded` | §4 rows 9–11, §5 |
| m-R2-2 | minor | Fixed: the debrief restarts at its knot; `debrief_notice_before` copied in HaX's "[Bring me in.]" knot; answered beats skipped on a replay; "resumes" wording corrected | §5, §6.5 |
| m-R2-3 | minor | Fixed: Recruiter re-rings 1–2 exclude `data.nextRoom === 'restricted_cage'` | §6.1 |
| m-R2-4 | minor | Fixed in stage 5 (staging); the purge line moved to the stamp | §4; stage 5 §3.6 |
| m-R2-5 | minor | Fixed: "Two samples. One pen." gated on `bin_chosen and cage_bin == "derek_file"` | §7.1 topic 11 |
| m-R2-6 | minor | Fixed: row 1 no longer claims to recover a lost flag global; in-session retries on `door_unlock_attempt` for the stacks, the gate and the office | §4 rows 1, 2b, 5 |
| m-R2-7 | minor | Fixed: the walking note says route B's crossing stays about seven tiles; Old Coyote's round crosses it every lap | §11; stage 5 §3.3 |
| m-R2-8 | minor | Fixed: final key names, the F19 fallback wording gone, stage 5's P1 and spacing | §0, §1; stage 5 §3.10, §12 |

**Counts:** 13 findings. 12 fixed, 1 resolved by F20 (M-R2-3). None withdrawn.

## 18. Review round 3 outcomes

Review: `../stage_5/REVIEW_R3.md` (2 majors, 4 minors), with the orchestrator's rulings. No further review round; the orchestrator checks directly.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| N-R3-1 | major | Fixed (ruling): `flag1_read` ends with `#give_item:notes:catalogue_salvage_line` from HaX's `itemsHeld` instead of `#add_note` (engine bug in `NPCGameBridge.addNote`, going to the user separately); the screen variants and the keypad topic's quote stay | §4 row 7, §6.6, §8; stage 5 §3.5 |
| N-R3-2 | major | Fixed (ruling): `!in_cage` back on ring (a); both `in_cage` setters moved onto `recruiter`, listed before (a), so the clearing setter runs first | §4 row 3, §5 |
| m-R3-1 | minor | Fixed: "F20 (in progress)" throughout; no `batch_generate` before it lands (superseded at the stages 4–5 milestone: F20 committed, §0, §6) | §0, §6, §14 P12, §15 |
| m-R3-2 | minor | Fixed: §0 item 3 and stage 5 §4.3 say room entry for scenes; stage 5 §10 items 1 and 27 corrected; S6's start wording corrected | §0, §12.1; stage 5 §4.3, §10 |
| m-R3-3 | minor | Fixed: `cage_opened` also set on entering the cage when still false | §5 |
| m-R3-4 | minor | Fixed: the coded string avoids `|`, `#`, `//`, `{`, `}` | §4 row 7, §14 P20 |

**Counts:** 6 findings, all fixed. Stages 4–5 complete.


## 19. Stages 4–5 milestone fixes

Applied 2026-10-21 from the four parts of the stages 4–5 milestone review (`../../../finale/MILESTONE_S4-5_PART_a3b55ab0.md` (M9-), `_a70c75bc.md` (F-), `_a551d638.md` (A-); `_a3237d9b.md` is m10's and has nothing for m09's files) and the orchestrator's rulings in `scenarios/FINALE_DEV_LOG.md`. F20's rule is from `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8. Only m09's six stage documents were edited. "s0" is `../stage_0_initialization.md`, "SA" `../stage_1/story_arc.md`, "SE" `../stage_2/storytelling_elements.md`, "MC" `../stage_3/moral_choices.md`, "S5" `../stage_5/room_layout.md`.

| Finding | Fix | Where |
|---|---|---|
| M9-01 `in_cage` setters | Globals row: two mappings on `recruiter`, before ring (a), `cooldown: 0`; HaX clears on load; read by (a), (b), (c) | §5 |
| M9-02 "sent in the archive" from a first-line temp | `debrief_notice_before` everywhere; topic 1 does the copy | §4 row 13, §7.1 topic 1; SA §7.1 item 5; MC §3.5, §8, §10 (two rows), §13 S3-16 note |
| M9-03 bin files on Victoria's tidied route | `sorensen_hatch` and `sorensen_door` both hold `derek_file`, `letters`, `nightshade_copy`; "[Take Nightshade's copy.]" on tidied; give by id | §8; S5 §3.6, §3.7, §8; SA Beat 2.1; MC §3.1 |
| M9-04 HaX's forced calls reopened after a hit | Ruling: guarded resume knots (`deck_resume`, `identity_resume`, `hour_read_resume`), no `resume`; re-rings also on `conversation_closed:agent_0x99`; her home knot shows only "Pick up. I'm ringing you." while a scene is pending; new globals `identity_name_said`, `hour_read_choice_reached`; a browser test | §6 intro, §6.1–§6.4, §5, §7, §12.3; S5 §10 items 3, 15, 17, §11; SA §11; s0 design notes |
| M9-05 PIN "from her desk" | "the rent book's date" *(stage 6: the rent ledger's, `060216`)* | §3.4 |
| M9-06, F-08, A-05 F20 "in progress" | Committed (24fcb06c); the home-knot rule quoted; HaX's home knot `start`; start knots listed; every voiced ring names a `targetKnot` | §0, §6 intro and Voicing, §7, §14 P12, §15; S5 §0, §10 items 4 and engine note; SA §11 voicing, §13; s0 design notes; record rows annotated |
| M9-07 "Escape, damage" | "a hit, or a reload" | SA Beat 2.4, §11 |
| M9-08, F-06, A-08 "chest" trigger | "Nightshade's file picked up (`nightshade_file_held`)" | §4 purge table; s0 §2.2; MC §10, §13 S3-05 note |
| M9-09 warned-in-time route | Added | s0 §2.2 |
| M9-10 the bin pair and default | Derek's file against the letters (copy on tidied), default `derek_file` | s0 §2.2 |
| M9-11 `threat` for Sorensen | "only if attacked" | SE §6.2 |
| M9-12 "three sizes" | "four sizes" | S5 §0 |
| M9-13, F-07 m10 count 67 | 90 (Tier 1 40, Tier 2 50), 67 marked as stage 3's | SA §9; MC §10, §11 change 2 |
| M9-14 `mission_complete` | `report_to_netherton` and `report_done` | SA §7.1 item 8 |
| M9-15 "Finish with me first." | Cut (no state reached it); hold texts split: no file → "His file first…"; file but no flag 3 → an owner-first line (stage 7 words it); started scene → re-ring | §4 row 10; SA Beat 3.5, §18 R4-04 note; SE §4.3 |
| M9-16 card line 4a | "His vendor notice: sent tonight." | §9 |
| M9-17 Beat 3.4 minutes | 1 minute (Act 3 sums to 31) | SA Beat 3.4 heading |
| M9-18 "Saved at the hatch" | "Saved from the bins:" | §9 credits |
| M9-19 legacy files "picked up" | "kept from the shredder" (they stay readable objects) | §9 credits |
| M9-20 Nightshade's text back | `nightshade_phone` mapping on `nightshade_shown_file`, two variants by `cage_bin` | §6.6; MC §4.1 |
| M9-21 "[Show her the page.]" gate | Gated on `printed_ledger_read`; the read survives the shredding *(stage 6 C-06: now `ledger_page_seen`, a read after flag 2)* | §5; SA Beat 1.2; MC §4.2 |
| M9-22 Alpha annotations decode | On the CyberChef workstation; stage 6 picks the encoding *(stage 6: `Vigenère Decode`, key `ALPHA`, gated on `identity_scene_done`)* | §8; S5 §3.9; SA Beat 3.2 |
| M9-23 flag 4's documents | New readable `mirror_job_printout` in the salvage cage on `flag4_submitted` | S5 §3.10; SE §5.1 |
| M9-24, F-12 two "Agent HaX" records | Ruling: `hax_voice` kept with the same `voice` and `fx`; stage 9 tests whether the phone contact resolves and drops it if so | S5 §3.1, §8, §11 |
| M9-25 "catalogue entry" | "the coded salvage line" | §2 |
| M9-26 seeded doors | The cage gate's `game_loaded` backstop added | §12 |
| F-04 topic 10 retires on Hold | After Hold, the send alone stays until `nightshade_shown_file` or `start_debrief` | §7.1 topic 10, §5; MC §4.1 |
| F-05 `letters` payoff | HaX's line at the server-hall prop, m10's | MC §10, §11 change 28; SA §20 note |
| F-10 bare card and credit conditions | `globalVars.` throughout | §9 |
| F-11 Netherton's id | `director_netherton` (matches m08, m10; rename rule; old id noted where it stood) | §6.7, §12.1; S5 §3.1, §8, §10 item 4; record rows annotated |
| F-14 `cage_opened` re-emit | `&& !globalVars.cage_opened` on the gate's `door_unlocked` mapping | §4 row 2 |
| F-17 unmarked `#add_note` rows | "(superseded by N-R3-1: `#give_item`)" | §17 B-R2-1; S5 §15 B-R2-1 |
| A-10 timed VM run | Before stage 7, as FINALE_ARC §13 item 45 | §15 item 3 |

**Left, not m09's files:** FINALE_ARC's copies (§8 r22, §18 F20 status; FA:489 "at the plan cabinet"; FA:499 garbled trigger) are the FINALE_ARC agent's.

**Left for later stages:**
- Stage 6: the three bin files' text; `mirror_job_printout`'s layout; the Alpha annotations' encoding; where the Citadel incident file lives, or drop it (SA §3.4 note). *(All done at stage 6; the incident-file note is dropped to m10.)*
- Stage 7: the owner-first hold text; the resume knots' one-liners ("Still here. Netherton too.", the read's); "Pick up. I'm ringing you."; the recount of §6.7 after the F20 walk.
- Stage 9: the `hax_voice` registry check; the hit-reopen-close browser test for HaX's scenes.

**Sweep.** Grepped all six docs for: "in progress", "up to the hub", "being built", "boundary rule", "chest", "67", "Escape", `mission_complete`, `netherton` as an id, "sent in the archive", the desk PIN, `#add_note`, "Tran's handler", "ink temp", "Finish with me", "nine years late", "three sizes", "at a terminal". What still matches is a history row marked as superseded, Sorensen's own pencilled "plan chest", m05's `mission_complete` cited as the debrief pattern, the `report_to_netherton` task id, a box on Noor's desk, the rent book on Sorensen's desk, and MC C-13 and SE's notice text, which keep "nine years late" for m10.

**Counts:** 33 m09 findings taken (26 M9-, 10 F-, 3 A-; M9-06 with F-08 and A-05, M9-08 with F-06 and A-08, M9-13 with F-07, and M9-24 with F-12 each counted once). All 33 fixed. None withdrawn.

## 20. Stage 6 folded in

Source: `stage_6/lore_fragments.md` (complete; §6.1 ids and wiring, §3 codes, §7–§8 review outcomes). Applied to stage 0, SA, SE, MC, S4 and S5 on 2026-10-21. Stage 6 §1 is the authority for every fixed readable string; where an earlier doc still quotes a draft, §1 wins. No choice, cost or lock order changed.

**Ids and wiring (stage 6 §6.1).**
- New notes `the_reading_2`, `the_reading_3`, `the_reading_4` in `director_safe` (C-08). `take_the_reading` still targets `the_reading` only; no new task (§3.4 here; S5 §3.8).
- New global `ledger_page_seen` (default `false`), set by HaX on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted`, `delayMs: 500` (C-06). The printed ledger's shredded variant keys on `ledger_page_seen && sorensen_fate === 'left'`; Noor's "[Show her the page.]" keys on `ledger_page_seen` (§4 purge table, §5 globals; SA Beats 1.2 and 2.3; SE §3; MC §4.2; S5 §3.7).
- Safe PIN `060216` (was `020616`): the rent ledger's header "Lease start: 06/02/16", digits as printed (C-20; s0, SA Beat 3.1, SE §5.3, MC, §3.4 and §8 here, S5 §3.8 and §4).
- New observation-only objects `clerk_certificate` (Sorensen's office) and `hl_bay_label` (open stacks) (W6-09, C-14, C-15; §8 here; S5 §3.3, §3.8).
- Read in place (`notes`, `takeable: false`, `readable: true`): `rent_book`, `danny_sheet`, `refit_ledger` (C-15; §8 here; S5 §3.8). `incident_book` and `case_file` noted the same way in S5.
- `alpha_annotations` readable only on `deck_pulled === 'alpha_tapes' && identity_scene_done` (C-11; §8 here; S5 §3.9; SA Beat 3.2).
- Display names: "Rent Ledger", "Build-Out Ledger", "Placement Record, HL2015-0477", "Incident Log" (W6-16), carried into every target doc's player-facing mentions; the closing card's line 3c reads "placement record".
- The bin files keep their ids (`derek_file`, `letters`, `nightshade_copy`) as fixed strings; `cage_bin` and m10's readers are unaffected (C-07). MC's "never played" and import rows now say the m01 value is read back by the Reading's page 1 and HaX's ink, not by Derek's page.

**Codes and names (stage 6 §2, §3, §5).** Salvage code: "SALVAGE CAGE ACCESS" with `MSJMQAEGDZNVI` on its own line (C-01); `Vigenère Decode` of the code line only, key `BONEYARD` (the legend's Salvage row, bay 12), keypad `LEWISANDCLARK` (§4 row 7, §7.1 topic 5, §7.2 field guide, §8; s0; SA Beats 1.4 and 3.2; SE §5.3; S5 §3.5, §3.9, §4, §5). Alpha annotations: same operation, key `ALPHA`. HaX's topic 5 lines and Gary's line are stage 6 §2.3's (here §6.6 and §7.1; SA; SE §2 and §4.3). Called guard: Lyle Dillard, Statewide Security, NPC `archive_guard` (s0, SA, SE §3 and §9, MC, here §5, S5 §3.3 and §8). Noor's codename LINNET; course STRAT-204; Tran's handler D. Varga, courier J.T.; vendor Carrow Controls, RM-4, VH-2017-0312; the bunker's deed: Sun River Regional Control Site, Lewis and Clark County, lessee Big Sky Holdings LLC, from June 2, 2016. "06:00 UTC" on the casualty sheet's release configuration. US usage on American documents (the archive's, the lease, the ledgers, the H&L record, the guard's log, the letters).

**Stale copies swept.** The old PIN, the one-line coded string ("salvage cage: access"), the placeholder "Stage 6 picks/writes" briefs (now marked settled), "Printer tray, empty.", the guard's "Hey! Stay where you are.", "residential care" in live text, "rent book"/"refit ledger" in live text, "in the spring" (Victoria's keys now "after Cardiff", C-21; the m05 deal and Torres' line now "last spring", per stage 6 §3.1), "Same coordinate" (now "Same site"), and `#add_note` (only negations and superseded history rows remain). Review and history tables were left as written, with a settled note added where a row was an open brief.

**For stage 7** (not ink here): HaX's document remarks are ink (W6-02, stage 6 §6.5; listed in SA §13 stage 7 and SE §9). Sorensen's hatch recognition on `expose` and `surrender` now repeats Derek's file and the Reading's page 1 (W6-17): give her another angle or cut it there (noted at SA Beat 2.1 step 3, SE §3, SE §9).

**Not folded here (other owners).** Stage 6 §6.2 (FINALE_ARC), §6.3 (m10: the rota's D. Varga, the bunker, Carrow, "UTC") and §6.4's canon-file items (`the_architect.md`: U1 and the same-lecture note). The cracker incident-file note is dropped from m09 and recorded as m10's (SA §3.4 and §12 row 3). Dillard's sprite is still open.

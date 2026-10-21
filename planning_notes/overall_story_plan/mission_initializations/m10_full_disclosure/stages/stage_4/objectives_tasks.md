# m10 Full Disclosure: Stage 4, player objectives

## 0. Status, sources and conventions

Stage 4, draft 1, 2026-10-21. Author: stages 4+5 author (Opus). Companion: `../stage_5/room_layout.md` ("RL §n"), which owns rooms, ids, positions and the engine verdicts this file relies on.

Built on `../stage_0_initialization.md` ("s0"), `../stage_1/story_arc.md` ("arc", including §20), `../stage_2/storytelling_elements.md` ("SE"), `../stage_3/moral_choices.md` ("MC", the authority for every choice, cost and global), and `../../finale/FINALE_ARC.md` ("FA", §1–9, §13, §17). The prompt is `story_design/story_dev_prompts/04_player_objectives.md`; where it differs from the newer standards, these win: `mission-alignment-plan` (staged, spoiler-safe aims; HaX's progress-gated hub), `scenario-design-review` §2g (no dead zones; action titles; a pointer for every task), `mission-puzzle-chains` (convergence only through `unlockCondition` and `concludeRequires`), `README_scenario_design.md` "Authoring Rules", `tools/pass2/PASS2_LESSONS.md`. The model is m08's objectives block (`scenarios/m08_the_mole/scenario.json.erb:328-556`), whose shape this file copies: `aimId` / `title` / `description` / `status` / `order` / `unlockCondition`, tasks with `taskId` / `title` / `type`.

No VM material was opened. Flags are named by story meaning: flag 1 the foothold on the security monitoring host; flag 2 the staging schedule; flag 3 out of the release service's container; flag 4 the core host.

Engine facts this file depends on (checked in code; RL §6 has the evidence):

- **No eventMapping action unlocks a door.** A door opens persistently only through a flag reward `unlock_door` (server, `games_controller.rb:2231`) or an ink `#unlock_door:<room>` from an NPC the player has met whose record lists the room in `unlockable` (`game.rb:1247-1270`; m02 and m06 use it). So every "door that opens on a done-flag" in MC is built as **an ink unlock from HaX's phone thread** (HaX is met from the start), fired by a mapping that opens her thread on the done-flag. This replaces MC rule 1.5's "eventMapping firing `unlock_door`" wording.
- **Mappings live on NPCs and register when the NPC's room loads.** Every mapping that must hear an early event sits on HaX (`agent_0x99`, listed in the start room).
- **Conditions take `&&` only** (eventMappings and object variants); music and credits conditions are JavaScript.
- **One flag, one reward**; a flag's station is the first station whose `flags` list holds it, and its task id is station-qualified with the flag's index *in that station's list* (`games_controller.rb:2407-2528`).
- **`concludeRequires.globals` counts only boolean `true`**, so `ending` (a string) never goes in it.
- Person-chat state does not survive a reload (it restarts at the start knot); phone threads do. Every forced face-to-face scene therefore re-enters on globals, never on saved ink position.

Conventions: UTC on every clock; WREN gets no pronoun before the accusation; "the power room"; ids are working names that stage 9 may rename under the rename rule. "Pointer" means the in-world line, bark or object that tells the player a task exists.

## 1. How the player always knows the next step

The raid is one corridor of rooms (RL §1), so "where next" is rarely the question; "what does this room want from me" is. Five rules carry it.

1. **One aim per stretch of the map, always one visible.** Six main aims follow stage 0's staging (s0 §6) plus the conclusion: the perimeter, below ground, the power, the release, the core, the end. Each unlocks with `aimCompleted` on the one before, so the next aim is visible the moment the last required task of the previous one ticks; there is never a moment with every visible task done. The optional WREN aim runs beside them from the private aside.
2. **Every task has a pointer said aloud before it matters** (§3's last column): HaX's line at the beat, a person in the room, or a readable on the critical path. No required task depends on the player opening the objectives panel.
3. **Forced scenes are announced by the thing that holds the player.** The four done-flag doors (RL §3) each have a line on the closed door, by HaX or the narrator, naming what opens it ("The breach waits on Netherton. Finish at the table.").
4. **Status answers follow progress** (README "Common bugs"). HaX's "[Where are we?]" topic branches on the done-flags and flags down to the step the player is on (§5).
5. **Titles name the action, never the answer** (scenario-design-review §2g): no task names WREN, the wrong entry in Nightshade's payment, which share to kill, or what the database choice should be. The WREN aim is "Find the sleeper", and its tasks are the clues, not the name.

Two places the player could lose the thread, and what holds them:

- **The gallery (HaX jammed).** Her last line before the jam names the next door and the one warning the gallery needs (arc §6.5); the aim "Reach the core" is already visible, with "Get through the outer lock" as its open task; the walkway's countdown object shows the share status, so the player can read the state without her.
- **The core between flag 4 and his case.** The case is gated on flag 4 (arc §9.3); walking to him early gets "Finish on my box first. I'll keep.", and the task list shows "Take the core host" until flag 4 is in, then "Hear him out".

## 2. Aims and tasks (JSON-ready)

Six main aims, one optional aim. 27 tasks: 18 required, 9 optional. Every task ships `"status": "active"` except the backdoor task (locked until its channel exists), because a locked aim reveals itself when any of its tasks completes and `unlockAim` activates only the first task (PASS2 lessons 27 and 33). `<vm>` stands for the VM's `system_name`, which the VM plan fixes; station ids are RL §2's.

```json
"objectives": [
  { "aimId": "breach_the_perimeter", "title": "Breach The Perimeter",
    "description": "Netherton runs the briefing at the forward post. Settle the business at the table, then get a foothold on the bunker's security monitoring from the gate terminal. The breach goes when both are done.",
    "status": "active", "order": 0,
    "tasks": [
      { "taskId": "take_the_briefing", "title": "Take Netherton's briefing at the forward post", "type": "custom", "status": "active" },
      { "taskId": "settle_the_table", "title": "Finish the business at the table", "type": "custom", "status": "active" },
      { "taskId": "submit_flag_1", "title": "Get a foothold on the security monitoring host and submit it at the gate terminal",
        "type": "submit_flags", "targetFlags": ["gate_terminal:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "go_through_the_blast_door", "title": "Go through the blast door", "type": "enter_room", "targetRoom": "blast_tunnel", "status": "active" }
    ] },
  { "aimId": "get_below_ground", "title": "Get Below Ground",
    "description": "Through the tunnel to the security office, the first room below. The stair down to the workshop floor is behind it.",
    "status": "locked", "order": 1, "unlockCondition": { "aimCompleted": "breach_the_perimeter" },
    "tasks": [
      { "taskId": "reach_security_office", "title": "Get past the tunnel post to the security office", "type": "enter_room", "targetRoom": "security_office", "status": "active" },
      { "taskId": "answer_the_handset", "title": "Answer the duty handset", "type": "custom", "status": "active" },
      { "taskId": "take_the_stair_down", "title": "Take the stair down to the workshop floor", "type": "enter_room", "targetRoom": "workshop_floor", "status": "active" }
    ] },
  { "aimId": "cut_the_gallery_power", "title": "Cut The Gallery's Power",
    "description": "The gallery's blast shutter runs off the old power room. Get through the workshop floor, then have the shutter cut: by whoever runs the power room, or by hand.",
    "status": "locked", "order": 2, "unlockCondition": { "aimCompleted": "get_below_ground" },
    "tasks": [
      { "taskId": "read_the_casualty_sheet", "title": "Read the casualty sheet pinned above the bench", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "reach_power_room", "title": "Get through the workshop to the power room", "type": "enter_room", "targetRoom": "power_room", "status": "active" },
      { "taskId": "cut_the_shutter", "title": "Get the gallery's blast shutter cut", "type": "custom", "status": "active" }
    ] },
  { "aimId": "find_the_release", "title": "Find The Release",
    "description": "The release runs from the old command room. Take the schedule, then get under the release service to arm the disarm. The console there can do one thing about the cells' head start before it goes.",
    "status": "locked", "order": 3, "unlockCondition": { "aimCompleted": "cut_the_gallery_power" },
    "tasks": [
      { "taskId": "reach_server_hall", "title": "Get into the server hall", "type": "enter_room", "targetRoom": "server_hall", "status": "active" },
      { "taskId": "submit_flag_2", "title": "Take the staging schedule and submit it at the release console",
        "type": "submit_flags", "targetFlags": ["release_console:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "submit_flag_3", "title": "Get out of the release service onto its host and submit it at the release console",
        "type": "submit_flags", "targetFlags": ["release_console:<vm>-flag2"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "use_the_console", "title": "Use the release console on the head start: kill one share, or trace one", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "close_the_backdoor", "title": "Close the backdoor channel from the release console", "type": "custom", "optional": true, "status": "locked" }
    ] },
  { "aimId": "reach_the_core", "title": "Reach The Core",
    "description": "Up the stair and along the gallery to the core's outer lock. HaX can't reach you up there. He is waiting at the release console.",
    "status": "locked", "order": 4, "unlockCondition": { "aimCompleted": "find_the_release" },
    "tasks": [
      { "taskId": "cross_the_gallery", "title": "Climb to the gallery", "type": "enter_room", "targetRoom": "gallery", "status": "active" },
      { "taskId": "open_the_outer_lock", "title": "Get through the core's outer lock", "type": "custom", "status": "active" },
      { "taskId": "submit_flag_4", "title": "Take the core host and submit it at its terminal",
        "type": "submit_flags", "targetFlags": ["core_host_terminal:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "hear_him_out", "title": "Hear him out", "type": "custom", "status": "active" }
    ] },
  { "aimId": "end_it", "title": "End It",
    "description": "The release console, the database and the man. Each choice is yours, and each one costs someone. Then the forward post at six.",
    "status": "locked", "order": 5, "missionConclusion": true,
    "concludeRequires": { "tasksCompleted": ["submit_flag_1", "submit_flag_2", "submit_flag_3", "submit_flag_4"] },
    "conclusionScreen": { "type": "bond_visualiser" },
    "unlockCondition": { "aimCompleted": "reach_the_core" },
    "tasks": [
      { "taskId": "decide_the_console", "title": "Decide what happens at the release console", "type": "custom", "status": "active" },
      { "taskId": "decide_the_database", "title": "Decide what happens to the database", "type": "custom", "status": "active" },
      { "taskId": "decide_his_end", "title": "Decide how it ends for him", "type": "custom", "status": "active" },
      { "taskId": "close_the_night", "title": "Report at the forward post", "type": "custom", "status": "active" }
    ] },
  { "aimId": "find_the_sleeper", "title": "Find The Sleeper (Optional)",
    "description": "One of tonight's team was placed eleven years ago. Netherton won't tell them you know. Find them before you reach the core, or don't.",
    "status": "locked", "order": 6, "unlockCondition": { "globalVariable": "whodunit_live" },
    "tasks": [
      { "taskId": "read_the_door_log", "title": "Read the door log at the security office's monitoring desk", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "check_the_alibis", "title": "Work out who nobody could see at ten past two", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "read_the_bench_log", "title": "Read the bench log on the workshop floor", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "name_the_sleeper", "title": "Name the sleeper, or decide not to", "type": "custom", "optional": true, "status": "active" }
    ] }
]
```

Notes on the shape:

- **`decide_his_end` completes on any `ending`**, including `scorched` and `joined`, where the end-for-him menu never opens: the pick that set `ending` is the decision. So all four `end_it` tasks complete on every ending, and the score never punishes an ending.
- **`close_the_night` completes on the last line of the closing scene** (the 06:00 cutscene; the hearing on Scorched Earth; the Citadel on Join), never on a pick, so the visualiser follows the scene (README "Flags and tasks", PASS2 lesson 46). It is what "the ending scene completes the conclusion task" (MC §8.1) means in the engine.
- **The station ids carry the flag's index within that station's list** (§0), so flag 3 is `release_console:<vm>-flag2`. If the VM plan splits the network into more than one VM, only these four strings and RL §2's `acceptsVms` change.
- **The WREN aim's `whodunit_live`** is a local boolean written once at `game_loaded` from the imports (`not (m09_sleeper_named and m09_recruiter_offer in {taken, double_crossed})`), the same allowed form as `sleeper_caught` (MC §12). A `globalVariable` unlock keeps the aim hidden on the two named branches. If the validator reads that as an import gate, the fallback is `"status": "locked"` with no unlockCondition and an `unlockAim` mapping on HaX at the aside.
- **Failure states:** none. Join is MISSION FAILED in the credits but concludes normally (`decide_*` complete); every other ending is MISSION COMPLETE. No clock ends the mission.

## 3. Every task: trigger, unlock and pointer

"Trigger" is what completes the task; all mappings named are on HaX (`agent_0x99`, start room) unless stated. "KO / reload cover" says what happens when the usual trigger can't fire.

| Task | Trigger | What it unlocks or opens | Pointer (said before it matters) | KO / reload cover |
|---|---|---|---|---|
| `take_the_briefing` | `#complete_task` on the briefing cutscene's first line (Netherton's `timedConversation`, `waitForEvent: game_loaded`, `skipIfGlobal: briefing_played`, `setGlobalOnStart: briefing_played`) | nothing directly; the door scene is open from the start | the cutscene opens on load | first-line completion; a reload never replays it |
| `settle_the_table` | mapping `global_variable_changed:door_scene_done` (value true) → `completeTask` | half of the breach (§4.1) | HaX after the aside, by branch (SE §3.5): "Nightshade's at the table." / "Netherton has a question about the van." | holder is `koImmune` (RL §2.1); a walk-away resumes at the closing choice because the knot re-enters on `door_scene_done` |
| `submit_flag_1` | server, on submission at `gate_terminal` | flag reward `set_global flag1_submitted`; the other half of the breach; clue 1 readable | HaX: "The gate terminal's yours. Get me their monitoring." Field-guide offer live from the start | server-authoritative |
| `go_through_the_blast_door` | `enter_room blast_tunnel` | completes the aim; `get_below_ground` shows | the breach call (§4.1): "Door's open. Go." | the door's unlock is persisted, so a reload keeps it open |
| `reach_security_office` | `enter_room security_office` | Ghost's handset rings on entry (§4.2) | the tunnel's inner door is the only way on | tripwire branch: the ladder object (RL §2.2) |
| `answer_the_handset` | mapping on `ghost_call_done` → `completeTask` | the stair down (§4.2) | the ring itself; a closed door line: "The stair's on their system. Whoever's on that phone has it." | phone thread saved server-side; re-ring on leaving the room and on `game_loaded` (`resume: true`) |
| `take_the_stair_down` | `enter_room workshop_floor` | completes the aim | HaX's unlock line: "Stair's open. Workshop floor's below you." | – |
| `read_the_casualty_sheet` | the sheet's `onRead` sets `casualty_sheet_read`; mapping → `completeTask` | the first rebuttal's evidence; Voltage's talk-down option | Imran or Gary points at it ("Read what's pinned over my bench."); HaX: "That's his sheet. Read it." | a readable object, no NPC needed |
| `reach_power_room` | `enter_room power_room` | – | the power-room door's sign; HaX: "Whoever's in the power room runs your lights." (said after flag 1) | four ways through (RL §2.4); the hatch needs nobody |
| `cut_the_shutter` | mapping on `gallery_shutter_cut` → `completeTask` (set in the slot-holder's ink, or by the by-hand cut) | completes the aim | the slot-holder offers it; the phone voice on the default branch | slot-holder KO: the by-hand cut is an ink choice on the phone voice's thread, so it needs nobody in the room (RL §2.5) |
| `reach_server_hall` | `enter_room server_hall` | – | the power room's only onward door | – |
| `submit_flag_2` | server, `release_console` | flag reward `set_global flag2_submitted`; console options; schedule readable; arrested Victoria's line rings | HaX on entering: "That console takes what you pull from the staging copy." | server-authoritative |
| `submit_flag_3` | server, `release_console` | flag reward `unlock_door gallery` (persisted); mapping on `objective_task_completed:submit_flag_3` sets `flag3_submitted` (disarm armed) | HaX at the sealed section's hatch before flag 3 (FA §6.2) | server-authoritative |
| `use_the_console` (optional) | mapping on `global_variable_changed:head_start_killed` (value not `""`) | the share display globals (§6) | HaX after flag 2 and leaving the hall (arc §6.3) | skipping it is the warned cost |
| `close_the_backdoor` (optional, locked) | unlocked by mapping on `flag2_submitted` with `backdoor_channel_live`; completed on `backdoor_closed` | `partial_release` stays `none` | HaX after flag 2, with the count | a task, free |
| `cross_the_gallery` | `enter_room gallery` | `hax_jammed = true` (§5) | HaX's last line before the jam names the stair and the walkway | – |
| `open_the_outer_lock` | mapping on `outer_lock_open` → `completeTask` (§4.4) | the head start goes; Quintero placed at the lock | the lock's door sign; the barks | four ways through (§4.4) |
| `submit_flag_4` | server, `core_host_terminal` | flag reward `set_global flag4_submitted`; his case opens | Tesseract: "Get on his box. He'll keep." (HaX's line, said through him) | server-authoritative |
| `hear_him_out` | mapping on `exchange_3` (value not `""`) | the console menu | walking to him after flag 4 opens the case | Tesseract `koImmune` for the whole scene (RL §2.8) |
| `decide_the_console` | mapping on `console_choice` set | the database menu | his console menu | the core resumes on globals (MC rule 1.11) |
| `decide_the_database` | mapping on `database_outcome` set | step 5 (not after wipe or Join) | Netherton and HaX state each cost before the menu | as above |
| `decide_his_end` | mapping on `ending` set | the closing scene | the menu, with Netherton's F13 line first | as above |
| `close_the_night` | `#complete_task` on the closing scene's last line | the credits event (§7) | the scene plays itself | a `game_loaded` backstop on HaX re-opens the closing scene when `ending` is set and the task isn't done (m08's E7 pattern) |
| `read_the_door_log` (WREN) | the log's `onRead` sets `clue_door_log`; mapping → `completeTask` | the accusation topic in HaX's hub | HaX after flag 1: "The office keeps a door log. Their desk will read it now." | readable object |
| `check_the_alibis` (WREN) | mapping on `clue_alibi` (set by HaX's alibi topic, or by a helper: `nightshade_deal = taken`, the shown or not-shown payment, `m09_sleeper_shortlist` at the aside) | – | HaX after clue 1: "So who wasn't where somebody could see them at ten past?" | phone thread |
| `read_the_bench_log` (WREN) | the bench log's `onRead` sets `clue_bench_log`; Phantom's list sets the same global when he hands it over | – | Imran talked round names it; HaX: "That's a cloner in our own breaching kit. The sign-out sheet's on the table here." | readable object |
| `name_the_sleeper` (WREN) | mapping on `accused` or `officer_out` set, or on `wren_at_core` with `accused = ""` | – | HaX after the third clue: "That's three things that point somewhere. Your call, and you don't have to make it." | an untaken accusation completes at the core, so the optional aim always closes |

**Edge cases, out of order.**

- **Flag 1 before the door scene, or after.** Either order works (§4.1).
- **Clue 2 before clue 1.** HaX's alibi topic shows only after `clue_door_log`; helpers set `clue_alibi` whenever they speak, and the task waits, already done, in the hidden-until-unlocked aim.
- **The casualty sheet skipped.** The workshop's people point at it and the power-room door is past the bench, but a player can still walk by. A required task here would hold aim 3 open and hide aim 4 while the player stands in the server hall (a dead zone), so the task is marked `"optional": true` in the JSON above. The rebuttal is on his menu either way (FA §4.1); without the sheet it lands on his word alone. HaX nudges once on entering the server hall ("You walked past his sheet. It's worth the minute.").
- **Flag 3 before flag 2.** The station accepts either first; the gallery opens on flag 3 alone; HaX's head-start lines wait on flag 2, so a player who reverses them still hears the console warning as they leave.
- **Aim 5's tasks before aim 4 completes.** Impossible: the gallery door opens only on flag 3.

## 4. The locks that force the story

**The one pattern for a story door.** The door is a room lock of type `rfid` whose `requires` names a card that exists nowhere in the scenario (`tg_story_lock_<room>`), so neither a pick, the cracker nor the cloner opens it, and its `door_sign` says what does. It opens only by `#unlock_door:<room>` in HaX's phone ink (her record carries `"unlockable": ["blast_tunnel", "security_office", "workshop_floor", "gallery"]`). A HaX mapping opens a short knot when the condition holds; the knot's first tag is the unlock and its first line names it. Three mappings per door: one per global that completes the condition (each conditioned on the other), plus `game_loaded` with the full condition and `!<door>_open`, so a reload mid-beat catches up. Each knot sets `<door>_open` so nothing fires twice. Every opening mapping has `delayMs: 2500` and is keyed so it never fires inside the conversation that set the flag (a conversation mapping closes whatever minigame is open; trial report, "Limits"). This replaces MC rule 1.5's "eventMapping firing `unlock_door`", which the engine doesn't have (RL §6, item 30).

### 4.1 The breach: flag 1 and `door_scene_done`

- **Door:** forward post → `blast_tunnel` (the blast door). Sign: "BLAST DOOR. Opens on the breach call."
- **Condition:** `globalVars.flag1_submitted === true && globalVars.door_scene_done === true && !globalVars.breach_open`.
- **Mappings on HaX:** `conversation_closed:<holder>` (Nightshade's table NPC on his three branches, `netherton_table` on the silent one) with the condition; `global_variable_changed:flag1_submitted` with the condition and `delayMs: 2500` (the flag station's minigame is usually still open); `game_loaded` with the condition.
- **Knot `breach_call`:** `#unlock_door:blast_tunnel`, `#set_global:breach_open:true`, `#set_global:raid_clock:0230`, then Netherton on the net: "Breach. Go." On `nightshade_tethered` the narrator gives the crank instead of the reader ("Manual." and the wheel turns); on `blast_door_announced` (§6) the chime and the panel with the player's designation.
- **Holding lines:** the door, examined early: "It won't open on a pick or a card. Netherton calls the breach." HaX, if flag 1 is in and the table isn't: "Netherton won't call it till the table's settled." If the table is settled and flag 1 isn't: "Their monitoring first. Then we go."

### 4.2 The stair: `ghost_call_done`

- **Door:** `security_office` → `workshop_floor` (the stair down). Sign: "STAIR B. Controlled from the duty desk."
- **Ghost's call** rings on `room_entered:security_office` (mapping on Ghost's phone NPC, listed in the start room so it is registered early; `conversationMode: phone-chat`, `disableClose: true`, `targetKnot: start`, condition `!globalVars.ghost_call_done`). It re-rings with `resume: true` on `room_exited` (`data.roomId === 'security_office' && !globalVars.ghost_call_done`) and on `game_loaded` with the same condition while the player is in the office (`globalVars.player_room === 'security_office'`, a local set on every `room_entered`). The duty handset on the desk is also a clickable object that re-opens the call (the written fallback, MC rule 1.7).
- **Opening:** HaX mapping on `global_variable_changed:ghost_call_done` (`delayMs: 2500`) and `game_loaded` → knot `stair_open`: `#unlock_door:workshop_floor`, "Stair's open. Workshop floor's below you."
- **The kept branch's gift** (MC §3.2; RL §2.3 moves the "east door" onto the records cupboard): Ghost's last line reads the cupboard's code aloud. Opening it is optional; it sits behind the same call, so it can't bypass the stair.

### 4.3 The tunnel's inner door, and the tripwire

- **Door:** `blast_tunnel` → `security_office`. A story door (pattern above).
- **Default:** HaX mapping on `room_entered:blast_tunnel` with `!(tripwire route)` → knot `inner_door`: unlock, "Inner door's on their monitoring. I've got it." Because the condition can't use `||` or brackets, the tripwire route is one local boolean, `tripwire_armed`, written at the closing choice: true when `nightshade_map_used && !payment_checked`.
- **Tripwire route** (`tripwire_armed`): no unlock on entry. The player's first try at the door (`door_unlock_failed:security_office`, a HaX mapping) sets `tripwire_tripped`, `wren_warned` and `security_alerted`, and opens HaX's knot `tripwire`: "That's his entry. The door's locked from their side, and they know we're coming." The guard post's ladder (an object, `triggerOnInteract: set_global ladder_used`) opens knot `ladder`: the narrator takes the player up the shaft and through the office's back corridor, and HaX unlocks the door from the office side ("I've got the door from in here."). The cost is the warning (WREN goes ahead a room early; the office's guard is up), not a longer walk.

### 4.4 The gallery: flag 3 and the shutter

- **Door:** `server_hall` → `gallery` (the gallery stair). Sign: "GALLERY. Released from the release console."
- **Condition:** `globalVars.flag3_submitted === true && globalVars.gallery_shutter_cut === true && !globalVars.gallery_open`. Flag 3's reward sets `flag3_submitted` (one flag, one reward); aim 3's shutter is the other half, so neither can be skipped and the gallery is reached only with the console's chance taken or passed and the disarm armed (arc §6.3, FA §4.0).
- **Knot `gallery_open`** carries the console warning when the console is unanswered, then the sweep line (arc §6.3 item 8), and sets `raid_clock` to `0345` (§6).

### 4.5 The outer lock: one unlock event, four ways through

- **Door:** `gallery` → `core`, a room lock of type `pin` (the maintenance code). This is a change from the RFID "lock card" (RL §2.7 says why): one door takes one lock type, and a PIN lock admits every way MC §3.5 lists.
  - **The long way, under guard:** Kowalczyk's PIN cracker on the keypad, in the lock guard's sight (`los.challengeOnSight`).
  - **The lock card, the quiet way:** the lock guard carries a code card (a `notes` item in `itemsHeld`). Bought from Vos (`#give_item`), named by escaped Victoria or Ghost's card gift (then lifted from him, or dropped on a knock-out).
  - **From inside:** Victoria who holds or Vos who stands aside runs `#unlock_door:core` (each has `"unlockable": ["core"]`).
  - **Ghost's code:** the player types it.
- **One event:** two HaX mappings set `outer_lock_open`: `door_unlocked` with `data.connectedRoom === 'core' && !globalVars.outer_lock_open`, and `door_unlocked_by_npc` with `data.roomId === 'core' && !globalVars.outer_lock_open` (the NPC path emits only the second; RL §6 item 39). `door_unlocked` also fires on walking through an open door, so the guard on `outer_lock_open` matters.
- **What it computes**, on `global_variable_changed:outer_lock_open`, four mutually exclusive mappings write `head_start_out` (`&&` only):
  - `both`: `globalVars.share_zero_day !== 'stopped' && globalVars.share_resale === 'live'`
  - `zero_day`: `globalVars.share_zero_day !== 'stopped' && globalVars.share_resale !== 'live'`
  - `ghost`: `globalVars.share_zero_day === 'stopped' && globalVars.share_resale === 'live'`
  - `none`: `globalVars.share_zero_day === 'stopped' && globalVars.share_resale !== 'live'`
  Then, on `global_variable_changed:head_start_out`, `share_zero_day` becomes `released` unless `stopped`, `share_resale` becomes `released` where it was `live`, `raid_clock` becomes `0400`, and `open_the_outer_lock` completes. Quintero's lock NPC is revealed on the same event (RL §2.7).

### 4.6 The core's resume order

Tesseract is `koImmune` for the whole scene (RL §2.8), so the knock-out branch of MC §6.1 is kept only as dead-code insurance. His conversation always enters at knot `core_router`, which routes on globals because a person-chat restarts after a reload:

1. `m09_recruiter_offer == "double_crossed" and not wren_at_core` → the double-cross opening (MC §6.4), which sets `wren_at_core`, `sleeper_caught`.
2. `not core_greeted` → step 0's greeting (sets `core_greeted`), then "Get on his box."
3. `not flag4_submitted` → "Finish on my box first. I'll keep."
4. `not case_heard` → his case and the Recruiter beat (sets `case_heard` on its last line).
5. The first of `exchange_1`, `exchange_2`, `exchange_3` still `""`.
6. `console_choice == ""` → the console menu (Stop it, or "Show me how it works", with `join_step` resuming its own step).
7. WREN's beat when she is free and `wren_at_core` is false (it runs off `console_choice = stopped`).
8. `database_outcome == ""` → the database menu (Netherton and HaX restate the costs).
9. `ending == ""` → step 5 (`points_landed` derived here, never stored before).
10. Otherwise his line for the ending already chosen.

### 4.7 The conclusion waits on `ending`

`ending` is set by one pick (MC §8.1). A HaX mapping on `global_variable_changed:ending` opens the closing scene for that ending: the 06:00 cutscene (a hidden person NPC `six_oclock` at the forward post, `conversationMode: person-chat`, `disableClose: true`), the hearing on `scorched` (after the 06:00 scene), the Citadel on `joined`. The scene's last line runs `#complete_task:close_the_night` and `#set_global:closing_done:true`; the credits music event fires on `global_variable_changed:closing_done` (§7). A `game_loaded` backstop re-opens the scene when `ending != ""` and `closing_done` is false (m08's E7 pattern, `scenario.json.erb:189-197`).

### 4.8 The other locks on the route

| Door | Lock | Ways through | Pointer |
|---|---|---|---|
| `workshop_floor` → `power_room` | `rfid`, `requires: tg_power_room_card` | a talked-round technician or Gary opens it (`#unlock_door:power_room`, `unlockable`); clone Imran's or Gary's card; the old service hatch (a key-locked box beside the door, pickable, holding the shift fitter's spare card) | the reader beeps red; HaX: "Someone on that floor carries a card for it. Or there's the old way." |
| `power_room` → `server_hall` | none | – | – |
| records cupboard (object, security office) | `pin` | Ghost's code (kept branch), Vector's annex code (Vector present), or the cracker | optional |

## 5. HaX's hub by progress

`support_hub` in `m10_phone_agent0x99.ink`, m02's pattern: choices gated `{progress and not topic_given}`, newest topics first, ten or fewer visible at once, a sticky exit. Spent topics retire with a `_given` guard. Lines are SE §3.1's; stage 7 writes the rest.

**Always (sticky):** "[Where are we?]" (branches to the step, below); field-guide offers per VM stage, gated `{<stage>_guide_offered and not <stage>_hint_given}`; "[That's all.]".

**"[Where are we?]" answers, by the first that holds:** `ending != ""` none (the closing scene owns the line) → `flag4_submitted` "Hear him out. Then it's yours." → `outer_lock_open` "You're in. His box first." → `gallery_open` "Up the stair. The lock's at the end." → `flag3_submitted and not gallery_shutter_cut` "The shutter's still live. Power room." → `flag2_submitted` "Get under the release service. The hatch in the sealed section." → `reach_server_hall` done "The console takes the staging copy." → `gallery_shutter_cut` "Server hall's through there." → `workshop` entered "Get to the power room. Then the shutter." → `ghost_call_done` "Stair's open." → `reach_security_office` done "The handset. Answer it." → `breach_open` "Through the tunnel." → `door_scene_done` "Their monitoring. Gate terminal." → `flag1_submitted` "Netherton won't call it till the table's settled." → default "The table first, then the gate terminal."

**Progress-gated topics** (each appears once its gate is met, retires when spent):

| Gate | Topic | What it gives |
|---|---|---|
| `briefing_played` | "[How are you?]" | SE §3.1, by `m09_hax_confession_answer` (cold-start form on `not m09_completed`) |
| `briefing_played and not breach_open` | "[Why does he want me?]", "[The hour.]", "[The head start.]" | the briefing hub's three questions, moved here so the cutscene stays short (cut order item 5, arc §2) |
| `flag1_submitted and m06_assets_seized` | "[The fence.]" | "Two posts empty. That's your freeze." |
| `flag1_submitted` | "[The power room?]" | "Whoever's in the power room runs your lights." (said unprompted at flag 1; the topic repeats it) |
| `clue_door_log` | "[The door log.]" | clue 1's read; "That camera's a box on a bracket. Never wired." if asked |
| `clue_door_log and whodunit_live and not clue_alibi` | "[Who was where at ten past?]" | clue 2 (sets `clue_alibi`) |
| `clue_door_log and whodunit_live and not wren_at_core` | "[I know who WREN is.]" | the accusation: team member, then "[Yes. Them.]" / "[Not yet.]" (MC §5); refused while `officer_out != ""` ("Get Malhotra back first.") |
| `officer_out != "" and <their clearing clue held>` | "[Bring Malhotra back.]" (by officer) | the recall over HaX's channel |
| `flag2_submitted and not hax_jammed and not outer_lock_open` | **"[What's still live?]"** | reads `share_zero_day` and `share_resale` and where each can still be stopped (SE §3.1's four lines, by state; one extra for "TRACED and nothing else live": "We're following Zero Day's. Nothing else goes."); retires at the jam, comes back after the lock as "[What went out?]" reading `head_start_out` |
| `flag2_submitted and backdoor_channel_live and not backdoor_closed` | "[The backdoor.]" | the count by branch; the task |
| `gallery_shutter_cut and not flag3_submitted` | "[The hatch?]" | the sealed section's maintenance hatch (FA §6.2), the field-guide pointer |
| `flag4_submitted` | "[The console.]", "[The vault line.]" | the one fact about the feed and the purge, again |

**The jam.** `hax_jammed` is set on `room_entered:gallery` and cleared on `outer_lock_open` (a HaX mapping each). While it is true her hub opens on one line, "...", and the static the player can only close; no mapping that opens her thread or sends a text runs in the gallery (each carries `!globalVars.hax_jammed`). Arrested Victoria's line never rings there (MC §3.5). The phone stays usable; HaX simply can't answer, which is the fiction.

**Not topics:** the schedule's three entries are said unprompted as flag 2 lands (SE §3.1), and on a recruited-Victoria save "[What's still live?]" ends with her rule ("Sterling goes with whoever's winning."), so neither needs a button.

**The ten-choice cap.** Each topic also retires when the aim it belongs to completes (the briefing questions at the breach, the fence and power-room topics when aim 3 completes, the hatch at flag 3). The busiest moment is the server hall after flag 2, on a save with the whodunit open, the backdoor live and an officer out: "[What's still live?]", "[The backdoor.]", "[The hatch?]", "[The door log.]", "[Who was where at ten past?]", "[I know who WREN is.]", "[Bring Malhotra back.]", plus the three sticky choices: ten. Stage 7 keeps it there.

## 6. The countdown objects and the clock's steps

**The clock is one string global, `raid_clock`**, default `"0145"`, moved only by story beats (FA §4.2; no `gameClock`, no `timers`, nothing on wall-clock time except two short pauses inside the pre-breach split, which happen while the player is at the gate terminal and cost nothing). Every step's mapping (on HaX) requires the step before it (`globalVars.raid_clock === '<previous>'`), so re-entering a room never winds it back; where a beat can be skipped, a second mapping accepts the earlier value too.

| Step | Value | Set by | What else happens on it |
|---|---|---|---|
| Briefing | `0145` | default | the kit check; the breaching case open on the table |
| The split | `0200` | the first use of the gate's VM launcher (`object_interacted`, `data.objectType === 'vm-launcher' && data.roomId === 'forward_post'`), or flag 1 if that comes first | Quintero and Kowalczyk leave for the tunnel mouth (their table copies hidden, RL §2.1). **This closes MS-23:** the split starts at 02:00, after the 01:58 copy and before 02:10 |
| Arakawa's call | `0210` | `delayMs: 60000` after `0200`, or flag 1 if sooner (`arakawa_call_done` guards both) | his call and the telescope line; Malhotra: "Arakawa, you're off the net." The gate object reads 02:10 as he dials |
| The pair back | `0220` | `delayMs: 60000` after `0210`, or flag 1 | Quintero and Kowalczyk back at the table; their two lines if asked |
| The breach | `0230` | HaX's `breach_call` knot (§4.1) | Netherton at the gate; Vector and Phantom where present |
| Security office | `0245` | `room_entered:security_office` | Ghost rings |
| Workshop floor | `0300` | `room_entered:workshop_floor` | – |
| Power room | `0315` | `room_entered:power_room` | – |
| Server hall | `0330` | `room_entered:server_hall` | – |
| Leaving the hall | `0345` | HaX's `gallery_open` knot (§4.4) | the console warning if unanswered; the sweep line |
| The outer lock | `0400` | `head_start_out` written (§4.5) | every live share goes; LIVE lines become RELEASED |
| The core | holds at `0400` | – | he pauses nothing; nothing moves while they talk |
| Join | – | `database_outcome === 'published'` | every object reads RELEASED, everywhere |
| 06:00 | `0600` | the 06:00 cutscene's first line | the table's object reaches six and nothing happens |

**The objects.** One per main-path room, eight in all (RL §2 names each and its slot): the forward post's table screen, the blast door's panel, the security office's duty screen, the workshop's shift clock, the power room's load board, the server hall's release console screen, the gallery's lock panel (by the outer lock), the core's console readout. Each is `readable`, `readDisplay: "gameDisplay"`, `addToNotes: false`, with `observationVariants` and `textVariants` (the same list for both), most advanced state first (trial report; README "Object Field Reference").

**The text.** Before flag 2: one line, `RELEASE 06:00 UTC  |  NOW 02:45`. From flag 2: three lines,

```
RELEASE 06:00 UTC  |  NOW 03:30
ZERO DAY: LIVE
SECOND BUYER: NONE
```

with `ZERO DAY` one of LIVE / STOPPED / TRACED / RELEASED and `SECOND BUYER` one of LIVE / STOPPED / NONE / RELEASED (FA §4.2's labels; "Ghost" never appears on a screen). At `0400` with any share out, the first line reads `EARLY ACCESS: RELEASED  |  NOW 04:00`. On Join, every object reads `RELEASED. ALL CITIES.`

**Building the variants.** Conditions take `&&` only, so every combination is its own variant: an ERB loop over the steps from flag 2 onward (four: `0330`, `0345`, `0400`, and the Join line) × `share_zero_day` (4) × `share_resale` (4) writes about 50 variants per object, each `globalVars.flag2_submitted === true && globalVars.raid_clock === '0345' && globalVars.share_zero_day === 'live' && globalVars.share_resale === 'none'`. Before flag 2, one variant per step. The helper is one ERB method (`countdown_variants(prefix)`) used by all eight objects, so the strings are written once. The validator already checks variant conditions for `||` and brackets.

**The share display globals** (MC §12): `share_zero_day` default `live`; `share_resale` default `none`, set to `live` on Ghost's first line where `ghost_sale = selling`. Writers: C9 (`head_start_killed`), Ghost's call (`ghost_sale = stopped` → `share_resale = stopped`), the gallery (`confronted`, `talked_down`, `walked`, `vos_secret_used` → `share_zero_day = stopped`), the lock (§4.5). Each writer is a HaX mapping on the decision global with a fixed `setGlobal`, so the display can never disagree with the state that decides `head_start_out`.

**Said aloud.** The objects show; people say. HaX after flag 2: "It's set for four. It goes when the outer lock opens."; leaving the hall: "Fifteen minutes to their head start." (both SE §3.1). No line names a minute count that the objects contradict: the objects are the authority, and stage 7 checks each line against this table.

## 7. `concludeRequires` and the conclusion

**`concludeRequires`:** `{ "tasksCompleted": ["submit_flag_1", "submit_flag_2", "submit_flag_3", "submit_flag_4"] }`, on `end_it`. The four flags only, server-authoritative (FA §4; MC §8.1). No story task and no import in it. `ending` is a string and `concludeRequires.globals` counts only boolean `true` (`game.rb:2719`), so it could not go in even if wanted; the closing scene's task carries it instead (§4.7).

**The order at the end:** the ending's pick sets `database_outcome` (where it applies) and then `ending` → the ending's own beat at the core → HaX's mapping on `ending` opens the closing scene → its last line completes `close_the_night` and sets `closing_done` → the music event on `global_variable_changed:closing_done` (value true) plays the ending's track and carries `closingCard` and `credits` (the F14 closing-sequence format, trial report §2) → the client POSTs `/conclude`; the server checks the four flag tasks → the visualiser opens on the card, then the teaser (off unless `teaser_enabled`, and skipped on `executed` and `joined` by the teaser's own condition), then the credits. The `end_it` aim also completes on `close_the_night`, and its `conclusionScreen` re-opens the visualiser after a reload (README "conclusionScreen").

**Credits by ending:** six music events, one per `ending` value, each with its own playlist and title line (FA §4.5): `victory` for arrest, surrender and justified lethal; `end` for scorched, executed and joined (MISSION FAILED on joined, as m01's launch ending). The card and credit clauses are stage 7's, in the `{ when, text, block, order }` format the trial built (`closingCard.lines`, credits `section` blocks with `people` and `lines`; a heading drops when nothing under it prints). Conditions there are JavaScript, so `||` works.

**Music, the whole night** (SE §8 asked stage 4 for the table; playlists are the engine's, `music/music-config.js`):

| Trigger | Condition | Playlist |
|---|---|---|
| `game_loaded` | `!globalVars.briefing_played` | `cutscene` |
| `game_loaded` | `briefing_played && !breach_open` | `noir` |
| `conversation_closed:netherton_briefing` | – | `noir` |
| `global_variable_changed:breach_open` | `value === true` | `spy-action` (the raid) |
| `npc_hostile_state_changed` | `isHostile === true && !globalVars.hax_jammed && !globalVars.outer_lock_open` | `threat` |
| `all_hostiles_ko` | `!globalVars.hax_jammed && !globalVars.outer_lock_open` | `spy-action` |
| `room_entered:gallery` | – | silence (see F10 below) |
| `global_variable_changed:outer_lock_open` | `value === true` | `noir`, one chosen low track (the held cue at the core) |
| `global_variable_changed:exchange_1`, `_2`, `_3` | `value === 'rebuttal' || value === 'record'`, with the running count read from the three globals | first landed point: a quieter chosen track; second: silence |
| `game_loaded` | each of the above states, latest first | the matching cue, so a reload doesn't restart the raid track in the core |
| `global_variable_changed:closing_done` | by `ending` | `victory` or `end`, with credits |

`victory` is never used before `closing_done`: it opens the visualiser on its own (`bond-visualiser.js:1744`).

**F10 (music silence), settled against the code.** The engine has no stop or silence action; an unknown playlist name logs and leaves the music running (`music-controller.js:368`); playlists are defined only in `music-config.js`. So a silent track needs **a silent audio asset and a one-line `silence` playlist entry in `music-config.js`**: no engine logic, but an edit to a shared engine file, which is the user's call (F10). **The design runs either way.** With the entry: the gallery is silent and the second landed point drops to silence. Without it (the fallback): the gallery plays the quietest existing track (`cutscene`, one named low track), the first landed point switches from the core's held cue to that same quiet track, and the second landed point switches to a second, sparser chosen track; the player still hears two clear steps down. Either way no line depends on the music.

## 8. Time budget against 105 minutes

Stage 1's act figures stand (25 + 40 + 32 + 8 = 105, ceiling 110; arc §2). Below, the per-beat split. **The VM figures are estimates, not measurements** (M-14 is still open): no timed run of m10's VM exists, and this author may not read the VM plan. They are set from m07 and m08, which ship four flags each inside 90 minutes, at about 8 minutes a flag with the field guide. A timed VM run (the `opus48` agent, or a stage 8 playtest) replaces them; if the four flags come in over 34 minutes, the cut order below applies before anything else moves.

| Act | Beat | Min | Notes |
|---|---|---|---|
| 1 | Briefing cutscene and the private aside | 5 | the question hub moved into HaX's phone (§5), so the cutscene is spine only |
| 1 | The door scene at the table | 3 | one closing choice; the check adds about 1 on the unshown branch |
| 1 | Flag 1, with the split, Arakawa's call and the pair back played around it | 9 | VM 7; the beats fill it |
| 1 | Breach, blast door, tunnel post | 3 | +1 on the tripwire route (the ladder) |
| 1 | Security office: the photo, clue 1, Ghost's call (2–3) | 5 | |
| | **Act 1** | **25** | |
| 2 | Workshop floor: the scene (3), the sheet (1), the bench log (1), the power-room door (1) | 6 | |
| 2 | Power room: the scene and the cut | 6 | the by-hand cut is the longer option (+1) |
| 2 | Server hall: arrival, Asante or Mercer, the guards | 4 | Mercer's fight +2 |
| 2 | Flags 2 and 3 | 17 | VM 8 + 9 |
| 2 | Console (C9), backdoor (C10), Victoria's line (C8, where it rings), the peel-off, leaving | 5 | C8 +2 on its branch only |
| 2 | Travel and the guards between rooms | 2 | |
| | **Act 2** | **40** | |
| 3 | Gallery and the outer lock | 6 | the long way under guard +2 |
| 3 | Flag 4, with him watching | 8 | VM 8 |
| 3 | His case (2), the Recruiter beat (0.5), three exchanges (7) | 10 | (`m09` saves at the top of the range) |
| 3 | Console, WREN's beat, database (costs said first), the end for him | 8 | |
| | **Act 3** | **32** | |
| Close | The ending's beat (1), 06:00 (5), card and teaser (1), credits' opening (1) | 8 | the roll runs after play |
| | **Total** | **105** | VM 32 of it |

**Ceiling check.** A rich save pays the optional extras on top: the unshown check (+1), C8 (+2), the long way at the lock (+2), Mercer (+2). A save that hits all four runs 112, over the ceiling; in practice no save carries both Victoria arrested (C8) and a branch that forces the long way, and Mercer's branch closes C7, so the worst real save is about 109.

**Cut order if a timed run comes in long** (arc §2, unchanged): the backdoor task; Victoria's line as goodwill only; his idle lines down to one; Vector's and Phantom's lines down to one each; the briefing hub (already moved to the phone here, which saves about a minute of cutscene). Never cut: the five scenes, the three clues and the accusation, the three exchanges, the stated costs, HaX's last line before the jam, an ending scene, the walkabout's first pick.

## 9. The 35 test runs as F15 starting states

MC §16's live plan (3 end to end, 8 + 5 + 4 + 6 + 9 segments), turned into `tools/playtest/new-game.rb` command lines. Each run is `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m10_full_disclosure --imports=<file> --start-room <R> [--unlock ...] [--set ...] [--give ...]`. Imports files go in `tools/playtest/m10_imports/<run>.json`; only the keys that differ from the defaults are listed (each source also needs its `mNN_completed: true` where a value is listed).

**What F15 can't seed, and how the runs cope** (tools/playtest/README.md): objective and task progress, ink state and door states beyond unlocked rooms. So:

- **Flags.** "Injected" means the gates' globals are `--set` (`flag1_submitted` and so on), which is all the doors and ink read. The flag *tasks* stay open, so `/conclude` would refuse; a run that must reach the credits either submits the station's `test:flag:N` alias on the way past (the dev alias resolves to the real flag and runs every check, `games_controller.rb:1166-1178`), or stubs the conclude POST as the trial did. **Proposed tooling (not engine):** a `--submit-flag <station>:<n>` option for `new-game.rb` that records the submission server-side, so core-start runs reach real credits. Listed in §10.
- **Aims.** Earlier aims start open; a run that starts deep sees aims 1–3 incomplete in the panel. The tester reports the panel but doesn't fail on it.
- **The start kit** (phone, lockpick, cloner, fingerprint kit, Kowalczyk's cracker) is `startItemsInInventory`, so it is present on every run without `--give`.

**Baselines** (set once, referenced below):

- **S-wk** (workshop start): `--start-room workshop_floor --unlock blast_tunnel --unlock security_office --unlock workshop_floor --set briefing_played=true --set door_scene_done=true --set flag1_submitted=true --set breach_open=true --set ghost_call_done=true --set raid_clock='"0245"'`
- **S-so** (security office start, whodunit): `--start-room security_office --unlock blast_tunnel --unlock security_office --set briefing_played=true --set door_scene_done=true --set flag1_submitted=true --set breach_open=true --set raid_clock='"0230"' --set whodunit_live=true`
- **S-sh** (server hall start): S-wk plus `--start-room server_hall --unlock power_room --unlock server_hall --set gallery_shutter_cut=true --set flag2_submitted=true --set raid_clock='"0315"'`
- **S-core** (core start): S-sh plus `--start-room core --unlock gallery --unlock core --set flag3_submitted=true --set gallery_open=true --set outer_lock_open=true --set head_start_out='"none"' --set raid_clock='"0400"' --set flag4_submitted=true` (minus `flag4_submitted` where the run says "worked")

**End to end (3; start: mission start; VM flags worked)**

| Run | Imports | `--set` / notes |
|---|---|---|
| E1 kind | m01 `final_choice=arrest`; m02 `gary_protected`, `ghost_deal_accepted`, `exposed_hospital`, `bed4_manually_stabilised`; m03 `victoria_fate=recruited`; m04 `voltage_captured`, `disclosure_choice=full`, `vance_is_ally`; m05 `found_pipeline_list`; m06 `assets_seized`, `satoshi_stance=rejected`; m07 `team_assignment=trojan_horse`, `debrief_stance=owned`; m08 `nightshade_triple_agent`, `triple_agent_first_payment`, `named_on_evidence`; m09 `nightshade_shown_file`, `recruiter_offer=named`, `deck_pulled=her_file`, `hax_confession_answer=same_in_your_place`, `albion_notified`, `sleeper_shortlist` | none; times the whole night against §8 |
| E2 hard | m02 `ghost_deal_accepted`, `ghost_keys_used`; m03 `victoria_fate=escaped`, `sterling_on_call_seen`; m04 `voltage_escaped`, `crew_lost`, `disclosure_choice=quiet`; m07 `team_assignment=fracture`, `debrief_stance=hardened`; m08 `nightshade_triple_agent`; m09 `recruiter_offer=taken`, `sleeper_named`, `deck_pulled=none`, `recruiter_secret=kept` | none |
| E3 cold | `--imports=none` | none |

**Segment A: forward post to the stair (8; start: mission start, `--start-room forward_post`)**

| Run | Imports | Extra |
|---|---|---|
| A1 | m09 `recruiter_offer=taken`, `sleeper_named`; m08 `nightshade_arrested`, `nightshade_ko_before_fate`; m02 `ghost_deal_refused` | none |
| A2 | m09 `recruiter_offer=double_crossed`, `sleeper_named`, `deck_pulled=her_file`; m02 not played | none |
| A3 | m08 `nightshade_triple_agent`, `triple_agent_first_payment` (and Vector/Phantom present: `m08_completed`, neither accused); m09 `nightshade_shown_file`; m02 `ghost_deal_accepted`, `exposed_hospital` | none |
| A4 | as A3 | the tester reloads before the closing choice and checks Nightshade's knot re-enters at it; tries to strike him (immune: `__test.debugKO` returns `ko-immune`) |
| A5 | m08 `nightshade_triple_agent`; m09 `cage_bin=nightshade_copy`, `nightshade_shown_file=false`; m02 `ghost_deal_accepted`, `ghost_keys_used`; m08 `nightshade_tidied` | the tester takes the map unchecked and follows the tripwire through the ladder; reloads mid-Ghost-call |
| A6 | m08 `nightshade_triple_agent`; m02 `ghost_deal_refused` | none |
| A7 | m08 `nightshade_arrested`; m02 `completed` only; m03 `guard_bribed`; m09 `cage_bin=nightshade_copy`, `recruiter_offer=named` | none |
| A8 | m08 `nightshade_arrested`; m02 `ghost_deal_accepted`, `exposed_hospital` | reload between deal and check |

**Segment B: workshop and power room (5; S-wk)**

| Run | Imports | Extra |
|---|---|---|
| B1 | none | – |
| B2 | m02 `gary_protected`; m04 `voltage_captured` | – |
| B3 | m02 `completed` (unprotected, not exposed); m04 `voltage_escaped`, `voltage_print_on_bypass` | `--set casualty_sheet_read=false` (the print, not the sheet) |
| B4 | m02 `completed`; m04 `voltage_escaped`, `static_left` | – |
| B5 | m02 `completed`, `ghost_deal_accepted`, `ghost_keys_used`; m04 `voltage_captured` | `--set ghost_sale='"selling"'` (Imran keeps his card); second pass: Wendell knocked out |

**Segment W: the whodunit (4; S-so)**

| Run | Imports | Extra |
|---|---|---|
| W1 | none | – |
| W2 | none | – |
| W3 | m08 `nightshade_ko_before_fate` | `--set nightshade_tethered=true` |
| W4 | none | – |

**Segment C: server hall to the lock (6; S-sh)**

| Run | Imports | Extra |
|---|---|---|
| C1 | m03 `victoria_fate=recruited` | – |
| C2 | m03 `recruited`; m02 `ghost_deal_accepted` | `--set ghost_sale='"bait"' --set share_resale='"live"'` |
| C3 | m03 `recruited` | – |
| C4 | m03 `escaped`, `sterling_on_call_seen`; m07 `completed`, `mercer_fate=""`, `team_assignment=meltdown`; m02 `completed` | `--set ghost_sale='"bait"' --set share_resale='"live"'` |
| C5 | m03 `escaped`; m07 `team_assignment=meltdown` | – (`backdoor_channel_live` derives at load) |
| C6 | m03 `victoria_fate=arrested` | – |

**Segment D: the core (9; S-core)**

| Run | Imports | Extra |
|---|---|---|
| D1 | E1's file | six fresh games, one per ending; `--set head_start_out='"zero_day"'` on two of them for the card's head-start line |
| D2 | none | Join steps; `--set share_zero_day='"released"'` |
| D3 | none | reload between each menu; checks `points_landed` is derived, not counted |
| D4 | none | tries to knock him out at each menu (immune); then, with the immunity removed in a scratch copy only, the KO fallback order |
| D5 | none (WREN free: `whodunit_live=true`) | with Quintero; then `--set quintero_ko=true` for "[Stop her.]" |
| D6 | m09 `recruiter_offer=double_crossed`, `sleeper_named`; second game `--set sleeper_caught=true --set accused='"kowalczyk"'` | – |
| D7 | m09 `deck_pulled=alpha_tapes`, `recruiter_offer=refused` | with and without `--set quintero_ko=true` |
| D8 | four seeded files: knock-out pattern 0, 1, 2–3, 4+ (m03–m08 latches); `m04_disclosure_choice=full` with `m02_exposed_hospital`; `m06_satoshi_stance` each value | the exchange pools and stings |
| D9 | m07 `completed`, `team_assignment=meltdown` | lower the weapon, reload, then the executed ending; the 06:00 screen story |

## 10. Proposed changes

None is made here. RL §7 lists the layout ones.

| # | To | Change | Why |
|---|---|---|---|
| S4-1 | MC rule 1.5, §12 done-flags; FA §4.0 "Forced scenes and nets" | "A door opened by an eventMapping firing `unlock_door`" → "a story door (an RFID lock with no card) opened by HaX's ink `#unlock_door`, fired by a HaX mapping on the done-flag, with a `game_loaded` catch-up" | eventMappings have no unlock action; the persisted routes are flag rewards and NPC ink with `unlockable` (§0, §4) |
| S4-2 | MC §3.1 (the breach) | The breach needs flag 1 and `door_scene_done`, opened by HaX's `breach_call` knot, not by Netherton's mapping | same reason; Netherton's line plays on the net inside HaX's knot |
| S4-3 | MC §3.5, FA §4.0 route, s0 §2.2 "RFID cloning" row | The outer lock is a PIN lock; the "lock card" is the lock guard's code card; the long way is the cracker under guard. RFID cloning stays on the workshop's power-room door | one door, one lock type (RL §2.7) |
| S4-4 | MC §3.2, FA row 13, arc §7.5 | The kept branch's "east door" becomes the records cupboard in the security office, whose code Ghost reads out; Vector's sealed door is the same cupboard | no ninth room (RL §2.3) |
| S4-5 | MC §8.1, FA §4.0 | "The ending scene completes the conclusion task" made exact: `close_the_night` on the closing scene's last line; credits on `closing_done` | README lesson 46; `concludeRequires.globals` can't hold a string |
| S4-6 | arc §3 beat 8, SE §3.1 | The briefing's question hub moves into HaX's phone (topics until the breach) | saves about a minute of cutscene; cut order item 5 done in advance |
| S4-7 | FA §15/§17 "Still open": MS-23 | The split starts at 02:00 (the first use of the gate's console) | closes MS-23's time half |
| S4-8 | MC §6.1, FA §4.1 | Tesseract `koImmune` for the whole core scene; the KO resume order kept only as a written fallback | the justified-lethal and arrest beats are ink; nobody needs to strike him, and the engine can't toggle the key mid-scene (RL §6 item 36) |
| S4-9 | Orchestrator, tooling | `new-game.rb --submit-flag <station>:<n>` (records a submission server-side) | core-start runs can then reach real credits |
| S4-10 | Stage 7 | The objects' times are the authority for every spoken time | §6 |

## 11. For the user

- **F10, music silence.** True silence needs a silent asset plus a one-line `silence` playlist in `public/break_escape/js/music/music-config.js` (no engine logic). Without it, the design uses quieter tracks for the gallery and the two landed points (§7). Yes or no settles it; nothing else waits on it.
- **Time budget.** The VM's 32 minutes are estimates from m07/m08 (M-14 still open). A timed VM run is what turns 105 into a measured figure.

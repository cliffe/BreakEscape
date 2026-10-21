# m10 Full Disclosure: Stage 4, player objectives

## 0. Status, sources and conventions

**Stages 4–5 complete** (draft 4, 2026-10-21; round 3's findings folded in, §15; no further review round, the orchestrator checks directly). Draft 3: round 1's two reviews (`../stage_5/REVIEW_R1_PUZZLES.md`, "F-nn"; `../stage_5/REVIEW_R1_DESIGN.md`, "R1D-…") folded in (§12), then round 2 (`../stage_5/REVIEW_R2.md`, "R2-…"; §14), with the orchestrator's rulings and user decisions F17–F19 and F10, whose engine work is committed (57d3d237). Author: stages 4+5 author (Opus). Companion: `../stage_5/room_layout.md` ("RL §n"), which owns rooms, ids, positions and the engine verdicts this file relies on.

Built on `../stage_0_initialization.md` ("s0"), `../stage_1/story_arc.md` ("arc", including §20), `../stage_2/storytelling_elements.md` ("SE"), `../stage_3/moral_choices.md` ("MC", the authority for every choice, cost and global), and `../../finale/FINALE_ARC.md` ("FA", §1–9, §13, §17). The prompt is `story_design/story_dev_prompts/04_player_objectives.md`; where it differs from the newer standards, these win: `mission-alignment-plan` (staged, spoiler-safe aims; HaX's progress-gated hub), `scenario-design-review` §2g (no dead zones; action titles; a pointer for every task), `mission-puzzle-chains` (convergence only through `unlockCondition` and `concludeRequires`), `README_scenario_design.md` "Authoring Rules", `tools/pass2/PASS2_LESSONS.md`. The model is m08's objectives block (`scenarios/m08_the_mole/scenario.json.erb:328-556`), whose shape this file copies: `aimId` / `title` / `description` / `status` / `order` / `unlockCondition`, tasks with `taskId` / `title` / `type`.

No VM material was opened. Flags are named by story meaning: flag 1 the foothold on the security monitoring host; flag 2 the staging schedule; flag 3 out of the release service's container; flag 4 the core host.

Engine facts this file depends on (checked in code; RL §6 has the evidence):

- **Story doors open by an eventMapping `unlockDoor` (F19, committed; `docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md`).** `"unlockDoor": "<room>"` on an NPC's eventMapping unlocks through the server's persisted `npc` path with no encounter or `unlockable` check (`systems/npc-manager.js:671, 869-881`; `game.rb:1246-1258`), and emits **`door_unlocked_by_npc` with `{ roomId, npcId }`** (`systems/npc-game-bridge.js:131-139`), not `door_unlocked`. Each door's done-flag is set **from that event** (`data.roomId === '<room>' && data.npcId === 'agent_0x99'`; R2-M1), never in the same mapping or knot, so a failed unlock leaves nothing claiming the door is open (F-05). Ink `#unlock_door` with `unlockable` (`game.rb:1247-1270`) stays only where a person naturally opens a door: a technician at the power-room door, Victoria or Vos at the outer lock. The flag-reward `unlock_door` (fixed by F18) isn't needed and isn't used.
- **Mappings live on NPCs and register when the NPC's room loads, and a mapping's `setVisible` and conversation keys act only on its own NPC** (F-02). Global mappings (clock, shares, doors, aims) sit on HaX (`agent_0x99`, listed in the start room); every show, hide or scene-opening mapping sits on the NPC it moves, with the README relay (HaX sets a global; the NPC's `room_entered:<own room>` reads it) for NPCs in later rooms.
- **A reload always respawns the player in the start room** (`core/game.js:1687-1727`; the saved room is never read back; F-06). Every state therefore has a `game_loaded` catch-up, and every room's staging is re-applied on `room_entered`, because the player walks back down the corridor.
- **Ink `#set_global` turns numeric-looking values into numbers** (`chat-helpers.js:474-478`; F-01), so string globals never hold digits alone (`raid_clock` uses `t0230`).
- **Conditions take `&&` only** (eventMappings and object variants); music and credits conditions are JavaScript.
- **One flag, one reward**; a flag's station is the first station whose `flags` list holds it, and its task id is station-qualified with the flag's index *in that station's list* (`games_controller.rb:2407-2528`).
- **`concludeRequires.globals` counts only boolean `true`**, so `ending` (a string) never goes in it.
- Person-chat state does not survive a reload (it restarts at the start knot); phone threads do. Every forced face-to-face scene therefore re-enters on globals, never on saved ink position.
- **Forced phone calls can be voiced (F17, committed; `docs/agents/FINALE_ENGINE_VOICED_CALLS.md`)**: `"voiced": true` on a `phone-chat` eventMapping or a `timedConversation` (`systems/npc-manager.js:336, 677, 1183`). Narration in a voiced call stays silent, and under F20 only what the call opens is voiced (its knot and diverts up to the hub). §13 lists the voiced calls and their budget.
- **A `silence` playlist exists (F10, committed)**, so the gallery and the second landed point are true silence (§7).
- Music and credits conditions are JavaScript and always name `globalVars.` (F-17).

Conventions: UTC on every clock; WREN gets no pronoun before the accusation; "the power room"; ids are working names that stage 9 may rename under the rename rule. "Pointer" means the in-world line, bark or object that tells the player a task exists.

## 1. How the player always knows the next step

The raid is one corridor of rooms (RL §1), so "where next" is rarely the question; "what does this room want from me" is. Five rules carry it.

1. **One aim per stretch of the map, always one visible.** Six main aims follow stage 0's staging (s0 §6) plus the conclusion: the perimeter, below ground, the power, the release, the core, the end. Each unlocks with `aimCompleted` on the one before, so the next aim is visible the moment the last required task of the previous one ticks; there is never a moment with every visible task done. The optional WREN aim runs beside them from the private aside.
2. **Every task has a pointer said aloud before it matters** (§3's last column): HaX's line at the beat, a person in the room, or a readable on the critical path. No required task depends on the player opening the objectives panel.
3. **Forced scenes are announced by the thing that holds the player.** The four done-flag doors (RL §3) each have a line on the closed door, by HaX or the narrator, naming what opens it ("The breach waits on Netherton. Finish at the table.").
4. **Status answers follow progress** (README "Common bugs"). HaX's "[Where are we?]" topic branches on the done-flags and flags down to the step the player is on (§5).
5. **Titles name the action, never the answer** (scenario-design-review §2g): no task names WREN, the wrong entry in Nightshade's payment, which share to kill, or what the database choice should be. The WREN aim is "Find the sleeper", and its tasks are the clues, not the name.

Two places the player could lose the thread, and what holds them:

- **The gallery (HaX jammed).** Her last line before the jam names the next door and the one warning the gallery needs (arc §6.5); the aim "Reach the core" is already visible, with "Get through the outer lock" as its open task; the walkway's countdown object shows the share status, so the player can read the state without her. The release itself is said aloud on the far side of the lock (§4.5): his first line in the core, by value, then HaX's return line (R1D-M7).
- **Stepping back down from the gallery.** HaX comes back the moment the player re-enters the server hall ("Lost you up there. I'm back."), so the console and her hub work again (R1D-M3).
- **The core between flag 4 and his case.** The case is gated on all four flags (arc §9.3; R1D-B1); walking to him early gets "Finish on my box first. I'll keep.", and the task list shows "Take the core host" until flag 4 is in, then "Hear him out". The gallery itself needs flags 2 and 3 (§4.4), so a missing flag can only be flag 4.
- **After a reload.** The player respawns at the forward post (§0) with every opened door still open; HaX's "[Where are we?]" names the room to walk back to.

## 2. Aims and tasks (JSON-ready)

Six main aims, one optional aim. 28 tasks: 18 required, 10 optional. Every task ships `"status": "active"` except the backdoor task (locked until its channel exists), because a locked aim reveals itself when any of its tasks completes and `unlockAim` activates only the first task (PASS2 lessons 27 and 33). `<vm>` stands for the VM's `system_name`, which the VM plan fixes; station ids are RL §2's.

```json
"objectives": [
  { "aimId": "breach_the_perimeter", "title": "Breach The Perimeter",
    "description": "Netherton runs the briefing at the forward post. Settle the business at the table, then get a foothold on the bunker's security monitoring from the gate terminal. The breach goes when both are done.",
    "status": "active", "order": 0,
    "tasks": [
      { "taskId": "take_the_briefing", "title": "Take Netherton's briefing at the forward post", "type": "custom", "status": "active" },
      { "taskId": "settle_the_table", "title": "Finish the business at the table", "type": "custom", "status": "active" },
      { "taskId": "submit_flag_1", "title": "Get a foothold on the security monitoring host and submit the flag at the gate terminal",
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
    "description": "The gallery's blast shutter runs off the old power room. Get through the workshop floor, then have the shutter cut: by whoever runs the power room, or by hand with someone on the line.",
    "status": "locked", "order": 2, "unlockCondition": { "aimCompleted": "get_below_ground" },
    "tasks": [
      { "taskId": "read_the_casualty_sheet", "title": "Read the casualty sheet pinned above the bench", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "decode_the_margin", "title": "Decode the note in the casualty sheet's margin", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "reach_power_room", "title": "Get through the workshop to the power room", "type": "enter_room", "targetRoom": "power_room", "status": "active" },
      { "taskId": "cut_the_shutter", "title": "Get the gallery's blast shutter cut", "type": "custom", "status": "active" }
    ] },
  { "aimId": "find_the_release", "title": "Find The Release",
    "description": "The release runs from the old command room. Take the schedule, then get under the release service at the sealed section's hatch, so the release can be stopped from the core. The release console can do one thing about the cells' head start before it goes.",
    "status": "locked", "order": 3, "unlockCondition": { "aimCompleted": "cut_the_gallery_power" },
    "tasks": [
      { "taskId": "reach_server_hall", "title": "Get into the server hall", "type": "enter_room", "targetRoom": "server_hall", "status": "active" },
      { "taskId": "submit_flag_2", "title": "Take the staging schedule and submit the flag at the release console",
        "type": "submit_flags", "targetFlags": ["release_console:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "submit_flag_3", "title": "Get out of the release service onto its host and submit the flag at the sealed section's hatch",
        "type": "submit_flags", "targetFlags": ["sealed_hatch:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "use_the_console", "title": "Use the release console on the head start: kill one share, or trace one", "type": "custom", "optional": true, "status": "active" },
      { "taskId": "close_the_backdoor", "title": "Close the backdoor channel from the release console", "type": "custom", "optional": true, "status": "locked" }
    ] },
  { "aimId": "reach_the_core", "title": "Reach The Core",
    "description": "Up the stair and along the gallery to the core's outer lock. HaX can't reach you up there. He is waiting at his console in the core.",
    "status": "locked", "order": 4, "unlockCondition": { "aimCompleted": "find_the_release" },
    "tasks": [
      { "taskId": "cross_the_gallery", "title": "Climb to the gallery", "type": "enter_room", "targetRoom": "gallery", "status": "active" },
      { "taskId": "open_the_outer_lock", "title": "Get through the core's outer lock", "type": "custom", "status": "active" },
      { "taskId": "submit_flag_4", "title": "Take the core host and submit it at its terminal",
        "type": "submit_flags", "targetFlags": ["core_host_terminal:<vm>-flag1"], "targetCount": 1, "currentCount": 0, "showProgress": true, "status": "active" },
      { "taskId": "hear_him_out", "title": "Hear him out", "type": "custom", "status": "active" }
    ] },
  { "aimId": "end_it", "title": "End It",
    "description": "His console, the database and the man. Each choice is yours, and each one costs someone. Then the forward post at six.",
    "status": "locked", "order": 5, "missionConclusion": true,
    "concludeRequires": { "tasksCompleted": ["submit_flag_1", "submit_flag_2", "submit_flag_3", "submit_flag_4"] },
    "conclusionScreen": { "type": "bond_visualiser" },
    "unlockCondition": { "aimCompleted": "reach_the_core" },
    "tasks": [
      { "taskId": "decide_the_console", "title": "Decide what happens at his console", "type": "custom", "status": "active" },
      { "taskId": "decide_the_database", "title": "Decide what happens to the database", "type": "custom", "status": "active" },
      { "taskId": "decide_his_end", "title": "Decide how it ends for him", "type": "custom", "status": "active" },
      { "taskId": "close_the_night", "title": "Report at the forward post", "type": "custom", "status": "active" }
    ] },
  { "aimId": "find_the_sleeper", "title": "Find The Sleeper (Optional)",
    "description": "One of tonight's team was placed eleven years ago. Netherton won't tell them you know. Find them before you reach the core, or don't.",
    "status": "locked", "order": 6, "unlockCondition": { "globalVariable": "whodunit_open" },
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
- **The station ids carry the flag's index within that station's list** (§0), so flag 2 is `release_console:<vm>-flag1` and flag 3 `sealed_hatch:<vm>-flag1`. Each station's `flags` must be built with `flags_for_vm_slice` (RL §2; F-18), never `flags_for_vm`, or the first station owns every flag. If the VM plan splits the network into more than one VM, only these four strings and RL §2's `acceptsVms` change.
- **The WREN aim is story-gated and opened at the private aside** (F-04, R1D-m4, R2-M6). Its `unlockCondition` is the local `whodunit_open` (default `false`), so the aim stays hidden at load, and a task completing on a closed save (the door log is read on every save) can't reveal it: only a `globalVariable` condition counts as a story gate (`objectives-manager.js:704-736`). The condition is never re-checked when the global changes (`:688-700`, `:849-869`), so the explicit `unlockAim` stays. HaX carries, in this order: `whodunit_live` defaults `true`; a `game_loaded` mapping sets it `false` on `globalVars.m09_sleeper_named === true && globalVars.m09_recruiter_offer === 'taken'`, another on the same with `'double_crossed'` (the same allowed local-from-import write as `sleeper_caught`, MC §12); then, on `global_variable_changed:aside_done` with `globalVars.whodunit_live === true`, `setGlobal: { whodunit_open: true }` and `unlockAim: find_the_sleeper`, and the same on `game_loaded` with `globalVars.aside_done === true && globalVars.whodunit_live === true`. `aside_done` is set on the aside's last line. The WREN `completeTask` mappings carry no extra guard: the story gate already hides the aim on closed saves and keeps any task completed early (`objectives-manager.js:720-726`), and a guard would drop the shortlist's `clue_alibi`, which is set at the aside before `whodunit_open` (R3-m3).
- **`decode_the_margin`** completes on the margin note's decoded read (`margin_note_read`); Imran or HaX points at it once ("There's something written in the margin. Not plain English."; R1D-m17).
- **Failure states:** none. Join is MISSION FAILED in the credits but concludes normally (`decide_*` complete); every other ending is MISSION COMPLETE. No clock ends the mission.

## 3. Every task: trigger, unlock and pointer

"Trigger" is what completes the task; all mappings named are on HaX (`agent_0x99`, start room) unless stated. "KO / reload cover" says what happens when the usual trigger can't fire; a reload always respawns the player at the forward post (§0), so "reload" below means "walking back with the state intact".

| Task | Trigger | What it unlocks or opens | Pointer (said before it matters) | KO / reload cover |
|---|---|---|---|---|
| `take_the_briefing` | `#complete_task` on the briefing cutscene's first line (Netherton's `timedConversation`, `waitForEvent: game_loaded`, `skipIfGlobal: briefing_played`, `setGlobalOnStart: briefing_played`) | nothing directly; the door scene is open from the start | the cutscene opens on load | first-line completion; a reload never replays it |
| `settle_the_table` | mapping `global_variable_changed:door_scene_done` (value true) → `completeTask` | half of the breach (§4.1) | HaX after the aside, by branch (SE §3.5): "Nightshade's at the table." / "Netherton has a question about the van." Her first line after the cutscene also asks the player to start the gate console so it boots during the table (R1D-m16) | holders are `koImmune` (RL §2.1): `nightshade_table` on three branches, `director_netherton` on the silent one; a walk-away resumes at the closing choice because the knot re-enters on `door_scene_done` |
| `submit_flag_1` | server, on submission at `gate_terminal` | flag reward `emit_event flag_1_in`; HaX's mapping on `flag_1_in` sets `flag1_submitted`. The event fires from the server's response, the same moment a `set_global` would apply, so a tab that dies in that moment loses the global; the server's `pending_events` copy is written but nothing on the client reads it (R3-m1). The window is narrow and accepted; the engine change that would close it (emit and clear `pending_events` after `game_loaded`) is listed for the user, not assumed; half of the breach; clue 1 readable | HaX: "The gate terminal's yours. Get me their monitoring." The flag 1 field guide is offered on the first use of the gate console (`object_interacted`, `data.objectType === 'vm-launcher' && data.roomId === 'forward_post'`; R1D-m13); the same per station for flags 2–4 | server-authoritative |
| `go_through_the_blast_door` | `enter_room blast_tunnel` | completes the aim; `get_below_ground` shows | the breach call (§4.1): "Breach. Go." | the unlock is server-persisted (F19) |
| `reach_security_office` | `enter_room security_office` | the duty handset starts ringing (§4.2) | the inner door is the only way on; on the tripwire route HaX names the ladder ("There's a ladder at the guard post. Up and round."; R1D-m6) | the ladder (RL §2.2) |
| `answer_the_handset` | HaX mapping on `ghost_call_done` → `completeTask` | the stair down (§4.2) | the handset rings and a bark says so; the stair's holding line: "The stair's on their system. Whoever's on that handset has it." | Ghost's thread is saved server-side; clicking the handset resumes it every time (`resume: true`), and re-entering the office re-rings it |
| `take_the_stair_down` | `enter_room workshop_floor` | completes the aim | HaX on the stair's unlock event: "Stair's open. Workshop floor's below you." | – |
| `read_the_casualty_sheet` | the sheet's `onRead` sets `casualty_sheet_read`; mapping → `completeTask` | the first rebuttal's evidence; Voltage's talk-down option | Imran or Gary points at it ("Read what's pinned over my bench."); HaX: "That's his sheet. Read it." | a readable object, no NPC needed |
| `decode_the_margin` (optional) | the decoded note's `onRead` sets `margin_note_read`; mapping → `completeTask` | Asante's name; the first rebuttal's sharper form | Imran or HaX: "There's something written in the margin. Not plain English." | readable object |
| `reach_power_room` | `enter_room power_room` | – | the reader beeps red; HaX: "Someone on that floor carries a card for it. Or there's the fitter's locker upstairs." | talk, clone, or the fitter's spare card from the security office (RL §2.3–2.4); nothing needs a person |
| `cut_the_shutter` | mapping on `gallery_shutter_cut` → `completeTask` (set in the slot-holder's ink, or in the phone voice's by-hand cut) | completes the aim; HaX: "Shutter's down. The hall's next." | the slot-holder offers it; on "work round him", a knock-out or a refusal, the phone voice rings (§4.9; R1D-M8); the isolator's text says someone on the line can talk you through it | the phone voice re-rings on every entry to the power room while `!gallery_shutter_cut`; HaX's hub topic "[Talk me through the shutter.]" is the last net |
| `reach_server_hall` | `enter_room server_hall` | – | the power room's only onward door | – |
| `submit_flag_2` | server, `release_console` | flag reward `emit_event flag_2_in` → HaX sets `flag2_submitted`; console options; schedule readable; arrested Victoria's line rings | HaX on entering: "That console takes what you pull from the staging copy." | server-authoritative |
| `submit_flag_3` | server, `sealed_hatch` (the station at the sealed section's hatch, the hall's east end; R1D-m5) | flag reward `emit_event flag_3_in` → HaX sets `flag3_submitted`; the disarm armed; half of the gallery (§4.4) | HaX at the hatch before flag 3 (FA §6.2) | server-authoritative |
| `use_the_console` (optional) | mapping on `global_variable_changed:head_start_killed` (value not `""`) | the share display globals (§6) | HaX after flag 2 and leaving the hall (arc §6.3) | skipping it is the warned cost |
| `close_the_backdoor` (optional, locked) | unlocked by mapping on `flag2_submitted` with `backdoor_channel_live`; completed on `backdoor_closed` | `partial_release` stays `none` | HaX after flag 2, with the count | a task, free |
| `cross_the_gallery` | `enter_room gallery` | `hax_jammed = true` (§5) | HaX's last line before the jam names the stair and the walkway | – |
| `open_the_outer_lock` | mapping on `head_start_out` written → `completeTask` (§4.5) | the head start goes; Quintero placed at the lock | the lock guard's line on the first try at the keypad (`door_unlock_attempt`: "Shift code. The duty guard carries it."); the barks | five ways through (§4.5) |
| `submit_flag_4` | server, `core_host_terminal` | flag reward `emit_event flag_4_in` → HaX sets `flag4_submitted`; his case opens once all four flags are in | Tesseract, after HaX's greeting: "Get on his box. He'll keep." | server-authoritative |
| `hear_him_out` | mapping on `exchange_3` (value not `""`) | the console menu | walking to him with all four flags opens the case (R1D-B1) | Tesseract `koImmune` for the whole scene (RL §2.8) |
| `decide_the_console` | mapping on `console_choice` set | the database menu | his console menu | the core resumes on globals (MC rule 1.11) |
| `decide_the_database` | mapping on `database_outcome` set | step 5 (not after wipe or Join) | Netherton and HaX state each cost before the menu | as above |
| `decide_his_end` | mapping on `ending` set | the closing scene, once his conversation closes (§4.7) | the menu, with Netherton's F13 line first | as above |
| `close_the_night` | `#complete_task` on the last line of the **last** closing scene of the ending: the 06:00 scene, or the hearing on `scorched`, or the Citadel on `joined` (§4.7 table) | the conclusion and the visualiser (§7) | the scene plays itself | a `game_loaded` backstop on the scene's own NPC re-opens it when `ending` is set and `closing_done` is false (m08's E7 pattern) |
| `read_the_door_log` (WREN) | the log's `onRead` sets `clue_door_log`; mapping → `completeTask` | the accusation topic in HaX's hub | HaX after flag 1: "The office keeps a door log. Their desk will read it now." | readable object |
| `check_the_alibis` (WREN) | mapping on `clue_alibi` (set by HaX's alibi topic, or by a helper: `nightshade_deal = taken`, the shown or not-shown payment, `m09_sleeper_shortlist` at the aside) | – | HaX after clue 1: "So who wasn't where somebody could see them at ten past?" Her topic restates what the player saw ("You had Arakawa at the gate, on the phone to his girl. I had Malhotra."), with a variant if Arakawa was knocked out ("Arakawa was on the gravel at ten past. You saw to that."; R1D-M6, §6h) | phone thread |
| `read_the_bench_log` (WREN) | the bench log's `onRead` sets `clue_bench_log`; Phantom's list sets the same global when he hands it over | – | Imran talked round names it; HaX: "That's a cloner in our own breaching kit. The case's sign-out sheet is on the table up here. Want the names?", and her topic "[Who signed for the case?]" reads them (§5; R1D-M5) | readable object; the sheet's names by phone |
| `name_the_sleeper` (WREN) | mapping on `accused` or `officer_out` set, or on `wren_at_core` with `accused = ""` | – | HaX after the third clue: "That's three things that point somewhere. Your call, and you don't have to make it." | an untaken accusation completes at the core, so the optional aim always closes |

**Edge cases, out of order.**

- **Flag 1 before the door scene, or after.** Either order works (§4.1).
- **Clue 2 before clue 1.** HaX's alibi topic shows only after `clue_door_log`; helpers set `clue_alibi` whenever they speak, and the task waits, already done, in the hidden-until-unlocked aim.
- **The casualty sheet skipped.** The workshop's people point at it and the power-room door is past the bench, but a player can still walk by. A required task here would hold aim 3 open and hide aim 4 while the player stands in the server hall (a dead zone), so the task is marked `"optional": true` in the JSON above. The rebuttal is on his menu either way (FA §4.1); without the sheet it lands on his word alone. HaX nudges once on entering the server hall ("You walked past his sheet. It's worth the minute.").
- **Flag 3 before flag 2.** Allowed, but the gallery waits for both flags and the cut, in any order (§4.4; R1D-B1), so nobody reaches the lock without the console's chance or the core without every flag but the fourth.
- **Aim 5's tasks before aim 4 completes.** Impossible: the gallery door needs flags 2 and 3.
- **The gate console before the table.** Encouraged (R1D-m16): the VM boots while the door scene plays. The split waits for both (§6), so nothing at the gate happens during Nightshade's conversation.

## 4. The locks that force the story

**The one pattern for a story door** (round 1: F-05, F-19, R1D-m12; user decision F19). The door is a room lock of type `rfid` whose `requires` names a card that exists nowhere (`tg_story_lock_<room>`), so neither a pick, the cracker nor the cloner opens it. Its `door_sign` is a name only ("Blast Door", "Stair B", "Inner Door", "Gallery Stair"), because the sign is also the unlock toast's text. An ERB comment beside each says the validator's "nothing can open it" warning is intended (four expected warnings).

It opens by **an `unlockDoor` mapping** (`"unlockDoor": "<room>"`, persisted through the server's unlock path) on HaX, when its condition holds. The mappings, per door:

1. One mapping per global in the condition, on `global_variable_changed:<global>`, each carrying the full condition and `!globalVars.<door>_open`, with `delayMs: 1500` (a `delayMs` mapping re-arms while any minigame is open, so it never fires inside the conversation that set the flag; `systems/npc-manager.js:602-622`).
2. `game_loaded` with the same condition (a pending delay is lost on reload).
3. `door_unlock_failed:<room>` with the same condition: the player tried the door, so try the unlock again.
4. The done-flag: `door_unlocked_by_npc` with `data.roomId === '<room>' && data.npcId === 'agent_0x99' && !globalVars.<door>_open` sets `<door>_open` (R2-M1). The bridge emits it only after the server accepts, so a failed unlock leaves the flag false and every catch-up live. `door_unlocked` (the player's own unlock, and the touch of an already-open door) is used only at the outer lock (§4.5).
5. Holding lines: `door_unlock_failed:<room>` with each missing half negated (one mapping per half, since conditions can't say "not both") gives HaX's line for what is still missing, as a `bark`.

The line that tells the player the door opened rides on `global_variable_changed:<door>_open`, never on the unlock itself.

Ink `#unlock_door` with `unlockable` stays only where a person opens a door in the fiction: Imran or Gary at the power-room door, Victoria or Vos at the outer lock.

### 4.1 The breach: the table, flag 1 and the pair back

- **Door:** `forward_post` → `blast_tunnel`. Sign "Blast Door".
- **Condition:** `globalVars.door_scene_done === true && globalVars.flag1_submitted === true && globalVars.pair_back === true`. `pair_back` ends the pre-breach split (§6), so the breach can't cut across Arakawa's call; the split itself waits for the table, so this adds nothing a player can stall on.
- **Holders of `door_scene_done`:** `nightshade_table` on his three branches, `director_netherton` on the silent branch (one id; R1D-m18). Netherton's briefing is also his conversation, so nothing keys on his `conversation_closed`; only the global counts.
- **On `breach_open`:** HaX's knot `breach_call`, a short voiced call (§13): Netherton on the net, "Breach. Go."; on `nightshade_tethered`, the narrator gives the crank ("Manual." and the wheel turns); otherwise the reader reads the player's badge and the panel shows their designation. `raid_clock` moves to `t0230` by a HaX mapping on `breach_open`, not in the knot, so a reload before the line can't lose the step (R2-m1).
- **Holding barks:** missing the table: "Netherton won't call it till the table's settled."; missing flag 1: "Their monitoring first. Then we go."; missing the pair: "Arakawa's still on the phone. Quintero's waiting on him." The same event, `door_unlock_failed:blast_tunnel` with `!globalVars.pair_back`, is heard by Netherton's and Arakawa's own catch-up mappings (§6), which re-open whichever of their lines is still owed (R2-M5), so the bark always names a thing that is happening. An event, not a latch, so every try works.

### 4.2 The stair: Ghost's call

- **Door:** `security_office` → `workshop_floor`. Sign "Stair B".
- **The call is answered, not sprung** (R1D-M11). On `room_entered:security_office` with `!globalVars.ghost_call_done`, Ghost's NPC (`ghost_phone`, listed in `forward_post`) sends a bark: "Duty line. The handset on the desk is ringing." The `duty_handset`'s text reads "Ringing." while the call is unanswered. The call opens when the player clicks the handset: Ghost's mapping on `object_interacted` with `data.objectName === 'Duty Handset' && data.roomId === 'security_office' && !globalVars.ghost_call_done`, `conversationMode: phone-chat`, `resume: true`, `disableClose: true`, `voiced: true`, `cooldown: 0`. An event, not a latch global, so every click works (R1D-M4). The player picks the moment, so the room's patrols are never on them mid-call by surprise; the stair holds them until they answer.
- **Re-ring:** re-entering the office repeats the bark; `resume: true` returns the call to its last unanswered choice (it falls back to the knot when nothing is saved; F-15). There is no `player_room` global (F-15).
- **Door condition:** `globalVars.ghost_call_done === true`. HaX's line on `stair_open`: "Stair's open. Workshop floor's below you."
- **Codes said on the call are written down** (R1D-m11): Ghost's last line on the kept branch runs `#add_note` with the cupboard's code; on the refused branch, the outer lock's maintenance code or the lock guard's name. Vector's cupboard code is noted the same way.

### 4.3 The tunnel's inner door, and the tripwire

- **Door:** `blast_tunnel` → `security_office`. Sign "Inner Door".
- **Default:** `room_entered:blast_tunnel` with `!globalVars.tripwire_armed` opens it (the condition plus the catch-ups). HaX: "Inner door's on their monitoring. I've got it." `tripwire_armed` is one local boolean written at the closing choice (`nightshade_map_used && !payment_checked`).
- **Tripwire route** (`tripwire_armed`): no unlock on entry. The first try at the door (`door_unlock_failed:security_office`) or the first use of the ladder, whichever comes first, sets `tripwire_tripped`, `wren_warned` and `security_alerted` (F-13), and HaX says: "That's his entry. The door's locked from their side, and they know we're coming. There's a ladder at the guard post. Up and round." (R1D-m6).
- **The ladder:** `post_ladder`, a mapping on `object_interacted` with its name and `globalVars.tripwire_armed === true` sets `ladder_used`; HaX's mapping on `ladder_used` unlocks the inner door. The narration (HaX's knot, after `inner_door_open`): the player climbs the shaft, finds the door's manual release in the office's back corridor, throws it, and climbs back down to walk through. The cost is the warning, not a longer walk. A `game_loaded` catch-up re-unlocks on `ladder_used && !inner_door_open`.

### 4.4 The gallery: flags 2 and 3, and the shutter

- **Door:** `server_hall` → `gallery`. Sign "Gallery Stair".
- **Condition:** `globalVars.flag2_submitted === true && globalVars.flag3_submitted === true && globalVars.gallery_shutter_cut === true` (R1D-B1). Three triggers plus `game_loaded` and the failed-try catch-up. So nobody reaches the lock without the console's chance, the core without the disarm, or an ending without three of the four flags.
- **On `gallery_open`:** HaX's knot `gallery_open`, voiced (§13): the console warning if C9 is unanswered, the sweep line, then her last line before the jam (arc §6.3, §6.5). The flag is set at unlock time (the `door_unlocked_by_npc` event, §4), before the player can reach the stair, so this call plays before the jam (R2-M1). `raid_clock` moves to `t0345` by a HaX mapping on `gallery_open`.
- **Holding barks**, one per missing half: "The staging copy first." / "The hatch. Get under the release service." / "The shutter's still live. Power room."

### 4.5 The outer lock: one unlock event, five ways through

- **Door:** `gallery` → `core`, a room lock of type `pin` (the maintenance code; accepted by the orchestrator in round 1).
- **The ways through:**
  1. **The cracker, while the guard isn't looking** (F-09, R2-M4). Sight isn't checked while a minigame is open, and a sighting that still holds when it closes fires then (`systems/npc-sight-challenge.js:26-29`). So the risk sits at the close, and it is scoped to the keypad: `lock_guard`'s `los.challengeOnSight` has `requireGlobal: "at_keypad"` and `skipIfGlobal: ["lock_guard_challenged"]`. `outer_lock_open` is deliberately **not** in it: a successful crack sets `outer_lock_open` at once, before the sight watcher's first check after the minigame closes, so skipping on it would mean he never challenges (R3-M1). `at_keypad` is set by his own mapping on `door_unlock_attempt` with `data.connectedRoom === 'core'`, and cleared on `room_exited` with `data.roomId === 'gallery'`, on `room_entered:gallery` and on `game_loaded` (a reload emits no `room_exited`; R3-m2), so arriving in the gallery, finishing a conversation there or coming back after a cancelled attempt never triggers him, and once the player is through the lock and out of the gallery he never challenges again. Stage 9 confirms in the browser that the challenge opens as the cracker closes, with the door open. He walks the walkway with a long `dwellTime` at the stair end, facing the windows (no `pauseForPlayer` while dwelling, or he turns to the player), and his cone is drawn (`los.visualize: true`): the player sees when the keypad is out of it. Crack outside his cone and nothing happens. Crack in it and `player_spotted:lock_guard` opens his person-chat as the minigame closes (his own mapping): talk past him ("[Shift change. Netherton's orders.]" works once), or he goes hostile (`#hostile`) with the door open behind the player. Sets `lock_guard_challenged`.
  2. **The fingerprint kit on the keypad** (F-07). `lock_keypad_plate`, a dustable object beside the door (`hasFingerprint: true`, `fingerprintOwner: "gallery_shift"`). Dusting emits `fingerprint_collected:gallery_shift` with `data.objectId` (`systems/biometrics.js:20-100`); a HaX mapping on it with `data.objectId === 'lock_keypad_plate'` sets `keypad_dusted`, and the plate's `textVariants` on `keypad_dusted` show the four worn keys (R2-m4). The cracker's search then runs on four known digits, so the player cracks it while the guard looks away, with time to spare. A fifth way that needs no person, and the kit's use on every save. (Stage 9 checks that the cracker minigame's feedback lets a player who knows the digits finish faster; if it doesn't, the plate's note gives the order of wear, heaviest first, and the code is that order.)
  3. **The code card, the quiet way.** `lock_guard` carries it (`itemsHeld`; dropped on a knock-out). Vos holds his own copy and gives it on "[Deal.]" (`#give_item` gives only from the speaker's items; F-12). Escaped Victoria, the cupboard's rota or Ghost's card gift names the guard; the guard's own ink then offers "[Sterling sent me.]" or "[The rota says you carry the card.]", which ends in his `#give_item`. There is no pickpocketing (R1D-m10).
  4. **From inside:** Victoria who holds or Vos who stands aside runs `#unlock_door:core` (`"unlockable": ["core"]`).
  5. **Ghost's code**, typed from the note (§4.2).
- **The pointer to the card** (R2-M3). A PIN lock emits no `door_unlock_failed`, so the line keys on the attempt itself: the lock guard's `bark` on `door_unlock_attempt` with `data.connectedRoom === 'core' && !globalVars.lock_guard_known`, `onceOnly`: "Shift code. The duty guard carries it." It reads before or after a guess, points at the code card, and through the rota in the security office makes the return trip available on every save (F-08a). No engine change.
- **One event:** two HaX mappings set `outer_lock_open`: `door_unlocked` with `data.connectedRoom === 'core' && !globalVars.outer_lock_open`, and `door_unlocked_by_npc` with `data.roomId === 'core' && !globalVars.outer_lock_open`. The guard matters because walking through an open door also emits `door_unlocked`.
- **What it computes**, on `global_variable_changed:outer_lock_open`, four mutually exclusive mappings write `head_start_out` (`&&` only):
  - `both`: `globalVars.share_zero_day !== 'stopped' && globalVars.share_resale === 'live'`
  - `zero_day`: `globalVars.share_zero_day !== 'stopped' && globalVars.share_resale !== 'live'`
  - `ghost`: `globalVars.share_zero_day === 'stopped' && globalVars.share_resale === 'live'`
  - `none`: `globalVars.share_zero_day === 'stopped' && globalVars.share_resale !== 'live'`
  Then, on `global_variable_changed:head_start_out`: `share_zero_day` becomes `released` where it was `live` (a `traced` share stays `traced`, so the core, the card and HaX can still tell a traced share from a lost one; F-16), `share_resale` becomes `released` where it was `live`, `raid_clock` becomes `t0400`, `hax_jammed` clears, and `open_the_outer_lock` completes. `quintero_lock`, `nightshade_lock` and `minder_lock` reveal themselves on the same global (their own mappings).
- **The release is said aloud** (R1D-M7). HaX is jammed and the panel is easy to miss, so the person in the next room says it: Tesseract's first line as the player walks in, one of four fixed strings by `head_start_out` (`both`: "Two cells have it. They'll waste it." / `zero_day`: "Zero Day has it. You didn't stop that one." / `ghost`: "Someone's buyers have it. Not Zero Day's." / `none`: "Nothing went at four. You were thorough."). Then HaX's return, after her one word and the designation, one fixed line by the same value ("Their head start went. Both shares." / "Zero Day's went." / "The resale went." / "Nothing went at the lock."). The lock panel shows `EARLY ACCESS: RELEASED` or `NOTHING TO RELEASE`.

### 4.6 The core's resume order

Tesseract is `koImmune` for the whole scene (RL §2.8). His conversation always enters at `core_router`, which routes on globals because a person-chat restarts after a reload, and a reload puts the player back at the forward post (§0), so the walk back ends here:

1. `m09_recruiter_offer == "double_crossed" and not wren_at_core` → the double-cross opening (MC §6.4).
2. `not core_greeted` → his release line (§4.5); then HaX, on the open line, inside this same conversation: her one word, the designation, her release line by value, "Ninety-nine. You've done well with them." / "Still HaX."; then "Get on his box." (sets `core_greeted`). **What opens it** (R2-m2): Tesseract's own mapping on `room_entered:core` with `!globalVars.core_greeted` (`delayMs: 800`) opens `core_router`. HaX's return is not a separate call, so nothing on entry can cut his first line; her lines are prefixed `Agent HaX:` in his story and drawn as the second speaker.
3. `not (flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted)` → "Finish on my box first. I'll keep." (R1D-B1: the case waits on all four flags).
4. `not case_heard` → his case and the Recruiter beat (sets `case_heard` on its last line).
5. The first of `exchange_1`, `exchange_2`, `exchange_3` still `""`.
6. `console_choice == ""` → the console menu ("Stop it", or "Show me how it works", with `join_step` resuming its own step).
7. WREN's beat when she is free and `wren_at_core` is false.
8. `database_outcome == ""` → the database menu.
9. `ending == ""` → step 5 (`points_landed` derived here).
10. Otherwise his line for the ending already chosen, and `#exit_conversation`.

### 4.7 The conclusion waits on `ending`

The ending's own beat at the core plays inside his conversation after the pick, so nothing may open over it (R1D-M1). The closing scene opens when **his conversation closes** with `ending` set, by a mapping on the scene's own NPC (F-02), each a hidden person NPC listed in `forward_post` so it is registered from load:

| `ending` | Scene(s), in order | Opened by | Last line completes `close_the_night`? |
|---|---|---|---|
| `arrest` | `six_oclock` | `conversation_closed:tesseract` with `globalVars.ending === 'arrest'`, `delayMs: 1500` | yes |
| `surrender` | `six_oclock` | the same, `'surrender'` | yes |
| `lethal` | `six_oclock` | the same, `'lethal'` | yes |
| `executed` | `six_oclock` (no walkabout) | the same, `'executed'` | yes |
| `scorched` | `six_oclock`, then `hearing` | `six_oclock` as above; `hearing` on `global_variable_changed:six_done` with `globalVars.ending === 'scorched' && !globalVars.closing_done` (`six_oclock`'s last line sets `six_done` on every ending) | `six_oclock`: no (on `scorched` its last line sets `six_done` only, and it has no credits entry); `hearing`: yes |
| `joined` | `citadel` | `conversation_closed:tesseract` with `globalVars.ending === 'joined'` | yes |

`six_oclock` carries one mapping per ending value it serves (five). **Every closing mapping**, the `conversation_closed:tesseract` ones included, carries `!globalVars.closing_done` and `onceOnly` (R2-M7, R2-m7), so re-talking him after the pick never replays a scene. Each scene's NPC also has a `game_loaded` backstop with its ending's value and `!globalVars.closing_done`; **`six_oclock`'s backstop for `scorched` adds `!globalVars.six_done`**, and `hearing`'s requires `six_done`. So a reload during the hearing re-opens the hearing alone, and a reload during the 06:00 scene re-opens that alone; the conclusion completes on the hearing's last line either way (R2-M7). The completing line runs `#complete_task:close_the_night` and `#set_global:closing_done:true`; §7 has what follows.

### 4.8 The other locks on the route

| Door | Lock | Ways through | Pointer |
|---|---|---|---|
| `workshop_floor` → `power_room` | `rfid`, `requires: tg_power_room_card` | a talked-round technician or Gary (`#unlock_door:power_room`, `unlockable`); clone Imran's or Gary's card; **the shift fitter's spare card from the fitter's locker in the security office** (a key lock, pickable; F-08b) | the reader beeps red; HaX: "Someone on that floor carries a card for it. Or there's the fitter's locker upstairs." |
| `power_room` → `server_hall` | none | – | – |
| `records_cupboard` (security office) | `pin` | Ghost's code (kept), Vector's code (present), or the cracker | optional; holds the gallery rota that names the lock guard |
| `fitter_locker` (security office) | `key`, pickable | the lockpick | optional; holds the spare power-room card |

So the no-talk route through the workshop is a boss-key return trip (see the reader, go back one room, pick the locker), the lockpick and the cracker each have a use on the critical path's quiet route, and the talk routes stay in the room.

### 4.9 The by-hand cut and its phone voice (R1D-M8)

The phone slot (Vance, else Elena, else HaX; MS-07) is unused when a captured Voltage is in the room, because he talks the player through it in person. Otherwise:

- **When it rings.** HaX sets `cut_by_hand` on any of: Wendell's "work round him" pick (his ink), Voltage's talk failing into a fight (his ink), `npc_ko:wendell`, `npc_ko:voltage_power`, and the player leaving Wendell's scene without telling him (`conversation_closed:wendell` with `globalVars.wendell_outcome !== 'told'`). The voice's own mapping rings on `global_variable_changed:cut_by_hand` (`delayMs: 1500`, `voiced: true`, `disableClose: false`), and again on `room_entered:power_room` with `cut_by_hand && !gallery_shutter_cut` (`resume: true`), so a reload's walk back re-rings it.
- **What it carries.** The short switching sequence as ink choices, the gallery camera switch as one more choice inside it (RL §2.5), and `#set_global:gallery_shutter_cut:true` on its last step.
- **Where the voice is HaX**, her hub topic "[Talk me through the shutter.]" (`{power_room_entered and not gallery_shutter_cut}`) carries the same knot, so even with the phone voice's ring missed the cut is always one tap away.
- **The isolator's text before the cut:** "A key switch and a breaker row. Whoever runs this room can cut it, or someone on the line can talk you through it."

## 5. HaX's hub by progress

`support_hub` in `m10_phone_agent0x99.ink`, m02's pattern: choices gated `{progress and not topic_given}`, newest topics first, ten or fewer visible at once, a sticky exit. Spent topics retire with a `_given` guard. Lines are SE §3.1's; stage 7 writes the rest.

**Always (sticky):** "[Where are we?]" (below); "[Field guide.]", one choice that branches by the VM stage the player is on, offered only once that stage's console has been used (the exposure gate, R1D-m13; R1D-m1 folds the four guides into one button); "[That's all.]".

**"[Where are we?]", by the first that holds** (R1D-m2): `ending != ""` (the closing scene owns the line) → `database_outcome != ""` "It's him now." → `console_choice != ""` "The database. Then him." → `exchange_3 != ""` "Your call on his console." → `flag4_submitted` "Hear him out." → `outer_lock_open` "You're in. His box first." → `gallery_open` "Up the stair. The lock's at the end." → `flag2_submitted and flag3_submitted and not gallery_shutter_cut` "The shutter's still live. Power room." → `flag2_submitted` "Get under the release service. The hatch in the sealed section." → `server_hall_entered` "The console takes the staging copy." → `gallery_shutter_cut` "Server hall's through there." → `workshop_entered` "Get to the power room. Then the shutter." → `ghost_call_done` "Stair's open." → `security_office_entered` "The handset. Answer it." → `breach_open` "Through the tunnel." → `door_scene_done and flag1_submitted` "Quintero's on her way back." → `door_scene_done` "Their monitoring. Gate terminal." → `flag1_submitted` "Netherton won't call it till the table's settled." → default "The table first, then the gate terminal." After a reload this is the line that names where to walk back to. Each `<room>_entered` is a HaX `setGlobal` on that room's first `room_entered`.

**Progress-gated topics** (each appears once its gate is met, and retires when spent or when the aim it belongs to completes):

| Gate | Topic | What it gives |
|---|---|---|
| `briefing_played` | "[How are you?]" | SE §3.1, by `m09_hax_confession_answer` (cold-start form on `not m09_completed`) |
| `briefing_played and not breach_open` | "[Why does he want me?]", "[The hour.]", "[The head start.]" | the briefing hub's three questions, moved here so the cutscene stays short |
| `flag1_submitted and m06_assets_seized` | "[The fence.]" | "Two posts empty. That's your freeze." |
| `flag1_submitted` | "[The power room?]" | "Whoever's in the power room runs your lights." (said unprompted at flag 1) |
| `clue_door_log and not clue_alibi and not door_log_given` | "[The door log.]" | clue 1's read; the dummy camera if asked; once-only, and retires once `clue_alibi` is set (R1D-m1) |
| `clue_door_log and whodunit_live and not clue_alibi` | "[Who was where at ten past?]" | clue 2, restating what the player saw at the gate, with the knocked-out-Arakawa variant (sets `clue_alibi`) |
| `clue_bench_log and whodunit_live and not signout_read` | **"[Who signed for the case?]"** | "Opened one fifty-two. Kowalczyk and Arakawa." (sets `signout_read`; R1D-M5) |
| `clue_door_log and whodunit_live and not wren_at_core` | "[I know who WREN is.]" | the accusation (MC §5); refused while `officer_out != ""` ("Get Malhotra back first.") |
| `officer_out != "" and <their clearing clue held>` | "[Bring Malhotra back.]" (by officer) | the recall over HaX's channel |
| `power_room_entered and not gallery_shutter_cut and phone_voice_is_hax` | "[Talk me through the shutter.]" | the by-hand cut (§4.9) |
| `flag2_submitted and not hax_jammed and not outer_lock_open` | **"[What's still live?]"** | reads `share_zero_day` and `share_resale` and where each can still be stopped (SE §3.1's four lines by state, plus "We're following Zero Day's. Nothing else goes." for a lone trace); on a recruited-Victoria save it ends with her rule ("Sterling goes with whoever's winning."). After the lock it becomes "[What went out?]", reading `head_start_out` |
| `flag2_submitted and backdoor_channel_live and not backdoor_closed` | "[The backdoor.]" | the count by branch; the task |
| `flag2_submitted and not flag3_submitted` | "[The hatch?]" | the sealed section's maintenance hatch and its station (FA §6.2) |
| `flag4_submitted` | "[The console.]", "[The vault line.]" | the one fact about the feed and the purge, again |

The schedule's three entries are said unprompted as flag 2 lands (SE §3.1), so they need no button.

**The jam** (F-06, R1D-M3). `hax_jammed` is set on `room_entered:gallery` with `!globalVars.outer_lock_open`, and cleared on `room_entered` of every other room (seven mappings, one per room) and on `head_start_out`. So stepping back down to the server hall brings her back at once ("Lost you up there. I'm back.", once), walking back from the core after the lock never re-jams her, and a reload in the gallery never leaves her jammed up the corridor. While it is true her hub opens on one line, "...", with only the exit; every mapping that opens her thread or sends a text carries `!globalVars.hax_jammed`. Arrested Victoria's line never rings there (MC §3.5).

**The ten-choice cap** (R1D-m1). The busiest moment is the server hall after flag 2, before flag 3, on a save with the whodunit open, the backdoor live, an officer out and the bench log read: "[What's still live?]", "[The backdoor.]", "[The hatch?]", "[Who was where at ten past?]", "[Who signed for the case?]", "[I know who WREN is.]", "[Bring Malhotra back.]", plus the three sticky choices: ten. "[The door log.]" has retired by then: it is once-only, and HaX volunteers the log's read when it is first opened in the security office, which sets `door_log_given`. The briefing questions retired at the breach and the fence and power-room topics when aim 3 completed. Stage 7 runs dialoguelint's `crowded-hub` on this save.

## 6. The countdown objects and the clock's steps

**The clock is one string global, `raid_clock`**, default `"t0145"`, moved only by story events (FA §4.2): no `gameClock`, no `timers`, and since round 1 no `delayMs` steps either (R1D-M6). Its values start with `t` so ink `#set_global` can't turn them into numbers (F-01); stage 9 greps the ink for `set_global:raid_clock:` and checks every value has the prefix. Every step's mapping (on HaX) moves the clock only forward: it carries `globalVars.raid_clock < '<this value>'` (the evaluator compares strings, `systems/npc-manager.js:57-66`, and the `t` values sort in time order; R2-m1). So walking back up the corridor after a reload never winds it back, and a skipped step (Arakawa down, or a step lost to a reload) never freezes the ones after it. Every step is a mapping `setGlobal`; no knot writes `raid_clock` (stage 9's grep finds none).

| Step | Value | Set by (events only) | What else happens on it |
|---|---|---|---|
| Briefing | `t0145` | default | the kit check; the breaching case open on the table |
| The split | `t0200` | the second of two events: `door_scene_done`, and the first use of the gate console (`gate_console_used`, from `object_interacted` with `data.objectType === 'vm-launcher' && data.roomId === 'forward_post'`). Netherton's own mapping then opens his short line (`delayMs: 1500`): "Quintero, Kowalczyk. The service tunnel. Go." Its **last** line sets `split_started`. Catch-ups (R2-M5): Netherton's `game_loaded` and `door_unlock_failed:blast_tunnel` mappings with `door_scene_done && gate_console_used && !split_started` re-open the line | their table copies hide themselves on `split_started`; **closes MS-23**: the split starts after the 01:58 copy and after the table, so it never lands inside Nightshade's scene |
| Arakawa's call | `t0210` | `conversation_closed:director_netherton` with `globalVars.split_started === true && !globalVars.arakawa_call_done && !globalVars.arakawa_ko`: `arakawa_gate` reveals himself beside the player and opens his own short scene (he dials; the telescope line; Malhotra on the net: "Arakawa, you're off the net."). Its last line sets `arakawa_call_done`. Catch-ups (R2-M5): `arakawa_gate`'s own `game_loaded` and `door_unlock_failed:blast_tunnel` mappings with `split_started && !arakawa_call_done && !arakawa_ko` reveal him and re-open the scene (`delayMs: 1500`). If Arakawa is down, HaX sets `arakawa_call_done` and nobody makes the call (§6h, design review): her mappings on `conversation_closed:director_netherton`, `npc_ko:arakawa_gate`, `game_loaded` and `door_unlock_failed:blast_tunnel`, each with `globalVars.split_started === true && globalVars.arakawa_ko === true && !globalVars.arakawa_call_done` (R3-M3: covers a player who leaves his scene early and then knocks him out) | the alibi the player sees; HaX's alibi topic restates it either way |
| The pair back | `t0220` | `arakawa_call_done` and `flag1_submitted`, whichever is second (two mappings) sets `pair_back`, plus a HaX `game_loaded` catch-up on both with `!pair_back` (R2-M5); Quintero's and Kowalczyk's table copies show themselves on it | their two lines if asked |
| The breach | `t0230` | HaX's mapping on `breach_open` (§4.1) | Netherton at the gate; Vector and Phantom where present |
| Security office | `t0245` | first `room_entered:security_office` | the handset rings |
| Workshop floor | `t0300` | first `room_entered:workshop_floor` | – |
| Power room | `t0315` | first `room_entered:power_room` | – |
| Server hall | `t0330` | first `room_entered:server_hall` | – |
| Leaving the hall | `t0345` | HaX's mapping on `gallery_open` (§4.4) | the console warning if unanswered; the sweep line; her last line before the jam |
| The outer lock | `t0400` | `head_start_out` written (§4.5) | every live share goes; LIVE lines become RELEASED; he and HaX say it |
| The core | holds at `t0400` | – | he pauses nothing; nothing moves while they talk |
| Join | – | `database_outcome === 'published'` | every object reads RELEASED |
| 06:00 | `t0600` | `six_oclock`'s mapping as its scene opens (`setGlobal` on the same event) | the table's object reaches six and nothing happens |

Each step's "first `room_entered`" is the forward-only guard: a second entry finds the clock already past it.

**The objects.** One per main-path room, eight in all (RL §2 names each and its place): the forward post's table screen, the blast door's panel, the security office's duty screen, the workshop's shift clock, the power room's load board, the server hall's release console screen, the gallery's lock panel (on the wall beside the outer lock, not under it), the core's key-console readout. Each is `readable`, `readDisplay: "gameDisplay"`, `addToNotes: false`, with `observationVariants` and `textVariants` (the same list for both), most advanced state first.

**The text.** Before flag 2: one line, `RELEASE 06:00 UTC  |  NOW 02:45`. From flag 2: three lines,

```
RELEASE 06:00 UTC  |  NOW 03:30
ZERO DAY: LIVE
SECOND BUYER: NONE
```

with `ZERO DAY` one of LIVE / STOPPED / TRACED / RELEASED (a traced share that went at the lock reads `OUT, TRACED`) and `SECOND BUYER` one of LIVE / STOPPED / NONE / RELEASED ("Ghost" never appears on a screen). At `t0400` the first line reads `EARLY ACCESS: RELEASED  |  NOW 04:00`, or `NOTHING TO RELEASE  |  NOW 04:00` on `head_start_out === 'none'`. On Join, every object reads `RELEASED. ALL CITIES.`

**Building the variants.** Conditions take `&&` only, so every combination is its own variant: an ERB helper, `countdown_variants(prefix)`, loops over the steps from flag 2 onward × `share_zero_day` (4) × `share_resale` (4) and writes about 50 variants per object, each like `globalVars.flag2_submitted === true && globalVars.raid_clock === 't0345' && globalVars.share_zero_day === 'live' && globalVars.share_resale === 'none'`; before flag 2, one variant per step. All eight objects call the same helper.

**The share display globals** (MC §12): `share_zero_day` default `live`; `share_resale` default `none`, set to `live` on Ghost's first line where `ghost_sale = selling`. Writers: C9 (`head_start_killed`), Ghost's call (`ghost_sale = stopped` → `share_resale = stopped`), the gallery (`confronted`, `talked_down`, `walked`, `vos_secret_used` → `share_zero_day = stopped`), the lock (§4.5). Each writer is a HaX mapping on the decision global with a fixed `setGlobal`, so the display can't disagree with the state that decides `head_start_out`.

**Said aloud.** The objects show; people say. HaX after flag 2: "It's set for four. It goes when the outer lock opens."; leaving the hall: "Fifteen minutes to their head start."; at the lock, he and HaX (§4.5). The objects are the authority for every spoken time, and stage 7 checks each line against this table.

## 7. `concludeRequires` and the conclusion

**`concludeRequires`:** `{ "tasksCompleted": ["submit_flag_1", "submit_flag_2", "submit_flag_3", "submit_flag_4"] }`, on `end_it`. The four flags only, server-authoritative (FA §4; MC §8.1). No story task and no import in it. `ending` is a string and `concludeRequires.globals` counts only boolean `true` (`game.rb:2719`), so the closing scene's task carries it instead (§4.7). Since round 1 the core's case waits on all four flags and the gallery on flags 2 and 3 (R1D-B1), so no player can reach an ending and then be refused at `/conclude`.

**The order at the end** (R1D-m14; m08's verified order, `scenarios/m08_the_mole/scenario.json.erb:258-272`, 540-556): the pick sets `database_outcome` (where it applies) and `ending` → the ending's own beat plays to its end inside his conversation → it closes → the scene NPC's mapping opens the closing scene (§4.7) → on its last line (the last scene's, on `scorched`) `#complete_task:close_the_night` completes `end_it`, the client concludes and the server checks the four flag tasks → the scene closes, and the music event on `conversation_closed:<that scene's NPC>` plays the ending's track and carries `closingCard` and `credits` (the F14 format) → the visualiser runs the card, the teaser (off unless `globalVars.teaser_enabled`, and skipped on `executed` and `joined`), then the credits. There is **no** second credits entry (R3-M2): m10's `game_loaded` backstops re-open the scene rather than completing the task as m08's do, so the replayed scene's own `conversation_closed` entry carries the credits, and a second entry would roll them over the replayed scene. If the last line ran and the close was lost, `end_it`'s `conclusionScreen` re-opens the visualiser on load, on the card.

**Credits by ending:** one music entry per closing NPC and ending value, on `conversation_closed:<npc>` with `globalVars.closing_done === true`; `six_oclock` has **no** entry for `scorched` (the hearing's carries it; R2-M7): `victory` for `arrest`, `surrender` and `lethal`; `end` for `scorched`, `executed` and `joined` (MISSION FAILED on `joined`, as m01's launch ending). The card and credit clauses are stage 7's, in the F14 `closingCard` / `section` format. Conditions are JavaScript and always name `globalVars.` (F-17).

**Music, the whole night** (SE §8; playlists are the engine's, `music/music-config.js`, plus F10's `silence`):

| Trigger | Condition | Playlist |
|---|---|---|
| `game_loaded` | `!globalVars.briefing_played` | `cutscene` |
| `game_loaded` | `globalVars.briefing_played === true && !globalVars.breach_open` | `noir` |
| `game_loaded` | `globalVars.breach_open === true` | `spy-action` (a reload respawns at the forward post, mid-raid) |
| `global_variable_changed:briefing_done` | `value === true` | `noir` (the cutscene's last line sets `briefing_done`; `briefing_played` is set by `setGlobalOnStart`, which emits no event) |
| `global_variable_changed:breach_open` | `value === true` | `spy-action` (the raid) |
| `npc_hostile_state_changed` | `isHostile === true && !globalVars.hax_jammed && !globalVars.outer_lock_open` | `threat` |
| `all_hostiles_ko` | `!globalVars.hax_jammed && !globalVars.outer_lock_open` | `spy-action` |
| `room_entered:gallery` | `!globalVars.outer_lock_open` | `silence` |
| `room_entered:server_hall` | `globalVars.breach_open === true && !globalVars.outer_lock_open` | `spy-action` (stepping back down out of the silence; R1D-m15) |
| `global_variable_changed:head_start_out` | – | `noir`, one chosen low track (the held cue at the core) |
| `global_variable_changed:exchange_1`, `_2`, `_3` | the number of the three that read `rebuttal` or `record` is 1 | a quieter chosen track |
| the same | that number is 2 or 3 | `silence` |
| `global_variable_changed:closing_done` | by `globalVars.ending` | none here; the credits entries above carry the closing music |

`victory` is never used before the closing scene closes: it opens the visualiser on its own (`bond-visualiser.js:1744`). The briefing cue moves on `briefing_done` rather than `conversation_closed:director_netherton`, because Netherton's conversation also closes after the table and the split.

**F10 (music silence)**, now a user decision: the `silence` playlist exists, so the gallery and the second landed point are true silence. No line depends on the music.

## 8. Time budget against 105 minutes

Stage 1's act figures stand (25 + 40 + 32 + 8 = 105, ceiling 110; arc §2). Below, the per-beat split. **The VM figures are estimates, not measurements** (M-14 is still open): no timed run of m10's VM exists, and this author may not read the VM plan. They are set from m07 and m08, which ship four flags each inside 90 minutes, at about 8 minutes a flag with the field guide. A timed VM run (the `opus48` agent, or a stage 8 playtest) replaces them; if the four flags come in over 34 minutes, the cut order below applies before anything else moves.

| Act | Beat | Min | Notes |
|---|---|---|---|
| 1 | Briefing cutscene and the private aside | 5 | the question hub moved into HaX's phone (§5), so the cutscene is spine only |
| 1 | The door scene at the table | 3 | one closing choice; the check adds about 1 on the unshown branch |
| 1 | Flag 1, with the split, Arakawa's call and the pair back played around it | 9 | VM 7, counted from the console's first use; HaX asks the player to start it before the table, so it boots during the door scene (R1D-m16) and the start room's 17 minutes include the boot |
| 1 | Breach, blast door, tunnel post | 3 | +1 on the tripwire route (the ladder) |
| 1 | Security office: the photo, clue 1, Ghost's call (2–3) | 5 | |
| | **Act 1** | **25** | |
| 2 | Workshop floor: the scene (3), the sheet (1), the bench log (1), the power-room door (1) | 6 | |
| 2 | Power room: the scene and the cut | 6 | the by-hand cut is the longer option (+1) |
| 2 | Server hall: arrival, Asante or Mercer, the guards | 4 | Mercer's fight +2 |
| 2 | Flags 2 and 3 | 17 | VM 8 + 9; flag 3 goes in at the sealed hatch at the hall's east end (R1D-m5), half a minute's walk inside the same work |
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

**The timed VM run comes before stage 7 writes lines** (R1D-m19). If the four flags take more than 34 minutes, cut-order item 1 (the backdoor task) is applied at once, before anything else moves.

**Cut order if a timed run comes in long** (arc §2, unchanged): the backdoor task; Victoria's line as goodwill only; his idle lines down to one; Vector's and Phantom's lines down to one each; the briefing hub (already moved to the phone here, which saves about a minute of cutscene). Never cut: the five scenes, the three clues and the accusation, the three exchanges, the stated costs, HaX's last line before the jam, an ending scene, the walkabout's first pick.

## 9. The 35 test runs as F15 starting states

MC §16's live plan (3 end to end, 8 + 5 + 4 + 6 + 9 segments) as `tools/playtest/new-game.rb` command lines: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m10_full_disclosure --imports=<file> --start-room <R> [--unlock ...] [--set ...]`. Imports files go in `tools/playtest/m10_imports/<run>.json`; only the keys that differ from the defaults are listed (each listed source also needs its `mNN_completed: true`).

**Deep starts** (F-00, R2-M8; the bootstrap as committed, `tools/playtest/README.md`). `--start-room` moves every phone NPC (HaX, Ghost, Victoria's line, the phone voices) into the new start room, so HaX's mappings, hub and `unlockDoor` mappings register (`unlockDoor` needs no met NPC). Person NPCs stay put unless carried: the core-start runs add `--carry-npc six_oclock --carry-npc hearing --carry-npc citadel` (hidden at 500, 500, so they stay off-screen in the core). `--complete-task` marks earlier tasks done, so each baseline starts with the panel where a player would have it. `--submit-flag` records a flag as submitted, applies its station's rewards (the `emit_event` reward is written to `pending_events`, which the client doesn't read, so each run also `--set`s the flag's global; R3-m1) and completes its `submit_flags` task, so `/conclude` can pass.

**What the bootstrap can't seed:** ink state and anything the client does when a task completes or a reward arrives (mappings, unlocks, messages); the runs `--set` the globals those leave behind, including each `flagN_submitted` beside its `--submit-flag`.

- **Aims.** Earlier aims are completed by `--complete-task`; anything left open is reported, not failed.
- **The start kit** is `startItemsInInventory`, present on every run.
- **Reloads.** A reload respawns at `startRoom`: the forward post on full runs, the bootstrap's start room on deep starts. Every reload check (A4, A5, A7, A8, C3, D3, D9) expects the respawn, times any walk back, and checks the state on arrival.

**Baselines** (each also sets every door done-flag it passes, so no catch-up fires over the tester's first command, and `hax_jammed=false`; flag ids are station-qualified):

- **S-wk** (workshop start): `--start-room workshop_floor --unlock blast_tunnel --unlock security_office --unlock workshop_floor --submit-flag gate_terminal:<vm>-flag1 --complete-task take_the_briefing --complete-task settle_the_table --complete-task go_through_the_blast_door --complete-task reach_security_office --complete-task answer_the_handset --set briefing_played=true --set briefing_done=true --set door_scene_done=true --set gate_console_used=true --set split_started=true --set arakawa_call_done=true --set flag1_submitted=true --set pair_back=true --set breach_open=true --set inner_door_open=true --set security_office_entered=true --set ghost_call_done=true --set stair_open=true --set aside_done=true --set hax_jammed=false --set raid_clock='"t0245"'`
- **S-so** (security office start, whodunit): `--start-room security_office --unlock blast_tunnel --unlock security_office --submit-flag gate_terminal:<vm>-flag1 --complete-task take_the_briefing --complete-task settle_the_table --complete-task go_through_the_blast_door`, the same `--set` list up to and including `inner_door_open`, plus `--set aside_done=true --set whodunit_live=true --set whodunit_open=true --set hax_jammed=false --set raid_clock='"t0230"'` (the aim opens from HaX's `game_loaded` catch-up, §2 notes)
- **S-sh** (server hall start): S-wk with `--start-room server_hall --unlock power_room --unlock server_hall --submit-flag release_console:<vm>-flag1 --complete-task take_the_stair_down --complete-task reach_power_room --complete-task cut_the_shutter --set workshop_entered=true --set power_room_entered=true --set gallery_shutter_cut=true --set flag2_submitted=true --set raid_clock='"t0315"'`
- **S-core** (core start): S-sh with `--start-room core --unlock gallery --unlock core --carry-npc six_oclock --carry-npc hearing --carry-npc citadel --submit-flag sealed_hatch:<vm>-flag1 --submit-flag core_host_terminal:<vm>-flag1 --complete-task reach_server_hall --complete-task cross_the_gallery --complete-task open_the_outer_lock --set server_hall_entered=true --set flag3_submitted=true --set gallery_open=true --set outer_lock_open=true --set head_start_out='"none"' --set share_zero_day='"stopped"' --set raid_clock='"t0400"' --set flag4_submitted=true` (drop flag 4's two options where the run says "worked"; on D1's two `zero_day` games, `share_zero_day='"released"'`; R2-m8b)

**End to end (3; start: mission start; VM flags worked)**

| Run | Imports | Notes |
|---|---|---|
| E1 kind | m01 `final_choice=arrest`; m02 `gary_protected`, `ghost_deal_accepted`, `exposed_hospital`, `bed4_manually_stabilised`; m03 `victoria_fate=recruited`; m04 `voltage_captured`, `disclosure_choice=full`, `vance_is_ally`; m05 `found_pipeline_list`; m06 `assets_seized`, `satoshi_stance=rejected`; m07 `team_assignment=trojan_horse`, `debrief_stance=owned`; m08 `nightshade_triple_agent`, `triple_agent_first_payment`, `named_on_evidence`; m09 `nightshade_shown_file`, `recruiter_offer=named`, `deck_pulled=her_file`, `hax_confession_answer=same_in_your_place`, `albion_notified`, `sleeper_shortlist` | times the whole night against §8 |
| E2 hard | m02 `ghost_deal_accepted`, `ghost_keys_used`; m03 `victoria_fate=escaped`, `sterling_on_call_seen`; m04 `voltage_escaped`, `crew_lost`, `disclosure_choice=quiet`; m07 `team_assignment=fracture`, `debrief_stance=hardened`; m08 `nightshade_triple_agent`; m09 `recruiter_offer=taken`, `sleeper_named`, `deck_pulled=none`, `recruiter_secret=kept` | the outer lock by the cracker while the guard's cone is off the keypad |
| E3 cold | `--imports=none` | the fingerprint plate at the outer lock |

**Segment A: forward post to the stair (8; start: mission start)**

| Run | Imports | Extra |
|---|---|---|
| A1 | m09 `recruiter_offer=taken`, `sleeper_named`; m08 `nightshade_arrested`, `nightshade_ko_before_fate`; m02 `ghost_deal_refused` | the refused branch's code goes into the notepad (`#add_note`) |
| A2 | m09 `recruiter_offer=double_crossed`, `sleeper_named`, `deck_pulled=her_file` | – |
| A3 | m08 `nightshade_triple_agent`, `triple_agent_first_payment`; Vector and Phantom present (`m08_completed`, neither accused); m09 `nightshade_shown_file`; m02 `ghost_deal_accepted`, `exposed_hospital` | the gate console started before the table: the split waits for the table |
| A4 | as A3 | reload before the closing choice: respawn, walk back, the knot re-enters at it; a strike at Nightshade does nothing (`__test.debugKO` returns `ko-immune`) |
| A5 | m08 `nightshade_triple_agent`, `nightshade_tidied`; m09 `cage_bin=nightshade_copy`; m02 `ghost_deal_accepted`, `ghost_keys_used` | the map unchecked; the ladder used **before** trying the door (the cost still lands, F-13); reload mid-Ghost-call, then the handset resumes it |
| A6 | m08 `nightshade_triple_agent`; m02 `ghost_deal_refused` | – |
| A7 | m08 `nightshade_arrested`; m02 `completed` only; m03 `guard_bribed`; m09 `cage_bin=nightshade_copy`, `recruiter_offer=named` | first game: reload during Arakawa's scene (his catch-up re-opens it; the breach waits, then opens); second game: leave his scene before its last line, knock him out, try the blast door (HaX sets `arakawa_call_done`; R3-M3); third game: Arakawa knocked out before the split, no call, HaX's alibi variant |
| A8 | m08 `nightshade_arrested`; m02 `ghost_deal_accepted`, `exposed_hospital` | reload between deal and check |

**Segment B: workshop and power room (5; S-wk)**

| Run | Imports | Extra |
|---|---|---|
| B1 | none | Wendell told; then the fitter's-locker route on a second game |
| B2 | m02 `gary_protected`; m04 `voltage_captured` | – |
| B3 | m02 `completed`; m04 `voltage_escaped`, `voltage_print_on_bypass` | dust the bypass panel; the print matches |
| B4 | m02 `completed`; m04 `voltage_escaped`, `static_left` | dust the panel: no match on file; the sheet talk-down |
| B5 | m02 `completed`, `ghost_deal_accepted`, `ghost_keys_used`; m04 `voltage_captured` | `--set ghost_watch_on_route=true` (Imran keeps his card); second game: Wendell knocked out, the phone voice rings |

**Segment W: the whodunit (4; S-so)**

| Run | Imports | Accusation path |
|---|---|---|
| W1 | none | right, face to face (four cards); her question; Arakawa looks away |
| W2 | none | wrong Malhotra; a second accusation refused; Malhotra recalled; then right, on the line |
| W3 | m08 `nightshade_ko_before_fate` | `--set nightshade_tethered=true`; wrong Arakawa, not recalled (the county road) |
| W4 | none | wrong Quintero, not recalled; then Kowalczyk on the line with no Quintero (stopped at the core) |

**Segment C: server hall to the lock (6; S-sh)**

| Run | Imports | Extra |
|---|---|---|
| C1 | m03 `victoria_fate=recruited` | kill Zero Day's; trust her; she opens it from inside |
| C2 | m03 `recruited`; m02 `ghost_deal_accepted` | `--set ghost_sale='"bait"' --set share_resale='"live"'`; trace; trust (share live: the alarm); the cracker while the guard's cone is off the keypad |
| C3 | m03 `recruited` | console skipped; confront; reload, then left unanswered; step back down from the gallery to the console (HaX returns) |
| C4 | m03 `escaped`, `sterling_on_call_seen`; m07 `completed`, `team_assignment=meltdown`; m02 `completed` | `--set ghost_sale='"bait"' --set share_resale='"live"'`; kill Ghost's buyers'; talked down / knocked out on reload; **the lock by the guard's dropped code card** (MC §16 had "Ghost's code", which this save can't have; the code route is A1's and A6's) |
| C5 | m03 `escaped`; m07 `team_assignment=meltdown` | trace; "[Go.]" (the guard named) then the guard's own `#give_item`; arrest on reload; the backdoor closed |
| C6 | m03 `victoria_fate=arrested` | S-sh **without** flag 2's `--submit-flag` and `--set` (so her first ring fires on the change; R2-m8a); submit flag 2 in the browser with the station's `test:flag` alias; kill Zero Day's; the line: deal; the secret used on Vos; reload: the call closed, re-ring at the stair, abandoned; Vos's trade |

**Segment D: the core (9; S-core)**

| Run | Imports | Extra |
|---|---|---|
| D1 | E1's file | six fresh games, one per ending; the closing chain per §4.7's table (the hearing after the 06:00 scene on `scorched`); `--set head_start_out='"zero_day"'` on two for the card and his release line |
| D2 | none | Join's steps; the confirmation choice's "No" returns to step 2 |
| D3 | none | a reload between each menu; `points_landed` derived, not counted |
| D4 | none | strikes at him at each menu (immune); then the KO fallback on a scratch copy with the key removed |
| D5 | none (`--set whodunit_live=true`) | with Quintero; then `--set quintero_ko=true` for "[Stop her.]" |
| D6 | m09 `recruiter_offer=double_crossed`, `sleeper_named`; second game `--set sleeper_caught=true --set accused='"kowalczyk"'` | – |
| D7 | m09 `deck_pulled=alpha_tapes`, `recruiter_offer=refused` | with and without `--set quintero_ko=true` |
| D8 | four seeded files for the knock-out pattern (0, 1, 2–3, 4+); `m04_disclosure_choice=full` with `m02_exposed_hospital`; `m06_satoshi_stance` each value | the exchange pools and stings |
| D9 | m07 `completed`, `team_assignment=meltdown` | lower the weapon, reload (respawn, walk back), then the executed ending; the 06:00 screen story |

## 10. Proposed changes

None is made here. RL §7 lists the layout ones. Updated in round 1.

| # | To | Change | Why |
|---|---|---|---|
| S4-1 | MC rule 1.5, §12 done-flags; FA §4.0 "Forced scenes and nets" | "A door opened by an eventMapping firing `unlock_door`" → "a story door (an RFID lock with no card) opened by the F19 mapping unlock on HaX, its done-flag set from the unlock event, with `game_loaded` and failed-try catch-ups" | F19; F-05 (the flag can't claim a door the server refused) |
| S4-2 | MC §3.1 (the breach) | The breach needs the table, flag 1 and the pair back; HaX's `breach_call` carries Netherton's "Breach. Go." | §4.1 |
| S4-3 | MC §3.5, FA §4.0 route, s0 §2.2 "RFID cloning" row | The outer lock is a PIN lock with five ways through: the cracker while the guard's cone is off the keypad, the fingerprint plate, the code card, the inside, Ghost's code | accepted by the orchestrator; F-07, F-09 |
| S4-4 | MC §3.2, FA row 13, arc §7.5 | The kept branch's "east door" and Vector's sealed door are the records cupboard in the security office | accepted by the orchestrator |
| S4-5 | MC §8.1, FA §4.0, §4.6 | The closing scene opens when his conversation closes; the hearing chains off the 06:00 scene; `close_the_night` on the last scene's last line; credits on that scene's `conversation_closed` (m08's order) | R1D-M1, R1D-m14 |
| S4-6 | arc §3 beat 8, SE §3.1 | The briefing's question hub moves into HaX's phone | saves about a minute of cutscene |
| S4-7 | FA §15/§17 MS-23; arc §5.2 | The split starts on the second of the table and the gate console's first use; Arakawa's call and the pair back follow on events, not timers | R1D-M6; closes MS-23's time half |
| S4-8 | MC §6.1, FA §4.1 | Tesseract `koImmune` for the whole core scene | the engine can't toggle the key; nothing needs it |
| S4-9 | Orchestrator, tooling | `new-game.rb --submit-flag` (now built, with `--carry-npc` and `--complete-task`) | used by §9 |
| S4-10 | Stage 7 | The objects' times are the authority for every spoken time | §6 |
| S4-11 | arc §6.3, MC §3.5 | The gallery needs flags 2 and 3 and the cut; his case needs all four flags | R1D-B1 |
| S4-12 | arc §9.2, MC §3.5 | The head start's release is said aloud by him (first line in the core) and by HaX on her return, by `head_start_out` | R1D-M7 |
| S4-13 | arc §6.3 item 6, FA §6.2 | Flag 3 goes in at a station at the sealed section's hatch | R1D-m5 |
| S4-14 | arc §8.2 clue 3, SE §3.1 | HaX's hub reads the sign-out sheet's names ("[Who signed for the case?]") | R1D-M5 |
| S4-15 | arc §6.2, MC §3.4 | The by-hand cut is rung by the phone voice on a stated trigger, re-rung on entry, with HaX's topic as the last net | R1D-M8 |
| S4-16 | MC §12 | New locals: `split_started`, `gate_console_used`, `pair_back`, `aside_done`, `briefing_done`, `six_done`, `cut_by_hand`, `ladder_used`, `<room>_entered`, `<door>_open`, `door_log_given`, `signout_read`, `margin_note_read`, `lock_guard_challenged`, `keypad_dusted`, `voltage_print_lifted`; `raid_clock` values take a `t` prefix | the wiring above |
| S4-17 | MC §4 C9 note | A traced share stays `traced` at the lock; the screens read OUT, TRACED | F-16 |
| S4-18 | MC §12 done-flags, FA §4.0 | Story doors' done-flags are set on `door_unlocked_by_npc` from HaX (`npcId === 'agent_0x99'`) | R2-M1 |
| S4-19 | arc §8 (whodunit), MC §5 | The WREN aim is story-gated by `whodunit_open`, opened at the aside | R2-M6 |
| S4-20 | MC §3.5 | The lock guard challenges only at the keypad (`requireGlobal: at_keypad`), with a visible cone; the pointer to the card plays on the first attempt | R2-M3, R2-M4 |
| S4-21 | MC §4 C9 | Flag rewards are `emit_event` (`flag_N_in`), and HaX sets each `flagN_submitted` | R2-m5 |
| S4-22 | SE §3.1, arc §9.3 | HaX's return at the core is spoken inside his conversation, as the second speaker | R2-m2 |

## 11. For the user

- **Time budget.** The VM's 32 minutes are estimates from m07/m08 (M-14 still open). A timed VM run, before stage 7, turns 105 into a measured figure.
- **The bootstrap** now carries the phone NPCs, carries the closing NPCs with `--carry-npc`, and submits flags and tasks (§9); nothing waits on it.
- **Optional engine change** (R3-m1): emit and clear `player_state.pending_events` after `game_loaded`, which would close the narrow window where a dead tab loses a flag's global. The design works without it.
- F10 and F17–F19 are committed (57d3d237).
- **Voiced calls** follow F20 (only what a voiced call opens is voiced): about 85 lines in m10's forced calls (§13).

## 12. Review round 1 outcomes

Two reviews, 2026-10-21: `../stage_5/REVIEW_R1_PUZZLES.md` (F-00 to F-22: 1 blocker, 9 majors, 13 minors) and `../stage_5/REVIEW_R1_DESIGN.md` (R1D: 1 blocker, 11 majors, 19 minors). The orchestrator's rulings and user decisions F17 (voiced forced calls), F18 (the flag-reward door bug fixed), F19 (a mapping key that unlocks a door persistently) and F10 (a `silence` playlist) came with them. **All 54 findings are applied; none is withdrawn.** Both docs carry the fixes; this table lists where each landed in this file, and RL §9 lists the layout ones.

| Finding | Fix | Where |
|---|---|---|
| F-00 blocker | act-start runs assume the bootstrap fix; walk-in fallback stated | §9 |
| R1D-B1 blocker | gallery on flags 2 + 3 + the cut; case on all four flags | §4.4, §4.6, §1 |
| F-01 | `raid_clock` values `t0145`…`t0600` | §0, §6 |
| F-02 | every `setVisible` and scene opening on its own NPC | §0, §4.7, §6; RL §2, §5 |
| F-03 | flag rewards set globals only; flag 3 row fixed | §0, §3 |
| F-04, R1D-m4 | WREN aim by explicit `unlockAim` at the aside, with `game_loaded` catch-up | §2 notes |
| F-05 | done-flags set from the unlock event; failed-try catch-up | §4 pattern |
| F-06, R1D-M3 | jam set only before the lock, cleared on entering any other room; reload respawn stated everywhere | §0, §5, §4.6, §9 |
| F-07 | fingerprint plate at the outer lock; dustable bypass panel on escaped Voltage | §4.5; RL §2.5, §2.7 |
| F-08 | (a) the keypad's wrong-code line points to the rota; (b) the spare power-room card moved to the fitter's locker in the security office | §4.5, §4.8; RL §2.3–2.4 |
| F-09 | the guard's window, with the challenge at the minigame's close | §4.5 |
| F-10, F-11, F-20, R1D-M10, R1D-m7, R1D-m8 | positions | RL §2 |
| F-12, R1D-m10 | Vos's own card; the guard's own `#give_item`; no "lifted" | §4.5 |
| F-13 | the ladder carries the tripwire's cost | §4.3 |
| F-14 | flag rewards became `emit_event` in round 2; the dead-tab window is accepted (R3-m1) | §3 |
| F-15 | `player_room` dropped; `resume: true` on every ring | §4.2 |
| F-16 | traced share kept | §4.5, §6 |
| F-17 | `globalVars.` in every music condition | §7 |
| F-18 | `flags_for_vm_slice` per station; `hintOnlyFlags` as a Hash | §2 notes; RL §2 |
| F-19, R1D-m12 | signs are names; holding lines on `door_unlock_failed`; four expected validator warnings noted | §4 |
| F-21, R1D-m18 | one id per holder; phone NPCs in the start room; KO guards on copies | §4.1; RL §2 |
| F-22 | a second Victoria copy for the threat branch | RL §2.7 |
| R1D-M1, R1D-m14 | the closing chain table; m08's credits order | §4.7, §7 |
| R1D-M2 | "his console" / "the key console" in the core | §2; RL §2.8 |
| R1D-M4 | object triggers on `object_interacted`, not latch globals | §4.2, §4.3; RL §2.6 |
| R1D-M5 | "[Who signed for the case?]" | §5, §3 |
| R1D-M6 | the split and Arakawa's call on events | §6 |
| R1D-M7 | the release said aloud | §4.5 |
| R1D-M8 | the phone voice's ring and re-ring | §4.9 |
| R1D-M9 | a 4×2 server hall; bunker props first at dressing; no ninth room | RL §1, §2 |
| R1D-M11 | Ghost's call answered at the handset, not sprung | §4.2 |
| R1D-m1 | one "[Field guide.]" button; topics retire; count of ten | §5 |
| R1D-m2 | "[Where are we?]" rungs to the end | §5 |
| R1D-m3 | aim and task wording | §2 |
| R1D-m5 | flag 3's station at the sealed hatch | §2, §3; RL §2.6 |
| R1D-m6 | the tripwire line names the ladder; narration fixed | §4.3 |
| R1D-m9 | reinforcements replaced by a line when Nightshade holds the lock | RL §2.7 |
| R1D-m11 | codes said on calls go into the notepad | §4.2 |
| R1D-m13 | field guides offered on exposure | §3, §5 |
| R1D-m15 | music back on entering the server hall | §7 |
| R1D-m16 | the gate console started before the table | §3, §8 |
| R1D-m17 | margin note pointer and optional task | §2, §3 |
| R1D-m19 | timed VM run before stage 7; cut item 1 early if over | §8 |
| R1D §6h (Arakawa down) | his call gated on `!arakawa_ko`; HaX's variant | §6, §3 |
| R1D §2d″ (stealth) | the tunnel is a timing pass, the gallery a talk or fight; said in RL | RL §2.2, §2.7 |

## 13. Voiced phone calls (F17, F20)

Forced phone calls are voiced with `"voiced": true` on the `phone-chat` mapping or `timedConversation` (F17, committed; `docs/agents/FINALE_ENGINE_VOICED_CALLS.md`). **F20 (user, 2026-10-21): only what a voiced call opens is voiced**: the call's knot and the knots it diverts to, up to the contact's hub; the hub, its topics and the contact's texts stay text. The final boundary rule goes in that doc's new section; this count assumes the call's knot and its diverts up to HaX's hub. Narration in a voiced call is silent, so the narrator lines inside HaX's calls (the crank, the ladder) are written to read well unspoken and aren't counted. Face-to-face scenes are voiced as in every mission and aren't listed: that includes HaX's lines inside Tesseract's conversation (her return, the flag 4 facts' repeat at the database menu, the database costs), which are person-chat (§4.6).

Counts are spoken lines by the caller and any second speaker on the line, for the audio budget; stage 7 fixes the wording and the counts move with it.

| Call | Speakers | Lines (approx.) |
|---|---|---|
| Ghost, the duty handset (§4.2): kept 6, refused 7, broken / unanswered / stranger about 20 distinct between them | Ghost | 33 |
| Arrested Victoria's secure line (MC §3.5) | Victoria | 9 |
| The by-hand cut (§4.9): one voice per save, but all three recorded | Vance, Elena, HaX | 8 each, 24 |
| HaX `breach_call` | HaX, Netherton on the net | 3 |
| HaX `stair_open`, `inner_door`, `tripwire`, `ladder` | HaX | 5 |
| HaX `gallery_open`: the console warning, the sweep line, her last line before the jam by branch | HaX | 5 |
| HaX as flag 4 lands: the notice (cold start or m09 form), the feed, the vault line, the purge | HaX | 6 |
| **Total** | | **about 85** |

Not voiced under F20: HaX's hub topics, "[Where are we?]", "[What's still live?]", the field-guide lines and every text, including the two 06:00 texts (unvoiced by design, FA §4.6). This replaces round 2's estimate of about 320, which assumed the whole thread was batched.

## 14. Review round 2 outcomes

`../stage_5/REVIEW_R2.md`, 2026-10-21: 0 blockers, 8 majors (R2-M1 to M8), 8 minors (R2-m1 to m8). The engine features were committed the same day (57d3d237), so every "being built" is now the committed name. **All 16 are applied, none withdrawn**, with the orchestrator's rulings. RL §10 lists the layout ones.

| Finding | Fix | Where |
|---|---|---|
| R2-M1 | done-flags on `door_unlocked_by_npc` with `npcId === 'agent_0x99'`; the gallery's call now plays before the jam | §0, §4 pattern, §4.4 |
| R2-M2 | the core east of the gallery | RL §1, §2.7–2.8 |
| R2-M3 | the pointer to the code card on `door_unlock_attempt`, `onceOnly`, reworded; no engine change | §4.5 |
| R2-M4 | `requireGlobal: at_keypad` and `skipIfGlobal`; a visible cone replaces the bark; no `pauseForPlayer` | §4.5; RL §2.7 |
| R2-M5 | `game_loaded` and failed-try catch-ups for the split, Arakawa's call and the pair back; `split_started` on the line's last line | §4.1, §6 |
| R2-M6 | the WREN aim story-gated by `whodunit_open`, with the explicit `unlockAim` | §2 |
| R2-M7 | `!closing_done` and `onceOnly` on every closing mapping; `six_oclock`'s scorched backstop needs `!six_done`; no scorched credits on `six_oclock` | §4.7, §7 |
| R2-M8 | `--carry-npc` for the three closing NPCs, `--submit-flag` for the four flags, `--complete-task` for earlier tasks | §9 |
| R2-m1 | forward-only `<` clock guards; every clock step a mapping, none in ink | §6, §4.1, §4.4 |
| R2-m2 | Tesseract opens `core_router` on `room_entered:core`; HaX's return inside it | §4.6 |
| R2-m3 | `cooldown: 0` and `data.objectName` keys on the console controls and the ladder | RL §2.2, §2.6 |
| R2-m4 | dusting wired: `fingerprint_collected:<owner>` + `data.objectId` → `keypad_dusted` / `voltage_print_lifted`; the keys as `textVariants` | §4.5; RL §2.5, §2.7 |
| R2-m5 | `emit_event` flag rewards, queued server-side | §3 |
| R2-m6 | positions; the fifth expected validator warning | RL §2 |
| R2-m7 | covered by R2-M7 on all six closing rows | §4.7 |
| R2-m8 | C6 without flag 2 pre-set; S-core sets `share_zero_day`; `--complete-task`; stale wording gone | §9 |

## 15. Review round 3 outcomes

`../stage_5/REVIEW_R3.md`, 2026-10-21: 3 majors, 5 minors. **All 8 applied, none withdrawn.** No further review round; the orchestrator checks directly.

| Finding | Fix | Where |
|---|---|---|
| R3-M1 | `outer_lock_open` removed from the lock guard's `skipIfGlobal`, so a crack in his cone is challenged as the cracker closes; stage 9 confirms the order | §4.5; RL §2.7 |
| R3-M2 | no second credits entry; the re-opened scene's own close carries the credits | §7 |
| R3-M3 | HaX sets `arakawa_call_done` on `npc_ko:arakawa_gate`, `game_loaded` and `door_unlock_failed:blast_tunnel` when he is down; an A7 check | §6, §9 |
| R3-m1 | `emit_event` fires from the server's response; the dead-tab window is accepted, and the engine change is offered to the user | §3, §9, §11 |
| R3-m2 | `at_keypad` also cleared on `room_entered:gallery` and `game_loaded` | §4.5 |
| R3-m3 | the extra `whodunit_open` guard on WREN task mappings dropped | §2 notes |
| R3-m4 | the chair and the reinforcements off the lock guard's patrol row | RL §2.7 |
| R3-m5 | stale copies reworded | §3, §11; RL §6, §7 |
| F20 (user) | voiced lines recounted for the calls only: about 85 | §13 |


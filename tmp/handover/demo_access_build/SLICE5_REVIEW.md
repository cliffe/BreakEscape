# Slice 5 review: demo_access_tour (Ama, objectives, ending)

Scope: `git diff d4dbef494 e82f7079b -- scenarios/demo_access_tour` (commit 4b882dc59), read through `git show e82f7079b:`. HEAD has no later change to the scenario folder. No edits to scenario, ink or tests. Checks run: validator (0 errors, same 11 warnings as the handover), inkcheck on ama.json and ama_phone.json (clean), and a scripted ink driver over Ama's hub, debrief branches and Lorna's start. Stopped at the context limit: Rails tests and the live check were not run, and the hub order was traced by reading, not by a full state matrix.

Counts: B0 / M2 / m4 / n5

## Findings

### M1. W4 blocks W6b, so the lost-session player never gets the line built for them
Evidence: ama_phone.ink:51-54 (W4 is `not has_julian_rdp`, ahead of W6b at 59). `has_julian_rdp` is set only by `onPickup` of julian.rdp (scenario.json.erb:335). The plan's presenter note says the off-route player uses Connect on the desktop, not Copy, which never picks the file up. That player has `done_t_julian_pc` true, `julian_lost_with_desk` true after signing out, and `has_julian_rdp` false, so the hub shows "Delphine's desktop had a saved connection on it. Copy it, don't connect from there." instead of W6b, and keeps showing it (it also hides W7 to W18).
Fix: add `and not done_t_julian_pc` to both W4 lines (51 and 53).

### M2. Optional steps sit ahead of required ones, and W7 states something false after W6b stops
Evidence: ama_phone.ink:62-65 (W7, W8), 70-71 (W11), against required W9, W10, W17 at 66-69, 82. First unmet wins, so a full-route player who skips the door controller (optional) is told W7 forever and never hears about Lorna (t_copy_badge), the comms cupboard or the unplug. The same happens on the short route with W11 (`not saw_in_use`, optional) ahead of W17. The plan table orders it this way, so this is plan-faithful, but it breaks plan 2.8's own rule that required work must not wait on optional work. Also, W6b's `and not done_t_copy_badge` (line 59) ends W6b once the badge is copied; W7 then says "With Julian's session up, the box can see further" while `julian_lost_with_desk` is true and `julian_back` is false, which is false.
Fix: guard W7 with `and (not julian_lost_with_desk or julian_back)`. Make the optional lines yield to the required ones: move W9, W10 and W17 above W7, W8 and W11, or add a `done_t_*`-based skip once the player has moved on (for W11, `not saw_in_use and not done_t_open_session and not done_t_unplug`).

### m1. F lines still send the player to the box after it is out
Evidence: ama_phone.ink:62-81. After `done_t_unplug`, a full-route player (or one who hits "Actually, show me the full walk-round." while `wrap_open()` is still false, ama.ink:65) gets W7 "Open the network view at the box" and W14 "plants in reception have room for one more gadget" with the box in the bag. Plan 2.12 step 5 says there is no mid-tour switch and no hub line for the network stops after the unplug.
Fix: hide the box-dependent F lines (W7, W8 only if the codes are needed, W13 to W16) when `done_t_unplug`, or hide the ama.ink:65 switch when `done_t_unplug`.

### m2. `taskOnKO: t_debrief` on Ama is a bypass if she can ever be knocked out
Evidence: scenario.json.erb Ama NPC `taskOnKO` (npc-hostile.js:459-467 emits `task_completed_by_npc`). The server does not check the aim's lock or `wrap_open()` (game.rb:5186 checks only `npc_encountered?`), so a KO would complete t_debrief and conclude the mission with `tour_debriefed` false (no credits, no closing card). Ama has no hostile config, so it is probably unreachable. t_meet_ama has no equivalent fallback (validator suggestion 1).
Fix: drop `taskOnKO` (nothing in the plan asks for it), or keep it and note it as unreachable in the run sheet.

### m3. The credits are a one-way close; "the tour stays open" does not hold
Evidence: scenario-music-events.js:309-313 opens the visualiser with `missionOver: true` ("EXIT MISSION, no way back in") whatever the entry carries; the tour's entry has no `disableClose` or `autoStop` (scenario.json.erb music event). After "I'm done, let's talk." the mission concludes, closing card then credits, and the player cannot go back to try the optional stops. `written_up` (ama.ink:77-80) is therefore reached only on a reload of a concluded game.
Fix: none needed if that is the intent (AC0 kept credits per plan 2.12). If the demo should keep running after the debrief, drop `credits` and `closingCard` and use another end signal. Say which in the run sheet.

### m4. Required manual tasks are forgeable
Evidence: t_copy_badge and t_unplug are `type: "manual"` (scenario.json.erb objectives). The server runs no check for them (game.rb case 'custom' only; manual falls through), so a direct POST completes them. This matches plan 2.8 and the cheat-resistance policy (best-effort), so it is a note rather than a fix.
Fix: none; keep the NPC/behaviour sanity checks in mind for the Rails tests.

## Checks that pass

### n1. Aims and tasks match plan 2.8
Eight required tasks (five in aim_office, three in aim_network) equal the eight `done_` reads in `wrap_open()` (ama.ink:29-30). aim_around and aim_deeper are `optional: true` with optional tasks. aim_wrap is `missionConclusion`, `unlockCondition.aimsCompleted: [aim_office, aim_network]`, `concludeRequires: {}`, `conclusionScreen bond_visualiser`. Every task has `onComplete.setGlobal`, and each global is declared. Trigger forms check out: `unlock_room`/`unlock_object` are server-checked (game.rb:5149-5185); the card, implant and unplug tasks use eventMappings; the capture mapping carries `completeTask`.

### n2. t_debrief "active" is safe
The client never auto-completes `npc_conversation` tasks (objectives-manager.js listeners 337-401 have none), so talking to Ama cannot complete it. Only the final ink tags (reached only through `wrap_open()`) or `taskOnKO` can. `locked` would behave the same on the server, which ignores the lock (game.rb:5108-5186); the aim itself stays locked and hidden until both required aims complete (`getActive` filters, checkAimCompletion 1220-1260).

### n3. ama_phone mappings
Conditions use only supported forms (`data.reason === 'sign_out'`, `data.endedPcIds.includes('julian_pc')` with the array rule at npc-manager.js:93, `data.cardName === "..."`, `data.via === 'implant'`, `value === true`, `globalVars.tour_full !== true` / `=== true`); no `||`, no parentheses. Event payloads match the emitters (network-links.js:595, 461/536/656; rfid-minigame.js:555; pc-sessions.js:795). `skipIfGlobal` is inside `sendTimedMessage` (P0). onceOnly appears on P0 to P5b and the capture only, which is a fixed set of handlers; setGlobal and completeTask mappings have no onceOnly, so nothing grows player_state (only onceOnly/maxTriggers persist, npc-manager.js:2173-2200). Without a `cooldown` each handler gets the 5 s default (npc-manager.js:1292-1298), harmless here. P5a and P5b are disjoint on a boolean `tour_full`; the validator warning (index 15/16 against 6 and 8) is noise from the unconditional setGlobal and completeTask handlers and needs no `mutuallyExclusiveGlobals`.

### n4. Ama and Lorna ink
Driver output: start gives A1 to A4, then the route choice with `complete_task:t_meet_ama` on the question line; both replies end `#exit_conversation -> hub`; hub shows M1 once, then `hub_quiet` suppresses repeats and a reopen re-enters hub and prints M1 again. With all eight `done_` set, hub goes to debrief, "another look round" loops with the right quick/full line, "I'm done" reaches D3, D4 and the D5 branch (a: unplug, c: lost and not back, b: otherwise, all verified), then an empty line carrying `set_global:tour_debriefed:true, complete_task:t_debrief, exit_conversation`. `#ending_check` is inside the brackets (ama.ink:97). After END a reopen restarts at `start` (person-chat-minigame.js:536-542), `met` is kept, hub diverts to written_up. Every knot is reachable and none dead-ends. Lorna's `hub_quiet = true` before the first `-> hub` (lorna.ink:13) removes the doubled line; a first reopen at the choices prints the hub line as intended.

### n5. Ending and other settings
Music event `conversation_closed:ama` with `globalVars.tour_debriefed === true`; closing card then credits; the credits conditions all read declared globals. `show_scenario_brief: "on_resume"` and `timedConversation` (`game_loaded`, `skipIfGlobal: done_t_meet_ama`) match the m01 pattern. The slice changes only add to rooms/objectives/ink; no slice 2 to 4 content is removed (diff is additions plus the P-text and capture edits).

## Not checked
Rails tests (handover open item 1), the full-corpus payload scan, and a live browser pass. Not traced to the end: the exact `card_cloned` name for the conversation clone path (assumed to follow the lab's `cardName` pattern at lab_physical_pentest:1113, and the card name matches scenario.json.erb:798).

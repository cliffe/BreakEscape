# sis02 softlock sweep, round 1

Main at merge 1cece907, working tree of 2026-10-09. Checklist: `docs/agents/SOFTLOCK_PATTERNS.md` (S1 to S8). Read-only sweep: nothing in the mission was edited.

## Summary

No hard softlock on the main path. The ending (`debrief_complete`) is reachable from every state the script could build: the ESD stations are never gated, network isolation is always reachable through Tom and either of Marcus's two sign-off routes, and Priya's debrief completes from 382 ending states. Five findings:

| ID | Pattern | Severity | One line |
|---|---|---|---|
| SL1 | S5 (sticky option that no longer moves on) | minor | "We're pressing the ESD now." stays in Marcus's hub and repeats when the registers were saved first (item b, confirmed). |
| SL2 | S4 | major | Opening Marcus's thread, even at minute one, reveals the "Isolate the Attacker" aim (item a: move the aim unlock, keep the task). |
| SL3 | S2 / S3 | major | The NIS notification needs `historian_flatline_found`; a player who goes to the workshop first is told by Marcus that the historian is flat and to "message me when you're ready to send", but no NIS option appears. |
| SL4 | S7 / S6 | Must fix (narrow window, modelled) | A reload during Helen's evacuation cutscene leaves `facility_evacuated` true but `esd_activated` and `priya_s_visible` false, and the cutscene mapping never fires again. Priya never appears unless the player presses an ESD for a hall already lost. |
| SL5 | S4 | major | `talk_to_priya_s` completes in `closing_summary`, before `debrief_complete` is set; the server answers "Complete required objectives first to conclude the mission." and the client shows a "Not Yet…" alert over the end of the debrief. |

All five fail in `scripts/ink_runtime_check/sis02_multicall.mjs` on the current files and pass on scratch copies with the proposed fixes applied (45 of 45).

## Findings

### SL1. "We're pressing the ESD now." repeats after the registers are saved (item b)

- **Pattern:** S5 (a sticky option whose target no longer changes anything). **Severity:** minor. No softlock: the ESD stations work regardless.
- **Evidence:** the hub option is gated on `evidence_before_esd == ""` (`ink/npc_marcus_webb.ink:110`). `evidence_scene` opens with `{ bms_registers_saved: ... -> hub }` (`:167-170`) and that branch never sets `evidence_before_esd`, so the option stays and every pick gives the same "You've saved the BMS register table already? Good. Then press it." It is reached both by "I think Hall 1 should come off now" → hazard (`:155`) and by the hub option itself (`:111`).
- **Reproduction:** `marcus/registers-saved-before-esd-talk` → `FAIL - "We're pressing the ESD now." still offered after the registers were saved`; `marcus/registers-saved-after-logs-first` → `FAIL - "We're pressing the ESD now." taken 3 times in a row with the same reply`.
- **Fix:** hide the option once the registers are saved. `ink/npc_marcus_webb.ink:110`:

  ```
  + { anomaly_detected and not esd_activated and topic_shutdown_argued and evidence_before_esd == "" and not bms_registers_saved } [We're pressing the ESD now.]
  ```

  Setting `evidence_before_esd = "save"` in the saved branch would also work, but it records a decision the player never made in that scene; the guard is smaller.

### SL2. Messaging Marcus reveals "Isolate the Attacker" at minute one (item a)

- **Pattern:** S4. **Severity:** major (the objectives panel names the attacker and the cure before the player has read the dial).
- **What fires on first contact:** Marcus's opening is preloaded when the phone is added at game start; its tags and its `~ marcus_webb_contacted = true` are deferred and applied the first time the player opens the thread, whatever they then do (`phone-chat-minigame.js:466-503`). Two things then complete the task, the ink tag at the top of `start` (`ink/npc_marcus_webb.ink:59`, which also re-fires on every later call) and Marcus's mapping on `marcus_webb_contacted` (`scenario.json.erb:945-950`). Completing `call_marcus_initial` reveals its own aim, "Call Marcus Webb and Investigate", early (objectives-manager `revealAimForTask`); that one is harmless, since it only tells the player to get into the workshop. The same mapping also has `"unlockAim": "isolate_network"`, which opens "Isolate the Attacker: Pull the jump server's network cable. Get CastleTech to shut the enterprise side off from SCADA" (`:319`) before the dial, the historian or the jump server.
- **Reproduction:** `aim/messaging-marcus-early-reveals-isolate-attacker` → `FAIL - "Isolate the Attacker" is active before the dial, historian or jump server`.
- **Recommendation: keep the task completion, move the aim unlock.** The task is "Message Marcus Webb", so completing it on first contact is right and is never a gate (nothing else waits on it). Change:
  1. `scenario.json.erb:945-950`: delete `"unlockAim": "isolate_network"` from the `marcus_webb_contacted` mapping (keep `completeTask`).
  2. `scenario.json.erb:686` (Helen's `jump_server_confirmed` mapping): `"unlockAim": ["investigate_sis", "isolate_network"]`. The aim also still opens on its `unlockCondition` (`contact_marcus_investigate` complete), and earlier still if the player pulls the cable or Tom isolates (task progress reveals it).
  3. `ink/npc_marcus_webb.ink:59`: delete `#complete_task:call_marcus_initial` (the mapping already does it; the tag re-fires on every call). Optional, cosmetic.
  4. `scenario.json.erb:940`: Marcus's `puzzle_graph_actions` `"unlocks_aim": "isolate_network"` no longer holds; drop it so the dungeon graph matches.
- **Regression kept:** `aim/isolate-attacker-visible-once-session-found` passes before and after.

### SL3. The NIS notification needs the historian, though Marcus already knows it is flat

- **Pattern:** S2 (order dependence), with an S3 line. **Severity:** major. The NIS task is not needed for the ending, and Helen's "What next?" points at the historian first, so it is recoverable; but Marcus tells the player to do something his hub does not offer.
- **Evidence:** the hub option is gated on `historian_flatline_found` (`ink/npc_marcus_webb.ink:121`). The workshop key is in an unlocked drawer in the start room, so a player can find the session and confirm the SIS change without opening the historian. When they report the session, Marcus says "I've had a look at the historian from here. It's been flat since 23:12" (`:200`). Once the hall is safe and isolated, "Where are we?" says "Contained. Now the notification. Message me when you're ready to send." (`:373`), and the hub has no NIS option.
- **Reproduction:** `marcus/workshop-first-no-historian-nis-reachable` → `FAIL - Marcus says "message me when you're ready to send" but offers no NIS option (historian_flatline_found false)` and `FAIL - NIS notification unreachable without opening the historian`.
- **Fix:** accept either way Marcus learns of the flat line. `ink/npc_marcus_webb.ink:121`:

  ```
  + { (historian_flatline_found or marcus_rdp_briefed) and not nis_notified } [About the NIS notification.]
  ```

  `nis_send`'s wording still fits: with `marcus_rdp_briefed`, `jump_server_confirmed` is true, so it takes the "someone on our control network since 01:47" or SIS branch. The NIS clock (`nis_deadline`, `startOnGlobal: historian_flatline_found`) simply does not run on that path, which only affects the "after the clock" line.

### SL4. A reload during the evacuation cutscene strands Priya

- **Pattern:** S7 (a mapping that waits on an event that cannot recur) leading to S6 (the ending's setter is unreachable). **Severity:** Must fix. The window is the length of the cutscene (four voiced lines) and needs a state sync to land inside it, so it is narrow, but the result is a lost ending with no hint.
- **Evidence:** `h2_evacuation` sets `facility_evacuated` (`scenario.json.erb:446-454`). Helen's mapping on it opens `evacuation_scene` (`:736-742`); only that scene sets `esd_activated`, skips `press_esd_button` and sets `priya_s_visible` (`ink/npc_helen_marsh.ink:360-370`). npc-manager persists a cutscene mapping only when its conversation closes (`npc-manager.js:686-700`, `_persistTriggerOnClose`), so that a reload can replay it, but nothing re-emits `global_variable_changed:facility_evacuated` on load: the global is already true and the mapping never fires again. Afterwards `facility_safe_state` needs `esd_activated`, which no one now tells the player to press (Helen: "Hall 1's the fire service's now", `:313-317`).
- **Reproduction (modelled reload):** `helen/reload-mid-evacuation-scene-then-isolate` → `FAIL - Priya never appears: facility_evacuated=true esd_activated=false (scene cut by the reload, its mapping does not fire again)`.
- **Fix:** set the scene's outcomes in the same tick as `facility_evacuated`, so they are saved together, and keep the cutscene for the story. Add a mapping to Helen's `eventMappings` immediately before the cutscene mapping at `scenario.json.erb:736`:

  ```json
  {
    // The scene's outcomes, set with facility_evacuated so a reload mid-scene keeps them:
    // the cutscene mapping is only persisted when its conversation closes, and nothing
    // re-emits facility_evacuated on load.
    "eventPattern": "global_variable_changed:facility_evacuated",
    "condition": "value === true",
    "onceOnly": true,
    "setGlobal": { "esd_activated": true, "priya_s_visible": true },
    "skipTask": "press_esd_button"
  },
  ```

  The ink lines in `evacuation_scene` can stay (they become no-ops). Check in the browser that Priya's arrival bark is held until the cutscene closes, and that the `esd_activated` music cue does not cut across the cutscene music.

### SL5. "Not Yet…" alert over the end of Priya's debrief

- **Pattern:** S4 (a completion fired before the outcome). **Severity:** major (the player is told the mission is not finished two lines before the credits).
- **Evidence:** `#complete_task:talk_to_priya_s` is in `closing_summary` (`ink/npc_priya_s.ink:372`); `#set_global:debrief_complete:true` is in `closing_end` (`:398`). The task is the only task of the conclusion aim, so the server completes the aim and checks `concludeRequires.globals: ["debrief_complete"]` (`scenario.json.erb:381`) at that moment (`game.rb` `complete_task!`, `check_mission_conclusion`). The global is not set yet, so the response carries `warning: 'Complete required objectives first to conclude the mission.'` (`game.rb:1223`) and the client shows it as `gameAlert(..., 'Not Yet…')` (`objectives-manager.js:570-575`). The credits then conclude through `/conclude`, so nothing is lost but the message. Moving the tag later is not enough on its own: the task POST carries no globals and the state sync runs every 30 s; sis03 hit the same race and dropped the globals gate (`sis03_cyber_insurance/scenario.json.erb:304-309`).
- **Reproduction:** `priya/no-not-yet-alert-during-debrief` → `FAIL - server answered the task with: Not Yet…: Complete required objectives first to conclude the mission.`
- **Fix:** both of
  1. `ink/npc_priya_s.ink`: delete `#complete_task:talk_to_priya_s` from `closing_summary` (`:372`) and put it in `closing_end` straight after `#set_global:debrief_complete:true` (`:398`).
  2. `scenario.json.erb:381`: `"concludeRequires": {}` (the sis03 pattern; there is no VM work to gate, and the credits already conclude through `/conclude`). Update the ERB comment below it to match.

  sis01 has the same shape (`attend_debrief` completes at `npc_sharma.ink:75`, `debrief_complete` at `:427`); not in this sweep's scope, but worth the same change.

## Checked, clean

Each gating global with its setters and routes in. "Script" names the scenario that covers it.

- **Marcus, first call.** Every option in `first_call` is sticky, and the six conditions cover every state: evacuated; else dial; else historian; else ESD pressed; else "Nothing solid yet" (`npc_marcus_webb.ink:69-89`). Closing the thread unanswered and coming back with evidence re-runs `first_call` with the new globals (script: `marcus/close-without-choosing-then-evidence`). After "Nothing solid yet" the dial and historian can't be reported, but nothing is gated on that report.
- **`network_isolation_authorised`** (Tom's gate): set by `rdp_session_confirmed` (sticky hub option on `jump_server_confirmed and not marcus_rdp_briefed`) or by the sticky hub sign-off on `network_isolation_requested`. Both routes survive an early "nothing yet" call and a reload. Script: `marcus/early-call-then-workshop`, `marcus/no-evidence-close-reload-then-jump`, `tom/before-marcus-authorises-false-authority`.
- **`cable_pull_agreed`, `isolation_scope`, `nis_initial_choice`/`nis_notified`, `evidence_before_esd`, `shutdown_argument`:** every branch sets what its line says (S3 grep of each "I'll", "Signed off", "I'll tell Tom" line). "Let me think" on the scope keeps the question open even after Tom has acted. Script: the `marcus/isolation-scope-*`, `marcus/nis-*`, `marcus/evidence-scene-*` scenarios.
- **Tom, `castletech_contacted`** (→ `network_isolated` by mapping): `isolation_request`, `isolation_ask` and the hub's "About the isolation" are all sticky until CastleTech act, so a refused say-so, a false "Marcus has signed it off", or "I'm not on your list" each leave a way back. The Trent Water advisory has a sticky hub route after "Not yet", and works before or after the isolation. Script: all `tom/*`.
- **Helen, `helen_briefed` and the hall badge:** set in `arrival_briefing` and again in `start` if the cutscene was cut (`briefing_played` stops it replaying). Script: `helen/briefing-cut-by-reload`. Gauge and shutdown decisions, including "Let me think" and "Not sure yet", return to a hub with fallback options. After the evacuation no live-hall option shows. Script: `helen/*`.
- **Evacuation while another conversation is open:** npc-manager closes the open minigame and starts the cutscene; Marcus's next first call offers "Hall 1's on fire". Script: `helen/evacuation-while-on-the-phone`.
- **`priya_s_visible`:** set by `facility_safe_state` (ESD and isolation, either order, two mappings) or the evacuation scene. Script: `flow/safe-state-either-order-reveals-priya`, `flow/out-of-order-workshop-before-dial-esd-early`.
- **Priya's debrief and `debrief_complete`:** played from 382 ending states (every value of 14 dimensions: ending, gauge verdict, shutdown argument, register evidence, hall entry in alarm, isolation scope, isolation, Tom's verification, cable, NIS, Trent Water, SIS and session found, which views were heard; plus 300 random mixes). Every one reaches `closing_end`, sets `debrief_complete`, completes `talk_to_priya_s`, rolls the credits once and concludes. Also "Give me a few minutes", a reload mid-debrief (variables-only restore restarts the debrief cleanly) and a re-talk after the end (no second credits). Script: `priya/*` except SL5.
- **Timers:** `h2_advisory` and `h2_evacuation` start on `helen_briefed` and are cancelled by any ESD (script: `helen/esd-cancels-hydrogen-timers`); they resume after a reload from the saved clock (`scenario-timer-dispatcher.js` `exportState`). `nis_deadline` only sets `nis_deadline_missed`, which nothing gates on.
- **Locks:** Battery Hall 1 (rfid) needs Helen's badge, given in both her entry knots; the Engineering Workshop (rfid) key is in the duty desk, an unlocked container in the start room; the ICS filing cabinet (key) key is on the workshop desk; all three ESD stations use `authVar: esd_stations_live`, always true. No `authVar` or condition lock depends on dialogue.
- **Objectives:** the conclusion needs only `debrief_complete`. The debrief aim opens on Priya's `priya_s_visible` mapping as well as on its `aimsCompleted` condition, so an evacuated run (ESD task skipped, cable maybe never pulled) still gets it.
- **S5:** every `+` option that leads to a sub-menu has a sticky way out (`esd_more` "Right.", `sis_more` "Back to it.", `boundary_more` "Thanks.", `isolation_ask`, `trent_water_action`, `closing_questions` "Nothing else from us."), and loopcheck finds no dry hub.
- **S8:** the lab sheet's only warning is the real-world one (never enter a hall in gas alarm). No "don't call X before Y" advice.
- **Credits:** every section has a line on every path (the validator's "no unconditional fallback" notes are covered by complementary conditions; SAFETY CASE is always filled because the debrief cannot end without both choices).

Noticed, not findings:
- Marcus will sign off a firewall isolation with no evidence at all (hub sign-off only needs Tom's request). Arguable design, not a softlock; for the design reviewer.
- Marcus's preloaded opening ("Helen said you'd be in touch...") sits in the phone thread from game start, before Helen has spoken.
- `TESTING_WALKTHROUGH.md` is stale (old radio lines, `npc_priya_sharma`, VM launchers).
- The isolation-scope question only opens once Marcus has heard about the session (`marcus_rdp_briefed`). A player who isolates through Tom and the hub sign-off without reporting the session gets Priya's "how far to cut was never decided". A consequence, not a lock.
- Helen's `arrival_briefing` narration changed on disk during this sweep (another agent's edit; lines only). The script reads the compiled JSON live, and the results here are with that version.

## Checks run

- **Multi-call script:** `node scripts/ink_runtime_check/sis02_multicall.mjs` (`-v` prints every conversation; `--only=` filters). Current files: 39 passed, 6 failed (exactly the five findings above; SL1 has two scenarios). With the proposed fixes applied to scratch copies (`--ink-dir`, `--scenario-json`): 45 passed, 0 failed. The script drives the real `PhoneChatConversation` (preload, `applyDeferredGlobals`, `reopenWithCurrentGlobals`, `restartAfterEnd`) and the person-chat restore order (`startEventConversation`, re-run of the resting knot), with a model of the eventMappings, timers, objectives and server conclusion check read from the rendered `scenario.json.erb`. Reloads are modelled on `exportPhoneState`, `importNpcInkVariables` and `_persistTriggerOnClose`, which is why SL4 needs a browser confirmation.
- **Compiled ink matches source:** all four `.ink` files compiled to scratch with `bin/inklecate`; identical to the committed `.json`.
- **reopencheck** (`missions.json sis02_energy`): Marcus 1800 reopens, 676 re-runs, 0 problems; Tom 1800 reopens, 337 re-runs, 0 problems. Held-back lines only (no tags held back).
- **inkcheck + loopcheck** over 18 states of the evidence globals × 5 entries (Helen `start` and `hub`, Marcus, Tom, Priya `start`): 90 of 90 clean, no runtime errors, no runaways, no dry hubs. One inkcheck walk hit the state cap (Helen with all evidence), covered by loopcheck.
- **dialoguelint** (`scenarios/sis02_energy/`): no rule hits.
- **Validator** (`--skip-ink --no-graph`): schema passes, geometry and doors OK; 2 warnings (no `conclusionScreen`; the evacuation cutscene mapping has no `background`), the rest suggestions.

## For the browser playtest

1. **SL4:** let the hydrogen reach 2% (no ESD), reload while Helen's evacuation lines are on screen, then isolate the network. Does Priya ever appear? Does the cutscene replay?
2. **SL5:** at Priya's "Nothing that failed today was new..." line, watch for a "Not Yet…" alert.
3. **SL2:** open Marcus's thread at minute one, close it, open the objectives panel: is "Isolate the Attacker" listed?
4. **SL3:** go to the workshop first (key in the duty desk), find the session, confirm the SIS change, report to Marcus, press the ESD, isolate through Tom, read the NIS form, then message Marcus without opening the historian.
5. After the SL4 fix: Priya's arrival bark is held until the cutscene closes, and the ESD music cue doesn't fight the cutscene.
6. Evacuation while the phone is open: the cutscene takes over, and Marcus's thread afterwards offers "Hall 1's on fire".

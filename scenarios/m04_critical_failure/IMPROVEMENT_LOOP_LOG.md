# m04 Critical Failure: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, the model log). Shared agent brief: `docs/agents/M04_PASS_BRIEF.md`.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review → fix loops), dialogue, room dressing, lighting, POV backgrounds, characters, playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Phase 1 alignment, round 1

Review: `ALIGNMENT_REVIEW_P5_R1.md` (Opus, read-only, static; partial: a safety check stopped the reviewer before it wrote the file, and the orchestrator saved it from the hand-back). The fixer checked each finding against `scenario.json.erb` and the ink before acting. Two coordinator items from the regression run (`PASS5_REGRESSION_A.md`, M2 and M3) were folded in.

Counts: 0 blockers, 6 majors, 12 minors from the review; 2 regression items folded in, 3 regression items deferred; 4 further issues found while fixing.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| A1 | major | Voltage offers "the button or me" before the button can work; letting him run then leaves the ESD unarmed | **Fixed.** The button stance is offered only when `attack_mechanism_known and anomaly_detected` (the ESD's permissive less Voltage). Before that he says the button is useless ("Grid control won't shed a megawatt on what you've got") and the stances are fight, arrest (Static down) or a new "Not like this. (Back off.)". Backing off parks on `voltage_standoff_resumed`, which now offers "Then let's finish this." back to the stances (`m04_npc_voltage.ink`) |
| A2 | major | Music forgets the phase on reload and after every fight; no cue when the clock starts | **Fixed.** m03's pattern: four phase conditions (day / threat / clock / after) on `game_loaded` and `all_hostiles_ko`; a cue on `clock_started`; the dial cue only while the clock isn't running; the shutdown moves to the `end` playlist for the sweep |
| A3 | major | No sight challenges: the guard, Cipher and Static react only when spoken to | **Fixed.** The guard and Cipher get `los.challengeOnSight` (m03 Terry); the guard needs `briefing_played` and skips on `guard_admitted` (now a synced global, set by his ink), `guard_hostile`, KO; Cipher skips on `cipher_engaged` (any turn to hostile), `cipher_walked`, KO, `attack_prevented`. Static challenges on plant-room entry (room_entered, onceOnly, like Relay on Hall 2). His ink gains a talk-past option ("I'm not here for you. I'm here to talk to him.", `static_stood_aside`), so a quiet route still exists; a fight with Voltage now brings him in (`#hostile:operative_static`) |
| A4 | major | The ESD sets `mission_complete` and the debrief opens at once, so the dock, go-bag and paper are lost | **Fixed** (user decision 2). The ESD sets `attack_prevented` only; HaX's mapping unlocks `call_in_after_sweep` and texts "Sweep the plant room and the dock, then call me and I'll bring you in."; the hub's "I'm done here. Bring me in." → `extract_offer` (names the log and the go-bag if unread) → "Bring me in." → "On my way." completes the task and sets `mission_complete` (m03 `extract_go`). Backstops kept and added: the existing ones are untouched; two m03-style reload backstops added (re-emit `mission_complete` on room entry if the debrief never started; complete `report_to_0x99` on room entry if it started), keyed on the new `debrief_started` |
| A5 | major | HaX's hub not progress-gated to m03's standard | **Fixed.** Rebuilt on m03's `hub`: root `-> start` divert, `greeted`, then the hub. Gated hints that retire once used: the gate, the card readers, the dial, Relay's card, the plant reader (kit or print), Voltage (reads Static and the permissive), the trigger race, the night crew, and the call-in. Guides folded into one "Send me a field guide." choice. "Where do I stand?" (`report_progress`, first unmet step wins) replaces the old guidance sub-hub. `server_room_advice_given` is now synced. The phone NPC's `currentKnot` is now `start` |
| A6 | major | Canon: Voltage labelled the cell leader | **Fixed.** displayName "Voltage (Critical Mass)"; task "Confront Voltage in the plant room"; credit "Blackout's field lead in custody"; ink header and ERB comment. The briefing (`m04_opening_briefing.ink:137-139`, "His lieutenant runs Albion") and Voltage's own line (:233) already had it right: they are the canon the fix follows, not errors |
| m1 | minor | Blackout credit shows unconditionally | **Fixed.** New global `blackout_named`, set where the player can learn the name (briefing's Critical Mass topic, Voltage's number, his Architect answer, the arrest, the marked blueprints); the credit is gated on it |
| m2 | minor | "ALL ELEVEN WALKED OUT" plays when the guard was KO'd; eleven left Vance out | **Fixed** with decision 1. Eleven is now the nine night crew, Vance and the one gate guard (the old "two in the gatehouse" didn't match the one guard on site): Voltage's line, the blueprint note, the briefing. The credit needs no crew loss and nobody KO'd; a new "EVERYONE ON SITE GOT OUT ALIVE, not all of them on their own feet" covers a KO; the debrief branches the same way |
| m3 | minor | No credits line for the guard KO or for keeping the cover | **Fixed.** "GATE GUARD: knocked out at his own desk…" and "ROBERT VANCE: never told — the cover held all night" |
| m4 | minor | `player_approach` set in the briefing, never read | **Fixed.** The VAR and its five writes removed |
| m5 | minor | Voiced lines print variables | **Fixed.** Nine HaX lines and Vance's phone greeting reworded (list below); no `{player_name()}` or count is printed in any m04 voiced line now |
| m6 | minor | `operative_down_advice` says "only one left" with Static still up | **Fixed.** "Two down. Both halls clear." plus "Static's still with Voltage in the plant room." while he is |
| m7 | minor | HaX texts without `skipIfGlobal` can go stale (erb 652, 702, 966, 1015, 960-961) | **Partly fixed, partly withdrawn.** Added `skipIfGlobal` where one global says the text is stale: the plant-door text (`fingerprint_kit_found`), the real-reading text (`anomaly_detected`), the mechanism text (`voltage_neutralised`), the work-order text (`anomaly_detected`). **Withdrawn** for 652 (Hall 1 entry): Hall 2 is reachable only through Hall 1, so Relay can't have been met first and the text can't be stale. **Withdrawn** for 960: no single global expresses "no evidence yet", the delay is 2.5 s and its condition holds at the event |
| m8 | minor | The privesc flag has no story reaction; the flag rewards were emit_events nothing heard | **Fixed.** The four rewards now `set_global` the flag globals (no more "Event triggered" in the flag station). The privesc beat is a HaX text ("Root. Now you can see their calibration override…"), skipped when it was the last flag. A `hint` reward was tried first; the schema rejects it in flagRewards |
| m9 | minor | Credits track repeats m01 and m03 | **Fixed.** "Safetynet in the Smoke" (unused by any mission) |
| m10 | minor | Vance's "What should I be doing?" always says "go to the ESD" | **Fixed.** Reads the night: the dial, then the workshop, then the old ESD line, then "go and see what they left behind" after the shutdown |
| m11 | minor | "The Architect's Directive" item is Voltage's operation log | **Fixed.** Renamed "Voltage's Operation Log"; the global keeps its id |
| m12 | minor | Task Force Null is set up in m04 but never mentioned in m05 | **Deferred.** Another mission; for the orchestrator to raise with the user if m05 should pick it up |
| R-M2 | regression | HaX's phone and toast avatar is the generic `npc_helper.png` | **Fixed.** Both HaX NPCs use `assets/characters/agent_hax_headshot.png`, as m03 does |
| R-M3 | regression | The fingerprint compare offers only Vance and Security Guard; the walkthrough says Security Guard, Cipher, Relay | **Fixed in the walkthrough.** The scenario already lists all three. Easy difficulty shows the owner plus one decoy (`dusting-model.js:102`), picked from the list by a fixed seed, so it is always Security Guard. Easy is intended (the "fun, not hard" rule), so `TESTING_WALKTHROUGH.md` step 11 now says so |
| R-E2 | regression | Operative sprites have no death animation | **Deferred** to the character stage, which replaces the operatives' sprites |
| R-M1 | regression | The operatives share one portrait | **Deferred** to the character stage (each operative gets art of their own there) |
| R-M4 | regression | Plant room layout and the ESD position | **Deferred** to room dressing, which owns room layout and object placement |
| F1 | found | Voltage's "Say nothing." exit diverted into a knot that prints, so his re-entry lines showed as the chat closed (the engine shows the whole batch before closing) | **Fixed.** `voltage_quiet` (m03 `hub_quiet`): the lines are skipped once after a goodbye. The same pattern is used for Static's new resting knot |
| F2 | found | A page reload late in the mission replayed HaX's opening status check ("Are you inside the facility?"), because `greeted` is ink-local | **Fixed.** The opening only plays before the dial is read, the workshop reached or the shutdown pressed |
| F3 | found | Validator warning: `show_scenario_brief` missing with a start-room opening cutscene | **Fixed.** `"show_scenario_brief": "once"`, as m03 |
| F4 | found | No reload backstop for the debrief (a reload between `mission_complete` and the debrief's first line stranded the ending) | **Fixed** with A4 (the two backstops above) |

### Decisions taken (fixer, with reasons)

- **User decision 1, the night crew can be warned.** Vance sounds the evacuation, face to face (hub: "Is anyone working in the halls tonight?" → he names the cost → "Sound it." / "Not yet.") or by phone ("The night crew in Hall 2. Can you get them out?"). Offered once he is an ally and the dial has been read, until it's taken, a bank vents or the shutdown is in. HaX's hub points the player to Vance ("Can we get the night crew out of Hall 2?"). Reason: Vance owns the site and the alarm; it rewards bringing him in.
- **The cost: the clock starts.** The alarm tells the cell they've been found, so the h2 and vent timers start on `clock_started`, set by the alarm or by mapping the attack, whichever is first. Equal delays (8 and 14 minutes) rather than a faster clock, so a late warning never buys extra time; a late warning is cheap because the clock is already running, which fits the story (the alarm then tells Voltage nothing he can still use). Relay and Cipher react to the alarm (Relay waits for the player; Cipher's "go and look" line changes). Early warning is a real trade: the crew are safe whatever happens, but the VM stage now runs against the clock and bank B may go.
- **Casualties depend on it.** `crew_lost` is set when a bank vents (the 14-minute timer or the trigger race) with the crew still in Hall 2; the warning can't be given after a vent. Credits and debrief: crew lost → "CASUALTIES: the Hall 2 night crew, and the dropped feed"; crew out and a vent → "two on the dropped feed. Hall 2 was empty when it went"; no vent → no casualties line. "ALL ELEVEN WALKED OUT" only with no crew loss and nobody KO'd. No ending is framed as failure: the worst debrief still says "You stopped the rest of it."
- **User decision 2, sweep then call in,** exactly as m03 (`call_in_after_sweep` optional and locked until the shutdown, so a missed unlock can't hold the aim).
- **Static can be talked past.** Without it the new entry challenge would force a fight on every route, removing the quiet button route. He stands aside, and joins the fight if the player fights Voltage. Reason: keeps both quiet and fight paths, and makes Static matter.
- **Voltage's back-off stance.** Needed once the button stance is withheld; otherwise a player who arrives early must fight.
- **The old guidance sub-hub was removed** (player_guidance_request, intel_status_update, tactical_suggestions, navigation_help, combat_help, vm_challenge_help, guidance_call_end, call_final_end). The gated hints and "Where do I stand?" cover all of its content, and the sub-hub duplicated it four ways.
- **The guard's challenge waits for the briefing** (`requireGlobal: briefing_played`), so it never fires under the opening cutscene.
- **Sight challenges repeat** (no `onceOnly`; the los `skipIfGlobal` list ends them). The validator's two "cutscene without onceOnly" warnings for them are deliberate, as for m03's Terry.

### Checks (static; no browser session was started)

- Ink compiles (10 files; the three END warnings are the fight handoffs and the linear cutscenes, as before).
- Validator, full (not `--skip-ink`): schema passed, all ink valid, door alignment and room geometry OK. 16 warnings against 14 before: the two new ones are the repeatable sight-challenge chats above; the rest are the existing duplicate-mapping notes (pre-existing patterns) and the two seed NPCs with no behaviour.
- dialoguelint: 0 errors; 6 blank-reentry checks (5 before, all pre-existing knots; `guard_idle` is newly listed because the guard's file is now read as face-to-face; its content is unchanged). Left for the dialogue phase.
- reopencheck (missions.json m04 block regenerated from `globalVariables`, HaX entry knot `start`): 0 problems for both phones.
- tagdiff against HEAD: 445 structural differences, every one from the changes above (the HaX phone file is the bulk: hub rebuild and sub-hub removal).
- inkcheck and loopcheck over a state matrix (HaX phone early, mid, plant room, race, after the shutdown; Voltage before and after the case; Static fresh and stood aside; Vance hub ally with the dial; Vance phone; Cipher and Relay after the alarm; debrief vented-warned, vented-lost, guard KO; guard; briefing): no errors, no runaways.
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Whole-route driver, new: `scripts/ink_runtime_check/m04_routes/route.js` (m03's driver plus `expect` assertions, a `credits` step evaluated from the scenario, and the engine mappings these routes depend on). Four routes, all expectations met:
  - `r1_quiet_warned_callin.json`: quiet route, crew warned early by phone (clock starts before the attack is mapped), Relay cloned, Static talked past, button stance, ESD, a declined call-in, a `"reload": "page"`, then "Bring me in". Credits: ALL ELEVEN, NIGHT CREW, VOLTAGE ESCAPED.
  - `r2_fight_unwarned_early_voltage.json`: guard catches a slip-past, cover kept with Vance, Cipher's radio call, Relay fought; Voltage met before the case (no button stance), backed off, re-talked and fought with Static joining; trigger race lost with the crew in Hall 2. Credits: no ALL ELEVEN, night-crew casualties, cover held.
  - `r3_reloads_guard_ko_arrest.json`: page reloads before the crew decision, mid-Static, before the arrest and after the shutdown; guard KO'd; crew warned face to face; arrest. Credits: EVERYONE ON SITE GOT OUT ALIVE, GATE GUARD.
  - `r4_warned_but_vented.json`: crew warned, bank B still lost: crew_lost stays false, ALL ELEVEN shows, the casualties line is the feed only; after an unwarned vent Vance's phone no longer offers the evacuation.

Not yet checked in a browser: the guard's and Cipher's sight cones (facing and range at their positions), Static's entry challenge with Voltage in the room, `#hostile:operative_static` from Voltage's chat, the phone → debrief handoff after "Bring me in" (the same shape as m03's, which was browser-tested there), and the music phases.

### Spoken lines changed (old → new)

No m04 audio exists on 3.8 yet, so none of this costs a re-voice; listed for the record.

HaX, phone (`m04_phone_agent0x99.ink`):
- "{player_name()}, status check. Are you inside the facility?" → "Agent, status check. Are you inside the facility?"
- "Two down. Both halls clear. The only one left is the one who matters." → "Two down. Both halls clear." + (Static up) "Static's still with Voltage in the plant room."
- "And {player_name()}, the hall doesn't care who's winning. Watch the hydrogen panel." → "And the hall doesn't care who's winning. Watch the hydrogen panel."
- "{player_name()}, you're in the workshop. That's their way in." → "You're in the workshop. That's their way in."
- "And {player_name()}, you've already met one of them. There'll be more." → "And you've already met one of them. There'll be more."
- "{player_name()}, your flags are landing. Grid control can see it too." → "Your flags are landing. Grid control can see it too."
- "{player_name()}, listen. Voltage is worth more to us talking than down." → "Listen. Voltage is worth more to us talking than down."
- "{operatives_defeated} of them down already. You're almost there." → "Two of them down already. You're almost there."
- "Clean run so far, {player_name()}. Finish it." → "Clean run so far. Finish it."
- "The engineering workshop, off Battery Hall 1. That's where they got onto the SCADA network. It wants a Level 2 card." → "The engineering workshop, off Hall 1. It wants a Level 2 card." (now in `report_progress`)
- "You know how they did it. Now stop it." / "Voltage's in the plant room with the trigger. Deal with him, then the shutdown button." → "You know how they did it. The plant room's off Hall 2, and its reader wants Vance's print." / "Voltage is in the plant room with the trigger. Deal with him, then the shutdown button."
- Removed with the guidance sub-hub: "{player_name()}, go ahead."; "Vance can point you to it from the ops desk."; "Their whole mechanism's on record now. That's the case made."; "You're on the network. Keep pulling flags into the drop-site terminal."; "Nothing in yet. The intel's on the BMS jump server in the workshop. Scan it, submit what you find."; "Both halls clear. Static and Voltage are waiting in the plant room."; "One down. Stay alert for the rest."; "No contact yet. They're here. Be ready."; "What's the problem?"; the navigation, combat and VM help lines; "Anything else?"; "Stay safe. Call if you need me."
- New: the hint knots (`hint_guard`, `hint_clone`, `hint_dial`, `hint_relay`, `hint_reader`, `hint_voltage`, `hint_race`, `hint_crew`), `extract_offer` / `extract_choices` / `extract_go`, and the new `report_progress` lines.

Robert Vance:
- Phone: "{player_name()}. What do you need?" → "Vance. What do you need?"
- Phone, new: `crew_offer` (two lines), "Your call. Say the word and it goes.", "Sounding it now. They're moving. Nine of them, out through the Hall 2 fire doors."
- Face to face: "What should I be doing right now?" now has four answers (three new, the old ESD line kept for the clock phase); new `vance_crew_offer` (three lines), "Your call. It's on this desk when you want it.", `vance_crew_sound` (two lines and one narration).

Voltage:
- "Eleven on site tonight. Nine on the night crew in Hall 2, two in the gatehouse." → "Eleven on site tonight. Nine on the night crew in Hall 2, the duty engineer, and the man on the gate."
- New: "The button? Press it. Grid control won't shed a megawatt on what you've got."; "Then get out of my plant room. The clock doesn't care either way."; narration "He moves for the bench, Static comes off the wall at you, and the plant room stops being a place where anyone is talking."

Static, new: narration "He weighs you for a long second, then takes one step to the side. One step, no more."; "Talk, then. From there."; "I'm still here."

Cipher, new: "...Nine?" (after the alarm). Relay, new: narration "The strobes are still going…"; "Nine of them went past me in their hi-vis. Somebody told them to. That'll be you."; "They weren't the job. The racks are."

Debrief (`m04_closing_debrief.ink`), new: "Hall 2 was empty when it went. Vance's alarm had the night crew out through the fire doors."; "Two on the feed before the grid caught up. The number tomorrow won't be zero. It won't be eleven either."; "Everyone on site got out alive tonight, not all of them on their own feet. Forty-odd on that feed never knew they were on it."; "And Vance's alarm had the night crew out before the button went in. It started your clock early. It was still the right call."

Briefing: "The attack. Eleven people on site, and everyone on that feed." → "The attack. Eleven people on site, nine of them on the night crew, and everyone on that feed."

HaX texts (scenario.json.erb), new: the crew-warned pair, the bank-B-venting variant with the crew out, the shutdown "sweep, then call me" text, the privesc text.

### Open after round 1

- Browser checks listed under Checks, for the round-2 playtest.
- m12 (Task Force Null in m05) needs the user or the m05 pass.
- The six blank-reentry checks go to the dialogue phase.

### Phase 1 alignment, round 2

Inputs: `ALIGNMENT_REVIEW_P5_R2.md` (Opus, static; 0 blockers, 3 majors, 20 minors; it confirms A1, A2, A4, A5 and A6, and A3 in part) and `PASS5_ALIGN_R1_BROWSER.md` (Sonnet, games 2201 to 2203 on :3001: every round-1 change passes in the browser, plus minors N1 to N5 and observations O1 to O3). The fixer checked each finding against the files before acting.

Counts: review 0 / 3 / 20; browser 0 / 0 / 5 minors, 3 observations. Outcomes: 18 fixed, 1 fixed with an accepted limit, 2 withdrawn, 9 deferred to later stages, 1 needs an engine change.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | The night-crew warning isn't a fair choice: an early alarm ran the 14-minute clock across the VM stage, the cost wasn't stated, a late alarm cost nothing while HaX still said "think first", and the debrief never linked the alarm to a vent | **Fixed** (orchestrator decision 1, option b). An early alarm (before the attack is mapped) sets `crew_warned_early`, which starts its own pair: `h2_advisory_alarm` at 24 min and `racks_vent_alarm` at 30 min. The normal pair starts on `attack_mechanism_known` again, as before round 1; whichever fires first wins (each checks `racks_vented` / `hydrogen_alarm`). `clock_started` now only drives the music phase. Vance states the cost before "Sound it.", face to face and by phone, and it's true to the moment: before the mapping, "He won't wait for eight. You'll have half an hour, maybe, and your workshop job isn't done."; after it, "your clock's already running, so it costs you nothing now but surprise". HaX's hint says the same. The debrief: `vented_by_alarm_clock` (set by the alarm's vent timer) gets "Your alarm started his clock. Bank B and two on the feed are what it cost. / Nine people in Hall 2 are what it bought." Static still stands aside after the alarm, as decided. HUD limit, documented in the timer comment: the widget shows the first pending countdown in array order, so the alarm's advisory sits first; it is the earlier deadline unless the attack is mapped within 16 minutes of the alarm |
| M2 | major | Vance claims the historian shows the real temperatures (it reads the poisoned bus), and his phone text steers to the ESD before the dial | **Fixed** (decision 3). Every historian claim is gone. Before the dial, Vance only distrusts his screens and points at the dial; after it, he watches the hydrogen readout from the vent controller, which is off SCADA (the H2 panel, erb `hydrogen_detector`). The 20 s phone text now points to the dial, `skipIfGlobal: anomaly_detected`; the ally text drops "with the historian up". The HMI's "Feed source: BMS sensor bus → SCADA historian" stays: it says the historian is on the poisoned feed |
| M3 | major | Cipher's sight challenge never fires on the normal route (he faced away; 96 px turn) | **Fixed** (decision 2). A Terry-shaped beat: up the rack gap at x=12 to the door row, a look east (2.5 s), a look west (2.5 s), back to his panel facing south (4 s). `los.visualize` draws his cone; the walk back is the window to cross; `pauseForPlayer: false` keeps the timing. **Needs a browser check**: the waypoints are from the room template (gap between rack columns 11 and 13), not seen walked |
| m1 | minor | "Started your clock early" when the alarm came late | **Fixed** (`crew_warned_early`); the late version is "Vance's alarm had the night crew out before the button went in." |
| m2 | minor | Vance's phone stale after the shutdown; its "what should I be doing" skipped the dial and the card | **Fixed.** `attack_prevented` branches in the greeting, "How bad is it?", the goodbye ("And hurry" no longer after the shutdown) and `priority_guidance`, which now mirrors the face-to-face version (dial, the Level 2 card, the workshop, the ESD, after) |
| m3 | minor | HaX's crew hint says "think first" once the alarm costs nothing | **Fixed** (reads `attack_mechanism_known`; no cost line at all when Vance is KO'd) |
| m4 | minor | Face-to-face offer lacks the phone's wording; "get to them first" is unclear | **Fixed.** Same cost wording both places; "Not yet. Let me get closer to Voltage first." |
| m5 | minor | The hydrogen text doesn't say the alarm is still on Vance's desk | **Fixed.** A third disjoint variant when Vance is an ally and up: "…Vance can still sound the evacuation. Then the button." |
| m6 | minor | Voltage never reacts to the alarm; "your eleven" after the crew died | **Fixed.** "Your klaxon. Nine people in hi-vis on my cameras, walking out the fire doors. Very humane." and "You save your forty." when `crew_lost` |
| m7 | minor | Vance's debrief lines say "one bank" with nine of his crew dead | **Fixed.** HaX: "Vance lost nine of his crew tonight. He hasn't said a word about you yet."; Vance: "Nine of mine. I'll be telling their families myself." |
| m8 | minor | Static idles through the sweep on the button route | **Fixed.** On `voltage_escaped` with Static stood aside and up, `static_left` hides him (setVisible plus a room_entered re-hide); Voltage's narration: "Static peels off the wall and goes with him without a word."; credit "STATIC: stood aside, and left with Voltage" |
| m9 | minor | A first punch on Voltage doesn't bring Static in | **Accepted and noted.** No mapping action turns an NPC hostile (npc-manager.js mapping config); opening a chat mid-fight would be worse. The stance route brings him in |
| m10 | minor | HaX's first call skips the dial | **Fixed.** "First, prove the screens are lying. There's an old dial thermometer in Battery Hall 1. / Then the engineering workshop, off the same hall." |
| m11 | minor | Lockpicking guide only offered in the security office | **Fixed.** Also offered on workshop entry (the OptiGrid case) |
| m12 | minor | Briefing HaX uses the player's `hacker` sheet | **Deferred** to the character stage (orchestrator) |
| m13 | minor | Hostile music ignores the phase | **Fixed** with N1 (below) |
| m14 | minor | Declared room `dimensions` don't match the templates | **Deferred** to room dressing (orchestrator), which re-checks positions after correcting them |
| m15 | minor | Stale timer comment ("restart from the reload moment") | **Fixed** (timers resume their saved running time). The Voltage ink comment about a restarted race describes a KO respawn as well as a reload and was left |
| m16 | minor | No klaxon or strobe in the world | **Deferred** to the lighting stage (a strobe on `crew_warned`) |
| m17 | minor | VM claims ("calibration override") with no mission-doc source | **Deferred** to the puzzle-chains stage (high-level check against SecGen) |
| m18 | minor | Static's three standoff choices share one reply | **Withdrawn.** Two of the three have their own reply before the shared "Not past me."; all three are fight choices by design, and the talk-past is the alternative |
| m19 | minor | The guard's opening reads oddly after a sight challenge | **Fixed.** The challenge opens a new `on_sighted` knot: "The guard is out of his chair before you reach the inner door." / "Oi. Desk first. Who are you, then?"; "(Keep walking.)" leads into his existing stop |
| m20 | minor | No field guide for the fingerprint kit | **Deferred**: lab sheets are out of this pass (for the backlog) |
| N1 | minor | Restored hostility after a reload, or a fight after the ESD, plays `threat` | **Fixed.** The rule skips events with `restored` (npc-hostile.js:107; guarded with `typeof` so a missing key can't break it) and anything after the shutdown; a clock-phase twin keeps `spy-action` (m13) |
| N2 | minor | Cipher's trigger is 96 px | **Fixed** with M3 |
| N3 | minor | The kit text replays after a reload | **Fixed.** Both kit texts `skipIfGlobal: vance_print_lifted`, set by the print mapping. Before the print is lifted a reload can still replay the kit text once: the replay comes from the inventory restore re-emitting the pickup, and no single global separates "picked up before" from "picking up now" without an engine change |
| N4 | minor | The guard's first-frame challenge collides with the tutorial prompt | **Needs an engine change, not made.** The tutorial prompt is not a minigame (the sight watcher only pauses for those), it emits no event, and a returning player's "done" state lives in localStorage, so `engine_tutorial_completed` / `_declined` can stay false all game; a `requireGlobal` on them would silence the guard for returning players. Two engine fixes would work: have the watcher pause while the tutorial prompt is open, or mirror the localStorage state into the game globals on load. Reported to the orchestrator |
| N5 | minor | Vance's chat portrait is the hooded hacker | **Deferred** to the character stage |
| O1 | obs. | "You don't get to have both" when the button isn't offered | **Fixed.** Without the button stance: "And Static's still in this room. I'd decide quickly." |
| O2 | obs. | A fight with Static joining can down an idle player | **Open** for a human playtest (fairness at real pace) |
| O3 | obs. | KO'd Static stands upright | **Deferred** to the character stage |

Task Force Null in m05: deferred to the m05 pass (orchestrator decision 4; in the backlog).

#### Decisions taken (with reasons)

- **Option (b), not (c)** (orchestrator): closing the quiet route after the alarm would punish the humane choice. Delays 24 / 30 min for the alarm pair: "about half an hour", long enough for a focused VM run, short enough to be a race.
- **Late alarm stays free**: the clock is already running, and now both Vance and HaX say so before the player chooses.
- **Normal clocks back on `attack_mechanism_known`**, so the music's `clock_started` can be set by the alarm without starting the 8 / 14-minute pair.
- **Cipher's beat uses the x=12 gap** he already stood in, so his start and end tile are unchanged and his drop point stays on open floor.
- **N4 not worked around**: every mission-local option either silences the guard for returning players or needs a timer action the engine doesn't have.

#### Route driver

`scripts/ink_runtime_check/m04_routes/route.js` gains a clock model (`advance`: the erb's timers start on their globals and fire in due order with their conditions), `said` / `notSaid` assertions on what was printed, a `backstops` step that evaluates the per-room backstop conditions against the globals, and the round-2 engine reactions (`crew_warned_early`, `static_left`). r1 now shows an early warner beating the 30-minute clock; r4 shows the alarm clock venting bank B at 30 minutes with the crew out. New routes, all passing with r1 to r4:

- r5 late warning (no time cost said, no "clock early", Voltage's klaxon line, Static leaves, credits);
- r6 Vance KO'd (no answer, KO hint, normal clock vents with the crew in, Vance absent from the debrief);
- r7 cover held then a late reveal (no offer before, "half an hour" after, the alarm clock wins at 30 against the normal one at 34);
- r8 Cipher walked, with and without the alarm (police line, credit, "...Nine?");
- r9 button stance after an unwarned vent ("your forty", Vance's nine);
- r10 the A4 backstops (none after the ESD, re-emit after "Bring me in", hear-the-debrief after its first line);
- r11 Voltage fought before the dial (no button, no crew offer, trigger race vents with the crew in).

#### Checks (static; no browser session started)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 16 warnings, the same set as round 1 (the Static room_entered pair was made disjoint). dialoguelint: 0 errors, 6 blank-reentry checks (unchanged set). reopencheck: 0 problems (m04 block of missions.json regenerated). tagdiff against HEAD: 66 structural differences, all from this round. inkcheck and loopcheck over the changed knots (guard sighted, Voltage with the alarm and after a vent, debrief warned-early / lost / late, Vance phone after the shutdown and after the mapping, Vance hub, HaX hub with Vance KO'd): clean. `check_door_alignment.py`: OK. Routes: 11 of 11 pass.

Browser checks for round 3: Cipher's beat (walkable, cone, crossing window), the guard's `on_sighted` knot, the alarm clocks and the HUD order, Static leaving with Voltage, the music after a reload with Relay hostile.

#### Spoken lines changed (old → new)

Robert Vance, face to face:
- "The screens are lying to you. I'm on the historian, and the real rack temperatures are climbing. Get to the hardwired shutdown. Software won't save us." → "The screens are lying to you. I've the hydrogen readout from the vent controller up here. It's off their network, and it's climbing." / "Get to the hardwired shutdown. Software won't save us."
- "With Voltage on the other side? And somebody has to watch the real numbers." → "With Voltage on the other side? And somebody has to stay on this desk."
- "Whoever's in my plant room hears it too. The minute it goes, they know we've found them." → (before the mapping) "Whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe, and your workshop job isn't done." / (after) "Whoever's in my plant room hears it too. But your clock's already running, so it costs you nothing now but surprise."
- Choice: "Not yet. Give me time to get to them first." → "Not yet. Let me get closer to Voltage first."
- New: "The workshop wants a Level 2 card, and mine's only Level 1. Their contractors had Level 2."

Robert Vance, phone:
- "Still here. Still watching it climb." → "Still here. Still watching the hydrogen climb." (after the dial) / "Still here." (before) / "Banks are isolated. The hydrogen's coming down at last." (after the shutdown)
- "I can't leave the desk. Voltage is through there, and somebody has to watch the real numbers." → "…somebody has to watch the hydrogen."
- "And whoever's in my plant room hears it too. The minute it goes, they know we've found them, and they won't wait for eight." → (before the mapping) "And whoever's in my plant room hears it too. He won't wait for eight." / "You'll have half an hour, maybe, and your workshop job isn't done." (after) "Whoever's in my plant room hears it too. But your clock's already running, so it costs you nothing now but surprise."
- "The historian has the cells past sixty and climbing. My screens still say twenty-eight." → "Your dial says sixty-one. I've the hydrogen readout from the vent controller up here, it's off their network, and it's climbing."
- "The historian reads hotter than my screens. Read the dial in Hall 1 and you'll see by how much." → "My screens say twenty-eight and I don't believe them. Read the dial in Hall 1. It isn't on their network."
- "Find out how they're driving the SCADA network. Everything waits on that." / "The jump-server terminal in the workshop is your way in." → the five-step `priority_guidance` (new lines: "You've done it. Banks isolated, vents at full. Go and see what they left behind."; "My screens all read the same feed. Check the racks against something that isn't on it." / "There's an old dial on the Rack Bank C wall in Hall 1."; the Level 2 card line; "The workshop. If they got onto my network, it was through the jump server in there."); the two ESD lines kept.
- New: "It's over. Banks isolated, vents at full, and the hydrogen's falling."
- Texts: "It's Vance. The historian has the cells far hotter than the SCADA admits. Get to the hardwired ESD in the plant room. The software won't save us." → "It's Vance. Every screen I've got says twenty-eight, and I don't believe one of them. There's an old dial on the Rack Bank C wall in Hall 1. Read it."; "It's Vance. I'm on the ops desk with the historian up, and on comms if you're moving…" → "It's Vance. I'm on the ops desk, and on comms if you're moving…"

HaX:
- "First job: find how they got onto the SCADA network." / "The way on is the engineering workshop, off Battery Hall 1. Start there." → "First, prove the screens are lying. There's an old dial thermometer in Battery Hall 1." / "Then the engineering workshop, off the same hall. That's how they got onto the SCADA network."
- "But think first. The minute that alarm goes, Voltage knows we've found him, and he won't wait for eight." → (before the mapping) "But think first. The minute that alarm goes, Voltage knows we've found him. You'd have about half an hour, not till eight." / (after) "The clock's already running, so the alarm can't cost you any time now." / (Vance KO'd) nothing.
- Texts: "…Your clock just started." → "…You've about half an hour."; new hydrogen variant "Hall 2's night foreman rang the ops desk. Nine of them behind the inverter wall can smell it. Vance can still sound the evacuation. Then the button."
- Debrief: "And Vance's alarm had the night crew out before the button went in. It started your clock early. It was still the right call." now only for an early alarm; late: "And Vance's alarm had the night crew out before the button went in." New: "Your alarm started his clock. Bank B and two on the feed are what it cost." / "Nine people in Hall 2 are what it bought. Hall 2 was empty when it went."; "Vance lost nine of his crew tonight. He hasn't said a word about you yet."

Robert Vance, debrief, new: "Nine of mine. I'll be telling their families myself."

Voltage: new "Your klaxon. Nine people in hi-vis on my cameras, walking out the fire doors. Very humane."; "You don't get to have both. I'd decide quickly." now only with the button on offer, else "And Static's still in this room. I'd decide quickly."; "You save your eleven and your forty…" → "You save your forty…" after a vent with the crew in; narration "Static peels off the wall and goes with him without a word."

Security guard, new (`on_sighted`): narration "The guard is out of his chair before you reach the inner door."; "Oi. Desk first. Who are you, then?"; narration "You keep walking. He steps into your path."

#### Open after round 2

- N4 needs an engine change (see the table); reported.
- O2 (fight fairness with Static joining) needs a human playtest.
- Browser checks listed above.
- Deferred to later stages: m12, N5, O3 (characters); m14 (room dressing); m16 (lighting); m17 (puzzle chains); m20 (lab sheets, backlog); Task Force Null (m05 pass).

### Phase 1 alignment, round 4

Inputs: round 3's review `ALIGNMENT_REVIEW_P5_R3.md` (Opus, static; 0 blockers, 2 majors, 8 minors; rounds 1 and 2 confirmed apart from two regressions from round 2's clock) and `PASS5_ALIGN_R2_BROWSER.md` (Sonnet; all 7 checks pass; B1 is the review's M1, plus browser minors m1 and m2). Each finding checked against the files first. Outcomes: all 12 fixed, none withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 / B1 | major | After an early alarm and a quick mapping, the HUD kept showing the alarm's 24-minute advisory while the real advisory came at mapping + 8 | **Fixed** (reviewer's fix). `h2_advisory_alarm`'s condition adds `!globalVars.attack_mechanism_known`; the widget re-evaluates conditions each tick, so at the mapping it falls through to `h2_advisory`. `racks_vent_alarm` is unchanged, so the vent still comes at min(alarm + 30, mapping + 14) (r7 shows the alarm vent at 30 after a mapping at 20). The round-2 "HUD limit" note in the timer comment is replaced by the new behaviour; round 2's table above describes the state at the time |
| M2 | major | An early alarm with Voltage already down still started "his clock" | **Fixed.** The early mapping needs `voltage_neutralised !== true`; the late mapping too; a third mapping for `voltage_neutralised === true` sends "That's the evacuation. Nine out of Hall 2. Nobody left in the plant room to hear it." and leaves `clock_started` alone (no music change, no timers). Vance (face to face and phone) and HaX's hint get a first "Voltage down" branch. `vented_by_alarm_clock` can't arise with him down, so the debrief needs no change |
| m1 | minor | "Your workshop job isn't done" with all four flags in | **Fixed.** An `all_flags_in` branch drops the clause, in both Vance inks |
| m2 | minor | Cipher's opening narration predates the patrol | **Fixed.** "He's halfway up the rack row, a handset already half out of its clip." |
| m3 | minor | The guard's sight challenge fires on the spawn tile, so nobody hears his friendly opener | **Fixed by routing the openers.** `on_sighted` now reads as a first meeting at the door and keeps his opener: "The guard's already on his feet as you come through the door." / "Morning. Bit early for visitors. Desk first, if you don't mind." "(Keep walking.)" is still the slip-past. Turning his cone is a dressing change, and would let players walk past him unseen |
| m4 | minor | Static's coordination log was an itemsHeld drop, lost to a talk-past player (and gone with him since round 2) | **Fixed: moved.** It is a plant-room object now, same text and `onPickup`, for every route; Static carries nothing. His ink comment corrected. Placement is the template's; room dressing may pin it to the bench |
| m5 | minor | The debrief's "Voltage is…" opener skipped the Vance and KO lines and played "Lives over one operative" after a crew loss | **Fixed.** The Vance and KO lines are a shared tunnel (`debrief_people`) called from both openers; "Lives over one operative, every time." only when the crew wasn't lost |
| m6 | minor | Vance's phone still offered "How do I shut this down safely?" after the shutdown | **Fixed.** Gated on `not attack_prevented` |
| m7 | minor | "The one honest instrument… a dial" contradicts the hydrogen monitor and Vance's readout | **Fixed.** "The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read."; the fix line is split and now reads "A temperature gauge in every hall that isn't on the bus, and somebody reading it." |
| m8 | minor | No routes for an early alarm then quick mapping, or a warning with Voltage down | **Fixed.** r12 and r13 (below) |
| br-m1 | minor | Cipher's east look reached players waiting at the Hall 2 door (144 px, range 150) | **Fixed.** East waypoint (14,3) → (13,3), about 176 px from the door stop. Needs the browser check |
| br-m2 | minor | Vance's hub reopened under a stale line ("That's uncomfortably easy…") | **Fixed.** `vance_hub` opens with a short re-entry line ("What do you need?" / "Go on." / "Still here."; off-cover "Something else?" / "Yes?" / "Make it quick."), skipped once right after a goodbye (`vance_quiet`, m03 hub_quiet), so a re-talk opens on a fresh line. This also clears the hub's blank-reentry lint check |

No new globals this round (the m04 block of `missions.json` is unchanged).

#### Route driver

`hud` step added (which countdown the widget would show: the first started, undone `showCountdown` timer in array order whose condition holds). Route notes no longer count towards `said` / `notSaid`. The Voltage-down rule mirrors the new mapping. New routes:
- r12: three flags in, an early alarm, the mapping 2 minutes later. The HUD switches from `h2_advisory_alarm` to `h2_advisory`; the normal advisory fires at mapping + 8 and the vent at + 14; no `vented_by_alarm_clock`; the debrief plays "Hall 2 was empty when it went", not "Your alarm started his clock".
- r13: Voltage KO'd before the mapping, then the dial and a warning. HaX and Vance say it costs nothing; no `crew_warned_early`, no `clock_started`, no HUD countdown, nothing vents after 40 minutes.

All 13 routes pass.

#### Checks (static; no browser session started; engine JS untouched)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK, 16 warnings (the same set). dialoguelint: 0 errors, 5 blank-reentry checks (vance_hub cleared). reopencheck: 0 problems. tagdiff against HEAD: 40 structural differences, all from this round. inkcheck and loopcheck over the changed knots (debrief both openers with KOs and a crew loss, Vance meeting and hub with Voltage down, Vance phone after the shutdown, guard `on_sighted`, HaX hub with Voltage down): clean. Door alignment OK.

Browser checks for the confirmation run: the HUD switching at the mapping after an early alarm; Cipher's east look from (13,3) against a player at the Hall 2 door; the guard's new opener on the spawn tile; the coordination log's placement in the plant room; Vance's hub re-entry line on the ally-by-clone route; plus round 3's carried checks (Cipher's beat, Static leaving and the re-hide, music after a reload with Relay hostile).

#### Spoken lines changed (old → new)

Robert Vance, face to face:
- Crew cost, new first branch (Voltage down): "Whoever was in my plant room isn't listening any more. It costs you nothing."
- New branch (all four flags in, not yet mapped): "Whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe."
- Hub re-entry, new: "What do you need?" / "Go on." / "Still here." (ally); "Something else?" / "Yes?" / "Make it quick." (cover).

Robert Vance, phone:
- Crew cost, new branches: "Whoever was in my plant room isn't listening any more. It costs you nothing."; "And whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe."
- "How do I shut this down safely?" and its answer no longer offered after the shutdown.

HaX:
- Crew hint, new branch (Voltage down): "Voltage is down, so nobody's listening. The alarm costs you nothing."
- Text, new: "That's the evacuation. Nine out of Hall 2. Nobody left in the plant room to hear it."
- Debrief: "And the control room believed its own sensors. The one honest instrument in the place was a dial nobody had wired to anything." → "And the control room believed its own sensors. The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read."
- Debrief: "Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger. A gauge in every hall that isn't on the bus." → "Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger." / "A temperature gauge in every hall that isn't on the bus, and somebody reading it."
- Debrief: "Lives over one operative, every time." now not after a crew loss; the Vance and KO lines now also play on the "Voltage is…" opener (no wording change).

Security guard (`on_sighted`): "The guard is out of his chair before you reach the inner door." / "Oi. Desk first. Who are you, then?" → "The guard's already on his feet as you come through the door." / "Morning. Bit early for visitors. Desk first, if you don't mind."

Cipher: "He is crouched at the end of the rack row with a panel open and a handset already half out of its clip." → "He's halfway up the rack row, a handset already half out of its clip."

#### Open after round 4

- The browser checks above (one Sonnet confirmation run, as round 3 recommends).
- O2 (fight fairness with Static joining) still needs a human.
- N4 is with the engine agent (the watcher pausing for the tutorial prompt).
- Deferred to later stages as before: m12, N5, O3 (characters); m14 and the log's bench position (room dressing); m16 (lighting); m17 (puzzle chains); m20 (backlog); Task Force Null (m05 pass).

### Phase 1 alignment: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors | Browser check |
|---|---|---|---|---|
| 1 (partial review; safety check stopped it) | 0 | 6 | 11+ | PASS5_ALIGN_R1_BROWSER: all pass, 5 minors |
| 2 | 0 | 3 | 20 | PASS5_ALIGN_R2_BROWSER: 7/7 pass, 1 major (HUD) |
| 3 | 0 | 2 | 8 | — |
| 4 (confirmation) | 0 | 0 | 2 | PASS5_ALIGN_R4_BROWSER: 7/7 pass, game 2207 |

Round-4 browser minors, deferred:
- **Completion toasts briefly cover the countdown HUD.** This is a toast-layout issue that affects every mission, so it goes to the backlog.
- **The Resume overlay is inconsistent between reloads.** This is the known engine item E3.

O4, where a player standing still is permanently safe east of Cipher, is accepted. A player who waits at the door gets past him, and the Hall 2 door has its own challenge in Relay.

Engine change for N4: 0b66f334 (sight challenges hold while the tutorial prompt is open).

### Phase 2 puzzle chains, round 1

Review: `PUZZLE_CHAINS_REVIEW_P5_R1.md` (Opus, static; 0 blockers, 2 majors, 5 minors). The orchestrator decided each finding; the fixer checked them against the files and applied them. The SecGen XML was not opened.

| # | Sev. | Finding | Decision and reason | Outcome |
|---|---|---|---|---|
| F1 | major | The compare/identify step doesn't gate the plant door: any lift of Vance's print opens it (biometric-lock.js matches on the lift's owner, not `identified`) | **Accept** (orchestrator). The "fun, not hard" rule; the lift is still required, and identifying still earns the optional bypass-module evidence. No engine change | **No game change.** Checked every hint and text: none claims the identification opens the door (HaX's kit and print texts, `hint_reader`, Vance's lines all ask only for the lift). `TESTING_WALKTHROUGH.md` step 11 now says the compare is a forensic flourish, not a gate |
| F2 | major | HaX's root text and the privesc reward description claim a temperature-rewriting "calibration override" that no in-game text supports | **Soften to what the game shows** (orchestrator): the SCADA Parameter Change Log's charge-ceiling override. The user will check the VM against SecGen later | **Fixed.** HaX's privesc text, the flag-reward description and the sudo guide line now name the charge-ceiling override (lines below). No other occurrence. Flag names unchanged, pending the user's SecGen check (still m17) |
| F3 | minor | Over-redundancy: four evidence sources, three routes to the Level 1 card | **Keep** (orchestrator): they are softlock backstops, and each evidence document is a distinct in-world artefact | No change |
| F4 | minor | The dial deduction is over-signposted: the digital rack panel says the dial is off-bus | **Tone down** (orchestrator), keeping one clear in-world clue | **Fixed.** The panel ends at "Feed source: BMS sensor bus."; the player makes the jump themselves. The clue kept is the SCADA HMI's "If that feed is lying, only a standalone instrument in the hall would show it." Noted, not changed: two automatic texts still name the dial (HaX's work-order text, Vance's 20 s text); the dialogue phase can judge whether they're too direct |
| F5 | minor | 13 validator duplicate-mapping notes on `agent_0x99` | **As the review proposes** (orchestrator): leave as known. Most pairs are independent side effects, not mutually exclusive globals, so `mutuallyExclusiveGlobals` would misstate them | No change; known noise |
| F6 | minor | Voltage's two resting knots have no re-entry line | **Dialogue phase** (orchestrator) | Deferred |
| F7 | minor | Legacy sprites on four speaking characters | **Character stage** for the operatives (orchestrator); the briefing HaX now, user-approved | **Briefing HaX fixed:** `agent_hax` sheet, talk and viseme fields as m03's briefing HaX, plus the `agent_hax_headshot.png` avatar that m04's other two HaX NPCs use (m03's briefing NPC has no avatar field). The validator's two "legacy hacker sheet" and "hacker shared with the player" suggestions are gone. Cipher, Relay and Static stay deferred |

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK, 16 warnings, the same set as round 4; the two hacker-sheet items it no longer lists were suggestions, not warnings. dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0 problems. tagdiff against HEAD: structure unchanged (10 files). Door alignment OK. Routes: 13 of 13 pass.

#### Spoken lines changed (old → new)

- HaX, text: "Root. Now you can see their calibration override: that box rewrites every rack temperature before SCADA gets it. That's how sixty reads as twenty-eight." → "Root. Now you can see what they changed from that box: the charge-ceiling override on every bank. That's how they're pushing the racks past safe."
- HaX, phone (sudo guide): "Sent. On the box, check what sudo lets you run. That's how the crew reached the calibration file." → "Sent. On the box, check what sudo lets you run. That's how the crew got at the charge settings."
- Not spoken: the flag-reward description "Root on the jump server - the calibration override that fakes the thermals" → "Root on the jump server - where the charge-ceiling override was pushed from"; the digital rack panel loses "The mechanical dial on this same wall is not on the bus."

### Phase 2 puzzle chains, round 2

Review: `PUZZLE_CHAINS_REVIEW_P5_R2.md` (Opus, static; 0 blockers, 2 majors, 5 minors). Orchestrator decisions applied; each finding checked against the files first. The do-not-open rule held (no SecGen XML, none of the four listed field guides).

| # | Sev. | Finding | Decision and reason | Outcome |
|---|---|---|---|---|
| R2-1 | major | The paper-evidence gate no longer exists (engine 657f6158: `map_the_attack` completes on the four flags alone), but a HaX text still sent the player for the paper with the clock running; a hub branch and an ESD refusal variant were dead | **Retire the gate** (orchestrator). The ESD's own wording asks only for the hazard and the cause; the documents stay as optional story and credits material | **Fixed.** The "break-in on paper" HaX text (erb, on `all_flags_in`) is deleted; the dead ESD variant and the dead hub branch are deleted; the flag-tracking comment is rewritten with the history. HaX's ink no longer declares the four evidence globals (nothing there reads them). `find_infiltration_evidence` is now `optional: true`, so `confirm_the_lie` completes on the dial; the evidence still ticks the task. (Corrected in round 3: the objectives panel draws an optional task like a required one, and the debrief doesn't read the evidence globals; R3-3 adds a credits line instead.) Checked HaX, Vance, the walkthrough and every aim and task text: no other text says the paper is required. `TESTING_WALKTHROUGH.md` step 4 says it's optional. The follow-on dial text on `all_flags_in` now stands alone ("Flags are in. Grid control still wants a real reading off the racks…", 2.5 s instead of 7). Browser check: the review notes `attack_mechanism_known` is set before `objective_task_completed` fires (objectives-manager.js:432-440); the deletion makes the ordering moot |
| R2-2 | major | "Where do I stand?" stops naming the dial once the flags are in, and says "Stay by the button" at the climax | **As the review gives** | **Fixed.** A `- not anomaly_detected:` branch after the `not attack_mechanism_known` block names the dial; the old flags-in sub-branches are gone. New route `r14_flags_first_dial_last.json` (flags first, no paper, no dial; the hub names the dial before and after Voltage is down, never "Stay by the button" or the paper; then the "last piece" reply once it's true) |
| R2-3 | minor | "Then the dial was the last piece." whenever the workshop had been reached | **Gate it properly** | **Fixed.** Offered only with the attack mapped and Voltage dealt with; otherwise "[Then what's still missing?]" with a reply that names the cause or Voltage |
| R2-4 | minor | The work-order text names the dial before the player can infer it | **Trim it; keep Vance's 20 s text** (pointing at the dial is his job) | **Fixed** (line below) |
| R2-5 | minor | The aim-complete text claims more than the flags show | **Rewrite within the brief's VM summary** | **Fixed** (line below): the route in, the charge-ceiling override, the bypass modules (physical evidence), the trigger |
| R2-6 | minor | VM text finer than the brief (ProFTPD backdoor guide, "fake rack status page", flag strings, root content) | **No change** (orchestrator): on the user's SecGen to-do list | Open: **needs checking against SecGen by the user** (with m17) |
| R2-7 | minor | Eleven unused globals | **Remove** (orchestrator), after checking readers | **Fixed.** Removed `scada_anomalies_identified`, `infiltration_confirmed`, `esd_activated`, `optional_objectives_completed`, `combat_encounters_won`, `stealth_takedowns`, `facility_access_granted`, `vance_knows_truth`, `mission_started`, `agent_0x99_contacted`, `remote_trigger_disabled` (and its ESD `completionActions` write). Checked: no erb, ink or route reads; the engine's only `esd_activated` use is the ESD minigame's default `activatedVar`, which m04 overrides (`attack_prevented`); `vance_knows_truth` survives only in the walkthrough's rename note, now marked as removed. `missions.json` m04 globals regenerated (83) |

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 15 warnings (one fewer: the `all_flags_in` duplicate pair went with the deleted text). dialoguelint: 0 errors, 5 blank-reentry checks (the new aim-complete text was trimmed to fit the 30-word cap). reopencheck: 0 problems. tagdiff against HEAD: 17 structural differences, all from this round (the hub branches, the gated reply, the dropped VARs). inkcheck and loopcheck over the dial reply (both states), `report_progress` with flags in and no dial, and the hub entry: clean. Door alignment OK. Routes: 14 of 14 pass.

#### Spoken lines changed (old → new)

HaX:
- Text, deleted: "Flags are in, but grid control won't move without the break-in on paper. Work orders in the ops office, the workshop access log, or the camera log in security."
- Text: "And grid control wants a real reading. The dial thermometer on the Rack Bank C wall, Hall 1. It isn't on their network." → "Flags are in. Grid control still wants a real reading off the racks. The dial thermometer on the Rack Bank C wall, Hall 1. It isn't on their network."
- Text: "That's the attack mechanism confirmed — falsified thermals, ESD interlocks disabled, overcharge armed for 0800. The trigger is in the plant room. Get there, and get to the ESD." → "Their route in, proven. They pushed the charge-ceiling override from that box, and the bypass modules hide it. The trigger is in the plant room. Get to the ESD."
- Text: "That work order was never authorised — there's your evidence. Don't trust the SCADA screens; they're spoofed. Check the racks against the physical dial in Battery Hall 1." → "That work order was never authorised. There's your evidence. Don't take the SCADA screens on trust."
- Phone, deleted (`report_progress`): "Your flags are in. Grid control still wants the break-in on paper." / "Vance's work orders in the operations office, the access log in the workshop, or the camera log in the security office."
- Phone, `report_progress`: "Your flags are in. Grid control still wants a real reading off the racks." / "The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network." (unchanged wording, now reachable after the mapping)
- Phone, new: choice "[Then what's still missing?]"; "Grid control has the hazard and the cause. Now Voltage." / "Grid control has the hazard now. Get them the cause, off the workshop terminal."

Not spoken: the ESD refusal variant naming the missing break-in is deleted.

### Phase 2 puzzle chains, round 3

Review: `PUZZLE_CHAINS_REVIEW_P5_R3.md` (Opus, static; 0 blockers, 2 majors, 4 minors). All six fixed as the reviewer proposes (orchestrator). The do-not-open rule held.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R3-1 | major | Take the locker spare and "Where do I stand?" says "You need Vance's door card" for the rest of the mission; the card-reader hint stays on offer | **Fixed.** The spare has an id (`security_spare_keycard_l1`) and `onPickup` latches `level1_card_held`; the hub's card step and the card-reader hint read it. `vance_provided_keycard` is deliberately not set from the spare (the RFID-guide text would claim a clone, and Vance's clone choices would vanish) |
| R3-2 | major | Slip past the guard and the hub says "You're not in yet" all mission, keeps the gate hint, never offers the card-reader hint | **Fixed.** HaX's `room_entered:operations_office` mapping sets `checkpoint_passed`; the gate step and gate hint skip on it; the card-reader hint opens on `guard_admitted or security_guard_ko or checkpoint_passed`. `guard_admitted` is not set (the guard would greet the player as signed in) |
| R3-3 | minor | The paper thread was described as paying off in the debrief and credits, where it didn't | **Fixed.** One unvoiced credits line: "THE BREAK-IN: on paper — the OptiGrid work order, the camera gaps, the spoofed reader", shown when any of the four documents was read. Both erb comments now say what the documents really earn; the round-2 log line above is corrected |
| R3-4 | minor | Dead `all_flags_in` branches in Vance's crew cost (in person and phone) | **Fixed.** Both deleted, with the now-unused `all_flags_in` VARs |
| R3-5 | minor | The root beat is lost when Voltage was dealt with before the last flag | **Fixed.** A disjoint twin on `objective_aim_completed:map_the_attack` for `voltage_neutralised === true`, 1.5 s, before the ESD-live text |
| R3-6 | minor | Leftovers: `flags_submitted`, `objectives_completed`, r1's `remote_trigger_disabled`, two stale comments, Vance phone's unused `vance_provided_keycard` VAR | **Fixed.** Both globals and HaX's `flags_submitted` VAR removed (the engine's `objectives_completed` is a database column, not this global); r1's key removed; the evidence-sources comment now lists four and the work-order text's purpose; the VAR removed. `missions.json` m04 globals regenerated (83) |

#### The "how, not whether" sweep

The hub has three times checked how a player got past a step rather than whether they did. Every branch of `report_progress` and every hint gate in `support_hub` was checked for that pattern. Two more found and fixed:
- **The Vance step.** "Find Robert Vance" fired for a player who never spoke to him but already held a Level 1 card (the locker spare, or Hall 2 already open). It now skips when the player has any Level 1 card or has been in Hall 2 (`plant_reader_seen`). The card step also skips on `plant_reader_seen`, since Hall 2 opens only on a Level 1 card.
- **The dial hint's gate.** It opened only after meeting Vance or knocking him out; it now also opens once the player is inside (`checkpoint_passed`).
Checked and already whether-based: the dial step (`anomaly_detected`), the workshop (`server_room_reached`; its Level 2 line accepts the clone or the KO, the only two routes to the card), the mapping (`attack_mechanism_known`, set however the flags land), the plant room (`plant_room_entered`), Voltage (`voltage_neutralised`, set by KO, arrest or escape), the ESD (`esd_authorized`), and the race, Voltage, crew, reader, Relay, workshop and operative-down hints.

#### Route driver

Every choice offered now counts towards `said` / `notSaid` (before, only the picked one did, so a "this hint isn't on offer" check was weak). All earlier routes still pass under the stricter check. New route `r15_spare_card_slip_past.json`: past the gate by slipping by, with the locker spare and no clone; the hub names the dial, with no gate or card line and neither hint on offer; then the same with Vance never met (the Vance step is skipped); then with no card yet, the card-reader hint is offered and the gate hint isn't. 15 of 15 routes pass.

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 15 warnings, the same set except that `objective_aim_completed:map_the_attack` now has three handlers (the setter and the two disjoint texts, by design). dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0 problems. tagdiff against HEAD: 20 structural differences, all from this round. inkcheck and loopcheck on `report_progress` and the hub with the new globals, Vance's hub and phone: clean. Door alignment OK.

#### Spoken lines changed (old → new)

- Vance, face to face, deleted (dead branch): "Whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe."
- Vance, phone, deleted (dead branch): "And whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe."
- HaX, new text (twin): "Their route in, proven. They pushed the charge-ceiling override from that box, and the bypass modules hide it."
- No other wording changed: the hub's lines are the same, only when they show.
- Not spoken: the new credits line "THE BREAK-IN: on paper — the OptiGrid work order, the camera gaps, the spoofed reader".

Carried: R2-6 / m17 **need checking against SecGen by the user**.

### Phase 2 puzzle chains, round 4

Review: `PUZZLE_CHAINS_REVIEW_P5_R4.md` (Opus, static; 0 blockers, 0 majors, 5 minors; recommends closing the phase). All five applied as the reviewer proposes (orchestrator). The do-not-open rule held.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R4-1 | minor | HaX's first call assumes the player is inside, and offers "Met Robert Vance" before they've met him | **Fixed.** A fourth choice, "[Not yet. I'm at the gate.]" (→ "Then the badge. Routine audit, came early. Call me once you're past him."), offered until the player is inside. The three "inside" answers wait for `guard_admitted or security_guard_ko or checkpoint_passed`, and "Met Robert Vance" also for `vance_met`. There is always at least one choice |
| R4-2 | minor | "I've put one of their people down" sends the player after Relay's card they already hold | **Fixed.** "Relay's the one carrying a workshop card." only while the card isn't held (`not relay_card_cloned and not server_room_reached`) |
| R4-3 | minor | The plant-reader hint sends a player holding the print back for it | **Fixed.** HaX's ink declares `vance_print_lifted`; `hint_reader` opens with "You've got his print. Use it on the reader. It can't tell a lift from a living thumb.", and the reviewer's optional `report_progress` branch is added ("You've got it. Use it on the reader.") |
| R4-4 | minor | The credits line names three documents whenever any one of four was read | **Fixed.** Generic: "THE BREAK-IN: traced on paper to the OptiGrid crew" (same condition) |
| R4-5 | minor | Two VM texts assume the flags arrive in task order | **Fixed, after checking the order.** The flag station has no ordering: the server's `submit_flag` checks station ownership, duplicates and validity only (games_controller.rb `submit_flag`), so any flag can land first. The FTP-flag text now has `skipIfGlobal: flag_distcc_exploit_submitted`, the scan-flag text `skipIfGlobal: flag_ftp_intel_submitted`; the guide offers (`setGlobal`) stay |

Route `r16_gate_first_call_card_print.json` covers R4-1 to R4-3 (gate-state first open; Cipher down with Relay's card held; kit and print in hand). 16 of 16 routes pass.

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 15 warnings, the same set. dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0 problems. tagdiff against HEAD: 15 structural differences, all from this round. inkcheck and loopcheck on the first call (at the gate, and inside), `hint_reader` with the print, and the hub with one operative down: clean. Door alignment OK.

#### Spoken lines changed (old → new)

HaX, phone:
- New choice and reply: "[Not yet. I'm at the gate.]" → "Then the badge. Routine audit, came early. Call me once you're past him."
- "One down. Check what he dropped. Relay's the one carrying a workshop card." → "One down. Check what he dropped." plus "Relay's the one carrying a workshop card." only while the card isn't held.
- New (`hint_reader`): "You've got his print. Use it on the reader. It can't tell a lift from a living thumb."
- New (`report_progress`): "You've got it. Use it on the reader."

Not spoken: the credits line "THE BREAK-IN: on paper — the OptiGrid work order, the camera gaps, the spoofed reader" → "THE BREAK-IN: traced on paper to the OptiGrid crew". The two VM texts are unchanged in wording; they are now skipped when out of order.

Carried: R2-6 / m17 **need checking against SecGen by the user**.

### Phase 2 puzzle chains: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 2 (decisions: F1 accepted, F2 softened) | 5 |
| 2 | 0 | 2 | 5 |
| 3 | 0 | 2 | 4 |
| 4 | 0 | 0 | 5 (fixed, 0035bb4d) |

Browser check of the round-3 checks, PASS5_PUZZLE_R3_BROWSER (games 2209–2210): 6/6 pass, briefing HaX on her own sprite. Its minors M-1 to M-3 go to phase 3, scenario design:
- M-1: two HaX texts land back to back once the flags are in but the dial is unread.
- M-2: "Find the OT engineer" stays open when the player never meets Vance.
- M-3: the debrief and credits assume Vance was met.

Open for the user: R2-6 / m17 (SecGen check).

## Phase 3: scenario design

### Phase 3 scenario design, round 1

Review: `SCENARIO_DESIGN_REVIEW_P5_R1.md` (Opus, static; 0 blockers, 1 major, 17 minors; the second half finished by the orchestrator from the reviewer's hand-back after a safety stop) plus browser minors M-1 to M-3 from `PASS5_PUZZLE_R3_BROWSER.md`. Each finding checked against the files first. The do-not-open rule held.

| # | Sev. | Finding | Decision and reason | Outcome |
|---|---|---|---|---|
| M1 | major | The debrief reflects on none of the OT-network weaknesses the four flags expose, and says the cross-cell paper is still "for forensics" when flag 2 has already shown it | **Yes** (orchestrator, decision 1): these are the mission's MAT, SS and NS lessons; m02 and m03 both name theirs | **Fixed.** `debrief_what_failed` gains three lines at the brief's "VM side, at a high level" level (a legacy compile service left running and trusted on an OT box; an FTP service that handed over the cross-cell plan; a jump-server account with too much privilege) and one fix line. The `else` of the intelligence beat now credits the FTP drop. **Check against SecGen by the user** |
| m9 | minor | Canon: "You're under arrest" | **Change m04 now** (orchestrator, decision 2); m01, m02, m06 to the backlog | **Fixed.** Bible: SAFETYNET has no jurisdiction or arrest powers; agents detain and hand over to the police (`story_design/universe_bible/02_organisations/safetynet/overview.md`, "The Cost of Independence"; PASS2 lesson 39). Voltage's choices: "Step away from the bench. You're coming with me." / "Hands on the bench. The police can have you."; HaX's hint "take him and hand him to the police" / "he's yours to hand over". Globals and credits unchanged ("in custody" is true after hand-over). Voltage's own "Above him it stops being a person you can arrest" is left: it's his line about the police, not a SAFETYNET power |
| m1 | minor | No prompt when Hall 2's reader refuses a player with no Level 1 card | As proposed | **Fixed.** HaX mapping on `door_unlock_failed:battery_hall_2` (no clone, no spare), onceOnly |
| m2 | minor | HaX's 61°C call opens itself the instant the dial is touched | **Make it safe** (orchestrator) | **Fixed** with m03's P3-3 pattern: a text that opens the call when clicked ("Sixty-one on that dial? Call me when you're clear of it.", 6 s, spaced from the 1.2 s ESD-live text), plus a hub re-offer "[You wanted to talk about the dial reading.]" until heard (`anomaly_call_heard`). No auto-opened chat can now close the dial view |
| m3 | minor | Static idles beside a knocked-out Voltage | As proposed | **Fixed.** Static mapping on `npc_ko:voltage` (stood aside, not engaged, not down) sets `static_left` and a new `static_left_alone`; the existing hide and re-hide apply; credit twin "STATIC: stood aside, and slipped out when Voltage fell" |
| m4 / M-3 | minor | Vance speaks in, and is thanked in, a debrief he was never part of | As proposed | **Fixed.** The debrief reads `vance_met` / `vance_is_ally`: no "Vance needs to hear it too", no Vance reactions or final words, no "Vance will want every line", and two not-met farewells ("Make sure the site manager gets the report." / "Just doing my job.") → HaX: "He'll get it. He'll want to know who was in his plant tonight, and why nobody told him." Credits: "ROBERT VANCE: never met — you went round him"; "never told" now needs `vance_met` |
| m5 | minor | "Vindicated — his warning broke the case open" overclaims | As proposed | **Fixed.** "ROBERT VANCE: brought in — ran the desk while you ran the halls" |
| m6 | minor | The debrief names Blackout while the credits hide him | As proposed (option 1) | **Fixed.** That debrief line sets `blackout_named` (HaX names him, so the player has now heard it) |
| m7 | minor | "So far he's given us one thing" vs "Voltage put it at six cities" | As proposed | **Fixed.** `voltage_six_cities` (synced) is set in `voltage_negotiation_attempt`; the debrief says "Voltage told you six cities, in the plant room." only then, otherwise "The documents name several cities." |
| m8 | minor | HaX's first call offers an untrue "I told him the truth… He's in." | As proposed | **Fixed.** Choice deleted, with its now-orphaned reply knot |
| m10 | minor | The alarm texts land while Vance's chat is open | As proposed (option 1) | **Fixed.** The three `crew_warned` texts wait 8 s (were 3) |
| m11 | minor | Optional tasks read as required | **Mission-local stopgap** (orchestrator); engine styling is a question for the user (decision 4) | **Fixed**, then superseded. Retitled "(Optional) …" in this round; the orchestrator dropped the prefix in a0d7a195 once the panel marked required tasks with * (engine 9290f89f). Current titles: "Deal with the intruder in Battery Hall 1", "Find evidence of the break-in" |
| M-2 | minor | "Find the OT engineer on shift" stays open for ever when Vance is never met | **Make it optional** (orchestrator's first option): completing it any other way would tick a task the player didn't do | **Fixed.** `meet_robert_vance` is optional (titled "(Optional) Find the OT engineer on shift" in this round; back to "Find the OT engineer on shift" since a0d7a195, the panel marking optionals). The "Get Inside" aim now completes on entering the ops office, so the next aim can appear before Vance is met |
| m12 | minor | "Hall 2 opens on Vance's card" to a player with the spare | As proposed | **Fixed.** "…Hall 2 opens on any Level 1 card." |
| m13 | minor | Stale comments (globalVarOnKO emitting; the race "restarts" on reload) | As proposed | **Fixed** (three comments; no logic change) |
| m14 | minor | `agent_0x99_debrief` in the phone's `npcIds` | As proposed | **Fixed** (removed) |
| m15 | minor | Graph metadata gaps (the spare; the cloner into the workshop) | As proposed | **Fixed.** The validator now notes "2 items point to engineering_workshop", which is the point: Relay's card and the clone are both routes |
| m16 | minor | Field guide item name doesn't match the sheet | As proposed | **Fixed.** "SAFETYNET Field Guide: ProFTPD Exploitation Workflow" (title only; the sheet itself was not opened) |
| m17 | minor | A reload mid-debrief ends the mission with no credits | **Accept and log** (orchestrator) | **Accepted.** Same pattern as m03, where it was accepted; a fix would be an engine item (credits on mission conclusion). No browser check run in this session |
| M-1 | minor | Flags in with the dial unread: "Get to the ESD", then "the ESD won't arm" | **No back-to-back contradiction** (orchestrator) | **Fixed.** With the dial unread, the aim-complete text is the variant without "The trigger is in the plant room. Get to the ESD."; the dial text follows it |

New globals: `static_left_alone`, `voltage_six_cities`. New routes: `r17_never_met_vance.json` (the never-met-Vance ending: debrief and credits) and `r18_voltage_punched_static_aside.json` (Static slips out). The driver gains a `ko` step that applies the scenario's `npc_ko` mappings. r3 updated for the new arrest wording. 18 of 18 routes pass.

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 16 warnings: the earlier set, the map_the_attack handler count now 4 (the setter and three disjoint texts), and the m15 multiple-paths note. A timed-text spacing warning introduced by m2 was fixed by moving the call text to 6 s. dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0 problems (missions.json m04 globals regenerated, 85). tagdiff against HEAD: 50 structural differences, all from this round. inkcheck and loopcheck over the debrief (Vance never met; met with high trust, six cities; Vance KO'd), Voltage with Static down, and the HaX phone entry and hub after the dial: clean. Door alignment OK.

#### Spoken lines changed (old → new)

HaX, debrief:
- New (what failed): "On the network it was the same story." / "A legacy compile service left running on an OT box, trusting whatever it was sent." / "An FTP service that handed their cross-cell plan to anyone who looked. And an account on the jump server with far more privilege than its job needed." / "Old services off the OT network, and privileges somebody actually reviews." (check against SecGen by the user)
- "The paper's still in the plant room. Forensics will bag it, but I'd rather you'd read it." → "Their FTP drop already put Critical Mass and Social Fabric on the same job. The paper in the plant room would have signed it."
- "Voltage put it at six cities." → "Voltage told you six cities, in the plant room." (only when he said it; otherwise the existing "The documents name several cities.")
- "How do we handle this publicly? Vance needs to hear it too." → "How do we handle this publicly?" plus "Vance needs to hear it too." only when Vance was met.
- New: choices "[It goes in the report.]", "[Make sure the site manager gets the report.]", "[Just doing my job.]" (not-met), and "He'll get it. He'll want to know who was in his plant tonight, and why nobody told him."

HaX, phone:
- "Static's down, so he's got nobody. You can arrest him." → "Static's down, so he's got nobody. You can take him and hand him to the police."
- "With Static still up, you won't take him quietly. Put Static down and the arrest is yours." → "…Put Static down and he's yours to hand over."
- "Relay carries one. She walks Hall 2, and Hall 2 opens on Vance's card." → "…and Hall 2 opens on any Level 1 card."
- Deleted: choice "[I told him the truth about ENTROPY. He's in.]" and "Bold. If he's in, use him. He knows how they'd have moved through those systems."
- New: hub choice "[You wanted to talk about the dial reading.]".

HaX, texts:
- New: "Sixty-one on that dial? Call me when you're clear of it." (the 61°C call now opens from this text)
- New: "That reader wants a Level 1 card. Vance's is old prox: stand close while he talks and the cloner reads it. Or the spare in the security locker."
- New variant (dial unread): "Their route in, proven. They pushed the charge-ceiling override from that box, and the bypass modules hide it."

Voltage (choices): "[Step away from the bench. You're under arrest.]" → "[Step away from the bench. You're coming with me.]"; "[Hands on the bench. You're under arrest.]" → "[Hands on the bench. The police can have you.]"

Not spoken: credits "ROBERT VANCE: vindicated — his warning broke the case open" → "ROBERT VANCE: brought in — ran the desk while you ran the halls"; new "ROBERT VANCE: never met — you went round him"; new "STATIC: stood aside, and slipped out when Voltage fell"; task titles with "(Optional)" (prefix since removed, a0d7a195); the field guide's item name.

#### Open after round 1

- Browser checks: the dial text opening the call (and the hub re-offer); the Hall 2 refusal text; Static slipping out on Voltage's KO; the aims now that "Get Inside" completes without Vance.
- The user: M1's lines and R2-6 / m17 against SecGen; decision 4 (optional-task styling in the engine).
- Backlog (orchestrator): "under arrest" in m01, m02, m06.

### Phase 3 scenario design, round 2

Review: `SCENARIO_DESIGN_REVIEW_P5_R2.md` (Opus, static; 0 blockers, 0 majors, 5 minors). All five fixed as the reviewer proposes (orchestrator). The do-not-open rule held.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| n1 | minor | Round 1's Hall 2 no-card text can't fire: with the cloner but no card, the RFID minigame's "No keycards" screen never emits `door_unlock_failed` | **Fixed** (m05 pattern): keyed on `door_unlock_attempt` with `data.connectedRoom === 'battery_hall_2'`, which fires before the outcome; the condition still excludes anyone holding a Level 1 card. Same text |
| n2 | minor | "Three things let them in. Two of them let you in too." no longer matches six listed weaknesses | **Fixed** (line below) |
| n3 | minor | Static vanishes in view on the punch-down route with no line | **Fixed.** HaX text on `static_left_alone` (2 s, skipped after the shutdown) |
| n4 | minor | A player who clones Vance's card mid-meeting and walks off counts as "never met" | **Fixed.** New synced global `vance_spoken`, set by `#set_global` beside `#complete_task:meet_robert_vance` where the meeting starts. The debrief's not-met conditions and the two Vance credits use it; `vance_met` (the re-talk router) is unchanged, as are HaX's uses of it |
| n5 | minor | Vance's graph action still claims `unlocks_aim: confirm_the_lie` | **Fixed** (dropped) |

Also: the orchestrator dropped the "(Optional)" title prefixes in a0d7a195 (the panel now marks required tasks with *, engine 9290f89f). The erb comment and the round-1 log rows that quoted them are updated; the walkthrough never quoted them. Not reinstated.

Routes: new `r19_vance_left_mid_meeting.json` (clone mid-meeting, walk off: `vance_spoken` true, `vance_met` false; the debrief keeps Vance's lines and thanks; credit "never told", not "never met"). Routes that set `vance_met` by hand now also set `vance_spoken`, so they stay faithful. 19 of 19 pass.

#### Checks (static; no browser session)

Ink compiles (10 files). Validator, full: schema passed, all ink valid, doors and geometry OK; 16 warnings, the same set as round 1. dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0 problems (missions.json m04 globals regenerated, 86). tagdiff against HEAD: 25 structural differences, all from this round. inkcheck and loopcheck on the debrief (never spoken; spoken) and Vance's meeting: clean. Door alignment OK.

#### Spoken lines changed (old → new)

- HaX, debrief: "Before you write it up. Three things let them in. Two of them let you in too." → "Before you write it up. Here's what let them in. Nearly all of it let you in too."
- HaX, text, new: "Static's gone out the dock door. Let him go. The button's what matters."
- The Hall 2 no-card text is unchanged in wording (new trigger).

**Browser check of scenario design rounds 1–2 (PASS5_DESIGN_R1_BROWSER, games 2211, 2213–2216):** 8 of 10 checks pass, plus 3 minors, all now fixed or superseded:
- **F1 (orchestrator):** superseded by the round-2 n1 fix.
- **F2 (orchestrator):** the "Static's gone out the dock door" text moved from Static's mappings to HaX's, so it lands in her thread instead of showing as a toast from Static.
- **F3 (orchestrator):** the debrief said "Forty-odd on that feed" against 240,000 in the credits and documents. It now reads "Two hundred and forty thousand on that feed never knew they were on it." (spoken line, both branches).

### Phase 3 scenario design: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors |
|---|---|---|---|
| 1 (report finished by the orchestrator after a safety stop) | 0 | 1 | 17 |
| 2 | 0 | 0 | 5 |
| Browser | 0 | 0 | 3 |

Open for the user: SecGen checks S1–S7, M1's network lines, R2-6 / m17. Next: phase 4 dialogue and room dressing in parallel, then lighting, POV backgrounds and blind runs. The character stage is running.

## Phase 4: dialogue

Snapshot for `tagdiff --old`: the session scratchpad's `m04-dialogue-snapshot/ink/` (commit 504a46cc's ink).

### Phase 4 dialogue, cycle 1

Review: `DIALOGUE_REVIEW_P5_C1.md` (Opus, static plus the route driver; 0 blockers, 5 majors, 34 minors). Fixer: Opus, resumed between cycles. Every finding was checked against the ink before it was acted on. No browser session was started; the do-not-open rule held.

User decisions this cycle: D5-4 takes the reviewer's 7-line version with a player beat; D5-2/D5-3 must account for the dead crew and tie them to the unsounded alarm where that's true, without presenting any ending as a failure; accents get one or two idioms each for the guard, Cipher, Relay and Voltage; dead variables are removed, and `asked_the_number` is paid off; "Keep the crew's fingerprint kit." stays on every route (m05 depends on it).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D5-1 | major | Voltage's "not one of my people saw you come" after Static's challenge | **Fixed.** `static_stood_aside`: "And Static let you walk up to my bench. He'll explain that later."; otherwise "You got past my people." |
| D5-2 | major | Disclosure scene ignores `crew_lost` | **Fixed.** Each option has a crew-lost branch for HaX and for Vance at both trust levels; "maintenance fault" and "how close it came" don't play after deaths. One change from the review: Vance's full/≥70 line became "Good. Nobody gets to call it an accident.", because the review's "Nine of mine. People will know why." doubled his ≥80 closing "Nine of mine. I'll be telling their families myself." (seen in r9) |
| D5-3 | major | Deaths never tied to the alarm | **Fixed**, three ways, each true to the route: ally "Vance had the evacuation alarm on his desk all night."; Vance KO'd "The evacuation alarm was on Vance's desk. He was on the floor beside it."; never told "…He never knew he had a reason to use it." Stated once, then the existing "You stopped the rest of it." |
| D5-4 | major | 11-line "what failed" lecture | **Fixed** (user decision): run 1 (4 lines, plus Relay's line when it applies), then `[And the network?]` / `[So what do they fix first?]`, then the three fix-beside-weakness lines. Both choices get the same answer (a question, not a stance). Wording kept at the brief's level; "root it never needed" became "more privilege than it ever needed", because the brief describes a sudo misconfiguration, not a root account. New knot `debrief_what_failed_fixes` |
| D5-5 | major | Four lines steer to the button before it arms | **Fixed.** HaX `three_vector_confirmation`, `capture_vs_speed_guidance`, `final_phase_briefing` branch on `anomaly_detected`; Vance's `safe_disabling_guidance` branches four ways (both / attack only / dial only / neither) |
| D5-6 | minor | Climax narration reprints and claims a false dilemma | **Fixed.** First visit only (`confrontation_choice == 1`); "You cannot reach both." only when the button is on offer |
| D5-7 | minor | "three cities" vs Voltage's six | **Fixed** (city count dropped) |
| D5-8 | minor | Never-met "[Just doing my job.]" answered out of turn | **Fixed.** New knot `debrief_end_not_met_job` |
| D5-9 | minor | Vance speaks in an HQ debrief unexplained | **Fixed.** Narrator: "Vance is on the line from the Albion ops desk." HaX's "Vance needs to hear it too." cut as the same fact twice |
| D5-10 | minor | "It was still the right call." | **Fixed** (cut) |
| D5-11 | minor | "Lives first" four times | **Fixed** as proposed, except phone :751 became "Good. If he reaches for that laptop, put him down." (the lint flags "however"; "any way you have to" is the briefing's) |
| D5-12 | minor | Guard: "early" three times; "The regulator?" unprompted | **Fixed.** Narration first, then "Regulator, is it." |
| D5-13 | minor | "Inspection?" answers what wasn't said | **Fixed**, reworded to "Nobody said anything to me about a visit." (the review's version would have put "visitors" and "this hour" back in) |
| D5-14 | minor | No West Country in the guard's words | **Fixed**, two markers (user: light touch): "my lover" on his re-sighting line, "That OptiGrid lot". "Where you to, then?" not used: in Bristol it means "where are you", not "where are you going" |
| D5-15 | minor | Sight challenge replays the opener every 20 s | **Fixed.** Repeat visits: "Still need you at the desk first, my lover. Badge." (visit count; the guard's story never ends, so it's saved in full) |
| D5-16 | minor | "Never found the order" twice | **Fixed** |
| D5-17 | minor | "access to the halls" then "escorted, not carded" | **Fixed** |
| D5-18 | minor | Vance knows "eight" and "Voltage" untold | **Fixed** ("for morning", "whoever's on the other side", phone reader line reworded) |
| D5-19 | minor | Game-speak in the crew cost lines | **Fixed** face to face and on the phone (Teesside "He'll not", "you've not finished") |
| D5-20 | minor | Commit exit closes on the player's line | **Fixed.** "Go. I'll be on the desk." |
| D5-21 | minor | "The screens are lying to you." after mapping | **Fixed** |
| D5-22 | minor | "Still here." from four characters | **Fixed.** Static cycles `{&Talk.|Still watching.|From there.}`; Voltage "You came back. Nothing you say next will be new."; Vance hub "Aye?"; Vance phone "Vance." / "Vance. The hydrogen's still climbing." |
| D5-23 | minor | "Then we do this the hard way." twice | **Fixed** (Voltage's choice: "[Then I take that laptop off you.]") |
| D5-24 | minor | Bracket labels | **Fixed** ("[(Leave him be.)]", "[(Make for the inner door.)]") |
| D5-25 | minor | Blank re-entry ×5 | **Fixed** the three real ones: `guard_idle` (new local `guard_quiet`; its `#speaker` tag dropped, as on Vance's choices-only knots), `voltage_captured_end` (`voltage_quiet`, set at both arrests and on "Say nothing"), `vance_commits_choices` ("Right. What else?" after the first arrival). `voltage_escape_success` simplified to one `[(He's gone.)]` as proposed. **Withdrawn** (reviewer): `cipher_gone`, `voltage_escape_success`, both on hidden NPCs; the lint still lists them |
| D5-26 | minor | Dial named before the player has looked | **Fixed.** Vance's 20 s text and HaX's first call no longer name the dial; `first_call_end` became "Call me when you've got a real reading." so it doesn't refer to a dial nobody named. Named still in `hint_dial`, `report_progress`, `vance_priority` and the flags-in text |
| D5-27 | minor | Dead variables | **Fixed.** Removed: `task_force_null_assigned`, `mission_debriefed`, `operatives_defeated` (debrief, Vance, Voltage), `revealed_mission`, `scada_threat_confirmed`, `urgency_stage` (Vance face to face, HaX phone; still live in Vance's phone), `guard_suspicious`, `entry_method`, `handler_trust` (14 writes), `mission_priority`, `mission_briefed`, `guidance_provided`; Voltage's unread "fought"/"arrested" writes. `asked_the_number` paid off (D5-32) |
| D5-28 | minor | "Your flags are landing." | **Fixed** |
| D5-29 | minor | Choice repeats HaX's line | **Fixed** ("[Where do I start on it?]") |
| D5-30 | minor | Stock sign-off | **Fixed** (see D5-26 for the wording) |
| D5-31 | minor | List in `final_phase_briefing` | **Fixed** |
| D5-32 | minor | Voltage stances never remembered | **Fixed.** New synced globals `promised_voltage_alive` (briefing "[Stop the trigger, and bring Voltage in alive if I can.]", HaX phone "[Understood. I'll try to take him alive.]") and `asked_the_number` (Voltage). Debrief: captured "The same one he gave you when you asked, to the decimal." / "You said you'd bring him in breathing. You did."; gone "You got his number out of him, at least. It goes in the file next to Blackout's signature." / (escaped) "You wanted him alive, and you chose the button. I'd have chosen the same." Both globals added to `globalVariables` and to `missions.json` |
| D5-33 | minor | "a gas monitor nobody read" | **Fixed** (in the shortened line, so it stays under the 30-word cap) |
| D5-34 | minor | "Thorough." echoes Voltage | **Fixed** |
| D5-35 | minor | "You picked the wrong facility." | **Fixed**, as "Wrong night to come looking.": the review's "Wrong night to be a regulator" doesn't fit, because neither route into that line has Cipher hear "regulator" (the player claims a thermal survey, or says nothing about a cover) |
| D5-36 | minor | Stock aphorism | **Fixed** ("Ja. They all say that on the way in.", Voltage's accent marker) |
| D5-37 | minor | "God. What have I done?" | **Fixed** |
| D5-38 | minor | "Stability, bought with silence." | **Fixed** (cut) |
| D5-39 | minor | Untrue "Rush it" line | **Fixed** |

Also from the review's voice notes: Cipher "Verdomme." (one Dutch marker) and the trimmed opener narration; Relay "Aye. Easy." and "No. But you're here, and that's enough."; Voltage "six cities lined up"; HaX briefing's echo of Netherton replaced (the review's own line would have repeated "This lot don't want paying" two lines up); the phone hints that quoted texts word for word now vary ("living thumb", "Picks and cloner"); Vance phone says "the one thing they couldn't touch" once, and the post-shutdown news is varied across opener, "How bad is it?" and priority; the debrief has one sign-off. Cut "First, one more decision." (padding; the run before the disclosure choice was 9–10 lines on crew-lost routes, now at most 9).

Accent markers, all told (user: light touch): guard "my lover", "that OptiGrid lot"; Cipher "Verdomme"; Relay "Aye"; Voltage "Ja". Vance already had his and gains "He'll not", "you've not finished" and "Aye?" from the fixes above.

#### Routes

Updated for changed text and picks: r1, r2, r3, r4, r5, r6, r8, r9, r11, r12, r16, r17, r18, r19 (the debrief's new network beat, Voltage's and the guard's renamed choices, "Where do I start on it?", and expectations that quoted old lines). New:
- `r20_crew_lost_partial_promise_captured.json`: briefing promise, ally at trust 60, crew lost, number asked, arrest, partial disclosure.
- `r21_crew_lost_quiet_button_phone_promise.json`: HaX's phone promise with the dial read (D5-5 "press it" branch), crew lost, Static aside (D5-1), number asked, button, quiet disclosure at trust 90.
- `r22_crew_lost_full_cover_held.json`: cover never dropped, trust 30, crew lost, Voltage punched, full disclosure ("never knew he had a reason").
- `r23_crew_lost_partial_high_quiet_low.json`: attack mapped before the dial (HaX and Vance say the button won't arm), crew lost, partial at 75, then a page reload of the debrief at 40 with quiet.
- `r24_resight_and_standoff_return.json`: the guard's second sighting and idle re-entry, Vance's commit exit line, Voltage's narration not replaying after a back-off, his captured re-entry line.

24 of 24 routes: all expectations met. Longest run without a choice: 9 (debrief, outcome recap before the disclosure choice), down from 11.

#### Checks (static; no browser session)

- Ink compiles (10 files, 0 failed, no loose ends; END warnings on the debrief, Voltage and briefing as before).
- Validator with ink, `--no-graph`: schema passed, all ink valid, geometry and doors OK; the same 16 warnings and suggestions as before.
- dialoguelint: 0 errors, 0 warnings; 2 blank-reentry checks, both withdrawn above.
- reopencheck: 0 problems for both m04 phones (1800 reopens each).
- tagdiff `--old` against the snapshot: Cipher, Relay and Static structure unchanged; debrief 58, Voltage 20, briefing 19, guard 15, Vance 6, HaX phone 8, Vance phone 8 differences. Every one is listed in the table above: removed dead VARs and their writes; the new knots `debrief_what_failed_fixes` and `debrief_end_not_met_job`; the crew-lost and stance conditions; the `#set_global` tags for the two new globals; the quiet flags and visit-count conditions; the `#speaker` tag dropped from `guard_idle`; `voltage_escape_success` reduced to one choice.
- inkcheck (debrief, Voltage, Vance, guard, briefing, both phones) and loopcheck over 29 states (crew lost with Vance ally / KO'd / not told; captured and escaped with both stances; Voltage with Static aside, Static down, captured, escaped, after the race; Vance ally with and without the attack mapped; guard at the sight knot and admitted; HaX before and after the dial; Vance phone with `urgency_stage` 3 and after the shutdown): clean.

#### Spoken lines changed (old → new)

No m04 audio exists yet; listed for the record. Choice text isn't voiced.

HaX, debrief:
- Cut: "Lives over one operative, every time."
- New: "The same one he gave you when you asked, to the decimal." / "You said you'd bring him in breathing. You did." / "You got his number out of him, at least. It goes in the file next to Blackout's signature." / "You wanted him alive, and you chose the button. I'd have chosen the same."
- "And the control room believed its own sensors. The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read." → "And the control room believed its own sensors. The honest ones weren't on the bus: a dial on a wall, and a gas monitor off their network."
- Cut: "On the network it was the same story." / "A legacy compile service left running on an OT box, trusting whatever it was sent." / "An FTP service that handed their cross-cell plan to anyone who looked. And an account on the jump server with far more privilege than its job needed." / "Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger." / "A temperature gauge in every hall that isn't on the bus, and somebody reading it." / "Old services off the OT network, and privileges somebody actually reviews."
- New: "A legacy compile service on an OT box, trusting whatever it was sent. That comes off the network." / "An FTP service handing their cross-cell plan to anyone who looked, and a jump-server account with more privilege than it ever needed. Somebody reviews those." / "Encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads."
- "Social Fabric had disinformation ready in three cities, to turn the fire into a panic." → "Social Fabric had disinformation ready to turn the fire into a panic."
- Cut: "First, one more decision."
- New (crew lost): "Vance had the evacuation alarm on his desk all night." / "The evacuation alarm was on Vance's desk. He was on the floor beside it." / "The evacuation alarm was on Vance's desk. He never knew he had a reason to use it."
- "And Vance's alarm had the night crew out before the button went in. It started your clock early. It was still the right call." → "…It started your clock early."
- Cut: "Vance needs to hear it too."
- "We classify it. A maintenance fault, resolved. Albion patches the holes quietly." kept; new crew-lost variant "We classify what we can. Nine deaths don't go in a drawer, so it's an industrial accident, cause under investigation."
- "Nobody hears how close this came. Albion's name survives, the upgrades happen, and nothing makes the rest of the sector move. Stability, bought with silence." → "…nothing makes the rest of the sector move."; new crew-lost variant "Nine families get an accident report. Albion's name survives, the upgrades happen, and nothing makes the rest of the sector move."
- New crew-lost variants: "An incident, nine dead, cause withheld. The coroner will want more than that, and get it." / "People hear that nine died in an incident, not why. Enough to push some change, not enough to start a panic."
- New: "Then do it again. And somebody should tell Vance you were there."
- Cut: "Get some rest."
- "All three of his crew down. Thorough." → "All three of his crew on the floor. Remind me not to annoy you."

Narrator, debrief: new "Vance is on the line from the Albion ops desk."

Vance, debrief (new crew-lost variants): "Good. Nobody gets to call it an accident." / "There'll be hell to pay for this place. There should be." / "Accident. I'll sign it. I'll not pretend I like it." / "An accident. Aye. That's what the inquiry will call it." / "Something, not everything. I'll answer the rest at the inquest." / "Upstairs will like that. The inquest won't."

Voltage:
- "*not looking up from the laptop* Still here." + "Nothing you say next will be new." → "*not looking up* You came back. Nothing you say next will be new."
- "And not one of my people saw you come." → "And Static let you walk up to my bench. He'll explain that later." / "You got past my people."
- "Bold. Conviction never stopped an attack." → "Ja. They all say that on the way in."
- "This site is one test run. The Architect has six cities on the go." → "…six cities lined up."
- New: "*flat* Still counting?" / "*flat* You've got me. You haven't got him." (cycle)
- Narrator, plant room: first visit only; a variant without "You cannot reach both." when the button isn't on offer. Cut (unreachable): "The loading bay is empty and cold. A vehicle was here. It isn't now." / "The red mushroom head is still on the wall behind you, and the racks are still climbing."

Robert Vance, face to face:
- "Staff records, maintenance logs, access to the halls. Whatever it takes." → "Staff records, maintenance logs, whatever you need off this desk."
- "Cards and an order number. I never found the order behind it. What's your concern?" → "They didn't want an escort, either. What's your concern?"
- Hub cycle "Still here." → "Aye?"
- "The screens are lying to you. I've the hydrogen readout from the vent controller up here. It's off their network, and it's climbing." → "You know what they did. My hydrogen readout's still climbing."
- "Whoever's in my plant room hears it too. But your clock's already running, so it costs you nothing now but surprise." → "Whoever's in my plant room hears it too. Your clock's running anyway. All it costs you now is surprise."
- "Whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe, and your workshop job isn't done." → "Whoever's in my plant room hears it too. He'll not wait for morning. Half an hour, maybe, and you've not finished in the workshop."
- "With Voltage on the other side? And somebody has to stay on this desk." → "With whoever's on the other side? And somebody has to stay on this desk."
- "Credentials, background checks, all of it. God. What have I done?" → "Credentials, background checks, the lot. I never rang the firm."
- New: "Right. What else?" / "Go. I'll be on the desk."

Robert Vance, phone:
- "Still here. Still watching the hydrogen climb." → "Vance. The hydrogen's still climbing."; "Still here." → "Vance."
- "I can't leave the desk. Voltage is through there, and somebody has to watch the hydrogen." → "I can't leave the desk. Somebody has to watch the hydrogen, and I don't know who's through there."
- "The one thing they can't reach is the hardwired shutdown in the plant room." → "What they can't reach is the hardwired shutdown in the plant room."
- "The shutdown button in the plant room is hardwired. Straight to the bank isolators, no network in the middle. The one thing they couldn't touch." → "…no network in the middle."
- "Get to it and press it. That's the mission." → "Get to it and press it." / "It won't arm until grid control has a real reading. The dial in Hall 1." / "It won't arm until grid control knows how they did it. That's the workshop." / "It won't arm until grid control believes you. Prove the screens wrong, then prove how."
- "Steady, though. Rush it and you trip the very thing you're stopping." → "Steady, though. Watch the hydrogen panel in Hall 2 on your way."
- "You've done it. Banks isolated, vents at full. Go and see what they left behind." → "Go and see what they left behind. I'll watch the banks."
- "Whoever's in my plant room hears it too. But your clock's already running, so it costs you nothing now but surprise." → "Whoever's in my plant room hears it too. Your clock's running anyway. All it costs you now is surprise."
- "And whoever's in my plant room hears it too. He won't wait for eight." / "You'll have half an hour, maybe, and your workshop job isn't done." → "And whoever's in my plant room hears it too. He'll not wait for morning." / "Half an hour, maybe, and you've not finished in the workshop."
- "It's over. Banks isolated, vents at full, and the hydrogen's falling." → "Not any more. The cells are cooling."

HaX, phone:
- "You've got his print. Use it on the reader. It can't tell a lift from a living thumb." → "You've got his print. Put it on the reader in Hall 2. That's all it checks for."
- "Picks and cloner won't touch a fingerprint reader. The crew beat it on the ninth with their own kit." → "That reader wants a finger, not a card. The crew beat it on the ninth with their own kit."
- "First, prove the screens are lying. There's an old dial thermometer in Battery Hall 1." → "First, prove the screens are lying. Something in Battery Hall 1 that isn't on their feed."
- "Stay sharp. If anyone comes at you, defend yourself. Call if you need me." → "Call me when you've got a real reading."
- "Your flags are landing. Grid control can see it too." → "Your flags are in. Grid control can see it too."
- New (dial unread): "It won't arm till grid control has a real reading. The dial in Hall 1 first." / "Go for the button and he's out the dock and gone. And it won't arm till grid control has a real reading." / "The button won't arm till grid control has a real reading. The dial in Hall 1 first."
- "Good. But if he reaches for that trigger, stop him any way you have to. Lives first." → "Good. If he reaches for that laptop, put him down."
- "Right priorities. If he runs but the attack fails, that's still a win." → "Copy. Then the button's your job and he's a bonus."
- "Last stretch. In the plant room:" / "Deal with Voltage and anyone still standing with him." / "Keep him off that laptop." / "Then the hardwired shutdown button. Press it." → "Last stretch. Keep him off that laptop and put down anyone standing with him." / "Then the button." (or the not-armed line above)

HaX, briefing: "They break the things people live on, and they mean to." → "They want the lights out, and they've done the sums."

Security Guard:
- New (repeat sighting): "Still need you at the desk first, my lover. Badge."
- "The regulator? This early?" → "Regulator, is it." (after the narration)
- "Alright, sign in here. Mr Vance said there was an audit today. Didn't say it'd be this early. He's not happy about it, fair warning." → "Alright, sign in here. Mr Vance said there was an audit today. He's not happy about it, fair warning."
- "Inspection? Nobody told me it'd be at this hour." → "Nobody said anything to me about a visit."
- "Quiet. That OptiGrid crew came through late on the ninth…" → "Quiet. That OptiGrid lot came through late on the ninth…"
- New: "Still about?" / "Need something?" / "You again." (cycle)

Cipher: Narrator "He's halfway up the rack row, a handset already half out of its clip." → "He's up the rack row, a handset already half out of its clip."; "That panel's amber. That panel is not supposed to be amber." → "Verdomme. That panel's amber. That panel is not supposed to be amber."; "You picked the wrong facility." → "Wrong night to come looking."

Relay: "Easy." → "Aye. Easy."; "No. You're really not." → "No. But you're here, and that's enough."

Static: "I'm still here." → "Talk." / "Still watching." / "From there." (cycle)

Not voiced (texts and choices): Vance's 20 s text "It's Vance. Every screen I've got says twenty-eight, and I don't believe one of them. There's an old dial on the Rack Bank C wall in Hall 1. Read it." → "Every screen I've got says twenty-eight, and I don't believe one of them. Anything in Hall 1 older than the network, read it."; choices "[And the network?]", "[So what do they fix first?]", "[Then I take that laptop off you.]", "[Where do I start on it?]", "[(Make for the inner door.)]", "[(Leave him be.)]", "[(He's gone.)]".

#### Open after cycle 1

- Browser checks: the guard's repeat sighting on the 20 s cooldown; the Narrator line and Vance's portrait on the HQ debrief background; Voltage's narration not replaying after a back-off; the two new globals syncing from the briefing and the phone.
- The user: the debrief's network lines against SecGen (unchanged in substance, still at the brief's level).
- Watch in cycle 2: HaX's first call no longer names the dial (D5-26), so a player who never asks for a hint relies on the HMI clue and Vance's vaguer text; `hint_dial` and "Where do I stand?" still name it.

### Phase 4 dialogue, cycle 2

Review: `DIALOGUE_REVIEW_P5_C2.md` (Opus, static plus the route driver; 0 blockers, 2 majors, 19 minors; it confirmed all 39 cycle-1 findings closed). Same fixer, resumed. Every finding was checked against the ink first; none withdrawn. The erb regions were re-read after b37b6e3f (sprite wiring) before the one erb edit. No browser session; the do-not-open rule held.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D6-1 | major | Crew deaths first mentioned ~25 lines into the debrief | **Fixed.** `debrief_people` (both openers pass through it near the top) now says "The night crew were still in Hall 2 when Bank B went. Nine of them." on crew-lost routes where Vance's ≥70 line doesn't already say it. "A shame…" becomes "He's out of reach. For now." on crew-lost routes. The later line is a recap ("Nine in Hall 2. Two more…"). Follow-on: the opener's "It could have been the whole hall. It wasn't." drops "It wasn't." on crew-lost routes, where the next line names the nine (seen reading r22 end to end) |
| D6-2 | major | Vance's goodbye forgets the dead below trust 80 | **Fixed** as proposed. ≥80 skips "Thank you." when the crew is lost; 50–79 "The hall's standing. Nine of mine aren't." / "I'll not forget either."; below 50 "Nobody told me what was in my own plant. Nine of mine paid for that." |
| D6-3 | minor | "to the decimal" misquotes Voltage | **Fixed** |
| D6-4 | minor | "crew on the floor" quips after Vance's dead | **Fixed.** Gated on `not crew_lost`, and "operatives" for "crew" |
| D6-5 | minor | "accident" ×3, "nine … incident" ×2 | **Fixed** |
| D6-6 | minor | No turn into the on-site fixes | **Fixed** ("And on site: …") |
| D6-7 | minor | Gate-first players lose HaX's Hall 1 pointer | **Fixed** in the gate reply, text only |
| D6-8 | minor | Briefing objectives omit the reading | **Fixed** |
| D6-9 | minor | Arrest choices quote "countersigned" unheard | **Fixed** |
| D6-10 | minor | "I told you the number" on routes where he didn't | **Fixed** (visit-count branch with a fallback that's true after a reload) |
| D6-11 | minor | Relay shares Vance's "Aye" | **Fixed** ("Nae bother.") |
| D6-12 | minor | Guard's Bristol marker only on re-sighting | **Fixed.** "Go on through, my lover." on every admission; the re-sighting line keeps its "my lover" too (a player hears both only after being challenged twice) |
| D6-13 | minor | Guard contradicts himself on visit/audit | **Fixed** |
| D6-14 | minor | Text and hub choice say the same thing | **Fixed** (erb text) |
| D6-15 | minor | "laptop … put down" twice in a row | **Fixed** |
| D6-16 | minor | Vance's dead "few more questions" choice | **Fixed** (crew breadcrumb on the cover route) |
| D6-17 | minor | "Credentials … the lot" reads as his checks | **Fixed** |
| D6-18 | minor | Stock lines | **Fixed** as proposed (Voltage's entrance, debrief :154/:273/:290, phone "Good.", the workshop line, the 240,000 closer, Vance's "no time to waste") |
| D6-19 | minor | "It won't be eleven either." | **Fixed** ("It could have been fifty.") |
| D6-20 | minor | Netherton's image; "none of them cornered" | **Fixed** |
| D6-21 | minor | Filler count and confidence lines | **Fixed.** Count lines cut; one two-way closer |

Before cutting, grepped m05–m08 for the changed lines: nothing later depends on them ("Keep the crew's fingerprint kit." untouched).

#### Routes

Updated for changed text and picks: r3, r6, r20, r21, r22, r24 (Voltage's arrest choices, the crew-lost recap, the disclosure and goodbye lines). r20 and r21 now also assert the D6-1/D6-2/D6-4 lines and their absences ("You did right by this place", "A shame", "Robert Vance: Thank you.", the operative quips). New `r25_cover_held_gate_call_no_hints.json` (the review's request): briefing objectives with the reading, phone opened at the gate (Hall 1 pointer, no dial named), the guard's "my lover" on a first admission, Vance met on the cover with the crew breadcrumb, the hub never naming the dial unasked. 25 of 25 routes: all expectations met. Longest run without a choice: 9 (debrief), unchanged.

#### Checks (static; no browser session)

- Ink compiles (10 files, 0 failed, no loose ends).
- Validator with ink, `--no-graph`: schema passed, all ink valid; 12 issues and suggestions (down from 16 after the sprite wiring in b37b6e3f).
- dialoguelint: 0 errors, 0 warnings; the 2 withdrawn blank-reentry checks.
- reopencheck: 0 problems for both m04 phones.
- tagdiff against HEAD (cycle 1 committed): debrief 11 (the crew-lost conditions in `debrief_attack_stopped`, `debrief_people`, `debrief_voltage_status`, `disclosure_outcome`, `mission_complete`), Voltage 2 (`voltage_captured_end` branch), HaX phone 6 (the count and confidence conditions cut, one `else`); the other seven files structurally unchanged. Against the snapshot: debrief 69, Voltage 22, briefing 19, guard 15, HaX phone 14, Vance phone 8, Vance 6, Cipher/Relay/Static unchanged (cycle 1 plus the above).
- inkcheck and loopcheck over 14 states (crew-lost debrief at trust 30, 60 and 90; Voltage fresh, captured, arrest with the print; guard; Vance; Relay; briefing; HaX phone before and after the dial): clean.

#### Spoken lines changed (old → new)

No m04 audio exists yet; listed for the record.

HaX, debrief:
- New (crew lost, top): "The night crew were still in Hall 2 when Bank B went. Nine of them."
- New (crew lost, Voltage gone): "He's out of reach. For now." in place of "A shame. But the attack's stopped, and that was the job."
- New variant (crew lost): "Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall." (without "It wasn't.")
- "He'll talk. Men like him always want to explain themselves." → "He'll talk. He wants someone to check his sums."
- "The same one he gave you when you asked, to the decimal." → "To the decimal this time. You only got "forty-odd"."
- "Encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads." → "And on site: encrypted cards, …"
- Cut: "None of this was random."
- "This site was a rehearsal. The real thing is bigger, and it's coming." → "This site was a rehearsal."
- "Nine on the night crew in Hall 2. Two more on the feed before the grid caught up." → "Nine in Hall 2. Two more on the feed before the grid caught up."
- "…The number tomorrow won't be zero. It won't be eleven either." → "…The number tomorrow won't be zero. It could have been fifty."
- "Nine families get an accident report. Albion's name survives…" → "Nine families get a report with no cause in it. Albion's name survives…"
- "People hear that nine died in an incident, not why. Enough to push some change, not enough to start a panic." → "People hear the number, not the reason. Enough to push some change, not enough to start a panic."
- "All three of his crew on the floor. Remind me not to annoy you." → "All three of his operatives on the floor. Remind me not to annoy you." (not on crew-lost routes)
- "And not one of his crew on the floor. Harder than it looks." → "And not one of his operatives on the floor. Harder than it looks." (not on crew-lost routes)

Vance, debrief: "Thank you." no longer plays when the crew is lost; new "The hall's standing. Nine of mine aren't." / "I'll not forget either." / "Nobody told me what was in my own plant. Nine of mine paid for that."

Voltage: "So they sent someone." → "One of you. I'd budgeted for more."; new fallback "Read the casualty model on that bench. It's the only honest document in the building." (when he never stated the number).

Robert Vance: "Make it quick. I've got a plant to run." → "Make it quick. Three banks, nine on the module swap in Hall 2, and one of me."; "Credentials, background checks, the lot. I never rang the firm." → "They had credentials, background checks, the lot. I never once rang the firm."; "Right. Then there's no time to waste." → "Right. Then I'd best stop sitting here."

HaX, phone:
- "Then the badge. Routine audit, came early. Call me once you're past him." → "Then the badge. Routine audit, came early. Once you're past him: Vance, then something in Hall 1 that isn't on their feed."
- "Good. Scan what's on that network first, then see what each box is running." → "Scan what's on that network first, then see what each box is running."
- "Watch your back. They won't hesitate." → "They'll know someone's opened the workshop. Keep an eye on the door."
- "Last stretch. Keep him off that laptop and put down anyone standing with him." → "Last stretch. Anyone still standing with him goes down first."
- Cut: "Two of them down already. You're almost there." / "One down. The rest won't make it easy." / "Their people are still up. Be ready." / "Good so far. Stay sharp for the last of it." / "Two hundred and forty thousand people are on that grid."

Briefing: Netherton "Now they break the things people stand under." → "Now they break the things people can't live without."; HaX "…and none of them cornered." → "…and none of them amateurs."; "Press it and the banks isolate." → "Press it and the banks isolate, once grid control believes you. That's what Nightshade's reading is for."

Security Guard: "Go on through. Operations office is straight down the hall." → "Go on through, my lover. Operations office is straight down the hall."; "Nobody said anything to me about a visit." → "A visit? I've an audit on my list, not a visit."

Relay: "Aye. Easy." → "Nae bother."

Not voiced: HaX text "He's going for the laptop. Drop him." → "Fight's on. Don't let him reach that bench."; Voltage's arrest choices "[Your thumb's on the bypass module. Blackout signed, you countersigned. Tell that to a court.]" → "[Your thumb's on the bypass module. Explain that to a court.]" and "[Blackout signed it. You countersigned. Tell that to a court.]" → "[It's over. You can explain your sums to a court.]".

#### Open after cycle 2

- Browser check (cycle 1's four items plus Vance's new goodbyes, the top-of-debrief nine line on both openers, and the gate reply).
- The user: the debrief's network lines and "status page" (erb:980) against SecGen.
- Cycle 3 per the review: confirm D6-1 to D6-21 and re-read r20–r23 and r25 end to end.

### Phase 4 dialogue, cycle 3

Review: `DIALOGUE_REVIEW_P5_C3.md` (Opus, static plus the route driver and a scratch run of the Voltage-first opener; 0 blockers, 1 major, 20 minors; cycle 2's 21 confirmed). Same fixer. All 21 fixed as proposed after checking each against the ink; none withdrawn. Orchestrator addition: the kit line reworded so "crew" can't read as the dead night crew. No erb edit this cycle. No browser session; the do-not-open rule held.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D7-1 | major | Voltage-first opener: 14 bubbles with no choice on a thorough run; "proof" said twice | **Fixed.** The same player beat after `debrief_people` on that opener (new sticky choice, `+ -> debrief_intelligence_gathered`); the "proof we've been chasing" line folded into the documents line. r26: longest run 9 |
| D7-2 | minor | Bank B named four or five times on the first opener | **Fixed.** The recap is gated `{not debrief_attack_stopped: …}` (visit count: plays only on the Voltage-first opener) |
| D7-3 | minor | "won't be zero" after the number | **Fixed** |
| D7-4 | minor | "turn the fire" on routes with no fire | **Fixed** |
| D7-5 | minor | "run start to finish" | **Fixed** |
| D7-6 | minor | "Relay too" with no Vance clone | **Fixed** (fixed-string inline conditional) |
| D7-7 | minor | The player's last words on crew-lost routes | **Fixed** (bracket conditionals; replies unchanged) |
| D7-8 | minor | "[What did we get out of there?]" after "Nine of them." | **Fixed**, on both openers |
| D7-9 | minor | "Good." before the nine | **Fixed** |
| D7-10 | minor | "talking than down" (a KO is the capture) | **Fixed** |
| D7-11 | minor | "your call" four times | **Fixed** |
| D7-12 | minor | Voltage "watching the red button" | **Fixed** |
| D7-13 | minor | Arrest choice repeats "It's over" | **Fixed** |
| D7-14 | minor | "here two days" vs three | **Fixed** |
| D7-15 | minor | "SCADA side" twice; stock line | **Fixed** |
| D7-16 | minor | Vance asks then talks over the answer | **Fixed** |
| D7-17 | minor | "Make it quick." twice via the hub cycle | **Fixed** |
| D7-18 | minor | "can live with that" twice | **Fixed** |
| D7-19 | minor | Vance repeats the cards/order fact | **Fixed** |
| D7-20 | minor | Two flat lines | **Fixed** |
| D7-21 | minor | No route on the Voltage-first opener or with every optional flag | **Fixed** (r26, r27) |
| (orch.) | — | "Keep the crew's fingerprint kit." now follows the nine dead | **Fixed:** "Keep the OptiGrid print kit. Forensics can have the case it came in." Still unconditional on every route. m05's briefing depends on the player having brought a print kit back from Albion (`m05_insider_trading_opening.ink:218`, "the print kit you brought back from Albion"); the new line keeps that and matches its "print kit" wording |

#### Routes

- `route.js`: new step `{"maxRun": N}` asserts the longest run without a choice so far (documented in its header).
- New `r26_voltage_first_opener_all_flags.json` (Voltage-first, every optional debrief flag, crew lost, Voltage taken) and `r27_first_opener_all_flags.json` (first opener, same flags). Both assert `maxRun` 9 (each reaches exactly 9), the new beat, the folded proof line, the kit line, and that Bank B is recapped on r26 and not on r27.
- Updated: crew-lost routes now pick the new bracket texts (r2, r6, r9, r20–r23); "check your sums" (r3, r20, r24); the kit line (r20, r21); r17 also asserts "You did it to Relay, while she was talking" (no "too") and the new Social Fabric line.
- 27 of 27: all expectations met.

#### Checks (static; no browser session)

- Ink compiles (10 files, 0 failed, no loose ends).
- Validator with ink, `--no-graph`: schema passed, all ink valid, 12 issues and suggestions (unchanged).
- dialoguelint: 0 errors, 0 warnings; the 2 withdrawn blank-reentry checks.
- reopencheck: 0 problems for both phones.
- tagdiff against HEAD: debrief 10 (the new sticky choice in `debrief_voltage_status` and its `crew_lost` bracket condition; the `crew_lost` conditions for D7-8/D7-9 and D7-7's two closing brackets; the `vance_card_cloned` inline condition; the `not debrief_attack_stopped` gate; the removed "proof" condition). Every other file is structurally unchanged (line edits only). Against the snapshot: debrief 79, Voltage 22, briefing 19, guard 15, HaX phone 14, Vance phone 8, Vance 6, Cipher/Relay/Static unchanged.
- inkcheck and loopcheck: debrief (clean; crew lost at 30 and 90; trigger vent), Voltage (Static down; captured), Vance, HaX phone after the dial. All clean.

#### Spoken lines changed (old → new)

No m04 audio exists yet; listed for the record.

HaX, debrief:
- "Good. Nobody else in that building knows the chain above Blackout." → on crew-lost routes "In custody. Nobody else in that building knows the chain above Blackout." (unchanged otherwise)
- Cut: "The intelligence you brought out is the proof we've been chasing since the Zero Day job."
- "The documents show Critical Mass and Social Fabric coordinating the one attack, in their own handwriting." → "…in their own handwriting. That's the proof we've chased since Zero Day."
- "Keep the crew's fingerprint kit. Forensics can have the case." → "Keep the OptiGrid print kit. Forensics can have the case it came in."
- "You did it to Relay too, while she was talking." → "You did it to Relay, while she was talking." when Vance's card wasn't cloned
- "Social Fabric had disinformation ready to turn the fire into a panic." → "Social Fabric had disinformation queued for the morning, ready to turn a fire into a panic."
- "We've just watched one of his strikes run start to finish. Now we know how the cells fit together." → "We've just watched one of his strikes from the inside. Now we know how the cells fit together."
- "Four missions now, and you're still standing. The last of them nearly didn't go that way." → "…Tonight nearly went the other way."
- "The banks are isolated, but Bank B went before you got to the button." / "…he got to the laptop before you got to him, and Bank B went with it." → now Voltage-first opener only
- "You stopped the rest of it. Hold on to that, because the number you read tomorrow won't be zero." → "You stopped the rest of it. Hold on to that when the names come out tomorrow."
- "Netherton can live with that." → "Netherton will sign off on it."

Voltage: Narrator "He sits against the bench with his wrists zipped, watching the red button he never reached." → "…watching the laptop he'll never touch again."

Robert Vance:
- "Staff records? Fine. But tell me what you're after." / "We've nothing to hide." → "Staff records? Fine. We've nothing to hide."
- "Three of them, here two days. Network work and SCADA optimisation, they said." → "Three of them, in and out since the ninth. Network work and SCADA optimisation, they said."
- "This place is my responsibility. People depend on it." → "This place is mine to answer for. I'd rather hear it from you than from the fire brigade."
- "Make it quick. Three banks, nine on the module swap in Hall 2, and one of me." → "Quickly, then. Three banks, nine on the module swap in Hall 2, and one of me."
- "I let them in. Their cards worked and I didn't chase the order." → "I let them in. I signed them through myself."
- Cut: "Not on my site. We're stopping this."
- "Come back to the ops desk when you need the SCADA side, and I'm on comms while you move." → "Come back to the ops desk when you need it, and I'm on comms while you move."

HaX, phone: "Listen. Voltage is worth more to us talking than down." → "Listen. Voltage is worth more to us in a cell than in the wind."; "You'll see it better than I will. Make the call there." → "You'll see it better than I will."; "That's the approach. Work with what you find." → "Good."

Not voiced (choices): new "[Nine. Tell me we came out with something.]" (crew lost, both openers); "[What did we get out of there?]" now also on the Voltage-first opener; "[I'm sorry about your people, Mr Vance.]" and "[It's all going in the report. Every line.]" on crew-lost routes; Voltage "[It's over. You can explain your sums to a court.]" → "[Hands where I can see them. A court can check your sums.]".

#### Open after cycle 3

- The browser check that closes the phase: cycle 1's four items (guard re-sighting, the HQ-background narrator line, Voltage's narration after a back-off, the two new globals syncing); cycle 2's Vance goodbyes, the top-of-debrief nine line on both openers and HaX's gate reply; this cycle's beat on the Voltage-first opener and the crew-lost bracket choices (inline conditionals in choice text).
- The user: the debrief's network lines and "status page" (erb:981) against SecGen.

**Browser check of dialogue cycles 1–3 (PASS5_DIALOGUE_C2_BROWSER, games 2224, 2226, 2229):** all 6 dialogue checks pass, with 0 blockers, 0 majors and 4 minors.
- **F1:** the on-site conversation backgrounds are still placeholders. This goes to the POV-background stage.
- **F2:** Vance's chat showed a walk-sprite bust on black in the seeded game 2229. His wiring is correct (`spriteTalk` and `spriteVisemes` are set), so this is probably an artefact of the seeded game. The blind run will check it.
- **F3:** the short briefing route never offers the promise. This is by design.
- **F4 (orchestrator):** Relay's "Nae bother." after "Radio. Down. Now." changes to "Keep the heid. It's staying where it is." (spoken line).

### Phase 4 dialogue: CLOSED (2026-10-13)

| Cycle | Blockers | Majors | Minors |
|---|---|---|---|
| 1 | 0 | 5 | 34 |
| 2 | 0 | 2 | 19 |
| 3 | 0 | 1 | 20 |
| Browser | 0 | 0 | 4 |

The reviewer judged that a fourth review cycle wasn't needed once the cycle-3 fixes landed. 27 routes. Still open for the user: the debrief's network lines and "status page" (erb ~981), both waiting on the SecGen check.

**Open item from m05's review (2026-10-13):** HaX's first-call choices have no guard, so a first call left unanswered keeps the hub (with "Bring me in") hidden until the player answers. m04 has the same shape. Fix in m04's playtest stage: put an outcome guard at the top of the first-call choices knot that sends a player who's already past the first step to the hub.


### Phase art: room dressing CLOSED (2026-10-13)

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| 1 (survey; Hall 1 first-room sign-off) | 2 | 10 | 1 |
| 2 (Hall 1, user: too empty) | 0 | 2 | 1 |
| 3 (review) | 0 | 4 | 10 |
| 4 | fixes for cycle 3 (all nine rooms on the Albion treatment) | | |
| 5 (review + interaction walk, game 2230) | 0 | 6 | 10 |
| 6 (review) | 0 | 2 | 5 |
| 7 (review + re-walk, games 2238/2239; guard tap re-check, game 2245) | 0 | 1 | 11 |

Cycle 7's major (the gate guard's tap area against the reception papers) is fixed and confirmed in game 2245: his challenge fires on its own from spawn, and each paper and his head open with one tap. The leftover minors are logged in ROOM_DRESSING.md cycle 7. Orchestrator text fixes after the close: the guard's sighting narration is now "The guard looks up from the desk and gets to his feet." (the player spawns inside the room), and the tool case is now "by the bench" / "against the end of the bench". Next: lighting (the new ESD sprite needs its own emitter), then POV backgrounds.

### Phase art: lighting CLOSED (2026-10-13)

Skill `mission-room-lighting`; log and evidence in `LIGHTING_PLAN.md` and `build_evidence/lighting_c1/`-`lighting_c4/`. A night shift (`#b8bfce`) that tightens by phase: clock (halls and plant a step darker), alarm (white hall strobes, red call points, SCADA fire panel, dock beacon), H2 (Hall 2 detector and racks red), vent (fire on bank B), ESD armed (red pulse on the keep-clear box), after (alarms off, ESD green; COSTLY SUCCESS keeps amber LEDs and embers). Every glow follows its own global, so each route lights correctly. Motion rooms: security, workshop, dock (the dock's tube faulty). No NPC torches (all patrollers stand in lit rooms). No engine change.

| Cycle | Blocker | Major | Minor |
|---|---|---|---|
| Design review | 0 | 6 | 9 |
| 1 | 0 | 4 | 6 |
| 2 | 0 | 1 | 6 |
| 3 | 0 | 0 | 5 |
| 4 | 0 | 0 | 2 |

Checks after every implement: validator, door alignment 8/8, route driver 27/27, `lighting-tour.sh --check` on :3001 (games 2249-2295). Engine proposals (not done): `fire` effect, hue-preserving `above` glows, a validator check for `||` in conditions (unsupported by `evaluateGlobalCondition`).

### Post-close fix: first-call hub guard

Orchestrator request: HaX's `first_call_choices` had no guard. A first call opened at the gate and closed unanswered reopens on that knot (the phone reopen rule), and its once-only answers kept the hub, and with it "Bring me in", out of reach until the player answered a stale status check.

**Fix** (m05 pattern, `m05_phone_agent_0x99.ink` `first_call_choices`): a guard at the top of `first_call_choices` diverts to `support_hub` when the knot is being re-entered (`first_call_choices > 1`) and the player is past the gate or any later step: `guard_admitted`, `security_guard_ko`, `checkpoint_passed`, `vance_met`, `vance_provided_keycard`, `level1_card_held`, `anomaly_detected`, `server_room_reached`, `attack_mechanism_known`, `plant_room_entered`, `attack_prevented`. The visit-count test keeps the normal case: a player whose first open comes once inside still gets the inside answers and `first_call_objectives`. After a page reload the visit count resets, but `greeted` resets with it, so `start` routes the same way as before. No line changed, so there are no spoken-line changes.

**Routes:**
- New `r28_first_call_unanswered.json`: first call opened at the gate and left unanswered; the night is finished; reopening lands on the hub and reaches "Bring me in" (`mission_complete` true). Against the previous compiled ink it fails (pick not found: Bring me in; the stale inside answers offered; `mission_complete` false), so it proves the bug.
- New `r29_first_call_opened_inside.json` (control): first open inside, and the inside answers and objectives still play.
- 29 of 29 routes: all expectations met.

**Checks (static; no browser session):**
- Ink compiles (0 failed).
- tagdiff against HEAD: HaX phone 2 differences (the guard condition and its divert); every other file unchanged.
- dialoguelint: 0 errors, 0 warnings, plus the 2 withdrawn blank-reentry checks.
- reopencheck: 0 problems (HaX phone: 1800 reopens, 1307 re-runs).
- loopcheck on the phone (`start`; inside; `first_call_choices` after the shutdown): clean.
- Validator with ink: schema passed, all ink valid. It now shows 16 issues, up from 12. The 4 new ones are "person-chat cutscene has no background" on the sighting and entry mappings, from 84bbc1a7 (generic background pins removed for the POV backgrounds), not from this fix.

## Phase 8 playtests: struggling run A fixes

Report: `PASS5_STRUGGLING_A.md` (game 2316; 0 blockers, 4 majors, 6 minors). Mission-side findings fixed by the dialogue fixer after checking each against the ink and erb. F1, F2 and F10 are harness or engine items, left as the orchestrator directed. No browser session.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F3 | major | Debrief and credits contradict on a lost race, then a capture | **Reachable without assists.** Once Voltage turns hostile the button stance is closed. If he reaches the laptop (`vented_by_trigger`), a later KO still captures him (`npc_ko:voltage`), so `vented_by_trigger` at the debrief always means "then put down". **Fixed:** the first-opener choice reads "[He reached the laptop before I put him down. …]"; HaX's recap reads "…he reached the laptop before you put him down, and Bank B went with it."; the credit reads "RACK BANK B LOST — he reached the laptop before you put him down". The second headline was the mission-name subtitle "CRITICAL FAILURE" printed under "COSTLY SUCCESS". It's now "MISSION 4: CRITICAL FAILURE", so there's exactly one headline. Sweep: the disclosure credits had the same branch slip as D5-2 (CLASSIFIED said "maintenance fault" after nine deaths), so they now have crew-lost variants that match the debrief |
| F4 | major | Nine dead tied to an alarm a cover-holding player never learned of | **Fixed** with a fair signal; the choice is still the player's. New HaX text, sent once on whichever comes first (the dial read, 30 s after the 61-degree call; or the clock starting, 15 s): "Nine of Vance's night crew are behind the Hall 2 inverter wall till six. If those racks go, so do they. Only Vance can sound the evacuation." It's skipped after the alarm, with Vance KO'd (nobody can sound it), or once a bank has gone. New global `crew_hint_texted` (erb and `missions.json`). The routes the text points to now exist on every path: HaX's crew topic, Vance's crew offer and his phone crew offer now open on `anomaly_detected or attack_mechanism_known` (they needed the dial before); and a new Vance hub line lets a cover-route player with the attack mapped but no dial or logs drop the cover ("[I'm not an auditor. They're inside your control network, and I can prove it.]"). The cost stays visible: HaX's hint ("He'd have to trust you first.", the clock note) and Vance's offer lines are unchanged |
| F5 | minor | Vance's cloner option reads as flavour | **Fixed.** "[(Use the cloner.) Lean in over the site map, close enough to read his lanyard.]"; hub: "[(Use the cloner.) Ask about the site map again, and stand close to his lanyard.]" |
| F6 | minor | Relay's choice names the bypass modules unseen | **Fixed** by rewording: "[Somebody's been in your rack cabinets. Was that you?]" (her reply "...You've been in the cabinets." still fits) |
| F7 | minor | BESS diagram popup keeps reopening near Hall 1 | **Withdrawn (not a trigger).** The diagram is a readable poster (`readDisplay: gameDisplay`) with no proximity, interact-radius, bark or eventMapping trigger; nothing in the erb or the engine opens it unasked. The tester's `interact` calls aimed at the KO'd Cipher, who can't be interacted with, so the harness took the nearest interactable, which is the poster. For the room-dressing owner: if a human hits the same thing, move the poster away from Cipher's spot. Logged for the harness alongside F1 |
| F8 | minor | "Where do I stand?" ends on a stale "Right." menu; "Send me a field guide" has no reply | **Fixed.** `report_progress` returns straight to the hub (as the hint knots do; `report_progress_choices` removed). The guide choice now answers "Which one?" before the list |
| F9 | minor | Brief doesn't say the ESD needs grid permission and Voltage kept off the laptop | **Fixed** (`scenario_brief`, text only): "…Confirm the falsified telemetry against a real instrument and prove how they took control: the Emergency Shutdown arms only once grid control has both. Keep the trigger holder away from his laptop, then press the shutdown before the 0800 trigger time." (`mission.json`'s Hacktivity description already says "past the man holding the remote"; left alone) |

#### Routes

- New `r30_race_lost_then_captured.json`: real fight with Static up, race lost, crew lost, Static and Voltage KO'd, ESD. Both debrief openers tell it in order; the credits show COSTLY SUCCESS plus the mission-name subtitle, the new Bank B line, VOLTAGE: CAPTURED and the crew-lost CLASSIFIED line, and no MISSION COMPLETE.
- New `r31_cover_held_crew_signal.json`: cover held, the attack mapped before the dial (the clock starts; the erb text fires on `clock_started`); HaX's crew topic opens without the dial; the new cover-drop line; the ally alarm offer with its cost; the crew saved when bank B vents. The route driver doesn't simulate texts, so the text itself was checked in the erb and by dialoguelint (texts under the 30-word cap).
- 31 of 31 routes: all expectations met.

#### Checks (static; no browser session)

- Ink compiles (0 failed, no loose ends).
- Validator with ink, `--no-graph`: schema passed, all ink valid, 12 issues.
- dialoguelint: 0 errors, 0 warnings, plus the 2 withdrawn checks.
- reopencheck: 0 problems for both phones.
- tagdiff against HEAD: 16 differences, all from the list above: Vance's crew-offer condition and the new cover-drop choice (hub choice count 12 → 13); HaX's crew-topic condition, and `report_progress` diverting to the hub with `report_progress_choices` removed; the Vance phone's crew-offer condition. The debrief, Relay and Vance clone edits are text only.
- inkcheck and loopcheck: HaX phone (attack mapped without the dial; after the shutdown), Vance phone (ally, attack mapped), Vance (cover and ally with the attack mapped), debrief (race lost, then captured, crew lost), Relay. All clean.

#### Spoken lines changed (old → new)

- HaX, debrief: "The banks are isolated, but he got to the laptop before you got to him, and Bank B went with it." → "The banks are isolated, but he reached the laptop before you put him down, and Bank B went with it."
- HaX, phone: new reply "Which one?" (field guides).

Not voiced:
- New HaX text "Nine of Vance's night crew are behind the Hall 2 inverter wall till six. If those racks go, so do they. Only Vance can sound the evacuation."
- Choices: "[He reached the laptop before I reached him. …]" → "[He reached the laptop before I put him down. …]"; the two Vance cloner choices; Relay "[The bypass modules on all three rack banks. Was that you?]" → "[Somebody's been in your rack cabinets. Was that you?]"; new Vance "[I'm not an auditor. They're inside your control network, and I can prove it.]"; "[Right.]" removed.
- Credits: subtitle "CRITICAL FAILURE" → "MISSION 4: CRITICAL FAILURE"; "RACK BANK B LOST — he reached the laptop" → "…before you put him down"; new crew-lost variants "DISCLOSED IN FULL — the attack, the vulnerabilities, and the nine it cost" and "CLASSIFIED — filed as an industrial accident, cause under investigation".
- `scenario_brief` as in F9.

#### Open

- Browser check: the new HaX text on both triggers (timing against the 61-degree call; not landing on a conversation); the credits screen with one headline; Vance's cloner labels.
- F7 for room dressing, if a human run hits it. F1, F2 and F10 stay with the harness and engine backlog.

## Phase 8: final check fixes

Report: `PASS5_FINAL_CHECK.md` (the earlier fixes confirmed). Three items for the dialogue fixer; no browser session.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F1 | major | A hostile operative still on their feet can cut the debrief (game B: Relay hit the player during the debrief person-chat, the engine closed it, and the credits ran with no debrief or disclosure) | **Fixed, mission-local.** "Bring me in" now checks `hostile_standing()`, built from the globals the mission already sets: `cipher_engaged`, `static_engaged`, `guard_hostile` and `voltage_fight_started` (from each NPC's `npc_hostile_state_changed` mapping), against `operative_*_defeated`, `security_guard_ko` and `voltage_neutralised`. Relay had no hostile global, so her existing hostile mapping now also sets a new `relay_engaged` (erb, `globalVariables`, `missions.json`, `route.js`'s hostile model). While anyone is hostile and up, HaX names them and why: "Not with Relay still on you. Lose her or put her down, then call." (Cipher, Static, the gate guard and Voltage have their own lines). Choices: "[I'm well clear of them. Bring me in.]" or "[Understood.]". **Judgement call, logged:** "well clear" is the lose-them route. Hostility never resets in m04, so a hard block would make a KO the only finish, and a player who can't win the fight would be soft-locked. The danger is being hit while the debrief plays, so a player who has got away can still finish on every route. The engine fix (pause hostile NPCs during cutscenes) is with the user in DECISIONS_PENDING |
| F2 | minor | The first phone open always lands on the hub | **Cause found:** the phone preloads HaX's opening, and the story stops at `first_call_choices` (visit 1). On the player's first open, globals have changed since the preload (`guard_admitted` and so on), so `reopenWithCurrentGlobals` (`phone-chat-conversation.js`) re-navigates to the knot of the first saved choice, which is visit 2. The post-close guard keyed on `first_call_choices > 1`, so it fired on the first open. **Fixed:** the guard no longer reads visit counts. Ink can't tell a preload from the player viewing, because the preload runs the same ink, so a "seen" variable would be set by the preload too. The guard now keys on progress: exactly `start`'s own staleness test (`anomaly_detected`, `server_room_reached` or `attack_prevented`). The status check stops being offered at the same point it would stop being opened, so a first arrival never prints the question and then skips its answers (an early draft that added `plant_room_entered` did that in r11). It's reload-safe because all three are synced globals. The original post-close bug stays fixed: by the call-in, `attack_prevented` is true |
| F5 | minor | Vance's chat portrait looked like a hooded figure | **Not a Vance wiring fault.** Vance is wired to `robert_vance` with `robert_vance_talk.png` / visemes / headshot (erb, Vance's NPC block); the talk sheet shows Vance (glasses, dark jumper, lanyard). Screenshot B07 is taken while the choices are up. The hooded navy figure is the player's own portrait: the scenario's `player` block uses `hacker` / `hacker-talk.png`. Nothing changed. If the player's chat art should be a SAFETYNET agent rather than a hooded hacker, that's an art and shared-asset question for the user |

#### Routes

- New `r32_callin_blocked_by_hostile_relay.json`: Relay hostile and up after the shutdown; the call-in explains, then proceeds once she's down, and again after a page reload via "well clear".
- New `r33_first_open_after_preload.json`: the preload at the gate, then the first open inside (re-navigation, visit count 2); the inside answers and objectives play.
- Both fail on the HEAD phone ink (r32: 8 fails, r33: 3), so they prove the bugs.
- Updated `r1`: Relay turns hostile when she catches the clone, so the quiet route's call-in now goes via "well clear" (the turned-down call-in is kept).
- 33 of 33 routes: all expectations met.

#### Checks (static; no browser session)

- Ink compiles (0 failed).
- Validator with ink, `--no-graph`: schema passed, all ink valid, 12 issues (unchanged).
- dialoguelint: 0 errors, 0 warnings, plus the 2 withdrawn checks.
- reopencheck: 0 problems (HaX phone: 1800 reopens).
- tagdiff against HEAD: HaX phone 35 differences, all from F1 and F2: five new VARs; `hostile_standing()`; `extract_offer` split into the guard, `extract_blocked`, `extract_blocked_choices` and `extract_offer_text` (the old `#speaker` and lore conditions moved with the text); the first-call guard condition. Other files unchanged.
- loopcheck on the phone (`start`; after the shutdown with Relay hostile; with Cipher and the guard hostile; at `extract_offer`): clean.

#### Spoken lines changed (old → new)

All new, HaX phone: "Not with Relay still on you. Lose her or put her down, then call." / "Not with Cipher still on you. Lose him or put him down, then call." / "Not with Static still on you. Lose him or put him down, then call." / "Not with the gate guard still after you. Lose him or put him down, then call." / "Not with Voltage still on his feet. Put him down, then call." Not voiced (choices): "[I'm well clear of them. Bring me in.]", "[Understood.]".

## Pass 5: user blind run A fixes

Report: `PASS5_BLIND_A.md` (the user's "do your best" blind run, game 2513; 0 blockers, 3 majors, 9 minors). Fixed without asking, per the user's standing instruction. Weighed against the report's own deviations: DOM clicks on visible controls, one DOM `eval` (M2), harness combat (`interact` doesn't punch; three `debugKO`), and briefs read straight after a KO. No browser session in this fix pass.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | Vance's chat portrait is a coarse hooded figure from the alarm onward and in the debrief | **Fixed (cause found; the final-check F5 diagnosis was wrong).** The phone contact `robert_vance_phone` had the same `displayName`, "Robert Vance", as the person NPC. Phone NPCs register at game start, and `normalizeSpeakerId` (`person-chat-minigame.js`) takes the first display-name match, so every `Robert Vance:` prefix resolved to the phone NPC, which has no sprite or talk art. That covers his hub, the crew offer and the evacuation (the knots with prefixes; the early tagged knots are unprefixed), and his debrief replies. The phone contact is now "Robert Vance (ops desk)". Ids as prefixes were rejected because dialoguelint and the TTS line extractor only read capitalised `Name:` prefixes. Engine item E3 (DECISIONS_PENDING) covers the general fix, which m05's Patricia also needs |
| M2 | major | No way to reach CyberChef for the go-bag's Base64 card | **Fixed.** m04 had no `workstation` item at all. The CyberChef guide is a lab sheet, and the "Crypto Workstation" frame the tester found is the engine's hidden modal. A CyberChef Workstation is now in the starting kit (as m01 and m03 give one). HaX's go-bag text points to it, and the briefing's kit line names it |
| M3 | major | The H2 advisory clock contradicts "about half an hour" and doesn't say what zero does | **Fixed (partly a misread).** The tester asked HaX about the alarm before mapping the attack ("about half an hour" is right for an early alarm), then sounded it after mapping, which costs no time. The clock on screen was the 8-minute one that starts when the attack is mapped, and nothing said so. Changes: (1) a new HaX text when the attack is mapped with Voltage still up: "Nightshade's run the numbers off that box. Bank B won't last till eight. The clock on your screen is when its hydrogen alarm goes." It is skipped once a bank has gone or the shutdown is in, and it pays off Nightshade's briefing promise. (2) The late-alarm text says the alarm cost no time. (3) The early-alarm text adds "The clock's on your screen." (4) HUD labels: "Bank B hydrogen alarm in" (both advisory timers; was "H₂ Advisory — rack bank B") and "Voltage reaches the laptop in" (was "Voltage — the laptop") |
| m1 | minor | Vance after the shutdown: "Call the moment you're moving." | **Fixed.** That choice now needs `not attack_prevented`. After the shutdown: "[I'm sweeping the site before I call it in. Stay on the desk.]" / "Aye. I'll sit here and watch that needle come down." |
| m2 | minor | Hall 2 chat opens on a black frame; garbled sign text | **Engine and art, logged.** The background config and files are present, so the black frame is the image loading after a `room_entered` chat opens (E5). The garbled signs ("PETION", "RACK BAKK 1") are in the background image itself (A1, a metered Gemini edit, so it's the user's call) |
| m3 | minor | A reload returns the player to the entrance | **Declined.** Settled by the user on 2026-10-16 (`docs/agents/RESOLVED_DECISIONS.md`: no "resume in the room you left") |
| m4 | minor | After HaX's last message only "On it." shows, which hides the guide menu | **Fixed.** The Relay-KO event call (`on_relay_ko_card`) ended on a lone "On it." menu, and later texts landed under it. It now goes straight to the hub, so the field guides and "Nothing right now." are there at once. `on_relay_ko_card_choices` was removed |
| m5 | minor | Map lighting doesn't read as night in most rooms | **Deferred** to one lighting round after the current room-dressing work (L4). It needs renders and a visual review, and the ops office map is changing under another agent |
| m6 | minor | "Nightshade's reading" is never explained | **Fixed** in the briefing ("They'll believe Nightshade, if you get a real reading off those racks."). The new clock text and HaX's existing "Nightshade's got your reading" text after the dial now name Nightshade in play too |
| m7 | minor | "neutralize_operative_cipher (opt)" stayed in the task list | **Withdrawn.** The session log shows the task leaving the open list by line 915. The brief at 903 was taken 0.1 s after the `debugKO`, before the KO handler ran |
| m8 | minor | All four flags are accepted in any order | **Declined (by design).** Each flag is its own task at the drop-site terminal, and the aim completes on all four. The VM's own sequencing is SecGen's: needs checking against SecGen by the user if the order should be enforced |
| m9 | minor | The ESD flap is only described as "Flip guard" | **Partly fixed.** The ESD's observations now say "A hinged safety flap covers it: lift the flap, then press." The minigame's own status text is engine (E4) |
| W2 | worst line | Voltage: "Nobody left to stop you. All right." gives in in one beat | **Fixed.** "You're between me and the dock. I could still make that keystroke before you reached me." / "So give me a reason not to." The player's court line is the reason, and his existing reply ("...A court. Fine. Let them read the casualty model. I signed it.") now reads as a choice he makes |
| W3 | worst line | The briefing's directive recap and numbered orders read as written | **Fixed:** the directive is quoted as a line the Zero Day job left, and the One–Four list became spoken order |
| W4 | worst line | "Two hundred and forty thousand on that feed never knew they were on it." | **Fixed:** "Two hundred and forty thousand people kept their lights on and never knew why." (both debrief variants) |
| D | decision notes | The Cipher cover bluff always fails; Relay's persuasion doesn't change her | **Declined, deliberate.** Cipher has a separate talk-down route (interrupt the radio, then the night crew); the bluff failing is the cover meeting the cell. Relay is the operative who did the modelling and can't be talked round; her quiet route is the clone |

Engine items covered by the agents building form section 7 (not duplicated): the tester's punching problem (7.1i, 7.1h).

#### Routes

- New `r34_blind_a_fixes.json`: the Relay-KO call reaches the hub and a field guide at once (no "On it."); Voltage's new arrest beat and capture; Vance's line after the shutdown.
- `r25` updated for the new Nightshade line.
- 34 of 34 routes: all expectations met.

#### Checks (static; no browser session)

- Ink compiles (10 files, 0 failed).
- Full validator: schema passed, all ink valid, 12 issues (unchanged in count; the `map_the_attack` overlap warning now lists 5 handlers, and the new text is meant to fire alongside the others). Dungeon graph regenerated.
- dialoguelint: 0 errors, 0 warnings, plus the 2 withdrawn blank-reentry checks. Timed texts max 30 words.
- reopencheck: 0 problems (HaX phone 1800 reopens, Vance phone 1800).
- check_door_alignment: all OK.
- loopcheck: HaX phone at `on_relay_ko_card`, Vance's hub after the shutdown, Voltage at `confrontation_choice` with Static down: clean.
- tagdiff against HEAD: 15 differences, all from the list above. Vance: the stay-on-desk choice condition and the new post-shutdown choice (hub 13 → 14 choices). HaX phone: `on_relay_ko_card` diverts to `support_hub`, and `on_relay_ko_card_choices` (its "On it." and `#exit_conversation`) was removed. Briefing, Voltage and debrief: prose only.

#### Spoken lines changed (old → new)

- HaX, briefing: "Remember the directive from the Zero Day job? "Zero Day supplies, Critical Mass executes. Grid storage, this winter."" → "The Zero Day job left us one line. "Zero Day supplies, Critical Mass executes. Grid storage, this winter.""
- HaX, briefing: "We said it was coming. It's tonight, and it's this hall." → "Well, it's winter, and this is the site."
- HaX, briefing: "Four things, then." → (cut)
- HaX, briefing: "One. Get in on the regulator cover and find Vance." → "So. Get in on the regulator cover and find Vance."
- HaX, briefing: "Two. Prove how they took the control network. Their jump server's in the engineering workshop, and anything you pull off it goes into the drop-site terminal." → "Then prove how they took the control network. Their jump server's in the engineering workshop. Whatever you pull off it goes into the drop-site terminal."
- HaX, briefing: "Three. The plant room has a hardwired Emergency Shutdown button, the ESD. …" → "The plant room has a hardwired Emergency Shutdown button, the ESD. …"
- HaX, briefing: "Press it and the banks isolate, once grid control believes you. That's what Nightshade's reading is for." → "Press it and the banks isolate, once grid control believes you. They'll believe Nightshade, if you get a real reading off those racks."
- HaX, briefing: "Four. The operatives. Voltage alive, if you can." → "And the operatives. Voltage alive, if you can."
- HaX, briefing: "Kit: your picks, and the cloner from the WhiteHat job. No PIN cracker. …" → "Kit: your picks, the cloner from the WhiteHat job, and a laptop with CyberChef on it. No PIN cracker. …"
- Voltage: "Nobody left to stop you. All right." → "You're between me and the dock. I could still make that keystroke before you reached me." + "So give me a reason not to."
- Vance: new "Aye. I'll sit here and watch that needle come down."
- HaX, debrief (two variants): "… Two hundred and forty thousand on that feed never knew they were on it." → "… Two hundred and forty thousand people kept their lights on and never knew why."

Not voiced:
- Texts: go-bag "…I can send you the decoding guide if you'd rather not eyeball it." → "…Paste it into the CyberChef workstation in your kit. Decoding guide on request."; early alarm adds "The clock's on your screen."; late alarm "…Voltage knows we're here now. Keep moving." → "…Voltage knows we're here now, but your clock was already running. It cost you no time."; new clock text (M3).
- Choice: new Vance "[I'm sweeping the site before I call it in. Stay on the desk.]"; HaX's "[On it.]" after the Relay-KO call removed.
- HUD labels, ESD observations, the phone contact name "Robert Vance (ops desk)", the new CyberChef Workstation item.

#### Browser check (short, game 2517, keyless :3001, headless)

- M2: the CyberChef Workstation is in the starting inventory, and clicking it opens the Crypto Workstation popup with CyberChef loading.
- M1: on a re-talk Vance's hub opens on the prefixed line "Robert Vance: Something else?" and shows his own portrait (glasses, lanyard, ops-office background). The registry now holds `robert_vance_phone` = "Robert Vance (ops desk)" and `robert_vance` = "Robert Vance".
- verify-run: progress recorded (ops office reached; the workstation in the server inventory). Session stopped; log in the session scratchpad (`m04-blindA-fixes/session-2517.jsonl`).

#### Browser checks still owed

- Vance's evacuation lines and his debrief replies (M1, same mechanism as the hub line checked), and the phone contact's new name in the phone list.
- The go-bag card decodes in the workstation (M2).
- The clock text lands on mapping without covering a conversation, and the new HUD labels fit the widget (M3).
- The Relay-KO call lands on the hub with the guides (m4).

## User review 2026-10-16 (pending-decisions form 2.1): operations office matches its POV background

The user asked for the room to follow its conversation background (`docs/agents/pending_review/m04_pov_first_room.png`). Builder `room_aes_ops` (generate_rooms.py):
- Filing cabinets stand against the back wall: feet y 96 → 70, base just below the wall foot, as in the POV.
- Kitchenette back against the wall: counter and fridge feet y 104 → 92 (the front face now starts at the floor line, worktop on the wall face), collision box moved with them. The kettle and microwave follow the counter.
- Noticeboard ("poster") up: feet 50 → 45, its pinned Layout Map note 44 → 39. The rota board went up too (52 → 44) so the kettle and microwave no longer cover it.
- Vance's chair (chair-grey-1) now rolls and spins (see below); tapping the BMS terminal still opens it directly, no menu.

Engine and asset changes shared with the other missions (they need the user's approval before commit, see the report):
- `rooms.js` `STATIC_SWIVEL_PROPS`: instrument_trolley1, aes_tool_trolley1, book_trolley1, chair-grey-4, chair-darkgray-1 and chair-grey-1 now roll, spin through 8 frames and collide, like the hospital trolleys and beds. Frames are PixelLab 8-rotation output at the prop's own size on a padded canvas (40 px chairs, 32/48/56 px trolleys), reordered to the engine's S, SW, W ... order, with the original sprite kept as its own frame. Preloaded in `game.js`. A swivel prop placed as a table (m08's server-room tool trolley holds a printout) stays put.
- `object-physics.js`: pushed chairs and trolleys now collide with the map's furniture collision boxes (Object Layer 1). They were player-only, so a trolley rolled straight over the lab bench.
- `game.js` tap gather: a swivel prop joins the pick-one menu only when the tap is on its own sprite. Without this, tapping the PC on the desk in front of a chair raised a chair menu (checked in game: m04's BMS terminal opens directly).
- Builders: trolleys that were `r.solid` (a static box under them that pinned them) are now plain items: m05 lab and Torres' office, m04 workshop, m06 office.

Checks: slot_audit 0 problems; check_room_walls all 64; validator (--skip-ink --no-graph) no errors; check_door_alignment OK. In game (keyless :3001, game 2540 render, 2558 tap). Evidence: `build_evidence/user_review_2026-10-16/`.

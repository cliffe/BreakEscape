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

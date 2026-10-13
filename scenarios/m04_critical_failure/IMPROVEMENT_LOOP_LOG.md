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

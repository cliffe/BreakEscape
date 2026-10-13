// ===========================================
// VOLTAGE - CONFRONTATION (ANTAGONIST)
// Mission 4: Critical Failure
// Break Escape - Climactic Encounter with Critical Mass's field lead (Blackout leads the cell)
// ===========================================

// ===========================================
// The three stances (fight / arrest / go-for-the-button) each set one outcome
// and hand the fight to the engine via #hostile, or route to a resting knot.
// Outcomes are routed from `start` on engine-owned globals so re-entry is
// coherent (and reload-safe -- ink-local VARs are lost on reload).
// ===========================================

// Ink-owned state
VAR voltage_confronted = false           // Has the confrontation played?
// Pass 5: skip the standoff re-entry lines once, right after a goodbye (m03 hub_quiet).
VAR voltage_quiet = false
// Phase 4 dialogue C1 (D5-32): now a synced global, set with #set_global; the
// debrief pays it off.
VAR asked_the_number = false             // Did the player make him state the casualty figure?

// Ink-owned record of how the DIALOGUE ended: "" or "escaped" (D5-27: the
// unread "fought" and "arrested" writes were removed).
VAR voltage_dialogue_outcome = ""

// Engine-owned, synced in from globalVariables. Read freely. Only the peaceful
// ARREST path assigns voltage_captured (there is no KO to set it, so ink is the
// only signal Voltage was taken alive); voltage_escaped is likewise ink-set on
// the button path. Every other write of these is the engine's.
VAR voltage_captured = false
VAR voltage_escaped = false
VAR operative_static_defeated = false
// PASS 3 P11b: the trigger race. voltage_fight_started is set by a HaX mapping
// when he turns hostile (the fight stance or a first punch); vented_by_trigger by
// the trigger_race timer when he reaches the laptop first.
VAR voltage_fight_started = false
VAR vented_by_trigger = false
VAR racks_vented = false              // engine-owned; the 14-minute vent or the race
// PASS 4 fix 21: set when the player identifies his print on the bypass module. Read only.
VAR voltage_print_on_bypass = false
// Round 2 (playtest issue 4): his count reads all three KO globals; the old
// operatives_defeated counter only ever counted Cipher and Relay.
VAR operative_cipher_defeated = false
VAR operative_relay_defeated = false
// Pass 5 A1: the button stance is offered only once grid control can take the
// shed (the same two conditions as the ESD's permissive, less Voltage himself).
VAR attack_mechanism_known = false
VAR anomaly_detected = false
// Round 2 (review m6, m8): he heard the alarm; the night crew's fate; Static
// leaves with him on the button route. Read only.
VAR crew_warned = false
VAR crew_lost = false
VAR static_stood_aside = false
VAR static_engaged = false

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// CONFRONTATION START
// Location: Plant Room
// Task 3.1: Confront Voltage
//
// The NPC declared currentKnot "confrontation_start", which does not exist --
// ChoosePathString threw and person-chat-minigame.js:436-437 does not catch,
// so the climactic NPC was mute. scenario.json.erb now points at `start`.
// ===========================================

=== start ===
// PASS 3 P11b: once a fight has started and he isn't taken or gone, the stance
// menu is over. After a reload or a player KO the race has been forfeit (the
// player respawns at the entrance and the restarted timer fires), so he comes
// back in the after-state, never with the button stance.
{voltage_fight_started and not voltage_captured and not voltage_escaped: -> voltage_after_trigger}
// Global-keyed guards first: ink-local state (voltage_dialogue_outcome,
// voltage_confronted) is lost on reload (m03 D5), so branch on the engine-owned
// globals. voltage_escaped is set from the button path and persists.
{voltage_escaped: -> voltage_escape_success}
{voltage_captured: -> voltage_captured_end}
{voltage_dialogue_outcome == "escaped": -> voltage_escape_success}
{voltage_confronted: -> voltage_standoff_resumed}
-> voltage_confrontation_start

// Re-entry while the fight is unresolved: he is still here, still working.
=== voltage_standoff_resumed ===
{voltage_quiet:
    ~ voltage_quiet = false
- else:
    // Phase 4 dialogue C1 (D5-22): not a fourth "Still here."
    Voltage: *not looking up* You came back. Nothing you say next will be new.
}

// Pass 5 A1: backing off is now a stance, so the choice has to come back.
+ [Then let's finish this.]
    -> confrontation_choice

+ [Say nothing.]
    ~ voltage_quiet = true
    #exit_conversation
    -> voltage_standoff_resumed

=== voltage_confrontation_start ===
#speaker:voltage

// Voltage at laptop, notices player entry

So they sent someone.

~ temp down = 0
{operative_cipher_defeated:
    ~ down = down + 1
}
{operative_relay_defeated:
    ~ down = down + 1
}
{operative_static_defeated:
    ~ down = down + 1
}
{
- down >= 3:
    Three of my people down. Thorough.
- down == 2:
    Two of my people down.
- down == 1:
    You got past my people.
- else:
    // Phase 4 dialogue C1 (D5-1): Static's challenge always plays first.
    {static_stood_aside:
        And Static let you walk up to my bench. He'll explain that later.
    - else:
        You got past my people.
    }
}

// Round 2 (review m6): HaX says he heard the alarm, so he has.
{crew_warned:
    Your klaxon. Nine people in hi-vis on my cameras, walking out the fire doors. Very humane.
}

But you're late. This place has no security worth the name, and we've had three days in it.

* [It's over, Voltage. Stand down.]
    -> voltage_professional_approach

* [You're not burning this hall down.]
    -> voltage_confrontational

=== voltage_professional_approach ===
#speaker:voltage

Polite. They train that into you.

-> voltage_has_leverage

=== voltage_confrontational ===
#speaker:voltage

Ja. They all say that on the way in.

-> voltage_threatens_trigger

=== voltage_has_leverage ===
#speaker:voltage

// Voltage hand moves near laptop

// PASS 3 playtest D4: after the vent (14 min since pass 4) the threat must match the hall.
{racks_vented:
    Bank B's already gone. One keystroke and A and C follow it, and the grid goes down with them.
- else:
    One keystroke and it's now, not eight o'clock. The racks go critical, the hall burns, and the grid drops.
}

Your move.

* [Then I take that laptop off you.]
    -> confrontation_choice

* [Make me understand it first.]
    -> voltage_negotiation_attempt

=== voltage_threatens_trigger ===
#speaker:voltage

// Voltage hand moves to laptop

Look at my hand. Then look at the clock.

-> voltage_has_leverage

=== voltage_negotiation_attempt ===
#speaker:voltage
// Scenario design m7: the debrief can say he told you this.
#set_global:voltage_six_cities:true

You want to talk? Fine.

This site is one test run. The Architect has six cities lined up.

Infrastructure attacks, and Social Fabric ready to turn the panic into a riot.

You stop this one. How many of the others can you be standing in front of?

* [We'll stop all of them. Starting with you.]
    -> confrontation_choice

* [Why infrastructure? Why civilians?]
    -> voltage_ideology_explanation

* [Who is The Architect?]
    -> voltage_architect_deflection

=== voltage_ideology_explanation ===
#speaker:voltage

Voltage: You want the reasoning. They always want the reasoning.

Voltage: Two hundred megawatt-hours in a shed on a floodplain, holding up a city that never asked whether it should.

Voltage: Budget cuts, ageing cells, one fake maintenance firm, and we walked in the front.

Voltage: We didn't make it fragile. We just stopped pretending it wasn't.

* [How many does the hall take with it?]
    #set_global:asked_the_number:true
    ~ asked_the_number = true
    -> voltage_states_the_number

* [Someone wrote that speech for you.]
    Voltage: *almost amused* I wrote it.
    -> voltage_states_the_number

=== voltage_states_the_number ===
#speaker:voltage

#set_global:blackout_named:true
Narrator: He answers without hesitating, and without looking away.

Voltage: Eleven on site tonight. Nine on the night crew in Hall 2, the duty engineer, and the man on the gate.

Voltage: On the feed, best case, forty-odd. Oxygen concentrators, the dialysis unit at St Aldate's, home ventilators. That's the number Blackout signed, and I countersigned.

Voltage: You think I don't know it. I know it to one decimal place.

* [And you came anyway.]
    Voltage: I came because of it.
    Voltage: A grid that kills fifty when it stumbles was built wrong. Somebody has to make that legible.
    -> voltage_owns_it

* [Say their names, then.]
    Narrator: For the first time something moves behind his face. His eyes go to the laptop clock.
    Voltage: *flat* I don't need their names to know the number.
    -> voltage_owns_it

=== voltage_owns_it ===
#speaker:voltage

Voltage: There's no version of this where I blink. You should have worked that out on the way in.

-> confrontation_choice

=== voltage_architect_deflection ===
#speaker:voltage
#set_global:blackout_named:true

Voltage: The Architect? You'll never find him.

Voltage: Not in your databases, not on your cameras, not from your informants. Directives come down, cells carry them out. That's the whole of it.

Voltage: I run this site. Blackout signs for Critical Mass. Above him it stops being a person you can arrest.

-> confrontation_choice

// ===========================================
// THE CHOICE
//
// Follows m01_derek_confrontation.ink:263-290 -- the gold-standard climax shape:
// sticky stance options, each setting ONE outcome variable and diverging, with
// #hostile handing the fight to the engine rather than narrating it.
//
// Every branch MUST fire #complete_task:confront_voltage. The task is on the
// critical path to the mission-conclusion aim, so an unresolved branch would
// strand the ending.
// ===========================================

=== confrontation_choice ===
#speaker:voltage

// Phase 4 dialogue C1 (D5-6): the narration plays on the first visit only, and
// claims the dilemma only when the button is on offer.
{confrontation_choice == 1:
    {attack_mechanism_known and anomaly_detected:
        Narrator: The laptop is open on the plant-room bench with the trigger armed on screen, and the red mushroom head of the hardwired shutdown is on the wall behind him. You cannot reach both.
    - else:
        Narrator: The laptop is open on the plant-room bench with the trigger armed on screen, and the red mushroom head of the hardwired shutdown is on the wall behind him.
    }
}

// Pass 5 A1: before grid control will take the shed, the button does nothing,
// so he says so, and the button stance isn't offered.
{attack_mechanism_known and anomaly_detected:
    Voltage: So. The button, or me.
- else:
    Voltage: The button? Press it. Grid control won't shed a megawatt on what you've got.
}

// PASS 3 P11a/P11b: with Static up, a fight is a race he can win, so "both" is
// genuinely off the table; with Static down the arrest is earned instead.
// Round 2 (browser O1): "both" only parses when the button is on offer.
{
- operative_static_defeated:
    Voltage: Static's down. So it's you, me, and one keystroke.
- attack_mechanism_known and anomaly_detected:
    Voltage: You don't get to have both. I'd decide quickly.
- else:
    Voltage: And Static's still in this room. I'd decide quickly.
}

+ [I'm taking you down. Now.] #color:red
    -> choice_fight

// Scenario design m9 (orchestrator decision 2): SAFETYNET has no arrest powers;
// agents detain and hand over to the police (bible safetynet/overview.md, "The
// Cost of Independence"; PASS2 lesson 39). Globals and credits unchanged.
+ {operative_static_defeated} [Step away from the bench. You're coming with me.]
    -> choice_arrest

+ {attack_mechanism_known and anomaly_detected} [Go for the button and let him run.]
    ~ voltage_dialogue_outcome = "escaped"
    -> choice_button

// Pass 5 A1: the way out when the player isn't ready to commit. He stays at the
// bench; re-talk lands on voltage_standoff_resumed, which offers the stances again.
+ [Not like this. (Back off.)]
    ~ voltage_confronted = true
    ~ voltage_quiet = true
    Voltage: Then get out of my plant room. The clock doesn't care either way.
    #exit_conversation
    -> voltage_standoff_resumed

// ---------- FIGHT ----------

=== choice_fight ===
#speaker:voltage
~ voltage_confronted = true

#complete_task:confront_voltage
Voltage: You've picked the slow option.
// Pass 5 A3: Static is no longer only a man you talk to. If he's still up when
// the fight starts, he comes in with it.
{operative_static_defeated:
    -> choice_fight_alone
- else:
    -> choice_fight_with_static
}

=== choice_fight_alone ===
Narrator: He moves for the bench and you move for him, and the plant room stops being a place where anyone is talking.

#hostile
#exit_conversation
-> END

=== choice_fight_with_static ===
Narrator: He moves for the bench, Static comes off the wall at you, and the plant room stops being a place where anyone is talking.

#hostile:operative_static
#hostile
#exit_conversation
-> END

// ---------- ARREST ----------

=== choice_arrest ===
#speaker:voltage

Narrator: He looks at your hands, then at the door behind you.

// PASS 3 P11a: only reachable with Static down.
Voltage: Nobody left to stop you. All right.

// PASS 4 fix 21: the optional second print gives the arrest line its evidence.
+ {voltage_print_on_bypass} [Your thumb's on the bypass module. Blackout signed, you countersigned. Tell that to a court.]
    -> arrest_taken

+ {not voltage_print_on_bypass} [Blackout signed it. You countersigned. Tell that to a court.]
    -> arrest_taken

// PASS 3 (round 3, M2): the old "Last chance. Step away." made him refuse and
// fire #hostile from a surrender demand. With Static down the arrest stands;
// backing off returns to the stance menu, where the fight is labelled as one.
+ [Not yet.]
    -> confrontation_choice

=== arrest_taken ===
#speaker:voltage
// DELIBERATE EXCEPTION to the engine-owns-voltage_captured rule in the header:
// the peaceful arrest has no KO, so globalVarOnKO never fires. This is the only
// signal that Voltage was taken alive, so ink sets it here and it syncs back.
// Every OTHER path leaves voltage_captured to the engine.
~ voltage_captured = true
~ voltage_confronted = true
// D5-25: the resting knot's re-entry line is skipped once, right after this.
~ voltage_quiet = true
#complete_task:confront_voltage
#set_global:blackout_named:true
Voltage: ...A court. Fine. Let them read the casualty model. I signed it.
Narrator: He steps back from the bench with his hands open, and lets you take the laptop off it.
#exit_conversation
// Story stays live so re-talk re-enters the resting knot, not "(End of
// conversation)" (lesson 21).
-> voltage_captured_end

// ---------- GO FOR THE BUTTON ----------

=== choice_button ===
#speaker:voltage

Narrator: You break for the wall. He doesn't try to stop you. He goes the other way, for the dock door.
// Round 2 (review m8): Static, who stood aside, goes with him (the scenario hides
// him on static_left, set from voltage_escaped).
{static_stood_aside and not static_engaged and not operative_static_defeated:
    Narrator: Static peels off the wall and goes with him without a word.
}

Voltage: Good. That's the right call.

// Round 2 (review m6): after a vent with the crew in Hall 2, there is no eleven left to save.
{crew_lost:
    Voltage: You save your forty. I'll be long gone before anyone counts them.
- else:
    Voltage: You save your eleven and your forty. I'll be long gone before anyone counts them.
}

~ voltage_escaped = true
~ voltage_confronted = true

// Action tags above the line they belong to. #remove_npc takes him off the
// board so he can't be punched afterwards for a double CAPTURED+ESCAPED (M4,
// m01 pattern m01_derek_confrontation.ink:357).
#complete_task:confront_voltage
#remove_npc
#exit_conversation
Narrator: The dock door bangs open onto the loading bay and the cold, and he's gone into it.
-> voltage_escape_success

// ===========================================
// AFTER THE TRIGGER RACE (PASS 3 P11b)
// Reached from start once a fight has begun and Voltage is neither captured nor
// gone. If the race fired, the player can only have come back here after a
// reload or a KO (a fight in progress makes him hostile, and hostile NPCs are
// punched, not talked to). The line says only that the player was gone long
// enough, which is true after a KO and after a reload alike (review round 4).
// No button stance: that outcome is closed.
// ===========================================

=== voltage_after_trigger ===
#speaker:voltage
{vented_by_trigger:
    Voltage: It's done. You were gone long enough, and Bank B went with it.
- else:
    Voltage: Still standing? Then let's finish it.
}

+ [Take him down.] #color:red
    #hostile
    #exit_conversation
    -> voltage_after_trigger

+ {operative_static_defeated} [Hands on the bench. The police can have you.]
    ~ voltage_captured = true
    ~ voltage_confronted = true
    ~ voltage_quiet = true
    #complete_task:confront_voltage
    Voltage: Why not. The number's moving already.
    #exit_conversation
    -> voltage_captured_end

+ [Not yet.]
    Voltage: Take your time. The number won't.
    #exit_conversation
    -> voltage_after_trigger

// ===========================================
// OUTCOME RESTING KNOTS
// The three stances all resolve to one of these two (or to a KO, which routes
// back through `start`). Each is choice-first and never reaches DONE/END for a
// friendly re-talk (lesson 21). The old unreachable combat-dispatch and
// PHASE 3 placeholder knots were removed in pass 2.
// ===========================================

// Re-talk after he has been taken alive. Person NPC, still on his feet in
// cuffs, so this must never reach DONE/END (lesson 21): sticky, always at
// least one choice.
=== voltage_captured_end ===
#speaker:voltage

#complete_task:confront_voltage
// Phase 4 dialogue C1 (D5-25): a re-entry line, skipped once after a goodbye.
{voltage_quiet:
    ~ voltage_quiet = false
- else:
    Voltage: *flat* {&Still counting?|You've got me. You haven't got him.}
}

+ [Nothing you want to tell me?]
    Voltage: I told you the number. The only true thing anyone said in here tonight.
    -> voltage_captured_end

+ [Say nothing.]
    ~ voltage_quiet = true
    #exit_conversation
    Narrator: He sits against the bench with his wrists zipped, watching the red button he never reached.
    -> voltage_captured_end

// ===========================================
// ESCAPE OUTCOMES
// ===========================================

// Re-entered after he ran for the dock. He is gone (setVisible false on
// voltage_escaped, plus #remove_npc), so nobody can talk to him; this knot only
// keeps the story from ending (lesson 21). Phase 4 dialogue C1 (D5-25): the two
// choices here were dead text, so one resting choice, as Cipher's cipher_gone.
=== voltage_escape_success ===
~ voltage_dialogue_outcome = "escaped"
~ voltage_confronted = true
#complete_task:confront_voltage

+ [(He's gone.)]
    #exit_conversation
    -> voltage_escape_success


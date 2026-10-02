// ===========================================
// VOLTAGE - CONFRONTATION (ANTAGONIST)
// Mission 4: Critical Failure
// Break Escape - Climactic Encounter with Critical Mass Leader
// ===========================================

// ===========================================
// The three stances (fight / arrest / go-for-the-button) each set one outcome
// and hand the fight to the engine via #hostile, or route to a resting knot.
// Outcomes are routed from `start` on engine-owned globals so re-entry is
// coherent (and reload-safe -- ink-local VARs are lost on reload).
// ===========================================

// Ink-owned state
VAR voltage_confronted = false           // Has the confrontation played?
VAR asked_the_number = false             // Did the player make him state the casualty figure?

// Ink-owned record of how the DIALOGUE ended: "", "escaped", "fought".
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
VAR operatives_defeated = 0
// PASS 4 fix 21: set when the player identifies his print on the bypass module. Read only.
VAR voltage_print_on_bypass = false
// Round 2 (playtest issue 4): his count reads all three KO globals; the old
// operatives_defeated counter only ever counted Cipher and Relay.
VAR operative_cipher_defeated = false
VAR operative_relay_defeated = false

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
Voltage: *not looking up from the laptop* Still here.

Voltage: Nothing you say next will be new.

+ [Say nothing.]
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
    And not one of my people saw you come.
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

Bold. Conviction never stopped an attack.

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

* [Then we do this the hard way.]
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

You want to talk? Fine.

This site is one test run. The Architect has six cities on the go.

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
    ~ asked_the_number = true
    -> voltage_states_the_number

* [Someone wrote that speech for you.]
    Voltage: *almost amused* I wrote it.
    -> voltage_states_the_number

=== voltage_states_the_number ===
#speaker:voltage

Narrator: He answers without hesitating, and without looking away.

Voltage: Eleven on site tonight. Nine on the night crew in Hall 2, two in the gatehouse.

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

Narrator: The laptop is open on the plant-room bench with the trigger armed on screen, and the red mushroom head of the hardwired shutdown is on the wall behind him. You cannot reach both.

Voltage: So. The button, or me.

// PASS 3 P11a/P11b: with Static up, a fight is a race he can win, so "both" is
// genuinely off the table; with Static down the arrest is earned instead.
{operative_static_defeated:
    Voltage: Static's down. So it's you, me, and one keystroke.
- else:
    Voltage: You don't get to have both. I'd decide quickly.
}

+ [I'm taking you down. Now.] #color:red
    ~ voltage_dialogue_outcome = "fought"
    -> choice_fight

+ {operative_static_defeated} [Step away from the bench. You're under arrest.]
    ~ voltage_dialogue_outcome = "arrested"
    -> choice_arrest

+ [Go for the button and let him run.]
    ~ voltage_dialogue_outcome = "escaped"
    -> choice_button

// ---------- FIGHT ----------

=== choice_fight ===
#speaker:voltage
~ voltage_confronted = true

#complete_task:confront_voltage
Voltage: You've picked the slow option.

Narrator: He moves for the bench and you move for him, and the plant room stops being a place where anyone is talking.

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
#complete_task:confront_voltage
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

Voltage: Good. That's the right call.

Voltage: You save your eleven and your forty. I'll be long gone before anyone counts them.

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

+ {operative_static_defeated} [Hands on the bench. You're under arrest.]
    ~ voltage_captured = true
    ~ voltage_confronted = true
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

+ [Nothing you want to tell me?]
    Voltage: I told you the number. The only true thing anyone said in here tonight.
    -> voltage_captured_end

+ [Say nothing.]
    #exit_conversation
    Narrator: He sits against the bench with his wrists zipped, watching the red button he never reached.
    -> voltage_captured_end

// ===========================================
// ESCAPE OUTCOMES
// ===========================================

// Re-entered after he ran for the dock. He is gone; this knot just holds the
// dock door open in the fiction and never ends the story (lesson 21).
=== voltage_escape_success ===
~ voltage_dialogue_outcome = "escaped"
~ voltage_confronted = true
#complete_task:confront_voltage

+ [Look through the dock door.]
    Narrator: The loading bay is empty and cold. A vehicle was here. It isn't now.
    #exit_conversation
    -> voltage_escape_success

+ [Turn back to the button.]
    #exit_conversation
    Narrator: The red mushroom head is still on the wall behind you, and the racks are still climbing.
    -> voltage_escape_success


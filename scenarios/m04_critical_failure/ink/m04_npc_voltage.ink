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
VAR operatives_defeated = 0

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

Voltage: Nothing you say next is going to be new.

+ [Say nothing.]
    #exit_conversation
    -> voltage_standoff_resumed

=== voltage_confrontation_start ===
#speaker:voltage

// Voltage at laptop, notices player entry

You're good. Better than the usual SAFETYNET drones.

{operatives_defeated >= 2:
    You put two of my people down. Impressive.
}
{operatives_defeated == 1:
    You got past my people.
}
{operatives_defeated == 0:
    Sneaky approach. I respect that.
}

But you're too late. This facility's security is a joke. We've been here for three days setting this up.

* [The attack is over, Voltage. Stand down.]
    -> voltage_professional_approach

* [You're not torching this battery hall.]
    -> voltage_confrontational

=== voltage_professional_approach ===
#speaker:voltage

Professional to the end. I can respect that.

-> voltage_has_leverage

=== voltage_confrontational ===
#speaker:voltage

Bold. But conviction doesn't stop attacks.

-> voltage_threatens_trigger

=== voltage_has_leverage ===
#speaker:voltage

// Voltage hand moves near laptop

One keystroke and I trigger it now. The racks go critical, the hall burns, and 240,000 people lose power by noon.

Your move, agent.

* [Then we do this the hard way.]
    -> confrontation_choice

* [Make me understand it first.]
    -> voltage_negotiation_attempt

=== voltage_threatens_trigger ===
#speaker:voltage

// Voltage hand moves to laptop

One keystroke. That's all it takes.

-> voltage_has_leverage

=== voltage_negotiation_attempt ===
#speaker:voltage

You want to talk? Fine.

This facility? It's one test run. The Architect has operations in six cities.

Coordinated infrastructure attacks with Social Fabric ready to amplify the panic.

You think stopping this changes anything? You stopped ONE attack. How many others can you stop?

* [We'll stop all of them. Starting with you.]
    -> confrontation_choice

* [Why infrastructure? Why target civilians?]
    -> voltage_ideology_explanation

* [Who is The Architect?]
    -> voltage_architect_deflection

=== voltage_ideology_explanation ===
#speaker:voltage

Voltage: You want the reasoning. Everyone wants the reasoning.

Voltage: Two hundred megawatt-hours in a shed on a floodplain, holding up a city that never asked whether it should. Budget cuts, ageing cells, one fake maintenance company and we walked in through the front.

Voltage: We didn't make it fragile. We just stopped pretending it isn't.

* [How many people does the hall take with it?]
    ~ asked_the_number = true
    -> voltage_states_the_number

* [You've been told to say all that.]
    Voltage: *almost amused* I wrote it.
    -> voltage_states_the_number

=== voltage_states_the_number ===
#speaker:voltage

Narrator: He answers without hesitating, and without looking away from you, which is the part you will remember.

Voltage: Eleven on site tonight. Nine of them in Hall 2 on the night crew, two in the gatehouse.

Voltage: On the feed, best case, forty-odd. Care homes on oxygen concentrators, the dialysis unit at St Aldate's, home ventilators. That's the number Blackout signed and I countersigned.

Voltage: You think I don't know it. I know it to one decimal place.

* [And you came anyway.]
    Voltage: I came *because* of it.
    Voltage: A grid that kills fifty when it stumbles is a grid that shouldn't have been built that way. Somebody has to make that legible.
    -> voltage_owns_it

* [Say their names, then.]
    Narrator: For the first time, something moves behind his face. It isn't doubt. It's irritation at being slowed down.
    Voltage: *flat* I don't need to know their names to know the number.
    -> voltage_owns_it

=== voltage_owns_it ===
#speaker:voltage

Voltage: There's no version of this where I'm the one who blinks. You should have worked that out in the corridor.

-> confrontation_choice

=== voltage_architect_deflection ===
#speaker:voltage

Voltage: The Architect? You'll never find them.

Voltage: Not in your databases, not in your surveillance, not through your informants. Directives come down and cells execute. That's the whole architecture.

Voltage: I run this site. Blackout signs Critical Mass. Above that it stops being a person you can arrest.

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

Voltage: You genuinely don't get to have both, and I'd think about it quickly.

+ [I'm taking you down. Now.] #color:red
    ~ voltage_dialogue_outcome = "fought"
    -> choice_fight

+ [Step away from the bench. You're under arrest.]
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

Narrator: He looks at your hands, then at the door behind you, and does the arithmetic he has done all night.

{operative_static_defeated:
    Voltage: Static's down, isn't he.
- else:
    Voltage: You'd have to get past Static.
}

+ [Blackout signed it. You countersigned. Tell that to a court.]
    // DELIBERATE EXCEPTION to the engine-owns-voltage_captured rule in the header:
    // the peaceful arrest has no KO, so globalVarOnKO never fires. This is the only
    // signal that Voltage was taken alive, so ink sets it here and it syncs back.
    // Every OTHER path leaves voltage_captured to the engine.
    ~ voltage_captured = true
    ~ voltage_confronted = true
    #complete_task:confront_voltage
    Voltage: ...A court. Fine. A court can have the number too.
    Narrator: He steps back from the bench with his hands open, and lets you take the laptop off it.
    #exit_conversation
    // Story stays live so re-talk re-enters the resting knot, not "(End of
    // conversation)" (lesson 21).
    -> voltage_captured_end

+ [Last chance. Step away.]
    ~ voltage_confronted = true
    ~ voltage_dialogue_outcome = "fought"
    #complete_task:confront_voltage
    Voltage: No.
    Narrator: He goes for the bench.
    #hostile
    #exit_conversation
    -> END

// ---------- GO FOR THE BUTTON ----------

=== choice_button ===
#speaker:voltage

Narrator: You break for the wall. He does not try to stop you -- he goes the other way, for the dock door, and that tells you exactly how he had this ranked.

Voltage: *already moving* Good. That's the right call.

Voltage: You save your eleven and your forty. I'll be somewhere else by the time anyone counts them.

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
    Voltage: I told you the number. That's the only true thing anyone said in here tonight.
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
    Narrator: The loading bay is empty and cold. A vehicle was here; it isn't now. Voltage made the exchange he wanted -- the grid for his own head start.
    #exit_conversation
    -> voltage_escape_success

+ [Turn back to the button.]
    #exit_conversation
    Narrator: The red mushroom head is still on the wall behind you, and the racks are still climbing. That is the only thing that matters now.
    -> voltage_escape_success


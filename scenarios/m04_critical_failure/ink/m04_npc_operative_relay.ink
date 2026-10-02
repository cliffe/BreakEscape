// ===========================================
// OPERATIVE RELAY - ENTROPY, Inverter Room patrol
// Mission 4: Critical Failure
//
// Combat is the engine's (behavior.hostile + patrol + the #hostile tag). This
// script is the reachable part only: the detection beat and a short standoff,
// each ending in the handoff to the fight.
//
// PASS 2: the dead post-KO surrender/interrogation hubs were removed (a KO'd NPC
// is non-interactable, interactions.js:1690, and there is no subdue mechanic).
// Relay carries the Level 2 workshop card (PASS 3 P3), recovered from the drop
// or HaX's KO fallback, and
// neutralize_operative_relay is completed by the engine's taskOnKO. Relay's
// OptiGrid ops log (itemsHeld) still carries the regional-strike intel.
// ===========================================

VAR relay_alerted_team = false
VAR radio_interrupted = false
// PASS 4 (fix 6). Globals, synced. cell_alerted: Cipher's radio call got out,
// so she is waiting rather than surprised. relay_card_cloned: set by the
// card_cloned mapping (clone rule: never from the tag), read in the debrief knot.
VAR cell_alerted = false
VAR relay_card_cloned = false
// Round 2: ink-local; true when the clone was a rush from relay_last_chance.
VAR clone_rushed = false

// PASS 4 fix 6: this conversation now opens by itself when the player first
// enters Hall 2 (room_entered mapping on operative_relay), so she notices them.
=== start ===
{radio_interrupted or relay_alerted_team: -> relay_standoff}
{cell_alerted: -> relay_waiting}
-> relay_patrol_alert

=== relay_waiting ===
Narrator: She's already facing the door when it opens, one hand resting on the radio.
ENTROPY Operative 'Relay': Cipher said we had a live one. That'll be you.
-> relay_standoff

// ===========================================
// DETECTION
// ===========================================

=== relay_patrol_alert ===
Narrator: She comes round the end of the inverter cabinets mid-stride and stops dead.

ENTROPY Operative 'Relay': Inverter room's closed. Has been all week.

* [Then why are you walking it?]
    Narrator: Her hand is already moving for the radio.
    ENTROPY Operative 'Relay': Because I'm meant to be.
    -> relay_alerts_team

* [Radio. Down. Now.]
    ~ radio_interrupted = true
    Narrator: Her hand stops halfway. She weighs it, and leaves the radio where it is.
    ENTROPY Operative 'Relay': Easy.
    -> relay_standoff

* [The bypass modules on all three rack banks. Was that you?]
    ~ radio_interrupted = true
    Narrator: That stops her harder than a raised voice would.
    ENTROPY Operative 'Relay': ...You've been in the cabinets.
    -> relay_standoff

=== relay_alerts_team ===
~ relay_alerted_team = true

ENTROPY Operative 'Relay': All units, inverter room. We have company.

Narrator: She clips the radio back on her belt, unhurried.
-> relay_last_chance

// ===========================================
// STANDOFF
// ===========================================

=== relay_standoff ===
ENTROPY Operative 'Relay': You're not getting to those rack banks.
-> relay_standoff_choices

// Choices-only knot so a resumed clone lands on choices, not on a replayed line.
=== relay_standoff_choices ===
// PASS 4 fix 6, the quiet route: her card is old prox, like Vance's. Sticky so
// a failed read can be retried.
+ {not relay_card_cloned} [(Keep her talking. Step in close enough for the cloner to find her card.)]
    -> relay_clone

* [I don't need to. I need you to understand what they'll do.]
    -> relay_doubt

* [Walk away. I'm not here for you.]
    Narrator: She shakes her head, almost friendly.
    ENTROPY Operative 'Relay': No. You're really not.
    -> relay_refuses

+ [Say nothing.]
    Narrator: The silence goes on a beat too long.
    -> relay_refuses

=== relay_doubt ===
ENTROPY Operative 'Relay': Thermal runaway in a sealed hall. I know exactly what they'll do. I did the modelling.

Narrator: There is no flinch in it.

* [You modelled the casualties and came anyway.]
    ENTROPY Operative 'Relay': I modelled the grid. The casualties were a line in the same spreadsheet.
    -> relay_refuses

* [Then you know the night crew is still in Hall 2.]
    ENTROPY Operative 'Relay': They were told to clear at midnight. If they didn't, that's on them.
    -> relay_refuses

// Clone knots: m03/m04 shape. Narration first, the tag on a throwaway line
// (starting the RFID minigame ends this chat), then a debrief knot that opens
// with the result. A failed read goes back to the standoff.
=== relay_clone ===
Narrator: You let her talk and drift closer while she does, until the cloner on your hip is a hand's width from the card on her belt.
#clone_keycard:server_room_keycard
Narrator: She keeps talking.
-> relay_clone_debrief

=== relay_clone_debrief ===
{relay_card_cloned: -> relay_clone_caught}
{clone_rushed: -> relay_clone_missed}
Narrator: The cloner didn't get a clean read. She hasn't noticed. Yet.
-> relay_standoff_choices

=== relay_clone_missed ===
Narrator: The cloner didn't get a clean read.
-> relay_last_chance

=== relay_clone_caught ===
Narrator: The cloner buzzes once. She hears it.
{not clone_rushed:
    ENTROPY Operative 'Relay': ...Was that what I think it was?
}
ENTROPY Operative 'Relay': That was my card. Run, then.

#hostile
#exit_conversation
-> DONE

=== relay_refuses ===
ENTROPY Operative 'Relay': Last chance to be somewhere else.
-> relay_last_chance

// Round 2 (re-review M1): every route to the fight passes through here, so the
// quiet route survives whatever the player said first. Choices-only knot, so a
// resumed clone lands on choices. Sticky, so a missed read can be retried.
=== relay_last_chance ===
+ {not relay_card_cloned} [(Close the gap before she moves. The cloner's already reading.)]
    -> relay_clone_close
+ [Then we do this the hard way.]
    #hostile
    #exit_conversation
    -> DONE

=== relay_clone_close ===
~ clone_rushed = true
Narrator: You step inside her reach before she moves, the cloner already reading.
#clone_keycard:server_room_keycard
Narrator: She shoves you off.
-> relay_clone_debrief

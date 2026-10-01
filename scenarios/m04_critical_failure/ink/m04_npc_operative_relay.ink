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

=== start ===
{radio_interrupted or relay_alerted_team: -> relay_standoff}
-> relay_patrol_alert

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
    Narrator: That stops her harder than a raised voice would. She had not expected anyone to have looked in the cabinets.
    ENTROPY Operative 'Relay': ...You've been in the cabinets.
    -> relay_standoff

=== relay_alerts_team ===
~ relay_alerted_team = true

ENTROPY Operative 'Relay': All units, inverter room. We have company.

Narrator: She clips the radio back on her belt with the unhurried confidence of someone who expects to win this.

#hostile
#exit_conversation
-> DONE

// ===========================================
// STANDOFF
// ===========================================

=== relay_standoff ===
ENTROPY Operative 'Relay': You're not getting to those rack banks.

* [I don't need to. I need you to understand what they'll do.]
    -> relay_doubt

* [Walk away. I'm not here for you.]
    Narrator: She shakes her head, almost friendly.
    ENTROPY Operative 'Relay': No, you're really not going to be able to do that.
    -> relay_refuses

+ [Say nothing.]
    Narrator: She reads the silence correctly.
    -> relay_refuses

=== relay_doubt ===
ENTROPY Operative 'Relay': Thermal runaway in a sealed hall. I know exactly what they'll do. I did the modelling.

Narrator: There is no flinch in it. She is not a technician who was lied to; she costed this and came anyway.

* [You modelled the casualties and came anyway.]
    ENTROPY Operative 'Relay': I modelled the grid. The casualties were a line in the same spreadsheet.
    -> relay_refuses

* [Then you know the night crew is still in Hall 2.]
    ENTROPY Operative 'Relay': They were told to clear at midnight. If they didn't, that's on them.
    -> relay_refuses

=== relay_refuses ===
ENTROPY Operative 'Relay': Last chance to be somewhere else.

#hostile
#exit_conversation
-> DONE

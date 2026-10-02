// ===========================================
// OPERATIVE STATIC - ENTROPY, Voltage's backup (Plant Room)
// Mission 4: Critical Failure
//
// Combat is the engine's (behavior.hostile + the #hostile tag). Static is the
// last body between the player and Voltage, so this is deliberately short: a
// challenge, a beat, and the handoff to the fight.
//
// PASS 2: the dead post-KO interrogation hub was removed (a KO'd NPC is
// non-interactable, interactions.js:1690; no subdue mechanic). The Architect
// intel it carried is on Static's coordination log (itemsHeld), in the plant-room
// documents, and in Voltage's confrontation, so nothing is lost.
// ===========================================

VAR static_challenged = false

=== start ===
{static_challenged: -> static_standoff}
-> static_voltage_support

// ===========================================
// THE CHALLENGE
// ===========================================

=== static_voltage_support ===
~ static_challenged = true

Narrator: He steps out from behind the plant-room door frame, putting himself squarely between you and the man at the laptop.

ENTROPY Operative 'Static': Voltage. Company.

Narrator: Behind him, Voltage does not look up from the screen.

ENTROPY Operative 'Static': He doesn't need long. I just need you to be slow.

-> static_standoff

=== static_standoff ===
* [You're standing in a room that's about to catch fire.]
    ENTROPY Operative 'Static': Then we'd better be quick.
    -> static_refuses

* [He's not going to wait for you. Look at him.]
    Narrator: For a fraction of a second, Static's eyes flick to the laptop, and to the man who has still not looked up.
    ENTROPY Operative 'Static': He doesn't have to wait for me. That's the job.
    -> static_refuses

+ [Out of my way.]
    -> static_refuses

=== static_refuses ===
ENTROPY Operative 'Static': Not past me.

#hostile
#exit_conversation
-> DONE

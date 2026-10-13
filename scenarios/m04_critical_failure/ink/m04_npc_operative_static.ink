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
// intel it carried is on the coordination log (a plant-room object since round 4,
// so a talk-past player can still find it), in the plant-room documents, and in
// Voltage's confrontation, so nothing is lost.
// ===========================================

VAR static_challenged = false
// Pass 5 A3: synced. He now challenges on plant-room entry (room_entered
// mapping), so the player can talk past him to Voltage. Set by #set_global.
VAR static_stood_aside = false
// Local: skip the re-entry line once, right after a goodbye (m03 hub_quiet).
VAR static_quiet = false

=== start ===
{static_stood_aside: -> static_watching}
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

// Pass 5 A3: the quiet way past. He doesn't move far, and a fight with Voltage
// brings him in (#hostile:operative_static in Voltage's ink).
+ [I'm not here for you. I'm here to talk to him.]
    -> static_steps_aside

=== static_steps_aside ===
#set_global:static_stood_aside:true
Narrator: He weighs you for a long second, then takes one step to the side. One step, no more.
ENTROPY Operative 'Static': Talk, then. From there.
~ static_quiet = true
#exit_conversation
-> static_watching

// Resting knot: he's standing aside, watching. Re-talk lands here; the line is
// skipped once right after a goodbye. Never ends (lesson 21).
=== static_watching ===
{static_quiet:
    ~ static_quiet = false
- else:
    ENTROPY Operative 'Static': I'm still here.
}
+ [Leave him be.]
    ~ static_quiet = true
    #exit_conversation
    -> static_watching
+ [Out of my way.]
    -> static_refuses

=== static_refuses ===
ENTROPY Operative 'Static': Not past me.

#hostile
#exit_conversation
-> DONE

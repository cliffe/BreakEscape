// ===========================================
// OPERATIVE CIPHER - ENTROPY, Battery Hall 1
// Mission 4: Critical Failure
//
// Combat is the engine's (behavior.hostile + the #hostile tag). This script is
// only the reachable part: the detection beat and a short standoff, each ending
// in the handoff to the fight.
//
// PASS 2: the old post-KO surrender/interrogation hubs (cipher_down,
// cipher_interrogation, cipher_secured_hub) were removed. A KO'd NPC is
// non-interactable (interactions.js:1690) and there is no non-lethal subdue
// mechanic, so none of that content could ever be reached. Since PASS 3 (P3)
// Cipher carries no card and his fight is optional; neutralize_operative_cipher
// is completed by the engine's taskOnKO.
// Cipher's intel note (itemsHeld) still carries the same information.
// ===========================================

VAR cipher_alerted_team = false
VAR radio_interrupted = false
// PASS 4 (fixes 6-7). Globals, synced. cipher_walked: he left when told about
// the night crew (hidden by his setVisible mapping). cell_alerted: his radio
// call got out, so Relay is waiting in Hall 2.
VAR cipher_walked = false
VAR cell_alerted = false

=== start ===
{cipher_walked: -> cipher_gone}
{radio_interrupted or cipher_alerted_team: -> cipher_standoff}
-> cipher_detection

// ===========================================
// DETECTION
// ===========================================

=== cipher_detection ===
Narrator: He is crouched at the end of the rack row with a panel open and a handset already half out of its clip.

ENTROPY Operative 'Cipher': Hey. Hey! This bay's locked off for maintenance. Who signed you in?

* [Albion contracted me for the thermal survey. Check your list.]
    ENTROPY Operative 'Cipher': There's no survey tonight. And you came in the wrong door for one.
    -> cipher_alerts_team

* [Put the radio down.]
    ~ radio_interrupted = true
    Narrator: You close the distance before the handset clears its clip. He freezes with it against his chest.
    ENTROPY Operative 'Cipher': You're fast.
    -> cipher_standoff

* [Hall 2 is venting. You want to be on a radio right now?]
    ~ radio_interrupted = true
    Narrator: It lands. His eyes go to the hydrogen panel over your shoulder, and the handset stops moving.
    ENTROPY Operative 'Cipher': That panel's amber. That panel is not supposed to be amber.
    -> cipher_standoff

// ===========================================
// HE GETS THE CALL OUT
// ===========================================

=== cipher_alerts_team ===
~ cipher_alerted_team = true
~ cell_alerted = true

ENTROPY Operative 'Cipher': Voltage, Hall 1. We've got a live one.

Narrator: The handset squawks once and goes dead. He drops it and squares up.

ENTROPY Operative 'Cipher': You picked the wrong facility.

#hostile
#exit_conversation
-> DONE

// ===========================================
// STANDOFF - the radio is stalled, nothing is settled
// ===========================================

=== cipher_standoff ===
ENTROPY Operative 'Cipher': So what happens now?

* [Walk out. Leave the handset.]
    ENTROPY Operative 'Cipher': Can't do that.
    -> cipher_refuses

* [Whatever Voltage told you this was, the racks vent hydrogen. People die.]
    -> cipher_doubt

+ [Say nothing.]
    Narrator: The pause stretches. He makes his decision before you make yours.
    ENTROPY Operative 'Cipher': No.
    -> cipher_refuses

=== cipher_refuses ===
ENTROPY Operative 'Cipher': I'm not walking. Not tonight.

#hostile
#exit_conversation
-> DONE

=== cipher_doubt ===
ENTROPY Operative 'Cipher': Nobody's in the halls at night. That's the whole point of doing it at night.

Narrator: He says it too fast.

* [There's a night crew in Hall 2. Go and look.]
    ENTROPY Operative 'Cipher': ...You're lying.
    Narrator: His eyes go to the Hall 2 door, and stay there.
    -> cipher_walks

* [Ask him yourself. He's in the plant room.]
    Narrator: He raises the handset again.
    ENTROPY Operative 'Cipher': I will.
    -> cipher_alerts_team

// PASS 4 fix 7: the words land. He goes to look, and doesn't come back. The
// global is set last, because its mapping hides him at once.
=== cipher_walks ===
ENTROPY Operative 'Cipher': If you're lying, I'm coming back for you.
Narrator: He clips the handset back on his belt, unradioed, and walks for the Hall 2 door without looking at you again.
#complete_task:neutralize_operative_cipher
~ cipher_walked = true
#exit_conversation
-> cipher_gone

// Resting knot (lesson 21): he is hidden, but the story never ends.
=== cipher_gone ===
+ [(He's gone.)]
    #exit_conversation
    -> cipher_gone

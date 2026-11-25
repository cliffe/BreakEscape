// ================================================
// Awareness E12, full episode: Yusuf Demir (person, Merrin & Sallow lobby)
// Yusuf is the studio's security officer on the door: the second layer behind
// Delphine's desk. Firm but professional throughout. He has no sprite hub here,
// just two short entry knots the eventMappings route to (1.7):
//   - start: talking to him outside a challenge (one line, one choice, exit).
//   - challenge: he has stopped the learner at the door; two branches on globals
//     (alerted by reception, otherwise no hi-vis), each two lines, then exit.
//     The hi-vis courier case is a bark in the JSON (mapping 1), so no knot.
// Closing the conversation sets ca12_world_done via his conversation_closed
// mapping, which ends the beat; the ink writes no globals of its own.
// ca12_guard_alerted is set by Lorna's mapping on the reported outcome; the ink
// only reads it to pick the branch, so it must be declared in the scenario's
// globalVariables for the value to sync in.
// Placeholder sprite until the PixelLab reset.
// ================================================

// Read-only: set by the shell's eventMappings when reception reports the learner.
VAR ca12_guard_alerted = false

=== start ===
Yusuf Demir: Desk's just there. Delphine will sort you out.
+ [Nod and head over.]
    #exit_conversation
    -> END

=== challenge ===
Yusuf Demir: Sorry, can I help you there? #delivery: polite, firm, unhurried
{ ca12_guard_alerted:
    Yusuf Demir: Reception's asked me to have a word. #delivery: polite, firm, unhurried
    Yusuf Demir: I'll have to ask you to wait outside, then. #delivery: polite, firm, unhurried
- else:
    Yusuf Demir: No badge, no uniform. Desk first, please. #delivery: polite, firm, unhurried
    Yusuf Demir: Delphine can ring up for you. #delivery: polite, firm, unhurried
}
#exit_conversation
-> END

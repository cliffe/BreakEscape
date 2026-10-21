INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Officer Dev Malhotra (malhotra_post)
// Group B, stage 7b. Contract §1.4. Person-chat, koImmune, at the van end
// all night running comms. Hounslow; quick, precise, a little defensive.
// His secret (SE §3.4): re-vetted for a week after the mole, over a form.
// The face-to-face wrong accusation once clue 1 is in. Entry: start.
// No DONE or END: exits divert to post.
// ================================================

VAR mal_quiet = false
VAR mal_log_asked = false
VAR mal_line_asked = false

=== function mal_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == "" and officer_out == ""

=== start ===
-> post

=== post ===
{
- mal_quiet:
    ~ mal_quiet = false
- officer_out == "malhotra":
    Officer Dev Malhotra: Headset's off. I'm sitting in the van, as instructed.
- breach_open:
    Officer Dev Malhotra: Relay's up. You're loud and clear.
- else:
    Officer Dev Malhotra: Comms check's clean. I've done it twice.
}
+ {clue_door_log and not mal_log_asked} [The door log has your badge on it.]
    ~ mal_log_asked = true
    Officer Dev Malhotra: It's my badge. It isn't my hand. I was talking to HaX at ten past. Ask her.
    ~ mal_quiet = true
    -> post
+ {not mal_line_asked} [You asked for comms tonight?]
    ~ mal_line_asked = true
    Officer Dev Malhotra: I did. After the mole, they re-vetted me for a week over a form.
    Officer Dev Malhotra: I'd like to be trusted with something. This is something.
    ~ mal_quiet = true
    -> post
+ {mal_can_accuse()} [You're WREN.]
    -> accuse_check
+ [Keep the line clean.]
    Officer Dev Malhotra: Always do.
    ~ mal_quiet = true
    #exit_conversation
    -> post

// The face-to-face wrong accusation: the same writes as the line accusation.
// He stays at the van either way (koImmune, RL §2.1); the cost is HaX's relay.
=== accuse_check ===
Agent HaX: Wrong, and I lose Malhotra's relay till you can clear him. Sure?
+ [I'm sure.]
    ~ officer_out = "malhotra"
    ~ wrong_accusation = true
    Officer Dev Malhotra: Eleven years. Check the log again.
    Director Magnus Netherton: Officer Malhotra. Headset off, and sit in the van, please.
    ~ mal_quiet = true
    #exit_conversation
    -> post
+ [Forget I said it.]
    Officer Dev Malhotra: Gladly.
    ~ mal_quiet = true
    -> post

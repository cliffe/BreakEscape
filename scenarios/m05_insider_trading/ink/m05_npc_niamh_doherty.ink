// ===========================================
// Mission 5: NPC - Niamh Doherty
// Quantum Dynamics' internal communications officer. Office-life extra (office_life/PLAN.md 2.1, 6).
// Ambient: no clue, no task, nothing given. She knows nothing of the operation.
// Three lines; the choices change which of them the player hears, and nothing else.
//
// The three day exchanges below are played by the needs system when Niamh and Thandiwe meet at
// the espresso or the cooler with the player in earshot; they are never reached from her
// conversation. Order and gates are in her NPC record. The engine sets heard_<knot> once a
// line was heard. Niamh owns them because her id is the lower of the pair.
// ===========================================

// Set by the engine once a line of each exchange was heard.
VAR heard_ex_whispering = false
VAR heard_ex_collection = false
VAR heard_ex_heading_home = false

// Skips the opener once after a goodbye, so the line printed behind the exit tag is not shown (m03 pattern).
VAR hub_quiet = false

=== start ===
-> choices

=== choices ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Niamh Doherty: Sorry, deadline. Can it wait?
}
+ [Who should I talk to around here?]
    Niamh Doherty: Lisa's the one who knows everyone.
    -> goodbye
+ [Go on, I'll let you work.]
    -> goodbye

=== goodbye ===
Niamh Doherty: I'll be here till late, sadly.
~ hub_quiet = true
#exit_conversation
-> choices

// Before the server badge: the security person has been seen in the corridor.
=== ex_whispering ===
Niamh Doherty: Is the security person still in?
Thandiwe Moyo: Went past twice. Very serious shoes.
Niamh Doherty: Apparently they don't send just anyone.
Thandiwe Moyo: Well, I'm keeping my head down.
-> DONE

// Before the server badge: Lisa's collection tin.
=== ex_collection ===
Thandiwe Moyo: Have you put anything in Lisa's tin?
Niamh Doherty: A tenner. Nobody will say who it's for.
Thandiwe Moyo: Then it's not ours to ask.
-> DONE

// Once the player holds the server badge and before the server room: the pair are on their way out.
=== ex_heading_home ===
Thandiwe Moyo: Right, I'm off once I've finished this.
Niamh Doherty: Lucky. I've got the all-staff to finish.
Thandiwe Moyo: Don't let them keep you past seven.
Niamh Doherty: Tell that to the comms calendar.
-> DONE

// ================================================
// Fixture B (draft): Erik Lindqvist, facilities engineer. Suspect. Person NPC in b_kitchen.
// Swedish-born, mid fifties, thirty years in plant rooms. Blunt, aggrieved about
// money, not shy about it, and proud of his chillers.
//
// Plan: §9.1 "No-combat held-item route" (asked about pay he hands over his copy of
// the complaint, #give_item, which fires item_picked_up:notes with itemId
// b_overtime_complaint and so t_b_complaint_copy) and "Rooms" (once Tomás has
// mentioned the alarm, b_heard_alarm, the alarm choice is offered and he gives the
// code 4417). A suspect's own word clears nobody (§7.1): he grants no clue in ink,
// and nothing he says about himself is evidence.
// Verdicts are report-only and come from Nair (§9.1); no #verdict tag here (DL12).
// ================================================

VAR b_heard_alarm = false
VAR se_intel_b_lindqvist_grievance = false
VAR complaint_given = false
VAR code_given = false
VAR erik_met = false
VAR hub_quiet = false

=== start ===
{ erik_met:
    -> hub
- else:
    ~ erik_met = true
    ~ hub_quiet = true
    Erik Lindqvist: If you're from Priya, I've already told her. I was here for the chillers, nothing else.
    -> hub
}

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Erik Lindqvist: {&Something else?|Make it quick, the chillers don't watch themselves.|Yes?}
}
+ {b_heard_alarm and not code_given} [Tomás heard the server room alarm last night. What happened?] -> alarm
+ {not complaint_given} [I hear overtime's been a sore point.] -> pay
+ [What keeps a facilities engineer here at night?] -> nights
+ {code_given} [Remind me of that server room code?] -> code_again
+ [Thanks, Erik. I'll let you get back to it.]
    Erik Lindqvist: Shut the door, it's letting the warm in.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== alarm ===
~ code_given = true
Erik Lindqvist: Door contact. Someone held it open past the timer and the panel screamed.
Erik Lindqvist: I reset it from the corridor at half two. I didn't go in, didn't need to.
Erik Lindqvist: Go and look for yourself. The code is 4417.
Erik Lindqvist: The door log's on the terminal inside. It'll tell you who badged in better than I can.
-> hub

=== code_again ===
Erik Lindqvist: 4417. Write it down this time.
-> hub

=== pay ===
~ complaint_given = true
Erik Lindqvist: Sore? A month of nights on the chiller works, at my day rate. The agreement says time and a half after eight.
Erik Lindqvist: Here. My copy of what I sent HR. Read it, then tell me I'm wrong. #give_item:notes:b_overtime_complaint
-> hub

=== nights ===
Erik Lindqvist: The old chillers are coming out. Management wants someone on site while the new ones bed in.
Erik Lindqvist: So I'm here all night, every night, checking temperatures nobody else reads.
-> hub

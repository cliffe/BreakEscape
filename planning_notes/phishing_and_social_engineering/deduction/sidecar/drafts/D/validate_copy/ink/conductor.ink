// ================================================
// Fixture D (Night train): Ezra Lindgren, the conductor, carriage 4.
// Witness (plan §9.4, §7.2): four clue topics, answer first then cost,
// first question free, 15 a question after, a once-only kind word (+20).
// Q1 0, Q2 -15, Q3 -30 (wary); the kind word takes him back to -10, so Q4
// is answered: DL6's witness budget holds only with the kind word.
// Grants: d_sato_pass (the recovery route for stop 1's fade), d_devries_pass,
// d_volkov_pass, d_volkov_want. No verdict tags: the case is "final".
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_d_sato_pass = false
VAR se_intel_d_devries_pass = false
VAR se_intel_d_volkov_pass = false
VAR se_intel_d_volkov_want = false
VAR ded_d_conductor_wary = false
VAR ded_d_conductor_questions = 0
VAR conductor_met = false
VAR hub_quiet = false
VAR conductor_kind_given = false

=== function se_influence(delta, reason) ===
~ return 0

=== start ===
{ conductor_met:
    -> hub
}
~ conductor_met = true
Ezra Lindgren: Tickets. *squints* You're the one who keeps walking the corridor.
Ezra Lindgren: I clip every ticket on this train and I remember every face. Not that anyone ever asks.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Ezra Lindgren: {&What else?|Quick, I've a train to run.|Go on.}
}
+ {not se_intel_d_volkov_want} [What's Volkov travelling for?] -> ask_volkov_want
+ {not se_intel_d_volkov_pass} [Where was Volkov before he got on?] -> ask_volkov_pass
+ {not se_intel_d_devries_pass} [Where had the man in carriage three been?] -> ask_devries
+ {not se_intel_d_sato_pass} [The woman in 1A. Where did she get on?] -> ask_sato
+ {not conductor_kind_given} [Here, let me hold the ticket box while you check those.] -> kind_word
+ [That's all. Thanks.]
    Ezra Lindgren: Mind the gap between carriages. It's wider than it looks.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_sato ===
{ ded_d_conductor_wary:
    Ezra Lindgren: Sato? Had a ticket. They all had tickets. That's my job done.
    -> hub
}
Ezra Lindgren: Sato got on at the Archive stop. Reading-room stamp on her ticket, ink still wet. #grant_fact:d_sato_pass
-> charge

=== ask_devries ===
{ ded_d_conductor_wary:
    Ezra Lindgren: I don't follow passengers about. Ask him yourself.
    -> hub
}
Ezra Lindgren: De Vries came straight from a lecture. Hall pass still round his neck when I clipped him. #grant_fact:d_devries_pass
-> charge

=== ask_volkov_pass ===
{ ded_d_conductor_wary:
    Ezra Lindgren: Somewhere with weather, by the state of him. That's all you're getting.
    -> hub
}
Ezra Lindgren: Garden mud on his shoes. Said he'd walked the college garden till dark. #grant_fact:d_volkov_pass
-> charge

=== ask_volkov_want ===
{ ded_d_conductor_wary:
    Ezra Lindgren: Business, I expect. Everyone's got business.
    -> hub
}
Ezra Lindgren: Money. He wants a backer for some engine of his. Talked funding at me for forty miles. #grant_fact:d_volkov_want
-> charge

=== charge ===
~ ded_d_conductor_questions += 1
{ ded_d_conductor_questions > 1:
    ~ se_influence(-15, "pressed")
}
-> hub

=== kind_word ===
~ conductor_kind_given = true
~ se_influence(20, "kind_word")
Ezra Lindgren: *surprised* Nobody ever offers. Right. Ask away, and be quick about it.
-> hub

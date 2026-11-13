// ================================================
// Fixture B (draft): Tomás Rivera, night cleaner. The witness. Person NPC in b_kitchen.
// Valencian, early sixties, nineteen years in this building. Runs the coffee
// machine like it is his own café. Kind, dry, notices everything, and does not
// like being made a gossip.
//
// Plan: §7.1 (grant on the line that says the clue), §7.2 (answer first, then the
// cost; first question free, 15 a question after; the kind word once), §9.1
// "Tomás" (four topics; "Anything odd" grants nothing, sets b_heard_alarm and is
// once-only). A witness talks about other people (§3.2).
// Thresholds (scenario social.characters): wary -20 sets ded_b_tomas_wary,
// refuses -40 ends the talk, reports -60 sets ded_b_tomas_reported.
//
// Draft decision (INVENTED.md): while wary, the alarm topic still answers (it
// grants no clue, and it gates the server room code, so wariness must not block
// the critical path, README_ink_best_practices "Consequences must not gate the
// critical path"). It charges nothing when answered wary, like every vague line.
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_b_okoro_grievance = false
VAR se_intel_b_okoro_device = false
VAR se_intel_b_lindqvist_grievance = false
VAR b_heard_alarm = false
VAR ded_b_tomas_wary = false
VAR ded_b_tomas_questions = 0
VAR tomas_thanked = false
VAR tomas_met = false
VAR hub_quiet = false

=== start ===
{ tomas_met:
    -> topics
- else:
    ~ tomas_met = true
    ~ hub_quiet = true
    Tomás Rivera: You're Priya's new pair of eyes. Sit. Coffee's fresh, it's always fresh.
    -> topics
}

=== topics ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { ded_b_tomas_wary:
        Tomás Rivera: {&More questions.|You're not here for the coffee, are you?}
    - else:
        Tomás Rivera: {&What else?|Go on.|I'm listening. I'm also mopping.}
    }
}
+ {not se_intel_b_okoro_grievance} [Who's been unhappy on nights?] -> ask_unhappy
+ {not se_intel_b_okoro_device} [Who brings their own gadgets in?] -> ask_gadgets
* {not b_heard_alarm} [Anything odd last night?] -> ask_odd
+ {not se_intel_b_lindqvist_grievance} [Anyone complaining about pay?] -> ask_pay
* {not tomas_thanked} [Thanks for the coffee, Tomás. It's a long night.] -> kind_word
+ [I'll let you get on.]
    Tomás Rivera: Mind the wet floor on your way out.
    ~ hub_quiet = true
    #exit_conversation
    -> topics

=== ask_unhappy ===
{ ded_b_tomas_wary:
    Tomás Rivera: People are tired. Everyone's unhappy at four in the morning. That's all I'll say.
    -> topics
}
Tomás Rivera: Ngozi. She lost her appeal on the new shift pattern, three weeks back. #grant_fact:b_okoro_grievance
Tomás Rivera: She hasn't said good morning to anyone since. Not even me.
-> charge

=== ask_gadgets ===
{ ded_b_tomas_wary:
    Tomás Rivera: Everyone has a phone. I don't count them.
    -> topics
}
Tomás Rivera: Ngozi's phone lives on charge by the monitors, on the office wifi all night. #grant_fact:b_okoro_device
Tomás Rivera: Samira has a laptop she won't let anyone touch. Whether it goes on the network, ask the network people.
-> charge

=== ask_odd ===
{ ded_b_tomas_wary:
    Tomás Rivera: The alarm, all right? Two o'clock, the server room. Erik came to sort it. Now let me work. #set_global:b_heard_alarm:true
    -> topics
}
Tomás Rivera: The server room alarm. Just after two, loud enough to wake the dead. #set_global:b_heard_alarm:true
Tomás Rivera: Then Erik came down the corridor to sort it. He's Facilities. He'd know the door code.
-> charge

=== ask_pay ===
{ ded_b_tomas_wary:
    Tomás Rivera: Money is nobody's business. Ask them yourself.
    -> topics
}
Tomás Rivera: Erik. A month of nights on the chillers at his day rate. He wrote to HR about it. #grant_fact:b_lindqvist_grievance
Tomás Rivera: He'll show you the letter if you ask. He shows everyone.
-> charge

=== charge ===
// §7.2: the first question is free; each later one costs 15 after its answer.
~ ded_b_tomas_questions += 1
{ ded_b_tomas_questions > 1:
    ~ se_influence(-15, "pressed")
}
-> topics

=== kind_word ===
~ tomas_thanked = true
~ se_influence(20, "kind_word")
Tomás Rivera: Nobody thanks the coffee man. All right. Ask me what you like.
-> topics

=== function se_influence(delta, reason) ===
// Fallback for a preload or a dry run; the engine binds the real one (00 §12 S1).
~ return 0

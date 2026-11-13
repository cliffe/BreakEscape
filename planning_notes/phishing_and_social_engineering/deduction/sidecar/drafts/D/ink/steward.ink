// ================================================
// Fixture D (Night train): Lowri Hughes, the steward, carriage 1.
// Witness (plan §9.4, §7.2): three clue topics, answer first then cost,
// first question free, 15 a question after, a once-only kind word (+20).
// Q1 0, Q2 -15, Q3 -30 (wary). All three are answered before wary bites,
// so DL6's budget check passes without the kind word.
// Grants: d_sato_want, d_chen_want, d_mensah_want.
// She talks about other people only. No verdict tags: the case is "final".
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_d_sato_want = false
VAR se_intel_d_chen_want = false
VAR se_intel_d_mensah_want = false
VAR ded_d_steward_wary = false
VAR ded_d_steward_questions = 0
VAR steward_met = false
VAR hub_quiet = false
VAR steward_kind_given = false

=== function se_influence(delta, reason) ===
~ return 0

=== start ===
{ steward_met:
    -> hub
}
~ steward_met = true
Lowri Hughes: Tea's stewed and the heating's gone. Sit anywhere. Plenty of room tonight.
Lowri Hughes: Five passengers on the whole train. I've done this run nine years and never seen five people this jumpy.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Lowri Hughes: {&Anything else?|Go on, then.|What is it, love?}
}
+ {not se_intel_d_sato_want} [The woman in 1A keeps eyeing the luggage. What's she after?] -> ask_sato
+ {not se_intel_d_chen_want} [Who's sitting in carriage two?] -> ask_chen
+ {not se_intel_d_mensah_want} [And the old man right at the back?] -> ask_mensah
+ {not steward_kind_given} [You've kept that tea going all night. Thank you.] -> kind_word
+ [I'll let you get on.]
    Lowri Hughes: Shout if the lights go again.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_sato ===
{ ded_d_steward_wary:
    Lowri Hughes: People talk on night trains, and then they stop turning up for breakfast. I'll keep my mouth shut, thanks.
    -> hub
}
Lowri Hughes: Sato? Third time she's asked me if the Codex is on board. Says she only wants a look before it's sold. #grant_fact:d_sato_want
-> charge

=== ask_chen ===
{ ded_d_steward_wary:
    Lowri Hughes: She's a passenger. That's all I know, and all I'm saying.
    -> hub
}
Lowri Hughes: Mei Chen. Student, I think. Asked me twice if the Codex was travelling with us. Said she'd come a long way for it. #grant_fact:d_chen_want
-> charge

=== ask_mensah ===
{ ded_d_steward_wary:
    Lowri Hughes: Leave the poor man be. Leave me be, too, while you're at it.
    -> hub
}
Lowri Hughes: Mr Mensah. Wanted a carriage to himself and no visitors. Peace and quiet, he said. I envy him. #grant_fact:d_mensah_want
-> charge

=== charge ===
~ ded_d_steward_questions += 1
{ ded_d_steward_questions > 1:
    ~ se_influence(-15, "pressed")
}
-> hub

=== kind_word ===
~ steward_kind_given = true
~ se_influence(20, "kind_word")
Lowri Hughes: *softens* Someone noticed. Long night, this one. Ask what you like.
-> hub

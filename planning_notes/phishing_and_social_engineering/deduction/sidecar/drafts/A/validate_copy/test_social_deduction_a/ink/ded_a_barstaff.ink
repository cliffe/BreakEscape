// ================================================
// Fixture A draft: Callum Reid, bar staff (person, a_hall). A witness (§7.2).
// Glaswegian, mid twenties, working his way through a PhD on agency shifts.
// He notices who drinks what and who asks what. Dry, quick, not easily rattled.
// Three clue topics: Okafor's want, Venn's want, Delacroix's umbrella.
// The answer comes first, then the cost: Q1 free, Q2 and Q3 cost 15 each after
// their answers, so the third takes him to -30, past wary (-20). The kind word
// works once (+20). A wary answer grants nothing, costs nothing, and leaves the
// topic open. Voiced: fixed strings only, no printed variables.
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_a_okafor_wants_codex = false
VAR se_intel_a_venn_wants_funding = false
VAR se_intel_a_delacroix_umbrella = false
VAR ded_a_barstaff_wary = false
VAR ded_a_barstaff_reported = false
VAR a_lodge_suspicious = false

VAR ded_a_barstaff_questions = 0
VAR met = false
VAR quiet = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Callum Reid: Red, white or the green stuff the Director's been pushing all night? I wouldn't.
    Callum Reid: I'm agency. I pour, I listen, I go home. Ask away while it's quiet.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- ded_a_barstaff_wary:
    Callum Reid: {&You're asking a lot of questions for a guest.|Still here, then.}
- a_lodge_suspicious:
    Callum Reid: The room's gone cold on you, you know. People are watching the bar.
- else:
    Callum Reid: {&What can I get you?|Go on.|Another question, or a drink?}
}
+ {not se_intel_a_okafor_wants_codex} [Who's been most interested in the Codex tonight?]
    -> ask_okafor
+ {not se_intel_a_venn_wants_funding} [The woman in the tweed jacket. Venn. What's she here for?]
    -> ask_venn
+ {not se_intel_a_delacroix_umbrella} [What's Delacroix been holding on to all night?]
    -> ask_delacroix
* [You've been on your feet since six. Have one on me.]
    -> kind_word
+ [I'll leave you to it.]
    Callum Reid: Shout if you're thirsty.
    ~ quiet = true
    #exit_conversation
    -> hub

=== ask_okafor ===
{ ded_a_barstaff_wary:
    Callum Reid: Everyone wants a look at the book. That's what the evening's for, isn't it?
    -> hub
}
Callum Reid: Dr Okafor. Asked me three times when it comes out of its case. I'm the bar. #grant_fact:a_okafor_wants_codex
-> charge

=== ask_venn ===
{ ded_a_barstaff_wary:
    Callum Reid: She's a guest. She drinks the white. That's all I know.
    -> hub
}
Callum Reid: Money. She's been round every suit in the room with a leaflet about her library fund. #grant_fact:a_venn_wants_funding
-> charge

=== ask_delacroix ===
{ ded_a_barstaff_wary:
    Callum Reid: Couldn't say. I'm watching glasses, not guests.
    -> hub
}
Callum Reid: An umbrella. Black, long, silver handle. Wouldn't let me put it behind the bar. It's not even raining. #grant_fact:a_delacroix_umbrella
-> charge

=== charge ===
~ ded_a_barstaff_questions += 1
{ ded_a_barstaff_questions > 1:
    ~ se_influence(-15, "pressed")
}
-> hub

=== kind_word ===
~ se_influence(20, "kind_word")
Callum Reid: Can't drink on shift. But that's the first nice thing anyone's said to me tonight.
-> hub

=== function se_influence(delta, reason) ===
~ return 0

// ================================================
// Fixture A draft: Sunil Mehta, Institute intern (person, a_hall). A witness (§7.2).
// Nineteen, first week, eager, says far more than he should and then panics
// about it. Frightened of the Director, thrilled by the Codex.
// Three clue topics: Marsh's, Ishikawa's and Delacroix's wants.
// Same costs as the bar staff: Q1 free, then 15 after each answer; the kind word
// works once. Voiced: fixed strings only.
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_a_marsh_wants_promotion = false
VAR se_intel_a_ishikawa_wants_codex = false
VAR se_intel_a_delacroix_wants_codex = false
VAR ded_a_intern_wary = false
VAR ded_a_intern_reported = false
VAR a_lodge_suspicious = false

VAR ded_a_intern_questions = 0
VAR met = false
VAR quiet = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Sunil Mehta: Hi! Welcome! Programmes are on the table, the Codex is at nine, toilets are past the cloakroom.
    Sunil Mehta: Sorry. I've said that sixty times. I'm Sunil. Can I help?
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- ded_a_intern_wary:
    Sunil Mehta: {&I'm really not supposed to talk about the guests.|The Director's looking over here.}
- a_lodge_suspicious:
    Sunil Mehta: People keep asking me who you are. I said I didn't know. I don't, do I?
- else:
    Sunil Mehta: {&Anything else?|Yes? Sorry. Yes?|Go on, I've got a minute.}
}
+ {not se_intel_a_marsh_wants_promotion} [Imogen Marsh seems very sure of herself. What's her story?]
    -> ask_marsh
+ {not se_intel_a_ishikawa_wants_codex} [What's Ishikawa been asking you about?]
    -> ask_ishikawa
+ {not se_intel_a_delacroix_wants_codex} [Delacroix looks like she's shopping. Is she?]
    -> ask_delacroix
* [You're doing fine, Sunil. Better than the Director, honestly.]
    -> kind_word
+ [Thanks. I'll let you get on.]
    Sunil Mehta: Enjoy the Codex! Nine o'clock!
    ~ quiet = true
    #exit_conversation
    -> hub

=== ask_marsh ===
{ ded_a_intern_wary:
    Sunil Mehta: She's a fellow here. She's nice to me. That's all.
    -> hub
}
Sunil Mehta: She wants a seat on the inner council. She tells everyone. She told me, and I'm the intern. #grant_fact:a_marsh_wants_promotion
-> charge

=== ask_ishikawa ===
{ ded_a_intern_wary:
    Sunil Mehta: Just where the toilets are. Probably.
    -> hub
}
Sunil Mehta: Whether she can hold the Codex before it goes back. She brought her own gloves. Cotton ones. #grant_fact:a_ishikawa_wants_codex
-> charge

=== ask_delacroix ===
{ ded_a_intern_wary:
    Sunil Mehta: I don't know what she does. Something with antiques.
    -> hub
}
Sunil Mehta: She offered the Director cash for the Codex. In the lobby. He laughed, but he wrote her number down. #grant_fact:a_delacroix_wants_codex
-> charge

=== charge ===
~ ded_a_intern_questions += 1
{ ded_a_intern_questions > 1:
    ~ se_influence(-15, "pressed")
}
-> hub

=== kind_word ===
~ se_influence(20, "kind_word")
Sunil Mehta: Really? Oh, thank God. Don't tell him I laughed.
-> hub

=== function se_influence(delta, reason) ===
~ return 0

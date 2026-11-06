// ================================================
// Fixture A draft: Colette Delacroix (person, a_hall). Suspect; truth: clear
// (Courier fails on the pass: wants the Codex, no charm, but was in the
// lecture hall). Antiquarian dealer from Lyon, sixties, grand, bored by
// anything she cannot buy. Her own word clears nothing.
// ================================================

VAR deduction_verdict_ded_a_delacroix = ""
VAR deduction_outcome_ded_a_delacroix = ""
VAR a_lodge_suspicious = false

VAR met = false
VAR quiet = false
VAR asked_price = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Colette Delacroix: Colette Delacroix. I buy things people say are not for sale.
    Colette Delacroix: You are not buying anything. I can tell from the shoes.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- deduction_outcome_ded_a_delacroix == "wrong_guilty":
    Colette Delacroix: You again. My lawyer will enjoy you.
- a_lodge_suspicious:
    Colette Delacroix: You have made a scene. Amateurs always do.
- else:
    Colette Delacroix: {&Well?|You want something.|Quickly, please.}
}
+ {not asked_price} [What's a book like that worth?]
    -> price
+ {deduction_verdict_ded_a_delacroix == ""} [Accuse Delacroix of serving the lodge. There's no taking this back.]
    -> accuse
+ [Don't let me keep you.]
    Colette Delacroix: I won't.
    ~ quiet = true
    #exit_conversation
    -> hub

=== price ===
~ asked_price = true
Colette Delacroix: To a museum, a wing. To the wrong person, a great deal more. That is why I want it in a safe in Lyon.
-> hub

=== accuse ===
Narrator: You tell Delacroix you know what she's really here for. #verdict:accuse
-> accused

=== accused ===
{ deduction_outcome_ded_a_delacroix == "wrong_guilty":
    Colette Delacroix: A cultist? I am a dealer. The difference is that I give receipts.
- else:
    Colette Delacroix: How dramatic.
}
~ quiet = true
-> hub

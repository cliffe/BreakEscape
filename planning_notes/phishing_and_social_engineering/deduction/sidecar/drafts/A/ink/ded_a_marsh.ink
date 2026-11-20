// ================================================
// Fixture A draft: Imogen Marsh (person, a_hall). Suspect; truth: guilty
// (Devotee, 3 marked). Junior fellow, early thirties, warm, funny, and always
// two moves ahead. Her favour (§7.3): once the player holds her "wants a
// promotion" fact (from the intern), she asks for her phone from the locked
// cloakroom. Handing it over (gated on has_marsh_phone, set by the item's
// onPickup) runs #deduction_favour: all her clues, and, because she is guilty,
// the backfire (the lookout appears in the cloakroom). The ink stays neutral:
// the cost and its debrief line come from the data.
// ================================================

VAR se_intel_a_marsh_wants_promotion = false
VAR deduction_favour_ded_a_marsh = false
VAR has_marsh_phone = false
VAR deduction_verdict_ded_a_marsh = ""
VAR deduction_outcome_ded_a_marsh = ""
VAR a_lodge_suspicious = false

VAR met = false
VAR quiet = false
VAR marsh_asked = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Imogen Marsh: Oh, thank God, a new face. Imogen. I'm a fellow here, which means I hand out the canapés.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- deduction_favour_ded_a_marsh:
    Imogen Marsh: My hero. Ask me anything, I owe you.
- marsh_asked:
    Imogen Marsh: Any luck with my phone? No pressure. Some pressure.
- a_lodge_suspicious:
    Imogen Marsh: You've made yourself popular. Not in a good way.
- else:
    Imogen Marsh: {&Hello again.|Still circling?|What do you need?}
}
+ {se_intel_a_marsh_wants_promotion and not deduction_favour_ded_a_marsh and not marsh_asked} [I hear you're after a seat on the inner council.]
    ~ marsh_asked = true
    Imogen Marsh: Sunil's been talking. Yes, and tonight matters. Which is why I could kill whoever locked the cloakroom.
    Imogen Marsh: My phone is on a hook in the cloakroom and the attendant has gone home. Could you fetch it?
    -> hub
+ {marsh_asked and not deduction_favour_ded_a_marsh and has_marsh_phone} [Here. Your phone.]
    -> hand_over
+ [What does a fellow actually do here?]
    Imogen Marsh: Smile, fetch, remember everybody's name. The Director calls it apprenticeship.
    -> hub
+ {deduction_verdict_ded_a_marsh == ""} [Accuse Marsh of serving the lodge. There's no taking this back.]
    -> accuse
+ [I'll catch you later.]
    Imogen Marsh: You will. Everyone does.
    ~ quiet = true
    #exit_conversation
    -> hub

=== hand_over ===
Narrator: You hand Marsh her phone. #deduction_favour
-> favour_done

=== favour_done ===
Imogen Marsh: You absolute star. Give me one second.
Narrator: She types a few words without looking at the screen, and puts it away.
-> hub

=== accuse ===
Narrator: You tell Marsh you know what she is. #verdict:accuse
-> accused

=== accused ===
{ deduction_outcome_ded_a_marsh == "right_guilty":
    Imogen Marsh: Clever. Shame. You'd have liked us.
- else:
    Imogen Marsh: Me? I hand out canapés.
}
~ quiet = true
-> hub

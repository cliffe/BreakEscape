// ================================================
// Fixture A draft: Dr Ifeoma Okafor (person, a_hall). Suspect; truth: guilty
// (Keyholder). Epigrapher from Lagos, fifties, precise and amused, reads old
// inscriptions the way other people read faces. Holds the brass Tesseract key
// in itemsHeld (a KO drops it). Her own words clear nothing and grant nothing
// (§7.1): she talks about the carvings, never about where she was.
// Accusation per §7.4: offered once, says it cannot be undone, the reaction
// reads the outcome on the next knot (reveal is "now").
// ================================================

VAR deduction_verdict_ded_a_okafor = ""
VAR deduction_outcome_ded_a_okafor = ""
VAR a_lodge_suspicious = false

VAR met = false
VAR quiet = false
VAR asked_carvings = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Ifeoma Okafor: You're looking at the frieze. Most people look at the wine.
    Ifeoma Okafor: The carver got the third line wrong. Or someone told him to.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- deduction_outcome_ded_a_okafor == "right_guilty":
    Ifeoma Okafor: You've said your piece. I'm waiting for the bell, like everyone else.
- a_lodge_suspicious:
    Ifeoma Okafor: You've upset people. Careful. Old rooms remember.
- else:
    Ifeoma Okafor: {&Still here?|Yes?|Ask, then.}
}
+ {not asked_carvings} [What's wrong with the third line?]
    -> carvings
+ [Are you here for the Codex, like everyone else?]
    Ifeoma Okafor: I'm here for the company. The Codex is just very good company.
    -> hub
+ {deduction_verdict_ded_a_okafor == ""} [Accuse Okafor of serving the lodge. There's no taking this back.]
    -> accuse
+ [Enjoy the evening, Doctor.]
    Ifeoma Okafor: I intend to.
    ~ quiet = true
    #exit_conversation
    -> hub

=== carvings ===
~ asked_carvings = true
Ifeoma Okafor: It reads "the door opens inward". In the old form it reads "the door opens us".
Ifeoma Okafor: Small difference. Don't lose sleep over it.
-> hub

=== accuse ===
Narrator: You step close and tell her what you've seen. #verdict:accuse
-> accused

=== accused ===
{ deduction_outcome_ded_a_okafor == "right_guilty":
    Ifeoma Okafor: So someone was watching the right room for once. It won't matter. The door's already open.
- else:
    Ifeoma Okafor: You've made a mistake, and a loud one.
}
~ quiet = true
-> hub

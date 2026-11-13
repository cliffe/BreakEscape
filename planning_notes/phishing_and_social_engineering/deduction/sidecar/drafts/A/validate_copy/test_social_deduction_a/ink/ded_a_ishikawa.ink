// ================================================
// Fixture A draft: Haruka Ishikawa (person, a_hall). Suspect; truth: clear
// (Courier fails on the ward charm). Book conservator, forties, quiet, exact,
// more interested in the binding than the words. Her own word clears nothing.
// ================================================

VAR deduction_verdict_ded_a_ishikawa = ""
VAR deduction_outcome_ded_a_ishikawa = ""
VAR a_lodge_suspicious = false

VAR met = false
VAR quiet = false
VAR asked_binding = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Haruka Ishikawa: Haruka Ishikawa. I mend books. That one has been mended badly, twice.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- deduction_outcome_ded_a_ishikawa == "wrong_guilty":
    Haruka Ishikawa: I have nothing to say to you.
- a_lodge_suspicious:
    Haruka Ishikawa: Everyone is watching you now. I would stop asking questions.
- else:
    Haruka Ishikawa: {&Yes?|Mm?|Go on.}
}
+ {not asked_binding} [Mended badly how?]
    -> binding
+ {deduction_verdict_ded_a_ishikawa == ""} [Accuse Ishikawa of serving the lodge. There's no taking this back.]
    -> accuse
+ [I won't keep you.]
    Haruka Ishikawa: Thank you.
    ~ quiet = true
    #exit_conversation
    -> hub

=== binding ===
~ asked_binding = true
Haruka Ishikawa: Someone resewed the last gathering with modern thread. Recently. Somebody wanted a page out, then wanted it back.
-> hub

=== accuse ===
Narrator: You tell Ishikawa you know who she answers to. #verdict:accuse
-> accused

=== accused ===
{ deduction_outcome_ded_a_ishikawa == "wrong_guilty":
    Haruka Ishikawa: No. I came for the book. I am leaving with nothing, thanks to you.
- else:
    Haruka Ishikawa: Then you know more than I do.
}
~ quiet = true
-> hub

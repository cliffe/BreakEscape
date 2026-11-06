// ================================================
// Fixture A draft: Margaret Venn (person, a_hall). Suspect; truth: clear.
// Retired librarian, seventies, brisk, funny, frightened of the Codex and too
// proud to say so. Carries a ward charm in her coat lining.
// Once the player holds her ward-charm fact (from her coat in the cloakroom),
// she gives the archive code, but only while she is still an ally
// (!ded_a_ally_lost): §5.6 "an ally's help". A wrong accusation runs lose_ally
// (she leaves and the code is gone; the cloakroom note still has it).
// Her own word clears nothing.
// ================================================

VAR deduction_verdict_ded_a_venn = ""
VAR deduction_outcome_ded_a_venn = ""
VAR se_intel_a_venn_ward_charm = false
VAR ded_a_ally_lost = false
VAR a_lodge_suspicious = false

VAR met = false
VAR quiet = false
VAR code_given = false

=== start ===
{ met:
    -> hub
- else:
    ~ met = true
    Margaret Venn: Margaret Venn. Forty years at the county library, and they still won't let me touch it.
    Margaret Venn: The Codex, dear. Do keep up.
    ~ quiet = true
    -> hub
}

=== hub ===
{
- quiet:
    ~ quiet = false
- code_given:
    Margaret Venn: You have the number. Use it before I think better of it.
- a_lodge_suspicious:
    Margaret Venn: People are muttering about you. I'd keep my head down.
- else:
    Margaret Venn: {&Well?|Yes, dear?|Out with it.}
}
+ {se_intel_a_venn_ward_charm and not ded_a_ally_lost and not code_given} [I've been through your coat. I know about the charm.]
    -> charm
+ [Why come, if they won't let you touch it?]
    Margaret Venn: Because one day someone will drop it, and I want to be there to say I told you so.
    -> hub
+ {deduction_verdict_ded_a_venn == ""} [Accuse Venn of serving the lodge. There's no taking this back.]
    -> accuse
+ [I'll let you mingle.]
    Margaret Venn: I never mingle. I circulate.
    ~ quiet = true
    #exit_conversation
    -> hub

=== charm ===
~ code_given = true
Margaret Venn: You've been through my coat? Fine. The archive code is 2291.
Margaret Venn: The charm is because I know what's in that room. Whatever you're doing, do it quickly.
-> hub

=== accuse ===
Narrator: You tell Venn, quietly, that you know who she works for. #verdict:accuse
-> accused

=== accused ===
{ deduction_outcome_ded_a_venn == "wrong_guilty":
    Margaret Venn: Me? I've spent my life keeping books away from people like that.
    Margaret Venn: I'm going home. Find your cultists without me.
- else:
    Margaret Venn: You'd better be very sure of that.
}
#exit_conversation
-> hub

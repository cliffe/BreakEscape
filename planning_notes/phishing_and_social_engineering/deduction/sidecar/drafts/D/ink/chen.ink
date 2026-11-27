// ================================================
// Fixture D (Night train): Mei Chen, carriage 2. Clear (truth only).
// Grants d_chen_notebook: she shows the player the notebook, which a suspect
// may do (§7.1: show what the player can see). Her own word clears nothing:
// the ward charm comes from her coat or the shredded receipt, never from her.
// No verdict tags: the case is "final".
// ================================================

VAR se_intel_d_chen_notebook = false
VAR se_intel_d_chen_want = false
VAR se_intel_d_chen_charm = false
VAR chen_met = false
VAR asked_codex = false
VAR asked_charm = false
VAR hub_quiet = false

=== start ===
{ chen_met:
    -> hub
}
~ chen_met = true
Mei Chen: *not looking up* If you're selling something, I'm skint. If you're a ghost, I'm busy.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Mei Chen: {&Something else?|Mm-hm?|Still reading, but go on.}
}
+ {se_intel_d_chen_charm and not asked_charm} [Why does a scholar need a ward charm?] -> charm
+ {se_intel_d_chen_want and not asked_codex} [The steward says you came a long way for the Codex.] -> codex
+ {not se_intel_d_chen_notebook} [What are you reading?] -> reading
+ [Sorry. I'll leave you to it.]
    Mei Chen: Close the door. There's a draught that sounds like breathing.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== reading ===
Mei Chen: My own notes. Six years of them. *holds it up* Look, the spine's held together with tape.
Narrator: She turns the battered notebook so you can see it. Every page is crammed with tiny handwriting. #grant_fact:d_chen_notebook
-> hub

=== codex ===
~ asked_codex = true
Mei Chen: I wrote my whole thesis about a book I've never seen. They're moving it to the coast tonight. Is that so strange?
-> hub

=== charm ===
~ asked_charm = true
Mei Chen: *laughs* Because the woman in the shop told me the Codex bites. I paid three pounds to stop worrying. It didn't work.
-> hub

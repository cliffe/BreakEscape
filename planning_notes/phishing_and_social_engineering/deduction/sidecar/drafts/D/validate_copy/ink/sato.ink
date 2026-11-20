// ================================================
// Fixture D (Night train): Akiko Sato, carriage 1. Guilty: Courier (truth only;
// nothing here says so). She grants nothing: her pass comes from the rack label
// or the conductor, her want from the steward, her notebook from lost property.
// Her lines react to what the player has found, without clearing or convicting
// her. No verdict tags: the case is "final".
// ================================================

VAR se_intel_d_sato_want = false
VAR se_intel_d_sato_notebook = false
VAR deduction_faded_d_sato_pass = false
VAR sato_met = false
VAR asked_codex = false
VAR asked_notebook = false
VAR asked_label = false
VAR hub_quiet = false

=== start ===
{ sato_met:
    -> hub
}
~ sato_met = true
Akiko Sato: You'll want the window seat. Everyone does, until they see what's out there at this hour.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Akiko Sato: {&Yes?|Still here?|Mm?}
}
+ {se_intel_d_sato_notebook and not asked_notebook} [Someone handed your notebook in. All those shelf marks.] -> notebook
+ {se_intel_d_sato_want and not asked_codex} [You've asked about the Codex three times.] -> codex
+ {deduction_faded_d_sato_pass and not asked_label} [The label on your rack has gone.] -> label_gone
* [Going far?] -> far
+ [I'll leave you to the view.]
    Akiko Sato: There isn't one. That's rather the point.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== far ===
Akiko Sato: To the coast. Thirty years I catalogued other people's treasures. Tonight I'd like to see one off the shelf.
-> hub

=== codex ===
~ asked_codex = true
Akiko Sato: Because it should never have left the Archive. Books like that don't like to travel. They make the people around them restless.
-> hub

=== notebook ===
~ asked_notebook = true
Akiko Sato: *a thin smile* Old habits. I write down where things are kept. It saves time when you need them.
-> hub

=== label_gone ===
~ asked_label = true
Akiko Sato: Has it? People take all sorts on night trains. I'd keep an eye on your own bags.
-> hub

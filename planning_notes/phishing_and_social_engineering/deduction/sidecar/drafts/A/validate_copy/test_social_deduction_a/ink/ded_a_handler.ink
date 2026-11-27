// ================================================
// Fixture A draft: Agent HaX (phone, player_phone). The handler.
// Phone ink: the contact's own lines carry no prefix (README_ink_best_practices
// bug 4); the resting knot (hub) holds choices only.
// Knots:
//   start       the opening call (once): the case, and the favour rule (§7.3).
//   key_seen    the unique-item choice (§7.8), opened by the eventMapping on
//               se_intel_a_okafor_brass_key while Okafor has no verdict.
//   close_warn  the warned close (§7.5): "Go in" carries #verdict_close and
//               #unlock_door:a_sanctum; the sibling starts "Not yet".
//   thrown_out  the forced warned close at three wrong calls (a_thrown_out):
//               "Get out" carries #verdict_close; "Not yet" returns.
// Voiced: fixed strings only. HaX never says how many guests are guilty.
// ================================================

VAR a_briefed = false
VAR a_key_choice = ""
VAR a_thrown_out = false
VAR a_left_early = false
VAR a_lodge_suspicious = false
VAR ded_a_ally_lost = false
VAR a_badge_log_done = false
VAR has_marsh_phone = false
VAR deduction_closed = false
VAR se_intel_a_okafor_brass_key = false
VAR se_intel_a_venn_ward_charm = false
VAR deduction_verdict_ded_a_okafor = ""
VAR deduction_verdict_ded_a_venn = ""
VAR deduction_verdict_ded_a_marsh = ""
VAR deduction_verdict_ded_a_ishikawa = ""
VAR deduction_verdict_ded_a_delacroix = ""
VAR deduction_outcome_ded_a_okafor = ""

=== start ===
{ a_briefed:
    -> hub
}
~ a_briefed = true
You're in. Good cover, nobody's looked at you twice.
Five guests came to see the Codex tonight, and the lodge has people among them. Your case file says what to look for.
One rule. Don't do favours for anyone you haven't checked.
When you've dealt with them, call me. The sanctum door opens on my word, and not before.
-> hub

=== hub ===
+ {a_thrown_out and not deduction_closed} [They're onto me. Get me out.]
    -> thrown_out
+ {not deduction_closed} [I'm ready to go into the sanctum.]
    -> close_warn
+ {deduction_closed} [What now?]
    {
    - a_left_early:
        Keep walking. Car's at the gate.
    - else:
        The sanctum's open. End it at the altar.
    }
    -> hub
+ {not deduction_closed and not a_badge_log_done} [How do I get into the Archive?]
    -> archive_hint
+ {not deduction_closed} [Where do I stand?]
    -> status
+ [That's all for now.]
    Stay sharp.
    #exit_conversation
    -> hub

=== archive_hint ===
{
- se_intel_a_venn_ward_charm and not ded_a_ally_lost:
    Venn's frightened of that room, and she's been in it. Ask her.
- else:
    The cloakroom staff will have the code written down somewhere. Their door's locked, but you've got picks.
}
-> hub

=== status ===
{ a_lodge_suspicious:
    The lodge knows someone's hunting. Every wrong name makes them tighter.
}
{ ded_a_ally_lost:
    Venn's gone home. You won't get anything more from her.
}
{
- deduction_verdict_ded_a_okafor != "" and deduction_verdict_ded_a_venn != "" and deduction_verdict_ded_a_marsh != "" and deduction_verdict_ded_a_ishikawa != "" and deduction_verdict_ded_a_delacroix != "":
    You've dealt with every guest. Say when you're ready for the sanctum.
- else:
    Some guests are still unaccounted for. Anyone you don't name walks out of here free.
}
-> hub

=== key_seen ===
{ deduction_verdict_ded_a_okafor != "":
    -> hub
}
Only one of those keys exists, and Okafor has it. What do you want to do?
+ [Confront her now. This can't be taken back.]
    ~ a_key_choice = "confront"
    Narrator: You cross the hall and tell Okafor what the camera saw. #verdict:accuse:ded_a_okafor
    -> key_after
+ [Leave her be. I'll watch where she goes.]
    ~ a_key_choice = "follow"
    Fine. Watching her doesn't stop her tonight. She still needs naming.
    -> hub
+ [Have it taken off her at the door tonight. This can't be taken back.]
    ~ a_key_choice = "seize"
    I'll have a team take it off her at the door. #verdict:act:ded_a_okafor
    -> key_after

=== key_after ===
{ deduction_outcome_ded_a_okafor == "right_guilty":
    That's one key the ritual won't have.
- else:
    Hm. That didn't land the way I hoped.
}
-> hub

=== close_warn ===
Once you go in, you can't come back out to question anyone. Anyone you haven't named stays free.
{ not a_badge_log_done:
    You haven't been through the badge log yet, either.
}
+ [Go in.]
    Door's open. Whatever's waiting in there, hit it first. #verdict_close #unlock_door:a_sanctum
    #exit_conversation
    -> hub
+ [Not yet, I want to check something.]
    Take your time. The ritual won't.
    -> hub

=== thrown_out ===
You've burned the evening. Get out now?
+ [Get out.]
    ~ a_left_early = true
    Walk, don't run. I've got a car at the gate. #verdict_close
    #exit_conversation
    -> hub
+ [Not yet.]
    Your funeral. Call me when you're done.
    -> hub

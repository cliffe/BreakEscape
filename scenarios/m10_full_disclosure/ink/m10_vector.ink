INCLUDE m10_carryover_vars.ink
VAR end_quiet = false   // end_rest: skip the line once after an exit
// ================================================
// Mission 10: Full Disclosure - Agent 0x23 'Vector' (vector_post, vector_so)
// Group B, stage 7b. Contract §1.4. Shown only on vector_on_team. m08's
// voice: anxious, analytic, apologetic about being suspicious.
// vector_so gives the records cupboard's code (#give_item, its own line above
// his reply) and says why he knows it: the keypad is the Citadel annex make
// (S6-15). The face-to-face wrong accusation in both copies.
// No DONE or END: exits divert to menu.
// ================================================

VAR vec_quiet = false
VAR vec_code_given = false
VAR vec_why_asked = false

=== function vec_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == "" and officer_out == "" and not wren_at_core and ending == ""

=== start ===
{ending != "": -> end_rest}
{security_office_entered: -> so}
-> post

// ---------------- the table ----------------

=== post ===
{ending != "": -> end_rest}
Agent 0x23 'Vector': I've read the map three times. It hasn't changed. I keep checking anyway.
~ vec_quiet = true
-> menu

// ---------------- the security office ----------------

// The cupboard's code, once, with why he knows it.
=== so ===
{ending != "": -> end_rest}
{
- vec_code_given:
    ~ vec_quiet = true
    -> menu
}
~ vec_code_given = true
Agent 0x23 'Vector': That cupboard. Annex standard. They copied our lock and kept our master code.
#give_item:notes:vector_cupboard_code
Agent 0x23 'Vector': Write this down. I'd only worry otherwise.
~ vec_quiet = true
-> menu

=== menu ===
{ending != "": -> end_rest}
{
- vec_quiet:
    ~ vec_quiet = false
- else:
    Agent 0x23 'Vector': Still here. Still useful, I hope.
}
+ {security_office_entered and vec_code_given and not vec_why_asked} [How do you know their code?]
    ~ vec_why_asked = true
    Agent 0x23 'Vector': I audited the Citadel annex's locks for a year. Nobody ever changed the master. Apparently not here either.
    ~ vec_quiet = true
    -> menu
+ {not security_office_entered and not vec_why_asked} [Why did you come?]
    ~ vec_why_asked = true
    {
    - m08_accused_vector:
        Agent 0x23 'Vector': You said sorry properly. I noticed. Someone has to read the paper, and I'm good at paper.
    - else:
        Agent 0x23 'Vector': Someone has to read the paper. I'm good at paper.
    }
    ~ vec_quiet = true
    -> menu
+ {vec_can_accuse()} [You're WREN.]
    -> accuse_check
+ [Keep reading.]
    Agent 0x23 'Vector': I will. Carefully.
    ~ vec_quiet = true
    #exit_conversation
    -> menu

// The face-to-face wrong accusation: the same writes as the line accusation.
=== accuse_check ===
Agent HaX: Wrong, and Netherton loses Vector till you can clear him. Sure?
+ [I'm sure.]
    ~ officer_out = "vector"
    ~ wrong_accusation = true
    {
    - m08_accused_vector:
        Agent 0x23 'Vector': You've done this to me once. Check it properly, then say sorry properly.
    - else:
        Agent 0x23 'Vector': Check it properly. Then say sorry properly.
    }
    Director Magnus Netherton: Then I am a pair of hands short. Carry on.
    ~ vec_quiet = true
    #exit_conversation
    -> menu
+ [Forget I said it.]
    Agent 0x23 'Vector': I'll try. I won't manage.
    ~ vec_quiet = true
    -> menu

// Stage 9 walkthrough R1b-M1: after his ending, nothing in-raid. One quiet line
// by ending, none from SAFETYNET people on Join (a narrator beat), and the exit.
=== end_rest ===
{
- end_quiet:
    ~ end_quiet = false
- ending == "joined":
    Narrator: Vector doesn't look at you.
- ending == "executed":
    Narrator: Vector says nothing.
- ending == "scorched":
    Agent 0x23 'Vector': Keep walking. I'll catch you up.
- else:
    Agent 0x23 'Vector': It's over. I'm going to sleep for a week.
}
+ [(Leave it.)]
    ~ end_quiet = true
    #exit_conversation
    -> end_rest

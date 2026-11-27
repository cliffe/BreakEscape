// ===========================================
// m07 The Architect's Gambit -- GWEN PRITCHARD
// NPC id: gwen_pritchard   displayName: Gwen Pritchard
// Room: operations_floor. Office-life extra (office_life/PLAN.md 2.8, 6).
// Ambient: the ops floor's systems support lead, finishing up during the evacuation. No clue,
// no task, nothing given. She takes the player for someone the utility sent in and leaves for
// good once the server room is entered.
// Her exchanges with Adaeze live in m07_npc_adaeze_okafor.ink (Adaeze owns them).
// ===========================================

// Synced scenario global: either operator was struck.
VAR ops_staff_upset = false

// Set after the first meeting, so a reload plays the repeat line, not the opener.
VAR met = false
// Skips the line block once after an exit, so the line printed behind the exit tag is not shown.
VAR hub_quiet = false
// Set once she has named who is still in the building.
VAR told_who = false

=== start ===
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {ops_staff_upset:
        Gwen Pritchard: That's enough. We're leaving, okay?
        ~ hub_quiet = true
        #exit_conversation
        -> hub
    - else:
        {met:
            Gwen Pritchard: Oh, you're still here. I'll be off in a minute.
        - else:
            Gwen Pritchard: Hi there. I look after the systems on this floor, if something's acting up.
            Gwen Pritchard: Not that I'd be much use tonight. I'm just tidying up before I go.
            ~ met = true
        }
    }
}
+ {not told_who} [Who's still in the building?]
    ~ told_who = true
    Gwen Pritchard: Elena, in the server hall, at the backup rack. She won't come up. And Ray on the gate.
    Gwen Pritchard: He's been strange since the contractor renewals in the summer.
    ~ hub_quiet = true
    -> hub
+ [Carry on, I'll stay out of your way.]
    Gwen Pritchard: Thanks. Take care.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

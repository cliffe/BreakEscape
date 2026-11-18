// ===========================================
// m07 The Architect's Gambit -- ADAEZE OKAFOR
// NPC id: adaeze_okafor   displayName: Adaeze Okafor
// Room: operations_floor. Office-life extra (office_life/PLAN.md 2.8, 6).
// Ambient: the grid scheduler, finishing her shift during the evacuation. No clue, no task,
// nothing given. She takes the player for someone the utility sent in and leaves for good
// once the server room is entered.
//
// ex_last_two and ex_going_now are played by the needs system when she and Gwen meet at the
// cooler with the player in earshot; they are never reached from her conversation. Her record
// carries their gates. The engine sets heard_<knot> once a line was heard. She owns them
// because her id is the lower of the pair.
// ===========================================

// Synced scenario global: either operator was struck.
VAR ops_staff_upset = false

// Set by the engine once a line of each exchange was heard.
VAR heard_ex_last_two = false
VAR heard_ex_going_now = false

// Set after the first meeting, so a reload plays the repeat line, not the opener.
VAR met = false
// Skips the line block once after an exit, so the line printed behind the exit tag is not shown.
VAR hub_quiet = false
// Set once she has pointed the player at the handover sheet.
VAR told_sheet = false

=== start ===
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {ops_staff_upset:
        Adaeze Okafor: Please keep your distance. We're leaving.
        ~ hub_quiet = true
        #exit_conversation
        -> hub
    - else:
        {met:
            Adaeze Okafor: Still here? I'm nearly done, I promise.
        - else:
            Adaeze Okafor: Evening. I'm the grid scheduler, if you were looking for one.
            Adaeze Okafor: Last of the load figures, then I'm out of here like everybody else.
            ~ met = true
        }
    }
}
+ {not told_sheet} [Anything out here I should look at?]
    ~ told_sheet = true
    Adaeze Okafor: The supervisor wrote his handover on paper when the screens went flaky. It's still on a desk out here.
    ~ hub_quiet = true
    -> hub
+ [Don't let me hold you up.]
    Adaeze Okafor: Thank you. I'll shut this down and go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Before the server room is entered: the muster board.
=== ex_last_two ===
Adaeze Okafor: The muster board still has us missing.
Gwen Pritchard: Somebody ought to cross us off.
Adaeze Okafor: And the coffee machine is still broken.
Gwen Pritchard: Still broken, still nobody's job.
Adaeze Okafor: At least the water is cold.
-> DONE

// After ex_last_two: they agree to go.
=== ex_going_now ===
Gwen Pritchard: Right, I'll log this and pack up.
Adaeze Okafor: Same. Two more minutes and I'm done.
Gwen Pritchard: The marshal won't thank us for staying.
Adaeze Okafor: Then let's not give him the chance.
-> DONE

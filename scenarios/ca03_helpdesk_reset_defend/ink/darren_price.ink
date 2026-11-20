// ================================================
// Awareness E3, defend only: Darren Price (person, Training Room)
// Quayholt's service desk team lead and owner of the verification script, 40s, white, from Bristol (BRAND_SET.md). Steady, a bit dry. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e3_helpdesk_reset_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
// ================================================

VAR episode_e3_helpdesk_reset_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e3_helpdesk_reset_defend_defend_complete:
        { kit_key_caught:
            Darren Price: You turned down that caller pushing for a reset who wouldn't be rung back, so no claims account opened for someone we couldn't place.
            Darren Price: Prompt-bombing just wears people down until they tap yes. Number matching takes the idle tap out of it.
        - else:
            Darren Price: That caller pushing for a reset, the one who wouldn't be rung back, was the one to stop.
            Darren Price: It went through, so a claims account opened to a stranger and the team lost the afternoon to forced resets.
        }
    - else:
        Darren Price: You're in Leila's seat this morning. Three calls are queued on the kiosk, and there's a sign-in prompt from overnight on her phone. Take your time with each one.
    }
}
+ [Thanks, Darren.]
    Darren Price: Shout if you need me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

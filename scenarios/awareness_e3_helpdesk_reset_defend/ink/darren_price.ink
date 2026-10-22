// ================================================
// Awareness E3, defend only: Darren Price (person, Training Room)
// Quayholt's service desk team lead and owner of the verification script, 40s, white, from Bristol (BRAND_SET.md). Steady, a bit dry. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e3_helpdesk_reset_defend_defend_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
// ================================================

VAR episode_e3_helpdesk_reset_defend_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e3_helpdesk_reset_defend_defend_done:
        Darren Price: That's the queue cleared, thanks. If a caller won't let you ring them back, that tells you most of what you need.
    - else:
        Darren Price: You're in Leila's seat this morning. Four calls are queued on the kiosk, and her phone's just buzzed. Take your time with each one.
    }
}
+ [Thanks, Darren.]
    Darren Price: Shout if you need me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

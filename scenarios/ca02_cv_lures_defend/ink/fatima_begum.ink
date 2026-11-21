// ================================================
// Awareness E2, defend only: Fatima Begum (person, Training Room)
// Tarrowby's recruitment lead and owner of the recruitment inbox, 30s, British Bangladeshi (BRAND_SET.md). In interviews all morning, so the learner covers her inbox. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e2_cv_lures_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
// ================================================

VAR episode_e2_cv_lures_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e2_cv_lures_defend_defend_complete:
        { kit_key_caught:
            Fatima Begum: You held back that application whose attachment wanted a second click to open it, so nothing ran on the HR machine behind it.
            Fatima Begum: A real CV just opens. The one asking for an extra step to view it is worth a second look.
        - else:
            Fatima Begum: That application with the attachment that wanted a second click was the one to stop.
            Fatima Begum: It ran, so we lost the HR machine for a rebuild and recruitment paused while we re-contacted candidates by hand.
        }
    - else:
        Fatima Begum: Thanks for covering the recruitment inbox while I'm in interviews. Six messages are waiting on the kiosk. Treat them the way you would on a normal day.
    }
}
+ [Thanks, Fatima.]
    Fatima Begum: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

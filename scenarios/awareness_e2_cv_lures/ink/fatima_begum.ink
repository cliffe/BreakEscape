// ================================================
// Awareness E2, full episode: Fatima Begum (person, Training Room)
// Tarrowby's recruitment lead and owner of the recruitment inbox, 30s, British
// Bangladeshi (BRAND_SET.md). She frames the exercise; the kiosk does the rest.
// Her record carries the mappings that complete land_recruiter_contact (on the
// attempts global) and sort_recruitment_inbox (on the defend set's done
// global, 11 S5.1), so the ink only reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_recruiter_contact_attempts = 0
VAR episode_e2_cv_lures_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e2_cv_lures_defend_complete:
        Fatima Begum: Inbox and all, that's the pair of them done.
        Fatima Begum: A real CV opens straight in the viewer, so anything that wants more than that from you has earned a second look.
    - else:
        { phish_recruiter_contact_attempts > 0:
            Fatima Begum: Your application has gone to the recruitment inbox. Now take the other seat at the kiosk and sort the inbox the way it would land on a normal day.
        - else:
            Fatima Begum: Welcome to the Tarrowby exercise. Start at the kiosk: research the vacancy and the recruiter, send one application as the red team, then swap seats and cover the recruitment inbox.
        }
    }
}
+ [Thanks, Fatima.]
    Fatima Begum: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

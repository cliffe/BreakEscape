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
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca02_host_said = false
VAR kit_ca02_out = false
VAR kit_ca02_done = false
VAR kit_ca02_moved = false
VAR kit_ca02_cv_choice = ""
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca02_done || not kit_ca02_out) && not kit_ca02_host_said:
        {
        - kit_key_caught && not kit_ca02_moved && (kit_ca02_cv_choice == "" || kit_ca02_cv_choice == "report"):
            { kit_caught:
                Fatima Begum: You spotted the one that wanted a second click to open, so nothing ran and the inbox is clean.
            - else:
                Fatima Begum: You stopped the one that wanted enabling, so nothing ran. A couple of the others are worth another look, and the debrief goes through them.
            }
            Fatima Begum: A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag.
        - kit_key_caught:
            Fatima Begum: A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag.
        - kit_ca02_cv_choice == "report":
            Fatima Begum: A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag.
        - else:
            Fatima Begum: A CV that wants content switched on is after a foothold. If the file runs, the attacker is on an HR machine full of candidate records.
            Fatima Begum: A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag.
        }
        ~ kit_ca02_host_said = true
    - else:
    { episode_e2_cv_lures_defend_complete:
        Fatima Begum: Inbox and all, that's the pair of them done.
        Fatima Begum: A real CV just opens in the viewer. Anything that wants more than that from you is worth a second look.
    - else:
        { phish_recruiter_contact_attempts > 0:
            Fatima Begum: Your application has gone to the recruitment inbox. Now take the other seat at the kiosk and sort the inbox the way it would land on a normal day.
        - else:
            Fatima Begum: Welcome to the Tarrowby exercise. Start at the kiosk: research the vacancy and the recruiter, send one application as the red team, then swap seats and cover the recruitment inbox.
        }
    }
    }
}
+ [Thanks, Fatima.]
    Fatima Begum: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

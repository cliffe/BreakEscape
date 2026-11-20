// ================================================
// Awareness E12, defend only: Lorna Easton (person, Training Room)
// Merrin & Sallow's reception and facilities lead, 40s, white, north-west England (BRAND_SET.md, E12 additions). The studio kiosk host: she welcomes the learner and receives the reports. Reuses a built sprite (no influence bust needed). Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e12_visitor_tailgater_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e12_visitor_tailgater_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e12_visitor_tailgater_defend_defend_complete:
        { kit_key_caught:
            Lorna Easton: You kept that visitor with no badge at the door, so they never got a quiet walk through the studio.
            Lorna Easton: That's the one that leans on a busy morning and a friendly face, and you didn't wave it through.
        - else:
            Lorna Easton: That visitor with no badge was the one to stop at the door.
            Lorna Easton: They went through, so a stranger had the run of the studio floor and its open screens. On a busy morning it's an easy one to wave through.
        }
    - else:
        Lorna Easton: You're on reception this morning. Visitors arrive one at a time, some expected and some not. Sign people in, escort them, and report anyone who won't be checked.
    }
}
+ [Thanks, Lorna.]
    Lorna Easton: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ================================================
// Awareness E18, defend only: Ama Owusu (person, Training Room)
// Security lead on Merrin & Sallow's outsourced IT and security contract (Fenlow Managed IT), 40s, Black British of Ghanaian heritage (BRAND_SET.md, E18 additions). Welcomes the learner, carries the feedback and debrief, and voices the organisation's controls as the provider's. Reuses a built sprite (placeholder until the PixelLab reset).
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e18_credential_attacks_at_scale_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py.
// ================================================

VAR episode_e18_credential_attacks_at_scale_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e18_credential_attacks_at_scale_defend_defend_complete:
        { kit_key_caught:
            Ama Owusu: You didn't trust that fake lockout alert, so no password went to its look-alike page.
            Ama Owusu: A unique password per account in a manager, with MFA, is the one habit that beats both spraying and stuffing.
        - else:
            Ama Owusu: That lockout alert dressed as our own IT, hurrying you to sign in again, was the one to stop.
            Ama Owusu: Picture that password on the fake page. The account behind it reaches client files and the finance controller's mail.
        }
    - else:
        Ama Owusu: Your own seat now. After an attack the alerts come fast, some real, some fakes. Report the fakes, and never type a password to unlock or check anything.
    }
}
+ [Thanks, Ama.]
    Ama Owusu: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

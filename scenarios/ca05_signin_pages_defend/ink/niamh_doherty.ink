// ================================================
// Awareness E5, defend only: Niamh Doherty (person, Training Room)
// Quayholt's internal communications officer, mid 20s, Northern Irish (BRAND_SET.md, E5 additions). Quick and friendly. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e5_signin_pages_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e3_e5_shells.py.
// ================================================

VAR episode_e5_signin_pages_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e5_signin_pages_defend_defend_complete:
        { kit_key_caught:
            Niamh Doherty: You read the address before signing in, so that lookalike page never got your password.
            Niamh Doherty: The look and the padlock both copy fine. The address bar is the one bit they can't fake.
        - else:
            Niamh Doherty: That page copying our sign-on, on an address that was almost right, was the one to stop.
            Niamh Doherty: Whoever runs that look-alike address would get your email and password, then sign in as you and read your mail.
        }
    - else:
        Niamh Doherty: Hiya. There are five pages open on the kiosk, each one from a link somebody got this morning. Have a look at each before you'd sign in.
    }
}
+ [Thanks, Niamh.]
    Niamh Doherty: No bother.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ================================================
// Awareness E5, full episode: Niamh Doherty (person, Training Room)
// Quayholt's IT trainer, 30s, Irish, friendly and practical. She frames the
// exercise; the kiosk does the rest. Her record carries the mappings that
// complete send_signin_phish (on phish_sso_staff_attempts) and check_signin_pages
// (on the defend set's done global), so the ink only reads those globals for
// its welcome line. Resting point is the hub (m03 hub_quiet pattern).
// ================================================

VAR phish_sso_staff_attempts = 0
VAR episode_e5_signin_pages_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e5_signin_pages_defend_done:
        Niamh Doherty: That's both seats done, thanks. The trick is always the address: read the bar before you type a password. A padlock doesn't make a page ours.
    - else:
        { phish_sso_staff_attempts > 0:
            Niamh Doherty: Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind links like yours.
        - else:
            Niamh Doherty: Welcome to the Quayholt exercise. Start at the kiosk: research us, build a sign-in page and send the link, then swap seats and check the pages yourself.
        }
    }
}
+ [Thanks, Niamh.]
    Niamh Doherty: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

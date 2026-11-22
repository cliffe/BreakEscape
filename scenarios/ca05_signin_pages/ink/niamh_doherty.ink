// ================================================
// Awareness E5, full episode: Niamh Doherty (person, Training Room)
// Quayholt's IT trainer, 30s, Irish, friendly and practical. She frames the
// exercise; the kiosk does the rest. Her record carries the mappings that
// complete send_signin_phish (on phish_sso_staff_attempts) and check_signin_pages
// (on the defend set's done global), so the ink only reads those globals for
// its welcome line. Resting point is the hub (m03 hub_quiet pattern).
// ================================================

VAR phish_sso_staff_attempts = 0
VAR episode_e5_signin_pages_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca05_host_said = false
VAR kit_ca05_out = false
VAR kit_ca05_done = false
VAR kit_ca05_moved = false
VAR kit_ca05_prompt_choice = ""
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca05_done || not kit_ca05_out) && not kit_ca05_host_said:
        {
        - kit_key_caught && not kit_ca05_moved && (kit_ca05_prompt_choice == "" || kit_ca05_prompt_choice == "stop"):
            { kit_caught:
                Niamh Doherty: You read the address and didn't type your password into the copy, so there was nothing for the attacker to catch.
            - else:
                Niamh Doherty: You kept your password off the fake page, so your account held. A couple of the others are worth another look in the debrief.
            }
            Niamh Doherty: Read the address bar before you type a password. A padlock doesn't make a page ours.
        - kit_key_caught:
            Niamh Doherty: Read the address bar before you type a password. A padlock doesn't make a page ours.
        - kit_ca05_prompt_choice == "stop":
            Niamh Doherty: Read the address bar before you type a password. A padlock doesn't make a page ours.
        - else:
            Niamh Doherty: Your password went into the copy, so the attacker had your real account, the claimant data behind it and a seat to phish the rest of us from.
            Niamh Doherty: Read the address bar before you type a password. A padlock doesn't make a page ours.
        }
        ~ kit_ca05_host_said = true
    - else:
    { episode_e5_signin_pages_defend_complete:
        Niamh Doherty: That's both seats done, thanks. Read the address bar before you type a password. A padlock doesn't make a page ours.
    - else:
        { phish_sso_staff_attempts > 0:
            Niamh Doherty: Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind links like yours.
        - else:
            Niamh Doherty: Welcome to the Quayholt exercise. Start at the kiosk: research us, build a sign-in page and send the link, then swap seats and check the pages yourself.
        }
    }
    }
}
+ [Thanks, Niamh.]
    Niamh Doherty: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

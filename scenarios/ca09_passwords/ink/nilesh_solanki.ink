// ================================================
// Awareness E9, full episode: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in Leicester.
// He welcomes the learner to the passwords exercise; the kiosk does the rest.
// His record carries the mappings that complete run_the_guesser (on guess_e9_landed,
// value === true) and lock_the_account (on the defend set's done global). The ink
// reads guess_e9_landed and the done global only for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there quietly,
// and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (male_telecom) until the PixelLab reset.
// ================================================

VAR guess_e9_landed = false
VAR episode_e9_passwords_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca09_host_said = false
VAR kit_ca09_out = false
VAR kit_ca09_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca09_done || not kit_ca09_out) && not kit_ca09_host_said:
        { kit_key_caught:
            { kit_caught:
                Nilesh Solanki: You spotted the reused one and shut it down, so there was nothing on that account for anyone to walk into.
            - else:
                Nilesh Solanki: You moved on the weak password, which is the one habit that quietly blunts most of this.
            }
            Nilesh Solanki: To whoever's buying leaked passwords, a reused one is a free way in that looks like you signing in, and you just made it worthless.
        - else:
            Nilesh Solanki: Reuse a password and a work account opens for free, and with shared logins on notes an audit can't say whose hands were on it.
            Nilesh Solanki: To whoever's buying leaked passwords, your reused one is a free sign-in that reads as you, and a follow-up text sweeps up the code.
        }
        ~ kit_ca09_host_said = true
    - else:
    { episode_e9_passwords_defend_complete:
        Nilesh Solanki: Both sides done. Use a different password for every account and keep them in a manager, with three random words for the few you have to remember.
        Nilesh Solanki: Deny anything you didn't start. Nobody's ever in trouble for reporting.
    - else:
        { guess_e9_landed:
            Nilesh Solanki: Good. One reused password opened his account, no clever cracking at all.
            Nilesh Solanki: Now it's your turn in the seat. Your phone's buzzing, and someone has a password of yours.
        - else:
            Nilesh Solanki: Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over.
            Nilesh Solanki: Start at the kiosk. I'll show you how, on a made-up colleague, then you shut it down on your own account.
            Nilesh Solanki: Nothing you touch here is a real password.
        }
    }
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

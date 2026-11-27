// ================================================
// Awareness E4, full episode: Thandiwe Moyo (person, Training Room)
// Merrin & Sallow's studio manager, 30s, Zimbabwean-British (e4/defend.json _brandAdditions).
// She frames the exercise; the kiosk does the rest. Placeholder sprite until P7-Z3.
// Her record carries the mappings that complete land_exec_pa (on the attempts
// global) and sort_pa_inbox (on the defend set's done global, 11 S5.1), so the ink
// only reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_exec_pa_attempts = 0
VAR episode_e4_exec_whaling_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca04_host_said = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && not kit_ca04_host_said:
        { kit_key_caught:
            { kit_caught:
                Thandiwe Moyo: You checked it before it moved, so the money stayed put and the account that email named got nothing.
            - else:
                Thandiwe Moyo: You held the payment that mattered, so nothing left. A couple of the others are worth a second look in the debrief.
            }
            Thandiwe Moyo: A voice can be copied. Ring her back on a number you already hold before anything leaves the account.
        - else:
            Thandiwe Moyo: That payment went out on a voice that wasn't hers, straight to an account the attacker holds, with a bank-change lined up to keep it coming.
            Thandiwe Moyo: A voice can be copied. Ring her back on a number you already hold before anything leaves the account.
        }
        ~ kit_ca04_host_said = true
    - else:
    { episode_e4_exec_whaling_defend_complete:
        Thandiwe Moyo: Both seats done, thanks.
        Thandiwe Moyo: Money, in a hurry, or kept from finance? Ring her on a number you already hold, even when the voice is hers.
    - else:
        { phish_exec_pa_attempts > 0:
            Thandiwe Moyo: Your email has gone to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day.
        - else:
            Thandiwe Moyo: Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA, then swap seats and cover his inbox.
        }
    }
    }
}
+ [Thanks, Thandiwe.]
    Thandiwe Moyo: Shout if anything else comes in.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

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
VAR episode_e4_exec_whaling_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e4_exec_whaling_defend_done:
        Thandiwe Moyo: Both seats done, thanks. When it is money and it is all a rush, or you are asked to keep it from finance, ring her on a number you already have before you move, even when the voice is hers.
    - else:
        { phish_exec_pa_attempts > 0:
            Thandiwe Moyo: Your email has gone to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day.
        - else:
            Thandiwe Moyo: Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA as the red team, then swap seats and cover his inbox.
        }
    }
}
+ [Thanks, Thandiwe.]
    Thandiwe Moyo: Shout if anything else comes in.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

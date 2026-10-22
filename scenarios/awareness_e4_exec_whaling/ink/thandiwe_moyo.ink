// ================================================
// Awareness E4, full episode: Thandiwe Moyo (person, Training Room)
// Merrin & Sallow's studio manager, 30s, Zimbabwean-British (e4/defend.json _brandAdditions).
// She frames the exercise; the kiosk does the rest. Placeholder sprite until P7-Z3.
// Her record carries the mappings that complete land_exec_pa (on the phish-landed
// global) and sort_pa_inbox (on the defend set's done global, 11 S5.1), so the ink
// only reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_exec_pa_landed = false
VAR episode_e4_exec_whaling_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e4_exec_whaling_defend_done:
        Thandiwe Moyo: That's both sides done, thanks. The trick is the same whichever seat you're in: if someone senior asks you to move money in a hurry, or to keep it from finance, check it on a number you already hold before you act, even when it's their voice.
    - else:
        { phish_exec_pa_landed:
            Thandiwe Moyo: Your email got through to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day.
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

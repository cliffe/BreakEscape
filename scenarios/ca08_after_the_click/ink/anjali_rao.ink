// ================================================
// Awareness E8, full episode: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru.
// She receives the reports, which is why she hosts the after-the-click episode.
// She frames the exercise; the kiosk does the rest.
// Her record carries the mappings that complete send_takeover_phish (on the
// phish-attempt global, value > 0) and sort_the_signs (on the defend set's done
// global). The ink reads the attempt count and the done global only for its
// welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (female_scientist) until the PixelLab reset.
// ================================================

VAR phish_takeover_victim_attempts = 0
VAR episode_e8_after_the_click_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e8_after_the_click_defend_complete:
        Anjali Rao: That's both sides done, the red team's seat and then the colleague's.
        Anjali Rao: Whatever the sign, the move is the same: report it and let the team act. And nobody's ever in trouble for reporting.
    - else:
        { phish_takeover_victim_attempts > 0:
            Anjali Rao: Good. The email's gone, and your colleague signed in, the way most people eventually do. Now take their seat and see what someone else is doing with their account.
        - else:
            Anjali Rao: Welcome to the Quayholt exercise. Everyone clicks something eventually, so today is about the ten minutes after, and how one quick report changes the ending.
            Anjali Rao: Start at the kiosk. Write the email first, then switch sides and play the colleague who clicked, sorting what turns up.
        }
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

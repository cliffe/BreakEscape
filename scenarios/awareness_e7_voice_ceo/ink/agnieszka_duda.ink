// ================================================
// Awareness E7, full episode: Agnieszka Duda (person, Training Room)
// Brightwell's payroll officer, 30s, Polish, part-time (BRAND_SET.md, Brightwell
// cast). Hands over the finance line on her way into the quarter-end meeting.
// Placeholder sprite until P7-Z3. She frames the exercise; the kiosk does the rest.
// Her record carries the mappings that complete land_ceo_voice_target (on the
// phish-landed global) and check_finance_line (on the defend set's done global,
// 11 S5.1), so the ink only reads those globals for its welcome line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR phish_ceo_voice_target_landed = false
VAR episode_e7_voice_ceo_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e7_voice_ceo_defend_done:
        Agnieszka Duda: That's both sides done, thank you. Whoever's voice it is, ringing back on a number we already hold settles it.
    - else:
        { phish_ceo_voice_target_landed:
            Agnieszka Duda: Your script's gone over to accounts payable. Now take the other seat at the kiosk and cover the finance line the way a call like that would land.
        - else:
            Agnieszka Duda: Welcome to the Brightwell finale. Start at the kiosk: research what's public about the chief executive, script one voicemail as the red team, then swap seats and cover the finance line.
        }
    }
}
+ [Thanks, Agnieszka.]
    Agnieszka Duda: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

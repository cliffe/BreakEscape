// ================================================
// Awareness E16, full episode: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru.
// She receives the reports and takes the concern, which is why she hosts the
// insider-risk episode. She frames the exercise; the kiosk does the rest.
// Her record carries the mapping that completes handle_leaver_week when
// episode_e16_insider_risk_defend_complete changes (11 S5.1), so the ink only reads
// that global, for its welcome/done line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// TONE (E16 section 18): no blame, no suspicion of colleagues. "You're not here
// to catch anyone."
// Placeholder sprite (female_scientist) until the PixelLab reset.
//
// Host spoken lines (E16 section 8):
//  - Welcome + the "not being asked to investigate anyone" line: the welcome branch below.
//  - On completion (defend done): the done branch below.
//  - The hand-off from the flip into the defend half ("That's where this week's
//    choices led. Now a short set of messages...") is delivered by the runner as
//    strings.defendIntro (full_only.json), not here: the hub only rests before and
//    after the kiosk, so a mid-episode global would be needed to say it in ink.
// ================================================

VAR episode_e16_insider_risk_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca16_host_said = false
VAR kit_ca16_out = false
VAR kit_ca16_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { kit_defend_done && (kit_ca16_done || not kit_ca16_out) && not kit_ca16_host_said:
        { kit_key_caught:
            { kit_caught:
                Anjali Rao: You kept your sign-in to yourself and sent the handover the proper way, so every action still points at whoever actually did it.
            - else:
                Anjali Rao: You held the line on the one that counted, the sign-in someone wanted to borrow, before your name ended up on their work.
            }
        - else:
            Anjali Rao: Lending a login feels kind, but then an audit shows your name on things you never touched, and there's no untangling it.
        }
        Anjali Rao: A sign-in stays yours alone, and a handover goes through the shared place. For a real lockout, send them to the service desk.
        ~ kit_ca16_host_said = true
    - else:
    { episode_e16_insider_risk_defend_complete:
        Anjali Rao: That's them handled. Your login is you, offers get reported, and a concern that comes to nothing is never a failure.
        Anjali Rao: Nobody's in trouble for being approached, and nobody's a suspect for having a hard week.
    - else:
        Anjali Rao: Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone.
        Anjali Rao: Insider risk is harm from people who already have access. Mostly by accident, sometimes on purpose.
        Anjali Rao: Keep your login yours, tell me what gets offered to you, and if something gives you pause, bring me the facts rather than a theory.
        Anjali Rao: Start at the kiosk. Make this week's calls first, then raise a concern and sort the messages.
    }
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

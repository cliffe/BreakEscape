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
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e16_insider_risk_defend_complete:
        Anjali Rao: That's them handled. Your login is you, offers get reported, and an honest concern that turns out to be nothing is never a failure.
        Anjali Rao: Nobody's in trouble for being approached, and nobody's a suspect for having a hard week.
    - else:
        Anjali Rao: Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone.
        Anjali Rao: Keep your login yours, tell me what gets offered to you, and if something genuinely gives you pause, bring me the facts, not a theory.
        Anjali Rao: Start at the kiosk: make this week's calls first, then raise a concern and sort the messages. You are not being asked to investigate anyone.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

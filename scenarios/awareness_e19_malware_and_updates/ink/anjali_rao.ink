// ================================================
// Awareness E19, full episode: Anjali Rao (person, Training Room)
// Quayholt's information security analyst, 30s, Indian, moved from Bengaluru.
// She receives the reports, which is why she hosts the malware/ransomware/incident
// episode (she is also E8's host and the general_v2 AB check host; same company,
// same role, months apart in the course order).
// She frames the exercise; the kiosk does the rest (brief, mistake, flip, defend,
// debrief). Her record carries the eventMapping that completes the conclusion task
// lock_the_doors on the defend set's done global (section 15a). The ink reads that
// done global only for its welcome/goodbye line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there quietly,
// and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (female_scientist) until the PixelLab reset.
//
// NOTE for the wiring agent: the "hand-off into the defend half" line (E19 spec
// section 8b) is not spoken here, because the hub ink cannot detect "just finished
// the flip, now entering defend" (there is no mid-episode boolean global; the stages
// run inside the kiosk). That line, "That's where the afternoon went. Now take the
// desk as it is: some of it ordinary, some of it trying to open a door. If you
// didn't start it, don't open it, and tell me." should be placed as the full
// shell's defend-stage intro (the full-shell equivalent of the generator's
// defendIntro), not in this ink.
// ================================================

VAR episode_e19_malware_and_updates_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e19_malware_and_updates_defend_done:
        Anjali Rao: That's the desk sorted. A file or an app runs with your access, so if you didn't expect it, report it.
        Anjali Rao: Restart when your machine asks, and if a screen locks, call me straight away.
        Anjali Rao: Nobody here is ever in trouble for reporting, including their own slip.
    - else:
        Anjali Rao: Anjali Rao, information security. I'm the one who gets the call when something looks wrong, so I would rather you called me about nothing than not called about something.
        Anjali Rao: Work the desk the way you would on any Thursday. If anything makes you stop, that is the moment to tell me.
    }
}
+ [Thanks, Anjali.]
    Anjali Rao: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

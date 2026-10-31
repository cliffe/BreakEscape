// ================================================
// Awareness E18, full episode: Ama Owusu (person, Training Room)
// Security lead on Merrin & Sallow's outsourced IT and security provider
// (Fenlow Managed IT). 40s, Black British of Ghanaian heritage; warm, practical.
// From the 03_WORLD_AND_CAST.md no-clash pool (the retired Larkspur mentor,
// now a reusable name). She frames the authorised exercise, carries the feedback
// and debrief, and voices the organisation's controls as the provider's, which
// is why they are organisation-slot debrief lines, not staff duties (role_03).
// Her record carries the mappings that complete run_the_campaign (on
// guess_e18_landed) and handle_the_alerts (on the defend set's done global).
// The ink reads guess_e18_landed and the done global only for its hub line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (female_scientist) until the PixelLab reset.
// ================================================

VAR guess_e18_landed = false
VAR episode_e18_credential_attacks_at_scale_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e18_credential_attacks_at_scale_defend_complete:
        Ama Owusu: That's both sides done. A different password for every account, not a word off the website, kept in a manager, is what breaks the spray.
        Ama Owusu: On our side we lock accounts after a few bad tries, put MFA on everything, block the obvious words and watch the breach lists.
        Ama Owusu: Nobody's ever in trouble for reporting.
    - else:
        { guess_e18_landed:
            Ama Owusu: See how little it took: a staff list, a few words off the website, one password tried across everyone.
            Ama Owusu: A stolen list from another site opened a few more. The accounts that opened were the predictable ones.
            Ama Owusu: Now it's your seat, and the alerts are arriving: some real, some fakes meant to finish the job.
        - else:
            Ama Owusu: Welcome to the Merrin & Sallow exercise. I look after security for the practice.
            Ama Owusu: Attackers rarely pick one person and crack them.
            Ama Owusu: They scoop up everyone's names and a few words off the website, then try one password across the lot, so nothing locks.
            Ama Owusu: I'll show you on a safe copy, then you take your own seat and tell the real alerts from the fakes.
            Ama Owusu: Nothing you touch here is a real password.
        }
    }
}
+ [Thanks, Ama.]
    Ama Owusu: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

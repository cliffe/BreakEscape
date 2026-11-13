// ================================================
// Awareness E20, full episode: Zainab Hussain (person, Training Room)
// Tarrowby Logistics field service engineer, 30s, British Bangladeshi, wears a
// hijab; eight years working from vans, cafés and trains, and once left a tablet
// on a train herself. The on-the-road explainer: she frames the authorised two
// days, then the kiosk does the rest. She voices Tarrowby's controls (the VPN
// Tarrowby Connect, device encryption, remote lock and wipe, the 24/7 service
// desk) as the organisation's controls, not staff duties.
// Her record carries the mapping that completes the two-days aim when the
// mistake stage is done and the defend half when
// episode_e20_remote_and_mobile_working_defend_complete changes; the ink only reads
// that done global, for its welcome/done line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// TONE (E20 brief sections 9, 12, 18): no blame, no villains; working on the
// road is normal and fine. Nobody is ever in trouble for reporting.
// Placeholder sprite (female_blowse) until the PixelLab reset.
//
// Host spoken lines (E20 brief section 8 welcome, section 8b done):
//  - Welcome: the welcome branch below.
//  - On completion (defend done): the done branch below.
//  - The hand-off from the montage into the defend half ("See how little it
//    took? ...") is delivered by the runner as strings.defendIntro (mistake.json),
//    NOT here: the hub only rests before and after the kiosk, so a mid-episode
//    global would be needed to say it in ink (same as E16).
// ================================================

VAR episode_e20_remote_and_mobile_working_defend_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e20_remote_and_mobile_working_defend_complete:
        Zainab Hussain: That's both sides done. On the venue's own network with the VPN, ordinary work is fine.
        Zainab Hussain: A Wi-Fi page wanting your work password is always a fake, and when you're not sure, use your phone's hotspot.
        Zainab Hussain: Keep your devices with you, and if you lose one, ring the service desk straight away, day or night. Nobody's ever in trouble for reporting.
    - else:
        Zainab Hussain: Welcome to the Tarrowby exercise. I'm out of the office more than I'm in it, so this one's close to my heart.
        Zainab Hussain: Working on the road is normal and fine; it's the small things that catch people.
        Zainab Hussain: A screen someone reads, a call someone hears, a bag left for a minute, a password typed into the wrong Wi-Fi page.
        Zainab Hussain: I'll walk you through two days, then you sort the real networks from the fakes. Nothing here is a real password.
    }
}
+ [Thanks, Zainab.]
    Zainab Hussain: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

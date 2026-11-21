// ================================================
// Awareness E7, defend only: Agnieszka Duda (person, Training Room)
// Brightwell's payroll officer, 30s, Polish, part-time (BRAND_SET.md, Brightwell cast). Hands over the finance line on her way into the quarter-end meeting. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e7_voice_ceo_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e6_e7_shells.py.
// ================================================

VAR episode_e7_voice_ceo_defend_defend_complete = false
VAR kit_key_caught = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e7_voice_ceo_defend_defend_complete:
        { kit_key_caught:
            Agnieszka Duda: You held that payment back, so a voice that sounded like the boss didn't move money out the door.
            Agnieszka Duda: The "keep this quiet" is the real tell. It's there to buy time before anyone checks.
        - else:
            Agnieszka Duda: That email in the boss's name, with a voicemail in his voice to back it, was the one to stop.
            Agnieszka Duda: A fake voicemail and a fake email can come from the same sender. Paid, it goes to an account they control, and finance loses the afternoon re-checking.
        }
    - else:
        Agnieszka Duda: Thanks for covering the phones while we're in the quarter-end meeting. Three voicemails and two emails have come in on the kiosk. Take your time with each.
    }
}
+ [Thanks, Agnieszka.]
    Agnieszka Duda: See you after the meeting.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

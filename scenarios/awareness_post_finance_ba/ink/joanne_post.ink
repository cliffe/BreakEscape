// ================================================
// Awareness check, finance, after (BA): Joanne Pell (person, Training Room)
// Brightwell's learning and development coordinator, late forties, white British, from Leicester. Brisk and friendly.
// One welcome line; the kiosk runs the check and shows the comparison. The
// record carries the mapping that completes finish_check when triage_post_complete
// changes (11 S5.1).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR triage_post_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_post_complete:
        Joanne Pell: All saved. Thanks for sticking with it.
    - else:
        Joanne Pell: Hi again. Ten new messages on the kiosk for the last check. If you did the first one, you'll see both results side by side.
    }
}
+ [Thanks.]
    Joanne Pell: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

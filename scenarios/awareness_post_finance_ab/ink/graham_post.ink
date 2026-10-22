// ================================================
// Awareness check, finance, after (AB): Graham Whitfield (person, Training Room)
// Brightwell's finance training lead, early 60s, white, from Halifax. Unhurried and kind.
// One welcome line; the kiosk runs the check and shows the comparison. The
// record carries the mapping that completes finish_check when triage_post_done
// changes (11 S5.1).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR triage_post_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_post_done:
        Graham Whitfield: That's the second check saved. Thanks for doing both.
    - else:
        Graham Whitfield: Welcome back. Ten new messages on the kiosk, same idea as before. If you did the first check, the end screen shows how they compare.
    }
}
+ [Thanks.]
    Graham Whitfield: Right you are.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

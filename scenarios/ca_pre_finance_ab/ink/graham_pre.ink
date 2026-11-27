// ================================================
// Awareness check, finance, before (AB): Graham Whitfield (person, Training Room)
// Brightwell's finance training lead, early 60s, white, from Halifax. Unhurried and kind.
// One welcome line; the kiosk runs the check. His record carries the
// mapping that completes finish_check when triage_pre_complete changes (11 S5.1).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR triage_pre_complete = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_pre_complete:
        Graham Whitfield: That's your first check saved. You'll do another after the training, and see how the two compare.
    - else:
        Graham Whitfield: Morning. Before the training there's a short check on the kiosk: ten messages, the sort our payments inbox gets. Just do what you'd normally do.
    }
}
+ [Thanks.]
    Graham Whitfield: Right you are.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

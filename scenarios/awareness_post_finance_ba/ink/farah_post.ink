// ================================================
// Awareness check, finance, after (BA): Farah Qureshi (person, Training Room)
// Brightwell's learning and development coordinator, early 30s, British Pakistani, from Leicester. Brisk and friendly.
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
        Farah Qureshi: All saved. Thanks for sticking with both checks.
    - else:
        Farah Qureshi: Hi again. Ten new messages on the kiosk for the last check. If you did the first one, you'll see both results side by side.
    }
}
+ [Thanks.]
    Farah Qureshi: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

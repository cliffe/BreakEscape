// ================================================
// Awareness check, finance, before (BA): Joanne Pell (person, Training Room)
// Brightwell's learning and development coordinator, late forties, white British, from Leicester. Brisk and friendly.
// One welcome line; the kiosk runs the check. Her record carries the
// mapping that completes finish_check when triage_pre_done changes (11 S5.1).
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// ================================================

VAR triage_pre_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { triage_pre_done:
        Joanne Pell: Done, and saved. There's a second check after the training, so you can see what changed.
    - else:
        Joanne Pell: Hi, thanks for coming. First, a quick check on the kiosk: ten payments inbox messages. Treat them as you would on a normal day.
    }
}
+ [Thanks.]
    Joanne Pell: No problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

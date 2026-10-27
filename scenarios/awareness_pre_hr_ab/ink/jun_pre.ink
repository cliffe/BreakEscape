// ================================================
// Awareness check, hr, before (AB): Jun Watanabe (person, Training Room)
// Tarrowby's HR assistant, early 20s, Japanese-British, in his first job (BRAND_SET.md). Hosts the HR check for his team. Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_pre_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
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
        Jun Watanabe: Brilliant, that's your first one saved. There's a second after the training, and you'll see how the two line up.
    - else:
        Jun Watanabe: Morning. Before the training there's a quick check on the kiosk, ten emails off the recruitment inbox. Treat them the way you would any morning.
    }
}
+ [Thanks, Jun.]
    Jun Watanabe: No bother.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

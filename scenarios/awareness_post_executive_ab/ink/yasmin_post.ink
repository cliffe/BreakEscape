// ================================================
// Awareness check, executive, after (AB): Yasmin Chaudhry (person, Training Room)
// Merrin & Sallow's finance controller, 40s, British Pakistani (BRAND_SET.md). Hosts the AB check pair; she is the person a PA should ring about money. No longer impersonated in either check form (C2-m16). Placeholder sprite until P7-Z3.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when triage_post_done changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e2_e4_shells.py.
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
        Yasmin Chaudhry: That's the second one in. Thank you for taking both.
    - else:
        Yasmin Chaudhry: Welcome back. Ten new emails and voicemails on the kiosk, same idea. If you took the first check, the end screen compares them.
    }
}
+ [Thanks, Yasmin.]
    Yasmin Chaudhry: You're welcome.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
